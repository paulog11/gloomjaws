import { v4 as uuidv4 } from 'uuid'
import {
  ModifierCard,
  ModifierCardType,
} from '../../common/types.js'

// Standard base modifier deck (20 cards)
export function buildBaseModifierDeck(): ModifierCard[] {
  const cards: ModifierCard[] = [
    // 6× +0
    ...Array.from({ length: 6 }, () => makeCard(ModifierCardType.NORMAL, 0)),
    // 5× +1
    ...Array.from({ length: 5 }, () => makeCard(ModifierCardType.NORMAL, 1)),
    // 1× +2
    makeCard(ModifierCardType.NORMAL, 2),
    // 5× -1
    ...Array.from({ length: 5 }, () => makeCard(ModifierCardType.NORMAL, -1)),
    // 1× -2
    makeCard(ModifierCardType.NORMAL, -2),
    // 1× ×2
    makeCard(ModifierCardType.NORMAL, 0, { multiply: true, shuffle: true }),
    // 1× MISS
    makeCard(ModifierCardType.NORMAL, 0, { miss: true, shuffle: true }),
  ]
  return shuffle(cards)
}

function makeCard(
  type: ModifierCardType,
  value: number,
  opts: Partial<ModifierCard> = {},
): ModifierCard {
  return { id: uuidv4(), type, value, ...opts }
}

/**
 * Draw from the deck. Handles rolling modifiers (draw again until non-rolling).
 * Mutates deck and discard arrays.
 * Returns array of drawn cards (usually 1, more if rolling modifiers chain).
 */
export function drawModifier(
  deck: ModifierCard[],
  discard: ModifierCard[],
): ModifierCard[] {
  const drawn: ModifierCard[] = []

  let keepDrawing = true
  while (keepDrawing) {
    if (deck.length === 0) {
      reshuffleDeck(deck, discard)
    }
    const card = deck.shift()!
    drawn.push(card)

    if (card.shuffle) {
      // After moving to discard, reshuffle
      discard.push(...drawn.splice(0))
      reshuffleDeck(deck, discard)
    } else {
      discard.push(card)
    }

    keepDrawing = card.rolling === true
  }

  return drawn
}

/**
 * Compute net attack value from a chain of drawn modifier cards.
 * Returns null if any card is a MISS.
 */
export function resolveModifiers(cards: ModifierCard[], baseAttack: number): number | null {
  let total = baseAttack
  for (const card of cards) {
    if (card.miss) return null
    if (card.multiply) { total *= 2; continue }
    total += card.value
  }
  return Math.max(0, total)
}

export function insertBless(deck: ModifierCard[]): void {
  deck.push(makeCard(ModifierCardType.BLESS, 0, { multiply: true }))
  deck = shuffle(deck)
}

export function insertCurse(deck: ModifierCard[]): void {
  deck.push(makeCard(ModifierCardType.CURSE, 0, { miss: true }))
  deck = shuffle(deck)
}

function reshuffleDeck(deck: ModifierCard[], discard: ModifierCard[]): void {
  deck.push(...discard.splice(0))
  shuffle(deck)
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
