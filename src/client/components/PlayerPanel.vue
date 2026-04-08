<template>
  <div class="player-panel" :class="{ active: isActive, exhausted: player.exhausted, me: isMe }">
    <div class="panel-header">
      <div class="portrait-wrapper" :title="classLabel">
        <img
          v-show="!portraitFailed"
          :src="characterImageUrl(player.cardClass)"
          :alt="classLabel"
          class="portrait-img"
          @error="portraitFailed = true"
        />
        <div v-if="portraitFailed" class="portrait-placeholder">{{ classLabel.charAt(0) }}</div>
      </div>
      <div class="header-info">
        <span class="player-name">{{ player.name }}</span>
        <span class="class-name">{{ classLabel }}</span>
      </div>
      <span v-if="isActive" class="turn-indicator">▶</span>
    </div>

    <div class="stats">
      <div class="hp-bar">
        <div class="hp-fill" :style="{ width: hpPercent + '%' }" />
        <span class="hp-text">{{ player.hp }} / {{ player.maxHp }}</span>
      </div>
      <div class="stat-row">
        <span title="XP">✦ {{ player.xp }}</span>
        <span title="Gold">◈ {{ player.gold }}</span>
        <span title="Cards in hand">🃏 {{ player.hand.filter(c => !c.lost).length }}</span>
      </div>
    </div>

    <div v-if="player.conditions.length" class="conditions">
      <span
        v-for="cond in player.conditions"
        :key="cond.type"
        class="condition-badge"
        :title="cond.type"
      >
        {{ conditionIcon(cond.type) }}
      </span>
    </div>

    <div v-if="player.exhausted" class="exhausted-banner">EXHAUSTED</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IPlayerBase } from '../../common/types'
import { ConditionType, CardClass } from '../../common/types'
import { characterImageUrl } from '../utils/images'

const props = defineProps<{
  player: IPlayerBase
  isActive: boolean
  isMe: boolean
}>()

const portraitFailed = ref(false)
watch(() => props.player.cardClass, () => { portraitFailed.value = false })

const hpPercent = computed(() =>
  props.player.maxHp > 0 ? (props.player.hp / props.player.maxHp) * 100 : 0,
)

const classLabel = computed(() => {
  const labels: Record<CardClass, string> = {
    [CardClass.VALRATH_RED_GUARD]: 'Red Guard',
    [CardClass.INOX_HATCHET]: 'Hatchet',
    [CardClass.QUATRYL_DEMOLITIONIST]: 'Demolitionist',
    [CardClass.AESTHER_VOIDWARDEN]: 'Voidwarden',
  }
  return labels[props.player.cardClass]
})

function conditionIcon(type: ConditionType): string {
  const icons: Record<ConditionType, string> = {
    [ConditionType.POISON]: '☠',
    [ConditionType.WOUND]: '🩸',
    [ConditionType.IMMOBILIZE]: '⛓',
    [ConditionType.DISARM]: '🚫',
    [ConditionType.STUN]: '💫',
    [ConditionType.MUDDLE]: '🌫',
    [ConditionType.CURSE]: '💀',
    [ConditionType.BLESS]: '✨',
    [ConditionType.STRENGTHEN]: '💪',
    [ConditionType.INVISIBLE]: '👁',
  }
  return icons[type] ?? type
}
</script>

<style scoped>
.player-panel {
  background: #2a1f14;
  border: 1px solid #3d2c1a;
  border-radius: 6px;
  padding: 0.6rem;
  transition: border-color 0.2s;
}

.player-panel.active {
  border-color: #c8942a;
  box-shadow: 0 0 8px rgba(200, 148, 42, 0.3);
}

.player-panel.me {
  border-color: #4a7a4a;
}

.player-panel.exhausted {
  opacity: 0.5;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.portrait-wrapper {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px dashed #5a3e1b;
  background: #1a1410;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #5a3e1b;
}

.header-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.player-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #d4b483;
}

.class-name {
  font-size: 0.72rem;
  color: #8b7355;
}

.turn-indicator {
  color: #c8942a;
  font-size: 0.8rem;
}

.hp-bar {
  position: relative;
  height: 14px;
  background: #1a1410;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.3rem;
}

.hp-fill {
  height: 100%;
  background: #8b2020;
  transition: width 0.3s;
}

.hp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #d4b483;
}

.stat-row {
  display: flex;
  gap: 0.6rem;
  font-size: 0.78rem;
  color: #8b7355;
}

.conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin-top: 0.3rem;
}

.condition-badge {
  font-size: 0.85rem;
}

.exhausted-banner {
  text-align: center;
  font-size: 0.7rem;
  color: #8b3a3a;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.1em;
  margin-top: 0.3rem;
}
</style>
