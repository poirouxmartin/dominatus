import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TechBranch } from "../types";
import { TECH_TREE, TECH_BRANCH_LABELS, TECH_BRANCH_COLORS } from "../config";

export class TechPanel {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container | null = null;
  visible: boolean = false;
  texts: Phaser.GameObjects.Text[] = [];

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

    const panelBg = this.scene.add.rectangle(640, 360, 700, 520, 0x0f0f1e, 0.97);
    panelBg.setStrokeStyle(2, 0xc9a84c, 0.8);
    this.container.add(panelBg);

    const title = this.scene.add.text(640, 120, "Tech Tree", {
      fontSize: "22px",
      fontFamily: "Georgia, serif",
      color: "#c9a84c",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const researchText = this.scene.add.text(640, 150, `Research: ${Math.floor(state.resources.research)}`, {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#5588cc",
    });
    researchText.setOrigin(0.5);
    this.container.add(researchText);

    if (state.researchTarget) {
      const tech = TECH_TREE.find((t) => t.id === state.researchTarget);
      if (tech) {
        const pct = Math.floor((state.researchProgress / tech.cost) * 100);
        const progText = this.scene.add.text(640, 170, `Researching: ${tech.name} (${pct}%)`, {
          fontSize: "11px",
          fontFamily: "'Courier New', monospace",
          color: "#5588cc",
        });
        progText.setOrigin(0.5);
        this.container.add(progText);
      }
    }

    const branches = [TechBranch.Agriculture, TechBranch.Industry, TechBranch.Commerce, TechBranch.Civic];
    const branchX = [230, 400, 570, 740];

    for (let b = 0; b < branches.length; b++) {
      const branch = branches[b];
      const x = branchX[b];
      const color = TECH_BRANCH_COLORS[branch];

      const label = this.scene.add.text(x, 195, TECH_BRANCH_LABELS[branch], {
        fontSize: "13px",
        fontFamily: "Georgia, serif",
        color: color,
      });
      label.setOrigin(0.5);
      this.container.add(label);

      const branchTechs = TECH_TREE.filter((t) => t.branch === branch);

      for (let t = 0; t < branchTechs.length; t++) {
        const tech = branchTechs[t];
        const y = 240 + t * 100;
        const researched = state.researchedTechs.includes(tech.id);
        const available = state.canResearch(tech.id);
        const researching = state.researchTarget === tech.id;

        let bgColor = 0x1a1a2e;
        let borderColor = 0x333355;
        let textColor = "#666666";

        if (researched) {
          bgColor = 0x1a2a1e;
          borderColor = 0x6bba5c;
          textColor = "#6bba5c";
        } else if (researching) {
          bgColor = 0x1a1a3e;
          borderColor = 0x5588cc;
          textColor = "#5588cc";
        } else if (available) {
          bgColor = 0x1a1a2e;
          borderColor = 0xc9a84c;
          textColor = "#e8e0d0";
        }

        const cardBg = this.scene.add.rectangle(x, y, 140, 80, bgColor, 0.95);
        cardBg.setStrokeStyle(1, borderColor);
        this.container.add(cardBg);

        const nameText = this.scene.add.text(x, y - 20, tech.name, {
          fontSize: "11px",
          fontFamily: "Arial, sans-serif",
          color: textColor,
        });
        nameText.setOrigin(0.5);
        this.container.add(nameText);

        const statusIcon = researched ? "\u2713" : researching ? "\u25B6" : available ? "\u25CB" : "\u2716";
        const statusText = this.scene.add.text(x - 55, y - 32, statusIcon, {
          fontSize: "10px",
          color: textColor,
        });
        this.container.add(statusText);

        const costText = this.scene.add.text(x, y + 2, `${tech.cost} research`, {
          fontSize: "9px",
          fontFamily: "'Courier New', monospace",
          color: "#888888",
        });
        costText.setOrigin(0.5);
        this.container.add(costText);

        const descShort = tech.description.length > 40 ? tech.description.substring(0, 38) + "..." : tech.description;
        const descText = this.scene.add.text(x, y + 16, descShort, {
          fontSize: "8px",
          fontFamily: "Arial, sans-serif",
          color: "#666666",
          wordWrap: { width: 120 },
        });
        descText.setOrigin(0.5);
        this.container.add(descText);

        if (available && !researched) {
          cardBg.setInteractive({ useHandCursor: true });
          cardBg.on("pointerdown", () => {
            state.startResearch(tech.id);
            this.show(state);
          });
          cardBg.on("pointerover", () => cardBg.setFillStyle(0x222244));
          cardBg.on("pointerout", () => cardBg.setFillStyle(bgColor));
        }

        if (t < branchTechs.length - 1) {
          const line = this.scene.add.rectangle(x, y + 42, 2, 16, 0x333355);
          this.container.add(line);
        }
      }
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
