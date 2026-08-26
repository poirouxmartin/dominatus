import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { C, HEX, RenderScale, Viewport, DA_ID, DA_NAME, label, plaque } from "../ui/theme";
import { AudioManager } from "../audio/AudioManager";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    const width = Viewport.w;
    const height = Viewport.h;
    const alignCamera = (): void => {
      const cam = this.cameras.main;
      if (!cam) return;
      cam.setZoom(RenderScale.value);
      cam.scrollX = Viewport.w / 2 - cam.width / 2;
      cam.scrollY = Viewport.h / 2 - cam.height / 2;
    };
    alignCamera();
    this.game.events.on("renderscale", alignCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("renderscale", alignCamera, this);
    });

    const audioInit = (): void => {
      AudioManager.inst.ensure();
      AudioManager.inst.startMusic("title");
    };
    this.input.once("pointerdown", audioInit);
    this.input.keyboard?.once("keydown", audioInit);

    this.add.rectangle(width / 2, height / 2, width, height, C.ink);

    this.drawHexLattice(width, height);
    this.spawnEmbers(width, height);

    const titleY = height / 2 - 44;
    const spaced = "DOMINATUS".split("").join(" ");

    const shadow = label(this, width / 2 + 3, titleY + 3, spaced, {
      size: 64,
      display: true,
      color: "#000000",
      origin: 0.5,
    });
    shadow.setAlpha(0.55);

    const title = label(this, width / 2, titleY, spaced, {
      size: 64,
      display: true,
      color: HEX.brass,
      origin: 0.5,
    });
    this.tweens.add({
      targets: [title, shadow],
      y: "-=6",
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const ruleTop = this.add.graphics();
    ruleTop.lineStyle(1, C.brassDark, 0.7);
    ruleTop.lineBetween(width / 2 - 190, titleY - 46, width / 2 + 190, titleY - 46);
    ruleTop.lineBetween(width / 2 - 190, titleY - 49, width / 2 + 190, titleY - 49);
    ruleTop.lineStyle(1, C.brassDark, 0.7);
    ruleTop.lineBetween(width / 2 - 190, titleY + 42, width / 2 + 190, titleY + 42);
    ruleTop.lineBetween(width / 2 - 190, titleY + 45, width / 2 + 190, titleY + 45);

    const subtitle = label(this, width / 2, titleY + 74, "Build your empire. Shape your destiny.", {
      size: 15,
      display: true,
      color: HEX.onInk,
      origin: 0.5,
      italic: true,
    });
    subtitle.setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 1500, delay: 500 });

    const hasSave = GameState.hasSave();
    const startY = height / 2 + 74;

    this.makeButton(width / 2, startY, hasSave ? "NEW GAME" : "BEGIN", () => {
      GameState.deleteSave();
      this.transition();
    });

    if (hasSave) {
      const loadBtn = this.makeButton(width / 2, startY + 56, "CONTINUE", () => this.transition());
      loadBtn.text.setAlpha(0);
      loadBtn.bg.setAlpha(0);
      this.tweens.add({ targets: [loadBtn.text, loadBtn.bg], alpha: 1, duration: 1000, delay: 900 });
    }

    label(
      this,
      width / 2,
      height - 34,
      "1-9 Build   |   RMB Demolish   |   T Trade   |   R Research   |   L Chronicle   |   Space Speed",
      { size: 10, mono: true, color: HEX.onInkDim, origin: 0.5 }
    );

    label(this, 14, height - 12, `DA ${DA_ID.replace("da", "")} \u2014 ${DA_NAME}`, {
      size: 11,
      display: true,
      color: HEX.brass,
      origin: { x: 0, y: 1 },
    });

    label(this, width - 14, height - 12, "v0.5.0 \u2014 Hexlands", {
      size: 10,
      mono: true,
      color: HEX.onInkDim,
      origin: { x: 1, y: 1 },
    });

    this.cameras.main.fadeIn(800, 11, 14, 21);
  }

  private makeButton(cx: number, cy: number, text: string, onClick: () => void): { text: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Graphics } {
    const w = 220;
    const h = 38;
    const bg = plaque(this, cx, cy, w, h, C.panelHi, C.panelEdge);

    const txt = label(this, cx, cy, text, {
      size: 14,
      display: true,
      color: HEX.brass,
      origin: 0.5,
    });

    const hit = this.add.rectangle(cx, cy, w, h, 0xffffff, 0.001);
    hit.setInteractive({ useHandCursor: true });

    hit.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x352b1a, 0.97);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
      bg.lineStyle(1, C.brassBright, 0.95);
      bg.strokeRoundedRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1, 6);
      txt.setColor(HEX.brassBright);
    });
    hit.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(C.panelHi, 0.95);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
      bg.lineStyle(1, C.panelEdge, 0.9);
      bg.strokeRoundedRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1, 6);
      txt.setColor(HEX.brass);
    });
    hit.on("pointerdown", () => {
      AudioManager.inst.playSfx("click");
      AudioManager.inst.stopMusic();
      onClick();
    });

    return { text: txt, bg };
  }

  private transition(): void {
    this.cameras.main.fadeOut(600, 11, 14, 21);
    this.time.delayedCall(600, () => this.scene.start("GameScene"));
  }

  private drawHexLattice(width: number, height: number): void {
    const g = this.add.graphics();
    const size = 44;
    const hw = Math.sqrt(3) * size;
    const vs = 1.5 * size;

    g.lineStyle(1, C.brass, 0.05);
    for (let row = -1; row * vs < height + size; row++) {
      for (let col = -1; col * hw < width + hw; col++) {
        const cx = col * hw + (row & 1 ? hw / 2 : 0) + hw / 2;
        const cy = row * vs + size;
        const pts: Phaser.Geom.Point[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 180) * (60 * i - 30);
          pts.push(new Phaser.Geom.Point(cx + size * Math.cos(a), cy + size * Math.sin(a)));
        }
        g.strokePoints(pts, true);
      }
    }

    const filled = this.add.graphics();
    for (let i = 0; i < 14; i++) {
      const cx = Phaser.Math.Between(30, width - 30);
      const cy = Phaser.Math.Between(30, height - 30);
      const s = Phaser.Math.Between(20, 60);
      const pts: Phaser.Geom.Point[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 180) * (60 * k - 30);
        pts.push(new Phaser.Geom.Point(cx + s * Math.cos(a), cy + s * Math.sin(a)));
      }
      filled.fillStyle(0xc9a84c, 0.025);
      filled.fillPoints(pts, true);
    }
  }

  private spawnEmbers(width: number, height: number): void {
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(0.8, 2.2);
      const ember = this.add.circle(x, y, r, C.brass, Phaser.Math.FloatBetween(0.15, 0.5));
      this.tweens.add({
        targets: ember,
        y: y - Phaser.Math.Between(60, 160),
        alpha: 0.04,
        x: x + Phaser.Math.Between(-24, 24),
        duration: Phaser.Math.Between(5000, 11000),
        repeat: -1,
        onRepeat: () => {
          ember.y = height + 10;
          ember.x = Phaser.Math.Between(0, width);
          ember.setAlpha(Phaser.Math.FloatBetween(0.15, 0.5));
        },
      });
    }
  }
}
