import { ActorType, ConditionType, ElementStrength, } from '../../common/types.js';
import { applyCondition, removeCondition, isDisarmed, getAttackModifierFromConditions, } from './Conditions.js';
import { drawModifier, resolveModifiers } from './ModifierDeck.js';
/**
 * Validates whether a behavior can be executed given current game state.
 */
export function canExecute(behavior, ctx) {
    const { source } = ctx;
    if (behavior.attack && isDisarmed(source))
        return false;
    if (behavior.consumeElement) {
        const strength = ctx.elements[behavior.consumeElement];
        if (strength === ElementStrength.INERT)
            return false;
    }
    return true;
}
/**
 * Executes a behavior, applying all effects to targets and game state.
 */
export function execute(behavior, ctx) {
    const { source, targets, elements, addLog } = ctx;
    // Consume element first (if behavior requires it)
    if (behavior.consumeElement) {
        elements[behavior.consumeElement] = ElementStrength.INERT;
        addLog(source.id, `consumed ${behavior.consumeElement}`);
    }
    // Move
    if (behavior.move && source.spaceId) {
        // Movement is handled by the caller using HexGrid.findPath
        // Executor only handles the stat effects
        addLog(source.id, `moves ${behavior.move.value}`);
    }
    // Attack
    if (behavior.attack && !isDisarmed(source)) {
        const condMod = getAttackModifierFromConditions(source);
        const baseAttack = behavior.attack.value + condMod;
        for (const target of targets) {
            const modDeckData = ctx.getModifierDeck(source.id);
            const drawnCards = drawModifier(modDeckData.deck, modDeckData.discard);
            const finalAttack = resolveModifiers(drawnCards, baseAttack);
            if (finalAttack === null) {
                addLog(source.id, `attacked ${target.id} — MISS`);
                continue;
            }
            // Apply pierce (reduces shield)
            const effectivePierce = behavior.attack.pierce ?? 0;
            const shield = getShieldValue(target);
            const damage = Math.max(0, finalAttack - Math.max(0, shield - effectivePierce));
            addLog(source.id, `attacked ${target.id} for ${damage} (base ${baseAttack}, mods ${drawnCards.map(c => c.value).join('+')}, shield ${shield})`);
            ctx.onDamage(target, damage);
            // Apply conditions on hit (if damage dealt)
            if (damage > 0 && behavior.attack.conditions) {
                for (const condition of behavior.attack.conditions) {
                    applyCondition(target, condition, source.id);
                    addLog(source.id, `applied ${condition} to ${target.id}`);
                }
            }
            // Push/pull (positional — caller handles via grid)
            if (behavior.attack.push) {
                addLog(source.id, `pushes ${target.id} ${behavior.attack.push}`);
            }
            if (behavior.attack.pull) {
                addLog(source.id, `pulls ${target.id} ${behavior.attack.pull}`);
            }
        }
    }
    // Heal
    if (behavior.heal !== undefined && behavior.heal > 0) {
        for (const target of targets) {
            ctx.onHeal(target, behavior.heal);
            // Healing removes WOUND and POISON
            removeCondition(target, ConditionType.WOUND);
            removeCondition(target, ConditionType.POISON);
            addLog(source.id, `healed ${target.id} for ${behavior.heal}`);
        }
    }
    // Apply condition
    if (behavior.applyCondition) {
        for (const target of targets) {
            applyCondition(target, behavior.applyCondition, source.id);
            addLog(source.id, `applied ${behavior.applyCondition} to ${target.id}`);
        }
    }
    // Remove condition
    if (behavior.removeCondition) {
        for (const target of targets) {
            removeCondition(target, behavior.removeCondition);
        }
    }
    // Produce element
    if (behavior.produceElement) {
        elements[behavior.produceElement] = ElementStrength.STRONG;
        addLog(source.id, `produced ${behavior.produceElement}`);
    }
    // Loot
    if (behavior.loot !== undefined && source.spaceId) {
        ctx.onLoot(source, source.spaceId);
    }
    // XP
    if (behavior.xp && source.type === ActorType.PLAYER) {
        const player = source;
        player.xp += behavior.xp;
        addLog(source.id, `gained ${behavior.xp} XP`);
    }
}
function getShieldValue(_actor) {
    // Shield value stored as a condition-like modifier; simplified here
    // Full implementation would track persistent shield cards
    return 0;
}
