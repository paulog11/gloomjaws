<template>
  <div class="game-log">
    <div class="log-header">
      <span>Game Log</span>
      <button @click="uiStore.toggleLog()" class="btn-close">✕</button>
    </div>
    <div class="log-entries" ref="logEl">
      <div v-for="(entry, i) in store.gameState!.log" :key="i" class="log-entry">
        <span class="log-round">[R{{ entry.round }}]</span>
        <span class="log-msg">{{ entry.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import { useUIStore } from '../stores/ui'

const store = useGameStore()
const uiStore = useUIStore()
const logEl = ref<HTMLElement | null>(null)

watch(() => store.gameState?.log.length, async () => {
  await nextTick()
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
})
</script>

<style scoped>
.game-log {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #5a3e1b;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  color: #c8942a;
}

.btn-close {
  background: transparent;
  border: none;
  color: #8b7355;
  cursor: pointer;
  font-size: 0.9rem;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  font-size: 0.78rem;
  line-height: 1.4;
}

.log-round {
  color: #5a4a30;
  flex-shrink: 0;
  font-weight: 600;
}

.log-msg {
  color: #8b7355;
}
</style>
