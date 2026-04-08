# Client

Vue 3 + Pinia + TypeScript. Renders server state and POSTs player decisions. No game logic here — the server is the source of truth.

Runs on port **5173** via Vite in dev. The Vite proxy forwards `/api/*` to `:3000` — no CORS config needed.

## File Map

```
client/
├── main.ts              # Vue app entry
├── env.d.ts             # Vite + .vue type declarations
├── stores/
│   ├── game.ts          # Pinia store — all API calls, SerializedGame state
│   └── ui.ts            # Ephemeral UI state (selected card, hover, log panel)
└── components/
    ├── App.vue                    # Root: mode routing (ModeSelectScreen → TitleScreen/PokemonTitleScreen → GameScreen)
    ├── ModeSelectScreen.vue       # Home screen — choose Gloomhaven or Pokemon Journeys
    ├── TitleScreen.vue            # Gloomhaven setup form (players, classes, scenario)
    ├── PokemonTitleScreen.vue     # Pokemon setup form (trainer name + starter picker)
    ├── GameScreen.vue             # Main layout (left panel / board / right panel / card hand)
    ├── GameHeader.vue             # Phase label, round, elements, log toggle
    ├── PlayerPanel.vue            # HP bar, XP, gold, conditions per player
    ├── MonsterPanel.vue           # HP bars, initiative, conditions per monster group
    ├── ElementToken.vue           # Single element with INERT/WANING/STRONG styling
    ├── GameLog.vue                # Scrollable event log sidebar
    ├── board/
    │   ├── HexBoard.vue           # SVG viewport, space filtering by revealed rooms
    │   └── HexCell.vue            # Single hex: terrain, occupant token, loot/trap icons
    ├── cards/
    │   ├── CardHand.vue           # Player's hand of ability cards
    │   ├── AbilityCard.vue        # Card with top/bottom halves, initiative
    │   └── BehaviorDisplay.vue    # Renders a Behavior object as icons + numbers
    └── overlays/
        ├── InitiativeRevealOverlay.vue  # Shows turn order at round start
        ├── EndOfRoundOverlay.vue        # Brief flash between rounds
        └── ScenarioEndOverlay.vue       # Victory/Defeat + rewards
```

## Routing Logic (App.vue)

```
gameState === null && selectedMode === null       → ModeSelectScreen
gameState === null && selectedMode === GLOOMHAVEN → TitleScreen
gameState === null && selectedMode === POKEMON    → PokemonTitleScreen
gameState !== null                                → GameScreen
```

`selectedMode` is a local `ref<GameMode | null>` in `App.vue`. Both title screens emit `back` to reset it.

## Store Patterns

**game.ts** — the only file that talks to the API.
- `gameState: SerializedGame | null` — replaced wholesale after every server response (never partial updates).
- `createGame(payload, myIndex)` — POSTs to `/api/game`, sets `localPlayerId` to `player-${myIndex + 1}`.
- `startScenario()` — POSTs to `/api/game/:id/start`.
- `sendAction(action, data)` — POSTs to `/api/game/input`. Convenience wrappers: `selectCards()`, `moveToSpace()`, `attackTarget()`, `endTurn()`.

**ui.ts** — ephemeral, never persisted. Holds things like selected card index, hover state, log panel open/closed.

## Key Constraint

`SerializedGame` is the full snapshot. The store replaces `gameState` entirely on each response — never mutate it locally. If you need derived state, compute it from `gameState` in a `computed()`.
