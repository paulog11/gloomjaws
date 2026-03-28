import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../../gloomjaws.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      game_id   TEXT PRIMARY KEY,
      state     TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      campaign_id TEXT PRIMARY KEY,
      state       TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `)
}

export function saveGame(gameId: string, state: object): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO games (game_id, state, updated_at)
    VALUES (?, ?, unixepoch())
    ON CONFLICT(game_id) DO UPDATE SET state = excluded.state, updated_at = unixepoch()
  `).run(gameId, JSON.stringify(state))
}

export function loadGame(gameId: string): object | null {
  const db = getDb()
  const row = db.prepare('SELECT state FROM games WHERE game_id = ?').get(gameId) as
    | { state: string }
    | undefined
  return row ? JSON.parse(row.state) : null
}

export function deleteGame(gameId: string): void {
  getDb().prepare('DELETE FROM games WHERE game_id = ?').run(gameId)
}
