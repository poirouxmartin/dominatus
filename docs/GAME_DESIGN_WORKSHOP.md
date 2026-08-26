# Dominatus — Atelier de conception (brainstorm géant)

> Document vivant. On répond aux questions étape par étape, aucune idée à la trappe.
> À la fin : conflits arbitrés → backlog → roadmap.

**Comment lire** : chaque question a un ID (QV01, QP03…). Répondre en dessous de la question
(`> RÉPONSE : …`). Les réponses définitives passent en gras ou en section "Décisions".

---

## 0. Existant — Dominatus v0.5 (le point de départ)

- Carte hexagonale 600 tuiles, île, 5 biomes simples
- Temps réel par tick, 3 vitesses, pause
- 31 bâtiments, 17 technologies, 8 événements
- Bonheur à breakdown, eau/nourriture/bois/pierre/or/recherche
- 2 voies de victoire : 50 colons + 14 techs / Circus + 30 colons à 80%
- Bot playtest (`npm run playtest`), 54 assertions, smoke navigateur
- PWA hors-ligne, 3 DA

---

## 1. La vision — le rêve fondamental

**QV01** — En une phrase : quand tu fermes les yeux et vois Dominatus "fini", qu'est-ce qui
s'affiche à l'écran ? (une scène précise)

> RÉPONSE :

**QV02** — Le joueur est-il : un dieu (vue abstraite), un gouverneur présent dans le monde,
ou les deux selon le niveau de zoom ?

> RÉPONSE :

**QV03** — Une partie idéale dure combien de temps ? (2h / 10h / 50h / infinie type MMO ?)

> RÉPONSE :

**QV04** — Quel jeu existant est le plus proche du rêve, et qu'est-ce qui manque encore
à ce jeu pour être LE rêve ?

> RÉPONSE :

**QV05** — Le ton : simulation sérieuse et exigeante (Banished), sandbox créative
(Minecraft-city), épique narrative (Frostpunk), ou tout ça ?

> RÉPONSE :

---

## 2. Échelles & multi-échelle (LE cœur du projet)

**QE01** — Les trois échelles (Empire / Ville / Habitant) : lesquelles sont NON négociables ?

> RÉPONSE :

**QE02** — Échelle EMPIRE : que voit-on exactement et que gère-t-on ? (frontières, provinces,
diplomatie, caravanes, armées, recherche globale ?)

> RÉPONSE :

**QE03** — Échelle VILLE : notre v0.5 est-elle la bonne base ? Qu'est-ce qui manque
à notre ville actuelle pour être une "vraie" ville Anno ?

> RÉPONSE :

**QE04** — Échelle HABITANT : que fait-on VOIR ?
(a) cosmétique charmant (habitants qui marchent, Zoo Tycoon spectator)
(b) simulation réelle (chaque habitant a un métier, une maison, une vie)
(c) jouable (contrôle direct type AoE)

> RÉPONSE : (a / b / c — et pourquoi)

**QE05** — Transitions d'échelle : zoom continu fluide (comme Google Earth) ou modes
séparés chargés (Total War : la bataille est une autre "scène") ?

> RÉPONSE :

**QE06** — La simulation de l'échelle inférieure influence-t-elle la supérieure
(Total War réussi) ou est-elle cosmétique (Spore raté) ? Exemple concret attendu :
un habitant mécontent à l'échelle 3 peut-il déclencher une émeute visible à l'échelle 2 ?

> RÉPONSE :

**QE07** — Peut-on gagner la partie en restant à une seule échelle (le joueur choisit
sa profondeur) ou les paliers supérieurs deviennent-ils obligatoires ?

> RÉPONSE :

---

## 3. Monde, carte & biomes

**QM01** — Génération du monde : continents réels (Civ), archipel d'îles (Anno),
ou les deux selon les parties (choix de type de carte) ?

> RÉPONSE :

**QM02** — Taille max acceptable : notre 600 tuiles → 2000 ? 5000 ? 7000 (huge Civ) ?
Et combien de provinces/cités sur cette carte ?

> RÉPONSE :

**QM03** — Biomes au lancement : tempéré, désert, toundra, jungle… Combien ?
Chacun avec ressources ET besoins propres (Anno Orient/Occident) ?

> RÉPONSE :

**QM04** — Les besoins des populations varient-ils selon le biome/climat ?
(Anno : les Nomades du désert veulent épices et dattes, pas du poisson)

> RÉPONSE :

**QM05** — Rivières navigables ? Mers intérieures ? Montagnes infranchissables
comme frontières naturelles ?

> RÉPONSE :

**QM06** — Les ressources du terrain (Civ) : gisements visibles et exploitables
(fer, marbre, épices…) au-delà de nos 5 terrains de base ?

> RÉPONSE :

**QM07** — Catastrophes terrain (Civ Gathering Storm) : inondations FERTILES,
volcans enrichissant les sols, sécheresses, incendies ?

> RÉPONSE :

---

## 4. Population & société (le cœur Anno)

**QP01** — Combien de tiers de population ? Noms/rôles romains proposés :
Plébéiens → Citoyens → Équites → Patriciens → (Sénateurs ?)

> RÉPONSE :

**QP02** — Les besoins par tier : lesquels ? (pain, eau, vin, bains, jeux, religion,
éducation, luxe, verre, épices…) Combien de besoins au total ?

> RÉPONSE :

**QP03** — L'upgrade d'habitat visuel ✓ (la cabane devient villa) : jusqu'où le visuel
évolue-t-il ? La ville change-t-elle de silhouette par tier (Anno) ?

> RÉPONSE :

**QP04** — Métiers : assignables individuellement (Banished) ou workforce abstraite
par bâtiment (Anno) ?

> RÉPONSE :

**QP05** — Désirabilité de quartier (Pharaoh) : les riches s'installent près des temples
et parcs, l'industrie dévalue le voisinage → zoning organique. Oui/non ?

> RÉPONSE :

**QP06** — Les habitants sont-ils des individus (noms, vies, familles) ou une masse
abstraite ? (impact : échelle habitant, événements personnels)

> RÉPONSE :

**QP07** — Chômage / pénurie de main d'œuvre : des mécaniques à part entière ?

> RÉPONSE :

**QP08** — Migration : les colons viennent-ils des puissances neutres, de l'immigration
spontanée (bonheur), ou naissent-ils sur place ?

> RÉPONSE :

---

## 5. Économie & chaînes de production

**QN01** — Profondeur des chaînes : 2 étages (blé→pain) ou 4 étages
(minerai→fer→outils→guerre) ?

> RÉPONSE :

**QN02** — Porteurs visibles entre bâtiments (Settlers) : oui/non ?

> RÉPONSE :

**QN03** — Commerce INTER-provinces : routes automatisées (caravanes qui circulent)
ou manuel (on arme un navire et on l'envoie) ?

> RÉPONSE :

**QN04** — Marché mondial : prix fluctuants selon offre/demande (Anno 1800)
ou prix fixes (actuel) ?

> RÉPONSE :

**QN05** — Monnaie : or global (actuel) ou trésorerie par province ?

> RÉPONSE :

**QN06** — Impôts : taux réglable par tier (Anno) — plus d'or, moins de bonheur ?

> RÉPONSE :

**QN07** — Maintenance : les bâtiments avancés consomment-ils or/outils pour tourner ?

> RÉPONSE :

---

## 6. Guerre & armées (Anno + AoE + Civ)

**QG01** — Les armées : unités individuelles contrôlées (AoE) ou armées abstraites
(force numérique, stack) ?

> RÉPONSE :

**QG02** — Où se déplacent-elles : sur la MÊME carte en temps réel, ou carte empire
séparée (mode bataille chargé, Total War) ?

> RÉPONSE :

**QG03** — La guerre se joue contre : puissances neutres, autres joueurs, barbares,
ou tout le monde ?

> RÉPONSE :

**QG04** — Sièges de villes ? Murs et tours existants deviennent-ils le cœur du siège ?

> RÉPONSE :

**QG05** — Combat naval ?

> RÉPONSE :

**QG06** — La guerre peut-elle RASER une ville, ou seulement la capturer/affaiblir ?

> RÉPONSE :

**QG07** — Unités de contre (AoE) : lancier > cavalerie > archer ? Ou simplifié ?

> RÉPONSE :

**QG08** — Les bâtiments militaires (caserne actuelle) produisent-ils les unités
ou seulement des bonus passifs ?

> RÉPONSE :

---

## 7. Puissances neutres (le joyau Anno)

**QU01** — Combien d'archétypes ? Propositions romaines : la Ligue marchande (Hanséate),
l'Empire voisin (militaire), les Corsaires (barbares), le Royaume désertique (Sultan),
la Cité sainte (temple)…

> RÉPONSE :

**QU02** — Chacune apporte : commerce spécialisé, quêtes, guerre/tribut, opinion
individuelle ? Tout ça ?

> RÉPONSE :

**QU03** — Elles existent SUR la carte (villes visitables) ou hors-carte (Anno 1404) ?

> RÉPONSE :

**QU04** — Réputation individuelle par puissance (débloque bâtiments/ressources uniques) ?

> RÉPONSE :

**QU05** — Elles interagissent ENTRE ELLES (le Sultan fait la guerre aux Corsaires
et t'offre de choisir un camp) ?

> RÉPONSE :

---

## 8. Science, doctrines, culture, religion, grands hommes (Civ)

**QT01** — Un arbre ou deux (technologies + doctrines civiques) ?

> RÉPONSE :

**QT02** — Forme : linéaire par ères, arbre à embranchements, ou WEB complet (Civ VI) ?

> RÉPONSE :

**QT03** — Eurekas : boosts de 40% pour actions réalisées en jeu (fonder une ville,
gagner un raid) ?

> RÉPONSE :

**QT04** — Gouvernements avec slots de doctrines activables (militaire/économique/civique) ?

> RÉPONSE :

**QT05** — Combien de technologies au total ? (on : 17 — Civ VI : 70+)

> RÉPONSE :

**QR01** — Religion : mécanique complète (panthéon, croyances, conversion, combat
théologique) ou décorative (temple = bonheur + recherche) ?

> RÉPONSE :

**QR02** — Dieux qui punissent/bénissent (Pharaoh) : rituels à maintenir, colères
si négligés ?

> RÉPONSE :

**QC01** — Grands Personnalités (Civ) : savants, marchands, ingénieurs, artistes
avec effets uniques ?

> RÉPONSE :

**QC02** — Culture/œuvres : une voie de victoire culturelle ?

> RÉPONSE :

---

## 9. Diplomatie & multijoueur

**QD01** — Les autres joueurs : humains, IA, ou les deux ?

> RÉPONSE :

**QD02** — Diplomatie : profondeur (traits de personnalité, agendas secrets, opinions
historiques) ou simple (paix/guerre/commerce) ?

> RÉPONSE :

**QD03** — Coopératif : deux joueurs, une province (un gère l'économie, l'autre la guerre) ?

> RÉPONSE :

**QD04** — Monde persistant MMO-lite ou parties fermées ?

> RÉPONSE :

**QD05** — Congrès mondial / votes / emergencies (Civ) ?

> RÉPONSE :

---

## 10. Temps, saisons, catastrophes

**QL01** — Temps réel continu ✓ avec pause ✓ et vitesses ✓ : on garde tel quel ?

> RÉPONSE :

**QL02** — Cycle jour/nuit : cosmétique ou mécanique (travail de nuit, raids nocturnes) ?

> RÉPONSE :

**QL03** — Les saisons escaladent-elles (Against the Storm : chaque hiver pire que
le précédent) ou cycliques pures ?

> RÉPONSE :

**QL04** — Catastrophes naturelles avec double tranchant (Civ GS) : inondations
DÉTRUISENT mais FERTILISENT ?

> RÉPONSE :

**QL05** — Épidémies ? Incendies qui se propagent de bâtiment en bâtiment ?

> RÉPONSE :

---

## 11. Victoire & fin de partie

**QF01** — Les deux voies actuelles restent ? On en ajoute (domination militaire,
culture, merveilles ×3) ?

> RÉPONSE :

**QF02** — Après la victoire : on continue à jouer (sandbox), on regarde les stats,
on relance ?

> RÉPONSE :

**QF03** — Défaite : uniquement l'extinction, ou aussi des conditions de ruine
(trésorerie, bonheur effondré X ticks) ?

> RÉPONSE :

**QF04** — Score final : que comptabilise-t-on pour comparer les parties ?

> RÉPONSE :

---

## 12. UI/UX multi-échelle & textures fractales

**QX01** — Le LOD fractal validé comme fondation (bake dézoomé / vectoriel zoomé,
détail qui émerge) ?

> RÉPONSE :

**QX02** — Les gros écrans (web technologique, diplomatie) en DOM par-dessus le canvas
ou tout Phaser ?

> RÉPONSE :

**QX03** — L'échelle habitant : les individus sont-ils des sprites animés (Settlers)
ou des silhouettes abstraites (Kingdom) ?

> RÉPONSE :

---

## 13. Technique

**QX04** — Multijoueur : simulation autoritaire serveur (WebSocket) — priorité, plus tard, jamais ?

> RÉPONSE :

**QX05** — Mods : ouvrir le jeu au modding (JSON data-driven) ?

> RÉPONSE :

---

## 14. Idées originales — ce qu'AUCUN jeu ne fait (le nôtre)

*(à remplir : les trous dans le marché, nos idées signature)*

- Idée 1 :

- Idée 2 :

- Idée 3 :

---

## 15. Conflits à arbitrer (liste vivante)

1. **Temps réel (Anno/AoE) vs tour par tour (Civ)** — arbitré : temps réel ✓
2. **Île unique (Anno) vs continents (Civ)** — en attente (QM01)
3. **Désirabilité de quartier (Pharaoh) vs beauté libre (Anno)** — en attente (QP05)
4. **Lois Frostpunk vs dieux Pharaoh** comme source de dilemmes — en attente (QR01/QR02)
5. **Saisons escaladantes (AtS) vs hiver périodique (Northgard)** — en attente (QL03)
6. **Unités individuelles (AoE) vs armées abstraites (Civ)** — en attente (QG01)
7. **Habitants simulés vs cosmétiques** — en attente (QE04)
8. *(à compléter au fil du brainstorm)*

---

## 16. Backlog brut (tout ce qui est retenu, non trié)

*(chaque idée validée des sections 1-14 atterrit ici, sans ordre)*

- …

---

## 17. Roadmap (paliers) — rempli en dernier

```
Palier 1 (fait)      : v0.5 — ville Anno-like, une province
Palier 2 (proposé)   : empire — provinces, carte continent, puissances neutres
Palier 3 (proposé)   : guerre — armées mobiles
Palier 4 (proposé)   : habitant — simulation individuelle, LOD fractal profond
Palier 5 (proposé)   : multijoueur
(à redéfinir après le brainstorm)
```
