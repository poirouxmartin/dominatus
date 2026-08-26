import Phaser from "phaser";

export const DESIGN_W = 1280;
export const DESIGN_H = 720;

/** Hauteurs des barres d'interface (partagées HUD / BuildPanel / TileMap / GameScene). */
export const TOP_BAR_H = 68;
export const BUILD_BAR_H = 118;

/**
 * Zoom designâ†’backing. Mis Ã  jour par main.ts (backing = fenÃªtre Ã— DPR,
 * donc le rendu est toujours 1:1 avec les pixels physiques).
 */
export const RenderScale = { value: 1 };

/** Zone visible en unitÃ©s design (â‰¥ 1280Ã—720). L'UI s'ancre sur ses bords. */
export const Viewport = { w: DESIGN_W, h: DESIGN_H };

// ---------------------------------------------------------------------------
// Directions artistiques (sÃ©lection via ?da=1|2|3)
// ---------------------------------------------------------------------------

export interface Palette {
  ink: number;
  panel: number;
  panelHi: number;
  panelEdge: number;
  brass: number;
  brassDark: number;
  brassBright: number;
  ivory: number;
  parchment: number;
  muted: number;
  dim: number;
  good: number;
  bad: number;
  warn: number;
  info: number;
  pillBg: number;
  tooltipBg: number;
  cardFill: number;
  cardFillDim: number;
}

export interface HexPalette {
  ink: string;
  onInk: string;
  onInkDim: string;
  ivory: string;
  parchment: string;
  muted: string;
  dim: string;
  brass: string;
  brassBright: string;
  good: string;
  bad: string;
  info: string;
  warn: string;
  pillBg: string;
}

const PALETTES: Record<string, { name: string; c: Palette; hex: HexPalette }> = {
  da1: {
    name: "Bronze & Noyer",
    c: {
      ink: 0x0b0e15,
      panel: 0x1d1811,
      panelHi: 0x292117,
      panelEdge: 0x8a6a35,
      brass: 0xc9a84c,
      brassDark: 0x8a6d3b,
      brassBright: 0xe8cc78,
      ivory: 0xf0e8d8,
      parchment: 0xd8c9a8,
      muted: 0xa89a80,
      dim: 0x6f6552,
      good: 0x7fb069,
      bad: 0xd4645a,
      warn: 0xe0a458,
      info: 0x7aa5c9,
      pillBg: 0x141926,
      tooltipBg: 0x181410,
      cardFill: 0x261f13,
      cardFillDim: 0x1c1810,
    },
    hex: {
      ink: "#0b0e15",

      onInk: "#d8c9a8",

      onInkDim: "#6f6552",
      ivory: "#f0e8d8",
      parchment: "#d8c9a8",
      muted: "#a89a80",
      dim: "#6f6552",
      brass: "#c9a84c",
      brassBright: "#e8cc78",
      good: "#8fc07a",
      bad: "#e07a6a",
      info: "#8ab5d8",
      warn: "#e8b06a",
      pillBg: "#141926ee",
    },
  },
  da2: {
    name: "Parchemin d'Empire",
    c: {
      ink: 0xcfc0a0,
      panel: 0xe9ddc2,
      panelHi: 0xf2e8d0,
      panelEdge: 0x8a6a35,
      brass: 0x8a6a1e,
      brassDark: 0x6b5220,
      brassBright: 0x5a420e,
      ivory: 0x332614,
      parchment: 0x5a4630,
      muted: 0x6b5a42,
      dim: 0x9a8a70,
      good: 0x3f6e28,
      bad: 0xa83226,
      warn: 0xa06a1e,
      info: 0x2e5a86,
      pillBg: 0xf2e8d0,
      tooltipBg: 0xf2e8d0,
      cardFill: 0xdfd2b4,
      cardFillDim: 0xd4c5a4,
    },
    hex: {
      ink: "#4a3820",

      onInk: "#4a3820",

      onInkDim: "#7a6848",
      ivory: "#332614",
      parchment: "#5a4630",
      muted: "#6b5a42",
      dim: "#9a8a70",
      brass: "#8a6a1e",
      brassBright: "#5a420e",
      good: "#3f6e28",
      bad: "#a83226",
      info: "#2e5a86",
      warn: "#a06a1e",
      pillBg: "#f2e8d0ee",
    },
  },
  da3: {
    name: "Marbre & Pourpre",
    c: {
      ink: 0x171020,
      panel: 0xddd8cc,
      panelHi: 0xe9e4d8,
      panelEdge: 0x6b1f35,
      brass: 0x9a7418,
      brassDark: 0x6b1f35,
      brassBright: 0x7a2440,
      ivory: 0x2e2a22,
      parchment: 0x4a4438,
      muted: 0x5c564a,
      dim: 0x8a8478,
      good: 0x3f6e28,
      bad: 0xa83226,
      warn: 0xa06a1e,
      info: 0x2e5a86,
      pillBg: 0xe9e4d8,
      tooltipBg: 0xe9e4d8,
      cardFill: 0xd4cec0,
      cardFillDim: 0xc8c2b2,
    },
    hex: {
      ink: "#2e2440",

      onInk: "#cfc8ba",

      onInkDim: "#8a8478",
      ivory: "#2e2a22",
      parchment: "#4a4438",
      muted: "#5c564a",
      dim: "#8a8478",
      brass: "#9a7418",
      brassBright: "#7a2440",
      good: "#3f6e28",
      bad: "#a83226",
      info: "#2e5a86",
      warn: "#a06a1e",
      pillBg: "#e9e4d8ee",
    },
  },
};

const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
const rawDa = params.get("da") ?? "";
const daKey = PALETTES[`da${rawDa}`] ? `da${rawDa}` : "da1";

export const DA_ID = daKey;
export const DA_NAME = PALETTES[daKey].name;

export const C: Palette = PALETTES[daKey].c;
export const HEX: HexPalette = PALETTES[daKey].hex;

export const FONT_DISPLAY = "'Cinzel', Georgia, 'Times New Roman', serif";
export const FONT_BODY = "'Alegreya Sans', Verdana, Geneva, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";
// ---------------------------------------------------------------------------
// Helpers de dessin / texte
// ---------------------------------------------------------------------------

export function panelShape(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { fill?: number; alpha?: number; edge?: number; edgeAlpha?: number; radius?: number }
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const r = opts?.radius ?? 10;
  g.fillStyle(opts?.fill ?? C.panel, opts?.alpha ?? 0.96);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
  g.lineStyle(2, opts?.edge ?? C.panelEdge, opts?.edgeAlpha ?? 0.85);
  g.strokeRoundedRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, r);
  return g;
}

export function plaque(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: number,
  edge: number
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(fill, 0.95);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
  g.lineStyle(1, edge, 0.9);
  g.strokeRoundedRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1, 6);
  return g;
}

export function ornamentDivider(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  width: number,
  color: number = C.brass,
  alpha: number = 0.8
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const half = width / 2;
  g.lineStyle(1, color, alpha * 0.7);
  g.lineBetween(cx - half, cy, cx - 12, cy);
  g.lineBetween(cx + 12, cy, cx + half, cy);
  g.fillStyle(color, alpha);
  const d = 5;
  g.fillTriangle(cx, cy - d, cx + d, cy, cx, cy + d);
  g.fillTriangle(cx, cy - d, cx - d, cy, cx, cy + d);
  return g;
}

export interface LabelOpts {
  size?: number;
  color?: string;
  display?: boolean;
  mono?: boolean;
  bold?: boolean;
  italic?: boolean;
  origin?: number | { x: number; y: number };
  align?: "left" | "center" | "right";
  wordWrap?: { width: number };
  lineSpacing?: number;
  spacing?: number;
}

export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: LabelOpts = {}
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontSize: `${style.size ?? 12}px`,
    fontFamily: style.display ? FONT_DISPLAY : style.mono ? FONT_MONO : FONT_BODY,
    color: style.color ?? HEX.ivory,
    fontStyle: [style.bold ? "bold" : "", style.italic ? "italic" : ""].join(" ").trim() || undefined,
    align: style.align,
    wordWrap: style.wordWrap,
    lineSpacing: style.lineSpacing,
    resolution: Math.min(3, Math.ceil(RenderScale.value)),
  });
  if (style.origin !== undefined) {
    if (typeof style.origin === "number") t.setOrigin(style.origin);
    else t.setOrigin(style.origin.x, style.origin.y);
  }
  if (style.spacing) t.setLetterSpacing(style.spacing);
  return t;
}
