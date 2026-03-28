// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ConditionType {
  POISON = 'POISON',
  WOUND = 'WOUND',
  IMMOBILIZE = 'IMMOBILIZE',
  DISARM = 'DISARM',
  STUN = 'STUN',
  MUDDLE = 'MUDDLE',
  CURSE = 'CURSE',
  BLESS = 'BLESS',
  STRENGTHEN = 'STRENGTHEN',
  INVISIBLE = 'INVISIBLE',
}

export enum Element {
  FIRE = 'FIRE',
  ICE = 'ICE',
  AIR = 'AIR',
  EARTH = 'EARTH',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

export enum ElementStrength {
  INERT = 'INERT',
  WANING = 'WANING',
  STRONG = 'STRONG',
}

export enum TerrainType {
  NORMAL = 'NORMAL',
  WALL = 'WALL',
  OBSTACLE = 'OBSTACLE',
  DIFFICULT = 'DIFFICULT',
  TRAP = 'TRAP',
  DOOR = 'DOOR',
  CORRIDOR = 'CORRIDOR',
}

export enum ActorType {
  PLAYER = 'PLAYER',
  MONSTER = 'MONSTER',
}

export enum TargetType {
  SINGLE = 'SINGLE',
  ALL_ADJACENT = 'ALL_ADJACENT',
  ALL_IN_RANGE = 'ALL_IN_RANGE',
}

export enum AoeShape {
  CONE = 'CONE',
  LINE = 'LINE',
  STAR = 'STAR',
}

export enum CardClass {
  INOX_DRIFTER = 'INOX_DRIFTER',
  VALRATH_RED_GUARD = 'VALRATH_RED_GUARD',
  QUATRYL_DEMOLITIONIST = 'QUATRYL_DEMOLITIONIST',
  AESTHER_HATCHET = 'AESTHER_HATCHET',
}

export enum ModifierCardType {
  NORMAL = 'NORMAL',    // +0, +1, +2, -1, -2, x2, MISS
  BLESS = 'BLESS',      // x2, removed after draw
  CURSE = 'CURSE',      // MISS, removed after draw
  ROLLING = 'ROLLING',  // chain modifier, draw again
}

export enum ScenarioResult {
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
  IN_PROGRESS = 'IN_PROGRESS',
}

// ─── Coordinates ──────────────────────────────────────────────────────────────

export interface AxialCoord {
  q: number
  r: number
}

// ─── Board ────────────────────────────────────────────────────────────────────

export type SpaceId = string

export interface LootToken {
  gold: number
  itemId?: string
}

export interface TrapData {
  damage: number
  conditions: ConditionType[]
}

export interface ISpace {
  id: SpaceId
  coord: AxialCoord
  terrain: TerrainType
  occupantId?: string       // actorId of monster or player token
  loot?: LootToken
  trap?: TrapData
  doorOpen?: boolean
  roomId: number            // which room tile this hex belongs to
}

// ─── Conditions ───────────────────────────────────────────────────────────────

export interface ActiveCondition {
  type: ConditionType
  sourceId: string          // actorId that applied it
}

// ─── Actors ───────────────────────────────────────────────────────────────────

export interface IActorBase {
  id: string
  type: ActorType
  hp: number
  maxHp: number
  conditions: ActiveCondition[]
  spaceId: SpaceId | null
  initiative: number
  acted: boolean            // has taken turn this round
}

// ─── Behaviors ────────────────────────────────────────────────────────────────

export interface AttackBehavior {
  value: number
  range: number
  target: TargetType
  aoe?: AoeShape
  conditions?: ConditionType[]  // conditions applied on hit
  pierce?: number
  push?: number
  pull?: number
}

export interface MoveBehavior {
  value: number
  jump?: boolean
  flying?: boolean
}

export interface Behavior {
  attack?: AttackBehavior
  move?: MoveBehavior
  heal?: number
  shield?: number
  retaliate?: number
  loot?: number                 // loot range in hexes
  applyCondition?: ConditionType
  removeCondition?: ConditionType
  drawModifier?: boolean
  consumeElement?: Element
  produceElement?: Element
  xp?: number                   // XP gained on use
}

// ─── Modifier Deck ────────────────────────────────────────────────────────────

export interface ModifierCard {
  id: string
  type: ModifierCardType
  value: number             // +2 = 2, -1 = -1, x2 = special, MISS = special
  multiply?: boolean        // true for x2
  miss?: boolean            // true for MISS
  rolling?: boolean         // chain: draw another
  shuffle?: boolean         // reshuffle deck after this draw
}

// ─── Ability Cards ────────────────────────────────────────────────────────────

export interface AbilityCardHalf {
  behavior: Behavior
  persistent?: boolean      // slot on board until used
  lossOnUse?: boolean       // long rest to recover
}

export interface IAbilityCard {
  id: string
  name: string
  cardClass: CardClass
  level: number             // 1 = starter, X = special, 2-9 = advanced
  initiative: number        // 1-99, set by top card half
  top: AbilityCardHalf
  bottom: AbilityCardHalf
  lost?: boolean            // burned/lost this scenario
}

// ─── Monster AI Card ──────────────────────────────────────────────────────────

export interface MonsterAICard {
  id: string
  initiative: number
  shuffle: boolean          // reshuffle deck after this card drawn
  top: Behavior
  bottom: Behavior
}

// ─── Monster ──────────────────────────────────────────────────────────────────

export interface MonsterStats {
  hp: number
  move: number
  attack: number
  range: number
  immunities: ConditionType[]
  special?: string[]         // text descriptions of special abilities
}

export interface IMonsterDef {
  name: string
  isBoss: boolean
  levels: {
    [scenarioLevel: number]: {
      normal: MonsterStats
      elite: MonsterStats
    }
  }
  aiDeck: MonsterAICard[]
}

export interface IMonsterToken extends IActorBase {
  type: ActorType.MONSTER
  monsterId: string         // references IMonsterDef.name
  isElite: boolean
  number: number            // 1-6 standee number
  currentAICard?: MonsterAICard
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface IPlayerBase extends IActorBase {
  type: ActorType.PLAYER
  playerId: string
  name: string
  cardClass: CardClass
  level: number
  xp: number
  gold: number
  hand: IAbilityCard[]            // cards in hand this scenario (max 2 selected)
  selectedCards: [string, string] | null  // [topCardId, bottomCardId] or null
  selectedCardHalves: { topCardId: string; useTop: boolean; bottomCardId: string; useBottom: boolean } | null
  modifierDeck: ModifierCard[]
  modifierDiscard: ModifierCard[]
  exhausted: boolean
}

// ─── Items ────────────────────────────────────────────────────────────────────

export interface IItem {
  id: string
  name: string
  cost: number
  slot: 'HEAD' | 'BODY' | 'LEGS' | 'ONE_HAND' | 'TWO_HAND' | 'SMALL'
  behavior: Behavior
  charges?: number          // uses per scenario; null = unlimited
  consumable?: boolean      // single use ever
}

// ─── Scenario ─────────────────────────────────────────────────────────────────

export interface MonsterSpawn {
  monsterId: string
  isElite: boolean
  number: number
  spaceId: SpaceId
  roomId: number            // spawns when room revealed
}

export interface IScenarioDef {
  id: number
  name: string
  level: number
  spaces: ISpace[]
  monsterSpawns: MonsterSpawn[]
  initialRevealedRooms: number[]
  goalDescription: string
  goal: 'KILL_ALL' | 'KILL_BOSS' | 'REACH_EXIT' | 'CUSTOM'
  rewards: {
    gold: number
    xp: number
    unlocks?: number[]      // scenario ids unlocked on completion
  }
}

// ─── Elements ─────────────────────────────────────────────────────────────────

export type ElementState = Record<Element, ElementStrength>

// ─── Log ──────────────────────────────────────────────────────────────────────

export interface LogEntry {
  round: number
  actorId: string
  message: string
  timestamp: number
}

// ─── Serialized Game (client ↔ server contract) ───────────────────────────────

export interface SerializedGame {
  gameId: string
  phase: string             // Phase enum value
  round: number
  scenarioId: number
  scenarioLevel: number
  scenarioResult: ScenarioResult
  spaces: ISpace[]
  revealedRooms: number[]
  players: IPlayerBase[]
  monsters: IMonsterToken[]
  elements: ElementState
  initiativeOrder: string[] // actorIds in order
  activeActorId: string | null
  log: LogEntry[]
  waitingForPlayerIds: string[]
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface CreateGamePayload {
  playerNames: string[]
  playerClasses: CardClass[]
  scenarioId: number
}

export type ActionType =
  | 'SELECT_CARDS'
  | 'PLAY_TOP'
  | 'PLAY_BOTTOM'
  | 'MOVE'
  | 'ATTACK'
  | 'LOOT'
  | 'SHORT_REST'
  | 'LONG_REST'
  | 'END_TURN'

export interface PlayerInputPayload {
  gameId: string
  playerId: string
  action: ActionType
  data?: Record<string, unknown>
}
