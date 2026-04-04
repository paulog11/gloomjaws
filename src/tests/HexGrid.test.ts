import { describe, it, expect } from 'vitest'
import { HexGrid, axialDistance } from '../server/engine/HexGrid.js'
import { ISpace, TerrainType } from '../common/types.js'

function makeSpace(id: string, q: number, r: number, terrain = TerrainType.NORMAL, opts: Partial<ISpace> = {}): ISpace {
  return { id, coord: { q, r }, terrain, roomId: 1, ...opts }
}

// Simple horizontal row: s0(0,0) — s1(1,0) — s2(2,0) — s3(3,0)
function makeRow(length = 4): ISpace[] {
  return Array.from({ length }, (_, i) => makeSpace(`s${i}`, i, 0))
}

describe('axialDistance', () => {
  it('returns 0 for same hex', () => {
    expect(axialDistance({ q: 2, r: 3 }, { q: 2, r: 3 })).toBe(0)
  })

  it('returns 1 for adjacent hexes', () => {
    expect(axialDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1)
    expect(axialDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1)
    expect(axialDistance({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(1)
  })

  it('returns 2 for two steps away', () => {
    expect(axialDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2)
    expect(axialDistance({ q: 0, r: 0 }, { q: 1, r: 1 })).toBe(2)
  })
})

describe('HexGrid.isPassable', () => {
  it('returns true for a normal empty space', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0)])
    expect(grid.isPassable({ q: 0, r: 0 })).toBe(true)
  })

  it('returns false for WALL terrain', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0, TerrainType.WALL)])
    expect(grid.isPassable({ q: 0, r: 0 })).toBe(false)
  })

  it('returns false for OBSTACLE terrain', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0, TerrainType.OBSTACLE)])
    expect(grid.isPassable({ q: 0, r: 0 })).toBe(false)
  })

  it('returns false for a closed DOOR', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0, TerrainType.DOOR, { doorOpen: false })])
    expect(grid.isPassable({ q: 0, r: 0 })).toBe(false)
  })

  it('returns true for an open DOOR', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0, TerrainType.DOOR, { doorOpen: true })])
    expect(grid.isPassable({ q: 0, r: 0 })).toBe(true)
  })

  it('returns false for an occupied space', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0, TerrainType.NORMAL, { occupantId: 'monster-1' })])
    expect(grid.isPassable({ q: 0, r: 0 })).toBe(false)
  })

  it('returns true for an occupied space when ignoreOccupants=true', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0, TerrainType.NORMAL, { occupantId: 'monster-1' })])
    expect(grid.isPassable({ q: 0, r: 0 }, true)).toBe(true)
  })

  it('returns false for a coord not in the grid', () => {
    const grid = new HexGrid([makeSpace('a', 0, 0)])
    expect(grid.isPassable({ q: 99, r: 99 })).toBe(false)
  })
})

describe('HexGrid.findPath', () => {
  it('finds a path along an open row', () => {
    const grid = new HexGrid(makeRow(4))
    const path = grid.findPath({ q: 0, r: 0 }, { q: 3, r: 0 })
    expect(path).not.toBeNull()
    expect(path!.length).toBe(4) // s0 → s1 → s2 → s3
    expect(path![0].id).toBe('s0')
    expect(path![3].id).toBe('s3')
  })

  it('returns null when the destination is blocked', () => {
    const spaces = [
      makeSpace('s0', 0, 0),
      makeSpace('wall', 1, 0, TerrainType.WALL),
      makeSpace('s2', 2, 0),
    ]
    const grid = new HexGrid(spaces)
    expect(grid.findPath({ q: 0, r: 0 }, { q: 2, r: 0 })).toBeNull()
  })

  it('returns a single-element path when start equals goal', () => {
    const grid = new HexGrid(makeRow(3))
    const path = grid.findPath({ q: 0, r: 0 }, { q: 0, r: 0 })
    expect(path).not.toBeNull()
    expect(path!.length).toBe(1)
  })
})

describe('HexGrid.pathDistance', () => {
  it('returns 0 for same coord', () => {
    const grid = new HexGrid(makeRow(4))
    expect(grid.pathDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0)
  })

  it('returns correct distance along open row', () => {
    const grid = new HexGrid(makeRow(4))
    expect(grid.pathDistance({ q: 0, r: 0 }, { q: 3, r: 0 })).toBe(3)
  })

  it('returns Infinity when path is blocked', () => {
    const spaces = [
      makeSpace('s0', 0, 0),
      makeSpace('wall', 1, 0, TerrainType.WALL),
      makeSpace('s2', 2, 0),
    ]
    const grid = new HexGrid(spaces)
    expect(grid.pathDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(Infinity)
  })
})

describe('HexGrid.hasLineOfSight', () => {
  it('returns true for adjacent hexes', () => {
    const grid = new HexGrid(makeRow(3))
    expect(grid.hasLineOfSight({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(true)
  })

  it('returns true for same hex', () => {
    const grid = new HexGrid(makeRow(2))
    expect(grid.hasLineOfSight({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(true)
  })

  it('returns false when a wall is in between', () => {
    const spaces = [
      makeSpace('s0', 0, 0),
      makeSpace('wall', 1, 0, TerrainType.WALL),
      makeSpace('s2', 2, 0),
    ]
    const grid = new HexGrid(spaces)
    expect(grid.hasLineOfSight({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(false)
  })

  it('returns true when path is clear over two spaces', () => {
    const grid = new HexGrid(makeRow(3))
    expect(grid.hasLineOfSight({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(true)
  })
})

describe('HexGrid.neighbors', () => {
  it('returns only spaces that exist in the grid', () => {
    // s0 at (0,0) has neighbor at (1,0)=s1 and others outside grid
    const grid = new HexGrid(makeRow(2))
    const neighbors = grid.neighbors({ q: 0, r: 0 })
    expect(neighbors.length).toBe(1)
    expect(neighbors[0].id).toBe('s1')
  })

  it('returns up to 6 neighbors for a center hex', () => {
    const spaces = [
      makeSpace('c', 0, 0),
      makeSpace('n1', 1, 0),
      makeSpace('n2', 1, -1),
      makeSpace('n3', 0, -1),
      makeSpace('n4', -1, 0),
      makeSpace('n5', -1, 1),
      makeSpace('n6', 0, 1),
    ]
    const grid = new HexGrid(spaces)
    expect(grid.neighbors({ q: 0, r: 0 }).length).toBe(6)
  })
})
