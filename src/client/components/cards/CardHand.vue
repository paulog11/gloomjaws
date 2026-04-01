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

    <!-- Round actions phase: use selected card halves -->
    <div v-if="isMyRoundTurn" class="action-ui">
      <div class="action-label">Your turn — pick an action:</div>
      <div class="action-buttons">
        <button
          v-if="topHalfCard"
          class="btn-action"
          :class="{ active: uiStore.actionCardId === topHalfCard.id && uiStore.actionUseTop }"
          @click="activateAction(topHalfCard, true)"
        >
          <span class="action-card-name">{{ topHalfCard.name }}</span>
          <span class="action-half-label">TOP</span>
          <span class="action-desc">{{ describeBehavior(topHalfCard.top.behavior) }}</span>
        </button>
        <button
          v-if="bottomHalfCard"
          class="btn-action"
          :class="{ active: uiStore.actionCardId === bottomHalfCard.id && !uiStore.actionUseTop }"
          @click="activateAction(bottomHalfCard, false)"
        >
          <span class="action-card-name">{{ bottomHalfCard.name }}</span>
          <span class="action-half-label">BTM</span>
          <span class="action-desc">{{ describeBehavior(bottomHalfCard.bottom.behavior) }}</span>
        </button>
      </div>
      <div v-if="uiStore.actionMode === 'attack'" class="action-hint">Click a monster on the board to attack</div>
      <div v-if="uiStore.actionMode === 'move'" class="action-hint">Click a hex on the board to move</div>
      <button @click="store.endTurn()" class="btn-end-turn" :disabled="store.loading">
        End Turn
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IPlayerBase, IAbilityCard, Behavior } from '../../../common/types'
import { useGameStore } from '../../stores/game'
import { useUIStore } from '../../stores/ui'
import type { ActionMode } from '../../stores/ui'
import { Phase } from '../../../common/Phase'
import AbilityCard from './AbilityCard.vue'

const props = defineProps<{ player: IPlayerBase }>()

const store = useGameStore()
const uiStore = useUIStore()

const activeCards = computed(() => props.player.hand.filter(c => !c.lost))

const isCardSelectionPhase = computed(
  () => store.phase === Phase.CARD_SELECTION && store.isWaitingForMe,
)

const isMyRoundTurn = computed(
  () => store.phase === Phase.ROUND_ACTIONS && store.isMyTurn,
)

// The two cards the player selected for this round
const topHalfCard = computed(() => {
  const sel = props.player.selectedCards
  if (!sel) return null
  return activeCards.value.find(c => c.id === sel[0]) ?? null
})

const bottomHalfCard = computed(() => {
  const sel = props.player.selectedCards
  if (!sel) return null
  return activeCards.value.find(c => c.id === sel[1]) ?? null
})

const topCardName = computed(() => {
  if (!uiStore.topCardId) return null
  return activeCards.value.find(c => c.id === uiStore.topCardId)?.name ?? uiStore.topCardId
})

const bottomCardName = computed(() => {
  if (!uiStore.bottomCardId) return null
  return activeCards.value.find(c => c.id === uiStore.bottomCardId)?.name ?? uiStore.bottomCardId
})

function describeBehavior(b: Behavior): string {
  const parts: string[] = []
  if (b.attack) parts.push(`Atk ${b.attack.value}${b.attack.range > 1 ? ` Rng ${b.attack.range}` : ''}`)
  if (b.move) parts.push(`Move ${b.move.value}`)
  if (b.heal) parts.push(`Heal ${b.heal}`)
  if (b.shield) parts.push(`Shield ${b.shield}`)
  if (b.retaliate) parts.push(`Ret ${b.retaliate}`)
  if (b.loot) parts.push('Loot')
  return parts.join(', ') || 'No effect'
}

function primaryMode(b: Behavior): ActionMode {
  if (b.attack) return 'attack'
  if (b.move) return 'move'
  if (b.heal) return 'heal'
  return 'none'
}

function activateAction(card: IAbilityCard, useTop: boolean) {
  const behavior = useTop ? card.top.behavior : card.bottom.behavior
  const mode = primaryMode(behavior)
  console.log('[CardHand] activateAction:', card.name, useTop ? 'TOP' : 'BTM', '| mode:', mode)
  // Toggle off if already active
  if (uiStore.actionCardId === card.id && uiStore.actionUseTop === useTop) {
    uiStore.clearAction()
  } else {
    uiStore.setAction(mode, card.id, useTop)
  }
}

function onCardClick(cardId: string) {
  console.log('[CardHand] card clicked:', cardId, '| phase:', store.phase)
  uiStore.selectCard(uiStore.selectedCardId === cardId ? null : cardId)
}

function onPlayTop(cardId: string) {
  console.log('[CardHand] play-top:', cardId, '| isCardSelection:', isCardSelectionPhase.value)
  if (!isCardSelectionPhase.value) return
  uiStore.pickTopCard(uiStore.topCardId === cardId ? null : cardId)
}

function onPlayBottom(cardId: string) {
  console.log('[CardHand] play-bottom:', cardId, '| isCardSelection:', isCardSelectionPhase.value)
  if (!isCardSelectionPhase.value) return
  uiStore.pickBottomCard(uiStore.bottomCardId === cardId ? null : cardId)
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

/* Round actions UI */
.action-ui {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.action-label {
  font-size: 0.78rem;
  color: #c8942a;
  font-family: 'Cinzel', serif;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #2a2018;
  border: 1px solid #5a3e1b;
  color: #d4b483;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  min-width: 90px;
}

.btn-action:hover {
  border-color: #8b6020;
  background: #3a2a18;
}

.btn-action.active {
  border-color: #c8942a;
  background: #3a3018;
  box-shadow: 0 0 6px rgba(200, 148, 42, 0.3);
}

.action-card-name {
  font-size: 0.62rem;
  color: #8b7355;
}

.action-half-label {
  font-size: 0.6rem;
  font-weight: 700;
  color: #c8942a;
}

.action-desc {
  font-size: 0.7rem;
}

.action-hint {
  font-size: 0.72rem;
  color: #8ba070;
  font-style: italic;
}

.btn-end-turn {
  background: #5a1a1a;
  color: #d4b483;
  border: 1px solid #8b2020;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-left: auto;
}

.btn-end-turn:disabled {
  opacity: 0.5;
}
</style>
