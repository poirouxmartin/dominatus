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
} from "../types";
import {
  GRID_COLS,
  GRID_ROWS,
  STARTING_RESOURCES,
  STORAGE_BASE,
  STORAGE_PER_WAREHOUSE,
  BUILDINGS,
  TRADE_PRICES,
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
  gameSpeed: number;
  activeEvents: GameEvent[];
  lastEventTick: number;

  constructor() {
    this.resources = { ...STARTING_RESOURCES };
    this.tiles = [];
    this.buildings = [];
    this.nextBuildingId = 1;
    this.season = Season.Spring;
    this.seasonTick = 0;
    this.totalTicks = 0;
    this.population = { total: 0, happiness: 50, foodConsumption: 0 };
    this.storageCapacity = STORAGE_BASE;
    this.gameOver = false;
    this.gameSpeed = 1;
    this.activeEvents = [];
    this.lastEventTick = 0;

    this.generateMap();
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
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const ny = cy + dy;
        const nx = cx + dx;
        if (ny >= 0 && ny < GRID_ROWS && nx >= 0 && nx < GRID_COLS) {
          this.tiles[ny][nx].type = TileType.Grass;
        }
      }
    }
  }

  canPlaceBuilding(type: BuildingType, gridX: number, gridY: number): boolean {
    const def = BUILDINGS[type];
    if (!def) return false;

    for (let dy = 0; dy < def.size.h; dy++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const tx = gridX + dx;
        const ty = gridY + dy;
        if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) return false;
        const tile = this.tiles[ty][tx];
        if (tile.buildingId !== null) return false;
        if (def.requiredTile && tile.type !== def.requiredTile) return false;
      }
    }

    return this.hasResources(def.cost);
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
      refund[res as ResourceType] = Math.floor((amt as number) * 0.5);
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
  }

  canTrade(resource: ResourceType, amount: number, direction: "buy" | "sell"): boolean {
    if (resource === ResourceType.Gold) return false;
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
        this.activeEvents.splice(i, 1);
      } else {
        event.tickRemaining--;
      }
    }

    return messages;
  }

  getBuildingDef(type: BuildingType) {
    return BUILDINGS[type] ?? null;
  }
}
