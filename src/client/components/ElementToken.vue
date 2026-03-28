<template>
  <div class="element-token" :class="[`element-${element.toLowerCase()}`, `strength-${strength.toLowerCase()}`]" :title="`${element}: ${strength}`">
    {{ symbol }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Element, ElementStrength } from '../../common/types'

const props = defineProps<{
  element: Element
  strength: ElementStrength
}>()

const symbol = computed(() => {
  const symbols: Record<Element, string> = {
    [Element.FIRE]: '🔥',
    [Element.ICE]: '❄',
    [Element.AIR]: '💨',
    [Element.EARTH]: '🌿',
    [Element.LIGHT]: '☀',
    [Element.DARK]: '🌑',
  }
  return symbols[props.element]
})
</script>

<style scoped>
.element-token {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 2px solid transparent;
  transition: opacity 0.2s, border-color 0.2s;
}

.strength-inert {
  opacity: 0.25;
  filter: grayscale(1);
}

.strength-waning {
  opacity: 0.6;
  border-color: #5a5040;
}

.strength-strong {
  opacity: 1;
  border-color: #c8942a;
  box-shadow: 0 0 6px rgba(200, 148, 42, 0.5);
}
</style>
