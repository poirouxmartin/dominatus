import { GameState } from "../state/GameState";
import { Season } from "../types";
import { SEASON_TICKS, SEASONS_ORDER } from "../config";

export class SeasonSystem {
  update(state: GameState): void {
    state.seasonTick++;

    if (state.seasonTick >= SEASON_TICKS) {
      state.seasonTick = 0;
      const currentIdx = SEASONS_ORDER.indexOf(state.season as typeof SEASONS_ORDER[number]);
      const nextIdx = (currentIdx + 1) % SEASONS_ORDER.length;
      state.season = Season[SEASONS_ORDER[nextIdx].charAt(0).toUpperCase() + SEASONS_ORDER[nextIdx].slice(1) as keyof typeof Season];
    }
  }
}
