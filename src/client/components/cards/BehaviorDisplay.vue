<template>
  <div class="behavior-display">
    <div v-if="behavior.attack" class="action attack">
      ⚔ {{ behavior.attack.value }}
      <span v-if="behavior.attack.range > 1"> RNG {{ behavior.attack.range }}</span>
    </div>
    <div v-if="behavior.move" class="action move">
      👣 {{ behavior.move.value }}
    </div>
    <div v-if="behavior.heal" class="action heal">
      ❤ {{ behavior.heal }}
    </div>
    <div v-if="behavior.shield" class="action shield">
      🛡 {{ behavior.shield }}
    </div>
    <div v-if="behavior.retaliate" class="action retaliate">
      ↩ {{ behavior.retaliate }}
    </div>
    <div v-if="behavior.applyCondition" class="action condition">
      {{ conditionLabel(behavior.applyCondition) }}
    </div>
    <div v-if="behavior.produceElement" class="action element">
      +{{ elementSymbol(behavior.produceElement) }}
    </div>
    <div v-if="behavior.consumeElement" class="action consume">
      {{ elementSymbol(behavior.consumeElement) }}→
    </div>
    <div v-if="behavior.loot" class="action loot">
      ◈ {{ behavior.loot > 0 ? `Loot ${behavior.loot}` : 'Loot' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Behavior } from '../../../common/types'
import { ConditionType, Element } from '../../../common/types'

defineProps<{ behavior: Behavior }>()

function conditionLabel(type: ConditionType): string {
  const labels: Record<ConditionType, string> = {
    [ConditionType.POISON]: '☠ Poison', [ConditionType.WOUND]: '🩸 Wound',
    [ConditionType.IMMOBILIZE]: '⛓ Immob.', [ConditionType.DISARM]: '🚫 Disarm',
    [ConditionType.STUN]: '💫 Stun', [ConditionType.MUDDLE]: '🌫 Muddle',
    [ConditionType.CURSE]: '💀 Curse', [ConditionType.BLESS]: '✨ Bless',
    [ConditionType.STRENGTHEN]: '💪 Str.', [ConditionType.INVISIBLE]: '👁 Invis.',
  }
  return labels[type] ?? type
}

function elementSymbol(el: Element): string {
  const symbols: Record<Element, string> = {
    [Element.FIRE]: '🔥', [Element.ICE]: '❄', [Element.AIR]: '💨',
    [Element.EARTH]: '🌿', [Element.LIGHT]: '☀', [Element.DARK]: '🌑',
  }
  return symbols[el] ?? el
}
</script>

<style scoped>
.behavior-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.65rem;
}

.action {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: #d4b483;
  white-space: nowrap;
}

.attack  { color: #d47070; }
.move    { color: #70a4d4; }
.heal    { color: #70d490; }
.shield  { color: #d4c470; }
.element { color: #c8942a; }
.consume { color: #8b7040; }
.loot    { color: #c8942a; }
</style>
