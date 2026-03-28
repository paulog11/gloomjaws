import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const selectedCardId = ref<string | null>(null)
  const selectedTargetId = ref<string | null>(null)
  const hoveredSpaceId = ref<string | null>(null)
  const showLog = ref(false)

  function selectCard(cardId: string | null) {
    selectedCardId.value = cardId
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
  }

  return {
    selectedCardId,
    selectedTargetId,
    hoveredSpaceId,
    showLog,
    selectCard,
    selectTarget,
    hoverSpace,
    toggleLog,
    clearSelections,
  }
})
