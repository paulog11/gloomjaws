<template>
  <div class="overlay">
    <div class="overlay-box">
      <h2>End of Round {{ store.round }}</h2>
      <p>Conditions resolved. Elements decayed.</p>
      <p class="next-round">Proceeding to Round {{ store.round + 1 }}…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/game'
const store = useGameStore()
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.overlay-box {
  background: #1e160e;
  border: 1px solid #5a3e1b;
  border-radius: 8px;
  padding: 2rem 3rem;
  text-align: center;
  animation: fadeOut 1.5s ease-in-out forwards;
  animation-delay: 0.5s;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}

h2 { font-family: 'Cinzel', serif; color: #c8942a; margin: 0 0 0.5rem; }
p  { color: #8b7355; margin: 0.25rem 0; font-size: 0.9rem; }
.next-round { color: #d4b483; }
</style>
