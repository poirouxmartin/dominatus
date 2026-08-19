import Phaser from "phaser";
import { BuildingType, ResourceType } from "../types";
import { GameState } from "../state/GameState";
import { BUILDINGS } from "../config";

const ALL_BUILD_ORDER: BuildingType[] = [
  BuildingType.House,
  BuildingType.Farm,
  BuildingType.LumberMill,
  BuildingType.Quarry,
  BuildingType.Sawmill,
  BuildingType.Brickyard,
  BuildingType.Warehouse,
  BuildingType.Market,
  BuildingType.TradingPost,
  BuildingType.Tannery,
  BuildingType.ResearchLab,
  BuildingType.Garden,
  BuildingType.Inn,
  BuildingType.Tavern,
  BuildingType.Academy,
  BuildingType.Wall,
  BuildingType.Tower,
  BuildingType.Forge,
  BuildingType.Chapel,
];

const ICONS: Record<ResourceType, string> = {
  [ResourceType.Wood]: "\u{1FAB5}",
  [ResourceType.Food]: "\u{1F33E}",
  [ResourceType.Stone]: "\u{1FAA8}",
  [ResourceType.Gold]: "\u{1F4B0}",
  [ResourceType.Planks]: "\u{1FAA3}",
  [ResourceType.Bricks]: "\u{1F9F1}",
  [ResourceType.Research]: "\u{1F4D6}",
  [ResourceType.Leather]: "\u{1F9F6}",
  [ResourceType.Tools]: "\u{1F6E0}",
};

export class BuildPanel {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  buttons: { type: BuildingType; bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[];
  selectedType: BuildingType | null;
  onBuild: (type: BuildingType) => void;
  tooltip: Phaser.GameObjects.Container | null = null;
  state: GameState | null = null;

  constructor(scene: Phaser.Scene, onBuild: (type: BuildingType) => void) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.buttons = [];
    this.selectedType = null;
    this.onBuild = onBuild;

    const panelBg = scene.add.rectangle(640, 695, 1280, 50, 0x0f0f1e, 0.92);
    panelBg.setStrokeStyle(1, 0xc9a84c, 0.2);
    this.container.add(panelBg);

    this.container.setDepth(100);
  }

  rebuild(state: GameState): void {
    this.state = state;
    for (const btn of this.buttons) {
      btn.bg.destroy();
      btn.label.destroy();
    }
    this.buttons = [];
    this.hideTooltip();

    let xOff = 6;
    const gap = 2;

    const visibleTypes = ALL_BUILD_ORDER.filter((type) => {
      const def = BUILDINGS[type];
      if (!def.requiredTech) return true;
      return state.researchedTechs.includes(def.requiredTech);
    });

    const lockedTypes = ALL_BUILD_ORDER.filter((type) => {
      const def = BUILDINGS[type];
      if (!def.requiredTech) return false;
      return !state.researchedTechs.includes(def.requiredTech);
    });

    const totalBtns = visibleTypes.length + lockedTypes.length;
    const btnW = Math.min(120, Math.floor((1268 - totalBtns * gap) / totalBtns));

    for (const type of visibleTypes) {
      const def = BUILDINGS[type];

      const bg = this.scene.add.rectangle(xOff + btnW / 2, 695, btnW, 42, 0x1a1a2e, 0.95);
      bg.setStrokeStyle(1, 0x333355);
      bg.setInteractive({ useHandCursor: true });

      const label = this.scene.add.text(xOff + 4, 686, def.name, {
        fontSize: "9px",
        fontFamily: "Arial, sans-serif",
        color: "#e8e0d0",
      });

      const costParts = Object.entries(def.cost)
        .filter(([, a]) => a)
        .map(([r, a]) => {
          const res = r as ResourceType;
          return `${ICONS[res] || ""}${a}`;
        });

      const cost = this.scene.add.text(xOff + 4, 700, costParts.join(" "), {
        fontSize: "8px",
        fontFamily: "'Courier New', monospace",
        color: "#888888",
      });

      bg.on("pointerdown", () => {
        this.selectedType = type;
        this.onBuild(type);
        this.updateSelection();
      });

      bg.on("pointerover", () => {
        if (this.selectedType !== type) bg.setFillStyle(0x222240);
        this.showTooltip(type, xOff + btnW / 2, 668);
      });

      bg.on("pointerout", () => {
        if (this.selectedType !== type) bg.setFillStyle(0x1a1a2e);
        this.hideTooltip();
      });

      this.container.add([bg, label, cost]);
      this.buttons.push({ type, bg, label });
      xOff += btnW + gap;
    }

    for (const type of lockedTypes) {
      const def = BUILDINGS[type];

      const bg = this.scene.add.rectangle(xOff + btnW / 2, 695, btnW, 42, 0x1a1a1a, 0.6);
      bg.setStrokeStyle(1, 0x222222);

      const label = this.scene.add.text(xOff + 4, 686, `\u{1F512} ${def.name}`, {
        fontSize: "9px",
        fontFamily: "Arial, sans-serif",
        color: "#444444",
      });

      this.container.add([bg, label]);
      this.buttons.push({ type, bg, label });
      xOff += btnW + gap;
    }
  }

  private showTooltip(type: BuildingType, x: number, y: number): void {
    this.hideTooltip();
    const def = BUILDINGS[type];

    this.tooltip = this.scene.add.container(0, 0);

    const bg = this.scene.add.rectangle(x, y - 20, 260, 40, 0x0f0f1e, 0.95);
    bg.setStrokeStyle(1, 0xc9a84c, 0.5);
    this.tooltip.add(bg);

    const desc = this.scene.add.text(x, y - 30, def.description, {
      fontSize: "10px",
      fontFamily: "Arial, sans-serif",
      color: "#b0a890",
      wordWrap: { width: 240 },
    });
    desc.setOrigin(0.5);
    this.tooltip.add(desc);

    if (def.production) {
      const prodStr = Object.entries(def.production.output)
        .filter(([, a]) => a)
        .map(([r, a]) => `+${a} ${r}`)
        .join(", ");
      const inputStr = Object.entries(def.production.input)
        .filter(([, a]) => a)
        .map(([r, a]) => `-${a} ${r}`)
        .join(", ");

      const prodText = this.scene.add.text(x, y - 16, `${inputStr ? inputStr + " \u2192 " : ""}${prodStr} (${def.production.ticksPerCycle}t)`, {
        fontSize: "9px",
        fontFamily: "'Courier New', monospace",
        color: "#6bba5c",
      });
      prodText.setOrigin(0.5);
      this.tooltip.add(prodText);
    }

    if (def.requiredTech && this.state && !this.state.researchedTechs.includes(def.requiredTech)) {
      const lockText = this.scene.add.text(x, y - 4, `Requires tech: ${def.requiredTech}`, {
        fontSize: "8px",
        fontFamily: "Arial, sans-serif",
        color: "#d9534f",
      });
      lockText.setOrigin(0.5);
      this.tooltip.add(lockText);
    }

    this.tooltip.setDepth(110);
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  updateSelection(): void {
    for (const btn of this.buttons) {
      if (btn.type === this.selectedType) {
        btn.bg.setFillStyle(0x2a4a2a);
        btn.bg.setStrokeStyle(2, 0xc9a84c);
        btn.label.setColor("#c9a84c");
      } else {
        const isLocked = btn.label.text.startsWith("\u{1F512}");
        btn.bg.setFillStyle(isLocked ? 0x1a1a1a : 0x1a1a2e);
        btn.bg.setStrokeStyle(1, isLocked ? 0x222222 : 0x333355);
        btn.label.setColor(isLocked ? "#444444" : "#e8e0d0");
      }
    }
  }

  deselect(): void {
    this.selectedType = null;
    this.updateSelection();
    this.hideTooltip();
  }

  destroy(): void {
    this.hideTooltip();
    this.container.destroy();
  }
}
