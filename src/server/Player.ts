import { v4 as uuidv4 } from 'uuid'
import {
  IPlayerBase,
  IAbilityCard,
  ActorType,
  CardClass,
  ModifierCard,
} from '../common/types.js'
import { buildBaseModifierDeck } from './engine/ModifierDeck.js'
import { tickConditions } from './engine/Conditions.js'

export class Player implements IPlayerBase {
  id: string
  type: ActorType.PLAYER = ActorType.PLAYER
  playerId: string
  name: string
  cardClass: CardClass
  level: number
  xp: number
  gold: number
  hp: number
  maxHp: number
  conditions: IPlayerBase['conditions'] = []
  spaceId: string | null = null
  initiative: number = 99
  acted: boolean = false
  hand: IAbilityCard[] = []
  selectedCards: [string, string] | null = null
  selectedCardHalves: IPlayerBase['selectedCardHalves'] = null
  modifierDeck: ModifierCard[]
  modifierDiscard: ModifierCard[] = []
  exhausted: boolean = false

  constructor(playerId: string, name: string, cardClass: CardClass, level = 1, maxHp = 10) {
    this.id = uuidv4()
    this.playerId = playerId
    this.name = name
    this.cardClass = cardClass
    this.level = level
    this.xp = 0
    this.gold = 0
    this.hp = maxHp
    this.maxHp = maxHp
    this.modifierDeck = buildBaseModifierDeck()
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount)
    return this.hp === 0
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  selectCards(topCardId: string, bottomCardId: string): void {
    this.selectedCards = [topCardId, bottomCardId]
    const topCard = this.hand.find(c => c.id === topCardId)
    if (topCard) {
      this.initiative = topCard.initiative
    }
  }

  endTurn(): void {
    this.acted = true
    this.selectedCardHalves = null
  }

  shortRest(): void {
    // Return 1 random lost card to hand, remove 1 random card permanently
    const lostCards = this.hand.filter(c => c.lost)
    if (lostCards.length === 0) return
    const randomIndex = Math.floor(Math.random() * lostCards.length)
    lostCards[randomIndex].lost = false
  }

  endOfRound(): { poisonDamage: number; woundDamage: number } {
    this.acted = false
    this.initiative = 99
    this.selectedCards = null
    return tickConditions(this)
  }

  checkExhaustion(): boolean {
    const playableCards = this.hand.filter(c => !c.lost)
    if (playableCards.length < 2 || this.hp <= 0) {
      this.exhausted = true
    }
    return this.exhausted
  }

  serialize(): IPlayerBase {
    return {
      id: this.id,
      type: this.type,
      playerId: this.playerId,
      name: this.name,
      cardClass: this.cardClass,
      level: this.level,
      xp: this.xp,
      gold: this.gold,
      hp: this.hp,
      maxHp: this.maxHp,
      conditions: this.conditions.map(c => ({ ...c })),
      spaceId: this.spaceId,
      initiative: this.initiative,
      acted: this.acted,
      hand: this.hand.map(c => ({ ...c })),
      selectedCards: this.selectedCards ? [...this.selectedCards] : null,
      selectedCardHalves: this.selectedCardHalves ? { ...this.selectedCardHalves } : null,
      modifierDeck: this.modifierDeck.map(c => ({ ...c })),
      modifierDiscard: this.modifierDiscard.map(c => ({ ...c })),
      exhausted: this.exhausted,
    }
  }
}
