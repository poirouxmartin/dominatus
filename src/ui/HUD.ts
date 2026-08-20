import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { ResourceType, Season } from "../types";
import { BUILDINGS, TRADE_PRICES, TECH_TREE } from "../config";

const SEASON_COLORS: Record<string, string> = {
  [Season.Spring]: "#6bba5c",
  [Season.Summer]: "#f0c05e",
  [Season.Autumn]: "#d97040",
  [Season.Winter]: "#70c8e8",
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
  [ResourceType.Water]: "\u{1F4A7}",
  [ResourceType.Stone]: "\u{1FAA8}",
  [ResourceType.Gold]: "\u{1F4B0}",
  [ResourceType.Planks]: "\u{1FAA3}",
  [ResourceType.Bricks]: "\u{1F9F1}",
  [ResourceType.Research]: "\u{1F4D6}",
  [ResourceType.Leather]: "\u{1F9F6}",
  [ResourceType.Tools]: "\u{1F6E0}",
};

const RES_ORDER: ResourceType[] = [
  ResourceType.Wood,
  ResourceType.Food,
  ResourceType.Water,
  ResourceType.Stone,
  ResourceType.Gold,
  ResourceType.Planks,
  ResourceType.Bricks,
  ResourceType.Research,
  ResourceType.Leather,
  ResourceType.Tools,
];

export class HUD {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  resourceTexts: Partial<Record<ResourceType, Phaser.GameObjects.Text>> = {};
  seasonText: Phaser.GameObjects.Text;
  popText: Phaser.GameObjects.Text;
  happinessText: Phaser.GameObjects.Text;
  tierText: Phaser.GameObjects.Text;
  speedText: Phaser.GameObjects.Text;
  infoText: Phaser.GameObjects.Text;
  researchInfoText: Phaser.GameObjects.Text;
  defenseText: Phaser.GameObjects.Text;
  alertText: Phaser.GameObjects.Text;
  eventTexts: Phaser.GameObjects.Text[];
  tradePanel: Phaser.GameObjects.Container | null = null;
  tradeVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.eventTexts = [];

    const bg = scene.add.rectangle(640, 22, 1280, 44, 0x0f0f1e, 0.92);
    bg.setStrokeStyle(1, 0xc9a84c, 0.3);
    this.container.add(bg);

    let xOff = 8;
    for (const res of RES_ORDER) {
      const icon = scene.add.text(xOff, 11, RES_ICONS[res], { fontSize: "14px" });
      const txt = scene.add.text(xOff + 18, 13, "0", {
        fontSize: "12px",
        fontFamily: "'Courier New', monospace",
        color: "#e8e0d0",
      });
      this.resourceTexts[res] = txt;
      this.container.add([icon, txt]);
      xOff += 58;
    }

    const sep = scene.add.rectangle(xOff + 4, 22, 1, 28, 0xc9a84c, 0.3);
    this.container.add(sep);
    xOff += 14;

    this.seasonText = scene.add.text(xOff, 13, "", {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#ffffff",
    });
    this.container.add(this.seasonText);

    this.popText = scene.add.text(xOff + 110, 13, "", {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#e8e0d0",
    });
    this.container.add(this.popText);

    this.tierText = scene.add.text(xOff + 200, 13, "", {
      fontSize: "10px",
      fontFamily: "'Courier New', monospace",
      color: "#c9a84c",
    });
    this.container.add(this.tierText);

    this.happinessText = scene.add.text(xOff + 260, 13, "", {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#e8e0d0",
    });
    this.container.add(this.happinessText);

    this.defenseText = scene.add.text(xOff + 350, 13, "", {
      fontSize: "10px",
      fontFamily: "'Courier New', monospace",
      color: "#d9534f",
    });
    this.container.add(this.defenseText);

    this.speedText = scene.add.text(1230, 13, "\u25B6 1x", {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#c9a84c",
    });
    this.container.add(this.speedText);

    this.infoText = scene.add.text(640, 698, "", {
      fontSize: "12px",
      fontFamily: "Arial, sans-serif",
      color: "#b0a890",
      align: "center",
    });
    this.infoText.setOrigin(0.5);
    this.container.add(this.infoText);

    this.researchInfoText = scene.add.text(12, 48, "", {
      fontSize: "11px",
      fontFamily: "'Courier New', monospace",
      color: "#5588cc",
      backgroundColor: "#0f0f1eDD",
      padding: { x: 6, y: 3 },
    });
    this.container.add(this.researchInfoText);

    this.alertText = scene.add.text(12, 68, "", {
      fontSize: "11px",
      fontFamily: "'Courier New', monospace",
      color: "#d9534f",
      backgroundColor: "#1a0f0fDD",
      padding: { x: 6, y: 3 },
    });
    this.container.add(this.alertText);

    this.container.setDepth(100);
  }

  update(state: GameState): void {
    for (const res of RES_ORDER) {
      const txt = this.resourceTexts[res];
      if (txt) txt.setText(`${Math.floor(state.resources[res])}`);
    }

    const sColor = SEASON_COLORS[state.season] || "#ffffff";
    this.seasonText.setText(`${SEASON_LABELS[state.season] || state.season}  t${state.seasonTick}`);
    this.seasonText.setColor(sColor);

    const pop = Math.floor(state.population.total);
    const cap = state.buildings.reduce((sum, b) => sum + BUILDINGS[b.type].populationCapacity, 0);
    this.popText.setText(`Pop: ${pop}/${cap}`);

    const tierLabel = state.population.tier >= 2 ? "Citizen" : "Settler";
    this.tierText.setText(`Tier: ${tierLabel}`);

    const happy = Math.floor(state.population.happiness);
    const happyColor = happy >= 70 ? "#6bba5c" : happy >= 40 ? "#f0c05e" : "#d9534f";
    this.happinessText.setText(`\u2665 ${happy}%`);
    this.happinessText.setColor(happyColor);

    const defense = state.getRaidDefense();
    if (defense > 0) {
      this.defenseText.setText(`\u{1F6E1} ${Math.floor(defense * 100)}%`);
    } else {
      this.defenseText.setText("");
    }

    const speedLabels = ["\u25B6 1x", "\u25B6\u25B6 2x", "\u25B6\u25B6\u25B6 3x"];
    this.speedText.setText(speedLabels[state.gameSpeed - 1] || "\u25B6 1x");

    if (state.gameOver) {
      this.infoText.setText("GAME OVER \u2014 Your people have perished.");
      this.infoText.setColor("#d9534f");
    } else if (state.victory) {
      this.infoText.setText("VICTORY \u2014 Your civilization thrives!");
      this.infoText.setColor("#6bba5c");
    } else if (state.season === Season.Winter) {
      this.infoText.setText("\u2744 Winter \u2014 Food production reduced. Stockpile reserves!");
      this.infoText.setColor("#70c8e8");
    } else {
      this.infoText.setText("");
    }

    if (state.researchTarget) {
      const techDef = TECH_TREE.find((t) => t.id === state.researchTarget);
      if (techDef) {
        const pct = Math.floor((state.researchProgress / techDef.cost) * 100);
        this.researchInfoText.setText(`\u{1F4D6} ${techDef.name}: ${pct}%`);
      }
    } else {
      this.researchInfoText.setText("");
    }

    const alerts: string[] = [];
    if (state.resources[ResourceType.Food] < 20 && state.population.total > 0) alerts.push("LOW FOOD");
    if (state.resources[ResourceType.Wood] < 10) alerts.push("LOW WOOD");
    if (state.resources[ResourceType.Stone] < 10 && state.buildings.length > 3) alerts.push("LOW STONE");
    if (state.population.happiness < 30) alerts.push("UNHAPPY");
    this.alertText.setText(alerts.length > 0 ? "\u26A0 " + alerts.join("  \u2022  ") : "");

    for (const t of this.eventTexts) t.destroy();
    this.eventTexts = [];

    const msgs = state.processEvents();
    for (let i = 0; i < msgs.length; i++) {
      const t = this.scene.add.text(640, 56 + i * 24, msgs[i], {
        fontSize: "12px",
        fontFamily: "Arial, sans-serif",
        color: "#f0c05e",
        backgroundColor: "#0f0f1eDD",
        padding: { x: 10, y: 4 },
      });
      t.setOrigin(0.5);
      t.setDepth(200);
      this.eventTexts.push(t);
    }

    for (let i = 0; i < state.activeEvents.length; i++) {
      const evt = state.activeEvents[i];
      const t = this.scene.add.text(640, 56 + (msgs.length + i) * 24, `${evt.message} (${evt.tickRemaining}t)`, {
        fontSize: "12px",
        fontFamily: "Arial, sans-serif",
        color: "#f0a040",
        backgroundColor: "#0f0f1eDD",
        padding: { x: 10, y: 4 },
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

    const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.4);
    overlay.setInteractive();
    this.tradePanel.add(overlay);

    const panelBg = this.scene.add.rectangle(640, 360, 420, 420, 0x1a1a2e, 0.97);
    panelBg.setStrokeStyle(2, 0xc9a84c, 0.8);
    this.tradePanel.add(panelBg);

    const title = this.scene.add.text(640, 175, "\u{1F3EA} Trading Post", {
      fontSize: "18px",
      fontFamily: "Georgia, serif",
      color: "#c9a84c",
    });
    title.setOrigin(0.5);
    this.tradePanel.add(title);

    const goldLabel = this.scene.add.text(640, 203, `\u{1F4B0} ${Math.floor(state.resources[ResourceType.Gold])} gold`, {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#c9a84c",
    });
    goldLabel.setOrigin(0.5);
    this.tradePanel.add(goldLabel);

    let yOff = 228;
    const tradeable = [
      ResourceType.Wood,
      ResourceType.Food,
      ResourceType.Water,
      ResourceType.Stone,
      ResourceType.Planks,
      ResourceType.Bricks,
      ResourceType.Leather,
      ResourceType.Tools,
    ];

    for (const res of tradeable) {
      const prices = TRADE_PRICES[res];
      const icon = this.scene.add.text(440, yOff, RES_ICONS[res], { fontSize: "13px" });
      const name = this.scene.add.text(462, yOff + 1, res, {
        fontSize: "11px",
        fontFamily: "'Courier New', monospace",
        color: "#e8e0d0",
      });
      const owned = this.scene.add.text(535, yOff + 1, `${Math.floor(state.resources[res])}`, {
        fontSize: "11px",
        fontFamily: "'Courier New', monospace",
        color: "#b0a890",
      });

      const buyBtn = this.scene.add.text(585, yOff, `+5 (${prices.buy}g)`, {
        fontSize: "10px",
        fontFamily: "'Courier New', monospace",
        color: "#6bba5c",
        backgroundColor: "#1a2a1a",
        padding: { x: 5, y: 2 },
      });
      buyBtn.setInteractive({ useHandCursor: true });
      buyBtn.on("pointerdown", () => state.trade(res, 5, "buy"));
      buyBtn.on("pointerover", () => buyBtn.setBackgroundColor("#2a3a2a"));
      buyBtn.on("pointerout", () => buyBtn.setBackgroundColor("#1a1a1a"));

      const sellBtn = this.scene.add.text(675, yOff, `-5 (${prices.sell}g)`, {
        fontSize: "10px",
        fontFamily: "'Courier New', monospace",
        color: "#d9534f",
        backgroundColor: "#2a1a1a",
        padding: { x: 5, y: 2 },
      });
      sellBtn.setInteractive({ useHandCursor: true });
      sellBtn.on("pointerdown", () => state.trade(res, 5, "sell"));
      sellBtn.on("pointerover", () => sellBtn.setBackgroundColor("#3a2a2a"));
      sellBtn.on("pointerout", () => sellBtn.setBackgroundColor("#2a1a1a"));

      this.tradePanel.add([icon, name, owned, buyBtn, sellBtn]);
      yOff += 26;
    }

    const closeBtn = this.scene.add.text(640, yOff + 12, "[ Close  \u232B ]", {
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      color: "#888888",
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.hideTrade());
    closeBtn.on("pointerover", () => closeBtn.setColor("#c9a84c"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#888888"));
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

  setInfo(msg: string, color: string = "#b0a890"): void {
    this.infoText.setText(msg);
    this.infoText.setColor(color);
  }

  destroy(): void {
    this.container.destroy();
    this.hideTrade();
    for (const t of this.eventTexts) t.destroy();
  }
}
