export enum ResourceType {
  Wood = "wood",
  Food = "food",
  Stone = "stone",
  Gold = "gold",
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
  Warehouse = "warehouse",
  Market = "market",
}

export enum Season {
  Spring = "spring",
  Summer = "summer",
  Autumn = "autumn",
  Winter = "winter",
}

export interface Resources {
  [ResourceType.Wood]: number;
  [ResourceType.Food]: number;
  [ResourceType.Stone]: number;
  [ResourceType.Gold]: number;
}

export interface ProductionDef {
  input: Partial<Resources>;
  output: Resources;
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
