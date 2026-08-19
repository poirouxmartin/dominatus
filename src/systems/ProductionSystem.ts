import { GameState } from "../state/GameState";
import { Resources, ResourceType, Season } from "../types";
import { BUILDINGS } from "../config";

export class ProductionSystem {
  update(state: GameState): void {
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
        ticksPerCycle = Math.ceil(ticksPerCycle / def.production.winterMultiplier);
      }

      if (building.productionTimer >= ticksPerCycle) {
        building.productionTimer = 0;

        for (const [res, amt] of Object.entries(input)) {
          if (amt) state.resources[res as ResourceType] -= amt;
        }

        const output: Partial<Resources> = {};
        for (const [res, amt] of Object.entries(def.production.output)) {
          if (amt) output[res as ResourceType] = amt;
        }
        state.addResources(output);
      }
    }
  }
}
