# Dominatus — Art Direction

## Vision

Dominatus seeks a **warm, refined, historically grounded** aesthetic that draws from classical antiquity (Roman Empire) while maintaining readability at strategy-game scale. The tone balances **grandeur** with **earthiness** — an empire built from mud and marble.

## Style Pillars

### 1. Painterly Isometric
- Tiles rendered with subtle **color variation** (not flat fills)
- Buildings cast soft shadows, grounded in the terrain
- Inspired by: Anno 1404's watercolor warmth, Civ 6's stylized clarity

### 2. Warm Earth Palette
The dominant mood is **amber/golden hour** — late afternoon light on stone and soil.

| Role | Primary | Dark | Light |
|------|---------|------|-------|
| Grass | `#4a7a3a` | `#2d5a25` | `#6b9a4a` |
| Forest | `#2d5a25` | `#1a3a15` | `#3d7a35` |
| Water | `#2a6a9c` | `#1a4a7c` | `#4a8abc` |
| Mountain | `#7a7a7a` | `#555555` | `#999999` |
| Farmable | `#5a8a3a` | `#3a6a2a` | `#7aaa5a` |
| UI Background | `#1a1a2e` | `#0f0f1e` | `#2a2a3e` |
| UI Accent (Gold) | `#c9a84c` | `#a08030` | `#e0c060` |
| UI Text | `#e8e0d0` | `#b0a890` | `#ffffff` |

### 3. Building Hierarchy
Buildings communicate **importance** through size and ornament:

| Tier | Buildings | Visual Language |
|------|-----------|----------------|
| **Rural** | Farm, Lumber Mill, Quarry | Wooden, rough-hewn, functional |
| **Industrial** | Sawmill, Brickyard | Stone/brick, chimneys, smoke |
| **Civic** | House, Market, Trading Post | Tiled roofs, awnings, signage |
| **Infrastructure** | Warehouse | Large, utilitarian, storage crates |

### 4. Typography
- **Title/Headers**: Serif (Georgia, Playfair Display) — classical authority
- **Body/UI**: Clean sans-serif (Inter, system font) — readability
- **Numbers/Data**: Monospace — quick scanning

### 5. Color Coding
| Resource | Icon Color | Building Accent |
|----------|-----------|----------------|
| Wood | `#8b6914` brown | Warm brown tones |
| Food | `#4a7c3a` green | Green fields |
| Stone | `#7a7a7a` grey | Grey rock |
| Gold | `#c9a84c` gold | Golden accents |
| Planks | `#9a6b3a` tan | Wood planks |
| Bricks | `#aa5533` terracotta | Red brick |

## Mood References

- **Anno 1404**: Warm Mediterranean light, detailed but readable buildings
- **Civilization VI**: Stylized clarity, clear tile distinction, iconography
- **Frostpunk**: Atmospheric mood (winter palette shift), emotional weight
- **Manor Lords**: Organic growth, natural terrain blending
- **Banished**: Quiet, earthy, functional beauty

## Animation Principles

- **Idle**: Buildings have subtle breathing/pulsing (1-2px scale oscillation)
- **Production**: Smoke particles from chimneys, water ripples on farms
- **Seasons**: Tree color shifts (green→orange→bare→snow-dusted)
- **Events**: Screen shake on storms, golden glow on festivals

## UI Design

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ [🪵 50] [🌾 80] [🪨 20] [💰 100] [📦 0] [🧱 0] │ Spring (t15) │ Pop: 4 │ Happy: 70% │ ▶ 1x │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   GAME MAP (30×20 grid)                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [House 10w5p] [Farm 15w] [Lumber 8w] [Quarry 12w] ... │
└─────────────────────────────────────────────────────────┘
```

### Panel Style
- **Background**: Dark navy `#1a1a2e` with 85% opacity
- **Borders**: Subtle gold `#c9a84c` on selected items
- **Hover**: Soft glow effect, 15% white overlay
- **Active**: Green tint `#4a7c3f` for selected building

## Season Palette Shifts

| Season | Grass | Sky Tint | Mood |
|--------|-------|----------|------|
| Spring | Bright green | Warm yellow | Hope, growth |
| Summer | Deep green | Clear blue | Abundance, heat |
| Autumn | Olive/brown | Orange | Harvest, transition |
| Winter | Pale/blue-grey | Cold blue | Survival, tension |

## Sound Direction (Future)

- **Ambient**: Birds (spring/summer), wind (autumn), creaking wood (winter)
- **UI**: Soft stone clicks, gold coin sounds for trade
- **Building**: Hammer strikes, saw cutting, market chatter
- **Music**: Orchestral with classical instruments (lyre, drums, strings)
