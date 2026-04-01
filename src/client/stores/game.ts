import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  SerializedGame,
  IPlayerBase,
  ISpace,
  PlayerInputPayload,
  CreateGamePayload,
  ActionType,
} from '../../common/types'
import { Phase } from '../../common/Phase'
import { ScenarioResult } from '../../common/types'

const API = '/api/game'

export const useGameStore = defineStore('game', () => {
  // ─── State ───────────────────────────────────────────────────────────────
  const gameState = ref<SerializedGame | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const localPlayerId = ref<string | null>(null)  // this browser's player id

  // ─── Computed ─────────────────────────────────────────────────────────────
  const phase = computed(() => gameState.value?.phase as Phase | undefined)
  const round = computed(() => gameState.value?.round ?? 0)

  const myPlayer = computed<IPlayerBase | undefined>(() =>
    gameState.value?.players.find(p => p.playerId === localPlayerId.value),
  )

  const isMyTurn = computed(() =>
    gameState.value?.activeActorId === myPlayer.value?.id,
  )

  const isWaitingForMe = computed(() =>
    localPlayerId.value != null &&
    gameState.value?.waitingForPlayerIds.includes(localPlayerId.value),
  )

  const activeActor = computed(() => {
    const id = gameState.value?.activeActorId
    if (!id) return null
    const player = gameState.value?.players.find(p => p.id === id)
    if (player) return { ...player, actorType: 'player' as const }
    const monster = gameState.value?.monsters.find(m => m.id === id)
    if (monster) return { ...monster, actorType: 'monster' as const }
    return null
  })

  const spaceMap = computed(() => {
    const map = new Map<string, ISpace>()
    for (const space of gameState.value?.spaces ?? []) {
      map.set(space.id, space)
    }
    return map
  })

  const isVictory = computed(() => gameState.value?.scenarioResult === ScenarioResult.VICTORY)
  const isDefeat = computed(() => gameState.value?.scenarioResult === ScenarioResult.DEFEAT)

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function createGame(payload: CreateGamePayload, myIndex: number): Promise<void> {
    await apiCall(async () => {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const state: SerializedGame = await handleResponse(res)
      gameState.value = state
      localPlayerId.value = `player-${myIndex + 1}`
    })
  }

  async function loadGame(gameId: string): Promise<void> {
    await apiCall(async () => {
      const res = await fetch(`${API}/${gameId}`)
      gameState.value = await handleResponse(res)
    })
  }

  async function startScenario(): Promise<void> {
    if (!gameState.value) return
    await apiCall(async () => {
      const res = await fetch(`${API}/${gameState.value!.gameId}/start`, { method: 'POST' })
      gameState.value = await handleResponse(res)
    })
  }

  async function sendAction(action: ActionType, data?: Record<string, unknown>): Promise<void> {
    console.log('[GameStore] sendAction:', action, data, '| playerId:', localPlayerId.value)
    if (!gameState.value || !localPlayerId.value) {
      console.warn('[GameStore] sendAction aborted — no gameState or localPlayerId')
      return
    }
    const payload: PlayerInputPayload = {
      gameId: gameState.value.gameId,
      playerId: localPlayerId.value,
      action,
      data,
    }
    console.log('[GameStore] POST /api/game/input payload:', JSON.stringify(payload))
    await apiCall(async () => {
      const res = await fetch(`${API}/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      gameState.value = await handleResponse(res)
      console.log('[GameStore] response phase:', gameState.value?.phase, '| waitingFor:', gameState.value?.waitingForPlayerIds)
    })
  }

  async function selectCards(topCardId: string, bottomCardId: string): Promise<void> {
    console.log('[GameStore] selectCards — top:', topCardId, '| bottom:', bottomCardId)
    await sendAction('SELECT_CARDS', { topCardId, bottomCardId })
  }

  async function moveToSpace(spaceId: string): Promise<void> {
    await sendAction('MOVE', { spaceId })
  }

  async function attackTarget(cardId: string, useTop: boolean, targetId: string): Promise<void> {
    await sendAction('ATTACK', { cardId, useTop, targetId })
  }

  async function endTurn(): Promise<void> {
    await sendAction('END_TURN')
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  async function apiCall(fn: () => Promise<void>): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await fn()
    } catch (e) {
      error.value = (e as Error).message
      console.error('[GameStore] apiCall error:', error.value)
    } finally {
      loading.value = false
    }
  }

  async function handleResponse(res: Response): Promise<SerializedGame> {
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
    return body as SerializedGame
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
  }
})
