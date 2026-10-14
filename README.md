# Dominatus 🏛️

Strategic city-builder set in ancient Rome — hex map, seasons, chained economy, raids and monuments.

Inspired by Anno, Civilization, Zoo Tycoon and Frostpunk.

## Run the game

```bash
npm install
npm run dev        # → http://localhost:5173/ (Vite's default port, no vite.config)
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server (HMR) |
| `npm test` | End-to-end audit of the logic — 54 assertions (Node, no rendering) |
| `npm run smoke` | Full browser regression run (headless Chrome) |
| `npm run playtest` | An AI plays toward victory and reports balancing data (`MONUMENT=1` for the monument strategy) |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Serve the build |

## The game

- **Generated hex map** (island surrounded by sea, biomes in clusters: cypress forests, mountains, farmland)
- **4 seasons** of 30 ticks: winter slows farms, particle weather (snow, rain, petals), generative music per season
- **31 Roman buildings**: each resource has its own chain (wood → planks → barracks, stone → bricks → baths, gold → amphitheatre…)
- **Demand-driven economy**: water feeds the baths, gold funds the amphitheatre and the Circus Maximus, leather and tools equip the barracks
- **Contextual events**: storms, raids, caravans, exceptional harvests, merchants, wandering settlers…
- **2 victory paths**:
  - **Grand Province** — 50 settlers + 14 technologies
  - **Monument** — Circus Maximus + 30 settlers at 80% happiness + 10 technologies
- **PWA**: installable, playable offline

## Controls

| Key | Action |
|---|---|
| `1-9` | Select a building |
| Left click | Place / inspect |
| Right click | Cancel / demolish (50% refunded) |
| `WASD` · middle click | Move the map |
| Mouse wheel / `+` `-` | Zoom |
| `SPACE` / `P` | Speed / pause |
| `E` | Province panel (detailed economy) |
| `T` · `R` · `L` | Trade · Research · Chronicle |
| `M` · `H` | Mute · Help |

## Art direction

Three palettes, switchable via `?da=1|2|3` (comparison: `/da-preview.html`):

1. **Bronze & Walnut** (default) — warm night-ink, bronze and brass
2. **Imperial Parchment** — ivory panels, brown ink
3. **Marble & Purple** — light marble, imperial purple trim

Details in [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md).

## Tests

- **`npm test`**: 54 assertions on pure logic (map generation over 50 seeds, economy, winter, raids, save/load, double victory, data integrity, end-game performance)
- **`npm run smoke`**: plays the game for real in headless Chrome (start → build → seasons → victory → restart)
- **`npm run playtest`**: a bot follows the tutorial, then optimises toward victory; reports duration, starvation and minimum happiness — the balancing tool

## Architecture

```
src/
  audio/    AudioManager — SFX and generative music (WebAudio, zero assets)
  map/      hex.ts (hex maths), TileMap.ts (painted rendering + cache)
  scenes/   Title, Game, UI (dedicated camera) — PWA-ready
  systems/  Production, Population, Season, Event, Tech
  state/    GameState — single source of truth, save v3
  ui/       HUD, BuildPanel, TechPanel, EventLog, Weather, theme (3 palettes), icons (vector)
scripts/    e2e-audit.ts, smoke.cjs, playtest-sim.ts, da-preview.cjs, visual-debug.cjs
```

Stack: TypeScript · Phaser 3 · Vite. No runtime dependencies beyond Phaser.

## License

MIT, see [LICENSE](LICENSE).
