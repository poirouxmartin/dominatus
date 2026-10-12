# Dominatus 🏛️

City-builder stratégique dans la Rome antique — carte hexagonale, saisons, économie à chaînes, raids et monuments.

Inspiré d'Anno, Civilization, Zoo Tycoon et Frostpunk.

## Lancer le jeu

```bash
npm install
npm run dev        # → http://localhost:5173/ (port par défaut de Vite, aucun vite.config)
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement (HMR) |
| `npm test` | Audit e2e de la logique — 54 assertions (Node, sans rendu) |
| `npm run smoke` | Régression navigateur complète (Chrome headless) |
| `npm run playtest` | Une IA joue vers la victoire et rapporte les données d'équilibrage (`MONUMENT=1` pour la stratégie monument) |
| `npm run build` | Build production (`dist/`) |
| `npm run preview` | Servir le build |

## Le jeu

- **Carte hexagonale** générée (île entourée de mer, biomes en massifs : forêts de cyprès, montagnes, terres cultivables)
- **4 saisons** de 30 ticks : hiver ralentit les fermes, météo particulaire (neige, pluie, pétales), musique générative par saison
- **31 bâtiments romains** : chaque ressource a sa chaîne (bois → planches → caserne, pierre → briques → thermes, or → amphithéâtre…)
- **Économie à débouchés** : l'eau nourrit thermes, l'or finance l'amphithéâtre et le Circus Maximus, le cuir et les outils arment la caserne
- **Événements contextuels** : tempêtes, raids, caravanes, récoltes exceptionnelles, marchands, colons errants…
- **2 voies de victoire** :
  - **Grande Province** — 50 colons + 14 technologies
  - **Monument** — Circus Maximus + 30 colons à 80% de bonheur + 10 technologies
- **PWA** : installable, jouable hors-ligne

## Contrôles

| Touche | Action |
|---|---|
| `1-9` | Sélectionner un bâtiment |
| Clic gauche | Placer / inspecter |
| Clic droit | Annuler / démolir (50% remboursé) |
| `WASD` · molette-clic | Déplacer la carte |
| Molette / `+` `-` | Zoom |
| `SPACE` / `P` | Vitesse / pause |
| `E` | Panneau Province (économie détaillée) |
| `T` · `R` · `L` | Commerce · Recherche · Chronique |
| `M` · `H` | Mute · Aide |

## Direction artistique

Trois palettes commutables via `?da=1|2|3` (comparatif : `/da-preview.html`) :

1. **Bronze & Noyer** (défaut) — encre nocturne chaude, bronze et laiton
2. **Parchemin d'Empire** — panneaux ivoire, encre brune
3. **Marbre & Pourpre** — marbre clair, liseré pourpre impérial

Détails dans [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md).

## Tests

- **`npm test`** : 54 assertions sur la logique pure (génération de carte sur 50 graines, économie, hiver, raids, save/load, double victoire, intégrité des données, perf fin de partie)
- **`npm run smoke`** : joue réellement au jeu dans Chrome headless (démarrage → construction → saisons → victoire → relance)
- **`npm run playtest`** : un bot suit le tutoriel puis optimise vers la victoire ; rapporte durée, famine, bonheur min — l'outil d'équilibrage

## Architecture

```
src/
  audio/    AudioManager — SFX et musique génératifs (WebAudio, zéro asset)
  map/      hex.ts (maths hexagonales), TileMap.ts (rendu peint + cache)
  scenes/   Title, Game, UI (caméra dédiée) — PWA-ready
  systems/  Production, Population, Season, Event, Tech
  state/    GameState — source unique de vérité, save v3
  ui/       HUD, BuildPanel, TechPanel, EventLog, Weather, theme (3 palettes), icons (vectoriels)
scripts/    e2e-audit.ts, smoke.cjs, playtest-sim.ts, da-preview.cjs, visual-debug.cjs
```

Stack : TypeScript · Phaser 3 · Vite. Aucune dépendance runtime hors Phaser.
