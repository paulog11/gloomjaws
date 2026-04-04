import { describe, it, expect } from 'vitest'
import {
  hasCondition,
  applyCondition,
  removeCondition,
  tickConditions,
  isStunned,
  isImmobilized,
  isDisarmed,
  getAttackModifierFromConditions,
} from '../server/engine/Conditions.js'
import { IActorBase, ActorType, ConditionType } from '../common/types.js'

function makeActor(overrides: Partial<IActorBase> = {}): IActorBase {
  return {
    id: 'actor-1',
    type: ActorType.MONSTER,
    hp: 10,
    maxHp: 10,
    conditions: [],
    spaceId: 's1',
    initiative: 20,
    acted: false,
    ...overrides,
  }
}

describe('hasCondition', () => {
  it('returns false when actor has no conditions', () => {
    const actor = makeActor()
    expect(hasCondition(actor, ConditionType.POISON)).toBe(false)
  })

  it('returns true when condition is present', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.STUN, sourceId: 'src' }] })
    expect(hasCondition(actor, ConditionType.STUN)).toBe(true)
  })
})

describe('applyCondition', () => {
  it('adds a condition to an actor', () => {
    const actor = makeActor()
    applyCondition(actor, ConditionType.POISON, 'src')
    expect(hasCondition(actor, ConditionType.POISON)).toBe(true)
  })

  it('does not duplicate non-stackable conditions', () => {
    const actor = makeActor()
    applyCondition(actor, ConditionType.STUN, 'src')
    applyCondition(actor, ConditionType.STUN, 'src')
    expect(actor.conditions.filter(c => c.type === ConditionType.STUN).length).toBe(1)
  })

  it('stacks BLESS (consumed-on-draw)', () => {
    const actor = makeActor()
    applyCondition(actor, ConditionType.BLESS, 'src')
    applyCondition(actor, ConditionType.BLESS, 'src')
    expect(actor.conditions.filter(c => c.type === ConditionType.BLESS).length).toBe(2)
  })

  it('stacks CURSE (consumed-on-draw)', () => {
    const actor = makeActor()
    applyCondition(actor, ConditionType.CURSE, 'src')
    applyCondition(actor, ConditionType.CURSE, 'src')
    expect(actor.conditions.filter(c => c.type === ConditionType.CURSE).length).toBe(2)
  })
})

describe('removeCondition', () => {
  it('removes the condition and returns true', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.WOUND, sourceId: 'src' }] })
    const result = removeCondition(actor, ConditionType.WOUND)
    expect(result).toBe(true)
    expect(hasCondition(actor, ConditionType.WOUND)).toBe(false)
  })

  it('returns false when condition is not present', () => {
    const actor = makeActor()
    expect(removeCondition(actor, ConditionType.WOUND)).toBe(false)
  })

  it('removes only one instance when condition is stacked', () => {
    const actor = makeActor({
      conditions: [
        { type: ConditionType.BLESS, sourceId: 'src' },
        { type: ConditionType.BLESS, sourceId: 'src' },
      ],
    })
    removeCondition(actor, ConditionType.BLESS)
    expect(actor.conditions.filter(c => c.type === ConditionType.BLESS).length).toBe(1)
  })
})

describe('tickConditions', () => {
  it('deals 1 poison damage and removes POISON', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.POISON, sourceId: 'src' }] })
    const { poisonDamage } = tickConditions(actor)
    expect(poisonDamage).toBe(1)
    expect(hasCondition(actor, ConditionType.POISON)).toBe(false)
  })

  it('deals 1 wound damage and keeps WOUND', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.WOUND, sourceId: 'src' }] })
    const { woundDamage } = tickConditions(actor)
    expect(woundDamage).toBe(1)
    expect(hasCondition(actor, ConditionType.WOUND)).toBe(true)
  })

  it('returns 0 damage when no relevant conditions', () => {
    const actor = makeActor()
    const { poisonDamage, woundDamage } = tickConditions(actor)
    expect(poisonDamage).toBe(0)
    expect(woundDamage).toBe(0)
  })

  it('removes STUN at end of round', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.STUN, sourceId: 'src' }] })
    tickConditions(actor)
    expect(hasCondition(actor, ConditionType.STUN)).toBe(false)
  })

  it('removes IMMOBILIZE at end of round', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.IMMOBILIZE, sourceId: 'src' }] })
    tickConditions(actor)
    expect(hasCondition(actor, ConditionType.IMMOBILIZE)).toBe(false)
  })

  it('removes STRENGTHEN at end of round', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.STRENGTHEN, sourceId: 'src' }] })
    tickConditions(actor)
    expect(hasCondition(actor, ConditionType.STRENGTHEN)).toBe(false)
  })
})

describe('isStunned / isImmobilized / isDisarmed', () => {
  it('isStunned returns true only when STUN present', () => {
    const actor = makeActor()
    expect(isStunned(actor)).toBe(false)
    applyCondition(actor, ConditionType.STUN, 'src')
    expect(isStunned(actor)).toBe(true)
  })

  it('isImmobilized returns true only when IMMOBILIZE present', () => {
    const actor = makeActor()
    expect(isImmobilized(actor)).toBe(false)
    applyCondition(actor, ConditionType.IMMOBILIZE, 'src')
    expect(isImmobilized(actor)).toBe(true)
  })

  it('isDisarmed returns true only when DISARM present', () => {
    const actor = makeActor()
    expect(isDisarmed(actor)).toBe(false)
    applyCondition(actor, ConditionType.DISARM, 'src')
    expect(isDisarmed(actor)).toBe(true)
  })
})

describe('getAttackModifierFromConditions', () => {
  it('returns 0 with no conditions', () => {
    expect(getAttackModifierFromConditions(makeActor())).toBe(0)
  })

  it('returns -1 with MUDDLE', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.MUDDLE, sourceId: 'src' }] })
    expect(getAttackModifierFromConditions(actor)).toBe(-1)
  })

  it('returns +1 with STRENGTHEN', () => {
    const actor = makeActor({ conditions: [{ type: ConditionType.STRENGTHEN, sourceId: 'src' }] })
    expect(getAttackModifierFromConditions(actor)).toBe(1)
  })

  it('returns 0 with both MUDDLE and STRENGTHEN', () => {
    const actor = makeActor({
      conditions: [
        { type: ConditionType.MUDDLE, sourceId: 'src' },
        { type: ConditionType.STRENGTHEN, sourceId: 'src' },
      ],
    })
    expect(getAttackModifierFromConditions(actor)).toBe(0)
  })
})
