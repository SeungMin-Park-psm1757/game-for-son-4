export interface RewardBundle {
    gold?: number;
    amber?: number;
    medicine?: number;
    happiness?: number;
    bond?: number;
    inventory?: Record<string, number>;
}

export interface ProgressStatsShape {
    gold: number;
    amber: number;
    medicine: number;
    happiness: number;
    bond: number;
    inventory: Record<string, number>;
}

export type MomentTheme = 'amber' | 'sky' | 'rose' | 'emerald' | 'indigo';

export interface GameMoment {
    id: string;
    icon: string;
    title: string;
    body: string;
    theme: MomentTheme;
    reward?: RewardBundle;
    rewardText?: string;
    trackGoldEarned?: boolean;
}

export type OnboardingMissionId = 'first_snack' | 'first_cleanup' | 'first_praise' | 'first_play';

export interface OnboardingMission {
    id: OnboardingMissionId;
    icon: string;
    title: string;
    description: string;
    reward: RewardBundle;
    triggerActionIds: string[];
}

export interface GrowthReward {
    tier: number;
    icon: string;
    title: string;
    description: string;
    reward: RewardBundle;
    memory: string;
}

export type DailyGiftId = 'sunny_snack' | 'cozy_blanket' | 'sparkle_pebble' | 'kind_note';

export interface DailyGift {
    id: DailyGiftId;
    icon: string;
    title: string;
    description: string;
    reward: RewardBundle;
    memory: string;
}

export type GentleEventId = 'puddle_splash' | 'sunbeam_rest' | 'wildflower' | 'wind_chime';

export interface GentleEvent {
    id: GentleEventId;
    icon: string;
    title: string;
    description: string;
    reward: RewardBundle;
    memory: string;
    eligibleActionIds?: string[];
    seasonTags?: string[];
    hours?: [number, number];
}

export const ONBOARDING_MISSIONS: OnboardingMission[] = [
    {
        id: 'first_snack',
        icon: '🌿',
        title: '첫 간식 챙기기',
        description: '배고프지 않게 첫 먹이를 건네 주세요.',
        reward: { gold: 20, bond: 4 },
        triggerActionIds: ['feed_fern', 'feed_conifer', 'feed_special'],
    },
    {
        id: 'first_cleanup',
        icon: '🚿',
        title: '깨끗하게 돌봐주기',
        description: '씻기나 목욕으로 몸을 말끔하게 해 주세요.',
        reward: { amber: 1, bond: 5, happiness: 6 },
        triggerActionIds: ['wash_face', 'wash_feet', 'wash_body', 'wash_shower', 'wash_bath'],
    },
    {
        id: 'first_praise',
        icon: '💛',
        title: '다정하게 교감하기',
        description: '칭찬하거나 쓰다듬어 브라키오를 안심시켜 주세요.',
        reward: { gold: 25, bond: 7 },
        triggerActionIds: ['interact_praise'],
    },
    {
        id: 'first_play',
        icon: '⚽',
        title: '함께 놀아주기',
        description: '가볍게 놀아 주며 브라키오와 호흡을 맞춰 보세요.',
        reward: { gold: 30, amber: 1, bond: 8 },
        triggerActionIds: ['train_ball', 'train_frisbee', 'train_walk', 'train_sing', 'train_dance'],
    },
];

export const GROWTH_REWARDS: Record<number, GrowthReward> = {
    1: {
        tier: 1,
        icon: '🌱',
        title: '어린 브라키오로 성장했어요',
        description: '몸도 마음도 한 뼘 자랐어요. 작은 성장 선물을 챙겨 주세요.',
        reward: { gold: 40, amber: 2, bond: 6, happiness: 10 },
        memory: '조심스럽던 걸음이 조금 더 당당해졌어요.',
    },
    2: {
        tier: 2,
        icon: '🦕',
        title: '든든한 청소년이 되었어요',
        description: '호기심이 늘고 몸집도 커졌어요. 함께한 시간이 눈에 보이기 시작해요.',
        reward: { gold: 60, amber: 3, medicine: 1, bond: 8, happiness: 12 },
        memory: '목이 길어지고 세상을 더 멀리 바라보게 되었어요.',
    },
    3: {
        tier: 3,
        icon: '✨',
        title: '믿음직한 어른이 되었어요',
        description: '브라키오가 완전히 자라 당신의 곁을 편안한 집처럼 느껴요.',
        reward: { gold: 90, amber: 5, medicine: 1, bond: 10, happiness: 15 },
        memory: '함께 보낸 시간이 브라키오를 단단하고 다정하게 만들었어요.',
    },
};

const DAILY_GIFTS: DailyGift[] = [
    {
        id: 'sunny_snack',
        icon: '🌞',
        title: '오늘의 작은 간식',
        description: '햇살 좋은 날이라 브라키오가 좋아하는 풀잎을 조금 더 챙겨 두었어요.',
        reward: { gold: 15, bond: 3, inventory: { feed_fern: 2 } },
        memory: '아침 햇살과 함께 작은 간식 꾸러미를 받았어요.',
    },
    {
        id: 'cozy_blanket',
        icon: '🧺',
        title: '포근한 담요 선물',
        description: '오늘은 편하게 쉬라고 조용한 담요를 덮어 주었어요.',
        reward: { amber: 1, bond: 4, happiness: 8 },
        memory: '따뜻한 담요 냄새 덕분에 마음이 편안해졌어요.',
    },
    {
        id: 'sparkle_pebble',
        icon: '💎',
        title: '반짝이는 조약돌',
        description: '브라키오가 마음에 드는 조약돌을 발견해 소중히 챙겨 두었어요.',
        reward: { amber: 2, bond: 3 },
        memory: '작지만 반짝이는 조약돌을 함께 들여다봤어요.',
    },
    {
        id: 'kind_note',
        icon: '💌',
        title: '다정한 메모',
        description: '오늘도 잘 지내 보자는 짧은 응원 메모가 도착했어요.',
        reward: { gold: 10, bond: 5, happiness: 6 },
        memory: '짧은 응원 한마디가 오늘 하루를 부드럽게 만들었어요.',
    },
];

const GENTLE_EVENTS: GentleEvent[] = [
    {
        id: 'puddle_splash',
        icon: '💦',
        title: '물웅덩이 찰박',
        description: '가볍게 첨벙거리며 노는 바람에 기분이 많이 좋아졌어요.',
        reward: { happiness: 10, bond: 3 },
        memory: '작은 물웅덩이 앞에서 한참 웃고 놀았어요.',
        eligibleActionIds: ['train_walk', 'wash_feet', 'wash_shower'],
    },
    {
        id: 'sunbeam_rest',
        icon: '🌤️',
        title: '햇살 낮잠',
        description: '따뜻한 햇살 아래에서 잠깐 쉬며 기운을 다시 모았어요.',
        reward: { happiness: 8, bond: 4 },
        memory: '햇살 아래서 나란히 숨을 고르던 순간이 남았어요.',
        hours: [9, 16],
    },
    {
        id: 'wildflower',
        icon: '🌸',
        title: '들꽃 발견',
        description: '브라키오가 예쁜 들꽃을 발견하고 한참 냄새를 맡았어요.',
        reward: { amber: 1, bond: 4, happiness: 6 },
        memory: '들꽃 향기를 맡으며 잠깐 멈춰 섰어요.',
        seasonTags: ['Spring'],
    },
    {
        id: 'wind_chime',
        icon: '🍃',
        title: '바람 소리 산책',
        description: '살랑이는 바람 덕분에 마음이 차분해졌어요.',
        reward: { happiness: 7, bond: 3, gold: 10 },
        memory: '바람 소리에 맞춰 천천히 걸으며 마음이 가라앉았어요.',
        eligibleActionIds: ['train_walk', 'interact_pasture', 'interact_praise'],
    },
];

const BOND_MILESTONES = [
    { threshold: 20, title: '익숙한 친구', description: '이제 브라키오가 당신 곁을 편안하게 느껴요.', icon: '🤝' },
    { threshold: 45, title: '마음이 놓이는 보호자', description: '돌봄을 받을 때 브라키오의 표정이 한층 부드러워졌어요.', icon: '💛' },
    { threshold: 70, title: '마음이 통하는 단짝', description: '말하지 않아도 기분을 조금씩 알아챌 만큼 가까워졌어요.', icon: '✨' },
];

const ACTION_BOND_DELTAS: Record<string, number> = {
    feed_fern: 2,
    feed_conifer: 2,
    feed_special: 2,
    feed_vitamin: 1,
    feed_medicine: 1,
    wash_face: 2,
    wash_feet: 2,
    wash_body: 2,
    wash_shower: 2,
    wash_bath: 2,
    interact_praise: 4,
    interact_scold: -2,
    interact_hospital: 3,
    interact_pasture: 2,
    train_ball: 2,
    train_frisbee: 2,
    train_walk: 2,
    train_sing: 2,
    train_dance: 2,
};

const ACTION_BOND_MEMORY_TEXT: Record<string, string> = {
    feed_fern: '먹이를 챙겨 주며',
    feed_conifer: '먹이를 챙겨 주며',
    feed_special: '특별식을 챙겨 주며',
    feed_vitamin: '컨디션을 보살피며',
    feed_medicine: '아픈 몸을 돌보며',
    wash_face: '얼굴을 씻겨 주며',
    wash_feet: '발을 씻겨 주며',
    wash_body: '몸을 씻겨 주며',
    wash_shower: '샤워를 시켜 주며',
    wash_bath: '목욕을 시켜 주며',
    sleep_bed: '편히 재워 주며',
    sleep_floor: '곁에서 쉬게 하며',
    sleep_outside: '바깥 공기를 느끼게 하며',
    interact_praise: '다정하게 칭찬하며',
    interact_scold: '차분히 타이르며',
    interact_hospital: '병원을 다녀오며',
    interact_pasture: '함께 들판을 거닐며',
    train_ball: '공놀이를 하며',
    train_frisbee: '가볍게 뛰놀며',
    train_walk: '산책을 하며',
    train_sing: '노래를 들려주며',
    train_dance: '함께 리듬을 타며',
};

function hashSeed(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function applyRewardBundle(stats: ProgressStatsShape, reward: RewardBundle) {
    if (reward.gold) stats.gold += reward.gold;
    if (reward.amber) stats.amber += reward.amber;
    if (reward.medicine) stats.medicine += reward.medicine;
    if (reward.happiness) stats.happiness = Math.min(100, Math.max(0, stats.happiness + reward.happiness));
    if (reward.bond) stats.bond = Math.min(100, Math.max(0, stats.bond + reward.bond));

    if (reward.inventory) {
        Object.entries(reward.inventory).forEach(([itemId, amount]) => {
            stats.inventory[itemId] = (stats.inventory[itemId] || 0) + amount;
        });
    }
}

export function describeRewardBundle(reward: RewardBundle) {
    const parts: string[] = [];
    if (reward.gold) parts.push(`💰 ${reward.gold}`);
    if (reward.amber) parts.push(`💎 ${reward.amber}`);
    if (reward.medicine) parts.push(`💊 ${reward.medicine}`);
    if (reward.happiness) parts.push(`기분 +${reward.happiness}`);
    if (reward.bond) parts.push(`유대감 +${reward.bond}`);
    if (reward.inventory) {
        Object.entries(reward.inventory).forEach(([itemId, amount]) => {
            const shortName = itemId.replace(/^feed_/, '').replace(/^train_/, '');
            parts.push(`${shortName} +${amount}`);
        });
    }
    return parts.join(' · ');
}

export function getNextOnboardingMission(completed: OnboardingMissionId[]) {
    return ONBOARDING_MISSIONS.find((mission) => !completed.includes(mission.id)) ?? null;
}

export function getGrowthReward(tier: number) {
    return GROWTH_REWARDS[tier] ?? null;
}

export function pickDailyGift(seedKey: string) {
    return DAILY_GIFTS[hashSeed(seedKey) % DAILY_GIFTS.length];
}

export function pickGentleEvent(seedKey: string, context: { season: string; hour: number; actionId: string }) {
    const filtered = GENTLE_EVENTS.filter((event) => {
        if (event.eligibleActionIds && !event.eligibleActionIds.includes(context.actionId)) return false;
        if (event.seasonTags && !event.seasonTags.includes(context.season)) return false;
        if (event.hours) {
            const [from, to] = event.hours;
            if (context.hour < from || context.hour > to) return false;
        }
        return true;
    });

    if (!filtered.length) return null;
    return filtered[hashSeed(seedKey) % filtered.length];
}

export function getBondTitle(bond: number) {
    if (bond >= 70) return '마음이 통하는 단짝';
    if (bond >= 45) return '마음이 놓이는 보호자';
    if (bond >= 20) return '익숙한 친구';
    return '낯선 친구';
}

export function getLatestBondMilestone(previousThreshold: number, nextBond: number) {
    const reached = BOND_MILESTONES.filter((milestone) =>
        previousThreshold < milestone.threshold && nextBond >= milestone.threshold,
    );
    return reached[reached.length - 1] ?? null;
}

export function getBondDeltaForActionId(actionId: string, context: { isSleeping: boolean }) {
    if (actionId === 'sleep_bed' || actionId === 'sleep_floor' || actionId === 'sleep_outside') {
        return context.isSleeping ? 2 : 0;
    }

    return ACTION_BOND_DELTAS[actionId] ?? 0;
}

export function getBondMemoryReason(actionId: string, petName: string) {
    return `${petName}와 ${ACTION_BOND_MEMORY_TEXT[actionId] ?? '함께 시간을 보내며'} 더 가까워졌어요.`;
}
