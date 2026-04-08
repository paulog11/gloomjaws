<template>
  <div class="app">
    <template v-if="!store.gameState">
      <ModeSelectScreen v-if="selectedMode === null" @select="selectedMode = $event" />
      <TitleScreen v-else-if="selectedMode === GameMode.GLOOMHAVEN" @back="selectedMode = null" />
      <PokemonTitleScreen v-else-if="selectedMode === GameMode.POKEMON" @back="selectedMode = null" />
    </template>
    <GameScreen v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { GameMode } from '../../common/types'
import ModeSelectScreen from './ModeSelectScreen.vue'
import TitleScreen from './TitleScreen.vue'
import PokemonTitleScreen from './PokemonTitleScreen.vue'
import GameScreen from './GameScreen.vue'

const store = useGameStore()
const selectedMode = ref<GameMode | null>(null)
</script>

<style>
*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #1a1410;
  font-family: 'Crimson Text', Georgia, serif;
  color: #d4b483;
}

#app {
  height: 100%;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1a1410; }
::-webkit-scrollbar-thumb { background: #5a3e1b; border-radius: 3px; }
</style>

<style scoped>
.app {
  height: 100%;
}
</style>
