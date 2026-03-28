<template>
  <div class="overlay">
    <div class="overlay-box" :class="store.isVictory ? 'victory' : 'defeat'">
      <h1 class="result-title">{{ store.isVictory ? 'Victory!' : 'Defeat' }}</h1>
      <p class="result-sub">{{ store.isVictory ? 'The enemies have been vanquished.' : 'The party has fallen.' }}</p>

      <div v-if="store.isVictory" class="rewards">
        <h3>Rewards</h3>
        <div v-for="player in store.gameState!.players" :key="player.id" class="player-reward">
          <span class="player-name">{{ player.name }}</span>
          <span>✦ {{ player.xp }} XP</span>
          <span>◈ {{ player.gold }} gold</span>
        </div>
      </div>

      <button class="btn-continue" @click="emit('new-game')">
        {{ store.isVictory ? 'Continue Campaign' : 'Try Again' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/game'

const store = useGameStore()
const emit = defineEmits<{ 'new-game': [] }>()
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.overlay-box {
  background: #1e160e;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  min-width: 360px;
}

.overlay-box.victory { border: 2px solid #c8942a; }
.overlay-box.defeat  { border: 2px solid #8b2020; }

.result-title {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  margin: 0 0 0.5rem;
}

.victory .result-title { color: #c8942a; }
.defeat  .result-title { color: #8b2020; }

.result-sub {
  color: #8b7355;
  margin: 0 0 1.5rem;
}

.rewards h3 {
  font-family: 'Cinzel', serif;
  color: #c8942a;
  margin: 0 0 0.75rem;
}

.player-reward {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
  color: #d4b483;
  font-size: 0.9rem;
}

.player-name {
  font-weight: 600;
  min-width: 80px;
  text-align: right;
}

.btn-continue {
  margin-top: 1.5rem;
  background: #5a2a10;
  color: #f0d090;
  border: 1px solid #8b4513;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  cursor: pointer;
}
</style>
