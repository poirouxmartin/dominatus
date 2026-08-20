import Phaser from "phaser";
import { BuildingType, ResourceType } from "../types";
import { GameState } from "../state/GameState";
import { BUILDINGS } from "../config";

const ALL_BUILD_ORDER: BuildingType[] = [
  BuildingType.House,
  BuildingType.Farm,
  BuildingType.Well,
  BuildingType.LumberMill,
  BuildingType.Forester,
  BuildingType.HuntingCabin,
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
  [ResourceType.Water]: "\u{1F4A7}",
};

const TILE_ICONS: Record<string, string> = {
  forest: "\u{1F332}",
  mountain: "\u{26F0}",
  farmable: "\u{1F33E}",
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

    const panelBg = scene.add.rectangle(640, 686, 1280, 68, 0x0a0a18, 0.94);
    panelBg.setStrokeStyle(1, 0xc9a84c, 0.25);
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

    let xOff = 4;
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
    const btnW = Math.min(100, Math.floor((1272 - totalBtns * gap) / totalBtns));

    for (const type of visibleTypes) {
      const def = BUILDINGS[type];
      const canAfford = state.hasResources(def.cost);

      const bgColor = canAfford ? 0x141428 : 0x181820;
      const bg = this.scene.add.rectangle(xOff + btnW / 2, 686, btnW, 60, bgColor, 0.95);
      bg.setStrokeStyle(1, canAfford ? 0x334455 : 0x222233);
      bg.setInteractive({ useHandCursor: true });

      const label = this.scene.add.text(xOff + btnW / 2, 674, def.name, {
        fontSize: "9px",
        fontFamily: "Arial, sans-serif",
        color: canAfford ? "#e8e0d0" : "#666677",
      });
      label.setOrigin(0.5, 0);

      const costParts: string[] = [];
      for (const [res, amt] of Object.entries(def.cost)) {
        if (!amt) continue;
        const resType = res as ResourceType;
        const hasEnough = (state.resources[resType] ?? 0) >= amt;
        costParts.push(`${ICONS[resType] || ""}${amt}`);
      }

      const tileReq = def.requiredTile ? ` ${TILE_ICONS[def.requiredTile] || ""}` : "";

      const cost = this.scene.add.text(xOff + btnW / 2, 688, costParts.join(" ") + tileReq, {
        fontSize: "8px",
        fontFamily: "'Courier New', monospace",
        color: canAfford ? "#888899" : "#444455",
      });
      cost.setOrigin(0.5, 0);

      bg.on("pointerdown", () => {
        this.selectedType = type;
        this.onBuild(type);
        this.updateSelection();
      });

      bg.on("pointerover", () => {
        if (this.selectedType !== type) bg.setFillStyle(0x1e1e38);
        this.showTooltip(type, xOff + btnW / 2, 648);
      });

      bg.on("pointerout", () => {
        if (this.selectedType !== type) bg.setFillStyle(bgColor);
        this.hideTooltip();
      });

      this.container.add([bg, label, cost]);
      this.buttons.push({ type, bg, label });
      xOff += btnW + gap;
    }

    for (const type of lockedTypes) {
      const def = BUILDINGS[type];

      const bg = this.scene.add.rectangle(xOff + btnW / 2, 686, btnW, 60, 0x111118, 0.6);
      bg.setStrokeStyle(1, 0x1a1a22);

      const label = this.scene.add.text(xOff + btnW / 2, 674, `\u{1F512} ${def.name}`, {
        fontSize: "9px",
        fontFamily: "Arial, sans-serif",
        color: "#333344",
      });
      label.setOrigin(0.5, 0);

      const techLabel = this.scene.add.text(xOff + btnW / 2, 688, def.requiredTech || "", {
        fontSize: "7px",
        fontFamily: "'Courier New', monospace",
        color: "#2a2a33",
      });
      techLabel.setOrigin(0.5, 0);

      this.container.add([bg, label, techLabel]);
      this.buttons.push({ type, bg, label });
      xOff += btnW + gap;
    }
  }

  private showTooltip(type: BuildingType, x: number, y: number): void {
    this.hideTooltip();
    const def = BUILDINGS[type];

    this.tooltip = this.scene.add.container(0, 0);

    const ttBg = this.scene.add.rectangle(x, y - 18, 280, 50, 0x0a0a18, 0.97);
    ttBg.setStrokeStyle(1, 0xc9a84c, 0.6);
    this.tooltip.add(ttBg);

    const nameText = this.scene.add.text(x, y - 30, def.name, {
      fontSize: "12px",
      fontFamily: "Georgia, serif",
      color: "#c9a84c",
    });
    nameText.setOrigin(0.5);
    this.tooltip.add(nameText);

    const desc = this.scene.add.text(x, y - 16, def.description, {
      fontSize: "9px",
      fontFamily: "Arial, sans-serif",
      color: "#b0a890",
      wordWrap: { width: 260 },
    });
    desc.setOrigin(0.5);
    this.tooltip.add(desc);

    let prodLine = "";
    if (def.production) {
      const outStr = Object.entries(def.production.output)
        .filter(([, a]) => a)
        .map(([r, a]) => `+${a} ${r}`)
        .join(", ");
      const inStr = Object.entries(def.production.input)
        .filter(([, a]) => a)
        .map(([r, a]) => `-${a} ${r}`)
        .join(", ");
      prodLine = `${inStr ? inStr + " \u2192 " : ""}${outStr} (${def.production.ticksPerCycle}t)`;
    } else if (def.populationCapacity > 0) {
      prodLine = `+${def.populationCapacity} pop capacity`;
    } else if (type === BuildingType.Forester) {
      prodLine = "Plants forest in radius 3";
    } else if (type === BuildingType.Well) {
      prodLine = "+3 water per cycle";
    } else if (type === BuildingType.Tower) {
      prodLine = "+10% raid defense, +5 happiness";
    } else if (type === BuildingType.Wall) {
      prodLine = "Blocks storms, +15% raid defense";
    } else if (type === BuildingType.Chapel) {
      prodLine = "+25 happiness";
    } else if (type === BuildingType.Garden) {
      prodLine = "+10 happiness";
    }

    if (prodLine) {
      const prodText = this.scene.add.text(x, y + 2, prodLine, {
        fontSize: "8px",
        fontFamily: "'Courier New', monospace",
        color: "#6bba5c",
      });
      prodText.setOrigin(0.5);
      this.tooltip.add(prodText);
    }

    if (def.requiredTile) {
      const tileNames: Record<string, string> = {
        forest: "Forest",
        mountain: "Mountain",
        farmable: "Farmable",
      };
      const tileText = this.scene.add.text(x, y + 14, `Must be placed on ${tileNames[def.requiredTile] || def.requiredTile} tile`, {
        fontSize: "8px",
        fontFamily: "Arial, sans-serif",
        color: "#f0a040",
      });
      tileText.setOrigin(0.5);
      this.tooltip.add(tileText);
    }

    if (def.requiredTech && this.state && !this.state.researchedTechs.includes(def.requiredTech)) {
      const lockText = this.scene.add.text(x, y + 14, `Requires tech: ${def.requiredTech}`, {
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
        btn.bg.setFillStyle(0x1e2e1e);
        btn.bg.setStrokeStyle(2, 0xc9a84c);
        btn.label.setColor("#c9a84c");
      } else {
        const isLocked = btn.label.text.startsWith("\u{1F512}");
        btn.bg.setFillStyle(isLocked ? 0x111118 : 0x141428);
        btn.bg.setStrokeStyle(1, isLocked ? 0x1a1a22 : 0x334455);
        btn.label.setColor(isLocked ? "#333344" : "#e8e0d0");
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
