import { BuildingDef, BuildingType, ResourceType, TileType } from "./types";

export const GRID_COLS = 30;
export const GRID_ROWS = 20;
export const TILE_SIZE = 40;

export const TICK_RATE_MS = 1000;
export const SEASON_TICKS = 30;
export const SEASONS_ORDER = ["spring", "summer", "autumn", "winter"] as const;

export const STARTING_RESOURCES = {
  [ResourceType.Wood]: 50,
  [ResourceType.Food]: 80,
  [ResourceType.Stone]: 20,
  [ResourceType.Gold]: 100,
};

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  [BuildingType.House]: {
    type: BuildingType.House,
    name: "House",
    description: "Houses 4 people. Consumes food.",
    cost: { [ResourceType.Wood]: 10 },
    production: null,
    populationCapacity: 4,
    populationNeed: 1,
    size: { w: 1, h: 1 },
    requiredTile: null,
    color: 0x8b6914,
  },
  [BuildingType.Farm]: {
    type: BuildingType.Farm,
    name: "Farm",
    description: "Produces food from fertile land.",
    cost: { [ResourceType.Wood]: 15 },
    production: {
      input: {},
      output: { [ResourceType.Food]: 4, [ResourceType.Wood]: 0, [ResourceType.Stone]: 0, [ResourceType.Gold]: 0 },
      ticksPerCycle: 3,
      winterMultiplier: 0.2,
    },
    populationCapacity: 0,
    populationNeed: 2,
    size: { w: 2, h: 2 },
    requiredTile: TileType.Farmable,
    color: 0x4a7c3f,
  },
  [BuildingType.LumberMill]: {
    type: BuildingType.LumberMill,
    name: "Lumber Mill",
    description: "Chops wood from nearby forests.",
    cost: { [ResourceType.Wood]: 8 },
    production: {
      input: {},
      output: { [ResourceType.Wood]: 3, [ResourceType.Food]: 0, [ResourceType.Stone]: 0, [ResourceType.Gold]: 0 },
      ticksPerCycle: 2,
      winterMultiplier: 0.7,
    },
    populationCapacity: 0,
    populationNeed: 2,
    size: { w: 1, h: 1 },
    requiredTile: TileType.Forest,
    color: 0x6b4226,
  },
  [BuildingType.Warehouse]: {
    type: BuildingType.Warehouse,
    name: "Warehouse",
    description: "Stores +200 of each resource.",
    cost: { [ResourceType.Wood]: 20, [ResourceType.Stone]: 10 },
    production: null,
    populationCapacity: 0,
    populationNeed: 0,
    size: { w: 1, h: 1 },
    requiredTile: null,
    color: 0x555555,
  },
  [BuildingType.Market]: {
    type: BuildingType.Market,
    name: "Market",
    description: "Generates gold. +5 happiness radius.",
    cost: { [ResourceType.Wood]: 25, [ResourceType.Stone]: 15 },
    production: {
      input: {},
      output: { [ResourceType.Gold]: 2, [ResourceType.Wood]: 0, [ResourceType.Food]: 0, [ResourceType.Stone]: 0 },
      ticksPerCycle: 5,
    },
    populationCapacity: 0,
    populationNeed: 1,
    size: { w: 1, h: 1 },
    requiredTile: null,
    color: 0xc9a84c,
  },
};

export const BASE_HAPPINESS = 50;
export const FOOD_PER_PERSON = 0.5;
export const HAPPINESS_PER_FOOD = 10;
export const HAPPINESS_PER_HOUSE = 5;
export const POPULATION_GROWTH_THRESHOLD = 70;
export const POPULATION_GROWTH_RATE = 0.1;
export const STARVATION_DAMAGE = 2;
