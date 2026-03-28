import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ScenarioResult } from '../../common/types';
const API = '/api/game';
export const useGameStore = defineStore('game', () => {
    // ─── State ───────────────────────────────────────────────────────────────
    const gameState = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const localPlayerId = ref(null); // this browser's player id
    // ─── Computed ─────────────────────────────────────────────────────────────
    const phase = computed(() => gameState.value?.phase);
    const round = computed(() => gameState.value?.round ?? 0);
    const myPlayer = computed(() => gameState.value?.players.find(p => p.playerId === localPlayerId.value));
    const isMyTurn = computed(() => gameState.value?.activeActorId === myPlayer.value?.id);
    const isWaitingForMe = computed(() => localPlayerId.value != null &&
        gameState.value?.waitingForPlayerIds.includes(localPlayerId.value));
    const activeActor = computed(() => {
        const id = gameState.value?.activeActorId;
        if (!id)
            return null;
        const player = gameState.value?.players.find(p => p.id === id);
        if (player)
            return { ...player, actorType: 'player' };
        const monster = gameState.value?.monsters.find(m => m.id === id);
        if (monster)
            return { ...monster, actorType: 'monster' };
        return null;
    });
    const spaceMap = computed(() => {
        const map = new Map();
        for (const space of gameState.value?.spaces ?? []) {
            map.set(space.id, space);
        }
        return map;
    });
    const isVictory = computed(() => gameState.value?.scenarioResult === ScenarioResult.VICTORY);
    const isDefeat = computed(() => gameState.value?.scenarioResult === ScenarioResult.DEFEAT);
    // ─── Actions ──────────────────────────────────────────────────────────────
    async function createGame(payload, myIndex) {
        await apiCall(async () => {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const state = await handleResponse(res);
            gameState.value = state;
            localPlayerId.value = `player-${myIndex + 1}`;
        });
    }
    async function loadGame(gameId) {
        await apiCall(async () => {
            const res = await fetch(`${API}/${gameId}`);
            gameState.value = await handleResponse(res);
        });
    }
    async function startScenario() {
        if (!gameState.value)
            return;
        await apiCall(async () => {
            const res = await fetch(`${API}/${gameState.value.gameId}/start`, { method: 'POST' });
            gameState.value = await handleResponse(res);
        });
    }
    async function sendAction(action, data) {
        if (!gameState.value || !localPlayerId.value)
            return;
        const payload = {
            gameId: gameState.value.gameId,
            playerId: localPlayerId.value,
            action,
            data,
        };
        await apiCall(async () => {
            const res = await fetch(`${API}/input`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            gameState.value = await handleResponse(res);
        });
    }
    async function selectCards(topCardId, bottomCardId) {
        await sendAction('SELECT_CARDS', { topCardId, bottomCardId });
    }
    async function moveToSpace(spaceId) {
        await sendAction('MOVE', { spaceId });
    }
    async function attackTarget(cardId, useTop, targetId) {
        await sendAction('ATTACK', { cardId, useTop, targetId });
    }
    async function endTurn() {
        await sendAction('END_TURN');
    }
    // ─── Helpers ──────────────────────────────────────────────────────────────
    async function apiCall(fn) {
        loading.value = true;
        error.value = null;
        try {
            await fn();
        }
        catch (e) {
            error.value = e.message;
        }
        finally {
            loading.value = false;
        }
    }
    async function handleResponse(res) {
        const body = await res.json();
        if (!res.ok)
            throw new Error(body.error ?? `HTTP ${res.status}`);
        return body;
    }
    return {
        gameState,
        loading,
        error,
        localPlayerId,
        phase,
        round,
        myPlayer,
        isMyTurn,
        isWaitingForMe,
        activeActor,
        spaceMap,
        isVictory,
        isDefeat,
        createGame,
        loadGame,
        startScenario,
        sendAction,
        selectCards,
        moveToSpace,
        attackTarget,
        endTurn,
    };
});
