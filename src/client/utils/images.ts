function slugify(text: string): string {
  return text.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** e.g. VALRATH_RED_GUARD → /assets/characters/valrath-red-guard.png */
export function characterImageUrl(cardClass: string): string {
  return `/assets/characters/${slugify(cardClass)}.png`
}

/** e.g. "Bandit Guard" → /assets/monsters/bandit-guard.png */
export function monsterImageUrl(monsterId: string): string {
  return `/assets/monsters/${slugify(monsterId)}.png`
}

/** e.g. rg-001 → /assets/cards/rg-001.png */
export function cardImageUrl(cardId: string): string {
  return `/assets/cards/${cardId}.png`
}
