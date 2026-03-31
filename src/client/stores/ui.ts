import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const selectedCardId = ref<string | null>(null)
  const selectedTargetId = ref<string | null>(null)
  const hoveredSpaceId = ref<string | null>(null)
  const showLog = ref(false)

  // Card selection phase: two-card picks
  const topCardId = ref<string | null>(null)
  const bottomCardId = ref<string | null>(null)

  function selectCard(cardId: string | null) {
    selectedCardId.value = cardId
  }

  function pickTopCard(cardId: string | null) {
    topCardId.value = cardId
    // Can't use the same card for both halves
    if (bottomCardId.value === cardId) bottomCardId.value = null
  }

  function pickBottomCard(cardId: string | null) {
    bottomCardId.value = cardId
    if (topCardId.value === cardId) topCardId.value = null
  }

  function selectTarget(actorId: string | null) {
    selectedTargetId.value = actorId
  }

  function hoverSpace(spaceId: string | null) {
    hoveredSpaceId.value = spaceId
  }

  function toggleLog() {
    showLog.value = !showLog.value
  }

  function clearSelections() {
    selectedCardId.value = null
    selectedTargetId.value = null
    topCardId.value = null
    bottomCardId.value = null
  }

  return {
    selectedCardId,
    selectedTargetId,
    hoveredSpaceId,
    showLog,
    topCardId,
    bottomCardId,
    selectCard,
    pickTopCard,
    pickBottomCard,
    selectTarget,
    hoverSpace,
    toggleLog,
    clearSelections,
  }
})
