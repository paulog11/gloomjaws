import type { AoeShape, CardClass, IPlayerBase, MonsterAICard } from './types.js'

// ─── Pokemon Type ─────────────────────────────────────────────────────────────

export enum PokemonType {
  NORMAL   = 'NORMAL',
  FIRE     = 'FIRE',
  WATER    = 'WATER',
  ELECTRIC = 'ELECTRIC',
  GRASS    = 'GRASS',
  ICE      = 'ICE',
  FIGHTING = 'FIGHTING',
  POISON   = 'POISON',
  GROUND   = 'GROUND',
  FLYING   = 'FLYING',
  PSYCHIC  = 'PSYCHIC',
  BUG      = 'BUG',
  ROCK     = 'ROCK',
  GHOST    = 'GHOST',
  DRAGON   = 'DRAGON',
  DARK     = 'DARK',
  STEEL    = 'STEEL',
  FAIRY    = 'FAIRY',
}

// ─── Move Category ────────────────────────────────────────────────────────────

export enum MoveCategory {
  PHYSICAL = 'PHYSICAL',  // Damage uses Attack vs Defense
  SPECIAL  = 'SPECIAL',   // Damage uses SpecialAttack vs SpecialDefense
  STATUS   = 'STATUS',    // No direct damage; applies effects only
}

// ─── Pokemon-specific Status Effects ─────────────────────────────────────────
// POISON, STUN, IMMOBILIZE, MUDDLE from the existing ConditionType enum cover
// Poisoned, full Paralysis (no act), partial Paralysis (no move), and Confused
// self-attack penalty. These add effects the existing system can't express.

export enum PokemonStatusEffect {
  BURN        = 'BURN',        // 1/8 max HP damage per round; -50% physical attack
  FREEZE      = 'FREEZE',      // Cannot act; 20% chance to thaw each round
  SLEEP       = 'SLEEP',       // Cannot act for 1–3 rounds (rolled on application)
  CONFUSION   = 'CONFUSION',   // 33% chance to hurt self instead of acting
  FLINCH      = 'FLINCH',      // Skip next action; expires immediately after
  LEECH_SEED  = 'LEECH_SEED',  // Drain HP each round, healing the seeder
  INFATUATION = 'INFATUATION', // 50% chance to skip action (source-dependent)
}

// ─── Stat Stages ─────────────────────────────────────────────────────────────
// Per-battle stat modifiers, each ranging from -6 to +6. Reset each scenario.

export interface StatStages {
  attack:         number  // -6 to +6
  defense:        number
  specialAttack:  number
  specialDefense: number
  speed:          number
  accuracy:       number  // Affects outgoing hit-rolls
  evasion:        number  // Affects incoming hit-rolls
}

// ─── Pokemon Move Behavior ────────────────────────────────────────────────────
// Declarative data — no runtime functions. Stored in JSON card files and
// executed by the server's Executor. Parallel to the existing Behavior interface.

export interface PokemonMoveBehavior {
  // Core damage fields
  power?:    number        // Base power; omit or 0 for STATUS moves
  category?: MoveCategory  // Determines which stat pair resolves damage
  moveType:  PokemonType   // Used for type-effectiveness and STAB bonus

  // Accuracy and priority
  accuracy?: number        // 0–100; omit = always hits
  priority?: number        // Higher fires before lower within same initiative; default 0
  powerPoints: number      // Total uses per scenario (like Gloomhaven card hand size)

  // Targeting (reuses existing engine vocabulary)
  range?: number           // Hex range; 1 = adjacent melee
  aoe?:   AoeShape         // CONE | LINE | STAR for multi-target moves

  // Status effects applied on use
  applyStatus?:       PokemonStatusEffect  // Applied to target on hit
  applyStatusChance?: number               // 0–100; omit = always applies
  applyStatusToSelf?: PokemonStatusEffect  // Applied to the user (e.g. charging states)

  // Stat stage changes
  targetStatStages?: Partial<StatStages>  // Applied to target(s)
  selfStatStages?:   Partial<StatStages>  // Applied to the user

  // Recovery
  heal?:        number  // Flat HP recovered by user
  healPercent?: number  // % of maxHp recovered (e.g. Recover = 50)
  drain?:       number  // % of damage dealt returned as HP (e.g. Giga Drain = 50)

  // Special mechanics
  recoil?:       number                        // % of damage dealt taken by user
  multiHit?:     { min: number; max: number }  // Random hit count range (e.g. Fury Attack)
  chargeRound?:  boolean                       // Two-turn move (charges on first turn)
  flinchChance?: number                        // 0–100 chance to apply FLINCH on hit
}

// ─── Pokemon Card ─────────────────────────────────────────────────────────────
// Each card has two moves (top and bottom), matching the existing IAbilityCard
// structure so it plugs into existing card-selection and hand logic.

export interface PokemonCardHalf {
  behavior:              PokemonMoveBehavior
  powerPointsRemaining?: number  // Runtime tracking; initialized from behavior.powerPoints
  lossOnUse?:            boolean
}

export interface PokemonCard {
  id:         string
  name:       string
  initiative: number  // Derived from the Pokemon's Speed stat at round start
  top:        PokemonCardHalf
  bottom:     PokemonCardHalf
}

// ─── Pokemon Player (runtime) ─────────────────────────────────────────────────
// Extends the shared IPlayerBase so Pokemon entities slot into the existing
// player map in Game.ts without structural engine changes.

export interface IPokemonPlayerBase extends IPlayerBase {
  pokemonType:    PokemonType
  secondaryType?: PokemonType

  // Base stats loaded from PokemonCharDef (immutable per scenario)
  baseAttack:         number
  baseDefense:        number
  baseSpecialAttack:  number
  baseSpecialDefense: number
  baseSpeed:          number

  // Per-battle modifiers (reset at scenario start)
  statStages: StatStages

  // Pokemon-specific status effects (complements the existing conditions[] array)
  pokemonStatus: PokemonStatusEffect[]

  // Evolution
  evolutionLevel?: number    // Level threshold for evolution
  evolvesInto?:    CardClass  // CardClass to swap to on evolution
}

// ─── Pokemon Character Definition (data file schema) ─────────────────────────
// The shape of treecko.json, torchic.json, mudkip.json.
// hp[] stays (one value per scenario level 0–9); cards[] is now typed.

export interface PokemonCharDef {
  id:             string       // Matches CardClass enum value (e.g. 'TREECKO')
  name:           string
  pokemonType:    PokemonType
  secondaryType?: PokemonType
  hp:             number[]     // 10 values indexed by scenario level
  baseStats: {
    attack:         number
    defense:        number
    specialAttack:  number
    specialDefense: number
    speed:          number
  }
  evolutionLevel?: number
  evolvesInto?:    string     // CardClass string value
  cards:           PokemonCard[]
}

// ─── Wild Pokemon Definition ──────────────────────────────────────────────────
// Server-side counterpart to IMonsterDef for Pokemon mode encounters.

export interface WildPokemonStats {
  hp:             number
  attack:         number
  defense:        number
  specialAttack:  number
  specialDefense: number
  speed:          number
  moves:          string[]  // PokemonCard ids from this wild Pokemon's move pool
}

export interface WildPokemonDef {
  id:             string       // e.g. 'ZIGZAGOON'
  name:           string
  pokemonType:    PokemonType
  secondaryType?: PokemonType
  catchable:      boolean      // Whether the player can attempt to catch it
  isBoss:         boolean      // Gym leader's ace, rival's team, etc.
  levels: {
    [scenarioLevel: number]: WildPokemonStats
  }
  aiDeck: MonsterAICard[]  // Reuse existing AI card structure for move selection
}

// ─── Type Effectiveness ───────────────────────────────────────────────────────
// The full 18×18 chart lives in src/server/engine/PokemonTypeChart.ts.
// This type alias is shared here so the client can type-check effectiveness
// labels ("super effective!", "not very effective…", "no effect").

export type TypeEffectivenessMultiplier = 0 | 0.5 | 1 | 2
