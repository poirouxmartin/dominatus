import Phaser from "phaser";
import { GameState } from "../state/GameState";

export class TitleScene extends Phaser.Scene {
  particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f1e);

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
      const star = this.add.circle(x, y, size, 0xc9a84c, alpha);
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.3 },
        duration: Phaser.Math.Between(2000, 5000),
        yoyo: true,
        repeat: -1,
      });
    }

    const titleShadow = this.add.text(width / 2 + 2, height / 2 - 62, "DOMINATUS", {
      fontSize: "72px",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: "#000000",
    });
    titleShadow.setOrigin(0.5);
    titleShadow.setAlpha(0.4);

    const title = this.add.text(width / 2, height / 2 - 64, "DOMINATUS", {
      fontSize: "72px",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: "#c9a84c",
      stroke: "#1a1a2e",
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: height / 2 - 60,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const divider = this.add.rectangle(width / 2, height / 2, 200, 1, 0xc9a84c, 0.4);

    const subtitle = this.add.text(width / 2, height / 2 + 30, "Build your empire. Shape your destiny.", {
      fontSize: "16px",
      fontFamily: "Georgia, serif",
      color: "#b0a890",
      fontStyle: "italic",
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 1500, delay: 500 });

    const hasSave = GameState.hasSave();

    const startText = this.add.text(width / 2, height / 2 + 90, hasSave ? "[ NEW GAME ]" : "[ CLICK TO BEGIN ]", {
      fontSize: "18px",
      fontFamily: "'Courier New', monospace",
      color: "#c9a84c",
      fontStyle: "bold",
    });
    startText.setOrigin(0.5);
    startText.setInteractive({ useHandCursor: true });
    startText.setAlpha(0);
    this.tweens.add({ targets: startText, alpha: 1, duration: 800, delay: 400 });
    this.tweens.add({
      targets: startText,
      scale: { from: 1, to: 1.06 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 1200,
    });

    startText.on("pointerdown", () => {
      GameState.deleteSave();
      this.cameras.main.fadeOut(600, 15, 15, 30);
      this.time.delayedCall(600, () => {
        this.scene.start("GameScene");
      });
    });

    startText.on("pointerover", () => {
      startText.setColor("#f0d070");
    });
    startText.on("pointerout", () => {
      startText.setColor("#c9a84c");
    });

    if (hasSave) {
      const loadText = this.add.text(width / 2, height / 2 + 122, "[ Load Game ]", {
        fontSize: "13px",
        fontFamily: "'Courier New', monospace",
        color: "#8a7a5a",
      });
      loadText.setOrigin(0.5);
      loadText.setInteractive({ useHandCursor: true });
      loadText.setAlpha(0);
      this.tweens.add({ targets: loadText, alpha: 1, duration: 1000, delay: 900 });

      loadText.on("pointerover", () => loadText.setColor("#c9a84c"));
      loadText.on("pointerout", () => loadText.setColor("#8a7a5a"));

      loadText.on("pointerdown", () => {
        this.cameras.main.fadeOut(600, 15, 15, 30);
        this.time.delayedCall(600, () => {
          this.scene.start("GameScene");
        });
      });
    }

    const version = this.add.text(width - 16, height - 16, "v0.3.0 — Prototype", {
      fontSize: "10px",
      fontFamily: "'Courier New', monospace",
      color: "#444444",
    });
    version.setOrigin(1, 1);

    const controls = this.add.text(width / 2, height - 40, "1-9: Build  |  RMB: Demolish  |  T: Trade  |  R: Research  |  F5: Save  |  F9: Load", {
      fontSize: "10px",
      fontFamily: "'Courier New', monospace",
      color: "#555555",
    });
    controls.setOrigin(0.5);

    this.cameras.main.fadeIn(800, 15, 15, 30);
  }
}
