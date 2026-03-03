import { DialogueContext, DialogueResult } from './types';
import { dialogueCatalog } from './dialogueCatalog';
export class DialogueManager {
    private lastPlayed: Record<string, number> = {};
    private lastPhrasePlayedAt: number = 0;
    private idleTimer: number = 0;
    private minCooldownSec: number = 25; // 25s minimum between ANY dialogues

    // A sentence cannot be repeated within 5 minutes
    private GLOBAL_REPEAT_COOLDOWN_SEC = 300;

    public update(dtSec: number, context: DialogueContext): DialogueResult | null {
        if (context.isInOverlay) return null; // Don't interrupt overlay pages

        this.idleTimer += dtSec;

        // Random chance between 30 and 120 seconds to trigger idle chatter
        // if no dialogue has been played recently.
        if (this.idleTimer > 30) {
            // Chance increases as time goes up to 120
            const chance = (this.idleTimer - 30) / 90.0;
            if (Math.random() < chance * dtSec || this.idleTimer > 120) {
                return this.triggerIdleChatter(context);
            }
        }
        return null; // No dialogue triggered naturally
    }

    public triggerActionReact(actionId: string, context: DialogueContext): DialogueResult | null {
        return this.tryTriggerByTag(actionId, 1, context);
    }

    public triggerStateHint(stateTag: string, context: DialogueContext): DialogueResult | null {
        return this.tryTriggerByTag(stateTag, 2, context);
    }

    private triggerIdleChatter(context: DialogueContext): DialogueResult | null {
        return this.tryTriggerByTag('idle', 0, context);
    }

    private tryTriggerByTag(tag: string, priorityToMatch: number, context: DialogueContext): DialogueResult | null {
        if (context.isInOverlay && priorityToMatch < 2) return null; // Only hints might pierce overlay, but let UI decide.

        const now = Date.now();
        // Check global minimum cooldown (e.g., 25s) between any dialogue popups to avoid spam
        if (now - this.lastPhrasePlayedAt < this.minCooldownSec * 1000) {
            return null; // global cooldown
        }

        const candidates = dialogueCatalog.filter(entry => {
            if (entry.priority !== priorityToMatch) return false;
            if (!entry.tags || !entry.tags.includes(tag)) return false;

            const lastPlayedTime = this.lastPlayed[entry.id] || 0;
            const specificCooldown = entry.cooldownSec || this.GLOBAL_REPEAT_COOLDOWN_SEC;

            // Check repeat cooldown (5 min or per-entry cooldown)
            if (now - lastPlayedTime < specificCooldown * 1000) return false;

            return true;
        });

        if (candidates.length === 0) return null;

        // Weight selection
        let totalWeight = 0;
        const weights = candidates.map(c => {
            let w = 1.0;
            if (c.personalityWeights) {
                w = c.personalityWeights[context.personality] ?? 1.0;
            }
            totalWeight += w;
            return w;
        });

        const roll = Math.random() * totalWeight;
        let cumulative = 0;
        let selectedEntry = candidates[0];

        for (let i = 0; i < candidates.length; i++) {
            cumulative += weights[i];
            if (roll <= cumulative) {
                selectedEntry = candidates[i];
                break;
            }
        }

        this.lastPlayed[selectedEntry.id] = now;
        this.lastPhrasePlayedAt = now;
        this.idleTimer = 0; // Reset idle timer

        return {
            text: selectedEntry.text,
            priority: selectedEntry.priority,
            followUps: selectedEntry.followUps,
            ttlMs: selectedEntry.text.length * 100 + 2000 // Display time approx 2-4 seconds based on length
        };
    }
}
