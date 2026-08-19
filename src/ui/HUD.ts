import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { ResourceType, Season } from "../types";
import { BUILDINGS, TRADE_PRICES } from "../config";

const SEASON_COLORS: Record<string, string> = {
  [Season.Spring]: "#5cb85c",
  [Season.Summer]: "#f0ad4e",
  [Season.Autumn]: "#d9534f",
  [Season.Winter]: "#5bc0de",
};

const SEASON_LABELS: Record<string, string> = {
  [Season.Spring]: "Spring",
  [Season.Summer]: "Summer",
  [Season.Autumn]: "Autumn",
  [Season.Winter]: "Winter",
};

const RES_ICONS: Record<ResourceType, string> = {
  [ResourceType.Wood]: "\u{1FAB5}",
  [ResourceType.Food]: "\u{1F33E}",
  [ResourceType.Stone]: "\u{1FAA8}",
  [ResourceType.Gold]: "\u{1F4B0}",
  [ResourceType.Planks]: "\u{1FAA3}",
  [ResourceType.Bricks]: "\u{1F9F1}",
};

export class HUD {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  resourceTexts: Partial<Record<ResourceType, Phaser.GameObjects.Text>> = {};
  seasonText: Phaser.GameObjects.Text;
  popText: Phaser.GameObjects.Text;
  happinessText: Phaser.GameObjects.Text;
  speedText: Phaser.GameObjects.Text;
  infoText: Phaser.GameObjects.Text;
  eventTexts: Phaser.GameObjects.Text[];
  tradePanel: Phaser.GameObjects.Container | null = null;
  tradeVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.eventTexts = [];

    const bg = scene.add.rectangle(640, 22, 1280, 44, 0x1a1a2e, 0.85);
    this.container.add(bg);

    const resOrder = [
      ResourceType.Wood,
      ResourceType.Food,
      ResourceType.Stone,
      ResourceType.Gold,
      ResourceType.Planks,
      ResourceType.Bricks,
    ];

    let xOff = 10;
    for (const res of resOrder) {
      const icon = scene.add.text(xOff, 10, RES_ICONS[res], { fontSize: "16px" });
      const txt = scene.add.text(xOff + 20, 12, "0", {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#ffffff",
      });
      this.resourceTexts[res] = txt;
      this.container.add([icon, txt]);
      xOff += 80;
    }

    this.seasonText = scene.add.text(xOff + 10, 12, "", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
    });
    this.container.add(this.seasonText);

    this.popText = scene.add.text(xOff + 140, 12, "", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
    });
    this.container.add(this.popText);

    this.happinessText = scene.add.text(xOff + 240, 12, "", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
    });
    this.container.add(this.happinessText);

    this.speedText = scene.add.text(1220, 12, "\u25B6 1x", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#c9a84c",
    });
    this.container.add(this.speedText);

    this.infoText = scene.add.text(640, 698, "", {
      fontSize: "13px",
      fontFamily: "Arial, sans-serif",
      color: "#cccccc",
      align: "center",
    });
    this.infoText.setOrigin(0.5);
    this.container.add(this.infoText);

    this.container.setDepth(100);
  }

  update(state: GameState): void {
    const resOrder = [
      ResourceType.Wood,
      ResourceType.Food,
      ResourceType.Stone,
      ResourceType.Gold,
      ResourceType.Planks,
      ResourceType.Bricks,
    ];

    for (const res of resOrder) {
      const txt = this.resourceTexts[res];
      if (txt) txt.setText(`${Math.floor(state.resources[res])}`);
    }

    const sColor = SEASON_COLORS[state.season] || "#ffffff";
    this.seasonText.setText(`${SEASON_LABELS[state.season] || state.season} (t${state.seasonTick})`);
    this.seasonText.setColor(sColor);

    this.popText.setText(`Pop: ${Math.floor(state.population.total)}`);
    this.happinessText.setText(`Happy: ${Math.floor(state.population.happiness)}%`);

    const speedLabels = ["\u25B6 1x", "\u25B6\u25B6 2x", "\u25B6\u25B6\u25B6 3x"];
    this.speedText.setText(speedLabels[state.gameSpeed - 1] || "\u25B6 1x");

    if (state.gameOver) {
      this.infoText.setText("GAME OVER \u2014 Your people have perished.");
      this.infoText.setColor("#ff4444");
    } else if (state.season === Season.Winter) {
      this.infoText.setText("\u2744 Winter \u2014 Food production reduced. Ensure enough reserves!");
      this.infoText.setColor("#5bc0de");
    } else {
      this.infoText.setText("");
    }

    for (const t of this.eventTexts) t.destroy();
    this.eventTexts = [];

    const msgs = state.processEvents();
    for (const msg of msgs) {
      const t = this.scene.add.text(640, 60 + this.eventTexts.length * 22, msg, {
        fontSize: "13px",
        fontFamily: "Arial, sans-serif",
        color: "#ffcc00",
        backgroundColor: "#1a1a2eCC",
        padding: { x: 8, y: 4 },
      });
      t.setOrigin(0.5);
      t.setDepth(200);
      this.eventTexts.push(t);
    }

    for (const evt of state.activeEvents) {
      const t = this.scene.add.text(640, 60 + this.eventTexts.length * 22, `${evt.message} (${evt.tickRemaining}t)`, {
        fontSize: "13px",
        fontFamily: "Arial, sans-serif",
        color: "#ff8800",
        backgroundColor: "#1a1a2eCC",
        padding: { x: 8, y: 4 },
      });
      t.setOrigin(0.5);
      t.setDepth(200);
      this.eventTexts.push(t);
    }
  }

  toggleTrade(state: GameState): void {
    if (this.tradeVisible) {
      this.hideTrade();
      return;
    }

    this.tradeVisible = true;
    this.tradePanel = this.scene.add.container(0, 0);

    const bg = this.scene.add.rectangle(640, 380, 400, 320, 0x111122, 0.95);
    bg.setStrokeStyle(2, 0xc9a84c);
    this.tradePanel.add(bg);

    const title = this.scene.add.text(640, 240, "Trading Post", {
      fontSize: "18px",
      fontFamily: "Georgia, serif",
      color: "#c9a84c",
    });
    title.setOrigin(0.5);
    this.tradePanel.add(title);

    let yOff = 275;
    const tradeable = [
      ResourceType.Wood,
      ResourceType.Food,
      ResourceType.Stone,
      ResourceType.Planks,
      ResourceType.Bricks,
    ];

    for (const res of tradeable) {
      const prices = TRADE_PRICES[res];
      const label = this.scene.add.text(420, yOff, `${RES_ICONS[res]} ${res}`, {
        fontSize: "13px",
        fontFamily: "monospace",
        color: "#ffffff",
      });
      this.tradePanel.add(label);

      const buyBtn = this.scene.add.text(560, yOff, `Buy (${prices.buy}g)`, {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#5cb85c",
        backgroundColor: "#222244",
        padding: { x: 6, y: 2 },
      });
      buyBtn.setInteractive({ useHandCursor: true });
      buyBtn.on("pointerdown", () => {
        state.trade(res, 5, "buy");
      });
      this.tradePanel.add(buyBtn);

      const sellBtn = this.scene.add.text(660, yOff, `Sell (${prices.sell}g)`, {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#d9534f",
        backgroundColor: "#222244",
        padding: { x: 6, y: 2 },
      });
      sellBtn.setInteractive({ useHandCursor: true });
      sellBtn.on("pointerdown", () => {
        state.trade(res, 5, "sell");
      });
      this.tradePanel.add(sellBtn);

      yOff += 28;
    }

    const closeBtn = this.scene.add.text(640, yOff + 10, "[Close]", {
      fontSize: "13px",
      fontFamily: "monospace",
      color: "#888888",
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.hideTrade());
    this.tradePanel.add(closeBtn);

    this.tradePanel.setDepth(150);
  }

  hideTrade(): void {
    if (this.tradePanel) {
      this.tradePanel.destroy();
      this.tradePanel = null;
    }
    this.tradeVisible = false;
  }

  setInfo(msg: string, color: string = "#cccccc"): void {
    this.infoText.setText(msg);
    this.infoText.setColor(color);
  }

  destroy(): void {
    this.container.destroy();
    this.hideTrade();
    for (const t of this.eventTexts) t.destroy();
  }
}
