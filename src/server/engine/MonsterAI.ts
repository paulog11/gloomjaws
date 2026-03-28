import { v4 as uuidv4 } from 'uuid'
import {
  IMonsterToken,
  IPlayerBase,
  ConditionType,
} from '../../common/types.js'
import { HexGrid, axialDistance } from './HexGrid.js'
import { isImmobilized, isStunned, hasCondition } from './Conditions.js'
import { DeferredQueue, DeferredPriority } from './DeferredQueue.js'

/**
 * Determine focus for a monster: the enemy it would attack if it could.
 *
 * Rules (GJotL rulebook p.27):
 * 1. Enemy reachable with fewest moves (path distance to an attack position)
 * 2. Tiebreak: enemy with lowest initiative
 * 3. Tiebreak: enemy physically closest
 */
export function determineFocus(
  monster: IMonsterToken,
  players: IPlayerBase[],
  grid: HexGrid,
  attackRange: number,
): IPlayerBase | null {
  const alivePlayers = players.filter(p => !p.exhausted && p.hp > 0)
  if (alivePlayers.length === 0) return null

  const monsterSpace = grid.getById(monster.spaceId!)
  if (!monsterSpace) return null

  interface Candidate {
    player: IPlayerBase
    movesNeeded: number
  }

  const candidates: Candidate[] = []

  for (const player of alivePlayers) {
    if (hasCondition(player, ConditionType.INVISIBLE)) continue
    const playerSpace = grid.getById(player.spaceId!)
    if (!playerSpace) continue

    if (attackRange === 0 || attackRange === 1) {
      // Melee: need to be adjacent to target
      const neighborSpaces = grid.neighbors(playerSpace.coord)
      let minMoves = Infinity

      for (const attackPos of neighborSpaces) {
        if (attackPos.terrain !== undefined && grid.isPassable(attackPos.coord, true)) {
          const dist = grid.pathDistance(monsterSpace.coord, attackPos.coord)
          if (dist < minMoves) minMoves = dist
        }
      }
      if (minMoves !== Infinity) {
        candidates.push({ player, movesNeeded: minMoves })
      }
    } else {
      // Ranged: find any position within range with LOS
      const dist = axialDistance(monsterSpace.coord, playerSpace.coord)
      if (dist <= attackRange && grid.hasLineOfSight(monsterSpace.coord, playerSpace.coord)) {
        candidates.push({ player, movesNeeded: 0 })
      } else {
        // Move toward a position with LOS and in range
        let minMoves = Infinity
        for (const space of grid.allSpaces()) {
          const toTarget = axialDistance(space.coord, playerSpace.coord)
          if (toTarget <= attackRange && grid.hasLineOfSight(space.coord, playerSpace.coord)) {
            const moveDist = grid.pathDistance(monsterSpace.coord, space.coord)
            if (moveDist < minMoves) minMoves = moveDist
          }
        }
        if (minMoves !== Infinity) {
          candidates.push({ player, movesNeeded: minMoves })
        }
      }
    }
  }

  if (candidates.length === 0) return null

  // Sort: fewest moves → lowest initiative → closest physical distance
  candidates.sort((a, b) => {
    if (a.movesNeeded !== b.movesNeeded) return a.movesNeeded - b.movesNeeded
    if (a.player.initiative !== b.player.initiative) return a.player.initiative - b.player.initiative
    const aSpace = grid.getById(a.player.spaceId!)
    const bSpace = grid.getById(b.player.spaceId!)
    if (!aSpace || !bSpace) return 0
    return (
      axialDistance(monsterSpace.coord, aSpace.coord) -
      axialDistance(monsterSpace.coord, bSpace.coord)
    )
  })

  return candidates[0].player
}

/**
 * Resolve a monster's full turn:
 * 1. Determine focus
 * 2. Move toward focus
 * 3. Attack if in range
 *
 * Queues deferred actions for attack resolution so Shield/Retaliate can interject.
 */
export function resolveMonsterTurn(
  monster: IMonsterToken,
  players: IPlayerBase[],
  grid: HexGrid,
  moveValue: number,
  attackValue: number,
  attackRange: number,
  queue: DeferredQueue,
  onMove: (monster: IMonsterToken, toSpaceId: string) => void,
  onAttack: (monster: IMonsterToken, target: IPlayerBase, finalAttack: number) => void,
): void {
  if (isStunned(monster)) return

  const focus = determineFocus(monster, players, grid, attackRange)
  if (!focus) return

  const monsterSpace = grid.getById(monster.spaceId!)
  const focusSpace = grid.getById(focus.spaceId!)
  if (!monsterSpace || !focusSpace) return

  // Move phase
  if (!isImmobilized(monster) && moveValue > 0) {
    const path = grid.findPath(monsterSpace.coord, focusSpace.coord)
    if (path && path.length > 1) {
      // Move up to moveValue steps along path (stop one before target for melee)
      const stepsAvailable = attackRange <= 1 ? moveValue : moveValue
      const stopIndex = Math.min(stepsAvailable, path.length - (attackRange <= 1 ? 2 : 1))
      if (stopIndex > 0) {
        const destination = path[stopIndex]
        onMove(monster, destination.id)
        // Update monster position for attack range check
        monster.spaceId = destination.id
      }
    }
  }

  // Attack phase
  const updatedMonsterSpace = grid.getById(monster.spaceId!)
  if (!updatedMonsterSpace) return
  const distToFocus = axialDistance(updatedMonsterSpace.coord, focusSpace.coord)

  const canAttack =
    attackRange <= 1
      ? distToFocus === 1
      : distToFocus <= attackRange && grid.hasLineOfSight(updatedMonsterSpace.coord, focusSpace.coord)

  if (canAttack) {
    queue.push({
      id: uuidv4(),
      priority: DeferredPriority.NORMAL,
      description: `${monster.monsterId} #${monster.number} attacks ${focus.name}`,
      execute: () => onAttack(monster, focus, attackValue),
    })
  }
}

/**
 * Draw and shuffle monster AI deck for a monster group each round.
 * Returns the drawn card.
 */
export function drawMonsterAICard(
  aiDeck: Array<{ id: string; initiative: number; shuffle: boolean }>,
  discard: Array<{ id: string; initiative: number; shuffle: boolean }>,
) {
  if (aiDeck.length === 0) {
    aiDeck.push(...discard.splice(0))
    shuffleArray(aiDeck)
  }
  const card = aiDeck.shift()!
  if (card.shuffle) {
    discard.push(card)
    aiDeck.push(...discard.splice(0))
    shuffleArray(aiDeck)
  } else {
    discard.push(card)
  }
  return card
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
