import { v4 as uuidv4 } from 'uuid'
import { Phase } from '../common/Phase.js'
import {
  SerializedGame,
  IPlayerBase,
  IMonsterToken,
  Element,
  ElementState,
  ElementStrength,
  ScenarioResult,
  LogEntry,
  ActorType,
  ActionType,
  PlayerInputPayload,
  CreateGamePayload,
  IMonsterDef,
  IScenarioDef,
} from '../common/types.js'
import { Player } from './Player.js'
import { Scenario } from './Scenario.js'
import { HexGrid } from './engine/HexGrid.js'
import { DeferredQueue } from './engine/DeferredQueue.js'
import { execute, canExecute, ExecutionContext } from './engine/Executor.js'
import { tickConditions } from './engine/Conditions.js'
import { resolveMonsterTurn } from './engine/MonsterAI.js'

function buildInitialElements(): ElementState {
  return {
    [Element.FIRE]: ElementStrength.INERT,
    [Element.ICE]: ElementStrength.INERT,
    [Element.AIR]: ElementStrength.INERT,
    [Element.EARTH]: ElementStrength.INERT,
    [Element.LIGHT]: ElementStrength.INERT,
    [Element.DARK]: ElementStrength.INERT,
  }
}

export class Game {
  gameId: string
  phase: Phase = Phase.LOBBY
  round: number = 0
  scenarioId: number
  scenarioLevel: number
  scenarioResult: ScenarioResult = ScenarioResult.IN_PROGRESS

  players: Map<string, Player> = new Map()
  scenario: Scenario
  monsterDefs: Map<string, IMonsterDef>
  elements: ElementState = buildInitialElements()
  initiativeOrder: string[] = []
  activeActorId: string | null = null
  log: LogEntry[] = []
  waitingForPlayerIds: string[] = []

  private deferredQueue: DeferredQueue = new DeferredQueue()
  private grid: HexGrid

  constructor(
    scenarioDef: IScenarioDef,
    monsterDefs: Map<string, IMonsterDef>,
    scenarioLevel = 1,
  ) {
    this.gameId = uuidv4()
    this.scenarioId = scenarioDef.id
    this.scenarioLevel = scenarioLevel
    this.scenario = new Scenario(scenarioDef)
    this.monsterDefs = monsterDefs
    this.grid = new HexGrid(this.scenario.spaces)
  }

  addPlayer(playerId: string, name: string, payload: CreateGamePayload, index: number): Player {
    const cardClass = payload.playerClasses[index]
    const player = new Player(playerId, name, cardClass)
    this.players.set(player.id, player)
    return player
  }

  startScenario(playerHands: Map<string, IPlayerBase['hand']>): void {
    // Assign starting spaces
    const startSpaces = (this.scenario.def as IScenarioDef & { playerStartSpaces: string[] }).playerStartSpaces ?? []
    let spaceIndex = 0
    for (const player of this.players.values()) {
      const hand = playerHands.get(player.playerId)
      if (hand) player.hand = hand
      const spaceId = startSpaces[spaceIndex++] ?? null
      player.spaceId = spaceId
      if (spaceId) {
        const space = this.scenario.spaces.find(s => s.id === spaceId)
        if (space) space.occupantId = player.id
      }
    }

    this.scenario.spawnMonsters(this.monsterDefs, this.scenarioLevel, this.players.size)
    this.grid = new HexGrid(this.scenario.spaces)
    this.phase = Phase.CARD_SELECTION
    this.round = 1
    this.waitingForPlayerIds = Array.from(this.players.keys())
    this.addLog('system', `Scenario ${this.scenarioId} started — Round 1`)
  }

  // ─── Phase: Card Selection ────────────────────────────────────────────────

  processCardSelection(playerId: string, topCardId: string, bottomCardId: string): void {
    const player = this.getPlayerByPlayerId(playerId)
    if (!player) throw new Error(`Player ${playerId} not found`)
    player.selectCards(topCardId, bottomCardId)
    this.waitingForPlayerIds = this.waitingForPlayerIds.filter(id => id !== playerId)

    if (this.waitingForPlayerIds.length === 0) {
      this.transitionToInitiativeReveal()
    }
  }

  private transitionToInitiativeReveal(): void {
    // Draw AI cards for each monster group
    const monsterGroups = new Set(
      Array.from(this.scenario.monsters.values()).map(m => m.monsterId),
    )
    for (const groupId of monsterGroups) {
      this.scenario.drawAICardForGroup(groupId)
    }

    this.phase = Phase.INITIATIVE_REVEAL
    this.buildInitiativeOrder()
    this.transitionToRoundActions()
  }

  private buildInitiativeOrder(): void {
    const actors: Array<{ id: string; initiative: number }> = []

    for (const player of this.players.values()) {
      actors.push({ id: player.id, initiative: player.initiative })
    }
    for (const monster of this.scenario.monsters.values()) {
      actors.push({ id: monster.id, initiative: monster.initiative })
    }

    // Sort ascending (lower initiative = earlier)
    actors.sort((a, b) => a.initiative - b.initiative)
    this.initiativeOrder = actors.map(a => a.id)
  }

  private transitionToRoundActions(): void {
    this.phase = Phase.ROUND_ACTIONS
    this.activeActorId = this.initiativeOrder[0] ?? null
    this.addLog('system', `Round ${this.round} — actions begin (order: ${this.initiativeOrder.join(', ')})`)
  }

  // ─── Phase: Round Actions ─────────────────────────────────────────────────

  processPlayerAction(payload: PlayerInputPayload): void {
    const player = this.getPlayerByPlayerId(payload.playerId)
    if (!player) throw new Error(`Player ${payload.playerId} not found`)

    // Card selection happens simultaneously — skip active-actor check
    if (payload.action === 'SELECT_CARDS') {
      if (this.phase !== Phase.CARD_SELECTION) throw new Error('Not in card selection phase')
      if (!this.waitingForPlayerIds.includes(payload.playerId)) throw new Error('Already submitted cards')
      this.processCardSelection(
        payload.playerId,
        (payload.data?.topCardId as string),
        (payload.data?.bottomCardId as string),
      )
      return
    }

    if (this.activeActorId !== player.id) throw new Error('Not this player\'s turn')

    switch (payload.action as ActionType) {

      case 'MOVE': {
        const toSpaceId = payload.data?.spaceId as string
        if (!toSpaceId) throw new Error('spaceId required for MOVE')
        this.moveActor(player, toSpaceId)
        break
      }

      case 'ATTACK': {
        const targetId = payload.data?.targetId as string
        const cardId = payload.data?.cardId as string
        const useTop = payload.data?.useTop as boolean
        if (!targetId || !cardId) throw new Error('targetId and cardId required for ATTACK')
        this.playerAttack(player, cardId, useTop, targetId)
        break
      }

      case 'END_TURN':
        this.endActorTurn(player.id)
        break

      case 'LONG_REST':
        this.playerLongRest(player)
        break

      default:
        throw new Error(`Unknown action: ${payload.action}`)
    }

    // Flush deferred queue
    this.flushDeferredQueue()
  }

  private moveActor(player: Player, toSpaceId: string): void {
    const fromSpace = this.scenario.spaces.find(s => s.id === player.spaceId)
    const toSpace = this.scenario.spaces.find(s => s.id === toSpaceId)
    if (!toSpace) throw new Error(`Space ${toSpaceId} not found`)
    if (!this.grid.isPassable(toSpace.coord)) throw new Error(`Space ${toSpaceId} is not passable`)

    if (fromSpace) fromSpace.occupantId = undefined
    toSpace.occupantId = player.id
    player.spaceId = toSpaceId
    this.grid = new HexGrid(this.scenario.spaces)
    this.addLog(player.id, `moved to ${toSpaceId}`)

    // Check if door crossed — reveal adjacent room
    if (toSpace.terrain === 'DOOR' as typeof toSpace.terrain) {
      this.scenario.revealRoom(toSpace.roomId + 1, this.monsterDefs, this.scenarioLevel)
      this.grid = new HexGrid(this.scenario.spaces)
    }
  }

  private playerAttack(player: Player, cardId: string, useTop: boolean, targetId: string): void {
    const card = player.hand.find(c => c.id === cardId)
    if (!card) throw new Error(`Card ${cardId} not in hand`)

    const half = useTop ? card.top : card.bottom
    const target = this.findActor(targetId)
    if (!target) throw new Error(`Target ${targetId} not found`)

    const ctx: ExecutionContext = {
      source: player,
      targets: [target],
      grid: this.grid,
      elements: this.elements,
      getModifierDeck: (actorId) => {
        const p = this.players.get(actorId)
        if (p) return { deck: p.modifierDeck, discard: p.modifierDiscard }
        return { deck: [], discard: [] }
      },
      onDamage: (t, amount) => this.applyDamage(t as IMonsterToken | IPlayerBase, amount),
      onHeal: (t, amount) => this.applyHeal(t as IMonsterToken | IPlayerBase, amount),
      onDeath: (a) => this.handleDeath(a as IMonsterToken | IPlayerBase),
      onLoot: (a, spaceId) => this.handleLoot(a as IMonsterToken | IPlayerBase, spaceId),
      addLog: (actorId, msg) => this.addLog(actorId, msg),
    }

    if (canExecute(half.behavior, ctx)) {
      execute(half.behavior, ctx)
    }

    if (half.lossOnUse) {
      card.lost = true
    }
  }

  private playerLongRest(player: Player): void {
    // Long rest: recover lost cards (lose 1), +2 HP
    const lostCards = player.hand.filter(c => c.lost)
    if (lostCards.length > 0) {
      lostCards[0].lost = false
      lostCards.splice(0, 1)
    }
    player.heal(2)
    this.addLog(player.id, 'long rested (+2 HP, recovered lost cards)')
    this.endActorTurn(player.id)
  }

  private endActorTurn(actorId: string): void {
    const actor = this.findActor(actorId)
    if (actor) actor.acted = true

    const currentIndex = this.initiativeOrder.indexOf(actorId)
    const nextIndex = currentIndex + 1

    if (nextIndex >= this.initiativeOrder.length) {
      this.transitionToEndOfRound()
    } else {
      this.activeActorId = this.initiativeOrder[nextIndex]
      // Auto-resolve monster turns
      this.autoResolveMonsterTurn()
    }
  }

  private autoResolveMonsterTurn(): void {
    while (this.activeActorId) {
      const monster = this.scenario.monsters.get(this.activeActorId)
      if (!monster) break  // It's a player's turn

      const stats = this.scenario.getMonsterStats(
        monster.monsterId, monster.isElite, this.scenarioLevel, this.monsterDefs,
      )
      if (!stats) { this.endActorTurn(monster.id); continue }

      const players = Array.from(this.players.values())

      resolveMonsterTurn(
        monster,
        players,
        this.grid,
        stats.move,
        stats.attack,
        stats.range,
        this.deferredQueue,
        (m, toSpaceId) => {
          const fromSpace = this.scenario.spaces.find(s => s.id === m.spaceId)
          const toSpace = this.scenario.spaces.find(s => s.id === toSpaceId)
          if (fromSpace) fromSpace.occupantId = undefined
          if (toSpace) { toSpace.occupantId = m.id; m.spaceId = toSpaceId }
          this.grid = new HexGrid(this.scenario.spaces)
          this.addLog(m.id, `moved to ${toSpaceId}`)
        },
        (m, target, finalAttack) => {
          this.applyDamage(target, finalAttack)
          this.addLog(m.id, `attacked ${target.id} for ${finalAttack}`)
        },
      )

      this.flushDeferredQueue()
      this.endActorTurn(monster.id)
    }
  }

  // ─── Phase: End of Round ──────────────────────────────────────────────────

  private transitionToEndOfRound(): void {
    this.phase = Phase.END_OF_ROUND

    // Tick conditions and apply end-of-round damage
    for (const player of this.players.values()) {
      const { poisonDamage, woundDamage } = player.endOfRound()
      if (poisonDamage > 0) this.applyDamage(player, poisonDamage)
      if (woundDamage > 0) this.applyDamage(player, woundDamage)
    }
    for (const monster of this.scenario.monsters.values()) {
      const { poisonDamage, woundDamage } = tickConditions(monster)
      if (poisonDamage > 0) this.applyDamage(monster, poisonDamage)
      if (woundDamage > 0) this.applyDamage(monster, woundDamage)
      monster.acted = false
    }

    // Decay elements
    for (const element of Object.values(Element)) {
      if (this.elements[element] === ElementStrength.STRONG) {
        this.elements[element] = ElementStrength.WANING
      } else if (this.elements[element] === ElementStrength.WANING) {
        this.elements[element] = ElementStrength.INERT
      }
    }

    this.checkScenarioEnd()

    if (this.scenarioResult === ScenarioResult.IN_PROGRESS) {
      this.round++
      this.phase = Phase.CARD_SELECTION
      this.waitingForPlayerIds = Array.from(this.players.keys())
      this.addLog('system', `Round ${this.round} — card selection`)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private applyDamage(target: IMonsterToken | IPlayerBase, amount: number): void {
    target.hp = Math.max(0, target.hp - amount)
    if (target.hp === 0) {
      this.handleDeath(target)
    }
  }

  private applyHeal(target: IMonsterToken | IPlayerBase, amount: number): void {
    target.hp = Math.min(target.maxHp, target.hp + amount)
  }

  private handleDeath(actor: IMonsterToken | IPlayerBase): void {
    if (actor.type === ActorType.MONSTER) {
      this.addLog(actor.id, `${(actor as IMonsterToken).monsterId} #${(actor as IMonsterToken).number} defeated`)
      this.scenario.removeMonster(actor.id)
      this.initiativeOrder = this.initiativeOrder.filter(id => id !== actor.id)
    } else {
      const player = actor as IPlayerBase
      player.hp = 0
      this.addLog(actor.id, `${player.name} is exhausted`)
      ;(actor as any).exhausted = true
    }
    this.checkScenarioEnd()
  }

  private handleLoot(actor: IMonsterToken | IPlayerBase, spaceId: string): void {
    const space = this.scenario.spaces.find(s => s.id === spaceId)
    if (!space?.loot) return
    if (actor.type === ActorType.PLAYER) {
      const player = actor as IPlayerBase
      player.gold += space.loot.gold
      this.addLog(actor.id, `looted ${space.loot.gold} gold`)
    }
    space.loot = undefined
  }

  private checkScenarioEnd(): void {
    if (this.scenario.def.goal === 'KILL_ALL' && this.scenario.allMonstersDefeated()) {
      this.scenarioResult = ScenarioResult.VICTORY
      this.phase = Phase.SCENARIO_END
      this.addLog('system', 'VICTORY — all enemies defeated')
      return
    }

    const allExhausted = Array.from(this.players.values()).every(p => p.exhausted || p.hp <= 0)
    if (allExhausted) {
      this.scenarioResult = ScenarioResult.DEFEAT
      this.phase = Phase.SCENARIO_END
      this.addLog('system', 'DEFEAT — all players exhausted')
    }
  }

  private flushDeferredQueue(): void {
    while (!this.deferredQueue.isEmpty()) {
      const action = this.deferredQueue.pop()!
      action.execute()
    }
  }

  private findActor(actorId: string): IMonsterToken | IPlayerBase | null {
    if (this.players.has(actorId)) return this.players.get(actorId)!
    if (this.scenario.monsters.has(actorId)) return this.scenario.monsters.get(actorId)!
    return null
  }

  private getPlayerByPlayerId(playerId: string): Player | undefined {
    for (const p of this.players.values()) {
      if (p.playerId === playerId) return p
    }
    return undefined
  }

  addLog(actorId: string, message: string): void {
    this.log.push({ round: this.round, actorId, message, timestamp: Date.now() })
  }

  serialize(): SerializedGame {
    const scenarioData = this.scenario.serialize()
    return {
      gameId: this.gameId,
      phase: this.phase,
      round: this.round,
      scenarioId: this.scenarioId,
      scenarioLevel: this.scenarioLevel,
      scenarioResult: this.scenarioResult,
      spaces: scenarioData.spaces,
      revealedRooms: scenarioData.revealedRooms,
      players: Array.from(this.players.values()).map(p => p.serialize()),
      monsters: scenarioData.monsters as IMonsterToken[],
      elements: { ...this.elements },
      initiativeOrder: [...this.initiativeOrder],
      activeActorId: this.activeActorId,
      log: this.log.slice(-100),
      waitingForPlayerIds: [...this.waitingForPlayerIds],
    }
  }
}
