import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TileType, BuildingType, Season } from "../types";
import { GRID_COLS, GRID_ROWS, BUILDINGS } from "../config";
import {
  MAP_W,
  MAP_H,
  hexCenter,
  hexCorners,
  neighbors as hexNeighbors,
} from "./hex";
import { Viewport, C } from "../ui/theme";

type RGB = { r: number; g: number; b: number };
interface Corner {
  x: number;
  y: number;
}

const TERRAIN_BASE: Record<TileType, RGB> = {
  [TileType.Grass]: { r: 122, g: 140, b: 80 },
  [TileType.Forest]: { r: 72, g: 94, b: 58 },
  [TileType.Water]: { r: 46, g: 92, b: 112 },
  [TileType.Mountain]: { r: 146, g: 137, b: 120 },
  [TileType.Farmable]: { r: 158, g: 138, b: 82 },
};

const TREE_CANOPY: Record<Season, number> = {
  [Season.Spring]: 0x5a7844,
  [Season.Summer]: 0x4c6c3a,
  [Season.Autumn]: 0x8a743c,
  [Season.Winter]: 0x72806e,
};

const CYPRESS = 0x3c5a3a;
const CYPRESS_DK = 0x2e462e;

// arêtes partagées par direction voisin : E, NE, NW, W, SW, SE
const DIR_EDGES: [number, number][] = [
  [0, 1],
  [5, 0],
  [4, 5],
  [3, 4],
  [2, 3],
  [1, 2],
];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

function applySeason(base: RGB, season: Season): RGB {
  switch (season) {
    case Season.Spring:
      return { r: base.r + 4, g: base.g + 6, b: base.b };
    case Season.Summer:
      return { r: base.r + 6, g: base.g + 2, b: base.b - 8 };
    case Season.Autumn:
      return { r: base.r + 16, g: base.g - 4, b: base.b - 16 };
    case Season.Winter:
      return mix(base, { r: 208, g: 214, b: 222 }, 0.52);
  }
}

function rgbInt(c: RGB): number {
  return (clamp(Math.round(c.r), 0, 255) << 16) | (clamp(Math.round(c.g), 0, 255) << 8) | clamp(Math.round(c.b), 0, 255);
}

function tileColor(type: TileType, x: number, y: number, season: Season): number {
  let c = applySeason(TERRAIN_BASE[type], season);
  if (type === TileType.Water && season === Season.Winter) {
    c = mix(c, { r: 150, g: 180, b: 205 }, 0.25);
  }
  const n = ((x * 73856093) ^ (y * 19349663)) % 100;
  const v = ((n < 0 ? -n : n) % 11) - 5;
  return rgbInt({ r: c.r + v, g: c.g + v, b: c.b + v * 0.8 });
}

function hash(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 1274126177) | 0;
  h = (h ^ (h >> 13)) * 1103515245;
  return Math.abs(h ^ (h >> 16));
}

// --- peintres de bâtiments ------------------------------------------------

const BP = {
  plaster: 0xf0e4cc,
  plasterSh: 0xd6c6a4,
  timber: 0x7a5230,
  timberDk: 0x54381c,
  thatch: 0xc8a862,
  thatchDk: 0x9c7c40,
  terra: 0xc06a48,
  terraDk: 0x94452e,
  slate: 0x6a5a50,
  slateDk: 0x52443c,
  stone: 0xc0b8a8,
  stoneDk: 0x948c7c,
  marble: 0xf0ead8,
  marbleSh: 0xd0c6ae,
  brass: 0xc9a84c,
  brassDk: 0x8a6d3b,
  window: 0xf2c46a,
  fire: 0xe8863a,
  fireCore: 0xf7b25a,
  leaf: 0x5a7844,
  leafDk: 0x3e5636,
  canvasRed: 0xa84434,
  ivory: 0xf0e8d8,
  waterBlue: 0x3a6e88,
  woodBrown: 0x8a6a42,
};

type Painter = (g: Phaser.GameObjects.Graphics, cx: number, cy: number) => void;

function bx(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c: number, a = 1): void {
  g.fillStyle(c, a);
  g.fillRect(x, y, w, h);
}

function gable(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  yBase: number,
  w: number,
  h: number,
  light: number,
  dark: number
): void {
  g.fillStyle(light, 1);
  g.fillTriangle(cx - w / 2, yBase, cx, yBase - h, cx, yBase);
  g.fillStyle(dark, 1);
  g.fillTriangle(cx + w / 2, yBase, cx, yBase - h, cx, yBase);
}

function win(g: Phaser.GameObjects.Graphics, x: number, y: number, w = 3.2, h = 4): void {
  bx(g, x, y, w, h, BP.timberDk);
  bx(g, x + 0.5, y + 0.5, w - 1, h - 1, BP.window);
}

function smokePuff(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(0xb9bec7, 0.35);
  g.fillCircle(x, y, 2.6);
  g.fillStyle(0xcdd2da, 0.28);
  g.fillCircle(x + 2, y - 3, 2);
  g.fillStyle(0xdfe3ea, 0.22);
  g.fillCircle(x + 4, y - 6, 1.5);
}

function pineTree(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number, canopy: number): void {
  g.fillStyle(BP.timberDk, 1);
  g.fillRect(x - 0.8, y + 2 * s, 1.6, 3 * s);
  g.fillStyle(canopy, 1);
  g.fillTriangle(x - 3.4 * s, y + 2 * s, x + 3.4 * s, y + 2 * s, x, y - 4 * s);
}

const BUILDING_PAINTERS: Record<BuildingType, Painter> = {
  [BuildingType.House]: (g, cx, cy) => {
    bx(g, cx - 10, cy - 2, 20, 13, BP.plaster);
    bx(g, cx - 10, cy - 2, 20, 2, BP.plasterSh);
    gable(g, cx, cy - 2, 24, 10, BP.terra, BP.terraDk);
    bx(g, cx - 3, cy + 4, 5, 7, BP.timberDk);
    win(g, cx + 4, cy + 2);
    g.lineStyle(1, BP.timber, 0.8);
    g.lineBetween(cx - 10, cy + 2, cx + 10, cy + 2);
    g.lineBetween(cx, cy - 12, cx, cy - 2);
  },

  [BuildingType.Farm]: (g, cx, cy) => {
    g.lineStyle(2, 0x6a5a30, 0.85);
    for (let r = 0; r < 3; r++) g.lineBetween(cx - 15, cy + 2 + r * 4.5, cx + 15, cy + r * 4.5);
    bx(g, cx - 14, cy - 8, 16, 9, BP.woodBrown);
    gable(g, cx - 6, cy - 8, 18, 7, BP.thatch, BP.thatchDk);
    bx(g, cx - 8, cy - 5, 4, 6, BP.timberDk);
    g.fillStyle(BP.window, 0.9);
    g.fillCircle(cx - 1, cy - 4, 1.4);
  },

  [BuildingType.Well]: (g, cx, cy) => {
    g.fillStyle(BP.stoneDk, 1);
    g.fillCircle(cx, cy + 4, 8);
    g.fillStyle(BP.stone, 1);
    g.fillCircle(cx, cy + 3, 7);
    g.fillStyle(BP.waterBlue, 1);
    g.fillCircle(cx, cy + 3, 4.4);
    g.lineStyle(1.6, BP.timber, 1);
    g.lineBetween(cx - 6, cy + 3, cx - 6, cy - 8);
    g.lineBetween(cx + 6, cy + 3, cx + 6, cy - 8);
    gable(g, cx, cy - 8, 17, 5, BP.thatch, BP.thatchDk);
    g.fillStyle(BP.brass, 1);
    g.fillCircle(cx, cy - 2, 1.6);
  },

  [BuildingType.LumberMill]: (g, cx, cy) => {
    bx(g, cx - 13, cy - 4, 19, 12, BP.timber);
    gable(g, cx - 3.5, cy - 4, 21, 8, BP.slate, BP.slateDk);
    g.fillStyle(0xc9ced6, 1);
    g.fillCircle(cx + 11, cy + 2, 5.4);
    g.fillStyle(0x8a9099, 1);
    g.fillCircle(cx + 11, cy + 2, 1.6);
    g.fillStyle(BP.timberDk, 1);
    g.fillRoundedRect(cx - 12, cy + 9, 11, 3.4, 1.6);
    g.fillRoundedRect(cx - 10, cy + 5.6, 11, 3.4, 1.6);
  },

  [BuildingType.Forester]: (g, cx, cy) => {
    g.fillStyle(0x5d4a2e, 0.75);
    g.fillEllipse(cx, cy + 6, 26, 7);
    pineTree(g, cx - 8, cy - 1, 1.05, BP.leaf);
    pineTree(g, cx + 1, cy + 1, 1.3, 0x5d9448);
    pineTree(g, cx + 9, cy - 2, 0.85, BP.leafDk);
    g.fillStyle(0xc9a84c, 0.95);
    g.fillCircle(cx - 2, cy + 7, 1.5);
    g.fillCircle(cx + 4, cy + 8, 1.5);
  },

  [BuildingType.HuntingCabin]: (g, cx, cy) => {
    bx(g, cx - 10, cy - 3, 20, 12, BP.timberDk);
    g.lineStyle(1, BP.timber, 0.9);
    for (let r = 0; r < 4; r++) g.lineBetween(cx - 10, cy - 1 + r * 3, cx + 10, cy - 1 + r * 3);
    gable(g, cx, cy - 3, 22, 7, BP.thatchDk, 0x7a5f2c);
    bx(g, cx - 2, cy + 3, 4.4, 6, 0x2e1e10);
    bx(g, cx + 12, cy - 6, 1.6, 12, BP.timber);
    g.fillStyle(0xbfa075, 1);
    g.fillRoundedRect(cx + 10, cy - 5, 6, 7, 2.4);
  },

  [BuildingType.Quarry]: (g, cx, cy) => {
    g.fillStyle(0x55555e, 1);
    g.fillEllipse(cx, cy + 4, 30, 12);
    g.fillStyle(0x767681, 1);
    g.fillEllipse(cx, cy + 4, 22, 8);
    bx(g, cx - 12, cy - 6, 6, 5, BP.stone);
    bx(g, cx - 12, cy - 6, 6, 1.4, 0xc4c9d1);
    bx(g, cx - 5, cy - 8, 6, 7, BP.stoneDk);
    bx(g, cx - 5, cy - 8, 6, 1.4, 0x999fa8);
    g.lineStyle(2, BP.timber, 1);
    g.lineBetween(cx + 8, cy + 6, cx + 8, cy - 12);
    g.lineBetween(cx + 8, cy - 12, cx + 15, cy - 7);
    g.lineStyle(1, BP.ivory, 0.7);
    g.lineBetween(cx + 15, cy - 7, cx + 15, cy - 3);
  },

  [BuildingType.Sawmill]: (g, cx, cy) => {
    bx(g, cx - 15, cy - 3, 24, 12, BP.plaster);
    g.lineStyle(1, BP.timber, 0.9);
    g.strokeRect(cx - 15, cy - 3, 24, 12);
    gable(g, cx - 3, cy - 3, 27, 9, BP.slate, BP.slateDk);
    bx(g, cx - 11, cy + 2, 12, 2.2, 0xc09454);
    bx(g, cx - 10, cy + 4.4, 12, 2.2, 0xa87c40);
    g.fillStyle(0xc9ced6, 1);
    g.fillCircle(cx + 13, cy + 1, 4.6);
    g.lineStyle(1, 0x8a9099, 1);
    g.strokeCircle(cx + 13, cy + 1, 2.4);
  },

  [BuildingType.Brickyard]: (g, cx, cy) => {
    g.fillStyle(BP.terraDk, 1);
    g.fillCircle(cx - 2, cy + 1, 10);
    g.fillStyle(BP.terra, 1);
    g.fillCircle(cx - 3.4, cy + 0.4, 9);
    g.fillStyle(0x3a2018, 1);
    g.fillTriangle(cx - 8, cy + 6, cx + 1, cy + 6, cx - 3.5, cy - 2);
    g.fillStyle(BP.fire, 1);
    g.fillTriangle(cx - 6.4, cy + 5, cx - 0.8, cy + 5, cx - 3.6, cy + 0.4);
    bx(g, cx + 7, cy - 4, 8, 2.4, 0xc06a45);
    bx(g, cx + 8, cy - 1.4, 8, 2.4, 0xa85838);
    bx(g, cx + 7, cy + 1.2, 8, 2.4, 0xc06a45);
    smokePuff(g, cx - 3, cy - 13);
  },

  [BuildingType.Warehouse]: (g, cx, cy) => {
    bx(g, cx - 14, cy - 4, 28, 13, BP.stoneDk);
    bx(g, cx - 14, cy - 4, 28, 2.4, BP.stone);
    gable(g, cx, cy - 4, 30, 6, BP.slate, BP.slateDk);
    bx(g, cx - 5, cy + 1, 10, 8, BP.timberDk);
    g.lineStyle(1, BP.timber, 1);
    g.lineBetween(cx, cy + 1, cx, cy + 9);
    bx(g, cx + 10, cy + 5, 5, 4, 0x8a6a3c);
    bx(g, cx + 10, cy + 5, 5, 1.2, 0xa8854e);
  },

  [BuildingType.Market]: (g, cx, cy) => {
    bx(g, cx - 13, cy - 1, 26, 9, BP.timber);
    bx(g, cx - 13, cy - 1, 26, 2, 0x8a6538);
    for (let i = 0; i < 6; i++) {
      bx(g, cx - 14 + i * 4.7, cy - 8, 4.7, 4, i % 2 === 0 ? BP.canvasRed : BP.ivory);
    }
    bx(g, cx - 15, cy - 4.4, 30, 1.6, BP.timberDk);
    g.fillStyle(BP.brass, 1);
    g.fillCircle(cx - 5, cy + 3, 2);
    g.fillCircle(cx - 1, cy + 4, 2);
    g.fillStyle(0xd8b25a, 1);
    g.fillCircle(cx + 6, cy + 3.4, 2.4);
  },

  [BuildingType.TradingPost]: (g, cx, cy) => {
    bx(g, cx - 11, cy - 3, 22, 12, BP.plaster);
    bx(g, cx - 11, cy - 3, 22, 2, BP.plasterSh);
    gable(g, cx, cy - 3, 24, 8, 0x4a6a8a, 0x39536e);
    bx(g, cx - 3, cy + 3, 6, 6, BP.timberDk);
    g.lineStyle(1.4, BP.timber, 1);
    g.lineBetween(cx + 11, cy - 3, cx + 11, cy - 13);
    g.fillStyle(BP.brass, 1);
    g.fillCircle(cx + 11, cy - 11, 3);
    g.lineStyle(1, BP.brassDk, 1);
    g.strokeCircle(cx + 11, cy - 11, 3);
  },

  [BuildingType.Tannery]: (g, cx, cy) => {
    bx(g, cx - 12, cy - 2, 17, 10, BP.timber);
    gable(g, cx - 3.5, cy - 2, 19, 6, BP.thatchDk, 0x7a5f2c);
    g.fillStyle(0x6f471f, 1);
    g.fillCircle(cx + 9, cy + 5, 4.6);
    g.fillStyle(0x8a5a2e, 1);
    g.fillCircle(cx + 9, cy + 4.4, 3.6);
    g.lineStyle(1.4, BP.timber, 1);
    g.lineBetween(cx - 14, cy - 8, cx - 14, cy + 6);
    g.lineBetween(cx - 4, cy - 8, cx - 4, cy + 6);
    g.lineBetween(cx - 14, cy - 7, cx - 4, cy - 7);
    g.fillStyle(0xbfa075, 1);
    g.fillRoundedRect(cx - 12, cy - 6, 7, 9, 3);
  },

  [BuildingType.ResearchLab]: (g, cx, cy) => {
    bx(g, cx - 10, cy - 2, 20, 11, BP.marble);
    bx(g, cx - 10, cy - 2, 20, 1.8, BP.marbleSh);
    g.fillStyle(0x506aa8, 1);
    g.fillCircle(cx, cy - 2, 7.4);
    g.fillStyle(0x5d84b8, 1);
    g.fillCircle(cx - 1.6, cy - 3, 6.4);
    g.fillStyle(BP.marble, 1);
    g.fillRect(cx - 8, cy + 1, 2, 7);
    g.fillRect(cx + 6, cy + 1, 2, 7);
    g.lineStyle(1.2, 0x8ab5d8, 1);
    g.lineBetween(cx + 8, cy - 12, cx + 11, cy - 15);
    g.fillStyle(0x8ab5d8, 1);
    g.fillCircle(cx + 11.6, cy - 15.6, 1.4);
  },

  [BuildingType.Garden]: (g, cx, cy) => {
    g.fillStyle(BP.leafDk, 1);
    g.fillEllipse(cx, cy + 3, 30, 15);
    g.fillStyle(0x5c9a52, 1);
    g.fillEllipse(cx, cy + 2.4, 26, 12);
    g.lineStyle(1.4, 0x8fbf84, 0.9);
    g.arc(cx, cy + 2.4, 10, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    const flowers = [0xdd8899, 0xe8d070, 0xaa66ff, 0xe8788a, 0xf0e8d8];
    flowers.forEach((fc, i) => {
      const a = (i / flowers.length) * Math.PI * 2;
      g.fillStyle(fc, 1);
      g.fillCircle(cx + Math.cos(a) * 7, cy + 2.4 + Math.sin(a) * 4, 1.7);
    });
  },

  [BuildingType.Inn]: (g, cx, cy) => {
    bx(g, cx - 11, cy - 6, 22, 16, BP.plaster);
    g.lineStyle(1, BP.timber, 0.9);
    g.strokeRect(cx - 11, cy - 6, 22, 16);
    g.lineBetween(cx - 11, cy, cx + 11, cy);
    gable(g, cx, cy - 6, 26, 8, BP.terra, BP.terraDk);
    win(g, cx - 6, cy - 4, 3, 3.4);
    win(g, cx + 3, cy - 4, 3, 3.4);
    bx(g, cx - 3, cy + 3, 5.4, 7, BP.timberDk);
    g.lineStyle(1.4, BP.timber, 1);
    g.lineBetween(cx + 13, cy - 6, cx + 13, cy - 15);
    g.fillStyle(BP.brass, 1);
    g.fillRoundedRect(cx + 10.6, cy - 14, 4.8, 4, 1);
  },

  [BuildingType.Academy]: (g, cx, cy) => {
    bx(g, cx - 14, cy - 3, 28, 12, BP.marble);
    gable(g, cx, cy - 3, 30, 9, 0xe8dfcc, BP.marbleSh);
    g.fillStyle(0x8a6d3b, 1);
    g.fillCircle(cx, cy - 8.6, 1.8);
    for (const dx of [-9, -3, 3, 9]) {
      bx(g, cx + dx - 1.4, cy - 1, 2.8, 8, BP.ivory);
      bx(g, cx + dx - 1.4, cy - 1, 2.8, 1.4, 0xd8cfbc);
    }
    bx(g, cx - 16, cy + 9, 32, 2, 0xcfc6b2);
    bx(g, cx - 14, cy + 7, 28, 2, 0xded5c2);
  },

  [BuildingType.Wall]: (g, cx, cy) => {
    bx(g, cx - 16, cy - 3, 32, 13, BP.stoneDk);
    bx(g, cx - 16, cy - 3, 32, 2.6, BP.stone);
    for (const mx of [-13, -6.5, 0, 6.5, 13]) {
      bx(g, cx + mx - 2.4, cy - 8, 4.8, 5, BP.stoneDk);
      bx(g, cx + mx - 2.4, cy - 8, 4.8, 1.6, BP.stone);
    }
    g.lineStyle(1, 0x60656d, 0.8);
    g.lineBetween(cx - 16, cy + 2, cx + 16, cy + 2);
    g.lineBetween(cx - 8, cy - 1, cx - 8, cy + 10);
    g.lineBetween(cx + 7, cy + 1, cx + 7, cy + 10);
  },

  [BuildingType.Tower]: (g, cx, cy) => {
    bx(g, cx - 6, cy - 16, 12, 26, 0x8b93a8);
    bx(g, cx + 1, cy - 16, 5, 26, 0x6e7888);
    for (const mx of [-6, -1.4, 3.2]) {
      bx(g, cx + mx, cy - 20, 3.6, 4, 0x8b93a8);
    }
    bx(g, cx - 7, cy - 16, 14, 2, 0x9aa2b5);
    bx(g, cx - 1, cy - 9, 2.4, 5, 0x3a4048);
    g.lineStyle(1.4, BP.timberDk, 1);
    g.lineBetween(cx + 6, cy - 20, cx + 6, cy - 27);
    g.fillStyle(BP.canvasRed, 1);
    g.fillTriangle(cx + 6, cy - 27, cx + 6, cy - 23, cx + 13, cy - 25);
  },

  [BuildingType.Forge]: (g, cx, cy) => {
    bx(g, cx - 12, cy - 3, 20, 12, BP.stoneDk);
    bx(g, cx - 12, cy - 3, 20, 2.2, BP.stone);
    gable(g, cx - 2, cy - 3, 22, 7, BP.slate, BP.slateDk);
    bx(g, cx + 5, cy - 14, 5, 11, 0x707682);
    smokePuff(g, cx + 7.5, cy - 17);
    g.fillStyle(0x3a3f48, 1);
    g.fillRect(cx - 9, cy + 3, 7, 3);
    g.fillRect(cx - 4, cy + 1.6, 2.6, 5.4);
    g.fillStyle(BP.fire, 0.9);
    g.fillCircle(cx + 2, cy + 6, 3.4);
    g.fillStyle(BP.fireCore, 1);
    g.fillCircle(cx + 2, cy + 6, 1.8);
  },

  [BuildingType.Tavern]: (g, cx, cy) => {
    bx(g, cx - 13, cy - 5, 26, 15, BP.timber);
    bx(g, cx - 13, cy - 5, 26, 2.4, 0x8a6538);
    gable(g, cx, cy - 5, 29, 8, BP.thatch, BP.thatchDk);
    win(g, cx - 8, cy - 1, 3.4, 4);
    win(g, cx + 4, cy - 1, 3.4, 4);
    bx(g, cx - 3, cy + 3, 6, 7, 0x2e1e10);
    for (let i = 0; i < 4; i++) {
      bx(g, cx - 13 + i * 7, cy - 8.4, 7, 3.4, i % 2 === 0 ? BP.canvasRed : BP.ivory);
    }
    smokePuff(g, cx + 9, cy - 16);
  },

  [BuildingType.Chapel]: (g, cx, cy) => {
    bx(g, cx - 8, cy - 8, 16, 18, BP.marble);
    bx(g, cx - 8, cy - 8, 16, 2, 0xece3d0);
    g.fillStyle(BP.slateDk, 1);
    g.fillTriangle(cx - 10, cy - 8, cx + 10, cy - 8, cx, cy - 24);
    g.lineStyle(1, 0x333a44, 0.8);
    g.lineBetween(cx, cy - 24, cx - 10, cy - 8);
    g.lineStyle(2, BP.brass, 1);
    g.lineBetween(cx, cy - 24, cx, cy - 29);
    g.lineBetween(cx - 2.4, cy - 27, cx + 2.4, cy - 27);
    g.fillStyle(BP.window, 1);
    g.fillCircle(cx, cy - 2, 2.6);
    bx(g, cx - 1.4, cy + 4, 2.8, 6, 0x8a7d60);
  },

  [BuildingType.Aqueduct]: (g, cx, cy) => {
    g.lineStyle(4, BP.stone, 1);
    g.lineBetween(cx - 16, cy - 4, cx + 16, cy - 4);
    g.lineStyle(2, BP.marbleSh, 1);
    g.lineBetween(cx - 16, cy - 6, cx + 16, cy - 6);
    for (const px of [cx - 12, cx, cx + 12]) {
      g.fillStyle(BP.stone, 1);
      g.fillRect(px - 2.5, cy - 4, 5, 13);
      g.fillStyle(BP.stoneDk, 0.7);
      g.fillRect(px + 1, cy - 4, 1.5, 13);
      g.fillStyle(BP.stone, 1);
      g.fillRect(px - 3.5, cy + 2, 7, 2.5);
    }
    g.lineStyle(3, BP.waterBlue, 0.85);
    g.lineBetween(cx - 15, cy - 5, cx + 15, cy - 5);
    g.lineStyle(1, 0x9ec8dc, 0.5);
    g.lineBetween(cx - 10, cy - 6, cx - 4, cy - 6);
  },

  [BuildingType.Bathhouse]: (g, cx, cy) => {
    bx(g, cx - 13, cy - 4, 26, 13, BP.marble);
    bx(g, cx - 13, cy - 4, 26, 2, 0xece3d0);
    g.fillStyle(BP.marbleSh, 1);
    g.fillCircle(cx, cy - 4, 9);
    g.fillStyle(BP.terra, 1);
    g.fillCircle(cx, cy - 4, 6.5);
    g.fillStyle(BP.marble, 1);
    g.fillCircle(cx, cy - 4, 4);
    g.fillStyle(BP.window, 0.9);
    g.fillCircle(cx - 7, cy + 3, 1.6);
    g.fillCircle(cx + 7, cy + 3, 1.6);
    g.fillStyle(0xdfe8ee, 0.5);
    g.fillCircle(cx + 4, cy - 14, 2.2);
    g.fillCircle(cx + 6, cy - 18, 1.6);
    g.fillStyle(BP.stoneDk, 1);
    g.fillEllipse(cx - 9, cy + 9, 8, 3);
    g.fillStyle(BP.waterBlue, 0.8);
    g.fillEllipse(cx - 9, cy + 9, 6, 2);
  },

  [BuildingType.Amphitheater]: (g, cx, cy) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(cx, cy + 10, 34, 10);
    g.fillStyle(BP.stoneDk, 1);
    g.fillEllipse(cx, cy, 32, 20);
    g.fillStyle(BP.stone, 1);
    g.fillEllipse(cx, cy - 1, 30, 18);
    g.fillStyle(0xd8b878, 1);
    g.fillEllipse(cx, cy - 1, 18, 10);
    g.lineStyle(1.5, BP.stoneDk, 0.8);
    g.strokeEllipse(cx, cy - 1, 18, 10);
    for (const a of [0, 60, 120, 180, 240, 300]) {
      const rad = (a * Math.PI) / 180;
      g.fillStyle(BP.stoneDk, 0.9);
      g.fillCircle(cx + Math.cos(rad) * 14, cy - 1 + Math.sin(rad) * 8, 1.6);
    }
    g.fillStyle(BP.canvasRed, 0.9);
    g.fillRect(cx - 1, cy - 3, 2, 2);
    g.fillStyle(BP.stone, 1);
    g.fillRect(cx - 16, cy - 6, 3, 3);
    g.fillRect(cx + 13, cy - 6, 3, 3);
  },

  [BuildingType.Barracks]: (g, cx, cy) => {
    bx(g, cx - 14, cy - 4, 28, 13, BP.timber);
    bx(g, cx - 14, cy - 4, 28, 2.2, 0x8a6538);
    gable(g, cx, cy - 4, 30, 8, 0x8a4434, 0x6a3326);
    bx(g, cx - 4, cy + 2, 7, 7, BP.timberDk);
    g.lineStyle(1.5, BP.timberDk, 1);
    g.lineBetween(cx - 14, cy + 2, cx + 14, cy + 2);
    for (const sx of [cx - 10, cx - 3, cx + 4, cx + 11]) {
      g.lineStyle(1.6, 0xb8bcc4, 1);
      g.lineBetween(sx, cy + 8, sx + 2.5, cy + 1);
    }
    g.lineStyle(1.4, BP.timber, 1);
    g.lineBetween(cx + 12, cy - 12, cx + 12, cy - 19);
    g.fillStyle(BP.canvasRed, 1);
    g.fillTriangle(cx + 12, cy - 19, cx + 12, cy - 15, cx + 18, cy - 17);
  },
};

const MINIMAP_COLOR: Partial<Record<BuildingType, number>> = {
  [BuildingType.House]: 0xb5563a,
  [BuildingType.Farm]: 0x7a8a40,
  [BuildingType.Well]: 0x5a9ac8,
  [BuildingType.LumberMill]: 0x6f4a2a,
  [BuildingType.Forester]: 0x3d7a35,
  [BuildingType.HuntingCabin]: 0x5a7a3a,
  [BuildingType.Quarry]: 0x8a8f99,
  [BuildingType.Sawmill]: 0x9a6b3a,
  [BuildingType.Brickyard]: 0xaa5533,
  [BuildingType.Warehouse]: 0x5a6068,
  [BuildingType.Market]: 0xc9a84c,
  [BuildingType.TradingPost]: 0x4a6a8a,
  [BuildingType.Tannery]: 0xa06a35,
  [BuildingType.ResearchLab]: 0x5d84b8,
  [BuildingType.Garden]: 0x5c9a52,
  [BuildingType.Inn]: 0x8b5a2a,
  [BuildingType.Academy]: 0x506aa8,
  [BuildingType.Wall]: 0x9aa0aa,
  [BuildingType.Tower]: 0x6e7888,
  [BuildingType.Forge]: 0x55606e,
  [BuildingType.Tavern]: 0xb0713e,
  [BuildingType.Chapel]: 0xd8cdb8,
  [BuildingType.Aqueduct]: 0x9aa0aa,
  [BuildingType.Bathhouse]: 0xc9b884,
  [BuildingType.Amphitheater]: 0xd0a878,
  [BuildingType.Barracks]: 0x8a4a3a,
};

export class TileMap {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  private terrainGfx: Phaser.GameObjects.Graphics;
  private detailGfx: Phaser.GameObjects.Graphics;
  private buildingGfx: Phaser.GameObjects.Graphics;
  private overlayGfx: Phaser.GameObjects.Graphics;
  currentSeason: Season = Season.Spring;

  minimapContainer!: Phaser.GameObjects.Container;
  private minimapPixels: Phaser.GameObjects.Rectangle[][] = [];
  private minimapCam!: Phaser.GameObjects.Graphics;
  private readonly MM_SCALE = 6;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);

    this.shadowPlate();

    this.terrainGfx = scene.add.graphics();
    this.detailGfx = scene.add.graphics();
    this.buildingGfx = scene.add.graphics();
    this.overlayGfx = scene.add.graphics();
    this.container.add([this.terrainGfx, this.detailGfx, this.buildingGfx, this.overlayGfx]);
  }

  private shadowPlate(): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0x000000, 0.36);
    g.fillRoundedRect(12, 16, MAP_W + 2, MAP_H + 4, 26);
    g.fillStyle(C.panel, 1);
    g.fillRoundedRect(0, 0, MAP_W + 4, MAP_H + 6, 22);
    g.lineStyle(1, 0xc9a84c, 0.28);
    g.strokeRoundedRect(3, 3, MAP_W - 2, MAP_H, 20);
    g.lineStyle(1, 0xc9a84c, 0.12);
    g.strokeRoundedRect(7, 7, MAP_W - 10, MAP_H - 8, 16);
    this.container.add(g);
  }

  ensureMinimap(ui: Phaser.Scene): void {
    if (this.minimapBuilt) return;
    this.minimapBuilt = true;
    this.ui = ui;
    this.lastTerrainSig = "";
    this.lastBuildingSig = "";

    const w = GRID_COLS * this.MM_SCALE;
    const h = GRID_ROWS * this.MM_SCALE;
    this.mmW = w;
    this.mmH = h;

    this.minimapContainer = ui.add.container(Viewport.w - w - 16, Viewport.h - 76 - 12 - h);

    const frame = ui.add.graphics();
    frame.fillStyle(C.panel, 0.94);
    frame.fillRoundedRect(-4, -4, w + 8, h + 8, 8);
    frame.lineStyle(1, 0xc9a84c, 0.5);
    frame.strokeRoundedRect(-3.5, -3.5, w + 7, h + 7, 8);
    this.minimapContainer.add(frame);

    for (let y = 0; y < GRID_ROWS; y++) {
      this.minimapPixels[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const px = ui.add.rectangle(
          x * this.MM_SCALE + this.MM_SCALE / 2,
          y * this.MM_SCALE + this.MM_SCALE / 2,
          this.MM_SCALE,
          this.MM_SCALE,
          0x3d6b35
        );
        this.minimapPixels[y][x] = px;
        this.minimapContainer.add(px);
      }
    }

    this.minimapCam = ui.add.graphics();
    this.minimapContainer.add(this.minimapCam);
    this.minimapContainer.setDepth(90);

    const hit = ui.add.rectangle(w / 2, h / 2, w + 8, h + 8, 0xffffff, 0.001);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerdown", (_p: Phaser.Input.Pointer, lx: number, ly: number) => {
      this.mmDragging = true;
      this.centerCameraOnMinimap(lx, ly);
    });
    hit.on("pointermove", (_p: Phaser.Input.Pointer, lx: number, ly: number) => {
      if (this.mmDragging) this.centerCameraOnMinimap(lx, ly);
    });
    ui.input.on("pointerup", () => {
      this.mmDragging = false;
    });
    this.minimapContainer.add(hit);

    ui.game.events.on(
      "renderscale",
      () => {
        if (this.minimapContainer) {
          this.minimapContainer.setPosition(Viewport.w - this.mmW - 16, Viewport.h - 76 - 12 - this.mmH);
        }
      },
      this
    );
  }

  private mmW = 0;
  private mmH = 0;

  private mmDragging = false;
  private minimapBuilt = false;
  private ui?: Phaser.Scene;
  private lastTerrainSig = "";
  private lastBuildingSig = "";

  private centerCameraOnMinimap(lx: number, ly: number): void {
    const cam = this.scene.cameras.main;
    const wx = Phaser.Math.Clamp(((lx + this.mmW / 2) / this.mmW) * MAP_W, 0, MAP_W);
    const wy = Phaser.Math.Clamp(((ly + this.mmH / 2) / this.mmH) * MAP_H, 0, MAP_H);
    cam.scrollX = wx - cam.width / 2;
    cam.scrollY = wy - cam.height / 2;
  }

  private cornersAt(cx: number, cy: number): Corner[] {
    const flat = hexCorners(cx, cy);
    const pts: Corner[] = [];
    for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], y: flat[i + 1] });
    return pts;
  }

  private paintHex(g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number): void {
    const pts = this.cornersAt(cx, cy);
    g.fillStyle(color, 1);
    g.fillPoints(pts as unknown as Phaser.Geom.Point[], true);

    g.lineStyle(1, 0xffffff, 0.045);
    for (const idx of [4, 5]) {
      const a = pts[idx];
      const b = pts[(idx + 1) % 6];
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    g.lineStyle(1, 0x000000, 0.09);
    for (const idx of [1, 2]) {
      const a = pts[idx];
      const b = pts[(idx + 1) % 6];
      g.lineBetween(a.x, a.y, b.x, b.y);
    }

    g.lineStyle(1, 0x000000, 0.11);
    const closed = [...pts, pts[0]];
    for (let i = 0; i < 6; i++) {
      g.lineBetween(closed[i].x, closed[i].y, closed[i + 1].x, closed[i + 1].y);
    }
  }

  private paintCoast(g: Phaser.GameObjects.Graphics, state: GameState, col: number, row: number): void {
    const dirs = hexNeighbors(col, row);
    const cx = hexCenter(col, row).x;
    const cy = hexCenter(col, row).y;
    const pts = this.cornersAt(cx, cy);
    g.lineStyle(2, 0xbfe0e4, 0.5);
    dirs.forEach((n, i) => {
      if (!this.isLand(state, n.col, n.row)) return;
      const [ia, ib] = DIR_EDGES[i];
      const a = pts[ia];
      const b = pts[ib];
      g.lineBetween(a.x * 0.86 + cx * 0.14, a.y * 0.86 + cy * 0.14, b.x * 0.86 + cx * 0.14, b.y * 0.86 + cy * 0.14);
    });
  }

  private isLand(state: GameState, col: number, row: number): boolean {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
    return state.tiles[row][col].type !== TileType.Water;
  }

  // --- décorations -------------------------------------------------------

  private drawDecorations(state: GameState): void {
    const g = this.detailGfx;
    g.clear();
    const season = state.season;

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const tile = state.tiles[y][x];
        if (tile.buildingId !== null) continue;
        const { x: px, y: py } = hexCenter(x, y);
        const h = hash(x, y, 7);

        switch (tile.type) {
          case TileType.Forest:
            this.paintForest(g, px, py, x, y, season, h);
            break;
          case TileType.Mountain:
            this.paintMountain(g, px, py, season, h);
            break;
          case TileType.Water:
            this.paintWater(g, px, py, h);
            break;
          case TileType.Farmable:
            this.paintFarmable(g, px, py, season, h);
            break;
          case TileType.Grass:
            this.paintGrassDetails(g, px, py, season, h);
            break;
        }
      }
    }
  }

  private paintForest(g: Phaser.GameObjects.Graphics, px: number, py: number, x: number, y: number, season: Season, h: number): void {
    const canopy = TREE_CANOPY[season];
    const count = 4 + (h % 3);

    for (let i = 0; i < count; i++) {
      const tx = px - 14 + ((h >> (i * 3)) % 29);
      const ty = py + 6 - ((h >> (i * 5 + 2)) % 21);
      const scale = 0.85 + ((h >> (i + 9)) % 30) / 100;
      const isCypress = (h >> (i * 2 + 4)) % 5 < 3;

      g.fillStyle(0x000000, 0.14);
      g.fillEllipse(tx, ty + 3, 10 * scale, 3);

      if (isCypress) {
        const dark = season === Season.Winter ? 0x3a4a3a : CYPRESS_DK;
        const mid = season === Season.Winter ? 0x4a5c48 : CYPRESS;
        g.fillStyle(0x4c3a20, 1);
        g.fillRect(tx - 1, ty + 1, 2, 4 * scale);
        g.fillStyle(dark, 1);
        g.fillTriangle(tx - 4.2 * scale, ty + 2, tx + 4.2 * scale, ty + 2, tx, ty - 16 * scale);
        g.fillStyle(mid, 1);
        g.fillTriangle(tx - 2.6 * scale, ty, tx + 1.4 * scale, ty, tx - 0.6, ty - 16 * scale);
        if (season === Season.Winter) {
          g.fillStyle(0xe8eef2, 0.75);
          g.fillTriangle(tx - 1.6 * scale, ty - 12 * scale, tx + 1.6 * scale, ty - 12 * scale, tx, ty - 16 * scale);
        }
      } else {
        const trunkH = 8 * scale;
        g.fillStyle(0x6a5232, 1);
        g.fillRect(tx - 1.1, ty + 2 - 1, 2.2, trunkH);
        const crownY = ty + 2 - trunkH;
        const autumn = season === Season.Autumn;
        const crown = autumn ? 0x9a7c40 : canopy;
        g.fillStyle(autumn ? 0x7a6030 : 0x3e5636, 1);
        g.fillEllipse(tx, crownY + 2, 15 * scale, 6 * scale);
        g.fillStyle(crown, 1);
        g.fillEllipse(tx, crownY, 16 * scale, 7 * scale);
        g.fillStyle(autumn ? 0xb89450 : 0x6c8452, 0.85);
        g.fillEllipse(tx - 3 * scale, crownY - 2 * scale, 9 * scale, 4 * scale);
        if (season === Season.Winter) {
          g.fillStyle(0xe8eef2, 0.7);
          g.fillEllipse(tx, crownY - 2.4 * scale, 13 * scale, 3.4 * scale);
        }
      }
    }
  }

  private paintMountain(g: Phaser.GameObjects.Graphics, px: number, py: number, season: Season, h: number): void {
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(px, py + 11, 30, 7);

    g.fillStyle(0x635c50, 1);
    g.fillTriangle(px - 16, py + 11, px + 14, py + 11, px + 3, py - 13);
    g.fillStyle(0x857c6d, 1);
    g.fillTriangle(px - 16, py + 11, px + 1, py + 11, px + 3, py - 13);
    g.fillStyle(0xa3988a, 0.95);
    g.fillTriangle(px - 16, py + 11, px - 5, py + 11, px + 1.4, py - 5);
    g.lineStyle(1, 0x4e483e, 0.5);
    g.lineBetween(px + 3, py - 13, px + 1, py + 11);

    if (h % 3 === 0) {
      g.fillStyle(0x6b6355, 1);
      g.fillTriangle(px + 6, py + 11, px + 17, py + 11, px + 12, py + 2);
      g.fillStyle(0x877e6f, 0.9);
      g.fillTriangle(px + 12, py + 2, px + 9.6, py + 6, px + 14.4, py + 6);
    }

    if (season === Season.Winter) {
      g.fillStyle(0xeef2f4, 0.92);
      g.fillTriangle(px + 3, py - 13, px - 2.4, py - 6, px + 8, py - 6);
      g.fillStyle(0xdde4ea, 0.55);
      g.fillEllipse(px - 8, py + 8, 10, 3);
      g.fillEllipse(px + 10, py + 9, 9, 3);
    }
  }

  private paintWater(g: Phaser.GameObjects.Graphics, px: number, py: number, h: number): void {
    g.fillStyle(0x1c3a4c, 0.22);
    g.fillEllipse(px, py + 2, 30, 22);

    g.lineStyle(1.4, 0x9ec8dc, 0.3);
    const waves: [number, number, number][] = [
      [-8, -5, 8],
      [6, 4, 7],
      [-3, 10, 6],
    ];
    waves.forEach(([wx, wy, ww], i) => {
      const wob = ((h >> (i * 4)) % 5) - 2;
      g.lineBetween(px + wx + wob, py + wy, px + wx + ww + wob, py + wy);
    });
  }

  private paintFarmable(g: Phaser.GameObjects.Graphics, px: number, py: number, season: Season, h: number): void {
    const ripe = season === Season.Autumn || season === Season.Summer;
    const wheat = ripe ? 0xc4a452 : 0x8a8a48;
    const soil = ripe ? 0x8a7038 : 0x6a5c34;

    for (let r = -1; r <= 1; r++) {
      const y = py + r * 8 - 2;
      g.lineStyle(2, soil, 0.85);
      g.lineBetween(px - 12, y + 2, px - 3, y - 1);
      g.lineBetween(px + 1, y - 2, px + 12, y - 5);
      g.fillStyle(wheat, 1);
      for (let cIdx = 0; cIdx < 4; cIdx++) {
        const t = cIdx / 3;
        const x1 = Phaser.Math.Linear(-12, -3, t);
        const y1 = Phaser.Math.Linear(y + 2, y - 1, t);
        if ((h >> (cIdx + r * 3 + 4)) % 4 !== 0) g.fillCircle(px + x1, y1 - 1.6, 1.5);
        const x2 = Phaser.Math.Linear(1, 12, t);
        const y2 = Phaser.Math.Linear(y - 2, y - 5, t);
        if ((h >> (cIdx + r * 3 + 9)) % 4 !== 0) g.fillCircle(px + x2, y2 - 1.6, 1.5);
      }
    }
  }

  private paintGrassDetails(g: Phaser.GameObjects.Graphics, px: number, py: number, season: Season, h: number): void {
    g.fillStyle(0x000000, 0.045);
    g.fillEllipse(px - 6 + (h % 9), py + 3 - ((h >> 2) % 9), 13, 7);
    g.fillEllipse(px + 7 - ((h >> 5) % 11), py - 4 + ((h >> 7) % 10), 11, 6);
    g.fillStyle(0xffffff, 0.05);
    g.fillEllipse(px + 2 + ((h >> 3) % 12) - 6, py - 6 + ((h >> 6) % 8), 12, 6);

    if (season === Season.Winter) {
      if (h % 4 === 0) {
        g.fillStyle(0xf0f4f8, 0.5);
        g.fillEllipse(px - 5 + (h % 10), py - 3 + (h % 7), 9, 3.4);
      }
      return;
    }
    if (h % 4 === 0) {
      const gx = px - 10 + (h % 20);
      const gy = py - 8 + ((h >> 4) % 16);
      g.lineStyle(1, 0x8a9a4e, 0.9);
      g.lineBetween(gx, gy, gx - 2, gy - 3.5);
      g.lineBetween(gx, gy, gx + 1.5, gy - 4);
      g.lineBetween(gx + 3, gy + 1, gx + 4.2, gy - 2.4);
    }
    if (h % 13 === 0) {
      const fx = px - 9 + ((h >> 3) % 18);
      const fy = py - 6 + ((h >> 6) % 13);
      g.fillStyle(0xc05038, 0.95);
      g.fillCircle(fx, fy, 1.5);
      g.fillStyle(0x3a3228, 0.8);
      g.fillCircle(fx, fy, 0.55);
    }
    if (h % 19 === 0) {
      const sx = px - 10 + ((h >> 5) % 20);
      const sy = py + 2 + ((h >> 8) % 8);
      g.fillStyle(0xa8a094, 0.8);
      g.fillEllipse(sx, sy, 4.4, 2.6);
    }
  }

  // --- bâtiments ---------------------------------------------------------

  private drawBuildings(state: GameState): void {
    const g = this.buildingGfx;
    g.clear();

    for (const building of state.buildings) {
      const { x: cx, y: cy } = hexCenter(building.gridX, building.gridY);
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(cx + 2, cy + 11, 34, 9);
      const painter = BUILDING_PAINTERS[building.type];
      if (painter) painter(g, cx, cy);

      // barre de progression du cycle de production (rouge si entrante manquante)
      const def = BUILDINGS[building.type];
      let cycle = 0;
      let blocked = false;
      if (building.active) {
        if (def.production) {
          cycle = def.production.ticksPerCycle;
          for (const [res, amt] of Object.entries(def.production.input)) {
            if (amt && state.resources[res as keyof typeof state.resources] < amt) blocked = true;
          }
        } else if (building.type === BuildingType.Forester) cycle = 5;
        else if (building.type === BuildingType.HuntingCabin) cycle = 4;
      }
      if (cycle > 0) {
        const p = Math.min(1, building.productionTimer / cycle);
        g.fillStyle(0x000000, 0.45);
        g.fillRoundedRect(cx - 9, cy + 14, 18, 3.5, 1.75);
        g.fillStyle(blocked ? 0xd4645a : 0xc9a84c, 0.9);
        g.fillRoundedRect(cx - 9, cy + 14, Math.max(1.5, 18 * p), 3.5, 1.75);
      }
    }
  }

  // --- synchronisation ---------------------------------------------------

  sync(state: GameState): void {
    this.currentSeason = state.season;

    const terrainSig =
      state.season +
      "|" +
      state.tiles.map((row) => row.map((t) => t.type[0] + (t.buildingId !== null ? "b" : "")).join("")).join(";");

    if (terrainSig !== this.lastTerrainSig) {
      this.lastTerrainSig = terrainSig;
      this.terrainGfx.clear();
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          const tile = state.tiles[y][x];
          const { x: cx, y: cy } = hexCenter(x, y);
          this.paintHex(this.terrainGfx, cx, cy, tileColor(tile.type, x, y, state.season));
          if (tile.type === TileType.Water) {
            this.paintCoast(this.terrainGfx, state, x, y);
          }
        }
      }
      this.drawDecorations(state);
      this.updateMinimap(state);
    }

    const buildingSig = state.buildings.map((b) => `${b.id}:${b.type}:${b.gridX},${b.gridY}`).join(",");
    if (buildingSig !== this.lastBuildingSig) {
      this.lastBuildingSig = buildingSig;
      this.drawBuildings(state);
      this.updateMinimap(state);
    }

    this.container.bringToTop(this.overlayGfx);
  }

  private updateMinimap(state: GameState): void {
    if (!this.minimapBuilt || !this.minimapContainer) return;

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const tile = state.tiles[y][x];
        let color: number = tileColor(tile.type, x, y, state.season);
        if (tile.buildingId !== null) {
          const building = state.buildings.find((b) => b.id === tile.buildingId);
          if (building) color = MINIMAP_COLOR[building.type] ?? color;
        }
        this.minimapPixels[y][x].fillColor = color;
      }
    }

    this.minimapCam.clear();
    const cam = this.scene.cameras.main;
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    const mmW = GRID_COLS * this.MM_SCALE;
    const mmH = GRID_ROWS * this.MM_SCALE;
    this.minimapCam.lineStyle(1.4, 0xe8cc78, 0.85);
    this.minimapCam.strokeRect(
      (-cam.scrollX / MAP_W) * mmW,
      (-cam.scrollY / MAP_H) * mmH,
      (vw / MAP_W) * mmW,
      (vh / MAP_H) * mmH
    );
  }

  showHover(col: number, row: number): void {
    const { x, y } = hexCenter(col, row);
    const pts = this.cornersAt(x, y);
    const g = this.overlayGfx;
    g.clear();
    g.fillStyle(0xf5efdf, 0.1);
    g.fillPoints(pts as unknown as Phaser.Geom.Point[], true);
    g.lineStyle(2.2, 0xe8cc78, 0.9);
    const closed = [...pts, pts[0]];
    for (let i = 0; i < 6; i++) g.lineBetween(closed[i].x, closed[i].y, closed[i + 1].x, closed[i + 1].y);
  }

  hideHover(): void {
    this.overlayGfx.clear();
  }

  setBuildingPreview(_type: BuildingType, col: number, row: number, valid: boolean): void {
    const { x, y } = hexCenter(col, row);
    const pts = this.cornersAt(x, y);
    const g = this.overlayGfx;
    g.clear();
    const c = valid ? 0x8fdc7a : 0xe06a55;
    g.fillStyle(c, valid ? 0.16 : 0.2);
    g.fillPoints(pts as unknown as Phaser.Geom.Point[], true);
    g.lineStyle(2, c, 0.9);
    const closed = [...pts, pts[0]];
    for (let i = 0; i < 6; i++) g.lineBetween(closed[i].x, closed[i].y, closed[i + 1].x, closed[i + 1].y);
  }

  clearPreview(): void {
    this.overlayGfx.clear();
  }

  destroy(): void {
    this.container.destroy();
    this.minimapContainer?.destroy();
  }
}
