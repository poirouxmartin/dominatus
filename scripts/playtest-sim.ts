/**
 * Bot playtest : une IA suit le tutoriel puis optimise vers la victoire.
 * Produit les données d'équilibrage : durée, famine, bonheur, raids.
 * Usage: node scripts/playtest-sim.cjs [seedRuns=3]
 */
import { GameState } from "../src/state/GameState";
import { ProductionSystem } from "../src/systems/ProductionSystem";
import { PopulationSystem } from "../src/systems/PopulationSystem";
import { SeasonSystem } from "../src/systems/SeasonSystem";
import { EventSystem } from "../src/systems/EventSystem";
import { TechSystem } from "../src/systems/TechSystem";
import { BuildingType, ResourceType, TileType } from "../src/types";
import { GRID_COLS, GRID_ROWS, TECH_TREE } from "../src/config";
import { hexDistance } from "../src/map/hex";

const TECH_TREE_MAP: Record<string, { requires: string[] }> = Object.fromEntries(
  TECH_TREE.map((t) => [t.id, { requires: t.requires }])
);

(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

interface RunReport {
  won: boolean;
  victoryTick: number;
  path: string;
  minHappiness: number;
  starveTicks: number;
  raids: number;
  buildings: number;
  maxPop: number;
}

function runPlaythrough(seed: number): RunReport {
  const s = new GameState();
  const sys = {
    season: new SeasonSystem(),
    events: new EventSystem(),
    prod: new ProductionSystem(),
    tech: new TechSystem(),
    pop: new PopulationSystem(),
  };

  const report: RunReport = { won: false, victoryTick: 0, path: "", minHappiness: 100, starveTicks: 0, raids: 0, buildings: 0, maxPop: 0 };

  const count = (t: BuildingType) => s.buildings.filter((b) => b.type === t).length;
  const find = (type: TileType | null, maxD = 12): { col: number; row: number } | null => {
    let best: { col: number; row: number } | null = null;
    let bd = 1e9;
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const t = s.tiles[y][x];
        if (t.buildingId !== null) continue;
        if (type === null ? t.type === TileType.Water : t.type !== type) continue;
        const d2 = (x - 15) * (x - 15) + (y - 10) * (y - 10);
        if (d2 < bd) { bd = d2; best = { col: x, row: y }; }
      }
    }
    void maxD;
    return best;
  };
  const tryBuild = (bt: BuildingType, tt: TileType | null): boolean => {
    if (count(bt) >= 12) return false;
    const spot = find(tt);
    return spot ? s.placeBuilding(bt, spot.col, spot.row) !== null : false;
  };

  const tick = (): void => {
    sys.season.update(s);
    sys.events.update(s);
    sys.prod.update(s);
    sys.tech.update(s);
    sys.pop.update(s);
    s.totalTicks++;

    if (s.population.total <= 0 && s.buildings.length > 0) s.gameOver = true;
    if (s.population.total >= 50 && s.researchedTechs.length >= 14) s.victory = true;
    if (s.buildings.some((b) => b.type === BuildingType.CircusMaximus) && s.population.total >= 30 && s.population.happiness >= 80 && s.researchedTechs.length >= 10) {
      s.victory = true;
    }
    s.processEvents();
  };

const MONUMENT = process.env.MONUMENT === "1";

const RESEARCH_ORDER = MONUMENT
  ? [
      "philosophy", "currency", "writing", "masonry", "engineering",
      "democracy", "irrigation", "theology", "law", "trade_fleet",
      "metallurgy", "advanced_carpentry", "conscription", "fortification",
      "crop_rotation", "selective_breeding", "banking",
    ]
  : [
      "philosophy", "writing", "currency", "irrigation", "democracy",
      "theology", "masonry", "engineering", "law", "trade_fleet",
      "metallurgy", "advanced_carpentry", "conscription", "fortification",
      "crop_rotation", "selective_breeding", "banking",
    ];

const BUILD_PRIORITY: { type: BuildingType; tile: TileType | null; max: (s: GameState) => number }[] = MONUMENT
  ? [
      { type: BuildingType.House, tile: TileType.Grass, max: (st) => Math.min(14, 4 + Math.floor(st.population.total / 3)) },
      { type: BuildingType.Farm, tile: TileType.Farmable, max: () => 5 },
      { type: BuildingType.LumberMill, tile: TileType.Forest, max: () => 3 },
      { type: BuildingType.Well, tile: TileType.Grass, max: (st) => Math.ceil(st.population.total / 4) },
      { type: BuildingType.Market, tile: TileType.Grass, max: () => 1 },
      { type: BuildingType.TradingPost, tile: TileType.Grass, max: () => 1 },
      { type: BuildingType.Vineyard, tile: TileType.Farmable, max: () => 4 },
      { type: BuildingType.Warehouse, tile: TileType.Grass, max: () => 4 },
      { type: BuildingType.Quarry, tile: TileType.Mountain, max: () => 3 },
      { type: BuildingType.Brickyard, tile: TileType.Grass, max: () => 2 },
      { type: BuildingType.Forge, tile: TileType.Grass, max: () => 2 },
      { type: BuildingType.Tannery, tile: TileType.Grass, max: () => 2 },
      { type: BuildingType.Bathhouse, tile: TileType.Grass, max: () => 3 },
      { type: BuildingType.Temple, tile: TileType.Grass, max: () => 2 },
      { type: BuildingType.Amphitheater, tile: TileType.Grass, max: () => 2 },
      { type: BuildingType.Aqueduct, tile: TileType.Grass, max: (st) => Math.ceil(st.population.total / 8) },
      { type: BuildingType.Library, tile: TileType.Grass, max: () => 2 },
      { type: BuildingType.CircusMaximus, tile: TileType.Grass, max: () => 1 },
    ]
  : [
    { type: BuildingType.House, tile: TileType.Grass, max: (st) => Math.min(14, 4 + Math.floor(st.population.total / 3)) },
    { type: BuildingType.Farm, tile: TileType.Farmable, max: () => 6 },
    { type: BuildingType.LumberMill, tile: TileType.Forest, max: () => 2 },
    { type: BuildingType.Well, tile: TileType.Grass, max: (st) => Math.ceil(st.population.total / 4) },
    { type: BuildingType.Library, tile: TileType.Grass, max: () => 3 },
    { type: BuildingType.Temple, tile: TileType.Grass, max: () => 2 },
    { type: BuildingType.Amphitheater, tile: TileType.Grass, max: () => 2 },
    { type: BuildingType.Vineyard, tile: TileType.Farmable, max: () => 3 },
    { type: BuildingType.Aqueduct, tile: TileType.Grass, max: (st) => Math.ceil(st.population.total / 8) },
    { type: BuildingType.Bathhouse, tile: TileType.Grass, max: () => 2 },
    { type: BuildingType.Market, tile: TileType.Grass, max: () => 1 },
    { type: BuildingType.Warehouse, tile: TileType.Grass, max: () => 3 },
    { type: BuildingType.Brickyard, tile: TileType.Grass, max: () => 2 },
    { type: BuildingType.Forge, tile: TileType.Grass, max: () => 2 },
    { type: BuildingType.Tannery, tile: TileType.Grass, max: () => 2 },
    { type: BuildingType.CircusMaximus, tile: TileType.Grass, max: () => 1 },
  ];

  let lastBuildCheck = 0;
  const MAX_TICKS = 6000;
  let raidCount = 0;

  for (let t = 0; t < MAX_TICKS && !s.victory && !s.gameOver; t++) {
    // IA : toutes les 6 ticks, tenter une construction par priorité (jusqu'à ce qu'une réussisse)
    if (t - lastBuildCheck >= 6) {
      lastBuildCheck = t;
      for (const prio of BUILD_PRIORITY) {
        if (count(prio.type) < prio.max(s)) {
          if (tryBuild(prio.type, prio.tile)) break;
        }
      }
    }
    // IA : première technologie DISPONIBLE dans l'ordre, puis n'importe laquelle
    if (!s.researchTarget) {
      let picked = false;
      for (const tech of RESEARCH_ORDER) {
        if (!s.researchedTechs.includes(tech) && s.canResearch(tech)) {
          s.startResearch(tech);
          picked = true;
          break;
        }
      }
      if (!picked) {
        for (const tech of Object.keys(TECH_TREE_MAP)) {
          if (!s.researchedTechs.includes(tech) && s.canResearch(tech)) {
            s.startResearch(tech);
            break;
          }
        }
      }
    }
    // IA : acheter de la nourriture si la famine approche et que l'or coule
    if (s.resources.food < 15 && s.resources.gold > 60) {
      s.trade(ResourceType.Food, 5, "buy");
    }

    tick(s, sys);

    report.minHappiness = Math.min(report.minHappiness, s.population.happiness);
    if (s.resources.food <= 0.01 && s.population.total > 0) report.starveTicks++;
    if (s.activeEvents.some((e) => e.type === "raid")) report.raids++;
    report.maxPop = Math.max(report.maxPop, s.population.total);
    report.buildings = s.buildings.length;
  }

  report.won = s.victory;
  report.victoryTick = s.totalTicks;
  report.path = s.buildings.some((b) => b.type === BuildingType.CircusMaximus) ? "monument/autre" : "classique";
  report.raids = raidCount;
  return report;
}

const runs = Number(process.argv[2] ?? 3);
console.log(`=== BOT PLAYTEST — ${runs} parties simulées ===\n`);
for (let i = 0; i < runs; i++) {
  const r = runPlaythrough(i);
  console.log(
    `Partie ${i + 1}: ${r.won ? `VICTOIRE (${r.path})` : "DÉFAITE/INCOMPLÈTE"} au tick ${r.victoryTick} · ` +
      `pop max ${r.maxPop} · ${r.buildings} bâtiments · bonheur min ${r.minHappiness.toFixed(0)}% · ` +
      `${r.starveTicks} ticks de famine`
  );
}
console.log("\n(repère: 1 tick = 1 s à vitesse 1x)");
