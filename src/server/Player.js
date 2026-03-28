import { v4 as uuidv4 } from 'uuid';
import { ActorType, } from '../common/types.js';
import { buildBaseModifierDeck } from './engine/ModifierDeck.js';
import { tickConditions } from './engine/Conditions.js';
export class Player {
    id;
    type = ActorType.PLAYER;
    playerId;
    name;
    cardClass;
    level;
    xp;
    gold;
    hp;
    maxHp;
    conditions = [];
    spaceId = null;
    initiative = 99;
    acted = false;
    hand = [];
    selectedCards = null;
    selectedCardHalves = null;
    modifierDeck;
    modifierDiscard = [];
    exhausted = false;
    constructor(playerId, name, cardClass, level = 1, maxHp = 10) {
        this.id = uuidv4();
        this.playerId = playerId;
        this.name = name;
        this.cardClass = cardClass;
        this.level = level;
        this.xp = 0;
        this.gold = 0;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.modifierDeck = buildBaseModifierDeck();
    }
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp === 0;
    }
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
    selectCards(topCardId, bottomCardId) {
        this.selectedCards = [topCardId, bottomCardId];
        const topCard = this.hand.find(c => c.id === topCardId);
        if (topCard) {
            this.initiative = topCard.initiative;
        }
    }
    endTurn() {
        this.acted = true;
        this.selectedCardHalves = null;
    }
    shortRest() {
        // Return 1 random lost card to hand, remove 1 random card permanently
        const lostCards = this.hand.filter(c => c.lost);
        if (lostCards.length === 0)
            return;
        const randomIndex = Math.floor(Math.random() * lostCards.length);
        lostCards[randomIndex].lost = false;
    }
    endOfRound() {
        this.acted = false;
        this.initiative = 99;
        this.selectedCards = null;
        return tickConditions(this);
    }
    checkExhaustion() {
        const playableCards = this.hand.filter(c => !c.lost);
        if (playableCards.length < 2 || this.hp <= 0) {
            this.exhausted = true;
        }
        return this.exhausted;
    }
    serialize() {
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
        };
    }
}
