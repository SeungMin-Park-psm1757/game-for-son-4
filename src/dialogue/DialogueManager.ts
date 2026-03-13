import { DialogueContext, DialogueResult } from './types';
import { dialogueCatalog } from './dialogueCatalog';
import { getDialoguePortrait } from '../presentation';
export class DialogueManager {
    private lastPlayed: Record<string, number> = {};
    private lastPhrasePlayedAt: number = 0;
    private idleTimer: number = 0;
    private readonly GLOBAL_REPEAT_COOLDOWN_SEC = 300;

    private readonly bondToneLines = {
        reserved: {
            idle: [
                '조금씩 가까워지고 있는 것 같아.',
                '이제는 네가 와도 덜 낯설어.',
                '천천히 친해져도 괜찮지?',
            ],
            action: [
                '고마워. 이런 건 조금 안심돼.',
                '이렇게 챙겨 주는 게 조금씩 익숙해져.',
                '네가 도와주면 덜 어색해.',
            ],
            state: [
                '도움을 부탁해도 될까?',
                '조금 불편해. 같이 봐 주면 좋겠어.',
                '혼자보단 네가 있으면 덜 걱정돼.',
            ],
        },
        growing: {
            idle: [
                '네가 오면 마음이 조금 편해져.',
                '이제는 네 발소리도 익숙해졌어.',
                '같이 있는 시간이 은근히 좋아.',
            ],
            action: [
                '이렇게 챙겨 주면 든든해.',
                '네 손길 덕분에 한결 편해졌어.',
                '함께하니까 더 괜찮아졌어.',
            ],
            state: [
                '조금 도와주면 금방 편해질 것 같아.',
                '네가 보면 더 안심돼.',
                '옆에서 한 번만 챙겨 줘.',
            ],
        },
        trusting: {
            idle: [
                '네가 보이면 먼저 안심부터 돼.',
                '요즘은 네 옆에 있으면 마음이 놓여.',
                '같이 있는 시간이 이제 제일 편안해.',
            ],
            action: [
                '네가 챙겨줘서 더 기분 좋아졌어.',
                '이럴 때마다 네가 참 든든해.',
                '네 손길은 정말 편안해.',
            ],
            state: [
                '조금 힘들지만 네가 있으면 괜찮아질 거야.',
                '한 번만 도와주면 금방 나아질 것 같아.',
                '너라면 잘 돌봐 줄 거라고 믿어.',
            ],
        },
        deep: {
            idle: [
                '와 줘서 반가워. 네가 오면 마음이 풀려.',
                '네 옆이 내 제일 좋아하는 자리야.',
                '오늘도 네 얼굴 보니까 괜히 안심돼.',
            ],
            action: [
                '네가 챙겨줘서 더 따뜻하게 느껴졌어.',
                '네 손길이면 뭐든 견딜 수 있을 것 같아.',
                '네가 해 주면 작은 일도 특별해져.',
            ],
            state: [
                '조금 힘들어도 네가 있으면 버틸 수 있어.',
                '이번에도 네가 곁에 있어 줘.',
                '네가 돌봐 주면 금방 다시 괜찮아질 거야.',
            ],
        },
    } as const;

    public update(dtSec: number, context: DialogueContext): DialogueResult | null {
        if (context.isInOverlay) return null; // Don't interrupt overlay pages

        this.idleTimer += dtSec;

        // Random chance between 30 and 120 seconds to trigger idle chatter
        // if no dialogue has been played recently.
        const idleStartSec = context.comfortMode ? 45 : 30;
        const idleMaxSec = context.comfortMode ? 150 : 120;

        if (this.idleTimer > idleStartSec) {
            // Chance increases as time goes up to 120
            const chance = (this.idleTimer - idleStartSec) / Math.max(1, idleMaxSec - idleStartSec);
            if (Math.random() < chance * dtSec || this.idleTimer > idleMaxSec) {
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
        const minCooldownSec = context.comfortMode ? 40 : 25;
        // Check global minimum cooldown (e.g., 25s) between any dialogue popups to avoid spam
        if (now - this.lastPhrasePlayedAt < minCooldownSec * 1000) {
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

        const text = this.getBondAwareLine(tag, priorityToMatch, context, selectedEntry.id) ?? selectedEntry.text;
        const ttlMs = text.length * 100 + 2000 + (context.comfortMode ? 600 : 0);

        return {
            text,
            priority: selectedEntry.priority,
            followUps: selectedEntry.followUps,
            ttlMs,
            portrait: getDialoguePortrait(
                context,
                priorityToMatch === 2 ? 'state' : priorityToMatch === 1 ? 'action' : 'idle',
                tag,
            ),
        };
    }

    private getBondAwareLine(tag: string, priorityToMatch: number, context: DialogueContext, seedKey: string) {
        const group = priorityToMatch === 2 ? 'state' : priorityToMatch === 1 ? 'action' : 'idle';
        const bondTier = context.bond >= 70
            ? 'deep'
            : context.bond >= 45
                ? 'trusting'
                : context.bond >= 20
                    ? 'growing'
                    : 'reserved';

        const pool = this.bondToneLines[bondTier][group];
        const bucket = Math.floor(Date.now() / (7 * 60 * 1000));
        const seed = this.hashSeed(`${seedKey}:${tag}:${bondTier}:${bucket}:${context.petName}`);
        const threshold = bondTier === 'deep' ? 44 : bondTier === 'trusting' ? 34 : bondTier === 'growing' ? 28 : 22;

        if (seed % 100 >= threshold) {
            return null;
        }

        return pool[seed % pool.length];
    }

    private hashSeed(input: string) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) - hash) + input.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
}
