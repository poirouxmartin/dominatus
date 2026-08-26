import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { C, HEX, Viewport, label, plaque } from "./theme";

export class EventLog {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container | null = null;
  visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  toggle(state: GameState): void {
    if (this.visible) this.hide();
    else this.show(state);
  }

  show(state: GameState): void {
    this.hide();
    this.visible = true;
    const c = (this.container = this.scene.add.container(0, 0));

    const overlay = this.scene.add.rectangle(Viewport.w / 2, Viewport.h / 2, Viewport.w, Viewport.h, 0x000000, 0.5);
    overlay.setInteractive();
    c.add(overlay);

    c.add(plaque(this.scene, Viewport.w / 2, Viewport.h / 2, 520, 500, C.panel, C.panelEdge));

    const title = label(this.scene, Viewport.w / 2, 138, "CHRONICLE", {
      size: 20,
      display: true,
      color: HEX.brass,
      origin: 0.5,
    });
    c.add(title);

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, C.brassDark, 0.5);
    divider.lineBetween(400, 156, 880, 156);
    c.add(divider);

    const logEntries = state.eventLog.slice(0, 30);
    let yOff = 176;

    if (logEntries.length === 0) {
      const empty = label(this.scene, Viewport.w / 2, 360, "Nothing has happened yet.", {
        size: 12,
        color: HEX.dim,
        origin: 0.5,
      });
      c.add(empty);
    }

    for (const entry of logEntries) {
      const isTickPrefix = entry.startsWith("t");
      const tickEnd = entry.indexOf(":");
      let entryText = label(this.scene, 410, yOff, entry, {
        size: 10.5,
        mono: true,
        color: HEX.parchment,
        wordWrap: { width: 470 },
      });
      if (isTickPrefix && tickEnd > 1) {
        entryText.setColor(HEX.muted);
      }
      c.add(entryText);
      yOff += 19;
      if (yOff > 580) break;
    }

    const closeBtn = label(this.scene, Viewport.w / 2, 592, "Close  \u232B", {
      size: 12,
      color: HEX.muted,
      origin: 0.5,
    });
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.hide());
    closeBtn.on("pointerover", () => closeBtn.setColor(HEX.brass));
    closeBtn.on("pointerout", () => closeBtn.setColor(HEX.muted));
    c.add(closeBtn);

    c.setDepth(160);
    c.setAlpha(0);
    this.scene.tweens.add({ targets: c, alpha: 1, duration: 140 });
  }

  hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.visible = false;
  }
}
