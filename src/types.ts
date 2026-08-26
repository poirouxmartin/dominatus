export enum ResourceType {
  Wood = "wood",
  Food = "food",
  Stone = "stone",
  Gold = "gold",
  Planks = "planks",
  Bricks = "bricks",
  Research = "research",
  Leather = "leather",
  Tools = "tools",
  Water = "water",
}

export enum TileType {
  Grass = "grass",
  Forest = "forest",
  Water = "water",
  Mountain = "mountain",
  Farmable = "farmable",
}

export enum BuildingType {
  House = "house",
  Farm = "farm",
  LumberMill = "lumberMill",
  Quarry = "quarry",
  Sawmill = "sawmill",
  Brickyard = "brickyard",
  Warehouse = "warehouse",
  Market = "market",
  TradingPost = "tradingPost",
  ResearchLab = "researchLab",
  Garden = "garden",
  Inn = "inn",
  Academy = "academy",
  Wall = "wall",
  Tannery = "tannery",
  Forge = "forge",
  Tavern = "tavern",
  Tower = "tower",
  Chapel = "chapel",
  Well = "well",
  Aqueduct = "aqueduct",
  Bathhouse = "bathhouse",
  Amphitheater = "amphitheater",
  Barracks = "barracks",
  Fishery = "fishery",
  Temple = "temple",
  Library = "library",
  CircusMaximus = "circusMaximus",
  Forester = "forester",
  HuntingCabin = "huntingCabin",
}

export enum Season {
  Spring = "spring",
  Summer = "summer",
  Autumn = "autumn",
  Winter = "winter",
}

export enum EventType {
  Storm = "storm",
  Caravan = "caravan",
  Festival = "festival",
  Plague = "plague",
  Raid = "raid",
  Harvest = "harvest",
  Settlers = "settlers",
  Merchant = "merchant",
}

export enum TechBranch {
  Agriculture = "agriculture",
  Industry = "industry",
  Commerce = "commerce",
  Civic = "civic",
  Military = "military",
}

export interface TechDef {
  id: string;
  name: string;
  description: string;
  branch: TechBranch;
  cost: number;
  requires: string[];
  unlocks: BuildingType[];
  bonuses: Partial<{
    foodMultiplier: number;
    woodMultiplier: number;
    stoneMultiplier: number;
    goldMultiplier: number;
    happinessBonus: number;
    storageBonus: number;
    raidDefense: number;
  }>;
}

export interface GameEvent {
  type: EventType;
  message: string;
  effect: (state: any) => void;
  tickRemaining: number;
}

export interface Resources {
  [ResourceType.Wood]: number;
  [ResourceType.Food]: number;
  [ResourceType.Stone]: number;
  [ResourceType.Gold]: number;
  [ResourceType.Planks]: number;
  [ResourceType.Bricks]: number;
  [ResourceType.Research]: number;
  [ResourceType.Leather]: number;
  [ResourceType.Tools]: number;
  [ResourceType.Water]: number;
}

export interface ProductionDef {
  input: Partial<Resources>;
  output: Partial<Resources>;
  ticksPerCycle: number;
  winterMultiplier?: number;
}

export interface BuildingDef {
  type: BuildingType;
  name: string;
  description: string;
  cost: Partial<Resources>;
  production: ProductionDef | null;
  populationCapacity: number;
  populationNeed: number;
  size: { w: number; h: number };
  requiredTile: TileType | null;
  color: number;
  requiredTech?: string;
}

export interface PlacedBuilding {
  id: number;
  type: BuildingType;
  gridX: number;
  gridY: number;
  productionTimer: number;
  active: boolean;
}

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  buildingId: number | null;
}

export interface PopulationStats {
  total: number;
  happiness: number;
  foodConsumption: number;
  tier: number;
}

export interface TradeOffer {
  resource: ResourceType;
  buyPrice: number;
  sellPrice: number;
}

export interface SaveData {
  version: number;
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
  researchedTechs: string[];
  researchTarget: string | null;
  researchProgress: number;
  eventLog: string[];
}
