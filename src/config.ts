import { BuildingDef, BuildingType, ResourceType, TileType } from "./types";

export const GRID_COLS = 30;
export const GRID_ROWS = 20;
export const TILE_SIZE = 40;

export const TICK_RATE_MS = 1000;
export const SEASON_TICKS = 30;
export const SEASONS_ORDER = ["spring", "summer", "autumn", "winter"] as const;

export const STARTING_RESOURCES: Record<ResourceType, number> = {
  [ResourceType.Wood]: 50,
  [ResourceType.Food]: 80,
  [ResourceType.Stone]: 20,
  [ResourceType.Gold]: 100,
  [ResourceType.Planks]: 0,
  [ResourceType.Bricks]: 0,
};

export const STORAGE_BASE = 200;
export const STORAGE_PER_WAREHOUSE = 200;

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  [BuildingType.House]: {
    type: BuildingType.House,
    name: "House",
    description: "Houses 4 people. Consumes food.",
    cost: { [ResourceType.Wood]: 10, [ResourceType.Planks]: 5 },
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
    description: "Produces food. Needs fertile land.",
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
    color: 0x4a7c3f,
  },
  [BuildingType.LumberMill]: {
    type: BuildingType.LumberMill,
    name: "Lumber Mill",
    description: "Chops wood. Needs forest.",
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
    color: 0x6b4226,
  },
  [BuildingType.Quarry]: {
    type: BuildingType.Quarry,
    name: "Quarry",
    description: "Mines stone. Needs mountain.",
    cost: { [ResourceType.Wood]: 12 },
    production: {
      input: {},
      output: { [ResourceType.Stone]: 2 },
      ticksPerCycle: 3,
      winterMultiplier: 0.5,
    },
    populationCapacity: 0,
    populationNeed: 2,
    size: { w: 1, h: 1 },
    requiredTile: TileType.Mountain,
    color: 0x7a7a7a,
  },
  [BuildingType.Sawmill]: {
    type: BuildingType.Sawmill,
    name: "Sawmill",
    description: "Turns wood into planks.",
    cost: { [ResourceType.Wood]: 20, [ResourceType.Stone]: 10 },
    production: {
      input: { [ResourceType.Wood]: 2 },
      output: { [ResourceType.Planks]: 1 },
      ticksPerCycle: 3,
    },
    populationCapacity: 0,
    populationNeed: 2,
    size: { w: 1, h: 1 },
    requiredTile: null,
    color: 0x9a6b3a,
  },
  [BuildingType.Brickyard]: {
    type: BuildingType.Brickyard,
    name: "Brickyard",
    description: "Turns stone into bricks.",
    cost: { [ResourceType.Wood]: 20, [ResourceType.Stone]: 10 },
    production: {
      input: { [ResourceType.Stone]: 2 },
      output: { [ResourceType.Bricks]: 1 },
      ticksPerCycle: 3,
    },
    populationCapacity: 0,
    populationNeed: 2,
    size: { w: 1, h: 1 },
    requiredTile: null,
    color: 0xaa5533,
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
    description: "Generates gold from planks.",
    cost: { [ResourceType.Wood]: 25, [ResourceType.Stone]: 15, [ResourceType.Planks]: 10 },
    production: {
      input: { [ResourceType.Planks]: 1 },
      output: { [ResourceType.Gold]: 3 },
      ticksPerCycle: 5,
    },
    populationCapacity: 0,
    populationNeed: 1,
    size: { w: 1, h: 1 },
    requiredTile: null,
    color: 0xc9a84c,
  },
  [BuildingType.TradingPost]: {
    type: BuildingType.TradingPost,
    name: "Trading Post",
    description: "Buy/sell resources with gold.",
    cost: { [ResourceType.Wood]: 30, [ResourceType.Stone]: 20, [ResourceType.Planks]: 10 },
    production: null,
    populationCapacity: 0,
    populationNeed: 1,
    size: { w: 1, h: 1 },
    requiredTile: null,
    color: 0x3366aa,
  },
};

export const TRADE_PRICES: Record<ResourceType, { buy: number; sell: number }> = {
  [ResourceType.Wood]: { buy: 5, sell: 2 },
  [ResourceType.Food]: { buy: 4, sell: 1 },
  [ResourceType.Stone]: { buy: 6, sell: 3 },
  [ResourceType.Gold]: { buy: 999, sell: 0 },
  [ResourceType.Planks]: { buy: 10, sell: 5 },
  [ResourceType.Bricks]: { buy: 12, sell: 6 },
};

export const EVENT_CHECK_INTERVAL = 15;
export const EVENT_CHANCE = 0.3;

export const BASE_HAPPINESS = 50;
export const FOOD_PER_PERSON = 0.5;
export const HAPPINESS_PER_FOOD = 10;
export const HAPPINESS_PER_HOUSE = 5;
export const POPULATION_GROWTH_THRESHOLD = 70;
export const POPULATION_GROWTH_RATE = 0.1;
export const STARVATION_DAMAGE = 2;
