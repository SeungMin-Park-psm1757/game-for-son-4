export interface DialogueFollowUp {
    label: string;
    actionId: string; // Action catalog ID to execute
}

export type DialoguePortraitPalette = 'mint' | 'sky' | 'rose' | 'amber' | 'indigo';
export type DialoguePortraitEyes = 'round' | 'smile' | 'sleepy' | 'sparkle' | 'soft' | 'concerned' | 'wink';
export type DialoguePortraitMouth = 'smile' | 'open' | 'flat' | 'small' | 'heart' | 'pout';

export interface DialoguePortraitAsset {
    palette: DialoguePortraitPalette;
    moodLabel: string;
    badgeText: string;
    sticker: string;
    eyes: DialoguePortraitEyes;
    mouth: DialoguePortraitMouth;
}

export interface DialogueContext {
    petName: string;
    personality: string;
    fsmState: string;
    bond: number;
    stats: {
        fullness: number;
        energy: number;
        cleanliness: number;
        happiness: number;
    };
    timeOfDay: number; // 0~23
    season: '🌸 봄' | '☀️ 여름' | '🍂 가을' | '❄️ 겨울' | string;
    weather: 'None' | 'Drought' | 'MeteorShower' | 'VolcanicAsh' | string;
    lastActions: string[];
    comfortMode: boolean;
    isInOverlay: boolean; // if true, bubble shouldn't show or should be very low priority
}

export interface DialogueEntry {
    id: string;
    text: string;
    tags?: string[]; // e.g., 'morning', 'hungry', 'feed_fern'
    personalityWeights?: Record<string, number>; // Normal: 1.0, Lazy: 0.5, etc. Missing means 1.0.
    cooldownSec: number;
    priority: number; // 0: low (idle), 1: medium (action react), 2: high (state hint)
    followUps?: DialogueFollowUp[];
}

export interface DialogueResult {
    text: string;
    priority: number;
    followUps?: DialogueFollowUp[];
    ttlMs: number;
    portrait?: DialoguePortraitAsset;
}
