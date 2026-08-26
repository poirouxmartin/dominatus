import Phaser from "phaser";
import { RenderScale, Viewport, DESIGN_W, DESIGN_H } from "./ui/theme";
import { TitleScene } from "./scenes/TitleScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";

function applyRenderSize(): void {
  const dpr = window.devicePixelRatio || 1;
  const bw = Math.max(320, Math.round(window.innerWidth * dpr));
  const bh = Math.max(240, Math.round(window.innerHeight * dpr));
  const zoom = Math.max(0.6, Math.min(dpr, Math.min(bw / DESIGN_W, bh / DESIGN_H)));
  RenderScale.value = zoom;
  Viewport.w = bw / zoom;
  Viewport.h = bh / zoom;

  const game = (window as unknown as { __dominatus?: { game: Phaser.Game } }).__dominatus?.game;
  if (!game) {
    return;
  }
  if (game.scale.gameSize.width !== bw || game.scale.gameSize.height !== bh) {
    game.scale.setGameSize(bw, bh);
  }
  game.events.emit("renderscale", zoom);
}

const initialDpr = window.devicePixelRatio || 1;
const initialBw = Math.max(320, Math.round(window.innerWidth * initialDpr));
const initialBh = Math.max(240, Math.round(window.innerHeight * initialDpr));
RenderScale.value = Math.max(0.6, Math.min(initialDpr, Math.min(initialBw / DESIGN_W, initialBh / DESIGN_H)));
Viewport.w = initialBw / RenderScale.value;
Viewport.h = initialBh / RenderScale.value;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: initialBw,
  height: initialBh,
  backgroundColor: "#10131c",
  scene: [TitleScene, GameScene, UIScene],
  antialias: true,
  pixelArt: false,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  input: {
    activePointers: 2,
  },
};

const gameStarter = () => {
  const game = new Phaser.Game(config);

  (window as unknown as { __dominatus?: unknown }).__dominatus = { game, RenderScale, Viewport, DESIGN_W, DESIGN_H };

  game.events.once(Phaser.Core.Events.READY, applyRenderSize);
  window.addEventListener("resize", applyRenderSize);
};

// Attendre les polices web (max 1.5 s) pour éviter les métriques fallback.
Promise.race([
  typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise((r) => setTimeout(r, 1500)),
]).then(gameStarter);
