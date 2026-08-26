import {
  Resources,
  ResourceType,
  Tile,
  TileType,
  PlacedBuilding,
  BuildingType,
  Season,
  PopulationStats,
  GameEvent,
  EventType,
  SaveData,
} from "../types";
import {
  GRID_COLS,
  GRID_ROWS,
  STARTING_RESOURCES,
  STORAGE_BASE,
  STORAGE_PER_WAREHOUSE,
  BUILDINGS,
  TRADE_PRICES,
  TECH_TREE,
  BASE_HAPPINESS,
  HAPPINESS_PER_FOOD,
  HAPPINESS_PER_HOUSE,
  STARVATION_DAMAGE,
  THIRST_HAPPINESS_PENALTY,
  CITIZEN_HAPPINESS_THRESHOLD,
  RAID_BASE_DAMAGE,
  RAID_WALL_REDUCTION,
  RAID_TOWER_REDUCTION,
  SAVE_KEY,
  SAVE_VERSION,
} from "../config";
import { hexesInRange } from "../map/hex";

export class GameState {
  resources: Resources;
  tiles: Tile[][];
  buildings: PlacedBuilding[];
  nextBuildingId: number;
  season: Season;
  seasonTick: number;
  totalTicks: number;
  population: PopulationStats;
  storageCapacity: number;
  gameOver: boolean;
  victory: boolean;
  gameSpeed: number;
  activeEvents: GameEvent[];
  lastEventTick: number;
  researchedTechs: string[];
  researchTarget: string | null;
  researchProgress: number;
  eventLog: string[];
  tempHappiness: number;

  constructor(saved?: SaveData) {
    if (saved && saved.version === SAVE_VERSION) {
      this.resources = { ...STARTING_RESOURCES, ...saved.resources };
      this.tiles = saved.tiles.map((row) => row.map((t) => ({ ...t })));
      this.buildings = saved.buildings.map((b) => ({ ...b }));
      this.nextBuildingId = saved.nextBuildingId;
      this.season = saved.season;
      this.seasonTick = saved.seasonTick;
      this.totalTicks = saved.totalTicks;
      this.population = { ...saved.population };
      this.storageCapacity = saved.storageCapacity;
      this.gameOver = saved.gameOver;
      this.victory = saved.victory;
      this.gameSpeed = 1;
      this.activeEvents = [];
      this.lastEventTick = saved.totalTicks;
      this.researchedTechs = Array.isArray(saved.researchedTechs) ? [...saved.researchedTechs] : [];
      this.researchTarget = saved.researchTarget;
      this.researchProgress = saved.researchProgress ?? 0;
      this.eventLog = Array.isArray(saved.eventLog) ? [...saved.eventLog] : [];
      this.tempHappiness = 0;
    } else {
      this.resources = { ...STARTING_RESOURCES };
      this.tiles = [];
      this.buildings = [];
      this.nextBuildingId = 1;
      this.season = Season.Spring;
      this.seasonTick = 0;
      this.totalTicks = 0;
      this.population = { total: 0, happiness: 50, foodConsumption: 0, tier: 1 };
      this.storageCapacity = STORAGE_BASE;
      this.gameOver = false;
      this.victory = false;
      this.gameSpeed = 1;
      this.activeEvents = [];
      this.lastEventTick = 0;
      this.researchedTechs = [];
      this.researchTarget = null;
      this.researchProgress = 0;
      this.eventLog = [];
      this.tempHappiness = 0;
      this.generateMap();
    }
  }

  private generateMap(): void {
    for (let y = 0; y < GRID_ROWS; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const r = Math.random();
        let type: TileType;

        if (r < 0.13) {
          type = TileType.Water;
        } else if (r < 0.23) {
          type = TileType.Mountain;
        } else if (r < 0.47) {
          type = TileType.Forest;
        } else if (r < 0.66) {
          type = TileType.Farmable;
        } else {
          type = TileType.Grass;
        }

        this.tiles[y][x] = { x, y, type, buildingId: null };
      }
    }

    for (let pass = 0; pass < 2; pass++) {
      const next: TileType[][] = [];
      for (let y = 0; y < GRID_ROWS; y++) {
        next[y] = [];
        for (let x = 0; x < GRID_COLS; x++) {
          const counts = new Map<TileType, number>();
          counts.set(this.tiles[y][x].type, 4);
          for (const n of hexesInRange(x, y, 1)) {
            if (n.col === x && n.row === y) continue;
            const key = this.tiles[n.row][n.col].type;
            counts.set(key, (counts.get(key) ?? 0) + 3);
          }
          let best = this.tiles[y][x].type;
          let bestCount = -1;
          for (const [t, c] of counts) {
            if (c > bestCount || (c === bestCount && Math.random() < 0.5)) {
              best = t;
              bestCount = c;
            }
          }
          next[y][x] = best;
        }
      }
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          this.tiles[y][x].type = next[y][x];
        }
      }
    }

    this.removeOrphanWater();
    for (let x = 0; x < GRID_COLS; x++) {
      for (const y of [0, GRID_ROWS - 1]) {
        this.tiles[y][x].type = TileType.Water;
      }
    }
    for (let y = 1; y < GRID_ROWS - 1; y++) {
      for (const x of [0, GRID_COLS - 1]) {
        this.tiles[y][x].type = TileType.Water;
      }
    }

    const cx = Math.floor(GRID_COLS / 2);
    const cy = Math.floor(GRID_ROWS / 2);

    for (const h of hexesInRange(cx, cy, 3)) {
      this.tiles[h.row][h.col].type = TileType.Grass;
    }

    const guaranteed: [number, number, TileType][] = [
      [cx - 2, cy - 1, TileType.Forest],
      [cx - 3, cy + 1, TileType.Forest],
      [cx + 2, cy - 2, TileType.Forest],
      [cx + 3, cy + 0, TileType.Forest],
      [cx + 1, cy + 2, TileType.Farmable],
      [cx - 1, cy + 3, TileType.Farmable],
      [cx + 2, cy + 3, TileType.Farmable],
      [cx + 3, cy + 2, TileType.Farmable],
      [cx - 3, cy - 2, TileType.Mountain],
      [cx + 3, cy - 2, TileType.Mountain],
    ];

    for (const [gx, gy, gt] of guaranteed) {
      if (gy >= 0 && gy < GRID_ROWS && gx >= 0 && gx < GRID_COLS) {
        this.tiles[gy][gx].type = gt;
      }
    }

    this.removeOrphanWater();
  }

  private removeOrphanWater(): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (let y = 1; y < GRID_ROWS - 1; y++) {
        for (let x = 1; x < GRID_COLS - 1; x++) {
          if (this.tiles[y][x].type !== TileType.Water) continue;
          if (this.countWaterNeighbors(x, y) <= 1) {
            this.tiles[y][x].type = TileType.Grass;
            changed = true;
          }
        }
      }
    }
  }

  private countWaterNeighbors(x: number, y: number): number {
    let count = 0;
    for (const n of hexesInRange(x, y, 1)) {
      if (n.col === x && n.row === y) continue;
      if (this.tiles[n.row][n.col].type === TileType.Water) count++;
    }
    return count;
  }

  canPlaceBuilding(type: BuildingType, gridX: number, gridY: number): boolean {
    return this.getPlacementReason(type, gridX, gridY) === null;
  }

  getPlacementReason(type: BuildingType, gridX: number, gridY: number): string | null {
    const def = BUILDINGS[type];
    if (!def) return "Unknown building";

    if (def.requiredTech && !this.researchedTechs.includes(def.requiredTech)) {
      return `Requires tech: ${def.requiredTech}`;
    }

    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const tx = gridX + dx;
        const ty = gridY + dy;
        if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) return "Out of bounds";
        const tile = this.tiles[ty][tx];
        if (tile.buildingId !== null) return "Tile occupied";
        if (!def.requiredTile && tile.type === TileType.Water) {
          return "Cannot build on water";
        }
        if (def.requiredTile && tile.type !== def.requiredTile) {
          const tileNames: Record<string, string> = {
            forest: "Forest",
            mountain: "Mountain",
            farmable: "Farmable",
            water: "Water",
            grass: "Grass",
          };
          return `Needs ${tileNames[def.requiredTile] || def.requiredTile} tile`;
        }
      }
    }

    if (!this.hasResources(def.cost)) {
      const missing: string[] = [];
      for (const [res, amt] of Object.entries(def.cost)) {
        if (amt && (this.resources[res as ResourceType] ?? 0) < amt) {
          missing.push(`${res} (${amt})`);
        }
      }
      return `Need: ${missing.join(", ")}`;
    }

    return null;
  }

  placeBuilding(type: BuildingType, gridX: number, gridY: number): PlacedBuilding | null {
    if (!this.canPlaceBuilding(type, gridX, gridY)) return null;

    const def = BUILDINGS[type];
    this.spendResources(def.cost);

    const building: PlacedBuilding = {
      id: this.nextBuildingId++,
      type,
      gridX,
      gridY,
      productionTimer: 0,
      active: true,
    };

    this.buildings.push(building);
    this.log(`${def.name} built`);

    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        this.tiles[gridY + dy][gridX + dx].buildingId = building.id;
      }
    }

    this.recalculateStorage();
    this.recalculatePopulation();
    return building;
  }

  removeBuilding(buildingId: number): boolean {
    const idx = this.buildings.findIndex((b) => b.id === buildingId);
    if (idx === -1) return false;

    const building = this.buildings[idx];
    const def = BUILDINGS[building.type];

    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        this.tiles[building.gridY + dy][building.gridX + dx].buildingId = null;
      }
    }

    const refund: Partial<Resources> = {};
    for (const [res, amt] of Object.entries(def.cost)) {
      if (amt) refund[res as ResourceType] = Math.floor(amt * 0.5);
    }
    this.addResources(refund);

    this.buildings.splice(idx, 1);
    this.recalculateStorage();
    this.recalculatePopulation();
    return true;
  }

  hasResources(cost: Partial<Resources>): boolean {
    for (const [res, amt] of Object.entries(cost)) {
      if (amt && (this.resources[res as ResourceType] ?? 0) < amt) return false;
    }
    return true;
  }

  spendResources(cost: Partial<Resources>): void {
    for (const [res, amt] of Object.entries(cost)) {
      if (amt) this.resources[res as ResourceType] -= amt;
    }
  }

  /** Ajoute une entrée d'histoire dans la Chronique (L). */
  log(msg: string): void {
    this.eventLog.unshift(`t${this.totalTicks}: ${msg}`);
    if (this.eventLog.length > 100) this.eventLog.pop();
  }

  addResources(amounts: Partial<Resources>): void {
    for (const [res, amt] of Object.entries(amounts)) {
      if (!amt) continue;
      const key = res as ResourceType;
      // l'or et la recherche ne sont pas limités par l'entrepôt
      if (key === ResourceType.Gold || key === ResourceType.Research) {
        this.resources[key] += amt;
      } else {
        this.resources[key] = Math.min(this.resources[key] + amt, this.storageCapacity);
      }
    }
  }

  recalculateStorage(): void {
    let cap = STORAGE_BASE;
    for (const b of this.buildings) {
      if (b.type === BuildingType.Warehouse) cap += STORAGE_PER_WAREHOUSE;
    }
    const engTech = TECH_TREE.find((t) => t.id === "engineering");
    if (engTech && this.researchedTechs.includes("engineering")) {
      cap += engTech.bonuses.storageBonus ?? 0;
    }
    this.storageCapacity = cap;
  }

  recalculatePopulation(): void {
    let capacity = 0;
    for (const b of this.buildings) {
      capacity += BUILDINGS[b.type].populationCapacity;
    }
    if (this.population.total > capacity) {
      this.population.total = capacity;
    }
    if (capacity > 0 && this.population.total === 0) {
      this.population.total = Math.min(2, capacity);
    }

    const happiness = this.population.happiness;
    const hasMarket = this.buildings.some((b) => b.type === BuildingType.Market || b.type === BuildingType.Inn || b.type === BuildingType.Tavern);
    if (happiness >= CITIZEN_HAPPINESS_THRESHOLD && hasMarket && this.population.tier === 1 && this.population.total >= 8) {
      this.population.tier = 2;
    }
  }

  canResearch(techId: string): boolean {
    if (this.researchedTechs.includes(techId)) return false;
    if (this.researchTarget === techId) return false;

    const tech = TECH_TREE.find((t) => t.id === techId);
    if (!tech) return false;

    for (const req of tech.requires) {
      if (!this.researchedTechs.includes(req)) return false;
    }

    return true;
  }

  startResearch(techId: string): void {
    if (!this.canResearch(techId)) return;
    this.researchTarget = techId;
    this.researchProgress = 0;
  }

  getTechBonuses(): { foodMultiplier: number; woodMultiplier: number; stoneMultiplier: number; goldMultiplier: number; happinessBonus: number; raidDefense: number } {
    let food = 1, wood = 1, stone = 1, gold = 1, happy = 0, raidDef = 0;
    for (const techId of this.researchedTechs) {
      const tech = TECH_TREE.find((t) => t.id === techId);
      if (!tech) continue;
      if (tech.bonuses.foodMultiplier) food += tech.bonuses.foodMultiplier;
      if (tech.bonuses.woodMultiplier) wood += tech.bonuses.woodMultiplier;
      if (tech.bonuses.stoneMultiplier) stone += tech.bonuses.stoneMultiplier;
      if (tech.bonuses.goldMultiplier) gold += tech.bonuses.goldMultiplier;
      if (tech.bonuses.happinessBonus) happy += tech.bonuses.happinessBonus;
      if (tech.bonuses.raidDefense) raidDef += tech.bonuses.raidDefense;
    }
    return { foodMultiplier: food, woodMultiplier: wood, stoneMultiplier: stone, goldMultiplier: gold, happinessBonus: happy, raidDefense: raidDef };
  }

  hasWalls(): boolean {
    return this.buildings.some((b) => b.type === BuildingType.Wall);
  }

  countForestNear(gridX: number, gridY: number, radius: number): number {
    let count = 0;
    for (const h of hexesInRange(gridX, gridY, radius)) {
      if (this.tiles[h.row][h.col].type === TileType.Forest) count++;
    }
    return count;
  }

  convertGrassToForest(gridX: number, gridY: number, radius: number): boolean {
    const candidates = hexesInRange(gridX, gridY, radius).filter(
      (h) => this.tiles[h.row][h.col].type === TileType.Grass && this.tiles[h.row][h.col].buildingId === null
    );
    for (const h of candidates) {
      if (Math.random() < 0.3) {
        this.tiles[h.row][h.col].type = TileType.Forest;
        return true;
      }
    }
    return false;
  }

  countTowers(): number {
    return this.buildings.filter((b) => b.type === BuildingType.Tower).length;
  }

  /** Formule de bonheur centralisée (utilisée par PopulationSystem et le panneau Province). */
  computeHappiness(
    hasEnoughFood: boolean,
    hasWater: boolean,
    capacity: number,
    extraParts: [string, number][] = []
  ): { total: number; parts: [string, number][] } {
    const parts: [string, number][] = [];
    let happiness = BASE_HAPPINESS;
    parts.push(["Base", BASE_HAPPINESS]);

    const techBonuses = this.getTechBonuses();
    if (techBonuses.happinessBonus !== 0) {
      happiness += techBonuses.happinessBonus;
      parts.push(["Technologies", techBonuses.happinessBonus]);
    }
    if (this.tempHappiness !== 0) {
      happiness += this.tempHappiness;
      parts.push(["Recent events", Math.round(this.tempHappiness * 10) / 10]);
    }

    if (hasEnoughFood) {
      happiness += HAPPINESS_PER_FOOD;
      parts.push(["Well fed", HAPPINESS_PER_FOOD]);
    } else {
      happiness -= STARVATION_DAMAGE * 10;
      parts.push(["Starving", -STARVATION_DAMAGE * 10]);
    }

    if (!hasWater && this.population.total > 0) {
      happiness -= THIRST_HAPPINESS_PENALTY;
      parts.push(["Thirsty", -THIRST_HAPPINESS_PENALTY]);
    }

    const count = (t: BuildingType) => this.buildings.filter((b) => b.type === t).length;
    const houses = count(BuildingType.House);
    const gardens = count(BuildingType.Garden);
    const chapels = count(BuildingType.Chapel);
    const taverns = count(BuildingType.Tavern);
    const inns = count(BuildingType.Inn);
    const walls = count(BuildingType.Wall);
    const towers = count(BuildingType.Tower);

    if (houses > 0) {
      happiness += houses * HAPPINESS_PER_HOUSE;
      parts.push([`Houses \u00d7${houses}`, houses * HAPPINESS_PER_HOUSE]);
    }
    if (gardens > 0) {
      happiness += gardens * 10;
      parts.push([`Gardens \u00d7${gardens}`, gardens * 10]);
    }
    if (chapels > 0) {
      const v = 25 + (chapels - 1) * 10;
      happiness += v;
      parts.push([`Chapels \u00d7${chapels}`, v]);
    }
    if (taverns > 0) {
      const v = 20 + (taverns - 1) * 8;
      happiness += v;
      parts.push([`Taverns \u00d7${taverns}`, v]);
    }
    if (inns > 0) {
      const v = 15 + (inns - 1) * 6;
      happiness += v;
      parts.push([`Inns \u00d7${inns}`, v]);
    }
    if (walls > 0) {
      happiness += walls * 5;
      parts.push([`Walls \u00d7${walls}`, walls * 5]);
    }
    if (towers > 0) {
      happiness += towers * 5;
      parts.push([`Towers \u00d7${towers}`, towers * 5]);
    }

    const hasTradePost = this.buildings.some(
      (b) => b.type === BuildingType.TradingPost || b.type === BuildingType.Inn || b.type === BuildingType.Tavern
    );
    if (hasTradePost) {
      happiness += 5;
      parts.push(["Trade presence", 5]);
    }

    if (this.population.total > 0 && this.population.total >= capacity) {
      happiness -= 10;
      parts.push(["Overcrowded", -10]);
    }

    for (const [lbl, v] of extraParts) {
      happiness += v;
      parts.push([lbl, v]);
    }

    return { total: Math.max(0, Math.min(100, happiness)), parts };
  }

  getRaidDefense(): number {    const bonuses = this.getTechBonuses();
    let defense = bonuses.raidDefense;
    const wallCount = this.buildings.filter((b) => b.type === BuildingType.Wall).length;
    defense += wallCount * RAID_WALL_REDUCTION;
    defense += this.countTowers() * RAID_TOWER_REDUCTION;

    // casernes : +10% chacune tant que les outillages et cuirs couvrent l'entretien
    const barracks = this.buildings.filter((b) => b.type === BuildingType.Barracks).length;
    if (
      barracks > 0 &&
      this.resources[ResourceType.Tools] >= barracks &&
      this.resources[ResourceType.Leather] >= barracks
    ) {
      defense += barracks * 0.1;
    }

    return Math.min(defense, 0.9);
  }

  canTrade(resource: ResourceType, amount: number, direction: "buy" | "sell"): boolean {
    if (resource === ResourceType.Gold || resource === ResourceType.Research) return false;
    const price = TRADE_PRICES[resource];
    if (!price) return false;

    if (direction === "buy") {
      return this.resources[ResourceType.Gold] >= price.buy * amount;
    } else {
      return this.resources[resource] >= amount;
    }
  }

  trade(resource: ResourceType, amount: number, direction: "buy" | "sell"): boolean {
    if (!this.canTrade(resource, amount, direction)) return false;

    const price = TRADE_PRICES[resource];

    if (direction === "buy") {
      this.resources[ResourceType.Gold] -= price.buy * amount;
      this.resources[resource] = Math.min(this.resources[resource] + amount, this.storageCapacity);
    } else {
      this.resources[resource] -= amount;
      this.resources[ResourceType.Gold] = Math.min(
        this.resources[ResourceType.Gold] + price.sell * amount,
        this.storageCapacity
      );
    }

    return true;
  }

  addEvent(event: GameEvent): void {
    this.activeEvents.push(event);
    this.log(event.message);
  }

  processEvents(): string[] {
    const messages: string[] = [];

    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      const event = this.activeEvents[i];
      if (event.tickRemaining <= 0) {
        event.effect(this);
        messages.push(event.message);
        this.eventLog.unshift(`t${this.totalTicks}: ${event.message}`);
        if (this.eventLog.length > 100) this.eventLog.pop();
        this.activeEvents.splice(i, 1);
      } else {
        event.tickRemaining--;
      }
    }

    return messages;
  }

  toSaveData(): SaveData {
    return {
      version: SAVE_VERSION,
      resources: { ...this.resources },
      tiles: this.tiles.map((row) => row.map((t) => ({ ...t }))),
      buildings: this.buildings.map((b) => ({ ...b })),
      nextBuildingId: this.nextBuildingId,
      season: this.season,
      seasonTick: this.seasonTick,
      totalTicks: this.totalTicks,
      population: { ...this.population },
      storageCapacity: this.storageCapacity,
      gameOver: this.gameOver,
      victory: this.victory,
      researchedTechs: [...this.researchedTechs],
      researchTarget: this.researchTarget,
      researchProgress: this.researchProgress,
      eventLog: [...this.eventLog],
    };
  }

  save(): void {
    try {
      const data = this.toSaveData();
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed:", e);
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static loadSave(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch (e) {
      console.warn("Load failed:", e);
      return null;
    }
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
