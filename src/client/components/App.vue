<template>
  <div class="app">
    <TitleScreen v-if="!store.gameState" />
    <GameScreen v-else />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game'
import TitleScreen from './TitleScreen.vue'
import GameScreen from './GameScreen.vue'

const store = useGameStore()
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
