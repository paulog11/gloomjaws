import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ActionMode = 'none' | 'move' | 'attack' | 'heal'

export const useUIStore = defineStore('ui', () => {
  const selectedCardId = ref<string | null>(null)
  const selectedTargetId = ref<string | null>(null)
  const hoveredSpaceId = ref<string | null>(null)
  const showLog = ref(false)

  // Card selection phase: two-card picks
  const topCardId = ref<string | null>(null)
  const bottomCardId = ref<string | null>(null)

  // Round actions phase: which card half is being used
  const actionMode = ref<ActionMode>('none')
  const actionCardId = ref<string | null>(null)
  const actionUseTop = ref(false)

  function selectCard(cardId: string | null) {
    selectedCardId.value = cardId
  }

  function pickTopCard(cardId: string | null) {
    topCardId.value = cardId
    if (bottomCardId.value === cardId) bottomCardId.value = null
  }

  function pickBottomCard(cardId: string | null) {
    bottomCardId.value = cardId
    if (topCardId.value === cardId) topCardId.value = null
  }

  function setAction(mode: ActionMode, cardId: string | null, useTop: boolean) {
    console.log('[UI] setAction:', mode, '| cardId:', cardId, '| useTop:', useTop)
    actionMode.value = mode
    actionCardId.value = cardId
    actionUseTop.value = useTop
  }

  function clearAction() {
    actionMode.value = 'none'
    actionCardId.value = null
    actionUseTop.value = false
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
    clearAction()
  }

  return {
    selectedCardId,
    selectedTargetId,
    hoveredSpaceId,
    showLog,
    topCardId,
    bottomCardId,
    actionMode,
    actionCardId,
    actionUseTop,
    selectCard,
    pickTopCard,
    pickBottomCard,
    setAction,
    clearAction,
    selectTarget,
    hoverSpace,
    toggleLog,
    clearSelections,
  }
})
