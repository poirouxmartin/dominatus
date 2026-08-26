# Dominatus — Art Direction

## Vision

**« La campagne romaine au soir »** : une île méditerranéenne hexagonale — oliviers, cyprès, blé, travertin et mer — posée sur une table d'encre sombre, encadrée de bronze. Tout dérive d'une même palette chaude et désaturée : la carte ET l'UI partagent les mêmes matériaux.

## Palette maîtresse

| Matériau | Valeur | Usage |
|----------|--------|-------|
| Olivine (herbe) | `#889258` | plaine, désaturée, variation ±5 |
| Olivier (forêt) | `#4c603e` | sol de forêt |
| Cyprès | `#3c5a3a` / `#2e462e` | silhouettes verticales sombres |
| Mer | `#2e5c70` | azur profond désaturé, écume `#bfe0e4` |
| Travertin | `#968e7e` | montagnes (neige uniquement l'hiver) |
| Blé | `#9e8a52` / mûr `#c4a452` | champs cultivables |
| Plâtre | `#f0e4cc` | murs de bâtiments |
| Tuile | `#c06a48` / `#94452e` | tous les toits |
| Ardoise chaude | `#6a5a50` | toits industriels |
| Bronze | `#c9a84c` / `#8a6d3b` | accents UI, filets, minimap |
| Encre | `#1c1812` | fond de table, panneaux |
| Ivoire | `#f0e8d8` | texte principal |
| Parchemin | `#d9c9a8` | texte secondaire |

Règle d'homogénéité : **une seule source** (`theme.ts` + `BP`/`TERRAIN_BASE`) — aucune couleur ad-hoc dans les écrans.

## Grille

- Hex pointe-en-haut *odd-r*, `HEX_SIZE = 26`.
- Contours très discrets (noir α 0.11), biseau léger (lumière α 0.045 haut-gauche, ombre α 0.09 bas-droite) : la trame se voit à peine, le massif de terrain domine.
- Génération : 3 passes de lissage par majorité (poids 3) → massifs francs ; mares orphelines supprimées ; anneau d'eau périphérique complet (île nette).

## Végétation & terrain

- **Forêt** : mélange cyprès (flamme sombre, ombre au sol) + pins parasols (ombrelle sur tronc haut) ; automne = ombrelles ocre ; hiver = givre sur les ombrelles, cyprès persistants.
- **Montagne** : travertin chaud, 3 facettes, arête secondaire ; neige seulement en hiver.
- **Eau** : profondeur centrale plus sombre, 3 vagues discrètes, écume sur les arêtes côtières.
- **Cultivable** : sillons inclinés segmentés + épis ; dorure été/automne.
- **Herbe** : touffes rares, coquelicots (point rouge), cailloutis — presque rien : le vide est propre.

## Bâtiments

Kit romain unique (`BUILDING_PAINTERS`) : plâtre ivoire + bande d'assise, toits tuiles avec faitage, chaume pour le rural, travertin pour le civic, bronze pour les enseignes, fenêtres allumées `#f2c46a`, ombre ellipse au sol.

## UI

- Barres (haut 50 px / bas 76 px) : encre `#1c1812`, filet bronze, cartes arrondies discrets.
- Ressources : icône vectorielle 6.5 px + nombre mono, pas de 60 px.
- Build bar : cartes 62 px, nom 10 px tronqué avec ellipse (nom complet en tooltip), coûts centrés pas 20 px, cadenas sur les verrouillées.
- Minimap : panneau encadré bronze en bas-droite, rectangle de caméra or.
- Survol : hex contour or 2.2 px + nom du terrain dans la pilule d'info.

## Caméra

- Zoom initial = carte entière visible (fit ×0.99) ; molette vers le curseur (min fit×0.92, max ×2) ; pan WASD/flèches/clic-molette.

## Son & musique (implémenté)

- **Moteur audio procédural** (`src/audio/AudioManager.ts`, WebAudio natif, zéro asset) :
  - SFX synthétisés : clic, construction, démolition, trade, recherche, alerte, raid, saison, objectif, pause, erreur.
  - Musique générative : nappe d'accords détunés (passe-bas 900 Hz) + pincés pentatoniques ; un mode d'accords et une gamme par saison, mode titre plus lent.
- Buses master/musique/SFX, mute **M**, préférences persistées (`dominatus_audio_v1`).
- AudioContext créé au premier geste utilisateur (politique autoplay).

## Références

Peintures de campagne romaine (Cyprès, Van Gogh — silhouettes) · Anno 1404 (chaleur) · Civ VI (lisibilité) · mosaïques romaines (eau).
