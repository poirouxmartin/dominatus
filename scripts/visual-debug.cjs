/* Vérification multi-résolutions après le passage au viewport dynamique. */
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:5174/";

async function dump(page, label) {
  const info = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const rect = canvas.getBoundingClientRect();
    const d = window.__dominatus;
    const gs = d.game.scene.getScene("GameScene");
    return {
      inner: [window.innerWidth, window.innerHeight],
      dpr: window.devicePixelRatio,
      canvasCss: [Math.round(rect.width), Math.round(rect.height), Math.round(rect.left), Math.round(rect.top)],
      backing: [canvas.width, canvas.height],
      renderScale: +d.RenderScale.value.toFixed(3),
      viewport: [+d.Viewport.w.toFixed(1), +d.Viewport.h.toFixed(1)],
      gameZoom: gs.cameras.main ? +gs.cameras.main.zoom.toFixed(3) : null,
      scroll: gs.cameras.main ? [+gs.cameras.main.scrollX.toFixed(1), +gs.cameras.main.scrollY.toFixed(1)] : null,
    };
  });
  console.log(`${label}: ${JSON.stringify(info)}`);
}

async function run(browser, w, h, dpr, tag) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  page.on("pageerror", (e) => console.log(`[${tag}] PAGE ERROR:`, e.message));
  await page.goto(URL, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 2200));
  await dump(page, `[${tag}] titre`);
  await page.screenshot({ path: `scripts/shot-${tag}-title.png` });

  // BEGIN : centre du viewport + 74
  const vp = await page.evaluate(() => [window.__dominatus.Viewport.w, window.__dominatus.Viewport.h]);
  await page.mouse.click(w / 2, h / 2 + (74 * w) / vp[0]);
  await new Promise((r) => setTimeout(r, 2200));
  await dump(page, `[${tag}] jeu`);
  await page.screenshot({ path: `scripts/shot-${tag}-game.png` });

  // Minimap : centre de la minimap = (vw - 16 - 90, vh - 76 - 12 - 60) en design -> CSS = design (zoom 1:1 CSS)
  const mx = (vp[0] - 106) * (w / vp[0]);
  const my = (vp[1] - 148) * (h / vp[1]);
  const before = await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    return [gs.cameras.main.scrollX, gs.cameras.main.scrollY];
  });
  // zoomer d'abord pour que le pan ait un effet
  await page.mouse.move(w / 2, h / 2);
  await page.mouse.wheel({ deltaY: -600 });
  await new Promise((r) => setTimeout(r, 300));
  await page.mouse.click(mx, my);
  await new Promise((r) => setTimeout(r, 400));
  const after = await page.evaluate(() => {
    const gs = window.__dominatus.game.scene.getScene("GameScene");
    return [gs.cameras.main.scrollX, gs.cameras.main.scrollY];
  });
  console.log(`[${tag}] minimap: before=${JSON.stringify(before)} after=${JSON.stringify(after)} moved=${before[0] !== after[0] || before[1] !== after[1]}`);
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
  });
  await run(browser, 1473, 692, 1, "w1473-dpr1");
  await run(browser, 1473, 783, 1, "w1473-dpr1b");
  await run(browser, 1280, 720, 2, "w1280-dpr2");
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
