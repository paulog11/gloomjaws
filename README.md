# Gloomhaven: Jaws of the Lion — Web Port

An unofficial fan port of the board game [Gloomhaven: Jaws of the Lion](https://cephalofair.com/collections/board-games/products/gloomhaven-jaws-of-the-lion) by Cephalofair Games. Non-commercial. No official artwork is reproduced.

---

## Prerequisites

- **Node.js** v20 or higher
- **macOS**: Xcode Command Line Tools (`xcode-select --install`) — required for `better-sqlite3` native compilation
- **npm** v10 or higher

---

## Installation

```bash
# from the project root
npm install
```

If `better-sqlite3` fails to compile, ensure Xcode CLI tools are installed, then retry:

```bash
xcode-select --install
npm install
```

---

## Running the App

### Development (recommended)

Starts both the Express server and the Vite dev server concurrently:

```bash
npm run dev
```

| Server | URL | Purpose |
|--------|-----|---------|
| Vite (client) | http://localhost:5173 | Vue 3 frontend with hot reload |
| Express (server) | http://localhost:3000 | Game API + SQLite persistence |

The Vite dev server proxies all `/api/*` requests to `:3000` automatically — no CORS configuration needed.

### Run servers individually

```bash
npm run dev:client   # Vite only (frontend)
npm run dev:server   # Express only (backend, with file watching via tsx)
```

### Production build

```bash
npm run build        # type-check (tsc) + bundle client (vite) → dist/
npm run preview      # preview the production build locally
```

The production build outputs static client files to `dist/`. For a full production deployment you would serve `dist/` as static files from the Express server (not yet wired up — see Phase 4 roadmap in CLAUDE.md).

---

## Server Setup Details

The Express server (`src/server/index.ts`) runs on port `3000` by default. Override with:

```bash
PORT=8080 npm run dev:server
```

**Database:** A SQLite file (`gloomjaws.db`) is created automatically in the project root on first run. No setup required. The schema is initialized in `src/server/db.ts`.

**Game data:** All monster stats, scenario maps, and character ability cards are JSON files in `src/server/data/`. These are read from disk at game creation time — no database import step needed.

---

## Client Setup Details

The Vue 3 client (`src/client/main.ts`) is a single-page app with no routing. The entire game fits in one screen tree:

```
App.vue
├── TitleScreen.vue   (shown when no active game)
└── GameScreen.vue    (shown once a game is created)
```

All client-side state lives in two Pinia stores:

- `src/client/stores/game.ts` — the full `SerializedGame` snapshot from the server + all API call methods
- `src/client/stores/ui.ts` — ephemeral UI state (selected card, hovered hex, log panel visibility)

The client never computes game outcomes. It renders what the server returns and POSTs player decisions.

---

## Project Structure

```
gloomjaws/
├── src/
│   ├── common/      # Shared TypeScript types (used by both client and server)
│   ├── server/      # Express app, game engine, data
│   └── client/      # Vue 3 app, Pinia stores, components
├── dist/            # Production build output (gitignored)
├── gloomjaws.db     # SQLite database (gitignored, auto-created)
├── CLAUDE.md        # Developer reference (file map, API, patterns, roadmap)
├── project.md       # Architecture and game state deep-dive
├── package.json
├── tsconfig.json
└── vite.config.ts
```

For a full architectural walkthrough, see [project.md](project.md).
For the file map, API reference, and roadmap, see [CLAUDE.md](CLAUDE.md).
