import Phaser from "phaser";
import { BuildingType, ResourceType } from "../types";
import { BUILDINGS } from "../config";

const BUILD_ORDER: BuildingType[] = [
  BuildingType.House,
  BuildingType.Farm,
  BuildingType.LumberMill,
  BuildingType.Quarry,
  BuildingType.Sawmill,
  BuildingType.Brickyard,
  BuildingType.Warehouse,
  BuildingType.Market,
  BuildingType.TradingPost,
];

const SHORT: Record<ResourceType, string> = {
  [ResourceType.Wood]: "w",
  [ResourceType.Food]: "f",
  [ResourceType.Stone]: "s",
  [ResourceType.Gold]: "g",
  [ResourceType.Planks]: "p",
  [ResourceType.Bricks]: "b",
};

export class BuildPanel {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  buttons: { type: BuildingType; bg: Phaser.GameObjects.Rectangle }[];
  selectedType: BuildingType | null;
  onBuild: (type: BuildingType) => void;

  constructor(scene: Phaser.Scene, onBuild: (type: BuildingType) => void) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.buttons = [];
    this.selectedType = null;
    this.onBuild = onBuild;

    const panelBg = scene.add.rectangle(640, 695, 1280, 50, 0x111122, 0.9);
    this.container.add(panelBg);

    let xOff = 10;
    const btnW = 130;
    const gap = 4;

    for (const type of BUILD_ORDER) {
      const def = BUILDINGS[type];

      const bg = scene.add.rectangle(xOff + btnW / 2, 695, btnW, 42, 0x222244, 0.9);
      bg.setStrokeStyle(1, 0x444466);
      bg.setInteractive({ useHandCursor: true });

      const label = scene.add.text(xOff + 4, 685, def.name, {
        fontSize: "10px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      });

      const costStr = Object.entries(def.cost)
        .filter(([, a]) => a)
        .map(([r, a]) => `${a}${SHORT[r as ResourceType] || "?"}`)
        .join(" ");

      const cost = scene.add.text(xOff + 4, 699, costStr, {
        fontSize: "8px",
        fontFamily: "monospace",
        color: "#888888",
      });

      bg.on("pointerdown", () => {
        this.selectedType = type;
        this.onBuild(type);
        this.updateSelection();
      });

      bg.on("pointerover", () => {
        if (this.selectedType !== type) bg.setFillStyle(0x333366);
      });

      bg.on("pointerout", () => {
        if (this.selectedType !== type) bg.setFillStyle(0x222244);
      });

      this.container.add([bg, label, cost]);
      this.buttons.push({ type, bg });
      xOff += btnW + gap;
    }

    this.container.setDepth(100);
  }

  updateSelection(): void {
    for (const btn of this.buttons) {
      if (btn.type === this.selectedType) {
        btn.bg.setFillStyle(0x4a7c3f);
        btn.bg.setStrokeStyle(2, 0xc9a84c);
      } else {
        btn.bg.setFillStyle(0x222244);
        btn.bg.setStrokeStyle(1, 0x444466);
      }
    }
  }

  deselect(): void {
    this.selectedType = null;
    this.updateSelection();
  }

  destroy(): void {
    this.container.destroy();
  }
}
