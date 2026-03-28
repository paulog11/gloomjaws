import { Router } from 'express';
import { createGame, getGame, persistGame } from '../GameManager.js';
export const gameRouter = Router();
// POST /api/game — create a new game session
gameRouter.post('/', (req, res) => {
    try {
        const payload = req.body;
        if (!payload.playerNames?.length || !payload.playerClasses?.length || !payload.scenarioId) {
            return res.status(400).json({ error: 'playerNames, playerClasses, and scenarioId required' });
        }
        if (payload.playerNames.length !== payload.playerClasses.length) {
            return res.status(400).json({ error: 'playerNames and playerClasses must have same length' });
        }
        const game = createGame(payload);
        return res.status(201).json(game.serialize());
    }
    catch (err) {
        console.error('createGame error:', err);
        return res.status(500).json({ error: err.message });
    }
});
// GET /api/game/:gameId — get current game state
gameRouter.get('/:gameId', (req, res) => {
    const game = getGame(req.params.gameId);
    if (!game)
        return res.status(404).json({ error: 'Game not found' });
    return res.json(game.serialize());
});
// POST /api/game/:gameId/start — start the scenario (deal hands)
gameRouter.post('/:gameId/start', (req, res) => {
    try {
        const game = getGame(req.params.gameId);
        if (!game)
            return res.status(404).json({ error: 'Game not found' });
        const playerHands = new Map();
        // For now start with empty hands; characters load their cards from data
        game.startScenario(playerHands);
        persistGame(game);
        return res.json(game.serialize());
    }
    catch (err) {
        console.error('startScenario error:', err);
        return res.status(500).json({ error: err.message });
    }
});
// POST /api/player-input — player submits an action
gameRouter.post('/input', (req, res) => {
    try {
        const payload = req.body;
        if (!payload.gameId || !payload.playerId || !payload.action) {
            return res.status(400).json({ error: 'gameId, playerId, and action required' });
        }
        const game = getGame(payload.gameId);
        if (!game)
            return res.status(404).json({ error: 'Game not found' });
        game.processPlayerAction(payload);
        persistGame(game);
        return res.json(game.serialize());
    }
    catch (err) {
        console.error('playerInput error:', err);
        return res.status(400).json({ error: err.message });
    }
});
