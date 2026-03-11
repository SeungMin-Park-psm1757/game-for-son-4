import type { Personality } from '../events/personality';
import type { DialogueContext } from './types';

type TimeBucket = 'morning' | 'day' | 'evening' | 'night';

interface PetTapDialogue {
    id: string;
    text: string;
    times?: TimeBucket[];
    weathers?: string[];
    states?: string[];
    seasons?: string[];
    minHappiness?: number;
    maxHappiness?: number;
    minFullness?: number;
    maxFullness?: number;
    minEnergy?: number;
    maxEnergy?: number;
    minCleanliness?: number;
    maxCleanliness?: number;
    lastActions?: string[];
}

const PATTERN_WINDOW_MS = 3 * 60 * 1000;

const talk = (id: string, text: string, extra: Omit<PetTapDialogue, 'id' | 'text'> = {}): PetTapDialogue => ({
    id,
    text,
    ...extra,
});

const generalTalks: PetTapDialogue[] = [
    talk('general_morning_1', '좋은 아침이야! 오늘도 같이 시작하자.', { times: ['morning'] }),
    talk('general_morning_2', '아침 공기가 상쾌해. 목이 길어지는 기분이야.', { times: ['morning'] }),
    talk('general_day_1', '햇살이 따뜻해서 풀숲 냄새가 더 진하게 느껴져.', { times: ['day'], weathers: ['None'] }),
    talk('general_evening_1', '노을이 지면 괜히 더 천천히 걷고 싶어져.', { times: ['evening'] }),
    talk('general_night_1', '밤하늘이 조용하네. 슬슬 눈이 감겨 와.', { times: ['night'] }),
    talk('general_hungry_1', '배가 좀 고파. 양치식물 냄새가 나면 좋겠다.', { maxFullness: 30 }),
    talk('general_full_1', '배가 든든하니까 풀잎 맛이 아직 입안에 남아 있어.', { minFullness: 85 }),
    talk('general_sleepy_1', '조금만 기대면 바로 잠들 것 같아.', { maxEnergy: 30 }),
    talk('general_clean_1', '오늘은 몸이 반짝반짝해서 기분이 산뜻해.', { minCleanliness: 85 }),
    talk('general_dirty_1', '흙이 조금 묻었네. 닦아 주면 더 가볍게 걸을 수 있어.', { maxCleanliness: 35 }),
    talk('general_happy_1', '기분이 좋아서 꼬리가 절로 흔들려.', { minHappiness: 85 }),
    talk('general_low_mood_1', '조금 심심해. 같이 놀아 주면 금방 괜찮아질 거야.', { maxHappiness: 35 }),
    talk('general_weather_meteor', '하늘에서 반짝이는 게 보여. 별똥별이 쏟아지는 날인가 봐!', { weathers: ['MeteorShower'] }),
    talk('general_weather_drought', '공기가 바삭바삭해. 오늘은 물이 더 반갑다.', { weathers: ['Drought'] }),
    talk('general_weather_ash', '하늘빛이 묵직해 보여. 코끝에 먼지가 닿는 느낌이야.', { weathers: ['VolcanicAsh'] }),
    talk('general_after_fern', '양치식물은 향이 부드러워서 먹고 나면 기분이 편안해져.', { lastActions: ['feed_fern'] }),
    talk('general_after_conifer', '침엽수는 향이 진해. 오래 씹으면 조금 텁텁하기도 해.', { lastActions: ['feed_conifer'] }),
    talk('general_after_wash', '물방울이 반짝반짝 튀는 느낌이 아직 남아 있어.', { lastActions: ['wash_face', 'wash_feet', 'wash_shower', 'wash_bath'] }),
    talk('general_after_walk', '조금 걸었더니 풀잎 사이 바람 소리가 더 잘 들려.', { lastActions: ['train_walk', 'interact_pasture'] }),
    talk('general_spring', '봄 냄새가 나. 꽃 사이를 걷는 건 언제나 좋아.', { seasons: ['봄'] }),
    talk('general_summer', '여름엔 햇살이 길어서 더 오래 놀고 싶어져.', { seasons: ['여름'] }),
    talk('general_autumn', '가을 바람은 풀잎 맛도 더 진하게 만들어.', { seasons: ['가을'] }),
    talk('general_winter', '겨울 공기는 차갑지만, 그래서 더 선명하게 느껴져.', { seasons: ['겨울'] }),
];

const personalityTalks: Record<Personality, PetTapDialogue[]> = {
    Normal: [
        talk('normal_1', '오늘도 네 옆에서 차분하게 보내고 싶어.'),
        talk('normal_2', '무난한 하루도 같이 있으면 꽤 재밌어.'),
        talk('normal_3', '서두르지 않아도 괜찮아. 천천히 해도 돼.'),
        talk('normal_4', '걷다가 예쁜 풀을 보면 괜히 한 번 더 보게 돼.'),
        talk('normal_5', '양치식물은 늘 먹어도 질리지 않는 맛이야.'),
        talk('normal_6', '침엽수는 든든하지만 오래 먹으면 입안이 조금 텁텁해져.', { lastActions: ['feed_conifer'] }),
        talk('normal_7', '지금 정도 속도가 딱 좋아. 너무 빠르지도 느리지도 않거든.'),
        talk('normal_8', '맑은 날엔 그냥 서 있기만 해도 기분이 안정돼.', { weathers: ['None'] }),
        talk('normal_9', '조용한 시간엔 풀잎 스치는 소리도 크게 들려.', { times: ['evening', 'night'] }),
        talk('normal_10', '네가 한 번 눌러 주면 내가 여기 있다는 게 실감나.'),
    ],
    Active: [
        talk('active_1', '더 뛰어도 돼? 다리가 아직 쌩쌩해!', { minEnergy: 55 }),
        talk('active_2', '가만히 있으면 몸이 근질근질해져.'),
        talk('active_3', '공 굴러가는 소리만 들어도 바로 달리고 싶어.', { lastActions: ['train_ball'] }),
        talk('active_4', '프리스비는 날아갈 때 바람을 가르는 소리가 좋아!', { lastActions: ['train_frisbee'] }),
        talk('active_5', '산책은 한 바퀴 말고 두 바퀴쯤 더 돌아도 괜찮아.', { lastActions: ['train_walk', 'interact_pasture'] }),
        talk('active_6', '햇살 좋은 날엔 점프도 더 높이 되는 느낌이야.', { times: ['day'], weathers: ['None'] }),
        talk('active_7', '조금 피곤해도 몸을 움직이면 금방 다시 신나져.', { maxEnergy: 45 }),
        talk('active_8', '비슷한 자리만 맴돌면 심심해. 더 넓게 돌아다니고 싶어.'),
        talk('active_9', '춤추면 꼬리 끝까지 리듬이 전해지는 것 같아!', { lastActions: ['train_dance'] }),
        talk('active_10', '나랑 눈 마주쳤지? 그럼 바로 한 판 놀자!'),
    ],
    Lazy: [
        talk('lazy_1', '조금만 더 누워 있어도 될까? 바닥이 포근해.'),
        talk('lazy_2', '낮잠은 언제나 옳아. 아주 중요한 일이야.', { times: ['day'] }),
        talk('lazy_3', '재워 주면 고맙겠지만, 안 재워도 난 졸릴 거야.', { maxEnergy: 40 }),
        talk('lazy_4', '천천히 걷는 풀숲 산책은 생각보다 꽤 괜찮아.', { lastActions: ['train_walk'] }),
        talk('lazy_5', '양치식물은 누워서 먹어도 맛있을 것 같아.'),
        talk('lazy_6', '포근한 침대는 정말 최고야. 다시 들어가고 싶어.', { lastActions: ['sleep_bed'] }),
        talk('lazy_7', '아침은 조금 천천히 와도 괜찮은데 말이야.', { times: ['morning'] }),
        talk('lazy_8', '햇살이 따뜻하면 눈꺼풀이 더 무거워져.', { times: ['day'], weathers: ['None'] }),
        talk('lazy_9', '내가 느긋한 건 게으른 게 아니라 여유로운 거야.'),
        talk('lazy_10', '조금 쉬고 나면 또 네 옆으로 올게.'),
    ],
    Smart: [
        talk('smart_1', '숫자 문제는 패턴이 보여서 은근히 재밌어.'),
        talk('smart_2', '하나씩 천천히 보면 답은 꼭 보이더라.'),
        talk('smart_3', '1부터 20까지는 머릿속에서 금방 줄 세울 수 있어.'),
        talk('smart_4', '뺄셈은 앞 숫자가 더 크면 마음이 편해.', { lastActions: ['train_discipline'] }),
        talk('smart_5', '침엽수의 모양은 위로 갈수록 더 날렵해 보여. 자세히 보면 재밌어.'),
        talk('smart_6', '별똥별이 떨어지는 각도도 계산해 보고 싶어.', { weathers: ['MeteorShower'] }),
        talk('smart_7', '조용한 시간엔 생각이 더 또렷해져.', { times: ['night', 'evening'] }),
        talk('smart_8', '문제를 잘 풀면 기분도 정리되는 느낌이야.', { minHappiness: 40 }),
        talk('smart_9', '양치식물은 결이 부드러워. 씹는 소리도 일정해서 좋아.'),
        talk('smart_10', '내가 말이 적을 땐, 머릿속으로 열심히 생각 중인 거야.'),
    ],
    Gluttonous: [
        talk('gluttonous_1', '양치식물은 향이 좋아서 한 번 먹으면 더 생각나.'),
        talk('gluttonous_2', '침엽수는 든든한데 너무 많이 먹으면 입안이 살짝 텁텁해.'),
        talk('gluttonous_3', '배가 부를 때도 맛있는 건 맛있는 거잖아.', { minFullness: 75 }),
        talk('gluttonous_4', '비타민은 반짝해서 간식처럼 느껴져.', { lastActions: ['feed_vitamin'] }),
        talk('gluttonous_5', '내일 먹을 것도 미리 생각하면 괜히 든든해.'),
        talk('gluttonous_6', '배고프면 세상이 먹을 걸로만 보여.', { maxFullness: 30 }),
        talk('gluttonous_7', '풀숲 냄새가 진하면 괜히 군침이 돌아.', { weathers: ['None'], times: ['day', 'evening'] }),
        talk('gluttonous_8', '씻고 나면 더 맛있게 먹을 수 있을 것 같아.', { minCleanliness: 80 }),
        talk('gluttonous_9', '산책보다 간식 한 번이 더 반가울 때도 있어.'),
        talk('gluttonous_10', '한 입만 더 먹어도 되냐고 물어보면, 답은 늘 같아. 응!'),
    ],
    Clean: [
        talk('clean_1', '깨끗한 몸으로 걷는 풀숲은 느낌부터 달라.', { minCleanliness: 85 }),
        talk('clean_2', '발끝까지 뽀송하면 기분이 진짜 좋아져.', { lastActions: ['wash_feet'] }),
        talk('clean_3', '샤워 물방울이 햇빛에 반짝일 때 제일 예뻐.', { lastActions: ['wash_shower'] }),
        talk('clean_4', '목욕하고 나면 바람도 더 산뜻하게 느껴져.', { lastActions: ['wash_bath'] }),
        talk('clean_5', '흙이 묻은 건 싫진 않지만 오래 두고 싶진 않아.', { maxCleanliness: 40 }),
        talk('clean_6', '손질이 잘 된 하루는 뭔가 다정하게 마무리돼.'),
        talk('clean_7', '맑은 날엔 몸이 더 반짝반짝 보이는 것 같아.', { weathers: ['None'] }),
        talk('clean_8', '먼지가 날리는 날엔 유난히 더 자주 털고 싶어.', { weathers: ['Drought', 'VolcanicAsh'] }),
        talk('clean_9', '얼굴을 닦고 나면 표정도 더 또렷해지는 느낌이야.', { lastActions: ['wash_face'] }),
        talk('clean_10', '깨끗한 상태로 너를 보면, 괜히 더 자신감이 생겨.'),
    ],
    Naughty: [
        talk('naughty_1', '방금은 장난이었어. 조금만 웃어 주면 안 돼?'),
        talk('naughty_2', '풀숲 사이로 숨었다가 깜짝 놀라게 하고 싶어.'),
        talk('naughty_3', '진흙 목욕은 엉망이 되지만 그래서 더 재밌잖아!', { lastActions: ['wash_mud'] }),
        talk('naughty_4', '혼나도 금방 다시 신나지는 건 어쩔 수 없어.', { lastActions: ['interact_scold'] }),
        talk('naughty_5', '공은 그냥 굴리는 것보다 쫓아가며 차는 게 재밌어.', { lastActions: ['train_ball'] }),
        talk('naughty_6', '침엽수 잎이 볼에 닿으면 간질간질해서 웃음이 나.'),
        talk('naughty_7', '아무도 안 볼 때 살짝 더 뛰어다니고 싶어.', { times: ['evening', 'night'] }),
        talk('naughty_8', '심심하면 말썽 대신 춤으로 풀어 볼까?', { maxHappiness: 55 }),
        talk('naughty_9', '네가 한 번 눌러 주면 또 장난칠 생각이 떠올라.'),
        talk('naughty_10', '그래도 내가 제일 좋아하는 건 결국 네 반응이야.'),
    ],
    Gentle: [
        talk('gentle_1', '천천히 다가와 줘서 고마워. 그게 참 좋아.'),
        talk('gentle_2', '아침 인사는 조용하게 건네는 편이 더 따뜻해.', { times: ['morning'] }),
        talk('gentle_3', '양치식물은 부드럽고 향도 순해서 마음이 편안해져.'),
        talk('gentle_4', '목욕하고 나면 세상이 조금 더 포근해 보여.', { lastActions: ['wash_bath'] }),
        talk('gentle_5', '바람이 잔잔한 날엔 풀잎도 나도 같이 쉬는 것 같아.', { weathers: ['None'] }),
        talk('gentle_6', '산책은 빨리 걷는 것보다 같이 걷는 게 더 좋아.', { lastActions: ['train_walk', 'interact_pasture'] }),
        talk('gentle_7', '조금 기운이 없어 보여도 너무 걱정하진 마. 네가 있잖아.', { maxHappiness: 45 }),
        talk('gentle_8', '별똥별이 보이면 조용히 소원을 빌어 보고 싶어.', { weathers: ['MeteorShower'] }),
        talk('gentle_9', '너와 눈을 맞추는 시간이 나는 참 좋다.'),
        talk('gentle_10', '오늘도 부드럽게, 우리 속도로 가자.'),
    ],
    Lonely: [
        talk('lonely_1', '한 번 눌러 줘서 고마워. 기다리고 있었어.'),
        talk('lonely_2', '네가 자주 와 주면 하루가 훨씬 길지 않게 느껴져.'),
        talk('lonely_3', '혼자 걷는 풀숲보다 같이 보는 풀숲이 더 예뻐.'),
        talk('lonely_4', '좋은 아침이야. 오늘도 나 잊지 않고 와 줬네.', { times: ['morning'] }),
        talk('lonely_5', '저녁엔 괜히 네가 더 보고 싶어져.', { times: ['evening', 'night'] }),
        talk('lonely_6', '칭찬 한마디면 마음이 금방 따뜻해져.', { lastActions: ['interact_praise'] }),
        talk('lonely_7', '양치식물을 같이 먹는 상상을 하면 덜 심심해.'),
        talk('lonely_8', '조금 울적했는데 네가 눌러 주니까 괜찮아졌어.', { maxHappiness: 50 }),
        talk('lonely_9', '산책 다녀와도 결국 제일 보고 싶은 건 너야.', { lastActions: ['interact_pasture', 'train_walk'] }),
        talk('lonely_10', '가끔은 그냥 옆에 있다는 말만 들어도 충분해.'),
    ],
};

function getTimeBucket(hour: number): TimeBucket {
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'day';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

function matches(entry: PetTapDialogue, context: DialogueContext): boolean {
    const timeBucket = getTimeBucket(context.timeOfDay);
    if (entry.times && !entry.times.includes(timeBucket)) return false;
    if (entry.weathers && !entry.weathers.includes(context.weather)) return false;
    if (entry.states && !entry.states.includes(context.fsmState)) return false;
    if (entry.seasons && !entry.seasons.some((season) => context.season.includes(season))) return false;
    if (entry.minHappiness !== undefined && context.stats.happiness < entry.minHappiness) return false;
    if (entry.maxHappiness !== undefined && context.stats.happiness > entry.maxHappiness) return false;
    if (entry.minFullness !== undefined && context.stats.fullness < entry.minFullness) return false;
    if (entry.maxFullness !== undefined && context.stats.fullness > entry.maxFullness) return false;
    if (entry.minEnergy !== undefined && context.stats.energy < entry.minEnergy) return false;
    if (entry.maxEnergy !== undefined && context.stats.energy > entry.maxEnergy) return false;
    if (entry.minCleanliness !== undefined && context.stats.cleanliness < entry.minCleanliness) return false;
    if (entry.maxCleanliness !== undefined && context.stats.cleanliness > entry.maxCleanliness) return false;
    if (entry.lastActions && !entry.lastActions.some((action) => context.lastActions.includes(action))) return false;
    return true;
}

function hashString(input: string) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function mulberry32(seed: number) {
    return () => {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle<T>(items: T[], rand: () => number) {
    const cloned = [...items];
    for (let i = cloned.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
}

export function getPetTapPattern(context: DialogueContext, nowMs: number = Date.now()) {
    const bucket = Math.floor(nowMs / PATTERN_WINDOW_MS);
    const personalityLines = personalityTalks[context.personality as Personality] || personalityTalks.Normal;
    const strictMatches = [...generalTalks, ...personalityLines].filter((entry) => matches(entry, context));
    const relaxedMatches = [...personalityLines, ...generalTalks];
    const seed = hashString([
        bucket,
        context.personality,
        context.weather,
        context.fsmState,
        Math.floor(context.stats.happiness / 10),
        Math.floor(context.stats.fullness / 10),
        Math.floor(context.stats.energy / 10),
        Math.floor(context.stats.cleanliness / 10),
    ].join(':'));
    const rand = mulberry32(seed);
    const poolSize = 3 + Math.floor(rand() * 3);
    const selected: PetTapDialogue[] = [];
    const used = new Set<string>();

    for (const entry of shuffle(strictMatches, rand)) {
        if (used.has(entry.id)) continue;
        selected.push(entry);
        used.add(entry.id);
        if (selected.length >= poolSize) break;
    }

    if (selected.length < poolSize) {
        for (const entry of shuffle(relaxedMatches, rand)) {
            if (used.has(entry.id)) continue;
            selected.push(entry);
            used.add(entry.id);
            if (selected.length >= poolSize) break;
        }
    }

    return {
        patternKey: `${bucket}:${context.personality}:${context.weather}:${context.fsmState}`,
        lines: selected.map((entry) => entry.text),
    };
}
