import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TileMap } from "../map/TileMap";
import { HUD } from "../ui/HUD";
import { BuildPanel } from "../ui/BuildPanel";
import { ProductionSystem } from "../systems/ProductionSystem";
import { PopulationSystem } from "../systems/PopulationSystem";
import { SeasonSystem } from "../systems/SeasonSystem";
import { EventSystem } from "../systems/EventSystem";
import { BuildingType } from "../types";
import { TILE_SIZE, GRID_COLS, GRID_ROWS, TICK_RATE_MS, BUILDINGS } from "../config";

export class GameScene extends Phaser.Scene {
  state!: GameState;
  tileMap!: TileMap;
  hud!: HUD;
  buildPanel!: BuildPanel;
  prodSystem!: ProductionSystem;
  popSystem!: PopulationSystem;
  seasonSystem!: SeasonSystem;
  eventSystem!: EventSystem;

  lastTick: number = 0;
  selectedBuildType: BuildingType | null = null;
  camera!: Phaser.Cameras.Scene2D.Camera;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.state = new GameState();
    this.tileMap = new TileMap(this);
    this.hud = new HUD(this);
    this.prodSystem = new ProductionSystem();
    this.popSystem = new PopulationSystem();
    this.seasonSystem = new SeasonSystem();
    this.eventSystem = new EventSystem();

    this.buildPanel = new BuildPanel(this, (type) => {
      this.selectedBuildType = type;
    });

    this.tileMap.sync(this.state);

    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, GRID_COLS * TILE_SIZE, GRID_ROWS * TILE_SIZE);
    this.camera.setBackgroundColor("#1a1a2e");

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.handleHover(pointer);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      } else {
        this.handleClick(pointer);
      }
    });

    this.input.mouse?.disableContextMenu();

    this.input.keyboard?.on("keydown-ESC", () => {
      this.selectedBuildType = null;
      this.buildPanel.deselect();
      this.tileMap.clearPreview();
      this.hud.hideTrade();
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.state.gameSpeed = this.state.gameSpeed >= 3 ? 1 : this.state.gameSpeed + 1;
    });

    this.input.keyboard?.on("keydown-T", () => {
      this.hud.toggleTrade(this.state);
    });

    this.input.keyboard?.on("keydown-ONE", () => this.selectBuild(BuildingType.House));
    this.input.keyboard?.on("keydown-TWO", () => this.selectBuild(BuildingType.Farm));
    this.input.keyboard?.on("keydown-THREE", () => this.selectBuild(BuildingType.LumberMill));
    this.input.keyboard?.on("keydown-FOUR", () => this.selectBuild(BuildingType.Quarry));
    this.input.keyboard?.on("keydown-FIVE", () => this.selectBuild(BuildingType.Sawmill));
    this.input.keyboard?.on("keydown-SIX", () => this.selectBuild(BuildingType.Brickyard));
    this.input.keyboard?.on("keydown-SEVEN", () => this.selectBuild(BuildingType.Warehouse));
    this.input.keyboard?.on("keydown-EIGHT", () => this.selectBuild(BuildingType.Market));
    this.input.keyboard?.on("keydown-NINE", () => this.selectBuild(BuildingType.TradingPost));

    this.input.on("wheel", (_p: any, _go: any, _dx: number, dy: number) => {
      const newZoom = this.camera.zoom + (dy > 0 ? -0.1 : 0.1);
      this.camera.setZoom(Phaser.Math.Clamp(newZoom, 0.3, 2));
    });

    this.lastTick = this.time.now;
    this.cameras.main.fadeIn(400, 15, 15, 30);
  }

  private selectBuild(type: BuildingType): void {
    this.selectedBuildType = type;
    this.buildPanel.selectedType = type;
    this.buildPanel.updateSelection();
  }

  private handleHover(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
    const gridX = Math.floor(worldPoint.x / TILE_SIZE);
    const gridY = Math.floor(worldPoint.y / TILE_SIZE);

    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
      this.tileMap.hideHover();
      return;
    }

    if (this.selectedBuildType) {
      const valid = this.state.canPlaceBuilding(this.selectedBuildType, gridX, gridY);
      this.tileMap.setBuildingPreview(this.selectedBuildType, gridX, gridY, valid);
    } else {
      const tile = this.state.tiles[gridY]?.[gridX];
      if (tile && tile.buildingId !== null) {
        const building = this.state.buildings.find((b) => b.id === tile.buildingId);
        if (building) {
          const def = BUILDINGS[building.type];
          this.hud.setInfo(`${def.name} [RMB: demolish, 50% refund]`, "#aaaaaa");
        }
      } else {
        this.tileMap.showHover(gridX, gridY, true);
        this.hud.setInfo("");
      }
    }
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
    const gridX = Math.floor(worldPoint.x / TILE_SIZE);
    const gridY = Math.floor(worldPoint.y / TILE_SIZE);

    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;

    if (this.selectedBuildType) {
      const placed = this.state.placeBuilding(this.selectedBuildType, gridX, gridY);
      if (placed) {
        this.tileMap.sync(this.state);
        const def = BUILDINGS[this.selectedBuildType];
        this.hud.setInfo(`${def.name} built!`, "#5cb85c");
      } else {
        this.hud.setInfo("Cannot build here!", "#ff4444");
      }
    }
  }

  private handleRightClick(pointer: Phaser.Input.Pointer): void {
    if (this.selectedBuildType) {
      this.selectedBuildType = null;
      this.buildPanel.deselect();
      this.tileMap.clearPreview();
      return;
    }

    const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
    const gridX = Math.floor(worldPoint.x / TILE_SIZE);
    const gridY = Math.floor(worldPoint.y / TILE_SIZE);

    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;

    const tile = this.state.tiles[gridY]?.[gridX];
    if (tile && tile.buildingId !== null) {
      const removed = this.state.removeBuilding(tile.buildingId);
      if (removed) {
        this.tileMap.sync(this.state);
        this.hud.setInfo("Building demolished (50% refund).", "#d9534f");
      }
    }
  }

  update(_time: number, _delta: number): void {
    if (this.state.gameOver) return;

    const tickInterval = TICK_RATE_MS / this.state.gameSpeed;
    if (this.time.now - this.lastTick >= tickInterval) {
      this.lastTick = this.time.now;

      this.seasonSystem.update(this.state);
      this.eventSystem.update(this.state);
      this.prodSystem.update(this.state);
      this.popSystem.update(this.state);

      this.state.totalTicks++;

      if (this.state.population.total <= 0 && this.state.buildings.length > 0) {
        this.state.gameOver = true;
      }

      this.tileMap.sync(this.state);
      this.hud.update(this.state);

      const seasonBgs: Record<string, number> = {
        spring: 0x1a2a1e,
        summer: 0x1a1a2e,
        autumn: 0x2a1a1a,
        winter: 0x1a1a2a,
      };
      this.cameras.main.setBackgroundColor(seasonBgs[this.state.season] || 0x0f0f1e);
    }
  }
}
