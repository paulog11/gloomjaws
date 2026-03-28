import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useUIStore = defineStore('ui', () => {
    const selectedCardId = ref(null);
    const selectedTargetId = ref(null);
    const hoveredSpaceId = ref(null);
    const showLog = ref(false);
    function selectCard(cardId) {
        selectedCardId.value = cardId;
    }
    function selectTarget(actorId) {
        selectedTargetId.value = actorId;
    }
    function hoverSpace(spaceId) {
        hoveredSpaceId.value = spaceId;
    }
    function toggleLog() {
        showLog.value = !showLog.value;
    }
    function clearSelections() {
        selectedCardId.value = null;
        selectedTargetId.value = null;
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
    };
});
