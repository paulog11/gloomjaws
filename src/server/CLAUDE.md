# Server

Express + TypeScript. All game logic lives here. The client only renders state and POSTs decisions.

Runs on port **3000** via `tsx watch` in dev (no emit). `tsc` is used for type-checking only during `npm run build`.

`better-sqlite3` requires native compilation — needs Xcode command line tools on macOS.

## File Map

```
server/
├── index.ts         # Express entry point
├── Game.ts          # Central orchestrator — phase state machine, round loop
├── Player.ts        # Player state class
├── Scenario.ts      # Active scenario — spaces, monster tokens, room reveal
├── GameManager.ts   # In-memory game cache + DB persistence; loads data files
├── db.ts            # SQLite via better-sqlite3 (gloomjaws.db at project root)
├── engine/
│   ├── DeferredQueue.ts   # Priority FIFO queue for cascading effects
│   ├── Executor.ts        # Validates + executes Behavior objects
│   ├── Conditions.ts      # Apply/remove/tick all 10 conditions
│   ├── ModifierDeck.ts    # Draw, rolling modifiers, bless/curse
│   ├── HexGrid.ts         # Axial coords, A* pathfinding, LOS
│   └── MonsterAI.ts       # Focus algorithm + full turn resolution
├── data/
│   ├── monsters/          # One JSON per monster type (stats × 3 levels, AI deck)
│   ├── scenarios/         # Gloomhaven scenario layouts, spawns, objectives
│   ├── characters/        # Gloomhaven ability cards per class
│   └── pokemon/
│       ├── characters/    # Pokemon starter character stubs (Treecko, Torchic, Mudkip)
│       └── scenarios/     # Pokemon scenario layouts
└── routes/
    └── game.ts            # All /api/game routes
```

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/game` | Create game (`CreateGamePayload`) → `SerializedGame` (201) |
| GET | `/api/game/:gameId` | Get current state → `SerializedGame` |
| POST | `/api/game/:gameId/start` | Begin scenario, deal hands, spawn monsters |
| POST | `/api/game/input` | Player action (`PlayerInputPayload`) → `SerializedGame` |

`CreateGamePayload` requires `gameMode` (`GLOOMHAVEN` | `POKEMON`), `playerNames`, `playerClasses`, and `scenarioId`. The server validates all fields and returns 400 on bad input.

## Game State Flow

```
LOBBY
  └─ addPlayer() × N
  └─ startScenario() → CARD_SELECTION

CARD_SELECTION
  └─ each player: processCardSelection(topCardId, bottomCardId)
  └─ all submitted → draw monster AI cards → INITIATIVE_REVEAL → ROUND_ACTIONS

ROUND_ACTIONS
  └─ actors take turns in initiative order (ascending)
  └─ player turns: processPlayerAction() via POST /api/game/input
  └─ monster turns: auto-resolved by server (resolveMonsterTurn)
  └─ all actors acted → END_OF_ROUND

END_OF_ROUND
  └─ tick conditions (poison/wound damage)
  └─ decay elements (STRONG→WANING→INERT)
  └─ check win/loss → SCENARIO_END or loop back to CARD_SELECTION (round++)

SCENARIO_END
  └─ VICTORY or DEFEAT
  └─ rewards applied to players
```

## Key Patterns

**DeferredQueue** — never call effect handlers directly during attack resolution. Push a `DeferredAction` and flush at end of the action. This ensures retaliate, shield, and triggered effects resolve in the right order.

**Behavior + Executor** — all card and monster AI effects are `Behavior` objects (`src/common/types.ts`). `Executor.execute()` handles all of them uniformly. Adding a new effect = extend the `Behavior` interface and add a branch in `execute()`.

**HexGrid** — rebuilt from `scenario.spaces` after every move (spaces are the source of truth). Axial coordinates (`q`, `r`). LOS uses ray casting; pathfinding uses BFS.

## Data Format Notes

- Monster AI decks in `data/monsters/*.json` — each card has `top` and `bottom` behaviors matching the `Behavior` interface.
- Character files in `data/characters/*.json` (Gloomhaven) or `data/pokemon/characters/*.json` (Pokemon) — same schema: `id`, `name`, `hp[10]`, `cards[]`. `initiative` on each card is set by whichever top half is played.
- Scenario spaces use axial hex coords (`q`, `r`). `roomId` controls visibility (revealed rooms only). `playerStartSpaces` is a top-level array, not part of `IScenarioDef` — accessed via cast in `Game.ts`.
- `GameManager.CLASS_FILE_MAP` maps every `CardClass` enum value to its data file path (relative to `data/`). Add new characters here.
- `loadScenarioDef` routes to `data/pokemon/scenarios/` when `gameMode === POKEMON`, otherwise `data/scenarios/`.
