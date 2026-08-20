import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TileType, BuildingType, Season } from "../types";
import { TILE_SIZE, GRID_COLS, GRID_ROWS, BUILDINGS } from "../config";

const TILE_BASE: Record<TileType, { r: number; g: number; b: number }> = {
  [TileType.Grass]: { r: 74, g: 122, b: 58 },
  [TileType.Forest]: { r: 45, g: 90, b: 37 },
  [TileType.Water]: { r: 42, g: 106, b: 156 },
  [TileType.Mountain]: { r: 122, g: 122, b: 122 },
  [TileType.Farmable]: { r: 90, g: 138, b: 58 },
};

const SEASON_TINT: Record<Season, { r: number; g: number; b: number }> = {
  [Season.Spring]: { r: 10, g: 8, b: 0 },
  [Season.Summer]: { r: 0, g: 0, b: -10 },
  [Season.Autumn]: { r: 15, g: -10, b: -15 },
  [Season.Winter]: { r: -20, g: -15, b: 10 },
};

function tileColor(type: TileType, x: number, y: number, season: Season): number {
  const base = TILE_BASE[type];
  const noise = ((x * 7 + y * 13) % 17) / 17;
  const variation = Math.floor((noise - 0.5) * 16);
  const tint = SEASON_TINT[season];

  const r = Phaser.Math.Clamp(base.r + variation + tint.r, 0, 255);
  const g = Phaser.Math.Clamp(base.g + variation + tint.g, 0, 255);
  const b = Phaser.Math.Clamp(base.b + variation + tint.b, 0, 255);

  return (r << 16) | (g << 8) | b;
}

interface BuildingVisual {
  type: BuildingType;
  draw: (scene: Phaser.Scene, cx: number, cy: number) => Phaser.GameObjects.GameObject[];
}

const BUILDING_VISUALS: BuildingVisual[] = [
  {
    type: BuildingType.House,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 4, 14, 10, 0x6b4a2a);
      const roof = scene.add.triangle(cx, cy - 6, -9, 6, 0, -6, 9, 6, 0x8b3a1a);
      const door = scene.add.rectangle(cx, cy + 6, 4, 5, 0x3a2a1a);
      return [base, roof, door];
    },
  },
  {
    type: BuildingType.Farm,
    draw: (scene, cx, cy) => {
      const field1 = scene.add.rectangle(cx - 6, cy + 2, 8, 6, 0x5a8a2a);
      const field2 = scene.add.rectangle(cx + 6, cy + 2, 8, 6, 0x4a7a1a);
      const barn = scene.add.rectangle(cx, cy - 2, 10, 7, 0x8b5a2a);
      const barnRoof = scene.add.triangle(cx, cy - 8, -6, 4, 0, -3, 6, 4, 0x6b3a1a);
      return [field1, field2, barn, barnRoof];
    },
  },
  {
    type: BuildingType.LumberMill,
    draw: (scene, cx, cy) => {
      const shed = scene.add.rectangle(cx, cy + 2, 12, 8, 0x5a3a1a);
      const saw = scene.add.circle(cx + 4, cy - 2, 3, 0xaaaaaa);
      const log1 = scene.add.rectangle(cx - 5, cy + 6, 6, 3, 0x4a2a0a);
      const log2 = scene.add.rectangle(cx + 5, cy + 6, 6, 3, 0x3a2005);
      return [shed, saw, log1, log2];
    },
  },
  {
    type: BuildingType.Quarry,
    draw: (scene, cx, cy) => {
      const pit = scene.add.rectangle(cx, cy + 4, 14, 8, 0x6a6a6a);
      const rock1 = scene.add.circle(cx - 3, cy, 4, 0x8a8a8a);
      const rock2 = scene.add.circle(cx + 4, cy + 2, 3, 0x7a7a7a);
      const cart = scene.add.rectangle(cx + 6, cy - 2, 5, 4, 0x5a3a1a);
      return [pit, rock1, rock2, cart];
    },
  },
  {
    type: BuildingType.Sawmill,
    draw: (scene, cx, cy) => {
      const building = scene.add.rectangle(cx, cy + 2, 12, 8, 0x7a5a3a);
      const roof = scene.add.triangle(cx, cy - 5, -7, 4, 0, -3, 7, 4, 0x5a3a1a);
      const blade = scene.add.circle(cx + 5, cy, 3, 0xcccccc);
      const planks = scene.add.rectangle(cx - 4, cy + 6, 8, 2, 0xb08040);
      return [building, roof, blade, planks];
    },
  },
  {
    type: BuildingType.Brickyard,
    draw: (scene, cx, cy) => {
      const kiln = scene.add.rectangle(cx, cy + 2, 12, 8, 0xaa5533);
      const chimney = scene.add.rectangle(cx + 4, cy - 6, 3, 8, 0x884422);
      const bricks = scene.add.rectangle(cx - 4, cy + 5, 6, 3, 0xcc6644);
      return [kiln, chimney, bricks];
    },
  },
  {
    type: BuildingType.Warehouse,
    draw: (scene, cx, cy) => {
      const main = scene.add.rectangle(cx, cy + 2, 14, 10, 0x555555);
      const roof = scene.add.rectangle(cx, cy - 5, 16, 3, 0x444444);
      const crate1 = scene.add.rectangle(cx - 3, cy + 4, 4, 4, 0x6a5a3a);
      const crate2 = scene.add.rectangle(cx + 3, cy + 4, 4, 4, 0x5a4a2a);
      return [main, roof, crate1, crate2];
    },
  },
  {
    type: BuildingType.Market,
    draw: (scene, cx, cy) => {
      const stall = scene.add.rectangle(cx, cy + 2, 14, 8, 0x8b6a3a);
      const awning = scene.add.rectangle(cx, cy - 4, 16, 4, 0xcc3333);
      const awning2 = scene.add.triangle(cx, cy - 8, -8, 3, 0, 0, 8, 3, 0xaa2222);
      const goods = scene.add.circle(cx, cy + 2, 3, 0xc9a84c);
      return [stall, awning, awning2, goods];
    },
  },
  {
    type: BuildingType.TradingPost,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 2, 12, 8, 0x3a5a8a);
      const sign = scene.add.rectangle(cx, cy - 5, 10, 3, 0x3366aa);
      const coin = scene.add.circle(cx, cy + 1, 3, 0xc9a84c);
      return [base, sign, coin];
    },
  },
  {
    type: BuildingType.ResearchLab,
    draw: (scene, cx, cy) => {
      const lab = scene.add.rectangle(cx, cy + 2, 12, 8, 0x3a5a7a);
      const roof = scene.add.rectangle(cx, cy - 5, 14, 3, 0x2a4a6a);
      const flask = scene.add.circle(cx, cy, 3, 0x5588cc);
      return [lab, roof, flask];
    },
  },
  {
    type: BuildingType.Garden,
    draw: (scene, cx, cy) => {
      const bed = scene.add.rectangle(cx, cy + 2, 12, 8, 0x3a8a3a);
      const flower1 = scene.add.circle(cx - 3, cy, 2, 0xff6688);
      const flower2 = scene.add.circle(cx + 3, cy - 1, 2, 0xffcc44);
      const flower3 = scene.add.circle(cx, cy + 3, 2, 0xaa66ff);
      return [bed, flower1, flower2, flower3];
    },
  },
  {
    type: BuildingType.Inn,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 2, 14, 8, 0x6a4a2a);
      const roof = scene.add.triangle(cx, cy - 5, -8, 4, 0, -4, 8, 4, 0x5a3a1a);
      const sign = scene.add.rectangle(cx + 6, cy - 2, 4, 3, 0xc9a84c);
      return [base, roof, sign];
    },
  },
  {
    type: BuildingType.Academy,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 2, 14, 10, 0x3a4a7a);
      const columns = scene.add.rectangle(cx, cy - 2, 12, 2, 0xccccdd);
      const roof = scene.add.triangle(cx, cy - 7, -8, 4, 0, -3, 8, 4, 0x2a3a6a);
      return [base, columns, roof];
    },
  },
  {
    type: BuildingType.Wall,
    draw: (scene, cx, cy) => {
      const wall = scene.add.rectangle(cx, cy + 2, 14, 10, 0x777777);
      const merlon1 = scene.add.rectangle(cx - 4, cy - 4, 3, 4, 0x888888);
      const merlon2 = scene.add.rectangle(cx + 4, cy - 4, 3, 4, 0x888888);
      return [wall, merlon1, merlon2];
    },
  },
  {
    type: BuildingType.Tannery,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 2, 12, 8, 0x7a5a2a);
      const vat = scene.add.circle(cx, cy + 1, 4, 0x8b6914);
      const hide = scene.add.rectangle(cx - 4, cy + 4, 5, 3, 0xb08040);
      return [base, vat, hide];
    },
  },
  {
    type: BuildingType.Forge,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 2, 12, 8, 0x555555);
      const anvil = scene.add.rectangle(cx - 2, cy + 1, 5, 4, 0x666666);
      const fire = scene.add.circle(cx + 4, cy, 3, 0xff6622);
      return [base, anvil, fire];
    },
  },
  {
    type: BuildingType.Tavern,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 2, 14, 8, 0x7a5a2a);
      const roof = scene.add.triangle(cx, cy - 5, -8, 4, 0, -4, 8, 4, 0x6a4a1a);
      const mug = scene.add.rectangle(cx + 5, cy, 3, 4, 0xddcc88);
      return [base, roof, mug];
    },
  },
  {
    type: BuildingType.Tower,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 3, 10, 12, 0x666688);
      const top = scene.add.rectangle(cx, cy - 5, 12, 4, 0x777799);
      const flag = scene.add.triangle(cx + 4, cy - 8, 0, 0, 6, 2, 0, 4, 0xcc3333);
      return [base, top, flag];
    },
  },
  {
    type: BuildingType.Chapel,
    draw: (scene, cx, cy) => {
      const base = scene.add.rectangle(cx, cy + 2, 12, 10, 0xccbbaa);
      const steeple = scene.add.triangle(cx, cy - 8, -4, 6, 0, -4, 4, 6, 0xbbaa99);
      const cross = scene.add.rectangle(cx, cy - 10, 1, 4, 0xddddcc);
      const crossBar = scene.add.rectangle(cx, cy - 9, 3, 1, 0xddddcc);
      return [base, steeple, cross, crossBar];
    },
  },
  {
    type: BuildingType.Well,
    draw: (scene, cx, cy) => {
      const base = scene.add.circle(cx, cy + 2, 6, 0x5a5a5a);
      const water = scene.add.circle(cx, cy + 2, 4, 0x4488cc);
      const roof = scene.add.rectangle(cx, cy - 5, 8, 3, 0x6a4a2a);
      return [base, water, roof];
    },
  },
];

export class TileMap {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  tiles: Phaser.GameObjects.Rectangle[][] = [];
  buildingGfx: Phaser.GameObjects.Container[] = [];
  hoverHighlight: Phaser.GameObjects.Rectangle;
  shadowLayer: Phaser.GameObjects.Graphics;
  currentSeason: Season = Season.Spring;
  minimapContainer: Phaser.GameObjects.Container;
  minimapPixels: Phaser.GameObjects.Rectangle[][] = [];
  minimapCam: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);

    this.shadowLayer = scene.add.graphics();
    this.container.add(this.shadowLayer);

    for (let y = 0; y < GRID_ROWS; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const rect = scene.add.rectangle(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE - 1,
          TILE_SIZE - 1,
          0x3d6b35
        );
        rect.setStrokeStyle(1, 0x000000, 0.08);
        this.tiles[y][x] = rect;
        this.container.add(rect);
      }
    }

    this.hoverHighlight = scene.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE);
    this.hoverHighlight.setStrokeStyle(2, 0xffffff);
    this.hoverHighlight.setFillStyle(0xffffff, 0.15);
    this.hoverHighlight.setVisible(false);
    this.container.add(this.hoverHighlight);

    this.minimapContainer = scene.add.container(1280 - GRID_COLS * 4 - 12, 720 - GRID_ROWS * 4 - 12);
    const mmBg = scene.add.rectangle(GRID_COLS * 2, GRID_ROWS * 2, GRID_COLS * 4 + 4, GRID_ROWS * 4 + 4, 0x0f0f1e, 0.85);
    mmBg.setStrokeStyle(1, 0xc9a84c, 0.4);
    this.minimapContainer.add(mmBg);

    for (let y = 0; y < GRID_ROWS; y++) {
      this.minimapPixels[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const px = scene.add.rectangle(x * 4 + 2, y * 4 + 2, 4, 4, 0x3d6b35);
        this.minimapPixels[y][x] = px;
        this.minimapContainer.add(px);
      }
    }

    this.minimapCam = scene.add.graphics();
    this.minimapContainer.add(this.minimapCam);

    this.minimapContainer.setDepth(90);
  }

  sync(state: GameState): void {
    if (state.season !== this.currentSeason) {
      this.currentSeason = state.season;
    }

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const tile = state.tiles[y][x];
        const rect = this.tiles[y][x];

        if (tile.buildingId !== null) {
          const building = state.buildings.find((b) => b.id === tile.buildingId);
          if (building) {
            rect.setFillStyle(BUILDINGS[building.type].color);
          } else {
            rect.setFillStyle(tileColor(tile.type, x, y, state.season));
          }
        } else {
          rect.setFillStyle(tileColor(tile.type, x, y, state.season));
        }
      }
    }

    for (const gfx of this.buildingGfx) {
      gfx.destroy();
    }
    this.buildingGfx = [];

    this.shadowLayer.clear();

    for (const building of state.buildings) {
      const def = BUILDINGS[building.type];
      const cx = building.gridX * TILE_SIZE + (def.size.w * TILE_SIZE) / 2;
      const cy = building.gridY * TILE_SIZE + (def.size.h * TILE_SIZE) / 2;

      this.shadowLayer.fillStyle(0x000000, 0.15);
      this.shadowLayer.fillEllipse(cx + 2, cy + 6, def.size.w * TILE_SIZE * 0.7, def.size.h * TILE_SIZE * 0.3);

      const visual = BUILDING_VISUALS.find((v) => v.type === building.type);
      if (visual) {
        const objs = visual.draw(this.scene, cx, cy);
        const container = this.scene.add.container(0, 0);
        for (const obj of objs) {
          container.add(obj);
        }
        this.container.add(container);
        this.buildingGfx.push(container);
      }
    }

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const tile = state.tiles[y][x];
        const px = this.minimapPixels[y][x];
        if (tile.buildingId !== null) {
          const building = state.buildings.find((b) => b.id === tile.buildingId);
          if (building) {
            px.setFillStyle(BUILDINGS[building.type].color);
          } else {
            px.setFillStyle(tileColor(tile.type, x, y, state.season));
          }
        } else {
          px.setFillStyle(tileColor(tile.type, x, y, state.season));
        }
      }
    }

    this.minimapCam.clear();
    const camW = Math.floor(this.scene.cameras.main.width / this.scene.cameras.main.zoom);
    const camH = Math.floor(this.scene.cameras.main.height / this.scene.cameras.main.zoom);
    const camX = Math.floor(-this.scene.cameras.main.scrollX / this.scene.cameras.main.zoom);
    const camY = Math.floor(-this.scene.cameras.main.scrollY / this.scene.cameras.main.zoom);
    const mmScale = 4;
    this.minimapCam.lineStyle(1, 0xffffff, 0.6);
    this.minimapCam.strokeRect(
      (camX / TILE_SIZE) * mmScale,
      (camY / TILE_SIZE) * mmScale,
      (camW / TILE_SIZE) * mmScale,
      (camH / TILE_SIZE) * mmScale
    );
  }

  showHover(gridX: number, gridY: number, valid: boolean): void {
    this.hoverHighlight.setPosition(
      gridX * TILE_SIZE + TILE_SIZE / 2,
      gridY * TILE_SIZE + TILE_SIZE / 2
    );
    this.hoverHighlight.setSize(TILE_SIZE, TILE_SIZE);
    this.hoverHighlight.setStrokeStyle(2, valid ? 0x00ff00 : 0xff0000);
    this.hoverHighlight.setFillStyle(valid ? 0x00ff00 : 0xff0000, 0.1);
    this.hoverHighlight.setVisible(true);
  }

  hideHover(): void {
    this.hoverHighlight.setVisible(false);
  }

  setBuildingPreview(type: BuildingType, gridX: number, gridY: number, valid: boolean): void {
    const def = BUILDINGS[type];
    const w = def.size.w * TILE_SIZE;
    const h = def.size.h * TILE_SIZE;
    this.hoverHighlight.setSize(w, h);
    this.hoverHighlight.setPosition(gridX * TILE_SIZE + w / 2, gridY * TILE_SIZE + h / 2);
    this.hoverHighlight.setFillStyle(valid ? 0x00ff00 : 0xff0000, 0.2);
    this.hoverHighlight.setStrokeStyle(2, valid ? 0x00ff00 : 0xff0000);
    this.hoverHighlight.setVisible(true);
  }

  clearPreview(): void {
    this.hoverHighlight.setSize(TILE_SIZE, TILE_SIZE);
    this.hoverHighlight.setVisible(false);
  }

  destroy(): void {
    this.container.destroy();
  }
}
