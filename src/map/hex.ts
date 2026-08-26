import { GRID_COLS, GRID_ROWS } from "../config";

export const HEX_SIZE = 26;
export const SQRT3 = Math.sqrt(3);
export const HEX_W = SQRT3 * HEX_SIZE;
export const HEX_H = 2 * HEX_SIZE;
export const ROW_STEP = 1.5 * HEX_SIZE;

export const MAP_W = GRID_COLS * HEX_W + HEX_W / 2;
export const MAP_H = (GRID_ROWS - 1) * ROW_STEP + HEX_H;

export interface Offset {
  col: number;
  row: number;
}

const EVEN_DIRS: [number, number][] = [
  [1, 0],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];
const ODD_DIRS: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [0, 1],
  [1, 1],
];

export function neighbors(col: number, row: number): Offset[] {
  const dirs = row & 1 ? ODD_DIRS : EVEN_DIRS;
  return dirs.map(([dc, dr]) => ({ col: col + dc, row: row + dr }));
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

export function hexCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: HEX_W * (col + (row & 1 ? 0.5 : 0)) + HEX_W / 2,
    y: ROW_STEP * row + HEX_SIZE,
  };
}

export function hexCorners(cx: number, cy: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(cx + HEX_SIZE * 0.985 * Math.cos(a), cy + HEX_SIZE * 0.985 * Math.sin(a));
  }
  return pts;
}

function offsetToAxial(col: number, row: number): { q: number; r: number } {
  return { q: col - ((row - (row & 1)) >> 1), r: row };
}

function axialToOffset(q: number, r: number): Offset {
  return { col: q + ((r - (r & 1)) >> 1), row: r };
}

export function pixelToOffset(wx: number, wy: number): Offset {
  const px = wx - HEX_W / 2;
  const py = wy - HEX_SIZE;
  const qf = ((SQRT3 / 3) * px - (1 / 3) * py) / HEX_SIZE;
  const rf = ((2 / 3) * py) / HEX_SIZE;

  let xc = Math.round(qf);
  let zc = Math.round(rf);
  const yc = Math.round(-qf - rf);
  const dx = Math.abs(xc - qf);
  const dy = Math.abs(yc - (-qf - rf));
  const dz = Math.abs(zc - rf);
  if (dx > dy && dx > dz) xc = -yc - zc;
  else if (dz > dy) zc = -xc - yc;

  return axialToOffset(xc, zc);
}

function offsetToCube(col: number, row: number): [number, number, number] {
  const { q, r } = offsetToAxial(col, row);
  return [q, -q - r, r];
}

export function hexDistance(a: Offset, b: Offset): number {
  const ca = offsetToCube(a.col, a.row);
  const cb = offsetToCube(b.col, b.row);
  return Math.max(Math.abs(ca[0] - cb[0]), Math.abs(ca[1] - cb[1]), Math.abs(ca[2] - cb[2]));
}

export function hexesInRange(centerCol: number, centerRow: number, radius: number): Offset[] {
  const out: Offset[] = [];
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = Math.max(-radius, -dr - radius); dc <= Math.min(radius, -dr + radius); dc++) {
      const ax = offsetToAxial(centerCol, centerRow);
      const o = axialToOffset(ax.q + dc, ax.r + dr);
      if (inBounds(o.col, o.row)) out.push(o);
    }
  }
  return out;
}

export function fitZoom(viewW: number, viewH: number): number {
  return Math.min(viewW / MAP_W, viewH / MAP_H);
}
