/* Génère les captures des 3 DA : écran-titre + partie avec bâtiments. */
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:5174/";
const W = 1473;
const H = 783;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });

  for (const da of ["1", "2", "3"]) {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(`${URL}?da=${da}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 2200));
    await page.screenshot({ path: `scripts/da${da}-title.png` });

    const vp = await page.evaluate(() => [window.__dominatus.Viewport.w, window.__dominatus.Viewport.h]);
    await page.mouse.click(W / 2, H / 2 + ((74 * H) / vp[1]));
    await new Promise((r) => setTimeout(r, 1500));

    await page.evaluate(() => {
      const d = window.__dominatus;
      const gs = d.game.scene.getScene("GameScene");
      const s = gs.state;
      s.resources.wood = 500;
      s.resources.stone = 300;
      s.resources.gold = 300;
      s.resources.planks = 100;
      s.population.total = 6;
      const find = (type) => {
        const cx = 15, cy = 10;
        let best = null, bestD = 1e9;
        for (let y = 0; y < 20; y++) {
          for (let x = 0; x < 30; x++) {
            const t = s.tiles[y][x];
            if (t.type !== type || t.buildingId !== null) continue;
            const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
            if (d2 < bestD) { bestD = d2; best = [x, y]; }
          }
        }
        return best;
      };
      const place = (bt, tt) => {
        const p = find(tt);
        if (p) s.placeBuilding(bt, p[0], p[1]);
      };
      place("house", "grass");
      place("house", "grass");
      place("house", "grass");
      place("farm", "farmable");
      place("lumberMill", "forest");
      place("quarry", "mountain");
      place("well", "grass");
      place("sawmill", "grass");
      place("market", "grass");
      gs.tileMap.sync(s);
      gs.hud.update(s);
    });

    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: `scripts/da${da}-game.png` });
    await page.close();
    console.log(`DA ${da} ok`);
  }

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
