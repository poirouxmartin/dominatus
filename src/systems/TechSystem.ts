import { GameState } from "../state/GameState";
import { TECH_TREE } from "../config";

export class TechSystem {
  update(state: GameState): void {
    const researching = state.researchTarget;
    if (!researching) return;

    const tech = TECH_TREE.find((t) => t.id === researching);
    if (!tech) {
      state.researchTarget = null;
      return;
    }

    if (state.researchedTechs.includes(researching)) {
      state.researchTarget = null;
      return;
    }

    const available = state.resources.research;
    const needed = tech.cost - state.researchProgress;
    const consumed = Math.min(available, needed);

    if (consumed > 0) {
      state.resources.research -= consumed;
      state.researchProgress += consumed;
    }

    if (state.researchProgress >= tech.cost) {
      state.researchedTechs.push(researching);
      state.researchTarget = null;
      state.researchProgress = 0;
      state.log(`${tech.name} discovered`);
    }
  }
}
