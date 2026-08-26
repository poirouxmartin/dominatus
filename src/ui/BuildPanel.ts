import Phaser from "phaser";
import { BuildingType, ResourceType } from "../types";
import { GameState } from "../state/GameState";
import { BUILDINGS } from "../config";
import { C, HEX, Viewport, label, plaque } from "./theme";
import { drawIcon, type IconKey } from "./icons";
import { AudioManager } from "../audio/AudioManager";

const SHORTCUTS: Partial<Record<BuildingType, number>> = {
  [BuildingType.House]: 1,
  [BuildingType.Farm]: 2,
  [BuildingType.LumberMill]: 3,
  [BuildingType.Quarry]: 4,
  [BuildingType.Sawmill]: 5,
  [BuildingType.Brickyard]: 6,
  [BuildingType.Warehouse]: 7,
  [BuildingType.Market]: 8,
  [BuildingType.TradingPost]: 9,
};

const RES_ICON_KEYS: Partial<Record<ResourceType, IconKey>> = {
  [ResourceType.Wood]: ResourceType.Wood,
  [ResourceType.Food]: ResourceType.Food,
  [ResourceType.Stone]: ResourceType.Stone,
  [ResourceType.Gold]: ResourceType.Gold,
  [ResourceType.Planks]: ResourceType.Planks,
  [ResourceType.Bricks]: ResourceType.Bricks,
  [ResourceType.Research]: ResourceType.Research,
  [ResourceType.Leather]: ResourceType.Leather,
  [ResourceType.Tools]: ResourceType.Tools,
  [ResourceType.Water]: ResourceType.Water,
};

interface BuildButton {
  type: BuildingType;
  bg: Phaser.GameObjects.Graphics;
  hit: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  costGfx: Phaser.GameObjects.Graphics;
  extras: Phaser.GameObjects.Text[];
  locked: boolean;
  baseFill: number;
}

const BAR_H = 94;
const CARD_H = 62;
const TAB_H = 20;

const CATEGORIES: { key: string; label: string; types: BuildingType[] }[] = [
  {
    key: "village",
    label: "VILLAGE",
    types: [BuildingType.House, BuildingType.Farm, BuildingType.Fishery, BuildingType.Well, BuildingType.Bathhouse, BuildingType.Garden, BuildingType.Chapel],
  },
  {
    key: "production",
    label: "PRODUCTION",
    types: [
      BuildingType.LumberMill,
      BuildingType.Forester,
      BuildingType.HuntingCabin,
      BuildingType.Quarry,
      BuildingType.Sawmill,
      BuildingType.Brickyard,
      BuildingType.Tannery,
      BuildingType.Forge,
      BuildingType.Aqueduct,
    ],
  },
  {
    key: "trade",
    label: "COMMERCE",
    types: [BuildingType.Warehouse, BuildingType.Market, BuildingType.TradingPost, BuildingType.Amphitheater, BuildingType.Inn, BuildingType.Tavern],
  },
  {
    key: "knowledge",
    label: "KNOWLEDGE",
    types: [BuildingType.ResearchLab, BuildingType.Academy],
  },
  {
    key: "military",
    label: "MILITARY",
    types: [BuildingType.Wall, BuildingType.Tower, BuildingType.Barracks],
  },
];

function barTop(): number {
  return Viewport.h - BAR_H;
}

function barCY(): number {
  return Viewport.h - BAR_H / 2 + TAB_H / 2;
}

export class BuildPanel {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  private buttons: BuildButton[] = [];
  private tabObjects: Phaser.GameObjects.GameObject[] = [];
  private activeTab = 0;
  selectedType: BuildingType | null = null;
  private onBuild: (type: BuildingType) => void;
  private tooltip: Phaser.GameObjects.Container | null = null;
  private state: GameState | null = null;
  private barBg!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, onBuild: (type: BuildingType) => void) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.selectedType = null;
    this.onBuild = onBuild;

    const barBg = scene.add.graphics();
    this.barBg = barBg;
    this.paintBar(barBg);
    this.container.add(barBg);

    this.container.setDepth(100);
    scene.game.events.on("renderscale", this.onRenderScale, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.game.events.off("renderscale", this.onRenderScale, this);
    });
  }

  private paintBar(barBg: Phaser.GameObjects.Graphics): void {
    const top = barTop();
    barBg.clear();
    barBg.fillStyle(C.panel, 0.97);
    barBg.fillRect(0, top, Viewport.w, BAR_H);
    barBg.lineStyle(1, C.brassDark, 0.85);
    barBg.lineBetween(0, top + 0.5, Viewport.w, top + 0.5);
  }

  private onRenderScale(): void {
    if (!this.scene.scene.isActive()) return;
    this.paintBar(this.barBg);
    if (this.state) this.rebuild(this.state);
  }

  rebuild(state: GameState): void {
    this.state = state;
    for (const btn of this.buttons) {
      btn.bg.destroy();
      btn.hit.destroy();
      btn.label.destroy();
      btn.costGfx.destroy();
      for (const extra of btn.extras) extra.destroy();
    }
    this.buttons = [];
    for (const o of this.tabObjects) o.destroy();
    this.tabObjects = [];
    this.hideTooltip();

    // onglets de catÃ©gories
    const unlocked = (t: BuildingType) => {
      const def = BUILDINGS[t];
      return !def.requiredTech || state.researchedTechs.includes(def.requiredTech);
    };
    let tx = 12;
    const tabY = barTop() + TAB_H / 2;
    CATEGORIES.forEach((cat, i) => {
      const lockedCount = cat.types.filter((t) => !unlocked(t)).length;
      const active = i === this.activeTab;
      const txt = label(this.scene, tx, tabY, `${cat.label}${lockedCount > 0 ? `  (${lockedCount})` : ""}`, {
        size: 9,
        display: true,
        color: active ? HEX.brassBright : HEX.dim,
        origin: { x: 0, y: 0.5 },
        spacing: 1,
      });
      const hitW = txt.width + 20;
      const hit = this.scene.add.rectangle(tx + hitW / 2 - 4, tabY, hitW, TAB_H - 4, 0xffffff, 0.001);
      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerdown", () => {
        AudioManager.inst.playSfx("click");
        this.activeTab = i;
        if (this.state) this.rebuild(this.state);
      });
      hit.on("pointerover", () => {
        if (!active) txt.setColor(HEX.parchment);
      });
      hit.on("pointerout", () => {
        if (i !== this.activeTab) txt.setColor(HEX.dim);
      });
      this.container.add([txt, hit]);
      this.tabObjects.push(txt, hit);

      if (active) {
        const ul = this.scene.add.graphics();
        ul.lineStyle(1.5, C.brass, 0.9);
        ul.lineBetween(tx - 2, tabY + TAB_H / 2 - 2, tx + hitW - 8, tabY + TAB_H / 2 - 2);
        this.container.add(ul);
        this.tabObjects.push(ul);
      }
      tx += hitW + 8;
    });

    const cat = CATEGORIES[this.activeTab] ?? CATEGORIES[0];
    const visibleTypes = cat.types.filter(unlocked);
    const lockedTypes = cat.types.filter((t) => !unlocked(t));

    const totalBtns = visibleTypes.length + lockedTypes.length;
    const gap = 4;
    const btnW = Math.min(120, Math.floor((Viewport.w - 22 - totalBtns * gap) / Math.max(1, totalBtns)));
    let xOff = 8;
    const rowCY = barTop() + TAB_H + (BAR_H - TAB_H) / 2;

    for (const type of [...visibleTypes, ...lockedTypes]) {
      const locked = !visibleTypes.includes(type);
      this.buttons.push(this.makeButton(type, xOff + btnW / 2, rowCY, btnW, locked, state));
      xOff += btnW + gap;
    }

    this.updateSelection();
  }

  /** SÃ©lectionne un bÃ¢timent en basculant sur sa catÃ©gorie si besoin. */
  selectType(type: BuildingType): void {
    const catIdx = CATEGORIES.findIndex((c) => c.types.includes(type));
    if (catIdx >= 0 && catIdx !== this.activeTab) {
      this.activeTab = catIdx;
      if (this.state) this.rebuild(this.state);
    }
    this.selectedType = type;
    this.updateSelection();
  }

  private makeButton(
    type: BuildingType,
    cx: number,
    cy: number,
    w: number,
    locked: boolean,
    state: GameState
  ): BuildButton {
    const def = BUILDINGS[type];
    const canAfford = state.hasResources(def.cost);

    const baseFill = locked ? C.cardFillDim : canAfford ? C.cardFill : C.cardFillDim;
    const edge = locked ? C.panelEdge : canAfford ? C.brassDark : C.panelEdge;

    const bg = plaque(this.scene, cx, cy, w - 1, CARD_H, baseFill, edge);
    const labelColor = locked ? "#8d8062" : canAfford ? HEX.ivory : "#9a8c6c";
    const txt = label(this.scene, cx, cy - CARD_H / 2 + 8, def.name, {
      size: 9.5,
      color: labelColor,
      origin: { x: 0.5, y: 0 },
      wordWrap: { width: w - 10 },
      align: "center",
      lineSpacing: 1,
    });
    const maxW = w - 10;
    if (txt.width > maxW) {
      const ratio = maxW / txt.width;
      if (ratio >= 0.8) txt.setScale(ratio);
      else fitLabel(txt, maxW);
    }

    const shortcut = SHORTCUTS[type];
    if (shortcut && !locked) {
      const badge = label(this.scene, cx - w / 2 + 5, cy - CARD_H / 2 + 4, `${shortcut}`, {
        size: 9,
        mono: true,
        color: "#8a6d3b",
        origin: { x: 0, y: 0 },
      });
      this.container.add(badge);
      this.tabObjects.push(badge);
    }

    const costGfx = this.scene.add.graphics();
    const extras: Phaser.GameObjects.Text[] = [];
    if (!locked) {
      const nCost = Object.entries(def.cost).filter(([, a]) => a).length;
      const pitch = 20;
      let ix = cx - ((nCost - 1) * pitch) / 2 - 6;
      for (const [res, amt] of Object.entries(def.cost)) {
        if (!amt) continue;
        const resType = res as ResourceType;
        const hasEnough = (state.resources[resType] ?? 0) >= amt;
        drawIcon(costGfx, RES_ICON_KEYS[resType] ?? resType, ix, cy + 13, 5);
        const amtTxt = label(this.scene, ix + 7.5, cy + 13, `${amt}`, {
          size: 9.5,
          mono: true,
          color: hasEnough ? HEX.muted : HEX.bad,
          origin: { x: 0, y: 0.5 },
        });
        this.container.add(amtTxt);
        extras.push(amtTxt);
        ix += pitch;
      }
      if (def.requiredTile) {
        drawIcon(costGfx, def.requiredTile as IconKey, ix + 6, cy + 13, 5);
      }
    } else {
      drawIcon(costGfx, "lock", cx, cy + 11, 5.5);
    }

    const hit = this.scene.add.rectangle(cx, cy, w, CARD_H + 4, 0xffffff, 0.001);
    hit.setInteractive({ useHandCursor: !locked });

    hit.on("pointerdown", () => {
      if (locked) return;
      AudioManager.inst.playSfx("click");
      this.selectedType = type;
      this.onBuild(type);
      this.updateSelection();
    });

    hit.on("pointerover", () => {
      if (!locked && this.selectedType !== type) {
        bg.clear();
        repaint(bg, cx, cy, w - 1, CARD_H, C.panelHi, C.brass);
      }
      this.showTooltip(type, cx);
    });

    hit.on("pointerout", () => {
      this.updateSelection();
      this.hideTooltip();
    });

    this.container.add([bg, costGfx, txt, hit]);
    return { type, bg, hit, label: txt, costGfx, extras, locked, baseFill };
  }

  private showTooltip(type: BuildingType, cx: number): void {
    this.hideTooltip();
    if (!this.state) return;
    const def = BUILDINGS[type];
    const locked = !!def.requiredTech && !this.state.researchedTechs.includes(def.requiredTech);

    const W = 320;
    const x = Phaser.Math.Clamp(cx, 10 + W / 2, Viewport.w - 10 - W / 2);
    const yBottom = Viewport.h - 86;

    const nameText = label(this.scene, 0, 0, def.name.toUpperCase(), {
      size: 13,
      display: true,
      color: HEX.brass,
      origin: { x: 0.5, y: 0 },
    });
    const desc = label(this.scene, 0, 0, def.description, {
      size: 9.5,
      color: HEX.parchment,
      origin: { x: 0.5, y: 0 },
      wordWrap: { width: W - 36 },
      align: "center",
    });
    const parts: Phaser.GameObjects.Text[] = [nameText, desc];

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
      prodLine = `${inStr ? inStr + "  \u2192  " : ""}${outStr}   (${def.production.ticksPerCycle}t)`;
      if (type === BuildingType.Bathhouse) {
        prodLine = "-2 water/t each \u2192 +12 happiness (while supplied)";
      } else if (type === BuildingType.Amphitheater) {
        prodLine = "-5 gold/5t \u2192 +20 happiness (+8 each extra, while funded)";
      } else if (type === BuildingType.Barracks) {
        prodLine = "-1 tool, -1 leather/5t \u2192 +10% raid defense each";
      }
    } else if (def.populationCapacity > 0) {
      prodLine = `Houses ${def.populationCapacity} settlers`;
    } else if (type === BuildingType.Forester) {
      prodLine = "Plants forest nearby";
    } else if (type === BuildingType.Tower) {
      prodLine = "+10% raid defense, +5 happiness";
    } else if (type === BuildingType.Wall) {
      prodLine = "+15% raid defense, blocks storms";
    } else if (type === BuildingType.Chapel) {
      prodLine = "Happiness: +25 first, +10 each extra";
    } else if (type === BuildingType.Garden) {
      prodLine = "+10 happiness each";
    } else if (type === BuildingType.Inn) {
      prodLine = "Happiness: +15 first, +6 each extra \u00b7 +5 trade";
    } else if (type === BuildingType.Tavern) {
      prodLine = "Happiness: +20 first, +8 each extra \u00b7 +5 trade";
    } else if (type === BuildingType.Warehouse) {
      prodLine = "+200 storage";
    }

    let prodText: Phaser.GameObjects.Text | null = null;
    if (prodLine) {
      prodText = label(this.scene, 0, 0, prodLine, {
        size: 9.5,
        mono: true,
        color: HEX.good,
        origin: { x: 0.5, y: 0 },
      });
      if (prodText) parts.push(prodText);
    }

    let footText: Phaser.GameObjects.Text | null = null;
    if (locked && def.requiredTech) {
      footText = label(this.scene, 0, 0, `Requires tech: ${def.requiredTech}`, {
        size: 9.5,
        color: HEX.bad,
        origin: { x: 0.5, y: 0 },
      });
    } else if (def.requiredTile) {
      const tileNames: Record<string, string> = {
        forest: "Forest",
        mountain: "Mountain",
        farmable: "Farmable land",
      };
      footText = label(this.scene, 0, 0, `Must be placed on ${tileNames[def.requiredTile]}`, {
        size: 9.5,
        color: HEX.warn,
        origin: { x: 0.5, y: 0 },
      });
    }
    if (footText) parts.push(footText);

    const padTop = 13;
    const padBottom = 12;
    let h = padTop + padBottom;
    parts.forEach((p, i) => {
      h += p.height + (i < parts.length - 1 ? 7 : 0);
    });

    this.tooltip = this.scene.add.container(0, 0);
    const bg = plaque(this.scene, x, yBottom - h / 2, W, h, C.tooltipBg, C.panelEdge);
    this.tooltip.add(bg);

    let cy = yBottom - h + padTop;
    nameText.setPosition(x, cy);
    cy += nameText.height + 8;
    desc.setPosition(x, cy);
    cy += desc.height + 7;
    if (prodText) {
      prodText.setPosition(x, cy);
      cy += prodText.height + 7;
    }
    if (footText) footText.setPosition(x, cy);

    for (const p of parts) this.tooltip.add(p);
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
      const selected = btn.type === this.selectedType;
      const cx = btn.hit.x;
      const cy = btn.hit.y;
      const w = btn.hit.width - 1;
      const h = CARD_H;
      repaint(btn.bg, cx, cy, w, h, selected ? C.panelHi : btn.baseFill, selected ? C.brassBright : btn.locked ? C.panelEdge : C.panelEdge);
      btn.label.setColor(selected ? HEX.brassBright : btn.locked ? "#8d8062" : HEX.ivory);
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

function repaint(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: number,
  edge: number
): void {
  g.clear();
  g.fillStyle(fill, 0.95);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
  g.lineStyle(1, edge, 0.9);
  g.strokeRoundedRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1, 6);
}

function fitLabel(t: Phaser.GameObjects.Text, maxW: number): void {
  if (t.width <= maxW) return;
  const full = t.text;
  let cut = full.length;
  while (cut > 1 && t.width > maxW) {
    cut--;
    t.setText(full.slice(0, cut).trimEnd() + "\u2026");
  }
}