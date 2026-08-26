import { GameState } from "../state/GameState";
import { BuildingType, EventType, GameEvent, ResourceType, Season } from "../types";
import { BUILDINGS, EVENT_CHECK_INTERVAL, EVENT_CHANCE, RAID_MIN_POP, RAID_BASE_DAMAGE } from "../config";

export class EventSystem {
  update(state: GameState): void {
    if (state.totalTicks - state.lastEventTick < EVENT_CHECK_INTERVAL) return;
    state.lastEventTick = state.totalTicks;

    if (Math.random() > EVENT_CHANCE) return;

    const roll = Math.random();
    if (roll < 0.16) {
      this.triggerStorm(state);
    } else if (roll < 0.32) {
      this.triggerCaravan(state);
    } else if (roll < 0.46) {
      this.triggerFestival(state);
    } else if (roll < 0.58) {
      this.triggerPlague(state);
    } else if (roll < 0.72) {
      this.triggerRaid(state);
    } else if (roll < 0.84) {
      this.triggerHarvest(state);
    } else if (roll < 0.93) {
      this.triggerWanderers(state);
    } else {
      this.triggerMerchant(state);
    }
  }

  /** Récolte exceptionnelle : printemps/été uniquement, sinon caravane. */
  private triggerHarvest(state: GameState): void {
    if (state.season === Season.Spring || state.season === Season.Summer) {
      state.addEvent({
        type: EventType.Harvest,
        message: "Bumper harvest! +30 food",
        tickRemaining: 1,
        effect: (s: GameState) => {
          s.addResources({ [ResourceType.Food]: 30 });
        },
      });
    } else {
      this.triggerCaravan(state);
    }
  }

  /** Colons errants : seulement s'il reste de la place pour loger. */
  private triggerWanderers(state: GameState): void {
    const cap = state.buildings.reduce((sum, b) => sum + BUILDINGS[b.type].populationCapacity, 0);
    if (state.population.total >= cap) {
      this.triggerFestival(state);
      return;
    }
    const joined = Math.min(3, cap - Math.ceil(state.population.total));
    state.addEvent({
      type: EventType.Settlers,
      message: `Wandering settlers join your province! +${joined} settlers`,
      tickRemaining: 1,
      effect: (s: GameState) => {
        s.population.total = Math.min(cap, s.population.total + joined);
      },
    });
  }

  /** Marchand de passage : échange bois contre or, seulement si on peut payer. */
  private triggerMerchant(state: GameState): void {
    if (state.resources[ResourceType.Gold] < 20) {
      this.triggerCaravan(state);
      return;
    }
    state.addEvent({
      type: EventType.Merchant,
      message: "A traveling merchant trades: -20 gold, +25 wood",
      tickRemaining: 1,
      effect: (s: GameState) => {
        if (s.resources[ResourceType.Gold] >= 20) {
          s.resources[ResourceType.Gold] -= 20;
          s.addResources({ [ResourceType.Wood]: 25 });
        }
      },
    });
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

  private triggerRaid(state: GameState): void {
    if (state.population.total < RAID_MIN_POP) return;

    const pop = Math.floor(state.population.total);
    const rawDamage = RAID_BASE_DAMAGE;
    const defense = state.getRaidDefense();
    const actualDamage = Math.max(0.02, rawDamage - defense);
    const loss = Math.max(1, Math.floor(pop * actualDamage));

    state.addEvent({
      type: EventType.Raid,
      message: `Raiders attack! ${loss} people lost! (defense: ${Math.floor(defense * 100)}%)`,
      tickRemaining: 2,
      effect: (s: GameState) => {
        s.population.total = Math.max(0, s.population.total - loss);
        s.population.happiness = Math.max(0, s.population.happiness - 15);

        const lootRes = [ResourceType.Wood, ResourceType.Food, ResourceType.Gold][
          Math.floor(Math.random() * 3)
        ];
        const lootAmt = Math.floor(Math.random() * 20) + 5;
        if (s.resources[lootRes] > lootAmt) {
          s.resources[lootRes] -= lootAmt;
        }
      },
    });
  }
}
