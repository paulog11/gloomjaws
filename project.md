# Project Deep-Dive

This document is written for a developer who wants to understand how the project works — both the game logic and the software that powers it.

---

## Part 1: How Game State Works

### The Big Picture

Every action a player takes follows this path:

```
Player clicks something in the browser
  → Pinia store POSTs to Express
    → Game.ts validates and mutates state
      → Game.ts serializes the entire game to JSON
        → Express returns JSON to the browser
          → Pinia store replaces its state ref
            → Vue re-renders
```

The server is the only place where game logic runs. The client's job is purely to display state and collect input.

---

### SerializedGame: The Contract Between Client and Server

Every API response — whether you create a game, load one, or submit an action — returns the same shape: a `SerializedGame` object (defined in `src/common/types.ts`). It is a complete snapshot of everything:

```
SerializedGame
├── gameId, phase, round, scenarioId, scenarioLevel, scenarioResult
├── spaces[]           ← every hex cell on the board
│   └── { id, coord, terrain, occupantId, loot, trap, doorOpen, roomId }
├── revealedRooms[]    ← which rooms are currently visible to players
├── players[]          ← full state of every player character
│   └── { name, cardClass, hp, maxHp, xp, gold, hand[], conditions[], initiative, ... }
├── monsters[]         ← every live monster token on the board
│   └── { monsterId, isElite, number, hp, maxHp, conditions[], spaceId, initiative, ... }
├── elements{}         ← FIRE/ICE/AIR/EARTH/LIGHT/DARK, each INERT/WANING/STRONG
├── initiativeOrder[]  ← actor IDs in turn order for this round (ascending initiative)
├── activeActorId      ← whose turn it is right now (null between rounds)
├── waitingForPlayerIds[] ← who still needs to submit card selection
└── log[]              ← last 100 event messages
```

The Pinia store (`src/client/stores/game.ts`) holds one `ref<SerializedGame | null>`. Every API call replaces it in full. Vue's reactivity propagates the change to every component that reads from it. There are no partial updates, no WebSockets, no optimistic UI — every round-trip gives the client a fresh authoritative snapshot.

---

### The Phase State Machine

The game moves through distinct phases. The `phase` field in `SerializedGame` tells the client what to display. On the server, `Game.ts` transitions between phases by calling private methods that mutate state and set the new phase value.

```
LOBBY
  Players join, characters are selected.
  Transition: startScenario() → CARD_SELECTION

CARD_SELECTION
  Each player secretly picks 2 ability cards from their hand.
  The server tracks who has submitted in waitingForPlayerIds[].
  Transition: last player submits → AI cards drawn for all monster groups
                                  → initiative order built
                                  → INITIATIVE_REVEAL → ROUND_ACTIONS

ROUND_ACTIONS
  Actors take turns in ascending initiative order.
  Player turns: server waits for a POST /api/game/input.
  Monster turns: server auto-resolves and advances to the next actor.
  Transition: last actor ends turn → END_OF_ROUND

END_OF_ROUND
  Server applies end-of-round bookkeeping in sequence:
    1. Tick conditions (poison/wound deal 1 damage, others expire)
    2. Decay elements (STRONG → WANING → INERT)
    3. Check win/loss condition
  Transition: scenario complete → SCENARIO_END
              otherwise → CARD_SELECTION (round++)

SCENARIO_END
  VICTORY or DEFEAT. Rewards applied.
  Campaign layer will handle unlocks here (Phase 4).
```

---

### What Happens When a Player Acts

Here's what happens from the moment a player clicks "Attack" to the moment their screen updates.

**1. The client POSTs an action**

The Pinia store's `sendAction()` method builds a `PlayerInputPayload` and POSTs it to `/api/game/input`:

```
{
  gameId:   "abc-123",
  playerId: "player-1",
  action:   "ATTACK",
  data:     { cardId: "drifter-03", useTop: true, targetId: "monster-token-id" }
}
```

**2. Game.ts routes the action**

`processPlayerAction()` in `Game.ts` checks it's actually that player's turn, then dispatches to the appropriate handler — `playerAttack()`, `moveActor()`, `playerLongRest()`, etc.

**3. playerAttack() builds an ExecutionContext**

The `ExecutionContext` is a bag of callbacks that the engine layer needs but shouldn't be directly coupled to:

```typescript
ExecutionContext {
  source, targets,        // the attacker and their target(s)
  grid,                   // the HexGrid for positional checks
  elements,               // the element state (to consume/produce)
  getModifierDeck(),      // returns the attacker's modifier deck
  onDamage(target, amt),  // called when damage is dealt
  onHeal(target, amt),    // called when healing occurs
  onDeath(actor),         // called when HP hits 0
  onLoot(actor, spaceId), // called when looting
  addLog(actorId, msg),   // called to append to the game log
}
```

The callbacks defined here are closures over `Game.ts`'s private state — so the engine layer (`Executor`) stays pure and testable without needing to know about the full `Game` class.

**4. Executor runs the Behavior**

`Executor.execute()` in `src/server/engine/Executor.ts` reads the card half's `Behavior` object and applies each field in sequence:

```
Behavior {
  attack: { value: 4, range: 0, target: SINGLE }
}
```

For an attack, it:
1. Draws modifier cards from the attacker's modifier deck
2. Resolves the final damage value (or MISS)
3. Calculates effective damage after shield
4. Calls `ctx.onDamage(target, damage)`
5. Applies any on-hit conditions (e.g. Poison, Immobilize)
6. Calls `ctx.addLog(...)` to record the event

**5. The DeferredQueue handles cascading effects**

Some effects can't run immediately — if a kill triggers a monster's retaliate, or if a player's attack sets off a trap, running those inline would produce incorrect ordering. Instead, anything that could cascade is pushed onto the `DeferredQueue` as a `DeferredAction`:

```typescript
queue.push({
  priority: DeferredPriority.NORMAL,
  description: "Bandit Guard retaliate on Player 1",
  execute: () => { /* apply retaliate damage */ }
})
```

After every action, `Game.ts` calls `flushDeferredQueue()`, which pops and executes actions in priority order until the queue is empty.

**6. State is serialized and returned**

`game.serialize()` assembles a fresh `SerializedGame` from all live state, and the Express route returns it as JSON. The client's Pinia store replaces `gameState.value` and Vue re-renders.

---

### Monster Turns (fully automatic)

After a player ends their turn, `autoResolveMonsterTurn()` loops through the remaining actors in initiative order. For each monster it finds, it runs the full GJotL monster AI rules:

**Focus** (`MonsterAI.determineFocus`):
Finds which enemy the monster would target. Rules: the enemy that requires the fewest moves to reach a valid attack position. Tiebreakers: lowest initiative, then physically closest. Invisible players are skipped.

**Move** (`resolveMonsterTurn`):
BFS pathfinding (`HexGrid.findPath`) toward the attack position. The monster moves up to its `move` stat value along that path. For melee monsters, they stop one hex away from the focus; ranged monsters stop as soon as they have line of sight within range.

**Attack**:
An attack is pushed onto the `DeferredQueue`. This ensures monster attacks resolve through the same `Executor` path as player attacks (modifier deck draw, condition application, etc.).

The loop keeps going until a player's actor ID appears next in `initiativeOrder`, at which point `activeActorId` is set to that player's ID and the server returns the serialized state — waiting for the next POST.

---

### Elements

Elements (Fire, Ice, Air, Earth, Light, Dark) have three strengths: `INERT`, `WANING`, `STRONG`. They are produced by certain ability cards and monster AI cards. They are consumed to enhance attacks.

- **Production**: Calling `produceElement` in a `Behavior` sets that element to `STRONG` immediately.
- **Consumption**: `Executor` checks the element is not `INERT` before consuming it, then sets it to `INERT`.
- **Decay**: At end of every round, `STRONG` becomes `WANING` and `WANING` becomes `INERT`.

The `elements` object is part of `SerializedGame` and renders in the `GameHeader` as `ElementToken` components.

---

### Attack Modifier Decks

Every player has their own shuffled modifier deck (built in `Player.ts` via `buildBaseModifierDeck()`). Every monster group shares one deck.

When an attack resolves, `ModifierDeck.drawModifier()` draws cards until it hits a non-rolling card. Rolling modifier cards chain — each one adds its value and draws another. The final chain is passed to `resolveModifiers()` which computes the net attack value, or returns `null` for a MISS.

Cards marked `shuffle: true` (×2 and MISS in the base deck) trigger a reshuffle of the discard back into the deck after drawing. Bless and Curse cards are inserted into the deck by game events and removed after being drawn.

---

## Part 2: Software Architecture

### Layer Overview

```
┌──────────────────────────────────────────┐
│  Browser (Vue 3 + Pinia)                 │
│  Renders SerializedGame. POSTs actions.  │
└───────────────────┬──────────────────────┘
                    │ HTTP (JSON)
                    │ POST /api/game/input
                    │ GET  /api/game/:id
                    │ ← SerializedGame
┌───────────────────▼──────────────────────┐
│  Express Server (Node + TypeScript)      │
│                                          │
│  routes/game.ts                          │
│    └─ GameManager  (in-memory cache      │
│         └─ Game        + DB persist)     │
│              ├─ Player                   │
│              ├─ Scenario                 │
│              └─ engine/                  │
│                   ├─ Executor            │
│                   ├─ DeferredQueue       │
│                   ├─ MonsterAI           │
│                   ├─ HexGrid             │
│                   ├─ Conditions          │
│                   └─ ModifierDeck        │
│                                          │
│  db.ts (better-sqlite3 / gloomjaws.db)  │
└──────────────────────────────────────────┘
```

---

### Common Layer (`src/common/`)

Shared TypeScript that both the server and client import. Nothing here has side effects — it's pure type definitions and enums.

- **`Phase.ts`** — the `Phase` enum. Every phase transition on the server and every display branch on the client references this.
- **`types.ts`** — every interface and enum in the game: `ISpace`, `IActorBase`, `IPlayerBase`, `IMonsterToken`, `Behavior`, `SerializedGame`, `PlayerInputPayload`, `CreateGamePayload`, and all the smaller enums (`ConditionType`, `Element`, `TerrainType`, etc.).

When you add a new mechanic, the first place to touch is usually `types.ts` — extend `Behavior` with a new field, add a new enum value, etc.

---

### Server Layer (`src/server/`)

#### Entry Point: `index.ts`

Creates the Express app, mounts the game router at `/api/game`, and starts the server. Minimal — all logic lives elsewhere.

#### Route Handler: `routes/game.ts`

Four endpoints. Each one:
1. Validates the request body
2. Calls into `GameManager`
3. Returns `game.serialize()` or an error

The route layer is intentionally thin. It should not contain game logic.

#### Game Cache: `GameManager.ts`

Maintains an in-memory `Map<gameId, Game>` so every request doesn't need to deserialize from SQLite. On `createGame()`, it constructs a `Game`, adds it to the map, and persists the initial state to the DB. On `persistGame()`, it saves the current serialized state. Game restoration from DB (re-hydrating a `Game` object from JSON) is not yet implemented — games must be active in memory.

#### Orchestrator: `Game.ts`

The most important file on the server. It owns:
- The `Phase` state machine and all transition methods
- References to all `Player` instances and the `Scenario`
- The `DeferredQueue`
- The element state
- The initiative order and active actor

Most of the game "flow" logic is here. If you're tracing what happens during a round, start here.

Key methods to know:
- `startScenario()` — spawns monsters, places players, moves to `CARD_SELECTION`
- `processCardSelection()` — records a player's card picks; transitions when all submitted
- `transitionToInitiativeReveal()` — draws AI cards for all monster groups, builds initiative order
- `processPlayerAction()` — dispatches to the right handler based on `ActionType`
- `autoResolveMonsterTurn()` — loops through and resolves all consecutive monster turns
- `transitionToEndOfRound()` — ticks conditions, decays elements, checks win/loss
- `serialize()` — assembles the `SerializedGame` snapshot

#### Player: `Player.ts`

A class that implements `IPlayerBase`. Holds the player's hand, modifier deck, HP, XP, gold, and conditions. Notable methods: `selectCards()`, `takeDamage()`, `heal()`, `endOfRound()`, `serialize()`.

#### Scenario: `Scenario.ts`

Holds the live board state: all `ISpace` objects, which rooms are revealed, and all active `IMonsterToken`s. Key responsibilities: `spawnMonsters()`, `revealRoom()`, `drawAICardForGroup()`, `removeMonster()`.

---

### Engine Layer (`src/server/engine/`)

Pure functions and classes. No dependency on `Game.ts` or `Player.ts`. Easily testable in isolation.

#### `Executor.ts`

The heart of effect resolution. `canExecute(behavior, ctx)` checks prerequisites. `execute(behavior, ctx)` applies each field of a `Behavior` object. Both player ability cards and monster AI cards run through here — they're all just `Behavior` objects.

#### `DeferredQueue.ts`

A priority-sorted FIFO queue. `DeferredAction` objects have a `priority` (`IMMEDIATE`, `NORMAL`, `DELAYED`) and an `execute()` callback. The queue is flushed by `Game.ts` after every player action and after every monster turn. This is how retaliate, shield absorption, and triggered effects sequence correctly without nesting calls.

#### `MonsterAI.ts`

Two key exports:
- `determineFocus(monster, players, grid, attackRange)` — implements the GJotL focus algorithm
- `resolveMonsterTurn(...)` — runs move + attack, queuing the attack as a deferred action

#### `HexGrid.ts`

Wraps a `Map<coordKey, ISpace>` and exposes: `isPassable()`, `neighbors()`, `findPath()` (BFS), `pathDistance()` (BFS ignoring occupants), `hasLineOfSight()` (ray casting). Rebuilt from `scenario.spaces` after every move.

#### `Conditions.ts`

Stateless functions over `IActorBase`: `applyCondition()`, `removeCondition()`, `hasCondition()`, `tickConditions()` (end-of-round), `isStunned()`, `isImmobilized()`, `isDisarmed()`, `getAttackModifierFromConditions()`.

#### `ModifierDeck.ts`

`buildBaseModifierDeck()` creates the standard 20-card deck. `drawModifier(deck, discard)` handles rolling modifiers and reshuffles. `resolveModifiers(cards, baseAttack)` computes the final value (or `null` for MISS).

---

### Data Layer (`src/server/data/`)

Plain JSON files. Loaded once at game creation time by `GameManager.ts`.

- **`monsters/*.json`** — one file per monster type. Contains stats for each scenario level (1–3) in both Normal and Elite variants, plus the full AI deck.
- **`scenarios/*.json`** — one file per scenario. Contains all hex spaces (with axial coordinates and terrain), monster spawn positions per room, and the win condition.
- **`characters/*.json`** — one file per character class. Contains HP per level and all ability cards with their `Behavior` objects for top and bottom halves.

When adding a new monster or scenario, only a JSON file is needed — no code changes.

---

### Client Layer (`src/client/`)

#### Entry: `main.ts`

Creates the Vue app, installs Pinia, mounts `App.vue`. Four lines.

#### Stores

**`stores/game.ts`** — the single source of truth on the client. Contains `gameState: ref<SerializedGame | null>` and all the methods that call the API (`createGame`, `startScenario`, `sendAction`, `moveToSpace`, `attackTarget`, `endTurn`, etc.). Computed properties derive player-specific views: `myPlayer`, `isMyTurn`, `isWaitingForMe`, `spaceMap`, `isVictory`.

**`stores/ui.ts`** — purely ephemeral state that has nothing to do with game rules: which card is selected, which hex is hovered, whether the log panel is open. Kept separate so game state can be replaced without wiping UI state.

#### Component Tree

```
App.vue
├── TitleScreen.vue            (no active game)
│   └── [form] → createGame() + startScenario()
│
└── GameScreen.vue             (active game)
    ├── GameHeader.vue
    │   └── ElementToken.vue × 6
    ├── [left panel]
    │   └── PlayerPanel.vue × N
    ├── [board area]
    │   └── board/HexBoard.vue
    │       └── board/HexCell.vue × M  (one per revealed space)
    ├── [right panel]
    │   └── MonsterPanel.vue × groups
    ├── [footer]
    │   └── cards/CardHand.vue
    │       └── cards/AbilityCard.vue × hand size
    │           └── cards/BehaviorDisplay.vue × 2 (top + bottom)
    ├── overlays/InitiativeRevealOverlay.vue  (phase == INITIATIVE_REVEAL)
    ├── overlays/EndOfRoundOverlay.vue        (phase == END_OF_ROUND)
    ├── overlays/ScenarioEndOverlay.vue       (phase == SCENARIO_END)
    └── GameLog.vue                           (ui.showLog == true)
```

Components read from the Pinia stores and emit user actions. They contain no game logic — no damage calculations, no rule checks. If a component needs to do something, it calls a store method.

#### HexBoard / HexCell

The board is an SVG element. `HexBoard.vue` computes a `viewBox` that fits all currently revealed spaces, then renders one `HexCell` group per space. Axial coordinates are converted to pixel centers using flat-top hex math. Each cell renders its terrain color, an occupant token (player or monster), and icons for loot or traps. Clicking a passable space calls `store.moveToSpace(spaceId)`.

---

### Data Flow Summary

```
User clicks "Attack target"
  │
  ▼
AbilityCard.vue emits 'play-top'
  │
  ▼
CardHand.vue calls store.attackTarget(cardId, true, targetId)
  │
  ▼
stores/game.ts: sendAction('ATTACK', { cardId, useTop: true, targetId })
  │  POST /api/game/input
  ▼
routes/game.ts: game.processPlayerAction(payload)
  │
  ▼
Game.ts: playerAttack(player, cardId, useTop, targetId)
  │  builds ExecutionContext
  ▼
Executor.ts: execute(behavior, ctx)
  │  drawModifier → resolveModifiers → ctx.onDamage
  ▼
Game.ts: applyDamage(target, amount)
  │  target.hp -= amount
  │  if hp == 0: handleDeath → removeMonster / mark exhausted
  │  checkScenarioEnd
  ▼
Game.ts: flushDeferredQueue()
  │  (any triggered effects run here)
  ▼
Game.ts: serialize() → SerializedGame JSON
  │
  ▼
Express: res.json(state)
  │
  ▼
stores/game.ts: gameState.value = state
  │
  ▼
Vue reactivity: all components re-render
```