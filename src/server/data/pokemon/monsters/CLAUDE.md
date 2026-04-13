# Pokemon Journeys — Monsters

One JSON file per wild Pokemon encounter type. Each file matches the `IMonsterDef` schema (`src/common/types.ts`) — the same format used by GJotL monsters. Loaded by `loadMonsterDefs(GameMode.POKEMON)` in `GameManager.ts`, which reads from this directory instead of `data/monsters/` when the game mode is POKEMON.

## Schema

**Required fields:** `name`, `isBoss`, `levels` (keyed `1`/`2`/`3`), `aiDeck[]`

Each level entry has `normal` and `elite` stat blocks: `hp`, `move`, `attack`, `range`, `immunities`.

Each `aiDeck` card has `id`, `initiative`, `shuffle`, `top`, and `bottom` behaviors.

## Current Monsters

| File | Wild Pokémon | Type | HP (lvl 1 normal) | Behavior |
|------|-------------|------|-------------------|---------|
| `poochyena.json` | Poochyena | DARK | 8 | Melee attacker; one card applies MUDDLE |

## Adding a New Wild Pokemon

1. Create `<name>.json` following `IMonsterDef`
2. Add the filename to the `files` array in `loadMonsterDefs()` in `GameManager.ts` (inside the `POKEMON` branch)
3. Reference the `name` value in a scenario's `monsterSpawns[].monsterId`
