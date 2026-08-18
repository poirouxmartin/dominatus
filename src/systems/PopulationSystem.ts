import { GameState } from "../state/GameState";
import { ResourceType, BuildingType } from "../types";
import {
  FOOD_PER_PERSON,
  HAPPINESS_PER_FOOD,
  HAPPINESS_PER_HOUSE,
  POPULATION_GROWTH_THRESHOLD,
  POPULATION_GROWTH_RATE,
  STARVATION_DAMAGE,
} from "../config";

export class PopulationSystem {
  update(state: GameState): void {
    if (state.buildings.length === 0) return;

    let capacity = 0;
    let foodNeed = 0;
    let houseCount = 0;

    for (const b of state.buildings) {
      if (b.type === BuildingType.House) {
        capacity += 4;
        houseCount++;
      }
      if (b.type === BuildingType.Farm) foodNeed += 2;
      if (b.type === BuildingType.LumberMill) foodNeed += 2;
      if (b.type === BuildingType.Market) foodNeed += 1;
    }

    state.population.foodConsumption = state.population.total * FOOD_PER_PERSON;

    const foodAvailable = state.resources[ResourceType.Food];
    const hasEnoughFood = foodAvailable >= state.population.foodConsumption;

    let happiness = 50;

    if (hasEnoughFood) {
      state.resources[ResourceType.Food] -= state.population.foodConsumption;
      happiness += HAPPINESS_PER_FOOD;
    } else {
      happiness -= STARVATION_DAMAGE * 10;
    }

    happiness += houseCount * HAPPINESS_PER_HOUSE;

    if (state.population.total > 0 && state.population.total >= capacity) {
      happiness -= 10;
    }

    happiness = Math.max(0, Math.min(100, happiness));
    state.population.happiness = happiness;

    if (state.population.total < capacity && hasEnoughFood && happiness >= POPULATION_GROWTH_THRESHOLD) {
      const growth = POPULATION_GROWTH_RATE * (happiness / 100);
      state.population.total = Math.min(capacity, state.population.total + growth);
    }

    state.population.total = Math.floor(state.population.total * 10) / 10;

    if (!hasEnoughFood && state.population.total > 0) {
      state.population.total = Math.max(0, state.population.total - 0.05);
      state.population.total = Math.floor(state.population.total * 10) / 10;
    }
  }
}
