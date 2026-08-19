import { GameState } from "../state/GameState";
import { ResourceType, BuildingType } from "../types";
import {
  BUILDINGS,
  BASE_HAPPINESS,
  FOOD_PER_PERSON,
  HAPPINESS_PER_FOOD,
  HAPPINESS_PER_HOUSE,
  POPULATION_GROWTH_THRESHOLD,
  POPULATION_GROWTH_RATE,
  STARVATION_DAMAGE,
  CITIZEN_HAPPINESS_THRESHOLD,
  CITIZEN_FOOD_MULTIPLIER,
} from "../config";

export class PopulationSystem {
  update(state: GameState): void {
    if (state.buildings.length === 0) return;

    let capacity = 0;
    let houseCount = 0;
    let gardenCount = 0;
    let innCount = 0;
    let wallCount = 0;
    let towerCount = 0;
    let chapelCount = 0;
    let tavernCount = 0;

    for (const b of state.buildings) {
      const def = BUILDINGS[b.type];
      capacity += def.populationCapacity;
      if (b.type === BuildingType.House) houseCount++;
      if (b.type === BuildingType.Garden) gardenCount++;
      if (b.type === BuildingType.Inn) innCount++;
      if (b.type === BuildingType.Wall) wallCount++;
      if (b.type === BuildingType.Tower) towerCount++;
      if (b.type === BuildingType.Chapel) chapelCount++;
      if (b.type === BuildingType.Tavern) tavernCount++;
    }

    const foodMultiplier = state.population.tier >= 2 ? CITIZEN_FOOD_MULTIPLIER : 1;
    state.population.foodConsumption = state.population.total * FOOD_PER_PERSON * foodMultiplier;

    const foodAvailable = state.resources[ResourceType.Food];
    const hasEnoughFood = foodAvailable >= state.population.foodConsumption;

    let happiness = BASE_HAPPINESS;
    const techBonuses = state.getTechBonuses();
    happiness += techBonuses.happinessBonus;

    if (hasEnoughFood) {
      state.resources[ResourceType.Food] -= state.population.foodConsumption;
      happiness += HAPPINESS_PER_FOOD;
    } else {
      happiness -= STARVATION_DAMAGE * 10;
    }

    happiness += houseCount * HAPPINESS_PER_HOUSE;
    happiness += gardenCount * 10;
    happiness += innCount * 15;
    happiness += wallCount * 5;
    happiness += towerCount * 5;
    happiness += chapelCount * 25;
    happiness += tavernCount * 20;

    if (state.population.total > 0 && state.population.total >= capacity) {
      happiness -= 10;
    }

    const hasTradingPost = state.buildings.some(
      (b) => b.type === BuildingType.TradingPost || b.type === BuildingType.Inn || b.type === BuildingType.Tavern
    );
    if (hasTradingPost) happiness += 5;

    happiness = Math.max(0, Math.min(100, happiness));
    state.population.happiness = happiness;

    const growthThreshold = state.population.tier >= 2 ? POPULATION_GROWTH_THRESHOLD + 10 : POPULATION_GROWTH_THRESHOLD;
    if (state.population.total < capacity && hasEnoughFood && happiness >= growthThreshold) {
      const growth = POPULATION_GROWTH_RATE * (happiness / 100);
      state.population.total = Math.min(capacity, state.population.total + growth);
    }

    state.population.total = Math.floor(state.population.total * 10) / 10;

    if (!hasEnoughFood && state.population.total > 0) {
      state.population.total = Math.max(0, state.population.total - 0.05);
      state.population.total = Math.floor(state.population.total * 10) / 10;
    }

    const hasMarket = state.buildings.some((b) => b.type === BuildingType.Market || b.type === BuildingType.Inn || b.type === BuildingType.Tavern);
    if (happiness >= CITIZEN_HAPPINESS_THRESHOLD && hasMarket && state.population.tier === 1 && state.population.total >= 8) {
      state.population.tier = 2;
    }
  }
}
