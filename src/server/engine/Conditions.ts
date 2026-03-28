import {
  ConditionType,
  ActiveCondition,
  IActorBase,
} from '../../common/types.js'

// Negative conditions that can be applied to any actor
export const NEGATIVE_CONDITIONS = new Set([
  ConditionType.POISON,
  ConditionType.WOUND,
  ConditionType.IMMOBILIZE,
  ConditionType.DISARM,
  ConditionType.STUN,
  ConditionType.MUDDLE,
  ConditionType.CURSE,
])

// Positive conditions
export const POSITIVE_CONDITIONS = new Set([
  ConditionType.BLESS,
  ConditionType.STRENGTHEN,
  ConditionType.INVISIBLE,
])

// Conditions that are removed immediately after their effect triggers
export const CONSUMED_ON_DRAW = new Set([
  ConditionType.BLESS,
  ConditionType.CURSE,
])

export function hasCondition(actor: IActorBase, type: ConditionType): boolean {
  return actor.conditions.some(c => c.type === type)
}

export function applyCondition(
  actor: IActorBase,
  type: ConditionType,
  sourceId: string,
): void {
  // Stun/Immobilize/Disarm can't be applied if actor is immune (checked by caller)
  // Bless and Curse can stack (multiple copies in modifier deck)
  if (CONSUMED_ON_DRAW.has(type)) {
    actor.conditions.push({ type, sourceId })
    return
  }
  // Other conditions: only one instance per type
  if (!hasCondition(actor, type)) {
    actor.conditions.push({ type, sourceId })
  }
}

export function removeCondition(actor: IActorBase, type: ConditionType): boolean {
  const index = actor.conditions.findIndex(c => c.type === type)
  if (index === -1) return false
  actor.conditions.splice(index, 1)
  return true
}

export function removeAllConditions(actor: IActorBase): void {
  actor.conditions = []
}

/**
 * End-of-round condition tick.
 * - POISON: deal 1 damage (caller handles HP)
 * - WOUND: deal 1 damage (caller handles HP)
 * - Other negative conditions expire at end of round
 * Returns { poisonDamage, woundDamage } to be applied by caller
 */
export function tickConditions(actor: IActorBase): { poisonDamage: number; woundDamage: number } {
  let poisonDamage = 0
  let woundDamage = 0

  if (hasCondition(actor, ConditionType.POISON)) {
    poisonDamage = 1
    removeCondition(actor, ConditionType.POISON)
  }

  if (hasCondition(actor, ConditionType.WOUND)) {
    woundDamage = 1
    // WOUND persists until healed; damage applies each round
  }

  // These expire at end of round
  for (const expiring of [
    ConditionType.STUN,
    ConditionType.DISARM,
    ConditionType.IMMOBILIZE,
    ConditionType.MUDDLE,
    ConditionType.STRENGTHEN,
    ConditionType.INVISIBLE,
  ] as ConditionType[]) {
    removeCondition(actor, expiring)
  }

  return { poisonDamage, woundDamage }
}

/**
 * Returns the attack modifier from conditions.
 * MUDDLE: -1 to attack, STRENGTHEN: +1 to attack
 */
export function getAttackModifierFromConditions(actor: IActorBase): number {
  let mod = 0
  if (hasCondition(actor, ConditionType.MUDDLE)) mod -= 1
  if (hasCondition(actor, ConditionType.STRENGTHEN)) mod += 1
  return mod
}

/**
 * Returns whether actor can act this turn.
 * STUN: cannot perform any action.
 */
export function isStunned(actor: IActorBase): boolean {
  return hasCondition(actor, ConditionType.STUN)
}

/**
 * Returns whether actor can move.
 * IMMOBILIZE: cannot move.
 */
export function isImmobilized(actor: IActorBase): boolean {
  return hasCondition(actor, ConditionType.IMMOBILIZE)
}

/**
 * Returns whether actor can attack.
 * DISARM: cannot attack.
 */
export function isDisarmed(actor: IActorBase): boolean {
  return hasCondition(actor, ConditionType.DISARM)
}

export function serializeConditions(conditions: ActiveCondition[]): ActiveCondition[] {
  return conditions.map(c => ({ ...c }))
}
