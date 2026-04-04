import { describe, it, expect } from 'vitest'
import { determineFocus } from '../server/engine/MonsterAI.js'
import { HexGrid } from '../server/engine/HexGrid.js'
import {
  ISpace,
  IMonsterToken,
  IPlayerBase,
  ActorType,
  TerrainType,
  CardClass,
  ModifierCardType,
} from '../common/types.js'

// ─── Factories ────────────────────────────────────────────────────────────────

function makeSpace(id: string, q: number, r: number, opts: Partial<ISpace> = {}): ISpace {
  return { id, coord: { q, r }, terrain: TerrainType.NORMAL, roomId: 1, ...opts }
}

function makeMonster(spaceId: string, overrides: Partial<IMonsterToken> = {}): IMonsterToken {
  return {
    id: 'monster-1',
    type: ActorType.MONSTER,
    monsterId: 'bandit-guard',
    isElite: false,
    number: 1,
    hp: 6,
    maxHp: 6,
    conditions: [],
    spaceId,
    initiative: 30,
    acted: false,
    ...overrides,
  }
}

function makePlayer(id: string, spaceId: string, initiative = 10, overrides: Partial<IPlayerBase> = {}): IPlayerBase {
  return {
    id,
    type: ActorType.PLAYER,
    playerId: `player-${id}`,
    name: id,
    cardClass: CardClass.INOX_HATCHET,
    level: 1,
    xp: 0,
    gold: 0,
    hp: 10,
    maxHp: 10,
    conditions: [],
    spaceId,
    initiative,
    acted: false,
    hand: [],
    selectedCards: null,
    selectedCardHalves: null,
    modifierDeck: [],
    modifierDiscard: [],
    exhausted: false,
    ...overrides,
  }
}

// Linear row: s0(0,0) — s1(1,0) — s2(2,0) — s3(3,0) — s4(4,0)
function makeRow(length = 5): ISpace[] {
  return Array.from({ length }, (_, i) => makeSpace(`s${i}`, i, 0))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('determineFocus (melee, range=1)', () => {
  it('returns null when no players are alive', () => {
    const spaces = makeRow(3)
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    expect(determineFocus(monster, [], grid, 1)).toBeNull()
  })

  it('returns null when all players are exhausted', () => {
    const spaces = makeRow(3)
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    const player = makePlayer('p1', 's2', 10, { exhausted: true })
    expect(determineFocus(monster, [player], grid, 1)).toBeNull()
  })

  it('focuses the only alive player', () => {
    // monster at s0, player at s2 — need to reach s1 (adjacent to s2) in 1 step
    const spaces = makeRow(4)
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    const player = makePlayer('p1', 's2')
    const focus = determineFocus(monster, [player], grid, 1)
    expect(focus?.id).toBe('p1')
  })

  it('focuses the player that requires fewer moves', () => {
    // monster at s0, p1 at s2 (needs 1 move to adjacent s1), p2 at s4 (needs 3 moves to adjacent s3)
    const spaces = makeRow(5)
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    const p1 = makePlayer('p1', 's2', 20)
    const p2 = makePlayer('p2', 's4', 10)
    const focus = determineFocus(monster, [p1, p2], grid, 1)
    expect(focus?.id).toBe('p1')
  })

  it('breaks ties by lowest initiative', () => {
    // Two players equidistant from monster — pick lower initiative
    // monster at s0 (0,0), p1 at s2 (2,0), p2 at s2_alt (0,2)
    const spaces = [
      makeSpace('s0', 0, 0),
      makeSpace('s1', 1, 0),
      makeSpace('s2', 2, 0),
      makeSpace('s3', 0, 1),
      makeSpace('s4', 0, 2),
    ]
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    // p1 at (2,0): adjacent hex is (1,0)=s1, pathDist s0→s1 = 1
    // p2 at (0,2): adjacent hex is (0,1)=s3, pathDist s0→s3 = 1
    const p1 = makePlayer('p1', 's2', 30)  // higher initiative
    const p2 = makePlayer('p2', 's4', 10)  // lower initiative — should be picked
    const focus = determineFocus(monster, [p1, p2], grid, 1)
    expect(focus?.id).toBe('p2')
  })

  it('ignores INVISIBLE players', () => {
    const spaces = makeRow(4)
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    const player = makePlayer('p1', 's2', 10, {
      conditions: [{ type: 'INVISIBLE' as any, sourceId: 'src' }],
    })
    expect(determineFocus(monster, [player], grid, 1)).toBeNull()
  })
})

describe('determineFocus (ranged, range=3)', () => {
  it('focuses player already in range with LOS (no moves needed)', () => {
    // monster at s0, player at s2, range 3 — already in range, LOS clear
    const spaces = makeRow(4)
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    const player = makePlayer('p1', 's2')
    const focus = determineFocus(monster, [player], grid, 3)
    expect(focus?.id).toBe('p1')
  })

  it('prefers player already in range over player requiring moves', () => {
    const spaces = makeRow(5)
    const grid = new HexGrid(spaces)
    const monster = makeMonster('s0')
    const inRange = makePlayer('p1', 's2', 20)  // dist 2 ≤ range 3, in range
    const outOfRange = makePlayer('p2', 's4', 10) // dist 4 > range 3, needs to move
    const focus = determineFocus(monster, [inRange, outOfRange], grid, 3)
    expect(focus?.id).toBe('p1')
  })
})
