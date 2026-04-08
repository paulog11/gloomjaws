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
├── common/     # Shared TS types (Phase.ts, types.ts) — used by both server and client
├── server/     # Express app, game engine, data files → see src/server/CLAUDE.md
└── client/     # Vue 3 app, Pinia stores, components → see src/client/CLAUDE.md
```

**`src/common/types.ts`** is the contract between server and client. Key types: `SerializedGame`, `CreateGamePayload`, `PlayerInputPayload`, `Behavior`, all enums (`CardClass`, `GameMode`, `Phase`, etc.).

## Game Modes

| Mode | `gameMode` value | Data directory |
|------|-----------------|----------------|
| Gloomhaven: Jaws of the Lion | `GLOOMHAVEN` | `src/server/data/` |
| Pokemon Journeys | `POKEMON` | `src/server/data/pokemon/` |

Both modes share the same server engine, phase state machine, and client components. Mode is set at game creation and stored in `SerializedGame.gameMode`.

## Phase Roadmap

- **Phase 1** (complete): Combat engine — card selection, initiative, modifier decks, monster AI, conditions, elements, win/loss detection
- **Phase 2** (next): Hex map — SVG board already scaffolded, needs LOS visualisation, movement range highlight, door crossing
- **Phase 3**: Full monster AI validation against rulebook edge cases (p.27 focus tiebreakers)
- **Phase 4**: Campaign layer — scenario unlock tree, character persistence, shop
