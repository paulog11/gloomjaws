<template>
  <header class="game-header">
    <div class="header-left">
      <span class="scenario-name">Scenario {{ store.gameState!.scenarioId }}</span>
      <span class="round-label">Round {{ store.round }}</span>
    </div>

    <div class="phase-label">{{ phaseLabel }}</div>

    <div class="header-right">
      <div class="elements">
        <ElementToken
          v-for="(strength, element) in store.gameState!.elements"
          :key="element"
          :element="element"
          :strength="strength"
        />
      </div>
      <button class="btn-log" @click="uiStore.toggleLog()">Log</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useUIStore } from '../stores/ui'
import { Phase } from '../../common/Phase'
import ElementToken from './ElementToken.vue'

const store = useGameStore()
const uiStore = useUIStore()

const phaseLabel = computed(() => {
  const labels: Record<string, string> = {
    [Phase.LOBBY]: 'Lobby',
    [Phase.CARD_SELECTION]: 'Select Cards',
    [Phase.INITIATIVE_REVEAL]: 'Initiative Reveal',
    [Phase.ROUND_ACTIONS]: 'Round Actions',
    [Phase.END_OF_ROUND]: 'End of Round',
    [Phase.SCENARIO_END]: 'Scenario End',
    [Phase.CAMPAIGN]: 'Campaign',
  }
  return labels[store.phase ?? ''] ?? store.phase
})
</script>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #1e160e;
  border-bottom: 1px solid #5a3e1b;
  height: 48px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.scenario-name {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  color: #c8942a;
}

.round-label {
  font-size: 0.85rem;
  color: #8b7355;
}

.phase-label {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  color: #d4b483;
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.elements {
  display: flex;
  gap: 0.3rem;
}

.btn-log {
  background: transparent;
  border: 1px solid #5a3e1b;
  color: #8b7355;
  padding: 0.25rem 0.6rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}
</style>
