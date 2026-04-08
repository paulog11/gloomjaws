<template>
  <div class="pokemon-title">
    <button class="btn-back" @click="$emit('back')">← Back</button>

    <h1 class="title">Pokemon</h1>
    <h2 class="subtitle">Journeys</h2>

    <div class="setup-form">
      <h3>Begin Your Journey</h3>

      <div class="field-row">
        <label>Trainer Name</label>
        <input
          v-model="trainerName"
          placeholder="Enter your name"
          class="input"
          maxlength="20"
        />
      </div>

      <div class="starter-section">
        <label class="starter-label">Choose Your Starter</label>
        <div class="starter-cards">
          <button
            v-for="starter in starters"
            :key="starter.id"
            class="starter-card"
            :class="{ selected: selectedStarter === starter.id, [starter.type]: true }"
            @click="selectedStarter = starter.id"
          >
            <span class="starter-name">{{ starter.name }}</span>
            <span class="starter-type">{{ starter.type }}</span>
          </button>
        </div>
      </div>

      <button
        @click="startJourney"
        :disabled="!canStart || store.loading"
        class="btn-primary"
      >
        {{ store.loading ? 'Starting…' : 'Start Journey' }}
      </button>

      <p v-if="store.error" class="error">{{ store.error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { GameMode, CardClass } from '../../common/types'

defineEmits<{ back: [] }>()

const store = useGameStore()

const trainerName = ref('')
const selectedStarter = ref<CardClass | null>(null)

const starters = [
  { id: CardClass.TREECKO, name: 'Treecko', type: 'grass' },
  { id: CardClass.TORCHIC, name: 'Torchic', type: 'fire' },
  { id: CardClass.MUDKIP,  name: 'Mudkip',  type: 'water' },
]

const canStart = computed(
  () => trainerName.value.trim().length > 0 && selectedStarter.value !== null,
)

async function startJourney() {
  if (!selectedStarter.value) return
  await store.createGame(
    {
      gameMode: GameMode.POKEMON,
      playerNames: [trainerName.value.trim()],
      playerClasses: [selectedStarter.value],
      scenarioId: 1,
    },
    0,
  )
  if (!store.error) {
    await store.startScenario()
  }
}
</script>

<style scoped>
.pokemon-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0d1b2a;
  color: #83b4d4;
  padding: 2rem;
  position: relative;
}

.btn-back {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  background: transparent;
  border: 1px solid #1b3a5a;
  color: #83b4d4;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-back:hover {
  border-color: #2a94c8;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: 3.5rem;
  margin: 0;
  color: #f5c542;
  letter-spacing: 0.1em;
}

.subtitle {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  margin: 0.25rem 0 2rem;
  color: #2a94c8;
  letter-spacing: 0.2em;
}

.setup-form {
  background: #14202a;
  border: 1px solid #1b3a5a;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setup-form h3 {
  margin: 0;
  font-family: 'Cinzel', serif;
  color: #f5c542;
  font-size: 1rem;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-row label {
  font-size: 0.85rem;
  color: #5a8ab4;
}

.input {
  background: #0d1b2a;
  border: 1px solid #1b3a5a;
  color: #83b4d4;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.95rem;
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: #2a94c8;
}

.starter-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.starter-label {
  font-size: 0.85rem;
  color: #5a8ab4;
}

.starter-cards {
  display: flex;
  gap: 0.75rem;
}

.starter-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
  gap: 0.3rem;
  background: #0d1b2a;
}

.starter-card:hover {
  transform: translateY(-2px);
}

.starter-card.selected {
  transform: translateY(-2px);
}

.starter-name {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 600;
}

.starter-type {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.75;
}

/* Type-specific colors */
.starter-card.grass { color: #5ec45e; border-color: #1e4a1e; }
.starter-card.grass:hover, .starter-card.grass.selected { border-color: #5ec45e; }

.starter-card.fire { color: #e8633a; border-color: #4a1e1e; }
.starter-card.fire:hover, .starter-card.fire.selected { border-color: #e8633a; }

.starter-card.water { color: #3a8ae8; border-color: #1e2e4a; }
.starter-card.water:hover, .starter-card.water.selected { border-color: #3a8ae8; }

.btn-primary {
  background: #1a5c8a;
  color: #e0f0ff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.25rem;
}

.btn-primary:hover:not(:disabled) {
  background: #2a7cc8;
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error {
  color: #c04040;
  font-size: 0.85rem;
  margin: 0;
}
</style>
