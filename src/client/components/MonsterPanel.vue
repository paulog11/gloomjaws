<template>
  <div class="monster-panel">
    <div class="panel-header">
      <div class="monster-portrait-wrapper" :title="monsterName">
        <img
          v-show="!portraitFailed"
          :src="monsterImageUrl(monsterName)"
          :alt="monsterName"
          class="monster-portrait-img"
          @error="portraitFailed = true"
        />
        <div v-if="portraitFailed" class="monster-portrait-placeholder">{{ monsterName.charAt(0) }}</div>
      </div>
      <span class="monster-name">{{ monsterName }}</span>
      <span class="initiative" v-if="groupInitiative !== null">Init {{ groupInitiative }}</span>
    </div>
    <div class="token-list">
      <div
        v-for="token in tokens"
        :key="token.id"
        class="monster-token"
        :class="{ elite: token.isElite, active: isActive(token.id) }"
      >
        <span class="token-number">{{ token.isElite ? '★' : '' }}{{ token.number }}</span>
        <div class="token-hp-bar">
          <div class="token-hp-fill" :style="{ width: hpPercent(token) + '%' }" />
        </div>
        <span class="token-hp">{{ token.hp }}</span>
        <span
          v-for="cond in token.conditions"
          :key="cond.type"
          class="token-condition"
          :title="cond.type"
        >{{ conditionIcon(cond.type) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IMonsterToken } from '../../common/types'
import { ConditionType } from '../../common/types'
import { useGameStore } from '../stores/game'
import { monsterImageUrl } from '../utils/images'

const props = defineProps<{
  monsterName: string
  tokens: IMonsterToken[]
}>()

const store = useGameStore()

const portraitFailed = ref(false)
watch(() => props.monsterName, () => { portraitFailed.value = false })

const groupInitiative = computed(() =>
  props.tokens[0]?.initiative !== 99 ? props.tokens[0]?.initiative : null,
)

function isActive(tokenId: string) {
  return store.gameState?.activeActorId === tokenId
}

function hpPercent(token: IMonsterToken) {
  return token.maxHp > 0 ? (token.hp / token.maxHp) * 100 : 0
}

function conditionIcon(type: ConditionType): string {
  const icons: Record<ConditionType, string> = {
    [ConditionType.POISON]: '☠', [ConditionType.WOUND]: '🩸',
    [ConditionType.IMMOBILIZE]: '⛓', [ConditionType.DISARM]: '🚫',
    [ConditionType.STUN]: '💫', [ConditionType.MUDDLE]: '🌫',
    [ConditionType.CURSE]: '💀', [ConditionType.BLESS]: '✨',
    [ConditionType.STRENGTHEN]: '💪', [ConditionType.INVISIBLE]: '👁',
  }
  return icons[type] ?? type
}
</script>

<style scoped>
.monster-panel {
  background: #2a1414;
  border: 1px solid #3d1a1a;
  border-radius: 6px;
  padding: 0.6rem;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.monster-portrait-wrapper {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 3px;
  overflow: hidden;
  border: 1px dashed #5a1a1a;
  background: #1a0808;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monster-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.monster-portrait-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: #5a1a1a;
}

.monster-name {
  font-size: 0.85rem;
  color: #d4a0a0;
  font-weight: 600;
}

.initiative {
  font-size: 0.75rem;
  color: #8b5555;
  margin-left: auto;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.monster-token {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.3rem;
  border-radius: 3px;
  background: #1e0e0e;
  border: 1px solid transparent;
  font-size: 0.8rem;
}

.monster-token.elite {
  border-color: #c8942a;
}

.monster-token.active {
  border-color: #c84040;
  box-shadow: 0 0 6px rgba(200, 64, 64, 0.3);
}

.token-number {
  width: 20px;
  color: #c8942a;
  font-weight: 600;
}

.token-hp-bar {
  flex: 1;
  height: 8px;
  background: #1a0808;
  border-radius: 2px;
  overflow: hidden;
}

.token-hp-fill {
  height: 100%;
  background: #8b2020;
  transition: width 0.3s;
}

.token-hp {
  width: 24px;
  text-align: right;
  color: #d4a0a0;
}

.token-condition {
  font-size: 0.75rem;
}
</style>
