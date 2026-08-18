import Phaser from "phaser";
import { BuildingType, ResourceType } from "../types";
import { BUILDINGS } from "../config";

const BUILD_ORDER: BuildingType[] = [
  BuildingType.House,
  BuildingType.Farm,
  BuildingType.LumberMill,
  BuildingType.Warehouse,
  BuildingType.Market,
];

export class BuildPanel {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  buttons: { type: BuildingType; rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Rectangle }[];
  selectedType: BuildingType | null;
  onBuild: (type: BuildingType) => void;
  visible: boolean;

  constructor(scene: Phaser.Scene, onBuild: (type: BuildingType) => void) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.buttons = [];
    this.selectedType = null;
    this.onBuild = onBuild;
    this.visible = true;

    const panelBg = scene.add.rectangle(640, 695, 1280, 50, 0x111122, 0.9);
    this.container.add(panelBg);

    let xOff = 40;
    for (const type of BUILD_ORDER) {
      const def = BUILDINGS[type];

      const bg = scene.add.rectangle(xOff + 55, 695, 110, 40, 0x222244, 0.9);
      bg.setStrokeStyle(1, 0x444466);
      bg.setInteractive({ useHandCursor: true });

      const label = scene.add.text(xOff + 10, 686, def.name, {
        fontSize: "11px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      });

      const costStr = Object.entries(def.cost)
        .map(([r, a]) => `${a}${r === ResourceType.Wood ? "w" : r === ResourceType.Stone ? "s" : r === ResourceType.Gold ? "g" : "f"}`)
        .join(" ");

      const cost = scene.add.text(xOff + 10, 700, costStr, {
        fontSize: "9px",
        fontFamily: "monospace",
        color: "#888888",
      });

      bg.on("pointerdown", () => {
        this.selectedType = type;
        this.onBuild(type);
        this.updateSelection();
      });

      bg.on("pointerover", () => {
        if (this.selectedType !== type) {
          bg.setFillStyle(0x333366);
        }
      });

      bg.on("pointerout", () => {
        if (this.selectedType !== type) {
          bg.setFillStyle(0x222244);
        }
      });

      this.container.add([bg, label, cost]);
      this.buttons.push({ type, rect: bg, text: label, bg });
      xOff += 120;
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
