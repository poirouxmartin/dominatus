import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { ResourceType, Season } from "../types";

const SEASON_COLORS: Record<string, string> = {
  [Season.Spring]: "#5cb85c",
  [Season.Summer]: "#f0ad4e",
  [Season.Autumn]: "#d9534f",
  [Season.Winter]: "#5bc0de",
};

const SEASON_LABELS: Record<string, string> = {
  [Season.Spring]: "Spring",
  [Season.Summer]: "Summer",
  [Season.Autumn]: "Autumn",
  [Season.Winter]: "Winter",
};

const RES_ICONS: Record<ResourceType, string> = {
  [ResourceType.Wood]: "🪵",
  [ResourceType.Food]: "🌾",
  [ResourceType.Stone]: "🪨",
  [ResourceType.Gold]: "💰",
};

export class HUD {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  resourceTexts: Record<ResourceType, Phaser.GameObjects.Text> = {} as any;
  seasonText: Phaser.GameObjects.Text;
  popText: Phaser.GameObjects.Text;
  happinessText: Phaser.GameObjects.Text;
  speedText: Phaser.GameObjects.Text;
  infoText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);

    const bg = scene.add.rectangle(640, 22, 1280, 44, 0x1a1a2e, 0.85);
    this.container.add(bg);

    let xOff = 20;
    for (const res of Object.values(ResourceType)) {
      const icon = scene.add.text(xOff, 10, RES_ICONS[res], { fontSize: "18px" });
      const txt = scene.add.text(xOff + 22, 12, "0", {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#ffffff",
      });
      this.resourceTexts[res] = txt;
      this.container.add([icon, txt]);
      xOff += 100;
    }

    this.seasonText = scene.add.text(xOff + 20, 12, "", {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
    });
    this.container.add(this.seasonText);

    this.popText = scene.add.text(xOff + 160, 12, "", {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
    });
    this.container.add(this.popText);

    this.happinessText = scene.add.text(xOff + 280, 12, "", {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
    });
    this.container.add(this.happinessText);

    this.speedText = scene.add.text(1220, 12, "▶ 1x", {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#c9a84c",
    });
    this.container.add(this.speedText);

    this.infoText = scene.add.text(640, 700, "", {
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
      color: "#cccccc",
      align: "center",
    });
    this.infoText.setOrigin(0.5);
    this.container.add(this.infoText);

    this.container.setDepth(100);
  }

  update(state: GameState): void {
    for (const res of Object.values(ResourceType)) {
      const val = Math.floor(state.resources[res]);
      this.resourceTexts[res].setText(`${val}`);
    }

    const sColor = SEASON_COLORS[state.season] || "#ffffff";
    this.seasonText.setText(`${SEASON_LABELS[state.season] || state.season} (t${state.seasonTick})`);
    this.seasonText.setColor(sColor);

    this.popText.setText(`Pop: ${Math.floor(state.population.total)}`);
    this.happinessText.setText(`Happy: ${Math.floor(state.population.happiness)}%`);

    const speedLabels = ["▶ 1x", "▶▶ 2x", "▶▶▶ 3x"];
    this.speedText.setText(speedLabels[state.gameSpeed - 1] || "▶ 1x");

    if (state.gameOver) {
      this.infoText.setText("GAME OVER — Your people have perished.");
      this.infoText.setColor("#ff4444");
    } else if (state.season === Season.Winter) {
      this.infoText.setText("❄ Winter — Food production reduced. Ensure enough reserves!");
      this.infoText.setColor("#5bc0de");
    } else {
      this.infoText.setText("");
    }
  }

  setInfo(msg: string, color: string = "#cccccc"): void {
    this.infoText.setText(msg);
    this.infoText.setColor(color);
  }

  destroy(): void {
    this.container.destroy();
  }
}
