import { GameState } from "../state/GameState";
import { ResourceType, BuildingType } from "../types";
import {
  BUILDINGS,
  FOOD_PER_PERSON,
  WATER_PER_PERSON,
  POPULATION_GROWTH_THRESHOLD,
  POPULATION_GROWTH_RATE,
  STARVATION_DAMAGE,
  CITIZEN_HAPPINESS_THRESHOLD,
  CITIZEN_FOOD_MULTIPLIER,
  RESEARCH_PER_PERSON,
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
    let bathhouseCount = 0;
    let amphitheaterCount = 0;
    let templeCount = 0;

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
      if (b.type === BuildingType.Bathhouse) bathhouseCount++;
      if (b.type === BuildingType.Amphitheater) amphitheaterCount++;
      if (b.type === BuildingType.Temple) templeCount++;
    }

    const foodMultiplier = state.population.tier >= 2 ? CITIZEN_FOOD_MULTIPLIER : 1;
    state.population.foodConsumption = state.population.total * FOOD_PER_PERSON * foodMultiplier;

    const foodAvailable = state.resources[ResourceType.Food];
    const hasEnoughFood = foodAvailable >= state.population.foodConsumption;

    const waterNeed = state.population.total * WATER_PER_PERSON;
    const hasWater = state.resources[ResourceType.Water] >= waterNeed;
    if (hasWater) {
      state.resources[ResourceType.Water] -= waterNeed;
    }

    // formule centralisée dans GameState (source unique avec le panneau Province)
    let bathHappy = 0;
    if (bathhouseCount > 0 && state.resources[ResourceType.Water] >= bathhouseCount * 2) {
      bathHappy = bathhouseCount * 12;
    }
    let arenaHappy = 0;
    if (amphitheaterCount > 0 && state.resources[ResourceType.Gold] >= amphitheaterCount * 5) {
      arenaHappy = 20 + (amphitheaterCount - 1) * 8;
    }
    const extraParts: [string, number][] = [];
    if (bathHappy > 0) extraParts.push(["Bathhouses \u00d7" + bathhouseCount, bathHappy]);
    if (arenaHappy > 0) extraParts.push(["Amphitheaters \u00d7" + amphitheaterCount, arenaHappy]);
    if (templeCount > 0) extraParts.push(["Temples \u00d7" + templeCount, 35 + (templeCount - 1) * 12]);
    const happiness = state.computeHappiness(hasEnoughFood, hasWater, capacity, extraParts).total;
    state.population.happiness = happiness;

    state.tempHappiness *= 0.9;
    if (Math.abs(state.tempHappiness) < 0.5) state.tempHappiness = 0;

    if (state.population.total > 0) {
      state.addResources({ [ResourceType.Research]: state.population.total * RESEARCH_PER_PERSON });
    }

    const growthThreshold = state.population.tier >= 2 ? POPULATION_GROWTH_THRESHOLD + 10 : POPULATION_GROWTH_THRESHOLD;
    if (state.population.total < capacity && hasEnoughFood && happiness >= growthThreshold) {
      const growth = Math.max(0.1, POPULATION_GROWTH_RATE * (happiness / 100));
      state.population.total = Math.min(capacity, state.population.total + growth);
    }

    state.population.total = Math.round(state.population.total * 100) / 100;

    if (!hasEnoughFood && state.population.total > 0) {
      state.population.total = Math.max(0, state.population.total - 0.05);
      state.population.total = Math.round(state.population.total * 100) / 100;
    }

    const hasMarket = state.buildings.some((b) => b.type === BuildingType.Market || b.type === BuildingType.Inn || b.type === BuildingType.Tavern);
    if (happiness >= CITIZEN_HAPPINESS_THRESHOLD && hasMarket && state.population.tier === 1 && state.population.total >= 8) {
      state.population.tier = 2;
      state.log("The province has grown into a town (tier 2) \u2014 settlers now eat 1.5x");
    }
  }
}
