import Phaser from "phaser";
import { Season } from "../types";
import { RenderScale, Viewport } from "../ui/theme";
import { Weather } from "../ui/Weather";
import type { GameScene } from "./GameScene";

export class UIScene extends Phaser.Scene {
  private weather!: Weather;

  constructor() {
    super({ key: "UIScene" });
  }

  /** Le zoom Phaser ancre au CENTRE de la caméra : on aligne le scroll pour que
   *  le coin haut-gauche du viewport design tombe sur le coin du canvas. */
  private alignCamera(): void {
    const cam = this.cameras.main;
    if (!cam) return;
    cam.setZoom(RenderScale.value);
    cam.scrollX = Viewport.w / 2 - cam.width / 2;
    cam.scrollY = Viewport.h / 2 - cam.height / 2;
  }

  create(): void {
    this.alignCamera();
    this.game.events.on("renderscale", this.alignCamera, this);
    this.game.events.on("renderscale", this.rebuildWeather, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("renderscale", this.alignCamera, this);
      this.game.events.off("renderscale", this.rebuildWeather, this);
    });
    this.weather = new Weather(this);
    const game = this.scene.get("GameScene") as GameScene;
    game?.attachUI(this);
    if (game) this.weather.setSeason(game.state.season);
  }

  private rebuildWeather(): void {
    if (this.weather && this.weather.current) this.weather.setSeason(this.weather.current);
  }

  setWeatherSeason(season: Season): void {
    this.weather?.setSeason(season);
  }
}
