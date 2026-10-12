# CLAUDE.md

Phaser 3 + TypeScript + Vite city-builder. Game overview and controls: `README.md`.

## Commands (from package.json)

- `npm run dev`: Vite dev server on port 5173 (no `vite.config`, Vite default).
- `npm run build`: `tsc && vite build`, output in `dist/` (gitignored).
- `npm test`: bundles `scripts/e2e-audit.ts` to `scripts/.e2e.cjs`, runs it in Node (no rendering).
- `npm run smoke`: `scripts/smoke.cjs` drives headless Chrome (puppeteer-core) against `http://localhost:5174/`. Start the dev server first, or set `SMOKE_URL`. The 5174 default does not match `npm run dev` (5173).
- `npm run playtest`: bundles `scripts/playtest-sim.ts`, runs it with argument `3`. `MONUMENT=1` selects the monument strategy.

## Layout

- `src/config.ts`: constants (grid 30x20, tick 1000 ms, 30 ticks per season), tech tree, building defs, `SAVE_VERSION = 3`.
- `src/state/GameState.ts`: single source of truth. Load restores a save only when `saved.version === SAVE_VERSION`.
- `src/systems/`: Production, Population, Season, Event, Tech (tick logic).
- `src/scenes/`: Title, Game, UI (UI runs on its own camera).
- `src/map/`: `hex.ts` (hex math), `TileMap.ts` (painted render + cache).
- `src/ui/`: HUD, BuildPanel, TechPanel, EventLog, Weather, theme (3 palettes), icons.
- `src/audio/AudioManager.ts`: generative WebAudio, no audio assets.

## Pitfalls

- `dist/` and `public/` both contain `da-preview.html` and `da/*.png`. Edit `public/`, never `dist/` (build output).
- Changing the save shape requires bumping `SAVE_VERSION` in `src/config.ts`.
- Local clone is shallow (`.git/shallow`): `git log` shows truncated history.
