<template>
  <g
    class="hex-cell"
    :transform="`translate(${cx}, ${cy})`"
    @click="$emit('click')"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <!-- Hex background -->
    <polygon
      :points="hexPoints"
      :class="['hex-bg', `terrain-${space.terrain.toLowerCase()}`, { hovered: isHovered, selected: isSelected }]"
    />

    <!-- Occupant token -->
    <template v-if="occupant">
      <circle
        :r="size * 0.38"
        :class="['occupant-circle', occupant.type === 'player' ? 'player-token' : (occupant.data as IMonsterToken).isElite ? 'elite-token' : 'monster-token']"
      />
      <text class="token-label" text-anchor="middle" dominant-baseline="central" :font-size="size * 0.28">
        {{ tokenLabel }}
      </text>
    </template>

    <!-- Loot token -->
    <text v-if="space.loot" class="loot-icon" text-anchor="middle" dominant-baseline="central" :font-size="size * 0.35">◈</text>

    <!-- Trap indicator -->
    <text v-if="space.trap" class="trap-icon" text-anchor="middle" dominant-baseline="central" :font-size="size * 0.3">⚠</text>

    <!-- Door indicator -->
    <rect v-if="space.terrain === TerrainType.DOOR && !space.doorOpen"
      :x="-size * 0.15" :y="-size * 0.55" :width="size * 0.3" :height="size * 1.1"
      class="door-rect"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ISpace, IPlayerBase, IMonsterToken } from '../../../common/types'
import { TerrainType } from '../../../common/types'

const props = defineProps<{
  space: ISpace
  size: number
  occupant: { type: 'player' | 'monster'; data: IPlayerBase | IMonsterToken } | null
  isHovered: boolean
  isSelected: boolean
}>()

defineEmits<{
  click: []
  mouseenter: []
  mouseleave: []
}>()

// Flat-top hex pixel center
const cx = computed(() => props.size * (3 / 2) * props.space.coord.q)
const cy = computed(() =>
  props.size * (Math.sqrt(3) / 2 * props.space.coord.q + Math.sqrt(3) * props.space.coord.r),
)

// Flat-top hex corner points
const hexPoints = computed(() => {
  const s = props.size * 0.95
  const corners: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i)
    corners.push(`${s * Math.cos(angle)},${s * Math.sin(angle)}`)
  }
  return corners.join(' ')
})

const tokenLabel = computed(() => {
  if (!props.occupant) return ''
  if (props.occupant.type === 'player') {
    return (props.occupant.data as IPlayerBase).name.charAt(0).toUpperCase()
  }
  const monster = props.occupant.data as IMonsterToken
  return String(monster.number)
})
</script>

<style scoped>
.hex-cell {
  cursor: pointer;
}

.hex-bg {
  stroke-width: 1.5;
  transition: fill 0.1s;
}

.terrain-normal      { fill: #2a2018; stroke: #4a3820; }
.terrain-difficult   { fill: #1a2010; stroke: #3a4820; }
.terrain-obstacle    { fill: #3a3028; stroke: #6a5838; }
.terrain-wall        { fill: #0a0806; stroke: #2a1810; }
.terrain-door        { fill: #2a1a10; stroke: #8b6020; }
.terrain-trap        { fill: #2a1010; stroke: #6a2020; }
.terrain-corridor    { fill: #222018; stroke: #3a3020; }

.hex-bg.hovered   { fill: #3a3020; }
.hex-bg.selected  { stroke: #c8942a; stroke-width: 2.5; }

.occupant-circle {
  stroke-width: 1.5;
}

.player-token  { fill: #2a4a2a; stroke: #4a9a4a; }
.monster-token { fill: #4a1a1a; stroke: #9a3a3a; }
.elite-token   { fill: #4a3a10; stroke: #c8942a; }

.token-label {
  fill: #d4b483;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  pointer-events: none;
}

.loot-icon {
  fill: #c8942a;
  pointer-events: none;
}

.trap-icon {
  fill: #c84040;
  pointer-events: none;
}

.door-rect {
  fill: #8b6020;
  rx: 2;
}
</style>
