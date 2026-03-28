<template>
  <div class="ability-card" :class="{ selected: isSelected, lost: card.lost }" @click="$emit('click')">
    <div class="card-name">{{ card.name }}</div>
    <div class="card-initiative">{{ card.initiative }}</div>

    <div class="card-half top-half" @click.stop="$emit('play-top', card.id)">
      <BehaviorDisplay :behavior="card.top.behavior" />
      <span v-if="card.top.lossOnUse" class="loss-icon" title="Loss card">✖</span>
    </div>

    <div class="card-divider" />

    <div class="card-half bottom-half" @click.stop="$emit('play-bottom', card.id)">
      <BehaviorDisplay :behavior="card.bottom.behavior" />
      <span v-if="card.bottom.persistent" class="persistent-icon" title="Persistent">♾</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IAbilityCard } from '../../../common/types'
import BehaviorDisplay from './BehaviorDisplay.vue'

defineProps<{
  card: IAbilityCard
  isSelected: boolean
}>()

defineEmits<{
  click: []
  'play-top': [cardId: string]
  'play-bottom': [cardId: string]
}>()
</script>

<style scoped>
.ability-card {
  width: 100px;
  min-width: 100px;
  height: 150px;
  background: #2a1f14;
  border: 1px solid #5a3e1b;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s, transform 0.1s;
  user-select: none;
}

.ability-card:hover {
  transform: translateY(-4px);
  border-color: #8b6020;
}

.ability-card.selected {
  border-color: #c8942a;
  box-shadow: 0 0 8px rgba(200, 148, 42, 0.4);
}

.ability-card.lost {
  opacity: 0.35;
}

.card-name {
  font-family: 'Cinzel', serif;
  font-size: 0.62rem;
  color: #c8942a;
  text-align: center;
  margin-bottom: 0.15rem;
  line-height: 1.2;
}

.card-initiative {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  font-size: 0.65rem;
  color: #8b7355;
  font-weight: 700;
}

.card-half {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  padding: 0.2rem;
  position: relative;
  transition: background 0.1s;
}

.card-half:hover {
  background: rgba(200, 148, 42, 0.1);
}

.card-divider {
  height: 1px;
  background: #5a3e1b;
  margin: 0.1rem 0;
}

.loss-icon {
  position: absolute;
  bottom: 0.1rem;
  right: 0.1rem;
  font-size: 0.6rem;
  color: #8b2020;
}

.persistent-icon {
  position: absolute;
  bottom: 0.1rem;
  right: 0.1rem;
  font-size: 0.6rem;
  color: #4a7a4a;
}
</style>
