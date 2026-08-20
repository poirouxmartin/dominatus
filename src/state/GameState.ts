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
  CITIZEN_HAPPINESS_THRESHOLD,
  RAID_BASE_DAMAGE,
  RAID_WALL_REDUCTION,
  RAID_TOWER_REDUCTION,
  SAVE_KEY,
} from "../config";

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

  constructor(saved?: SaveData) {
    if (saved) {
      this.resources = { ...saved.resources };
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
      this.researchedTechs = [...saved.researchedTechs];
      this.researchTarget = saved.researchTarget;
      this.researchProgress = saved.researchProgress;
      this.eventLog = saved.eventLog ? [...saved.eventLog] : [];
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
      this.generateMap();
    }
  }

  private generateMap(): void {
    for (let y = 0; y < GRID_ROWS; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const r = Math.random();
        let type: TileType;

        if (r < 0.12) {
          type = TileType.Water;
        } else if (r < 0.22) {
          type = TileType.Mountain;
        } else if (r < 0.42) {
          type = TileType.Forest;
        } else if (r < 0.57) {
          type = TileType.Farmable;
        } else {
          type = TileType.Grass;
        }

        this.tiles[y][x] = { x, y, type, buildingId: null };
      }
    }

    const cx = Math.floor(GRID_COLS / 2);
    const cy = Math.floor(GRID_ROWS / 2);

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const ny = cy + dy;
        const nx = cx + dx;
        if (ny >= 0 && ny < GRID_ROWS && nx >= 0 && nx < GRID_COLS) {
          this.tiles[ny][nx].type = TileType.Grass;
        }
      }
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

  addResources(amounts: Partial<Resources>): void {
    for (const [res, amt] of Object.entries(amounts)) {
      if (!amt) continue;
      const key = res as ResourceType;
      this.resources[key] = Math.min(this.resources[key] + amt, this.storageCapacity);
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
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = gridX + dx;
        const ty = gridY + dy;
        if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
          if (this.tiles[ty][tx].type === TileType.Forest) count++;
        }
      }
    }
    return count;
  }

  convertGrassToForest(gridX: number, gridY: number, radius: number): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = gridX + dx;
        const ty = gridY + dy;
        if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
          const tile = this.tiles[ty][tx];
          if (tile.type === TileType.Grass && tile.buildingId === null) {
            if (Math.random() < 0.3) {
              tile.type = TileType.Forest;
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  countTowers(): number {
    return this.buildings.filter((b) => b.type === BuildingType.Tower).length;
  }

  getRaidDefense(): number {
    const bonuses = this.getTechBonuses();
    let defense = bonuses.raidDefense;
    const wallCount = this.buildings.filter((b) => b.type === BuildingType.Wall).length;
    defense += wallCount * RAID_WALL_REDUCTION;
    defense += this.countTowers() * RAID_TOWER_REDUCTION;
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
