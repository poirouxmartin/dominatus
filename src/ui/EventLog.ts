import Phaser from "phaser";
import { GameState } from "../state/GameState";

export class EventLog {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container | null = null;
  visible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  toggle(state: GameState): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show(state);
    }
  }

  show(state: GameState): void {
    this.hide();
    this.visible = true;
    this.container = this.scene.add.container(0, 0);

    const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.5);
    overlay.setInteractive();
    this.container.add(overlay);

    const panelBg = this.scene.add.rectangle(640, 360, 500, 500, 0x0f0f1e, 0.97);
    panelBg.setStrokeStyle(2, 0xc9a84c, 0.8);
    this.container.add(panelBg);

    const title = this.scene.add.text(640, 130, "Event Log", {
      fontSize: "18px",
      fontFamily: "Georgia, serif",
      color: "#c9a84c",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const logEntries = state.eventLog.slice(0, 30);
    let yOff = 160;

    if (logEntries.length === 0) {
      const empty = this.scene.add.text(640, 360, "No events yet.", {
        fontSize: "12px",
        fontFamily: "Arial, sans-serif",
        color: "#555555",
      });
      empty.setOrigin(0.5);
      this.container.add(empty);
    }

    for (const entry of logEntries) {
      const t = this.scene.add.text(400, yOff, entry, {
        fontSize: "11px",
        fontFamily: "'Courier New', monospace",
        color: "#b0a890",
        wordWrap: { width: 460 },
      });
      this.container.add(t);
      yOff += 20;
      if (yOff > 600) break;
    }

    const closeBtn = this.scene.add.text(640, 590, "[ Close  \u232B ]", {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#888888",
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.hide());
    closeBtn.on("pointerover", () => closeBtn.setColor("#c9a84c"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#888888"));
    this.container.add(closeBtn);

    this.container.setDepth(160);
  }

  hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.visible = false;
  }
}
