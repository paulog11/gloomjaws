# Pokemon Journeys — Scenarios

One JSON file per route or dungeon. Each file matches the `IScenarioDef` schema (`src/common/types.ts`). Loaded by `loadScenarioDef(id, GameMode.POKEMON)` in `GameManager.ts`, which reads from this directory when the game mode is POKEMON.

## Schema

**Required fields:** `id`, `name`, `level`, `goal`, `goalDescription`, `rewards`, `initialRevealedRooms`, `spaces[]`, `monsterSpawns[]`, `playerStartSpaces[]`

**`spaces[]`** — axial hex coordinates (`q`, `r`), terrain type (`NORMAL` | `DIFFICULT` | `DOOR` | `OBSTACLE`), and `roomId`. Only rooms in `initialRevealedRooms` are visible at scenario start.

**`monsterSpawns[]`** — each entry references a `monsterId` matching a monster file's `name` field, a starting `spaceId`, and a `roomId`.

**`playerStartSpaces[]`** — one entry per player; supports up to the number of players in the game.

## Current Scenarios

| File | Name | Goal | Monsters | Map |
|------|------|------|----------|-----|
| `scenario-01.json` | Route 101 | KILL_ALL | 1× Poochyena | 3×3 single room |

## Adding a New Scenario

1. Create `scenario-NN.json` (zero-padded two-digit number)
2. Reference only monster `name` values that exist in `monsters/`
3. Ensure `playerStartSpaces` has at least as many entries as the expected player count
4. Add an unlock to a prior scenario's `rewards.unlocks[]` if it should be gated
