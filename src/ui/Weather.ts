import Phaser from "phaser";
import { Season } from "../types";
import { Viewport } from "./theme";

/** Particules météo en espace écran (UIScene) : neige (hiver), pluie (automne), pétales (printemps). */
export class Weather {
  private scene: Phaser.Scene;
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private season: Season | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ensureTextures();
  }

  private ensureTextures(): void {
    const tex = this.scene.textures;
    if (!tex.exists("wx-flake")) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(2, 2, 2);
      g.generateTexture("wx-flake", 4, 4);
      g.destroy();
    }
    if (!tex.exists("wx-drop")) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xaac8e0, 0.9);
      g.fillRect(0, 0, 2, 9);
      g.generateTexture("wx-drop", 2, 9);
      g.destroy();
    }
    if (!tex.exists("wx-petal")) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xdd8899, 1);
      g.fillEllipse(3, 2, 5, 3);
      g.generateTexture("wx-petal", 6, 4);
      g.destroy();
    }
  }

  setSeason(season: Season): void {
    if (this.season === season) return;
    this.season = season;
    this.clear();
    const w = Viewport.w;

    if (season === Season.Winter) {
      this.emitters.push(
        this.scene.add.particles(0, 0, "wx-flake", {
          x: { min: -20, max: w + 20 },
          y: -12,
          lifespan: { min: 7000, max: 11000 },
          speedY: { min: 30, max: 65 },
          speedX: { min: -18, max: 18 },
          scale: { min: 0.4, max: 1.1 },
          alpha: { start: 0.85, end: 0.45 },
          quantity: 1,
          frequency: 55,
        })
      );
      // seconde couche plus fine pour la profondeur
      this.emitters.push(
        this.scene.add.particles(0, 0, "wx-flake", {
          x: { min: -20, max: w + 20 },
          y: -12,
          lifespan: { min: 9000, max: 13000 },
          speedY: { min: 18, max: 34 },
          speedX: { min: -12, max: 12 },
          scale: { min: 0.25, max: 0.5 },
          alpha: { start: 0.5, end: 0.25 },
          quantity: 1,
          frequency: 90,
        })
      );
    } else if (season === Season.Autumn) {
      this.emitters.push(
        this.scene.add.particles(0, 0, "wx-drop", {
          x: { min: -40, max: w + 20 },
          y: -20,
          lifespan: { min: 900, max: 1400 },
          speedY: { min: 480, max: 680 },
          speedX: { min: -90, max: -60 },
          alpha: { start: 0.32, end: 0.12 },
          scale: { min: 0.7, max: 1.1 },
          quantity: 2,
          frequency: 28,
        })
      );
    } else if (season === Season.Spring) {
      this.emitters.push(
        this.scene.add.particles(0, 0, "wx-petal", {
          x: { min: -20, max: w + 20 },
          y: -12,
          lifespan: { min: 8000, max: 13000 },
          speedY: { min: 20, max: 40 },
          speedX: { min: -28, max: 28 },
          rotate: { min: 0, max: 360 },
          alpha: { start: 0.75, end: 0.2 },
          scale: { min: 0.6, max: 1.2 },
          quantity: 1,
          frequency: 420,
        })
      );
    }

    for (const e of this.emitters) e.setDepth(90);
  }

  private clear(): void {
    for (const e of this.emitters) e.destroy();
    this.emitters = [];
    this.season = null;
  }

  get current(): Season | null {
    return this.season;
  }
}
