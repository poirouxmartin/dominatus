import { GameState } from "../state/GameState";
import { EventType, GameEvent, ResourceType } from "../types";
import { EVENT_CHECK_INTERVAL, EVENT_CHANCE } from "../config";

export class EventSystem {
  update(state: GameState): void {
    if (state.totalTicks - state.lastEventTick < EVENT_CHECK_INTERVAL) return;
    state.lastEventTick = state.totalTicks;

    if (Math.random() > EVENT_CHANCE) return;

    const roll = Math.random();
    if (roll < 0.3) {
      this.triggerStorm(state);
    } else if (roll < 0.6) {
      this.triggerCaravan(state);
    } else if (roll < 0.85) {
      this.triggerFestival(state);
    } else {
      this.triggerPlague(state);
    }
  }

  private triggerStorm(state: GameState): void {
    if (state.buildings.length === 0) return;

    if (state.hasWalls()) {
      state.addEvent({
        type: EventType.Storm,
        message: "Storm approaching — walls protect your settlement!",
        tickRemaining: 3,
        effect: () => {},
      });
      return;
    }

    const target = state.buildings[Math.floor(Math.random() * state.buildings.length)];
    state.addEvent({
      type: EventType.Storm,
      message: `Storm approaching — ${target.type} may be damaged!`,
      tickRemaining: 3,
      effect: (s: GameState) => {
        if (Math.random() < 0.4) {
          s.removeBuilding(target.id);
        }
      },
    });
  }

  private triggerCaravan(state: GameState): void {
    const bonus = Math.floor(Math.random() * 30) + 10;
    const resource = [ResourceType.Wood, ResourceType.Food, ResourceType.Stone][
      Math.floor(Math.random() * 3)
    ];

    state.addEvent({
      type: EventType.Caravan,
      message: `Trade caravan arrives! +${bonus} ${resource}`,
      tickRemaining: 1,
      effect: (s: GameState) => {
        s.addResources({ [resource]: bonus } as any);
      },
    });
  }

  private triggerFestival(state: GameState): void {
    if (state.population.total <= 0) return;

    const bonus = state.researchedTechs.includes("law") ? 30 : 20;
    state.addEvent({
      type: EventType.Festival,
      message: `Harvest festival! +${bonus} happiness, +10 food`,
      tickRemaining: 2,
      effect: (s: GameState) => {
        s.population.happiness = Math.min(100, s.population.happiness + bonus);
        s.addResources({ [ResourceType.Food]: 10 });
      },
    });
  }

  private triggerPlague(state: GameState): void {
    if (state.population.total <= 0) return;

    state.addEvent({
      type: EventType.Plague,
      message: "Plague! Happiness reduced, some may perish.",
      tickRemaining: 3,
      effect: (s: GameState) => {
        s.population.happiness = Math.max(0, s.population.happiness - 25);
        s.population.total = Math.max(0, s.population.total - Math.floor(s.population.total * 0.15));
      },
    });
  }
}
