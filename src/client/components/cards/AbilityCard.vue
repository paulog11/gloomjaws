<template>
  <div class="ability-card" :class="{ selected: isSelected, lost: card.lost }" @click="$emit('click')">
    <div class="card-name">{{ card.name }}</div>
    <div class="card-initiative">{{ card.initiative }}</div>

    <div class="card-half top-half" :class="{ 'half-picked': topPicked }" @click.stop="onTopClick">
      <BehaviorDisplay :behavior="card.top.behavior" />
      <span v-if="topPicked" class="pick-label">TOP</span>
      <span v-if="card.top.lossOnUse" class="loss-icon" title="Loss card">✖</span>
    </div>

    <div class="card-divider" />

    <div class="card-half bottom-half" :class="{ 'half-picked': bottomPicked }" @click.stop="onBottomClick">
      <BehaviorDisplay :behavior="card.bottom.behavior" />
      <span v-if="bottomPicked" class="pick-label">BTM</span>
      <span v-if="card.bottom.persistent" class="persistent-icon" title="Persistent">♾</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IAbilityCard } from '../../../common/types'
import BehaviorDisplay from './BehaviorDisplay.vue'

const props = defineProps<{
  card: IAbilityCard
  isSelected: boolean
  topPicked?: boolean
  bottomPicked?: boolean
}>()

const emit = defineEmits<{
  click: []
  'play-top': [cardId: string]
  'play-bottom': [cardId: string]
}>()

function onTopClick() {
  console.log('[AbilityCard] top half clicked:', props.card.id, props.card.name)
  emit('play-top', props.card.id)
}

function onBottomClick() {
  console.log('[AbilityCard] bottom half clicked:', props.card.id, props.card.name)
  emit('play-bottom', props.card.id)
}
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

.half-picked {
  background: rgba(200, 148, 42, 0.2);
  outline: 1px solid #c8942a;
  border-radius: 3px;
}

.pick-label {
  position: absolute;
  top: 0.1rem;
  left: 0.15rem;
  font-size: 0.5rem;
  font-weight: 700;
  color: #c8942a;
  letter-spacing: 0.05em;
}
</style>
