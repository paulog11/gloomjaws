import { describe, it, expect } from 'vitest'
import {
  buildBaseModifierDeck,
  drawModifier,
  resolveModifiers,
} from '../server/engine/ModifierDeck.js'
import { ModifierCard, ModifierCardType } from '../common/types.js'

function makeCard(value: number, opts: Partial<ModifierCard> = {}): ModifierCard {
  return { id: crypto.randomUUID(), type: ModifierCardType.NORMAL, value, ...opts }
}

describe('buildBaseModifierDeck', () => {
  it('produces exactly 20 cards', () => {
    expect(buildBaseModifierDeck().length).toBe(20)
  })

  it('contains the correct distribution of values', () => {
    const deck = buildBaseModifierDeck()
    const counts: Record<number, number> = {}
    for (const card of deck) counts[card.value] = (counts[card.value] ?? 0) + 1

    // x2 and MISS also have value 0, so total value-0 cards = 8 (6 normal + 1 x2 + 1 MISS)
    const zeroCards = deck.filter(c => c.value === 0)
    expect(zeroCards.length).toBe(8)

    expect(counts[1]).toBe(5)
    expect(counts[2]).toBe(1)
    expect(counts[-1]).toBe(5)
    expect(counts[-2]).toBe(1)
  })

  it('contains exactly one x2 card and one MISS card', () => {
    const deck = buildBaseModifierDeck()
    expect(deck.filter(c => c.multiply === true).length).toBe(1)
    expect(deck.filter(c => c.miss === true).length).toBe(1)
  })
})

describe('resolveModifiers', () => {
  it('applies a positive modifier to base attack', () => {
    const cards = [makeCard(2)]
    expect(resolveModifiers(cards, 3)).toBe(5)
  })

  it('applies a negative modifier to base attack', () => {
    const cards = [makeCard(-1)]
    expect(resolveModifiers(cards, 3)).toBe(2)
  })

  it('returns null on a MISS card', () => {
    const cards = [makeCard(0, { miss: true })]
    expect(resolveModifiers(cards, 3)).toBeNull()
  })

  it('doubles the attack on a x2 card', () => {
    const cards = [makeCard(0, { multiply: true })]
    expect(resolveModifiers(cards, 4)).toBe(8)
  })

  it('clamps result to 0 when modifiers drive it negative', () => {
    const cards = [makeCard(-5)]
    expect(resolveModifiers(cards, 3)).toBe(0)
  })

  it('handles multiple cards in sequence', () => {
    const cards = [makeCard(1), makeCard(1), makeCard(-1)]
    expect(resolveModifiers(cards, 2)).toBe(3) // 2 + 1 + 1 - 1
  })
})

describe('drawModifier', () => {
  it('moves the drawn card to discard', () => {
    const deck: ModifierCard[] = [makeCard(1), makeCard(2)]
    const discard: ModifierCard[] = []
    const drawn = drawModifier(deck, discard)
    expect(drawn.length).toBe(1)
    expect(discard.length).toBe(1)
    expect(deck.length).toBe(1)
  })

  it('reshuffles discard into deck when deck is empty', () => {
    const card = makeCard(0)
    const deck: ModifierCard[] = []
    const discard: ModifierCard[] = [card]
    const drawn = drawModifier(deck, discard)
    expect(drawn.length).toBe(1)
    // Discard is now empty (was moved to deck and drawn)
    expect(deck.length).toBe(0)
    expect(discard.length).toBe(1)
  })

  it('does not draw a rolling card (none in base test)', () => {
    // Non-rolling card: should return exactly 1 card
    const deck: ModifierCard[] = [makeCard(0), makeCard(1)]
    const discard: ModifierCard[] = []
    const drawn = drawModifier(deck, discard)
    expect(drawn.length).toBe(1)
  })

  it('chains draws for rolling modifiers', () => {
    const rolling = makeCard(1, { rolling: true })
    const normal = makeCard(0)
    const deck: ModifierCard[] = [rolling, normal]
    const discard: ModifierCard[] = []
    const drawn = drawModifier(deck, discard)
    // Rolling draws again → 2 cards returned
    expect(drawn.length).toBe(2)
  })
})
