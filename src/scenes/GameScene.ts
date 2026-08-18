import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TileMap } from "../map/TileMap";
import { HUD } from "../ui/HUD";
import { BuildPanel } from "../ui/BuildPanel";
import { ProductionSystem } from "../systems/ProductionSystem";
import { PopulationSystem } from "../systems/PopulationSystem";
import { SeasonSystem } from "../systems/SeasonSystem";
import { BuildingType } from "../types";
import { TILE_SIZE, GRID_COLS, GRID_ROWS, TICK_RATE_MS } from "../config";

export class GameScene extends Phaser.Scene {
  state!: GameState;
  tileMap!: TileMap;
  hud!: HUD;
  buildPanel!: BuildPanel;
  prodSystem!: ProductionSystem;
  popSystem!: PopulationSystem;
  seasonSystem!: SeasonSystem;

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
      this.handleClick(pointer);
    });

    this.input.keyboard?.on("keydown-ESC", () => {
      this.selectedBuildType = null;
      this.buildPanel.deselect();
      this.tileMap.clearPreview();
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.state.gameSpeed = this.state.gameSpeed >= 3 ? 1 : this.state.gameSpeed + 1;
    });

    this.input.keyboard?.on("keydown-ONE", () => {
      this.selectedBuildType = BuildingType.House;
      this.buildPanel.selectedType = BuildingType.House;
      this.buildPanel.updateSelection();
    });

    this.input.keyboard?.on("keydown-TWO", () => {
      this.selectedBuildType = BuildingType.Farm;
      this.buildPanel.selectedType = BuildingType.Farm;
      this.buildPanel.updateSelection();
    });

    this.input.keyboard?.on("keydown-THREE", () => {
      this.selectedBuildType = BuildingType.LumberMill;
      this.buildPanel.selectedType = BuildingType.LumberMill;
      this.buildPanel.updateSelection();
    });

    this.input.keyboard?.on("keydown-FOUR", () => {
      this.selectedBuildType = BuildingType.Warehouse;
      this.buildPanel.selectedType = BuildingType.Warehouse;
      this.buildPanel.updateSelection();
    });

    this.input.keyboard?.on("keydown-FIVE", () => {
      this.selectedBuildType = BuildingType.Market;
      this.buildPanel.selectedType = BuildingType.Market;
      this.buildPanel.updateSelection();
    });

    this.input.on("wheel", (pointer: Phaser.Input.Pointer, _go: any, _dx: number, dy: number) => {
      const newZoom = this.camera.zoom + (dy > 0 ? -0.1 : 0.1);
      this.camera.setZoom(Phaser.Math.Clamp(newZoom, 0.3, 2));
    });

    this.lastTick = this.time.now;
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
      this.tileMap.showHover(gridX, gridY, true);
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
        const def = this.state.getBuildingDef(this.selectedBuildType);
        this.hud.setInfo(`${def?.name} built!`, "#5cb85c");
      } else {
        this.hud.setInfo("Cannot build here!", "#ff4444");
      }
    }
  }

  update(_time: number, delta: number): void {
    if (this.state.gameOver) return;

    const tickInterval = TICK_RATE_MS / this.state.gameSpeed;
    if (this.time.now - this.lastTick >= tickInterval) {
      this.lastTick = this.time.now;

      this.seasonSystem.update(this.state);
      this.prodSystem.update(this.state);
      this.popSystem.update(this.state);

      this.state.totalTicks++;

      if (this.state.population.total <= 0 && this.state.buildings.length > 0) {
        this.state.gameOver = true;
      }

      this.tileMap.sync(this.state);
      this.hud.update(this.state);
    }
  }
}
