# Gloomhaven: Jaws of the Lion — Web Port

Fan port of the board game. Non-commercial. Do not reproduce official artwork.

## Commands

```bash
npm install          # first time (requires Xcode CLI tools for better-sqlite3)
npm run dev          # start both servers concurrently (Vite :5173, Express :3000)
npm run dev:client   # Vite only
npm run dev:server   # Express only (tsx watch)
npm run build        # tsc + vite build → dist/
```

## Architecture

Full-stack: **stateful Express server + Vue 3 client**. All game logic runs on the server. The client only renders state and POSTs player decisions.

```
src/
├── common/          # Shared TS types used by both server and client
│   ├── Phase.ts     # Phase enum (LOBBY → CARD_SELECTION → INITIATIVE_REVEAL → ROUND_ACTIONS → END_OF_ROUND → SCENARIO_END → CAMPAIGN)
│   └── types.ts     # All interfaces: ISpace, IActorBase, IPlayerBase, IMonsterToken, Behavior, SerializedGame, all enums
│
├── server/
│   ├── index.ts         # Express entry point (port 3000)
│   ├── Game.ts          # Central game orchestrator — owns the phase state machine and round loop
│   ├── Player.ts        # Player state class
│   ├── Scenario.ts      # Active scenario — spaces, monster tokens, room reveal
│   ├── GameManager.ts   # In-memory game cache + DB persistence
│   ├── db.ts            # SQLite via better-sqlite3 (gloomjaws.db at project root)
│   ├── engine/
│   │   ├── DeferredQueue.ts   # Priority FIFO queue for cascading effects
│   │   ├── Executor.ts        # Validates + executes Behavior objects
│   │   ├── Conditions.ts      # Apply/remove/tick all 10 conditions
│   │   ├── ModifierDeck.ts    # Draw, rolling modifiers, bless/curse
│   │   ├── HexGrid.ts         # Axial coords, A* pathfinding, LOS
│   │   └── MonsterAI.ts       # Focus algorithm + full turn resolution
│   ├── data/
│   │   ├── monsters/          # One JSON per monster type (stats × 3 levels, AI deck)
│   │   ├── scenarios/         # Scenario layout, spawns, objectives
│   │   └── characters/        # Ability cards per class
│   └── routes/
│       └── game.ts            # POST /api/game, GET /api/game/:id, POST /api/game/input, POST /api/game/:id/start
│
└── client/
    ├── main.ts              # Vue app entry
    ├── env.d.ts             # Vite + .vue type declarations
    ├── stores/
    │   ├── game.ts          # Pinia store — all API calls, SerializedGame state
    │   └── ui.ts            # Ephemeral UI state (selected card, hover, log panel)
    └── components/
        ├── App.vue          # Root: TitleScreen or GameScreen based on store state
        ├── TitleScreen.vue  # Game setup form
        ├── GameScreen.vue   # Main layout (left panel / board / right panel / card hand)
        ├── GameHeader.vue   # Phase label, round, elements, log toggle
        ├── PlayerPanel.vue  # HP bar, XP, gold, conditions per player
        ├── MonsterPanel.vue # HP bars, initiative, conditions per monster group
        ├── ElementToken.vue # Single element with INERT/WANING/STRONG styling
        ├── GameLog.vue      # Scrollable event log sidebar
        ├── board/
        │   ├── HexBoard.vue # SVG viewport, space filtering by revealed rooms
        │   └── HexCell.vue  # Single hex: terrain, occupant token, loot/trap icons
        ├── cards/
        │   ├── CardHand.vue       # Player's hand of ability cards
        │   ├── AbilityCard.vue    # Card with top/bottom halves, initiative
        │   └── BehaviorDisplay.vue # Renders a Behavior object as icons + numbers
        └── overlays/
            ├── InitiativeRevealOverlay.vue  # Shows turn order at round start
            ├── EndOfRoundOverlay.vue        # Brief flash between rounds
            └── ScenarioEndOverlay.vue       # Victory/Defeat + rewards

```

## API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/game` | Create game (`CreateGamePayload`) → returns `SerializedGame` |
| GET | `/api/game/:gameId` | Get current state → `SerializedGame` |
| POST | `/api/game/:gameId/start` | Begin scenario, spawn monsters |
| POST | `/api/game/input` | Player action (`PlayerInputPayload`) → `SerializedGame` |

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

**SerializedGame** — the full snapshot sent to the client after every state change. Never send partial updates. The Pinia store replaces its entire `gameState` ref each time.

**HexGrid** — rebuilt from `scenario.spaces` after every move (spaces are the source of truth). Axial coordinates (`q`, `r`). LOS uses ray casting; pathfinding uses BFS.

## Data Format Notes

- Monster AI decks live in `src/server/data/monsters/*.json` — each card has `top` and `bottom` behaviors matching the `Behavior` interface.
- Scenario spaces use axial hex coords (`q`, `r`). Room IDs control which spaces are visible (revealed rooms only).
- Character ability cards in `src/server/data/characters/*.json` — `initiative` is set by whichever card's top half is played.

## Build Notes

- `better-sqlite3` requires native compilation — needs Xcode command line tools on macOS.
- `tsc` is used for type checking only during `npm run build`; the server runs via `tsx watch` in dev (no emit).
- The Vite proxy forwards `/api/*` from `:5173` to `:3000` — no CORS config needed in dev.

## Phase Roadmap

- **Phase 1** (complete): Combat engine — card selection, initiative, modifier decks, monster AI, conditions, elements, win/loss detection
- **Phase 2** (next): Hex map — SVG board already scaffolded, needs LOS visualisation, movement range highlight, door crossing
- **Phase 3**: Full monster AI validation against rulebook edge cases (p.27 focus tiebreakers)
- **Phase 4**: Campaign layer — scenario unlock tree, character persistence, shop
