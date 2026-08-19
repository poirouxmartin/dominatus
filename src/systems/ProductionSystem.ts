import { GameState } from "../state/GameState";
import { Resources, ResourceType, Season } from "../types";
import { BUILDINGS } from "../config";

export class ProductionSystem {
  update(state: GameState): void {
    const bonuses = state.getTechBonuses();

    for (const building of state.buildings) {
      if (!building.active) continue;

      const def = BUILDINGS[building.type];
      if (!def.production) continue;

      const input = def.production.input;
      let canProduce = true;
      for (const [res, amt] of Object.entries(input)) {
        if (amt && (state.resources[res as ResourceType] ?? 0) < amt) {
          canProduce = false;
          break;
        }
      }
      if (!canProduce) continue;

      building.productionTimer++;

      let ticksPerCycle = def.production.ticksPerCycle;
      if (state.season === Season.Winter && def.production.winterMultiplier) {
        const hasIrrigation = state.researchedTechs.includes("irrigation");
        if (!hasIrrigation) {
          ticksPerCycle = Math.ceil(ticksPerCycle / def.production.winterMultiplier);
        }
      }

      if (building.productionTimer >= ticksPerCycle) {
        building.productionTimer = 0;

        for (const [res, amt] of Object.entries(input)) {
          if (amt) state.resources[res as ResourceType] -= amt;
        }

        const output: Partial<Resources> = {};
        for (const [res, amt] of Object.entries(def.production.output)) {
          if (!amt) continue;
          const key = res as ResourceType;
          let finalAmt = amt;

          if (key === ResourceType.Food) finalAmt = Math.ceil(finalAmt * bonuses.foodMultiplier);
          if (key === ResourceType.Wood) finalAmt = Math.ceil(finalAmt * bonuses.woodMultiplier);
          if (key === ResourceType.Stone) finalAmt = Math.ceil(finalAmt * bonuses.stoneMultiplier);
          if (key === ResourceType.Gold) finalAmt = Math.ceil(finalAmt * bonuses.goldMultiplier);

          output[key] = finalAmt;
        }
        state.addResources(output);
      }
    }
  }
}
