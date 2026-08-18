import { GameState } from "../state/GameState";
import { BuildingType, Resources, ResourceType, Season } from "../types";
import { BUILDINGS } from "../config";

export class ProductionSystem {
  update(state: GameState): void {
    for (const building of state.buildings) {
      if (!building.active) continue;

      const def = BUILDINGS[building.type];
      if (!def.production) continue;

      if (def.production.input) {
        let canProduce = true;
        for (const [res, amt] of Object.entries(def.production.input)) {
          if ((state.resources[res as ResourceType] ?? 0) < (amt ?? 0)) {
            canProduce = false;
            break;
          }
        }
        if (!canProduce) continue;
      }

      building.productionTimer++;

      let ticksPerCycle = def.production.ticksPerCycle;
      if (state.season === Season.Winter && def.production.winterMultiplier) {
        ticksPerCycle = Math.ceil(ticksPerCycle / def.production.winterMultiplier);
      }

      if (building.productionTimer >= ticksPerCycle) {
        building.productionTimer = 0;

        if (def.production.input) {
          state.spendResources(def.production.input);
        }

        const output: Partial<Resources> = {};
        for (const [res, amt] of Object.entries(def.production.output)) {
          output[res as ResourceType] = amt as number;
        }
        state.addResources(output);
      }
    }
  }
}
