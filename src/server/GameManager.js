import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Game } from './Game.js';
import { saveGame, loadGame } from './db.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, 'data');
// In-memory game cache
const activeGames = new Map();
function loadMonsterDefs() {
    const defs = new Map();
    const files = ['bandit-guard.json', 'bandit-archer.json'];
    for (const file of files) {
        const def = JSON.parse(readFileSync(path.join(DATA_DIR, 'monsters', file), 'utf-8'));
        defs.set(def.name, def);
    }
    return defs;
}
function loadScenarioDef(scenarioId) {
    const file = `scenario-${String(scenarioId).padStart(2, '0')}.json`;
    return JSON.parse(readFileSync(path.join(DATA_DIR, 'scenarios', file), 'utf-8'));
}
export function createGame(payload) {
    const scenarioDef = loadScenarioDef(payload.scenarioId);
    const monsterDefs = loadMonsterDefs();
    const game = new Game(scenarioDef, monsterDefs);
    // Add players
    for (let i = 0; i < payload.playerNames.length; i++) {
        const playerId = `player-${i + 1}`;
        game.addPlayer(playerId, payload.playerNames[i], payload, i);
    }
    activeGames.set(game.gameId, game);
    saveGame(game.gameId, game.serialize());
    return game;
}
export function getGame(gameId) {
    if (activeGames.has(gameId))
        return activeGames.get(gameId);
    // Try to restore from DB
    const state = loadGame(gameId);
    if (!state)
        return null;
    // Full restore from DB would require re-hydrating Game from serialized state
    // For now, return null (game must be active in memory)
    return null;
}
export function persistGame(game) {
    saveGame(game.gameId, game.serialize());
}
