import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, height / 2 - 40, "DOMINATUS", {
      fontSize: "64px",
      fontFamily: "Georgia, serif",
      color: "#c9a84c",
      stroke: "#1a1a2e",
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(
      width / 2,
      height / 2 + 30,
      "Prototype 0.1 — Core Loop",
      {
        fontSize: "18px",
        fontFamily: "Arial, sans-serif",
        color: "#888888",
      }
    );
    subtitle.setOrigin(0.5);

    const hint = this.add.text(
      width / 2,
      height / 2 + 80,
      "Coming soon: city building, production chains, survival",
      {
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        color: "#555555",
      }
    );
    hint.setOrigin(0.5);
  }
}
