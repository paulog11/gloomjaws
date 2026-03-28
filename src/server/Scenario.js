import { v4 as uuidv4 } from 'uuid';
import { ActorType, } from '../common/types.js';
export class Scenario {
    def;
    spaces;
    revealedRooms;
    monsters = new Map();
    monsterAIDecks = new Map();
    constructor(def) {
        this.def = def;
        this.spaces = def.spaces.map(s => ({ ...s }));
        this.revealedRooms = [...def.initialRevealedRooms];
    }
    spawnMonsters(monsterDefs, scenarioLevel, _playerCount) {
        for (const spawn of this.def.monsterSpawns) {
            if (!this.revealedRooms.includes(spawn.roomId))
                continue;
            const def = monsterDefs.get(spawn.monsterId);
            if (!def)
                continue;
            const levelData = def.levels[scenarioLevel] ?? def.levels[1];
            const stats = spawn.isElite ? levelData.elite : levelData.normal;
            const token = {
                id: uuidv4(),
                type: ActorType.MONSTER,
                monsterId: spawn.monsterId,
                isElite: spawn.isElite,
                number: spawn.number,
                hp: stats.hp,
                maxHp: stats.hp,
                conditions: [],
                spaceId: spawn.spaceId,
                initiative: 99,
                acted: false,
                currentAICard: undefined,
            };
            this.monsters.set(token.id, token);
            // Set occupant on space
            const space = this.spaces.find(s => s.id === spawn.spaceId);
            if (space)
                space.occupantId = token.id;
            // Ensure AI deck exists for this monster type
            if (!this.monsterAIDecks.has(spawn.monsterId)) {
                this.monsterAIDecks.set(spawn.monsterId, {
                    deck: shuffle([...def.aiDeck]),
                    discard: [],
                });
            }
        }
    }
    revealRoom(roomId, monsterDefs, scenarioLevel) {
        if (this.revealedRooms.includes(roomId))
            return;
        this.revealedRooms.push(roomId);
        this.spawnMonsters(monsterDefs, scenarioLevel, 0);
    }
    getMonsterStats(monsterId, isElite, scenarioLevel, monsterDefs) {
        const def = monsterDefs.get(monsterId);
        if (!def)
            return null;
        const levelData = def.levels[scenarioLevel] ?? def.levels[1];
        return isElite ? levelData.elite : levelData.normal;
    }
    drawAICardForGroup(monsterId) {
        const deckData = this.monsterAIDecks.get(monsterId);
        if (!deckData)
            return null;
        if (deckData.deck.length === 0) {
            deckData.deck.push(...deckData.discard.splice(0));
            shuffle(deckData.deck);
        }
        const card = deckData.deck.shift();
        if (card.shuffle) {
            deckData.discard.push(card);
            deckData.deck.push(...deckData.discard.splice(0));
            shuffle(deckData.deck);
        }
        else {
            deckData.discard.push(card);
        }
        // Assign this card to all monsters of this type
        for (const monster of this.monsters.values()) {
            if (monster.monsterId === monsterId) {
                monster.currentAICard = card;
                monster.initiative = card.initiative;
            }
        }
        return card;
    }
    removeMonster(monsterId) {
        const monster = this.monsters.get(monsterId);
        if (!monster)
            return;
        if (monster.spaceId) {
            const space = this.spaces.find(s => s.id === monster.spaceId);
            if (space)
                space.occupantId = undefined;
        }
        this.monsters.delete(monsterId);
    }
    allMonstersDefeated() {
        return this.monsters.size === 0;
    }
    serialize() {
        return {
            spaces: this.spaces.map(s => ({ ...s })),
            revealedRooms: [...this.revealedRooms],
            monsters: Array.from(this.monsters.values()).map(m => ({ ...m })),
        };
    }
}
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
