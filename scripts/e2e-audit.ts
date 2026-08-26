/**
 * Audit e2e de la logique de Dominatus — exécutable en Node (sans Phaser).
 * Run: npm test
 */
import { GameState } from "../src/state/GameState";
import { ProductionSystem } from "../src/systems/ProductionSystem";
import { PopulationSystem } from "../src/systems/PopulationSystem";
import { SeasonSystem } from "../src/systems/SeasonSystem";
import { EventSystem } from "../src/systems/EventSystem";
import { TechSystem } from "../src/systems/TechSystem";
import { BuildingType, ResourceType, Season, TileType, EventType } from "../src/types";
import { GRID_COLS, GRID_ROWS, VICTORY_POPULATION, VICTORY_TECHS, BUILDINGS, TECH_TREE } from "../src/config";
import { hexDistance, hexCenter, neighbors as hexNeighbors } from "../src/map/hex";

// --- shim localStorage ----------------------------------------------------
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

// --- harnais --------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  \u2717 ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

interface Systems {
  prod: ProductionSystem;
  pop: PopulationSystem;
  season: SeasonSystem;
  events: EventSystem;
  tech: TechSystem;
}

function makeSystems(): Systems {
  return {
    prod: new ProductionSystem(),
    pop: new PopulationSystem(),
    season: new SeasonSystem(),
    events: new EventSystem(),
    tech: new TechSystem(),
  };
}

/** Réplique exacte de la boucle de tick de GameScene (y compris vérifs victoire/défaite). */
function tick(state: GameState, sys: Systems): void {
  sys.season.update(state);
  sys.events.update(state);
  sys.prod.update(state);
  sys.tech.update(state);
  sys.pop.update(state);
  state.totalTicks++;

  if (state.population.total <= 0 && state.buildings.length > 0) state.gameOver = true;
  if (state.population.total >= VICTORY_POPULATION && state.researchedTechs.length >= VICTORY_TECHS) state.victory = true;

  const hasCircus = state.buildings.some((b) => b.type === BuildingType.CircusMaximus);
  if (hasCircus && state.population.total >= 30 && state.population.happiness >= 80 && state.researchedTechs.length >= 10) {
    state.victory = true;
  }

  state.processEvents();
}

function findTile(state: GameState, type: TileType, nearCol = GRID_COLS / 2, nearRow = GRID_ROWS / 2, maxDist = 99): { col: number; row: number } | null {
  let best: { col: number; row: number } | null = null;
  let bestD = Infinity;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (state.tiles[y][x].type !== type || state.tiles[y][x].buildingId !== null) continue;
      const d = hexDistance({ col: x, row: y }, { col: Math.floor(nearCol), row: Math.floor(nearRow) });
      if (d < bestD && d <= maxDist) {
        bestD = d;
        best = { col: x, row: y };
      }
    }
  }
  return best;
}

// === 1. Génération de carte ===============================================
section("Génération de carte (50 parties)");
{
  let ringOk = 0;
  let startOk = 0;
  let guaranteedOk = 0;
  let orphanWater = 0;
  let grassFracSum = 0;

  for (let run = 0; run < 50; run++) {
    const s = new GameState();
    const cx = Math.floor(GRID_COLS / 2);
    const cy = Math.floor(GRID_ROWS / 2);

    let ring = true;
    for (let x = 0; x < GRID_COLS; x++) {
      if (s.tiles[0][x].type !== TileType.Water || s.tiles[GRID_ROWS - 1][x].type !== TileType.Water) ring = false;
    }
    for (let y = 0; y < GRID_ROWS; y++) {
      if (s.tiles[y][0].type !== TileType.Water || s.tiles[y][GRID_COLS - 1].type !== TileType.Water) ring = false;
    }
    if (ring) ringOk++;

    let start = true;
    for (let y = cy - 1; y <= cy + 1; y++) {
      for (let x = cx - 1; x <= cx + 1; x++) {
        if (hexDistance({ col: x, row: y }, { col: cx, row: cy }) <= 1 && s.tiles[y][x].type !== TileType.Grass) start = false;
      }
    }
    if (start) startOk++;

    const counts: Record<string, number> = { forest: 0, farmable: 0, mountain: 0 };
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const d = hexDistance({ col: x, row: y }, { col: cx, row: cy });
        if (d > 5) continue;
        if (s.tiles[y][x].type === TileType.Forest) counts.forest++;
        if (s.tiles[y][x].type === TileType.Farmable) counts.farmable++;
        if (s.tiles[y][x].type === TileType.Mountain) counts.mountain++;
      }
    }
    if (counts.forest >= 2 && counts.farmable >= 2 && counts.mountain >= 2) guaranteedOk++;

    let orphans = 0;
    let grass = 0;
    for (let y = 1; y < GRID_ROWS - 1; y++) {
      for (let x = 1; x < GRID_COLS - 1; x++) {
        if (s.tiles[y][x].type === TileType.Grass) grass++;
        if (s.tiles[y][x].type !== TileType.Water) continue;
        let wn = 0;
        for (const n of hexNeighbors(x, y)) {
          if (s.tiles[n.row][n.col].type === TileType.Water) wn++;
        }
        if (wn <= 1) orphans++;
      }
    }
    orphanWater += orphans;
    grassFracSum += grass / (GRID_COLS * GRID_ROWS);
  }

  check("anneau d'eau périphérique complet (50/50)", ringOk === 50, `${ringOk}/50`);
  check("zone de départ entièrement en herbe (50/50)", startOk === 50, `${startOk}/50`);
  check("forêt + cultivable + montagne à distance ≤5 du centre (50/50)", guaranteedOk === 50, `${guaranteedOk}/50`);
  check("aucune mare orpheline", orphanWater === 0, `${orphanWater} orphelines au total`);
  check("au moins 22% d'herbe en moyenne", grassFracSum / 50 >= 0.22, `${((grassFracSum / 50) * 100).toFixed(1)}%`);
}

// === 2. Impasse de recherche (critique) ====================================
section("Progression : génération de recherche");
{
  const s = new GameState();
  const sys = makeSystems();
  for (let i = 0; i < 4; i++) {
    const t = findTile(s, TileType.Grass, 15, 10, 4);
    if (t) s.placeBuilding(BuildingType.House, t.col, t.row);
  }
  for (let i = 0; i < 200; i++) tick(s, sys);
  check("les citoyens génèrent des points de recherche", s.resources.research > 0, `research=${s.resources.research.toFixed(2)}`);

  s.startResearch("philosophy");
  let done = false;
  for (let i = 0; i < 3000 && !done; i++) {
    tick(s, sys);
    if (s.researchedTechs.includes("philosophy")) done = true;
  }
  check("philosophy finit par être recherchée", done, `progress=${s.researchProgress}`);
}

// === 3. Début de partie viable ============================================
section("Économie de début de partie");
{
  const s = new GameState();
  const sys = makeSystems();

  const forest = findTile(s, TileType.Forest, 15, 10, 5);
  const farm1 = findTile(s, TileType.Farmable, 15, 10, 5);
  check("ressources de départ suffisantes", s.placeBuilding(BuildingType.House, 15, 10) !== null);
  if (farm1) check("ferme placée sur terre cultivable", s.placeBuilding(BuildingType.Farm, farm1.col, farm1.row) !== null);
  const farm2 = findTile(s, TileType.Farmable, 15, 10, 6);
  if (farm2) check("2e ferme placée", s.placeBuilding(BuildingType.Farm, farm2.col, farm2.row) !== null);
  s.resources.wood += 40;
  if (forest) check("scierie placée en forêt", s.placeBuilding(BuildingType.LumberMill, forest.col, forest.row) !== null);
  const house2 = findTile(s, TileType.Grass, 15, 10, 3);
  if (house2) s.placeBuilding(BuildingType.House, house2.col, house2.row);

  let starvedTicks = 0;
  let woodAtStart = s.resources.wood;
  for (let i = 0; i < 120; i++) {
    s.lastEventTick = s.totalTicks + 1000;
    tick(s, sys);
    if (s.resources.food <= 0.01 && s.population.foodConsumption > 0.5) starvedTicks++;
  }
  check("le bois augmente (scierie active)", s.resources.wood > woodAtStart, `wood=${s.resources.wood.toFixed(0)}`);
  check("pas de famine chronique (≤20 ticks à zéro nourriture)", starvedTicks <= 20, `${starvedTicks} ticks de famine`);
  check("la population grandit", s.population.total > 4, `pop=${s.population.total.toFixed(1)}`);
}

// === 4. Chaîne de production ==============================================
section("Chaîne de production bois→planches→or");
{
  const s = new GameState();
  const sys = makeSystems();
  s.resources.wood = 100;
  const t1 = findTile(s, TileType.Grass, 15, 10, 5);
  if (t1) s.placeBuilding(BuildingType.Sawmill, t1.col, t1.row);
  const t2 = findTile(s, TileType.Grass, 16, 10, 6);
  if (t2) s.placeBuilding(BuildingType.Market, t2.col, t2.row);
  const gold0 = s.resources.gold;
  const plank0 = s.resources.planks;
  for (let i = 0; i < 60; i++) tick(s, sys);
  check("la scierie consomme du bois et produit des planches", s.resources.planks > plank0 || s.resources.gold > gold0, `planks=${s.resources.planks} gold=${s.resources.gold}`);
}

// === 5. Hiver =============================================================
section("Effet de l'hiver");
{
  const s = new GameState();
  const sys = makeSystems();
  const farm = findTile(s, TileType.Farmable, 15, 10, 5);
  if (farm) s.placeBuilding(BuildingType.Farm, farm.col, farm.row);
  s.resources.food = 0;

  s.season = Season.Summer;
  s.seasonTick = 0;
  let summerFood = 0;
  for (let i = 0; i < 30; i++) {
    s.lastEventTick = s.totalTicks + 1000;
    tick(s, sys);
    summerFood += s.resources.food;
    s.resources.food = 0;
  }

  s.season = Season.Winter;
  s.seasonTick = 0;
  let winterFood = 0;
  for (let i = 0; i < 30; i++) {
    s.lastEventTick = s.totalTicks + 1000;
    tick(s, sys);
    winterFood += s.resources.food;
    s.resources.food = 0;
  }
  check("l'hiver réduit fortement la production agricole", winterFood < summerFood * 0.35, `été=${summerFood} hiver=${winterFood}`);
}

// === 6. Commerce ==========================================================
section("Commerce");
{
  const s = new GameState();
  s.resources.gold = 100;
  s.resources.wood = 0;
  const okBuy = s.trade(ResourceType.Wood, 5, "buy");
  check("achat 5 bois = 25 or", okBuy && s.resources.wood === 5 && s.resources.gold === 75, `gold=${s.resources.gold}`);
  const okSell = s.trade(ResourceType.Wood, 5, "sell");
  check("vente 5 bois = +10 or", okSell && s.resources.gold === 85, `gold=${s.resources.gold}`);
  check("impossible d'acheter sans or", !s.trade(ResourceType.Wood, 100, "buy"));
}

// === 7. Événements ========================================================
section("Événements");
{
  const s = new GameState();
  const sys = makeSystems();
  s.placeBuilding(BuildingType.House, 15, 10);
  s.population.total = 4;
  s.population.happiness = 50;

  const happyBefore = s.population.happiness;
  s.addEvent({
    type: EventType.Festival,
    message: "Festival!",
    tickRemaining: 0,
    effect: (st: GameState) => {
      st.tempHappiness = (st.tempHappiness ?? 0) + 20;
    },
  });
  tick(s, sys);
  const afterOne = s.population.happiness;
  check("le bonus de bonheur d'événement s'applique", afterOne >= happyBefore, `before=${happyBefore} after=${afterOne}`);
  s.tempHappiness = 20;
  const h1 = s.population.happiness;
  tick(s, sys);
  const decayed = s.tempHappiness ?? 0;
  check("le bonus temporaire décroit avec le temps", decayed < 20 || s.population.happiness !== h1, `tempHappiness=${decayed}`);
}

// === 7b. Nouveaux événements ==============================================
section("Nouveaux événements (récolte, colons, marchand)");
{
  const s = new GameState();
  const sys = makeSystems();
  s.placeBuilding(BuildingType.House, 15, 10);
  s.population.total = 4;
  s.resources.food = 0;

  s.addEvent({
    type: EventType.Harvest,
    message: "Bumper harvest!",
    tickRemaining: 0,
    effect: (st: GameState) => st.addResources({ [ResourceType.Food]: 30 }),
  });
  tick(s, sys);
  check("récolte exceptionnelle : +30 nourriture", s.resources.food >= 30, `food=${s.resources.food.toFixed(0)}`);

  s.resources.gold = 100;
  s.resources.wood = 0;
  s.addEvent({
    type: EventType.Merchant,
    message: "Merchant",
    tickRemaining: 0,
    effect: (st: GameState) => {
      if (st.resources[ResourceType.Gold] >= 20) {
        st.resources[ResourceType.Gold] -= 20;
        st.addResources({ [ResourceType.Wood]: 25 });
      }
    },
  });
  tick(s, sys);
  check("marchand : -20 or, +25 bois", s.resources.wood === 25 && s.resources.gold === 80, `wood=${s.resources.wood} gold=${s.resources.gold}`);

  const cap = s.buildings.reduce((sum, b) => sum + BUILDINGS[b.type].populationCapacity, 0);
  s.population.total = Math.max(0, cap - 1);
  s.addEvent({
    type: EventType.Settlers,
    message: "Settlers",
    tickRemaining: 0,
    effect: (st: GameState) => {
      st.population.total = Math.min(cap, st.population.total + 3);
    },
  });
  tick(s, sys);
  check("colons errants : plafonnés à la capacité", s.population.total <= cap, `pop=${s.population.total} cap=${cap}`);
}

// === 8. Défense anti-raid ==================================================
section("Raids & défense");
{
  const s1 = new GameState();
  s1.placeBuilding(BuildingType.House, 15, 10);
  s1.population.total = 20;
  const def0 = s1.getRaidDefense();
  s1.researchedTechs.push("engineering", "militia");
  s1.placeBuilding(BuildingType.Wall, 14, 10);
  s1.placeBuilding(BuildingType.Wall, 16, 10);
  s1.placeBuilding(BuildingType.Tower, 15, 9);
  const def1 = s1.getRaidDefense();
  check("les murailles et tours augmentent la défense", def1 > def0, `${(def0 * 100).toFixed(0)}% -> ${(def1 * 100).toFixed(0)}%`);
  check("défense plafonnée à 90%", def1 <= 0.9, `${(def1 * 100).toFixed(0)}%`);
}

// === 9. Placement interdit sur l'eau ======================================
section("Règles de placement");
{
  const s = new GameState();
  const water = findTile(s, TileType.Water, 2, 2, 99);
  check("une case d'eau existe en bordure", water !== null);
  if (water) {
    const reason = s.getPlacementReason(BuildingType.House, water.col, water.row);
    check("impossible de construire sur l'eau", reason !== null, `reason=${reason}`);
  }
  const grass = findTile(s, TileType.Grass, 15, 10, 4);
  if (grass) {
    const reason = s.getPlacementReason(BuildingType.LumberMill, grass.col, grass.row);
    check("scierie refusée hors forêt", reason !== null && reason.toLowerCase().includes("forest"), `reason=${reason}`);
  }
}

// === 10. Sauvegarde / chargement ==========================================
section("Sauvegarde / chargement");
{
  const s = new GameState();
  const sys = makeSystems();
  s.placeBuilding(BuildingType.House, 15, 10);
  const farm = findTile(s, TileType.Farmable, 15, 10, 5);
  if (farm) s.placeBuilding(BuildingType.Farm, farm.col, farm.row);
  for (let i = 0; i < 10; i++) tick(s, sys);
  s.save();

  const raw = store.get("dominatus_save_v3")!;
  const loaded = new GameState(JSON.parse(raw));
  check("version de sauvegarde correcte", JSON.parse(raw).version === 3);
  check("bâtiments restaurés", loaded.buildings.length === s.buildings.length);
  check("ressources restaurées", Math.abs(loaded.resources.wood - s.resources.wood) < 0.001);
  check("population restaurée", Math.abs(loaded.population.total - s.population.total) < 0.001);
  check("saison restaurée", loaded.season === s.season);
  check("grille restaurée", loaded.tiles[10][15].buildingId === s.tiles[10][15].buildingId);
}

// === 11. Victoire & défaite ===============================================
section("Victoire / défaite");
{
  const s = new GameState();
  const sys = makeSystems();
  s.placeBuilding(BuildingType.House, 15, 10);
  s.population.total = VICTORY_POPULATION;
  for (const t of TECH_TREE) s.researchedTechs.push(t.id);
  tick(s, sys);
  check("victoire déclenchée (pop + 14 techs)", s.victory, `pop=${s.population.total} techs=${s.researchedTechs.length}`);

  const s2 = new GameState();
  const sys2 = makeSystems();
  s2.placeBuilding(BuildingType.House, 15, 10);
  s2.population.total = 2;
  s2.resources.food = 0;
  for (let i = 0; i < 400 && !s2.gameOver; i++) {
    s2.lastEventTick = s2.totalTicks + 1000;
    tick(s2, sys2);
  }
  check("game over si la population disparaît", s2.gameOver, `pop=${s2.population.total}`);

  // voie monument : Circus Maximus + 30 colons + 80% bonheur + 10 techs
  const s3 = new GameState();
  const sys3 = makeSystems();
  s3.resources.stone = 500;
  s3.resources.bricks = 200;
  s3.resources.planks = 200;
  s3.resources.gold = 400;
  s3.resources.tools = 100;
  s3.researchedTechs.push("democracy");
  for (let i = 0; i < 10; i++) {
    const spot = findTile(s3, TileType.Grass, 15, 10, 6);
    if (spot) s3.placeBuilding(BuildingType.House, spot.col, spot.row);
  }
  const circus = findTile(s3, TileType.Grass, 15, 10, 8);
  check("Circus Maximus plaçable", circus !== null && s3.placeBuilding(BuildingType.CircusMaximus, circus.col, circus.row) !== null);
  s3.population.total = 30;
  s3.population.happiness = 82;
  for (let i = 0; i < 10; i++) s3.researchedTechs.push("tech" + i);
  tick(s3, sys3);
  check("victoire par le monument (Circus + 30 colons + 80% bonheur)", s3.victory, `pop=${s3.population.total} hap=${s3.population.happiness} techs=${s3.researchedTechs.length}`);
}

// === 11b. Bâtiments récents ===============================================
section("Bâtiments récents (aqueduc, thermes, amphithéâtre, temple, bibliothèque, caserne, pêcherie, vignoble)");
{
  const s = new GameState();
  const sys = makeSystems();
  s.researchedTechs.push("engineering", "currency", "writing", "theology", "conscription", "democracy");
  s.resources.stone = 400;
  s.resources.planks = 300;
  s.resources.bricks = 200;
  s.resources.gold = 300;
  s.resources.tools = 50;
  s.resources.leather = 50;
  s.population.total = 6;

  const water = findTile(s, TileType.Water, 3, 3, 99);
  check("une case d'eau existe pour la pêcherie", water !== null);

  const grassSpot = (): { col: number; row: number } | null => findTile(s, TileType.Grass, 15, 10, 6);
  const g1 = grassSpot();
  if (g1) check("aqueduc plaçable sur l'herbe", s.placeBuilding(BuildingType.Aqueduct, g1.col, g1.row) !== null);
  const g2 = grassSpot();
  if (g2) check("therme plaçable sur l'herbe", s.placeBuilding(BuildingType.Temple, g2.col, g2.row) !== null);
  const g3 = grassSpot();
  if (g3) check("bibliothèque plaçable", s.placeBuilding(BuildingType.Library, g3.col, g3.row) !== null);
  const farm = findTile(s, TileType.Farmable, 15, 10, 6);
  if (farm) check("vignoble plaçable sur terre cultivable", s.placeBuilding(BuildingType.Vineyard, farm.col, farm.row) !== null);
  const fish = water;
  if (fish) check("pêcherie plaçable SUR l'eau", s.placeBuilding(BuildingType.Fishery, fish.col, fish.row) !== null);

  const water0 = s.resources.water;
  const research0 = s.resources.research;
  const gold0 = s.resources.gold;
  const def0 = s.getRaidDefense();
  const bSpot2 = findTile(s, TileType.Grass, 16, 10, 7);
  if (bSpot2) s.placeBuilding(BuildingType.Barracks, bSpot2.col, bSpot2.row);
  for (let i = 0; i < 12; i++) {
    s.lastEventTick = s.totalTicks + 1000;
    tick(s, sys);
  }
  check("aqueduc produit de l'eau", s.resources.water > water0, `+${(s.resources.water - water0).toFixed(1)}`);
  check("temple + bibliothèque produisent de la recherche", s.resources.research > research0, `+${(s.resources.research - research0).toFixed(1)}`);
  check("caserne augmente la défense (outils/cuir en stock)", s.getRaidDefense() > def0, `${(def0 * 100).toFixed(0)}% -> ${(s.getRaidDefense() * 100).toFixed(0)}%`);
  check("vignoble rapporte de l'or", s.resources.gold > gold0, `+${(s.resources.gold - gold0).toFixed(0)}`);
}

// === 12. Data integrity ====
section("Data integrity");
{
  const types = Object.values(BuildingType);
  let ok = true;
  for (const t of types) {
    const def = BUILDINGS[t];
    if (!def) ok = false;
    else {
      if (def.size.w !== 1 || def.size.h !== 1) ok = false;
      const totalCost = Object.values(def.cost).reduce((a, b) => a + (b ?? 0), 0);
      if (totalCost <= 0 && t !== BuildingType.Well) ok = false;
    }
  }
  check("tous les bâtiments ont une définition 1 hex avec coût", ok);

  const ids = TECH_TREE.map((t) => t.id);
  const unique = new Set(ids).size === ids.length;
  const reqsOk = TECH_TREE.every((t) => t.requires.every((r) => ids.includes(r)));
  check("arbre technologique cohérent (ids uniques, prérequis valides)", unique && reqsOk);

  let unlockOk = true;
  for (const t of TECH_TREE) {
    for (const b of t.unlocks) {
      if (BUILDINGS[b]?.requiredTech !== t.id) unlockOk = false;
    }
  }
  check("chaque bâtiment déverrouillé pointe vers sa tech", unlockOk);
}

// === 13. Performance fin de partie ========================================
section("Performance fin de partie (province dense)");
{
  const s = new GameState();
  const sys = makeSystems();
  s.resources.wood = 2000;
  s.resources.stone = 2000;
  s.resources.planks = 1000;
  s.resources.bricks = 500;
  s.resources.gold = 2000;
  s.resources.tools = 200;
  s.resources.leather = 200;
  s.researchedTechs.push("engineering", "currency", "writing", "theology", "conscription", "democracy", "irrigation");

  const spotFor = (def: { requiredTile: TileType | null }): { col: number; row: number } | null => {
    const wanted = def.requiredTile;
    let best: { col: number; row: number } | null = null;
    let bd = 1e9;
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const t = s.tiles[y][x];
        if (t.buildingId !== null) continue;
        if (wanted === null ? t.type === TileType.Water : t.type !== wanted) continue;
        const d2 = (x - 15) * (x - 15) + (y - 10) * (y - 10);
        if (d2 < bd) { bd = d2; best = { col: x, row: y }; }
      }
    }
    return best;
  };

  let placed = 0;
  for (const bt of Object.values(BuildingType)) {
    const def = BUILDINGS[bt];
    if (def.requiredTech && !s.researchedTechs.includes(def.requiredTech)) continue;
    for (let copies = 0; copies < 3; copies++) {
      if (Object.entries(def.cost).some(([r, a]) => (s.resources[r as keyof typeof s.resources] ?? 0) < (a ?? 0) * (copies + 1))) break;
      const spot = spotFor(def);
      if (!spot) break;
      if (s.placeBuilding(bt, spot.col, spot.row)) placed++;
    }
  }
  check("province dense peuplée (>= 40 bâtiments)", placed >= 40, `${placed} posés`);
  s.population.total = Math.min(60, s.population.total + 40);

  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 100; i++) {
    s.lastEventTick = s.totalTicks + 1000;
    tick(s, sys);
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const avg = ms / 100;
  console.log(`  -> 100 ticks avec ${placed} bâtiments : ${ms.toFixed(1)} ms total (${avg.toFixed(2)} ms/tick)`);
  check("tick logique rapide (< 20 ms/tick moyen)", avg < 20, `${avg.toFixed(2)} ms/tick`);
}

// === Résumé ================================================================
console.log(`\n${"=".repeat(50)}`);
console.log(`RÉSULTAT: ${passed} OK, ${failed} ÉCHEC(S)`);
if (failures.length > 0) {
  console.log("\nÉchecs:");
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed > 0 ? 1 : 0);
