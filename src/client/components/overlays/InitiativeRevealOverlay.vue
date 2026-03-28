<template>
  <div class="overlay">
    <div class="overlay-box">
      <h2>Initiative Order</h2>
      <ol class="initiative-list">
        <li v-for="actorId in store.gameState!.initiativeOrder" :key="actorId" class="initiative-item">
          <span class="initiative-num">{{ getInitiative(actorId) }}</span>
          <span class="actor-name">{{ getActorName(actorId) }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/game'

const store = useGameStore()

function getActorName(actorId: string): string {
  const player = store.gameState?.players.find(p => p.id === actorId)
  if (player) return player.name
  const monster = store.gameState?.monsters.find(m => m.id === actorId)
  if (monster) return `${monster.monsterId} #${monster.number}${monster.isElite ? ' ★' : ''}`
  return actorId
}

function getInitiative(actorId: string): number {
  const player = store.gameState?.players.find(p => p.id === actorId)
  if (player) return player.initiative
  const monster = store.gameState?.monsters.find(m => m.id === actorId)
  return monster?.initiative ?? 99
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.overlay-box {
  background: #2a1f14;
  border: 1px solid #c8942a;
  border-radius: 8px;
  padding: 2rem;
  min-width: 300px;
}

h2 {
  font-family: 'Cinzel', serif;
  color: #c8942a;
  margin: 0 0 1rem;
  text-align: center;
}

.initiative-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.initiative-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.initiative-num {
  width: 40px;
  font-weight: 700;
  color: #c8942a;
  font-size: 1.1rem;
}

.actor-name {
  color: #d4b483;
}
</style>
