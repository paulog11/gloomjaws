<template>
  <div class="game-screen">
    <GameHeader />

    <div class="game-body">
      <aside class="left-panel">
        <PlayerPanel
          v-for="player in store.gameState!.players"
          :key="player.id"
          :player="player"
          :is-active="store.gameState!.activeActorId === player.id"
          :is-me="player.playerId === store.localPlayerId"
        />
      </aside>

      <main class="board-area">
        <HexBoard />
      </main>

      <aside class="right-panel">
        <MonsterPanel
          v-for="monsterGroup in monsterGroups"
          :key="monsterGroup.name"
          :monster-name="monsterGroup.name"
          :tokens="monsterGroup.tokens"
        />
      </aside>
    </div>

    <footer class="action-bar">
      <CardHand v-if="store.myPlayer" :player="store.myPlayer" />
    </footer>

    <InitiativeRevealOverlay v-if="store.phase === Phase.INITIATIVE_REVEAL" />
    <EndOfRoundOverlay v-if="store.phase === Phase.END_OF_ROUND" />
    <ScenarioEndOverlay v-if="store.phase === Phase.SCENARIO_END" />

    <div v-if="uiStore.showLog" class="log-overlay">
      <GameLog />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useUIStore } from '../stores/ui'
import { Phase } from '../../common/Phase'
import GameHeader from './GameHeader.vue'
import PlayerPanel from './PlayerPanel.vue'
import MonsterPanel from './MonsterPanel.vue'
import HexBoard from './board/HexBoard.vue'
import CardHand from './cards/CardHand.vue'
import InitiativeRevealOverlay from './overlays/InitiativeRevealOverlay.vue'
import EndOfRoundOverlay from './overlays/EndOfRoundOverlay.vue'
import ScenarioEndOverlay from './overlays/ScenarioEndOverlay.vue'
import GameLog from './GameLog.vue'

const store = useGameStore()
const uiStore = useUIStore()

const monsterGroups = computed(() => {
  if (!store.gameState) return []
  const groups = new Map<string, typeof store.gameState.monsters>()
  for (const monster of store.gameState.monsters) {
    if (!groups.has(monster.monsterId)) groups.set(monster.monsterId, [])
    groups.get(monster.monsterId)!.push(monster)
  }
  return Array.from(groups.entries()).map(([name, tokens]) => ({ name, tokens }))
})
</script>

<style scoped>
.game-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1410;
  color: #d4b483;
  overflow: hidden;
}

.game-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0.5rem;
  padding: 0.5rem;
}

.left-panel, .right-panel {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}

.board-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-bar {
  height: 180px;
  border-top: 1px solid #5a3e1b;
  padding: 0.5rem;
  background: #1e160e;
}

.log-overlay {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: rgba(10, 8, 5, 0.95);
  border-left: 1px solid #5a3e1b;
  z-index: 100;
  overflow-y: auto;
}
</style>
