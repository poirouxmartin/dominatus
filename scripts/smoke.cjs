/**
 * Smoke test headless : démarre une partie, construit, force les saisons,
 * déclenche la victoire, relance — et échoue au moindre erreur de page.
 * Usage: npm run smoke
 */
const puppeteer = require("puppeteer-core");

const CHROME = process.env.SMOKE_CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = process.env.SMOKE_URL || "http://localhost:5174/";
const W = 1473;
const H = 783;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });

  const fail = (msg) => {
    console.error(`SMOKE FAIL: ${msg}`);
    for (const e of errors) console.error(`  erreur collectée: ${e}`);
    browser.close();
    process.exit(1);
  };

  await page.setViewport({ width: W, height: H });
  await page.goto(URL, { waitUntil: "networkidle0" });
  await sleep(2200);

  // 1. écran-titre visible
  const titleOk = await page.evaluate(() => {
    const d = window.__dominatus;
    return d && d.game && d.game.scene.getScene("TitleScene").sys.isActive();
  });
  if (!titleOk) fail("TitleScene inactif au démarrage");

  // 2. BEGIN -> GameScene active
  const vp = await page.evaluate(() => [window.__dominatus.Viewport.w, window.__dominatus.Viewport.h]);
  await page.mouse.click(vp[0] / 2, vp[1] / 2 + 74);
  await sleep(1500);
  const gameOk = await page.evaluate(() => {
    const d = window.__dominatus;
    const gs = d.game.scene.getScene("GameScene");
    return gs.sys.isActive() && !!gs.state;
  });
  if (!gameOk) fail("GameScene inactif après BEGIN");

  // 3. construction de bâtiments
  await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    const s = gs.state;
    s.resources.wood = 300;
    s.resources.stone = 200;
    const find = (type) => {
      let best = null;
      let bd = 1e9;
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 30; x++) {
          const t = s.tiles[y][x];
          if (t.type !== type || t.buildingId !== null) continue;
          const d2 = (x - 15) * (x - 15) + (y - 10) * (y - 10);
          if (d2 < bd) {
            bd = d2;
            best = [x, y];
          }
        }
      }
      return best;
    };
    const place = (bt, tt) => {
      const p = find(tt);
      if (!p || !s.placeBuilding(bt, p[0], p[1])) throw new Error(`placement impossible: ${bt}`);
    };
    place("house", "grass");
    place("house", "grass");
    place("farm", "farmable");
    place("lumberMill", "forest");
    place("well", "grass");
    gs.tileMap.sync(s);
  });
  await sleep(2500);

  const built = await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    return { n: gs.state.buildings.length, pop: gs.state.population.total };
  });
  if (built.n < 5) fail(`seulement ${built.n} bâtiments posés`);
  if (built.pop < 2) fail(`population non initialisée (${built.pop})`);

  // 4. transitions de saison forcées
  await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    gs.state.season = "autumn";
    gs.lastSeason = "";
  });
  await sleep(1800);
  await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    gs.state.season = "winter";
    gs.lastSeason = "";
  });
  await sleep(1800);
  const season = await page.evaluate(() => window.__dominatus.game.scene.getScene("GameScene").state.season);
  if (season !== "winter") fail(`saison attendue winter, obtenu ${season}`);

  // 5. victoire -> écran de fin
  await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    gs.state.population.total = 40;
    for (const t of [
      "philosophy", "irrigation", "masonry", "law", "engineering", "militia",
      "fortification", "conscription", "currency", "logistics", "writing",
      "mathematics", "aqueduct", "architecture",
    ]) {
      if (!gs.state.researchedTechs.includes(t)) gs.state.researchedTechs.push(t);
    }
  });
  await sleep(1500);
  const victory = await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    return { victory: gs.state.victory, endShown: gs.endShown };
  });
  if (!victory.victory || !victory.endShown) fail(`écran de fin non déclenché (${JSON.stringify(victory)})`);

  // 6. NEW GAME -> relance propre
  await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    gs.hud.showEndScreen && gs.hud.hideEndScreen();
    gs.restartNewGame();
  });
  await sleep(1800);
  const restarted = await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    return { ticks: gs.state.totalTicks, endShown: gs.endShown, pop: gs.state.population.total };
  });
  if (restarted.endShown) fail("écran de fin encore affiché après relance");
  if (restarted.ticks > 10) fail(`partie non réinitialisée (${restarted.ticks} ticks)`);

  if (errors.length > 0) {
    console.error("SMOKE FAIL: erreurs de page détectées");
    for (const e of errors) console.error(`  ${e}`);
    await browser.close();
    process.exit(1);
  }

  console.log("SMOKE PASS — démarrage, construction, saisons, victoire, relance : OK");
  await browser.close();
})().catch((e) => {
  console.error("SMOKE FATAL:", e.message);
  process.exit(1);
});
