import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TileType, BuildingType } from "../types";
import { TILE_SIZE, GRID_COLS, GRID_ROWS, BUILDINGS } from "../config";

const TILE_COLORS: Record<TileType, number> = {
  [TileType.Grass]: 0x3d6b35,
  [TileType.Forest]: 0x2d5a25,
  [TileType.Water]: 0x2a5a8c,
  [TileType.Mountain]: 0x6b6b6b,
  [TileType.Farmable]: 0x5a7a3a,
};

export class TileMap {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  tiles: Phaser.GameObjects.Rectangle[][] = [];
  buildingGraphics: Phaser.GameObjects.Rectangle[] = [];
  hoverHighlight: Phaser.GameObjects.Rectangle;
  gridGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);

    this.gridGraphics = scene.add.graphics();
    this.container.add(this.gridGraphics);

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
        this.tiles[y][x] = rect;
        this.container.add(rect);
      }
    }

    this.hoverHighlight = scene.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE);
    this.hoverHighlight.setStrokeStyle(2, 0xffffff);
    this.hoverHighlight.setFillStyle(0xffffff, 0.15);
    this.hoverHighlight.setVisible(false);
    this.container.add(this.hoverHighlight);
  }

  sync(state: GameState): void {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const tile = state.tiles[y][x];
        const rect = this.tiles[y][x];
        let color = TILE_COLORS[tile.type];

        if (tile.buildingId !== null) {
          const building = state.buildings.find((b) => b.id === tile.buildingId);
          if (building) {
            const def = BUILDINGS[building.type];
            color = def.color;
          }
        }

        rect.setFillStyle(color);
      }
    }

    for (const gfx of this.buildingGraphics) {
      gfx.destroy();
    }
    this.buildingGraphics = [];

    for (const building of state.buildings) {
      const def = BUILDINGS[building.type];
      const cx = building.gridX * TILE_SIZE + (def.size.w * TILE_SIZE) / 2;
      const cy = building.gridY * TILE_SIZE + (def.size.h * TILE_SIZE) / 2;

      if (building.type === BuildingType.House) {
        const roof = this.scene.add.triangle(
          cx,
          cy - 6,
          0, 8,
          8, -4,
          16, 8,
          0x8b4513
        );
        this.container.add(roof);
        this.buildingGraphics.push(roof as any);
      } else if (building.type === BuildingType.Farm) {
        const flag = this.scene.add.rectangle(cx, cy - 8, 2, 12, 0x8b4513);
        const banner = this.scene.add.rectangle(cx + 4, cy - 12, 6, 4, 0xc9a84c);
        this.container.add(flag);
        this.container.add(banner);
        this.buildingGraphics.push(flag, banner);
      } else if (building.type === BuildingType.LumberMill) {
        const log = this.scene.add.rectangle(cx, cy + 4, 10, 4, 0x4a3000);
        this.container.add(log);
        this.buildingGraphics.push(log);
      } else if (building.type === BuildingType.Quarry) {
        const rock = this.scene.add.circle(cx, cy + 2, 5, 0x999999);
        this.container.add(rock);
        this.buildingGraphics.push(rock as any);
      } else if (building.type === BuildingType.Sawmill) {
        const blade = this.scene.add.circle(cx, cy, 4, 0xcccccc);
        this.container.add(blade);
        this.buildingGraphics.push(blade as any);
      } else if (building.type === BuildingType.Brickyard) {
        const chimney = this.scene.add.rectangle(cx + 4, cy - 6, 3, 8, 0xaa5533);
        this.container.add(chimney);
        this.buildingGraphics.push(chimney);
      } else if (building.type === BuildingType.Market) {
        const awning = this.scene.add.rectangle(cx, cy - 4, 12, 3, 0xcc3333);
        this.container.add(awning);
        this.buildingGraphics.push(awning);
      } else if (building.type === BuildingType.TradingPost) {
        const sign = this.scene.add.rectangle(cx, cy - 6, 8, 3, 0x3366aa);
        this.container.add(sign);
        this.buildingGraphics.push(sign);
      }
    }
  }

  showHover(gridX: number, gridY: number, valid: boolean): void {
    this.hoverHighlight.setPosition(
      gridX * TILE_SIZE + TILE_SIZE / 2,
      gridY * TILE_SIZE + TILE_SIZE / 2
    );
    this.hoverHighlight.setStrokeStyle(2, valid ? 0x00ff00 : 0xff0000);
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
    this.hoverHighlight.setPosition(
      gridX * TILE_SIZE + w / 2,
      gridY * TILE_SIZE + h / 2
    );
    this.hoverHighlight.setFillStyle(valid ? 0x00ff00 : 0xff0000, 0.25);
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
