import Phaser from "phaser";
import { ResourceType } from "../types";

const P = {
  wood: 0x8a5a2e,
  woodLight: 0xb08050,
  woodDark: 0x5a3a1e,
  grain: 0xd8b25a,
  grainDark: 0xa8863c,
  stone: 0x9aa0aa,
  stoneDark: 0x6a707a,
  coin: 0xe0bc55,
  coinDark: 0x9a7d28,
  plank: 0xc09454,
  plankDark: 0x8a6535,
  brick: 0xc06a45,
  brickDark: 0x8a4630,
  paper: 0xd8c9a8,
  inkBlue: 0x7aa5c9,
  leather: 0xa06a35,
  leatherDark: 0x6f471f,
  steel: 0xb8bcc4,
  water: 0x5a9ac8,
  waterLight: 0x9ecbe8,
};

const C_BOOK = 0x8a6d3b;

export type IconKey =
  | ResourceType
  | "person"
  | "heart"
  | "shield"
  | "lock"
  | "book"
  | "warning"
  | "forest"
  | "mountain"
  | "farmable";

export function drawIcon(g: Phaser.GameObjects.Graphics, key: IconKey, cx: number, cy: number, s = 6): void {
  switch (key) {
    case ResourceType.Wood: {
      g.fillStyle(P.wood, 1);
      g.fillRoundedRect(cx - s, cy - s * 0.32, s * 2, s * 0.64, s * 0.3);
      g.fillStyle(P.woodLight, 1);
      g.fillCircle(cx - s + s * 0.15, cy, s * 0.26);
      g.lineStyle(1, P.woodDark, 0.8);
      g.lineBetween(cx - s * 0.2, cy - s * 0.14, cx + s * 0.55, cy - s * 0.14);
      g.lineBetween(cx - s * 0.2, cy + s * 0.16, cx + s * 0.55, cy + s * 0.16);
      break;
    }
    case ResourceType.Food: {
      g.lineStyle(1.5, P.grainDark, 1);
      g.lineBetween(cx, cy + s, cx, cy - s * 0.2);
      g.fillStyle(P.grain, 1);
      const grains: [number, number][] = [
        [-s * 0.42, -s * 0.35],
        [s * 0.42, -s * 0.35],
        [-s * 0.34, s * 0.12],
        [s * 0.34, s * 0.12],
        [0, -s * 0.62],
      ];
      for (const [gx, gy] of grains) {
        g.fillEllipse(cx + gx, cy + gy, s * 0.52, s * 0.78);
      }
      break;
    }
    case ResourceType.Stone: {
      g.fillStyle(P.stone, 1);
      g.fillTriangle(cx - s, cy + s * 0.62, cx + s, cy + s * 0.62, cx + s * 0.18, cy - s * 0.72);
      g.fillTriangle(cx - s, cy + s * 0.62, cx + s * 0.05, cy + s * 0.62, cx - s * 0.28, cy - s * 0.3);
      g.fillStyle(P.stoneDark, 0.55);
      g.fillTriangle(cx + s * 0.18, cy + s * 0.62, cx + s, cy + s * 0.62, cx + s * 0.18, cy - s * 0.72);
      break;
    }
    case ResourceType.Gold: {
      g.fillStyle(P.coinDark, 1);
      g.fillCircle(cx + s * 0.12, cy + s * 0.14, s * 0.82);
      g.fillStyle(P.coin, 1);
      g.fillCircle(cx - s * 0.08, cy - s * 0.08, s * 0.82);
      g.lineStyle(1.2, P.coinDark, 0.9);
      g.strokeCircle(cx - s * 0.08, cy - s * 0.08, s * 0.5);
      break;
    }
    case ResourceType.Planks: {
      g.fillStyle(P.plank, 1);
      g.fillRoundedRect(cx - s, cy - s * 0.55, s * 2, s * 0.48, 1.5);
      g.fillStyle(P.plankDark, 1);
      g.fillRoundedRect(cx - s * 0.85, cy + s * 0.07, s * 2, s * 0.48, 1.5);
      break;
    }
    case ResourceType.Bricks: {
      g.fillStyle(P.brick, 1);
      g.fillRect(cx - s, cy - s * 0.62, s * 0.92, s * 0.52);
      g.fillRect(cx + s * 0.08, cy - s * 0.62, s * 0.92, s * 0.52);
      g.fillStyle(P.brickDark, 1);
      g.fillRect(cx - s * 0.55, cy - s * 0.04, s * 0.92, s * 0.52);
      g.fillRect(cx + s * 0.45, cy - s * 0.04, s * 0.55, s * 0.52);
      break;
    }
    case ResourceType.Research: {
      g.fillStyle(P.paper, 1);
      g.fillRect(cx - s * 0.72, cy - s * 0.85, s * 1.44, s * 1.7);
      g.lineStyle(1.4, P.inkBlue, 1);
      for (let i = 0; i < 3; i++) {
        g.lineBetween(cx - s * 0.44, cy - s * 0.4 + i * s * 0.42, cx + s * 0.44, cy - s * 0.4 + i * s * 0.42);
      }
      break;
    }
    case ResourceType.Leather: {
      g.fillStyle(P.leather, 1);
      g.fillCircle(cx, cy, s * 0.78);
      g.fillTriangle(cx - s * 0.66, cy - s * 0.38, cx - s * 0.2, cy - s * 0.95, cx - s * 0.12, cy - s * 0.3);
      g.fillTriangle(cx + s * 0.66, cy - s * 0.38, cx + s * 0.2, cy - s * 0.95, cx + s * 0.12, cy - s * 0.3);
      g.lineStyle(1, P.leatherDark, 0.9);
      g.strokeCircle(cx, cy, s * 0.5);
      break;
    }
    case ResourceType.Tools: {
      g.lineStyle(2, P.plankDark, 1);
      g.lineBetween(cx - s * 0.5, cy + s * 0.72, cx + s * 0.28, cy - s * 0.28);
      g.fillStyle(P.steel, 1);
      g.fillRoundedRect(cx + s * 0.02, cy - s * 0.85, s * 0.95, s * 0.62, 2);
      break;
    }
    case ResourceType.Water: {
      g.fillStyle(P.water, 1);
      g.fillTriangle(cx - s * 0.55, cy - s * 0.1, cx + s * 0.55, cy - s * 0.1, cx, cy - s);
      g.fillCircle(cx, cy + s * 0.28, s * 0.68);
      g.fillStyle(P.waterLight, 0.85);
      g.fillEllipse(cx - s * 0.22, cy + s * 0.05, s * 0.3, s * 0.42);
      break;
    }
    case "person": {
      g.fillStyle(0xf0e8d8, 1);
      g.fillCircle(cx, cy - s * 0.45, s * 0.38);
      g.fillEllipse(cx, cy + s * 0.42, s * 0.95, s * 0.85);
      break;
    }
    case "heart": {
      g.fillCircle(cx - s * 0.32, cy - s * 0.28, s * 0.44);
      g.fillCircle(cx + s * 0.32, cy - s * 0.28, s * 0.44);
      g.fillTriangle(cx - s * 0.72, cy - s * 0.05, cx + s * 0.72, cy - s * 0.05, cx, cy + s * 0.85);
      break;
    }
    case "shield": {
      g.fillStyle(0x9aa5b5, 1);
      const w = s * 0.85;
      g.fillTriangle(cx - w, cy - s * 0.75, cx + w, cy - s * 0.75, cx, cy + s * 0.9);
      g.fillRect(cx - w, cy - s * 0.75, w * 2, s * 0.5);
      g.lineStyle(1.2, 0x6a7484, 1);
      g.strokeTriangle(cx - w, cy - s * 0.75, cx + w, cy - s * 0.75, cx, cy + s * 0.9);
      break;
    }
    case "lock": {
      g.fillStyle(0x8a8f9a, 1);
      g.fillRect(cx - s * 0.6, cy - s * 0.05, s * 1.2, s * 0.95);
      g.lineStyle(1.8, 0x8a8f9a, 1);
      g.strokeCircle(cx, cy - s * 0.28, s * 0.38);
      g.fillStyle(0x3a3f48, 1);
      g.fillCircle(cx, cy + s * 0.38, s * 0.18);
      break;
    }
    case "book": {
      g.fillStyle(P.paper, 1);
      g.fillRoundedRect(cx - s * 0.75, cy - s * 0.8, s * 1.5, s * 1.6, 2);
      g.lineStyle(1.4, C_BOOK, 1);
      g.strokeRoundedRect(cx - s * 0.75, cy - s * 0.8, s * 1.5, s * 1.6, 2);
      g.lineStyle(1.4, C_BOOK, 1);
      g.lineBetween(cx, cy - s * 0.8, cx, cy + s * 0.8);
      break;
    }
    case "warning": {
      g.fillStyle(0xe0a458, 1);
      g.fillTriangle(cx - s, cy + s * 0.75, cx + s, cy + s * 0.75, cx, cy - s * 0.85);
      g.fillStyle(0x2a2018, 1);
      g.fillRect(cx - s * 0.11, cy - s * 0.32, s * 0.24, s * 0.72);
      g.fillCircle(cx, cy + s * 0.56, s * 0.13);
      break;
    }
    case "forest": {
      g.fillStyle(P.woodDark, 1);
      g.fillRect(cx - 1, cy + s * 0.3, 2, s * 0.5);
      g.fillStyle(0x4a7a3a, 1);
      g.fillTriangle(cx - s * 0.7, cy + s * 0.3, cx + s * 0.7, cy + s * 0.3, cx, cy - s * 0.85);
      break;
    }
    case "mountain": {
      g.fillStyle(P.stone, 1);
      g.fillTriangle(cx - s, cy + s * 0.6, cx + s, cy + s * 0.6, cx + s * 0.1, cy - s * 0.75);
      g.fillStyle(0xe8ecf2, 1);
      g.fillTriangle(cx + s * 0.1, cy - s * 0.75, cx - s * 0.18, cy - s * 0.2, cx + s * 0.38, cy - s * 0.2);
      break;
    }
    case "farmable": {
      g.lineStyle(1.5, P.grainDark, 1);
      for (let i = -1; i <= 1; i++) {
        g.lineBetween(cx - s * 0.7, cy + i * s * 0.45, cx + s * 0.7, cy + i * s * 0.45);
      }
      break;
    }
  }
}

export function iconColor(key: IconKey): string {
  switch (key) {
    case ResourceType.Gold:
      return "#e0bc55";
    case ResourceType.Food:
      return "#d8b25a";
    case ResourceType.Wood:
    case ResourceType.Planks:
      return "#c09454";
    case ResourceType.Stone:
      return "#9aa0aa";
    case ResourceType.Bricks:
      return "#c06a45";
    case ResourceType.Research:
      return "#8ab5d8";
    case ResourceType.Leather:
      return "#b58150";
    case ResourceType.Tools:
      return "#b8bcc4";
    case ResourceType.Water:
      return "#5a9ac8";
    default:
      return "#f0e8d8";
  }
}
