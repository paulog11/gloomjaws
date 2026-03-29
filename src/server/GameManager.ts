import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Game } from './Game.js'
import { saveGame, loadGame } from './db.js'
import {
  IMonsterDef,
  IScenarioDef,
  IAbilityCard,
  CreateGamePayload,
  CardClass,
} from '../common/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, 'data')

// In-memory game cache
const activeGames = new Map<string, Game>()

function loadMonsterDefs(): Map<string, IMonsterDef> {
  const defs = new Map<string, IMonsterDef>()
  const files = ['bandit-guard.json', 'bandit-archer.json']
  for (const file of files) {
    const def = JSON.parse(
      readFileSync(path.join(DATA_DIR, 'monsters', file), 'utf-8'),
    ) as IMonsterDef
    defs.set(def.name, def)
  }
  return defs
}

function loadScenarioDef(scenarioId: number): IScenarioDef {
  const file = `scenario-${String(scenarioId).padStart(2, '0')}.json`
  return JSON.parse(
    readFileSync(path.join(DATA_DIR, 'scenarios', file), 'utf-8'),
  ) as IScenarioDef
}

const CLASS_FILE_MAP: Record<CardClass, string> = {
  [CardClass.VALRATH_RED_GUARD]: 'red-guard.json',
  [CardClass.INOX_HATCHET]: 'hatchet.json',
  [CardClass.QUATRYL_DEMOLITIONIST]: 'demolitionist.json',
  [CardClass.AESTHER_VOIDWARDEN]: 'voidwarden.json',
}

function loadCharacterCards(cardClass: CardClass): IAbilityCard[] {
  const file = CLASS_FILE_MAP[cardClass]
  if (!file) return []
  const filePath = path.join(DATA_DIR, 'characters', file)
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))
    return data.cards as IAbilityCard[]
  } catch {
    return []
  }
}

export async function createGame(payload: CreateGamePayload): Promise<Game> {
  const scenarioDef = loadScenarioDef(payload.scenarioId)
  const monsterDefs = loadMonsterDefs()
  const game = new Game(scenarioDef, monsterDefs)

  // Add players and load their ability cards
  for (let i = 0; i < payload.playerNames.length; i++) {
    const playerId = `player-${i + 1}`
    const player = game.addPlayer(playerId, payload.playerNames[i], payload, i)
    const cards = loadCharacterCards(payload.playerClasses[i])
    player.hand = cards
  }

  activeGames.set(game.gameId, game)
  await saveGame(game.gameId, game.serialize())
  return game
}

export async function getGame(gameId: string): Promise<Game | null> {
  if (activeGames.has(gameId)) return activeGames.get(gameId)!

  // Try to restore from DB
  const state = await loadGame(gameId)
  if (!state) return null

  // Full restore from DB would require re-hydrating Game from serialized state
  // For now, return null (game must be active in memory)
  return null
}

export async function persistGame(game: Game): Promise<void> {
  await saveGame(game.gameId, game.serialize())
}
