import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TechBranch } from "../types";
import { TECH_TREE, TECH_BRANCH_LABELS } from "../config";
import { C, HEX, Viewport, label, plaque } from "./theme";

const BRANCH_COLORS_HEX: Record<TechBranch, string> = {
  [TechBranch.Agriculture]: "#8fc07a",
  [TechBranch.Industry]: "#c08a52",
  [TechBranch.Commerce]: "#e0bc55",
  [TechBranch.Civic]: "#7aa5c9",
  [TechBranch.Military]: "#d07038",
};

const BRANCH_COLORS_NUM: Record<TechBranch, number> = {
  [TechBranch.Agriculture]: 0x8fc07a,
  [TechBranch.Industry]: 0xc08a52,
  [TechBranch.Commerce]: 0xe0bc55,
  [TechBranch.Civic]: 0x7aa5c9,
  [TechBranch.Military]: 0xd07038,
};

export class TechPanel {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container | null = null;
  visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  toggle(state: GameState): void {
    if (this.visible) this.hide();
    else this.show(state, true);
  }

  show(state: GameState, animate: boolean = false): void {
    this.hide();
    this.visible = true;
    const c = this.container = this.scene.add.container(0, 0);

    const overlay = this.scene.add.rectangle(Viewport.w / 2, Viewport.h / 2, Viewport.w, Viewport.h, 0x000000, 0.5);
    overlay.setInteractive();
    c.add(overlay);

    const W = 900;
    const H = 520;
    c.add(plaque(this.scene, Viewport.w / 2, Viewport.h / 2, W, H, C.panel, C.panelEdge));

    const innerLine = this.scene.add.graphics();
    innerLine.lineStyle(1, C.brassDark, 0.4);
    innerLine.strokeRoundedRect(Viewport.w / 2 - W / 2 + 8, Viewport.h / 2 - H / 2 + 8, W - 16, H - 16, 8);
    c.add(innerLine);

    const title = label(this.scene, Viewport.w / 2, Viewport.h / 2 - 230, "TECHNOLOGY", {
      size: 22,
      display: true,
      color: HEX.brass,
      origin: 0.5,
    });
    c.add(title);

    const researchText = label(this.scene, Viewport.w / 2, Viewport.h / 2 - 202, `Research points: ${Math.floor(state.resources.research)}`, {
      size: 12,
      mono: true,
      color: HEX.info,
      origin: 0.5,
    });
    c.add(researchText);

    if (state.researchTarget) {
      const tech = TECH_TREE.find((t) => t.id === state.researchTarget);
      if (tech) {
        const pct = Math.floor((state.researchProgress / tech.cost) * 100);
        const progText = label(this.scene, Viewport.w / 2, Viewport.h / 2 - 182, `Researching ${tech.name} \u2014 ${pct}%`, {
          size: 11,
          color: HEX.muted,
          origin: 0.5,
        });
        c.add(progText);
      }
    }

    const branches = [
      TechBranch.Agriculture,
      TechBranch.Industry,
      TechBranch.Commerce,
      TechBranch.Civic,
      TechBranch.Military,
    ];

    branches.forEach((branch, b) => {
      const x = Viewport.w / 2 + (b - 2) * 174;
      const colorHex = BRANCH_COLORS_HEX[branch];
      const colorNum = BRANCH_COLORS_NUM[branch];

      const labelTxt = label(this.scene, x, Viewport.h / 2 - 152, TECH_BRANCH_LABELS[branch].toUpperCase(), {
        size: 11,
        display: true,
        color: colorHex,
        origin: 0.5,
      });
      c.add(labelTxt);

      const underline = this.scene.add.graphics();
      underline.lineStyle(1.5, colorNum, 0.7);
      underline.lineBetween(x - 48, Viewport.h / 2 - 142, x + 48, Viewport.h / 2 - 142);
      c.add(underline);

      const branchTechs = TECH_TREE.filter((t) => t.branch === branch);

      branchTechs.forEach((tech, t) => {
        const y = Viewport.h / 2 - 98 + t * 96;
        const researched = state.researchedTechs.includes(tech.id);
        const available = state.canResearch(tech.id);
        const researching = state.researchTarget === tech.id;

        let bgFill: number = C.tooltipBg;
        let edge: number = C.panelEdge;
        let textColor: string = HEX.dim;

        if (researched) {
          bgFill = 0x1e281a;
          edge = colorNum;
          textColor = colorHex;
        } else if (researching) {
          bgFill = 0x1a2230;
          edge = C.info;
          textColor = HEX.info;
        } else if (available) {
          bgFill = C.panelHi;
          edge = C.brassDark;
          textColor = HEX.ivory;
        }

        const cardW = 152;
        const cardH = 82;
        const cardBg = plaque(this.scene, x, y, cardW, cardH, bgFill, edge);

        const nameText = label(this.scene, x, y - cardH / 2 + 12, tech.name, {
          size: 11,
          color: textColor,
          origin: { x: 0.5, y: 0 },
        });
        if (nameText.width > cardW - 10) nameText.setScale(Math.min(1, (cardW - 10) / nameText.width));
        c.add(nameText);

        const statusIcon = researched ? "\u2713" : researching ? "\u25B6" : available ? "\u25CB" : "\u2715";
        const statusText = label(this.scene, x - cardW / 2 + 9, y - cardH / 2 + 7, statusIcon, {
          size: 10,
          color: textColor,
        });
        c.add(statusText);

        const costText = label(this.scene, x, y - 4, `${tech.cost} RP`, {
          size: 9,
          mono: true,
          color: researched ? colorHex : HEX.muted,
          origin: { x: 0.5, y: 0 },
        });
        c.add(costText);

        const descShort = tech.description.length > 52 ? tech.description.substring(0, 50) + "\u2026" : tech.description;
        const descText = label(this.scene, x, y + 10, descShort, {
          size: 8,
          color: HEX.parchment,
          origin: { x: 0.5, y: 0 },
          wordWrap: { width: cardW - 18 },
          align: "center",
        });
        c.add(descText);

        if (available && !researched) {
          const hit = this.scene.add.rectangle(x, y, cardW, cardH, 0xffffff, 0.001);
          hit.setInteractive({ useHandCursor: true });
          hit.on("pointerdown", () => {
            state.startResearch(tech.id);
            this.show(state);
          });
          hit.on("pointerover", () => {
            cardBg.clear();
            cardBg.fillStyle(C.panelHi, 0.97);
            cardBg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 6);
            cardBg.lineStyle(1, C.brassBright, 0.95);
            cardBg.strokeRoundedRect(x - cardW / 2 + 0.5, y - cardH / 2 + 0.5, cardW - 1, cardH - 1, 6);
          });
          hit.on("pointerout", () => {
            cardBg.clear();
            cardBg.fillStyle(bgFill, 0.95);
            cardBg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 6);
            cardBg.lineStyle(1, edge, 0.9);
            cardBg.strokeRoundedRect(x - cardW / 2 + 0.5, y - cardH / 2 + 0.5, cardW - 1, cardH - 1, 6);
          });
          c.add(hit);
        }

        if (t < branchTechs.length - 1) {
          const line = this.scene.add.rectangle(x, y + cardH / 2 + 5, 1.6, 6, colorNum, 0.55);
          c.add(line);
        }
      });
    });

    const closeBtn = label(this.scene, Viewport.w / 2, Viewport.h / 2 + 240, "Close  \u232B", {
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
    if (animate) {
      c.setAlpha(0);
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 140 });
    }
  }

  hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.visible = false;
  }
}
