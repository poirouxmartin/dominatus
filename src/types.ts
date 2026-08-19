export enum ResourceType {
  Wood = "wood",
  Food = "food",
  Stone = "stone",
  Gold = "gold",
  Planks = "planks",
  Bricks = "bricks",
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
}

export interface TradeOffer {
  resource: ResourceType;
  buyPrice: number;
  sellPrice: number;
}
