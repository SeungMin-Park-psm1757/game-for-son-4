import { DialogueContext } from './types';

export type PetStrokeIntensity = 'gentle' | 'deep';

const PERSONALITY_STROKE_LINES: Record<string, { gentle: string[]; deep: string[] }> = {
    Normal: {
        gentle: [
            '그 손길이면 마음이 천천히 풀려.',
            '목 뒤를 살살 쓸어 주면 안심돼.',
        ],
        deep: [
            '지금처럼 천천히 쓰다듬어 주면 더 편해져.',
            '한참 이렇게 있고 싶어.',
        ],
    },
    Active: {
        gentle: [
            '좋아, 몸이 풀리는 느낌이야!',
            '쓰다듬어 주면 다시 뛰고 싶어져.',
        ],
        deep: [
            '좋아, 등까지 쓱쓱! 기운이 확 살아나.',
            '조금 더 해 줘, 기분이 엄청 올라가고 있어.',
        ],
    },
    Lazy: {
        gentle: [
            '그 손길이면 그대로 눕고 싶어져.',
            '천천히 만져 주니까 졸음이 더 포근해.',
        ],
        deep: [
            '아아, 딱 좋아. 이대로 가만히 있고 싶어.',
            '등을 길게 쓸어 주면 세상이 느긋해져.',
        ],
    },
    Smart: {
        gentle: [
            '어디를 만지면 편안해지는지 슬슬 알 것 같아.',
            '지금 손길은 꽤 정교한 안정 장치 같아.',
        ],
        deep: [
            '등선을 따라 쓰다듬으면 집중이 차분해져.',
            '이 패턴, 의외로 마음을 안정시키는 데 효과적이야.',
        ],
    },
    Gluttonous: {
        gentle: [
            '배를 쓰다듬어 주니까 방금 먹은 게 더 든든해.',
            '먹고 나서 만져 주면 기분이 금방 좋아져.',
        ],
        deep: [
            '배랑 목을 같이 쓸어 주니까 엄청 만족스러워.',
            '이 손길엔 간식 같은 위로가 있어.',
        ],
    },
    Clean: {
        gentle: [
            '깨끗한 손길이라 더 마음에 들어.',
            '보송보송한 느낌이 남아서 좋아.',
        ],
        deep: [
            '정돈된 손길이라 온몸이 말끔해지는 기분이야.',
            '지금처럼 부드럽게 만져 주면 마음까지 정리돼.',
        ],
    },
    Naughty: {
        gentle: [
            '간질간질해서 장난치고 싶어지는데?',
            '살짝 웃음이 나와. 조금만 더 해 봐.',
        ],
        deep: [
            '좋아, 꼬리가 간질거릴 만큼 신나.',
            '이렇게 쓰다듬으면 장난도 잠깐 멈추게 돼.',
        ],
    },
    Gentle: {
        gentle: [
            '천천히 쓰다듬어 주면 마음이 포근해져.',
            '네 손이 닿으면 긴장이 사르르 풀려.',
        ],
        deep: [
            '차분히 이어지는 손길이 정말 편안해.',
            '이렇게 다정하게 만져 주면 오래 기억하게 돼.',
        ],
    },
    Lonely: {
        gentle: [
            '네 손이 닿으니까 외롭지 않아.',
            '이렇게 가만히 곁에 있어 주는 게 좋아.',
        ],
        deep: [
            '조금 더 가까워진 기분이 들어서 마음이 놓여.',
            '등을 쓰다듬어 주면 네가 곁에 있다는 게 확 느껴져.',
        ],
    },
};

const SLEEP_STROKE_LINES = {
    gentle: [
        '꿈속에서도 네 손길이 닿는 것 같아.',
        '살짝 만져 주니까 더 편안하게 잠기고 있어.',
    ],
    deep: [
        '조용히 등을 쓸어 주니까 더 깊게 쉬고 있어.',
        '따뜻한 손길 덕분에 꿈이 더 포근해졌어.',
    ],
};

const CAREFUL_STATE_LINES = {
    Sick: [
        '살살 만져 줘서 고마워. 몸이 덜 긴장돼.',
        '조심스럽게 쓰다듬어 주니까 안심이 돼.',
    ],
    Dirty: [
        '지금은 조금 꼬질하지만 손길은 반가워.',
        '먼지가 묻어도 다정하게 만져 주는 건 좋아.',
    ],
    Naughty: [
        '흥, 그래도 네가 달래 주면 좀 풀릴지도.',
        '등을 쓸어 주면 심통이 조금 누그러져.',
    ],
};

function chooseLine(lines: string[], seed: string) {
    let total = 0;
    for (let index = 0; index < seed.length; index += 1) {
        total += seed.charCodeAt(index) * (index + 1);
    }
    return lines[total % lines.length];
}

export function getPetStrokeDialogue(context: DialogueContext, intensity: PetStrokeIntensity) {
    if (context.fsmState === 'Sleep') {
        return chooseLine(SLEEP_STROKE_LINES[intensity], `${context.petName}:${context.bond}:${intensity}:sleep`);
    }

    const carefulState = CAREFUL_STATE_LINES[context.fsmState as keyof typeof CAREFUL_STATE_LINES];
    if (carefulState) {
        return chooseLine(carefulState, `${context.petName}:${context.fsmState}:${context.bond}:${intensity}`);
    }

    const base =
        PERSONALITY_STROKE_LINES[context.personality] ??
        PERSONALITY_STROKE_LINES.Normal;

    const lines = [...base[intensity]];
    if (context.bond >= 55) {
        lines.push(
            intensity === 'deep'
                ? '이제는 네 손길만 와도 바로 편안해져.'
                : '가볍게 스쳐도 네가 누군지 바로 알아.',
        );
    } else if (context.bond <= 15) {
        lines.push(
            intensity === 'deep'
                ? '조금 놀랐지만, 천천히 해 주니까 괜찮아.'
                : '아직은 조금 낯설지만 싫지는 않아.',
        );
    }

    return chooseLine(lines, `${context.petName}:${context.personality}:${context.bond}:${context.timeOfDay}:${intensity}`);
}
