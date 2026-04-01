<template>
  <div class="hex-board-container">
    <svg
      ref="svgEl"
      class="hex-board"
      :viewBox="viewBox"
      @click.self="uiStore.clearSelections()"
    >
      <g v-for="space in visibleSpaces" :key="space.id">
        <HexCell
          :space="space"
          :size="HEX_SIZE"
          :occupant="occupantOf(space)"
          :is-hovered="uiStore.hoveredSpaceId === space.id"
          :is-selected="false"
          :is-targetable="isTargetable(space)"
          @click="onSpaceClick(space)"
          @mouseenter="uiStore.hoverSpace(space.id)"
          @mouseleave="uiStore.hoverSpace(null)"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import { useUIStore } from '../../stores/ui'
import type { ISpace } from '../../../common/types'
import HexCell from './HexCell.vue'

const HEX_SIZE = 36

const store = useGameStore()
const uiStore = useUIStore()
const svgEl = ref<SVGElement | null>(null)

const visibleSpaces = computed(() => {
  const revealed = new Set(store.gameState?.revealedRooms ?? [])
  return (store.gameState?.spaces ?? []).filter(s => revealed.has(s.roomId))
})

// Flat-top hex pixel coordinates
function hexToPixel(q: number, r: number, size: number) {
  const x = size * (3 / 2) * q
  const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r)
  return { x, y }
}

const viewBox = computed(() => {
  if (!visibleSpaces.value.length) return '0 0 400 300'
  const points = visibleSpaces.value.map(s => hexToPixel(s.coord.q, s.coord.r, HEX_SIZE))
  const minX = Math.min(...points.map(p => p.x)) - HEX_SIZE * 1.5
  const minY = Math.min(...points.map(p => p.y)) - HEX_SIZE * 1.5
  const maxX = Math.max(...points.map(p => p.x)) + HEX_SIZE * 1.5
  const maxY = Math.max(...points.map(p => p.y)) + HEX_SIZE * 1.5
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
})

function occupantOf(space: ISpace) {
  if (!space.occupantId) return null
  const player = store.gameState?.players.find(p => p.id === space.occupantId)
  if (player) return { type: 'player' as const, data: player }
  const monster = store.gameState?.monsters.find(m => m.id === space.occupantId)
  if (monster) return { type: 'monster' as const, data: monster }
  return null
}

function isTargetable(space: ISpace): boolean {
  if (uiStore.actionMode !== 'attack' || !store.isMyTurn) return false
  if (!space.occupantId) return false
  return store.gameState?.monsters.some(m => m.id === space.occupantId) ?? false
}

function onSpaceClick(space: ISpace) {
  if (!store.isMyTurn) return

  const mode = uiStore.actionMode

  if (mode === 'attack' && space.occupantId) {
    // Check if the occupant is a monster
    const monster = store.gameState?.monsters.find(m => m.id === space.occupantId)
    if (monster && uiStore.actionCardId) {
      console.log('[HexBoard] attacking monster:', monster.id, '| card:', uiStore.actionCardId, '| useTop:', uiStore.actionUseTop)
      store.attackTarget(uiStore.actionCardId, uiStore.actionUseTop, monster.id)
      uiStore.clearAction()
      return
    }
  }

  if (mode === 'move' || mode === 'none') {
    console.log('[HexBoard] moving to space:', space.id)
    store.moveToSpace(space.id)
    if (mode === 'move') uiStore.clearAction()
  }
}
</script>

<style scoped>
.hex-board-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hex-board {
  width: 100%;
  height: 100%;
  max-width: 700px;
  max-height: 600px;
}
</style>
