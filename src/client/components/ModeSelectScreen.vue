<template>
  <div class="mode-select">
    <h1 class="title">Choose Your Adventure</h1>

    <div class="mode-cards">
      <button class="mode-card gloomhaven" @click="$emit('select', 'GLOOMHAVEN')">
        <span class="mode-name">Gloomhaven</span>
        <span class="mode-subtitle">Jaws of the Lion</span>
      </button>

      <button class="mode-card pokemon" @click="$emit('select', 'POKEMON')">
        <span class="mode-name">Pokemon</span>
        <span class="mode-subtitle">Journeys</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GameMode } from '../../common/types'

defineEmits<{
  select: [mode: GameMode]
}>()
</script>

<style scoped>
.mode-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #1a1410;
  color: #d4b483;
  gap: 3rem;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: #c8942a;
  margin: 0;
  letter-spacing: 0.1em;
}

.mode-cards {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 140px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  gap: 0.4rem;
}

.mode-card:hover {
  transform: translateY(-4px);
}

.mode-name {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  font-weight: 700;
}

.mode-subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
}

.mode-card.gloomhaven {
  background: #2a1f14;
  border-color: #5a3e1b;
  color: #d4b483;
}

.mode-card.gloomhaven:hover {
  border-color: #c8942a;
}

.mode-card.pokemon {
  background: #14202a;
  border-color: #1b3a5a;
  color: #83b4d4;
}

.mode-card.pokemon:hover {
  border-color: #2a94c8;
}
</style>
