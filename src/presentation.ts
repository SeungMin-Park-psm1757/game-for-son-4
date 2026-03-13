import type { PetState } from './fsm';
import type { DialogueContext, DialoguePortraitAsset } from './dialogue/types';

export type BondTierId = 'reserved' | 'growing' | 'trusting' | 'deep';
export type GrowthStageId = 'baby' | 'child' | 'teen' | 'adult';

export interface StageBackdropTheme {
    skyTop: string;
    skyMid: string;
    skyBottom: string;
    sunCore: string;
    sunGlow: string;
    cloudAlpha: number;
    flowerCount: number;
    meadowBack: string;
    meadowFront: string;
    horizon: string;
    mist: string;
}

export interface GrowthVisualProfile {
    id: GrowthStageId;
    label: string;
    bodyScaleX: number;
    bodyScaleY: number;
    headScale: number;
    neckScale: number;
    tailLift: number;
    strideScale: number;
    cheekScale: number;
    ridgeCount: number;
    ridgeHeight: number;
    stripeOpacity: number;
    backdrop: StageBackdropTheme;
}

export const CARE_STYLE_GUIDE = {
    pillars: [
        '브라키오의 얼굴과 상태를 숫자보다 먼저 읽히게 한다.',
        'HUD는 돌봄 흐름만 남기고 장식보다 정보 위계를 우선한다.',
        '모션은 과장보다 안정감을 유지하고, 편안 모드에서는 더 잔잔해진다.',
    ],
    paletteLanes: [
        'care: 민트와 하늘색으로 안정과 회복을 표현한다.',
        'bond: 로즈와 피치로 유대감과 따뜻함을 표현한다.',
        'alert: 샌드와 인디고로 성장/주의 신호를 분리한다.',
    ],
} as const;

const BACKDROPS: Record<GrowthStageId, StageBackdropTheme> = {
    baby: {
        skyTop: '#e4f8ff',
        skyMid: '#f8fcff',
        skyBottom: '#fef3df',
        sunCore: 'rgba(255,245,187,0.98)',
        sunGlow: 'rgba(255,210,126,0.34)',
        cloudAlpha: 0.72,
        flowerCount: 5,
        meadowBack: '#c8eac6',
        meadowFront: '#86ca8e',
        horizon: '#6fa66f',
        mist: 'rgba(255,255,255,0.12)',
    },
    child: {
        skyTop: '#dff5ff',
        skyMid: '#f7fbff',
        skyBottom: '#f8efda',
        sunCore: 'rgba(255,242,179,0.96)',
        sunGlow: 'rgba(255,202,111,0.3)',
        cloudAlpha: 0.64,
        flowerCount: 4,
        meadowBack: '#b8e0b9',
        meadowFront: '#7fc27d',
        horizon: '#689f6f',
        mist: 'rgba(255,255,255,0.08)',
    },
    teen: {
        skyTop: '#d7f1ff',
        skyMid: '#f5fbff',
        skyBottom: '#f2ead8',
        sunCore: 'rgba(255,238,173,0.94)',
        sunGlow: 'rgba(251,191,112,0.26)',
        cloudAlpha: 0.56,
        flowerCount: 3,
        meadowBack: '#acd6bb',
        meadowFront: '#74b481',
        horizon: '#598f6c',
        mist: 'rgba(255,255,255,0.06)',
    },
    adult: {
        skyTop: '#d4eef9',
        skyMid: '#f4fbff',
        skyBottom: '#efe5d4',
        sunCore: 'rgba(255,234,167,0.92)',
        sunGlow: 'rgba(245,186,100,0.24)',
        cloudAlpha: 0.5,
        flowerCount: 2,
        meadowBack: '#a4d1bc',
        meadowFront: '#68a778',
        horizon: '#4c7f67',
        mist: 'rgba(255,255,255,0.05)',
    },
};

const GROWTH_VISUALS: Record<GrowthStageId, Omit<GrowthVisualProfile, 'backdrop'>> = {
    baby: {
        id: 'baby',
        label: '아기',
        bodyScaleX: 0.94,
        bodyScaleY: 0.98,
        headScale: 1.14,
        neckScale: 0.9,
        tailLift: -3,
        strideScale: 0.86,
        cheekScale: 1.18,
        ridgeCount: 3,
        ridgeHeight: 8,
        stripeOpacity: 0.11,
    },
    child: {
        id: 'child',
        label: '어린',
        bodyScaleX: 1.02,
        bodyScaleY: 1.02,
        headScale: 1.08,
        neckScale: 1.02,
        tailLift: 0,
        strideScale: 1,
        cheekScale: 1,
        ridgeCount: 4,
        ridgeHeight: 10,
        stripeOpacity: 0.15,
    },
    teen: {
        id: 'teen',
        label: '청소년',
        bodyScaleX: 1.08,
        bodyScaleY: 1.04,
        headScale: 0.99,
        neckScale: 1.1,
        tailLift: 3,
        strideScale: 1.08,
        cheekScale: 0.94,
        ridgeCount: 5,
        ridgeHeight: 12,
        stripeOpacity: 0.19,
    },
    adult: {
        id: 'adult',
        label: '어른',
        bodyScaleX: 1.14,
        bodyScaleY: 1.08,
        headScale: 0.94,
        neckScale: 1.16,
        tailLift: 6,
        strideScale: 1.12,
        cheekScale: 0.9,
        ridgeCount: 6,
        ridgeHeight: 14,
        stripeOpacity: 0.23,
    },
};

export function getBondTier(bond: number): BondTierId {
    if (bond >= 70) return 'deep';
    if (bond >= 45) return 'trusting';
    if (bond >= 20) return 'growing';
    return 'reserved';
}

export function getGrowthStageId(tier: number): GrowthStageId {
    if (tier <= 0) return 'baby';
    if (tier === 1) return 'child';
    if (tier === 2) return 'teen';
    return 'adult';
}

export function getGrowthVisualProfile(tier: number, bond: number): GrowthVisualProfile {
    const stageId = getGrowthStageId(tier);
    const base = GROWTH_VISUALS[stageId];
    const backdrop = BACKDROPS[stageId];
    const bondTier = getBondTier(bond);
    const warmBoost = bondTier === 'deep' ? 0.03 : bondTier === 'trusting' ? 0.02 : 0;

    return {
        ...base,
        headScale: base.headScale + (stageId === 'baby' ? warmBoost * 0.6 : 0),
        tailLift: base.tailLift + (bondTier === 'deep' ? 2 : bondTier === 'trusting' ? 1 : 0),
        cheekScale: base.cheekScale + warmBoost,
        stripeOpacity: base.stripeOpacity + warmBoost,
        backdrop,
    };
}

export function getStageBackdropTheme(tier: number, bond: number, state: PetState): StageBackdropTheme {
    const stageId = getGrowthStageId(tier);
    const base = BACKDROPS[stageId];
    const bondTier = getBondTier(bond);

    if (state === 'Sleep' || state === 'Sleepy') {
        return {
            ...base,
            skyTop: '#dbeafe',
            skyMid: '#eef2ff',
            skyBottom: '#ece7f8',
            sunCore: 'rgba(196,181,253,0.76)',
            sunGlow: 'rgba(129,140,248,0.18)',
            mist: 'rgba(129,140,248,0.08)',
        };
    }

    if (state === 'Sick') {
        return {
            ...base,
            skyMid: '#f8fbf2',
            skyBottom: '#f7f2d7',
            meadowBack: '#c8d8b2',
            meadowFront: '#97b07a',
            mist: 'rgba(190,242,100,0.08)',
        };
    }

    if (bondTier === 'deep') {
        return {
            ...base,
            skyMid: '#fffafc',
            skyBottom: '#f9efdf',
            sunGlow: 'rgba(251,191,146,0.28)',
            mist: 'rgba(255,255,255,0.14)',
        };
    }

    return base;
}

function isActionIntent(tag: string) {
    return tag.startsWith('feed_') || tag.startsWith('train_') || tag.startsWith('wash_') || tag.startsWith('interact_');
}

export function getDialoguePortrait(
    context: DialogueContext,
    intent: 'idle' | 'action' | 'state' | 'tap',
    tag: string = '',
): DialoguePortraitAsset {
    const bondTier = getBondTier(context.bond);
    const state = context.fsmState;
    const profile: DialoguePortraitAsset = {
        palette: 'mint',
        moodLabel: '차분한 시선',
        badgeText: '살짝 집중 중',
        sticker: '🌿',
        eyes: 'soft',
        mouth: 'smile',
    };

    if (state === 'Sleep' || state === 'Sleepy') {
        return {
            palette: 'indigo',
            moodLabel: '졸린 얼굴',
            badgeText: '쉬고 싶어요',
            sticker: '🌙',
            eyes: 'sleepy',
            mouth: 'small',
        };
    }

    if (state === 'Hungry') {
        return {
            palette: 'amber',
            moodLabel: '배고픈 눈빛',
            badgeText: '간식이 필요해요',
            sticker: '🌿',
            eyes: 'round',
            mouth: 'small',
        };
    }

    if (state === 'Dirty') {
        return {
            palette: 'sky',
            moodLabel: '정리 기다리는 얼굴',
            badgeText: '씻으면 편해져요',
            sticker: '🫧',
            eyes: 'concerned',
            mouth: 'flat',
        };
    }

    if (state === 'Sick') {
        return {
            palette: 'indigo',
            moodLabel: '몸 상태를 살피는 얼굴',
            badgeText: '조심히 돌봐 주세요',
            sticker: '💊',
            eyes: 'concerned',
            mouth: 'small',
        };
    }

    if (state === 'Naughty') {
        return {
            palette: 'amber',
            moodLabel: '심통난 표정',
            badgeText: '장난기가 올라왔어요',
            sticker: '✨',
            eyes: 'wink',
            mouth: 'pout',
        };
    }

    if (intent === 'state') {
        return {
            palette: bondTier === 'deep' ? 'rose' : 'sky',
            moodLabel: bondTier === 'deep' ? '기대는 얼굴' : '도움 기다리는 얼굴',
            badgeText: bondTier === 'deep' ? '네가 오면 안심돼요' : '한 번만 살펴봐요',
            sticker: bondTier === 'deep' ? '💞' : '🍃',
            eyes: bondTier === 'deep' ? 'soft' : 'concerned',
            mouth: bondTier === 'deep' ? 'smile' : 'small',
        };
    }

    if (intent === 'action' || isActionIntent(tag)) {
        if (tag.startsWith('wash_')) {
            return {
                palette: 'sky',
                moodLabel: '말끔해진 얼굴',
                badgeText: '보송보송해요',
                sticker: '🫧',
                eyes: 'smile',
                mouth: 'smile',
            };
        }
        if (tag.startsWith('train_')) {
            return {
                palette: 'mint',
                moodLabel: '몸이 풀린 얼굴',
                badgeText: '같이 놀아 즐거워요',
                sticker: '⭐',
                eyes: 'sparkle',
                mouth: 'open',
            };
        }
        if (tag === 'interact_praise') {
            return {
                palette: 'rose',
                moodLabel: '칭찬에 녹는 얼굴',
                badgeText: '마음이 몽글해요',
                sticker: '💗',
                eyes: 'soft',
                mouth: 'heart',
            };
        }
        if (tag === 'interact_scold') {
            return {
                palette: 'amber',
                moodLabel: '삐친 얼굴',
                badgeText: '금방 풀릴 거예요',
                sticker: '💢',
                eyes: 'concerned',
                mouth: 'pout',
            };
        }
        if (tag.startsWith('feed_')) {
            return {
                palette: 'amber',
                moodLabel: '먹이를 기다리는 얼굴',
                badgeText: '냠냠 준비 끝',
                sticker: '🌿',
                eyes: 'round',
                mouth: 'open',
            };
        }
    }

    if (intent === 'tap') {
        if (bondTier === 'deep') {
            return {
                palette: 'rose',
                moodLabel: '익숙하게 웃는 얼굴',
                badgeText: '네 손길이 반가워요',
                sticker: '💞',
                eyes: 'soft',
                mouth: 'heart',
            };
        }
        if (bondTier === 'trusting') {
            return {
                palette: 'mint',
                moodLabel: '마음 놓인 얼굴',
                badgeText: '가까운 보호자',
                sticker: '🌼',
                eyes: 'smile',
                mouth: 'smile',
            };
        }
        if (bondTier === 'growing') {
            return {
                palette: 'sky',
                moodLabel: '점점 편안한 얼굴',
                badgeText: '조금씩 가까워져요',
                sticker: '🍃',
                eyes: 'soft',
                mouth: 'smile',
            };
        }
        return {
            palette: 'amber',
            moodLabel: '낯가림 섞인 얼굴',
            badgeText: '천천히 친해지는 중',
            sticker: '🌱',
            eyes: 'round',
            mouth: 'small',
        };
    }

    if (bondTier === 'deep') {
        profile.palette = 'rose';
        profile.moodLabel = '애정이 묻는 얼굴';
        profile.badgeText = '오늘도 네가 좋아요';
        profile.sticker = '💞';
        profile.eyes = 'soft';
        profile.mouth = 'heart';
    } else if (bondTier === 'trusting') {
        profile.palette = 'mint';
        profile.moodLabel = '마음 놓인 얼굴';
        profile.badgeText = '곁에 있으면 편안해요';
        profile.sticker = '🌼';
        profile.eyes = 'smile';
        profile.mouth = 'smile';
    } else if (bondTier === 'growing') {
        profile.palette = 'sky';
        profile.moodLabel = '익숙해지는 얼굴';
        profile.badgeText = '천천히 가까워져요';
        profile.sticker = '🍃';
        profile.eyes = 'soft';
        profile.mouth = 'smile';
    } else {
        profile.palette = 'amber';
        profile.moodLabel = '조심스러운 얼굴';
        profile.badgeText = '부드럽게 다가와 주세요';
        profile.sticker = '🌱';
        profile.eyes = 'round';
        profile.mouth = 'small';
    }

    return profile;
}
