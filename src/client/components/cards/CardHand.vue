<template>
  <div class="card-hand">
    <div class="hand-label">Hand ({{ activeCards.length }} cards)</div>
    <div class="cards-row">
      <AbilityCard
        v-for="card in activeCards"
        :key="card.id"
        :card="card"
        :is-selected="uiStore.selectedCardId === card.id"
        :top-picked="uiStore.topCardId === card.id"
        :bottom-picked="uiStore.bottomCardId === card.id"
        @click="onCardClick(card.id)"
        @play-top="onPlayTop(card.id)"
        @play-bottom="onPlayBottom(card.id)"
      />
    </div>

    <!-- Card selection phase UI -->
    <div v-if="isCardSelectionPhase" class="selection-ui">
      <div class="selection-status">
        <span :class="{ picked: uiStore.topCardId }">
          Top: {{ topCardName || '(click a card\'s top half)' }}
        </span>
        <span :class="{ picked: uiStore.bottomCardId }">
          Bottom: {{ bottomCardName || '(click a card\'s bottom half)' }}
        </span>
      </div>
      <button
        v-if="uiStore.topCardId && uiStore.bottomCardId"
        class="btn-confirm"
        :disabled="store.loading"
        @click="submitCardSelection"
      >
        Confirm Selection
      </button>
    </div>

    <!-- In-turn actions -->
    <div class="hand-actions" v-if="store.isMyTurn && !isCardSelectionPhase">
      <button @click="store.endTurn()" class="btn-end-turn" :disabled="store.loading">
        End Turn
      </button>
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

const isCardSelectionPhase = computed(
  () => store.phase === Phase.CARD_SELECTION && store.isWaitingForMe,
)

const topCardName = computed(() => {
  if (!uiStore.topCardId) return null
  return activeCards.value.find(c => c.id === uiStore.topCardId)?.name ?? uiStore.topCardId
})

const bottomCardName = computed(() => {
  if (!uiStore.bottomCardId) return null
  return activeCards.value.find(c => c.id === uiStore.bottomCardId)?.name ?? uiStore.bottomCardId
})

function onCardClick(cardId: string) {
  console.log('[CardHand] card clicked:', cardId, '| phase:', store.phase, '| isCardSelection:', isCardSelectionPhase.value)
  uiStore.selectCard(uiStore.selectedCardId === cardId ? null : cardId)
}

function onPlayTop(cardId: string) {
  console.log('[CardHand] play-top:', cardId, '| isCardSelection:', isCardSelectionPhase.value, '| isWaitingForMe:', store.isWaitingForMe)
  if (!isCardSelectionPhase.value) return
  uiStore.pickTopCard(uiStore.topCardId === cardId ? null : cardId)
  console.log('[CardHand] top picked:', uiStore.topCardId, '| bottom picked:', uiStore.bottomCardId)
}

function onPlayBottom(cardId: string) {
  console.log('[CardHand] play-bottom:', cardId, '| isCardSelection:', isCardSelectionPhase.value, '| isWaitingForMe:', store.isWaitingForMe)
  if (!isCardSelectionPhase.value) return
  uiStore.pickBottomCard(uiStore.bottomCardId === cardId ? null : cardId)
  console.log('[CardHand] top picked:', uiStore.topCardId, '| bottom picked:', uiStore.bottomCardId)
}

async function submitCardSelection() {
  console.log('[CardHand] submitting selection — top:', uiStore.topCardId, '| bottom:', uiStore.bottomCardId)
  if (!uiStore.topCardId || !uiStore.bottomCardId) return
  await store.selectCards(uiStore.topCardId, uiStore.bottomCardId)
  console.log('[CardHand] selection submitted, new phase:', store.phase, '| error:', store.error)
  uiStore.clearSelections()
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

.selection-ui {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.selection-status {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: #8b7355;
}

.selection-status .picked {
  color: #c8942a;
  font-weight: 600;
}

.btn-confirm {
  background: #2a4a2a;
  color: #a8d4a8;
  border: 1px solid #4a8a4a;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: 'Cinzel', serif;
  transition: background 0.15s;
}

.btn-confirm:hover {
  background: #3a6a3a;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: default;
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
</style>
