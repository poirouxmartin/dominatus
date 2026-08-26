import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { TileMap } from "../map/TileMap";
import { HUD } from "../ui/HUD";
import { BuildPanel } from "../ui/BuildPanel";
import { TechPanel } from "../ui/TechPanel";
import { EventLog } from "../ui/EventLog";
import { ProductionSystem } from "../systems/ProductionSystem";
import { PopulationSystem } from "../systems/PopulationSystem";
import { SeasonSystem } from "../systems/SeasonSystem";
import { EventSystem } from "../systems/EventSystem";
import { TechSystem } from "../systems/TechSystem";
import { BuildingType, TileType, Season } from "../types";
import { TICK_RATE_MS, BUILDINGS, VICTORY_POPULATION, VICTORY_TECHS } from "../config";
import { pixelToOffset, inBounds, hexCenter, MAP_W, MAP_H, fitZoom } from "../map/hex";
import { RenderScale, Viewport } from "../ui/theme";
import { AudioManager } from "../audio/AudioManager";

export class GameScene extends Phaser.Scene {
  state!: GameState;
  tileMap!: TileMap;
  hud!: HUD;
  buildPanel!: BuildPanel;
  techPanel!: TechPanel;
  eventLog!: EventLog;
  prodSystem!: ProductionSystem;
  popSystem!: PopulationSystem;
  seasonSystem!: SeasonSystem;
  eventSystem!: EventSystem;
  techSystem!: TechSystem;

  lastTick: number = 0;
  selectedBuildType: BuildingType | null = null;
  camera!: Phaser.Cameras.Scene2D.Camera;
  autoSaveCounter: number = 0;
  minZoom: number = 0.4;
  panning: boolean = false;
  panKeys!: Record<string, Phaser.Input.Keyboard.Key>;
  lastResearchedCount: number = 0;
  baseFit: number = 1;
  prevSpeed: number = 1;
  lastSeason: string = "";
  endShown: boolean = false;
  uiScene?: Phaser.Scene;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.tileMap?.destroy();
    const saved = GameState.loadSave();
    if (saved) {
      this.state = new GameState(saved);
    } else {
      this.state = new GameState();
    }
    this.endShown = false;
    this.lastSeason = "";
    this.hud?.hideEndScreen();
    this.hud?.refreshSpeedLabel();
    this.buildPanel?.rebuild(this.state);
    this.lastResearchedCount = this.state.researchedTechs.length;

    this.tileMap = new TileMap(this);
    if (this.uiScene) this.tileMap.ensureMinimap(this.uiScene);
    this.prodSystem = new ProductionSystem();
    this.popSystem = new PopulationSystem();
    this.seasonSystem = new SeasonSystem();
    this.eventSystem = new EventSystem();
    this.techSystem = new TechSystem();
    this.lastResearchedCount = this.state.researchedTechs.length;

    this.tileMap.sync(this.state);

    this.camera = this.cameras.main;
    const fit = fitZoom(this.camera.width, this.camera.height);
    this.baseFit = fit;
    this.minZoom = fit;
    this.camera.setZoom(fit);
    this.camera.scrollX = MAP_W / 2 - this.camera.width / 2;
    this.camera.scrollY = MAP_H / 2 - this.camera.height / 2;
    this.camera.setBackgroundColor("#10131c");

    if (!this.scene.isActive("UIScene")) {
      this.scene.launch("UIScene");
    }

    this.game.events.on("renderscale", this.onRenderScale, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("renderscale", this.onRenderScale, this);
    });

    // sauvegarde automatique à la fermeture de l'onglet
    window.addEventListener("beforeunload", this.onBeforeUnload);

    this.panKeys = this.input.keyboard!.addKeys(
      "W,A,S,D,LEFT,RIGHT,UP,DOWN"
    ) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.panning && pointer.middleButtonDown()) {
        const dx = pointer.x - pointer.prevPosition.x;
        const dy = pointer.y - pointer.prevPosition.y;
        this.camera.scrollX -= dx / this.camera.zoom;
        this.camera.scrollY -= dy / this.camera.zoom;
        return;
      }
      this.handleHover(pointer);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.hud?.audioSettingsOpen) {
        const dx = pointer.x / RenderScale.value;
        const dy = pointer.y / RenderScale.value;
        const inPopover = dx >= Viewport.w - 254 && dx <= Viewport.w - 14 && dy >= 56 && dy <= 206;
        if (!inPopover) this.hud.closeAudioPopover();
      }
      if (pointer.middleButtonDown()) {
        this.panning = true;
        return;
      }
      if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      } else if (!this.isOverUI(pointer)) {
        this.handleClick(pointer);
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.middleButtonDown()) this.panning = false;
    });

    this.input.mouse?.disableContextMenu();

    this.input.keyboard?.on("keydown-ESC", () => {
      this.selectedBuildType = null;
      this.buildPanel?.deselect();
      this.tileMap.clearPreview();
      this.hud?.hideTrade();
      this.hud?.hideHelp();
      this.hud?.hideProvince();
      this.techPanel?.hide();
      this.eventLog?.hide();
    });

    this.input.keyboard?.on("keydown-P", () => {
      if (this.state.gameSpeed > 0) {
        this.prevSpeed = this.state.gameSpeed;
        this.state.gameSpeed = 0;
      } else {
        this.state.gameSpeed = this.prevSpeed > 0 ? this.prevSpeed : 1;
      }
      AudioManager.inst.playSfx("pause");
      this.hud?.refreshSpeedLabel();
    });

    this.input.keyboard?.on("keydown-H", () => this.hud?.toggleHelp(this.state));

    this.input.keyboard?.on("keydown-E", () => this.hud?.toggleProvince(this.state));

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.state.gameSpeed = this.state.gameSpeed >= 3 ? 1 : this.state.gameSpeed + 1;
    });

    this.input.keyboard?.on("keydown-T", () => {
      this.techPanel?.hide();
      this.hud?.toggleTrade(this.state);
    });

    this.input.keyboard?.on("keydown-R", () => {
      this.hud?.hideTrade();
      this.eventLog?.hide();
      this.techPanel?.toggle(this.state);
    });

    this.input.keyboard?.on("keydown-L", () => {
      this.techPanel?.hide();
      this.hud?.hideTrade();
      this.eventLog?.toggle(this.state);
    });

    this.input.keyboard?.on("keydown-F5", () => {
      this.state.save();
      this.hud?.setInfo("Game saved!", "#8fc07a");
    });

    this.input.keyboard?.on("keydown-F9", () => {
      const saved = GameState.loadSave();
      if (saved) {
        this.state = new GameState(saved);
        this.lastResearchedCount = this.state.researchedTechs.length;
        this.buildPanel?.rebuild(this.state);
        this.tileMap.sync(this.state);
        this.hud?.setInfo("Game loaded!", "#8fc07a");
      } else {
        this.hud?.setInfo("No save found.", "#e07a6a");
      }
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
      const cam = this.camera;
      const ax = cam.width / 2;
      const ay = cam.height / 2;
      const wx = cam.scrollX + ax + (_p.x - ax) / cam.zoom;
      const wy = cam.scrollY + ay + (_p.y - ay) / cam.zoom;
      const step = Math.max(0.08, this.baseFit * 0.06);
      const newZoom = Phaser.Math.Clamp(cam.zoom + (dy > 0 ? -step : step), this.minZoom, this.baseFit * 2.2);
      cam.setZoom(newZoom);
      cam.scrollX = wx - ax - (_p.x - ax) / cam.zoom;
      cam.scrollY = wy - ay - (_p.y - ay) / cam.zoom;
      this.clampCamera();
    });

    this.lastTick = this.time.now;
    this.cameras.main.fadeIn(400, 11, 14, 21);

    const audioInit = (): void => {
      AudioManager.inst.ensure();
      AudioManager.inst.startMusic(this.state.season);
      this.updateAmbience();
    };
    this.input.once("pointerdown", audioInit);
    this.input.keyboard?.once("keydown", audioInit);

    this.input.keyboard?.on("keydown-M", () => {
      const muted = AudioManager.inst.toggleMuted();
      this.hud?.setInfo(muted ? "Sound muted (M to unmute)." : "Sound on.", "#a89a80");
    });

    this.input.keyboard?.on("keydown-EQUALS", () => this.zoomBy(0.15));
    this.input.keyboard?.on("keydown-NUMPAD_ADD", () => this.zoomBy(0.15));
    this.input.keyboard?.on("keydown-MINUS", () => this.zoomBy(-0.15));
    this.input.keyboard?.on("keydown-NUMPAD_SUBTRACT", () => this.zoomBy(-0.15));

    document.addEventListener("visibilitychange", this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener("visibilitychange", this.onVisibility);
    });

    if (!GameState.hasSave()) {
      this.time.delayedCall(1200, () => {
        this.hud?.setInfo(
          "Welcome, Governor! Build a House (10 wood) to attract settlers. Pan: WASD or middle-drag.",
          "#c9a84c"
        );
      });
    }
  }

  private updateAmbience(): void {
    const kind = this.state.season === Season.Autumn ? "rain" : this.state.season === Season.Winter ? "wind" : null;
    AudioManager.inst.startAmbience(kind);
    if (this.state.season === Season.Spring || this.state.season === Season.Summer) {
      AudioManager.inst.startBirdsong();
    } else {
      AudioManager.inst.stopAmbience();
    }
  }

  private onBeforeUnload = (): void => {
    if (!this.state.gameOver && !this.state.victory) this.state.save();
  };

  /** Auto-pause quand l'onglet passe en arrière-plan. */
  private autoPaused = false;

  private onVisibility = (): void => {
    if (document.hidden) {
      if (this.state.gameSpeed > 0) {
        this.prevSpeed = this.state.gameSpeed;
        this.state.gameSpeed = 0;
        this.autoPaused = true;
        this.hud?.refreshSpeedLabel();
      }
    } else if (this.autoPaused) {
      this.autoPaused = false;
      this.state.gameSpeed = this.prevSpeed > 0 ? this.prevSpeed : 1;
      this.hud?.refreshSpeedLabel();
    }
  };

  private zoomBy(step: number): void {
    const cam = this.camera;
    cam.setZoom(Phaser.Math.Clamp(cam.zoom + step, this.minZoom, this.baseFit * 2.2));
    this.clampCamera();
  }

  private onRenderScale(): void {
    this.baseFit = fitZoom(this.camera.width, this.camera.height);
    this.minZoom = this.baseFit;
    this.camera.setZoom(this.baseFit);
    this.camera.scrollX = MAP_W / 2 - this.camera.width / 2;
    this.camera.scrollY = MAP_H / 2 - this.camera.height / 2;
  }

  /** Convention Phaser : monde au centre du viewport = scroll + cam.width/2. */
  private clampCamera(): void {
    const cam = this.camera;
    const vw = cam.width / cam.zoom;
    const vh = cam.height / cam.zoom;
    const ax = cam.width / 2;
    const ay = cam.height / 2;
    const minX = vw / 2 - ax;
    const maxX = MAP_W - vw / 2 - ax;
    cam.scrollX = minX > maxX ? (minX + maxX) / 2 : Phaser.Math.Clamp(cam.scrollX, minX, maxX);
    const minY = vh / 2 - ay;
    const maxY = MAP_H - vh / 2 - ay;
    cam.scrollY = minY > maxY ? (minY + maxY) / 2 : Phaser.Math.Clamp(cam.scrollY, minY, maxY);
  }

  /** Nouvelle partie depuis l'écran de fin. */
  restartNewGame(): void {
    GameState.deleteSave();
    this.scene.restart();
  }

  attachUI(ui: Phaser.Scene): void {
    if (this.hud) return;
    this.uiScene = ui;
    this.hud = new HUD(ui);
    this.hud.onRestart = () => this.restartNewGame();
    this.buildPanel = new BuildPanel(ui, (type) => {
      this.selectedBuildType = type;
    });
    this.techPanel = new TechPanel(ui);
    this.eventLog = new EventLog(ui);
    this.tileMap.ensureMinimap(ui);
    this.tileMap.sync(this.state);
    this.buildPanel.rebuild(this.state);
    this.hud.update(this.state);
    this.lastResearchedCount = this.state.researchedTechs.length;
  }

  private selectBuild(type: BuildingType): void {
    if (!this.buildPanel) return;
    this.buildPanel.selectType(type);
    this.selectedBuildType = type;
  }

  private isOverUI(pointer: Phaser.Input.Pointer): boolean {
    const s = RenderScale.value;
    if (pointer.y <= 54 * s) return true;
    if (pointer.y >= (Viewport.h - 80) * s) return true;
    if (pointer.x >= (Viewport.w - 204) * s && pointer.y >= (Viewport.h - 216) * s) return true;
    return false;
  }

  private gridAt(pointer: Phaser.Input.Pointer): { col: number; row: number } | null {
    if (this.isOverUI(pointer)) return null;
    if (!this.hud || this.hud.tradeVisible || this.techPanel?.visible || this.eventLog?.visible) return null;
    const wp = this.camera.getWorldPoint(pointer.x, pointer.y);
    const o = pixelToOffset(wp.x, wp.y);
    return inBounds(o.col, o.row) ? o : null;
  }

  private handleHover(pointer: Phaser.Input.Pointer): void {
    if (!this.hud) return;
    const cell = this.gridAt(pointer);

    if (!cell) {
      this.tileMap.hideHover();
      return;
    }
    const { col: gridX, row: gridY } = cell;

    if (this.selectedBuildType) {
      const reason = this.state.getPlacementReason(this.selectedBuildType, gridX, gridY);
      const valid = reason === null;
      this.tileMap.setBuildingPreview(this.selectedBuildType, gridX, gridY, valid);
      if (!valid) {
        this.hud.setInfo(reason || "", "#ff6644");
      } else {
        const def = BUILDINGS[this.selectedBuildType];
        this.hud.setInfo(`${def.name} — Click to build`, "#8fc07a");
      }
    } else {
      const tile = this.state.tiles[gridY]?.[gridX];
      if (tile && tile.buildingId !== null) {
        const building = this.state.buildings.find((b) => b.id === tile.buildingId);
        if (building) {
          const def = BUILDINGS[building.type];
          this.hud.setInfo(`${def.name} [RMB: demolish, 50% refund]`, "#a89a80");
        }
      } else {
        this.tileMap.showHover(gridX, gridY);
        const terrainNames: Record<TileType, string> = {
          [TileType.Grass]: "Grassland",
          [TileType.Forest]: "Forest \u2014 good for Lumber Mill",
          [TileType.Water]: "Water",
          [TileType.Mountain]: "Mountain \u2014 good for Quarry",
          [TileType.Farmable]: "Fertile land \u2014 good for Farm",
        };
        this.hud.setInfo(terrainNames[tile.type] ?? "", "#a89878");
      }
    }
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    const cell = this.gridAt(pointer);
    if (!cell) return;
    const { col: gridX, row: gridY } = cell;

    if (this.selectedBuildType) {
      const placed = this.state.placeBuilding(this.selectedBuildType, gridX, gridY);
      if (placed) {
        this.tileMap.sync(this.state);
        const def = BUILDINGS[this.selectedBuildType];
        this.hud.setInfo(`${def.name} built!`, "#8fc07a");
        AudioManager.inst.playSfx("build");

        const { x: hx, y: hy } = hexCenter(gridX, gridY);
        const ring = this.add.graphics();
        ring.lineStyle(2.5, 0xe8cc78, 0.9);
        ring.strokeCircle(hx, hy, 8);
        this.tweens.add({
          targets: ring,
          scale: 2.8,
          alpha: 0,
          duration: 380,
          ease: "Quad.easeOut",
          onComplete: () => ring.destroy(),
        });
      } else {
        this.hud.setInfo("Cannot build here!", "#ff4444");
      AudioManager.inst.playSfx("error");
      }
      return;
    }

    const tile = this.state.tiles[gridY]?.[gridX];
    const building = tile?.buildingId !== null && tile ? this.state.buildings.find((b) => b.id === tile.buildingId) : undefined;
    if (building) {
      const def = BUILDINGS[building.type];
      let info = `${def.name}`;
      if (def.production) {
        const pct = Math.floor((building.productionTimer / def.production.ticksPerCycle) * 100);
        const out = Object.entries(def.production.output)
          .filter(([, a]) => a)
          .map(([r, a]) => `+${a} ${r}`)
          .join(", ");
        const input = Object.entries(def.production.input)
          .filter(([, a]) => a)
          .map(([r, a]) => `-${a} ${r}`)
          .join(", ");
        info += ` \u2014 ${input ? input + " \u2192 " : ""}${out} (${pct}%)`;
        const missing = Object.entries(def.production.input)
          .filter(([r, a]) => a && this.state.resources[r as keyof typeof this.state.resources] < (a ?? 0))
          .map(([r]) => r);
        if (missing.length > 0) info += `  \u26a0 missing ${missing.join(", ")}`;
      } else if (def.populationCapacity > 0) {
        info += ` \u2014 houses ${def.populationCapacity}`;
      }
      info += "  [RMB: demolish]";
      this.hud.setInfo(info, "#d9c9a8");
    }
  }

  private handleRightClick(pointer: Phaser.Input.Pointer): void {
    if (this.selectedBuildType) {
      this.selectedBuildType = null;
      this.buildPanel?.deselect();
      this.tileMap.clearPreview();
      return;
    }

    const cell = this.gridAt(pointer);
    if (!cell || !this.hud) return;
    const { col: gridX, row: gridY } = cell;

    const tile = this.state.tiles[gridY]?.[gridX];
    if (tile && tile.buildingId !== null) {
      const removed = this.state.removeBuilding(tile.buildingId);
      if (removed) {
        this.tileMap.sync(this.state);
        this.hud.setInfo("Building demolished (50% refund).", "#e07a6a");
        AudioManager.inst.playSfx("demolish");

        const { x: hx, y: hy } = hexCenter(gridX, gridY);
        const puff = this.add.graphics();
        puff.fillStyle(0xcfc6b2, 0.55);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          puff.fillCircle(hx + Math.cos(a) * 4, hy + Math.sin(a) * 4, 3);
        }
        this.tweens.add({
          targets: puff,
          scale: 2.4,
          alpha: 0,
          duration: 320,
          ease: "Quad.easeOut",
          onComplete: () => puff.destroy(),
        });
      }
    }
  }

  update(time: number, delta: number): void {
    if (this.state.gameOver || this.state.victory) return;

    const k = this.panKeys;
    const panSpeed = ((550 * RenderScale.value) / this.camera.zoom) * (delta / 1000);
    let px = 0;
    let py = 0;
    if (k.A.isDown || k.LEFT.isDown) px -= 1;
    if (k.D.isDown || k.RIGHT.isDown) px += 1;
    if (k.W.isDown || k.UP.isDown) py -= 1;
    if (k.S.isDown || k.DOWN.isDown) py += 1;
    this.camera.scrollX += px * panSpeed;
    this.camera.scrollY += py * panSpeed;
    this.clampCamera();

    const tickInterval = TICK_RATE_MS / this.state.gameSpeed;
    if (this.time.now - this.lastTick >= tickInterval) {
      this.lastTick = this.time.now;

      this.seasonSystem.update(this.state);
      this.eventSystem.update(this.state);
      this.prodSystem.update(this.state);
      this.techSystem.update(this.state);
      this.popSystem.update(this.state);

      this.state.totalTicks++;

      const msgs = this.state.processEvents();
      for (const msg of msgs) {
        AudioManager.inst.playSfx(msg.includes("Raid") ? "raid" : "alert");
        if (msg.includes("Raid")) this.cameras.main.shake(280, 0.004);
        this.hud?.pushToast(msg);
      }

      if (this.state.population.total <= 0 && this.state.buildings.length > 0) {
        this.state.gameOver = true;
      }

      if (this.state.population.total >= VICTORY_POPULATION && this.state.researchedTechs.length >= VICTORY_TECHS) {
        this.state.victory = true;
      }

      // voie alternative : le monument + des colons heureux
      const hasCircus = this.state.buildings.some((b) => b.type === BuildingType.CircusMaximus);
      if (
        hasCircus &&
        this.state.population.total >= 30 &&
        this.state.population.happiness >= 80 &&
        this.state.researchedTechs.length >= 10
      ) {
        this.state.victory = true;
      }

      this.autoSaveCounter++;
      if (this.autoSaveCounter >= 60) {
        this.autoSaveCounter = 0;
        this.state.save();
      }

      this.tileMap.sync(this.state);
      if (this.hud) this.hud.update(this.state);

      if (this.buildPanel && this.state.researchedTechs.length !== this.lastResearchedCount) {
        this.lastResearchedCount = this.state.researchedTechs.length;
        this.buildPanel.rebuild(this.state);
        AudioManager.inst.playSfx("research");
      }

      if (this.state.season !== this.lastSeason) {
        this.lastSeason = this.state.season;
        AudioManager.inst.playSfx("season");
        AudioManager.inst.startMusic(this.state.season);
        this.updateAmbience();
        (this.uiScene as { setWeatherSeason?: (s: string) => void } | undefined)?.setWeatherSeason?.(this.state.season);
        const seasonNames: Record<string, string> = {
          spring: "Spring has arrived \u2014 the land awakens",
          summer: "Summer \u2014 abundance, but the granaries empty",
          autumn: "Autumn \u2014 the harvest is golden, winter is coming",
          winter: "Winter \u2014 the farms sleep. Hold your stocks!",
        };
        const recap = `${Math.floor(this.state.population.total)} settlers \u00b7 ${this.state.buildings.length} buildings`;
        this.hud?.pushToast(`${seasonNames[this.state.season] ?? this.state.season}  (${recap})`, "#e8cc78", 4500);
        const flashes: Record<string, [number, number, number]> = {
          spring: [140, 180, 130],
          summer: [220, 200, 130],
          autumn: [200, 140, 90],
          winter: [180, 200, 230],
        };
        const f = flashes[this.state.season] ?? [120, 120, 120];
        this.cameras.main.flash(700, f[0], f[1], f[2], false);
      }

      if ((this.state.gameOver || this.state.victory) && !this.endShown) {
        this.endShown = true;
        this.prevSpeed = 1;
        this.state.gameSpeed = 0;
        const hasCircusWin = this.state.victory && this.state.buildings.some((b) => b.type === BuildingType.CircusMaximus);
        AudioManager.inst.playEndTheme(this.state.victory);
        this.hud?.showEndScreen(this.state, this.state.victory, hasCircusWin ? "monument" : undefined);
      }

      if (this.techPanel?.visible) {
        this.techPanel.show(this.state);
      }

      const seasonBgs: Record<string, number> = {
        spring: 0x121a12,
        summer: 0x131722,
        autumn: 0x191310,
        winter: 0x10151d,
      };
      this.cameras.main.setBackgroundColor(seasonBgs[this.state.season] || 0x10131c);
    }
  }
}
