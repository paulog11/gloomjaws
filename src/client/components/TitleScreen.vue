<template>
  <div class="title-screen">
    <h1 class="title">Gloomhaven</h1>
    <h2 class="subtitle">Jaws of the Lion</h2>

    <div class="setup-form">
      <h3>New Game</h3>

      <div v-for="(_, i) in players" :key="i" class="player-row">
        <label>Player {{ i + 1 }}</label>
        <input v-model="players[i].name" placeholder="Name" class="input" />
        <select v-model="players[i].cardClass" class="select">
          <option value="INOX_DRIFTER">Inox Drifter</option>
          <option value="VALRATH_RED_GUARD">Valrath Red Guard</option>
          <option value="QUATRYL_DEMOLITIONIST">Quatryl Demolitionist</option>
          <option value="AESTHER_HATCHET">Aesther Hatchet</option>
        </select>
        <button v-if="players.length > 1" @click="removePlayer(i)" class="btn-remove">✕</button>
      </div>

      <button v-if="players.length < 4" @click="addPlayer" class="btn-secondary">
        + Add Player
      </button>

      <div class="scenario-row">
        <label>Scenario</label>
        <select v-model="scenarioId" class="select">
          <option :value="1">1 — The Black Barrow</option>
        </select>
      </div>

      <button @click="startGame" :disabled="!canStart || store.loading" class="btn-primary">
        {{ store.loading ? 'Starting…' : 'Start Scenario' }}
      </button>

      <p v-if="store.error" class="error">{{ store.error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import type { CardClass } from '../../common/types'

const store = useGameStore()

const players = ref([
  { name: 'Player 1', cardClass: 'INOX_DRIFTER' as CardClass },
])
const scenarioId = ref(1)

const canStart = computed(() =>
  players.value.every(p => p.name.trim().length > 0),
)

function addPlayer() {
  if (players.value.length < 4) {
    players.value.push({ name: `Player ${players.value.length + 1}`, cardClass: 'VALRATH_RED_GUARD' as CardClass })
  }
}

function removePlayer(index: number) {
  players.value.splice(index, 1)
}

async function startGame() {
  await store.createGame(
    {
      playerNames: players.value.map(p => p.name),
      playerClasses: players.value.map(p => p.cardClass),
      scenarioId: scenarioId.value,
    },
    0,
  )
  if (!store.error) {
    await store.startScenario()
  }
}
</script>

<style scoped>
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #1a1410;
  color: #d4b483;
  padding: 2rem;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: 3.5rem;
  letter-spacing: 0.1em;
  margin: 0;
  color: #c8942a;
}

.subtitle {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  letter-spacing: 0.2em;
  margin: 0.25rem 0 2rem;
  color: #8b6914;
}

.setup-form {
  background: #2a1f14;
  border: 1px solid #5a3e1b;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setup-form h3 {
  margin: 0;
  font-family: 'Cinzel', serif;
  color: #c8942a;
}

.player-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.player-row label {
  width: 60px;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.scenario-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.scenario-row label {
  width: 60px;
  font-size: 0.85rem;
}

.input, .select {
  flex: 1;
  background: #1a1410;
  border: 1px solid #5a3e1b;
  color: #d4b483;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-primary {
  background: #8b4513;
  color: #f0d090;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #8b6914;
  border: 1px dashed #5a3e1b;
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-remove {
  background: transparent;
  color: #8b3a3a;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem 0.4rem;
}

.error {
  color: #c04040;
  font-size: 0.85rem;
  margin: 0;
}
</style>
