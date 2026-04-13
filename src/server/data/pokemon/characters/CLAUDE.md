# Pokemon Journeys — Characters

One JSON file per playable starter Pokemon. Each file matches the `PokemonCharDef` schema (`src/common/pokemon-types.ts`). Loaded by `loadCharacterCards()` in `GameManager.ts` and cast to `IAbilityCard[]` so the existing hand/card-selection engine handles them without changes.

## Schema

**Required fields:** `id`, `name`, `pokemonType`, `hp[10]`, `baseStats`, `cards[]`

**`hp`** — 10 values indexed by scenario level (0–9). Level 0 is tutorial difficulty; level 9 is the hardest.

**`baseStats`** — five values (`attack`, `defense`, `specialAttack`, `specialDefense`, `speed`). Used for future type-effectiveness and stat-stage calculations; not yet read by the current engine.

**`cards[]`** — ability cards in `IAbilityCard` format. Each card has `id`, `name`, `level`, `initiative`, and `top`/`bottom` halves with a `behavior` object. The `behavior` uses the same fields as GJotL cards (`attack`, `move`, `heal`, `shield`, `xp`, `applyCondition`, etc.) so the existing `Executor` handles them without modification.

## Current Characters

| File | Pokémon | Type | Speed | Cards |
|------|---------|------|-------|-------|
| `treecko.json` | Treecko | GRASS | 70 | Pound, Quick Attack, Absorb, Leer |
| `torchic.json` | Torchic | FIRE | 45 | Scratch, Ember, Growl, Focus Energy |
| `mudkip.json` | Mudkip | WATER | 40 | Tackle, Water Gun, Mud-Slap, Growl |

## Card Initiative Ranges

Initiative values reflect each Pokemon's Speed stat — faster Pokemon have lower (earlier) initiatives:

| Pokemon | Range | Notes |
|---------|-------|-------|
| Treecko | 16–55 | Quick Attack (16) nearly always acts first |
| Torchic | 22–52 | Balanced; Scratch (28) and Ember (38) are core offensive picks |
| Mudkip | 34–56 | Slowest; trades speed for two MUDDLE-applying moves |

## Adding a New Starter

1. Create `characters/<name>.json` following the `PokemonCharDef` schema
2. Add a `CardClass` entry in `src/common/types.ts`
3. Add a path entry in `CLASS_FILE_MAP` in `GameManager.ts`
4. Add the starter option to `PokemonTitleScreen.vue`
