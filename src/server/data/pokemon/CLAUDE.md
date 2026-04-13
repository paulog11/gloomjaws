# Pokemon Journeys — Data Directory

All data files for the Pokemon Journeys game mode (`gameMode: POKEMON`). Loaded by `GameManager.ts` at game creation; never mutated at runtime.

```
data/pokemon/
├── characters/    # Starter Pokemon — one JSON per playable character
├── monsters/      # Wild Pokemon — one JSON per encounter type
└── scenarios/     # Route/dungeon layouts — one JSON per scenario
```

See each subdirectory's `CLAUDE.md` for schema details, current file listings, and instructions for adding new entries.
