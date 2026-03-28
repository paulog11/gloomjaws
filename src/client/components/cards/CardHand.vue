<template>
  <div class="card-hand">
    <div class="hand-label">Hand ({{ activeCards.length }} cards)</div>
    <div class="cards-row">
      <AbilityCard
        v-for="card in activeCards"
        :key="card.id"
        :card="card"
        :is-selected="uiStore.selectedCardId === card.id"
        @click="onCardClick(card.id)"
      />
    </div>
    <div class="hand-actions" v-if="store.isMyTurn">
      <button @click="store.endTurn()" class="btn-end-turn" :disabled="store.loading">
        End Turn
      </button>
    </div>
    <div v-if="store.isWaitingForMe && store.phase === Phase.CARD_SELECTION" class="selection-prompt">
      Select 2 cards — click top half or bottom half to confirm
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IPlayerBase } from '../../../common/types'
import { useGameStore } from '../../stores/game'
import { useUIStore } from '../../stores/ui'
import { Phase } from '../../../common/Phase'
import AbilityCard from './AbilityCard.vue'

const props = defineProps<{ player: IPlayerBase }>()

const store = useGameStore()
const uiStore = useUIStore()

const activeCards = computed(() => props.player.hand.filter(c => !c.lost))

function onCardClick(cardId: string) {
  uiStore.selectCard(uiStore.selectedCardId === cardId ? null : cardId)
}
</script>

<style scoped>
.card-hand {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.hand-label {
  font-size: 0.75rem;
  color: #8b7355;
  font-family: 'Cinzel', serif;
}

.cards-row {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  flex: 1;
}

.hand-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-end-turn {
  background: #5a1a1a;
  color: #d4b483;
  border: 1px solid #8b2020;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-end-turn:disabled {
  opacity: 0.5;
}

.selection-prompt {
  font-size: 0.78rem;
  color: #c8942a;
  font-style: italic;
}
</style>
