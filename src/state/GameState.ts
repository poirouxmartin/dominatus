import {
  Resources,
  ResourceType,
  Tile,
  TileType,
  PlacedBuilding,
  BuildingType,
  Season,
  PopulationStats,
} from "../types";
import {
  GRID_COLS,
  GRID_ROWS,
  STARTING_RESOURCES,
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

  constructor() {
    this.resources = { ...STARTING_RESOURCES };
    this.tiles = [];
    this.buildings = [];
    this.nextBuildingId = 1;
    this.season = Season.Spring;
    this.seasonTick = 0;
    this.totalTicks = 0;
    this.population = { total: 0, happiness: 50, foodConsumption: 0 };
    this.storageCapacity = 200;
    this.gameOver = false;
    this.gameSpeed = 1;

    this.generateMap();
  }

  private generateMap(): void {
    const rng = () => Math.random();

    for (let y = 0; y < GRID_ROWS; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const r = rng();
        let type: TileType;

        if (r < 0.15) {
          type = TileType.Water;
        } else if (r < 0.25) {
          type = TileType.Mountain;
        } else if (r < 0.45) {
          type = TileType.Forest;
        } else if (r < 0.6) {
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
    const def = this.getBuildingDef(type);
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

    const def = this.getBuildingDef(type);
    if (!def) return null;

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

  removeBuilding(buildingId: number): void {
    const idx = this.buildings.findIndex((b) => b.id === buildingId);
    if (idx === -1) return;

    const building = this.buildings[idx];
    const def = this.getBuildingDef(building.type);
    if (!def) return;

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
  }

  hasResources(cost: Partial<Resources>): boolean {
    for (const [res, amt] of Object.entries(cost)) {
      if ((this.resources[res as ResourceType] ?? 0) < (amt ?? 0)) return false;
    }
    return true;
  }

  spendResources(cost: Partial<Resources>): void {
    for (const [res, amt] of Object.entries(cost)) {
      this.resources[res as ResourceType] -= amt as number;
    }
  }

  addResources(amounts: Partial<Resources>): void {
    for (const [res, amt] of Object.entries(amounts)) {
      const key = res as ResourceType;
      this.resources[key] = Math.min(
        this.resources[key] + (amt ?? 0),
        this.storageCapacity
      );
    }
  }

  recalculateStorage(): void {
    let bonus = 200;
    for (const b of this.buildings) {
      if (b.type === BuildingType.Warehouse) bonus += 200;
    }
    this.storageCapacity = bonus;
  }

  recalculatePopulation(): void {
    let capacity = 0;
    let need = 0;
    for (const b of this.buildings) {
      const def = this.getBuildingDef(b.type);
      if (!def) continue;
      capacity += def.populationCapacity;
      need += def.populationNeed;
    }
    this.population.foodConsumption = need;

    if (this.population.total > capacity) {
      this.population.total = capacity;
    }
  }

  getBuildingDef(type: BuildingType) {
    const defs: Record<BuildingType, any> = {
      [BuildingType.House]: {
        type: BuildingType.House,
        name: "House",
        cost: { [ResourceType.Wood]: 10 },
        populationCapacity: 4,
        populationNeed: 1,
        size: { w: 1, h: 1 },
        requiredTile: null,
      },
      [BuildingType.Farm]: {
        type: BuildingType.Farm,
        name: "Farm",
        cost: { [ResourceType.Wood]: 15 },
        production: {
          input: {},
          output: { [ResourceType.Food]: 4 },
          ticksPerCycle: 3,
          winterMultiplier: 0.2,
        },
        populationCapacity: 0,
        populationNeed: 2,
        size: { w: 2, h: 2 },
        requiredTile: TileType.Farmable,
      },
      [BuildingType.LumberMill]: {
        type: BuildingType.LumberMill,
        name: "Lumber Mill",
        cost: { [ResourceType.Wood]: 8 },
        production: {
          input: {},
          output: { [ResourceType.Wood]: 3 },
          ticksPerCycle: 2,
          winterMultiplier: 0.7,
        },
        populationCapacity: 0,
        populationNeed: 2,
        size: { w: 1, h: 1 },
        requiredTile: TileType.Forest,
      },
      [BuildingType.Warehouse]: {
        type: BuildingType.Warehouse,
        name: "Warehouse",
        cost: { [ResourceType.Wood]: 20, [ResourceType.Stone]: 10 },
        production: null,
        populationCapacity: 0,
        populationNeed: 0,
        size: { w: 1, h: 1 },
        requiredTile: null,
      },
      [BuildingType.Market]: {
        type: BuildingType.Market,
        name: "Market",
        cost: { [ResourceType.Wood]: 25, [ResourceType.Stone]: 15 },
        production: {
          input: {},
          output: { [ResourceType.Gold]: 2 },
          ticksPerCycle: 5,
        },
        populationCapacity: 0,
        populationNeed: 1,
        size: { w: 1, h: 1 },
        requiredTile: null,
      },
    };
    return defs[type] ?? null;
  }
}
