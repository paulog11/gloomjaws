import initSqlJs, { type Database } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../../gloomjaws.db')

let db: Database

export async function getDb(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs()
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
    }
    db.run('PRAGMA journal_mode = WAL')
    db.run('PRAGMA foreign_keys = ON')
    initSchema(db)
    persistToFile()
  }
  return db
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      game_id    TEXT PRIMARY KEY,
      state      TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      campaign_id TEXT PRIMARY KEY,
      state       TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
}

function persistToFile(): void {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

export async function saveGame(gameId: string, state: object): Promise<void> {
  const db = await getDb()
  db.run(
    `INSERT INTO games (game_id, state, updated_at)
     VALUES (?, ?, unixepoch())
     ON CONFLICT(game_id) DO UPDATE SET state = excluded.state, updated_at = unixepoch()`,
    [gameId, JSON.stringify(state)],
  )
  persistToFile()
}

export async function loadGame(gameId: string): Promise<object | null> {
  const db = await getDb()
  const result = db.exec('SELECT state FROM games WHERE game_id = ?', [gameId])
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  return JSON.parse(result[0].values[0][0] as string)
}

export async function deleteGame(gameId: string): Promise<void> {
  const db = await getDb()
  db.run('DELETE FROM games WHERE game_id = ?', [gameId])
  persistToFile()
}
