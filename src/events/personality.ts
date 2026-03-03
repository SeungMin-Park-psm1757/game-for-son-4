export type Personality = 
    | 'Normal'
    | 'Active' 
    | 'Lazy' 
    | 'Smart' 
    | 'Gluttonous' 
    | 'Clean' 
    | 'Naughty' 
    | 'Gentle' 
    | 'Lonely';

export interface PersonalityDef {
    id: Personality;
    label: string;
    description: string;
}

export const PERSONALITIES: Record<Personality, PersonalityDef> = {
    Normal: { id: 'Normal', label: '평범한', description: '특별한 특징이 없는 무난한 성격.' },
    Active: { id: 'Active', label: '활발한', description: '에너지가 빨리 닳지만, 놀아주면 행복해해요.' },
    Lazy: { id: 'Lazy', label: '게으른', description: '에너지가 천천히 닳고, 잠을 자면 푹 쉬어요.' },
    Smart: { id: 'Smart', label: '똑똑한', description: '퀴즈에서 정답을 맞히면 추가 호박석을 줘요.' },
    Gluttonous: { id: 'Gluttonous', label: '식탐왕', description: '배가 빨리 고파지지만, 먹일 때 살이 잘 쪄요.' },
    Clean: { id: 'Clean', label: '깔끔쟁이', description: '더러워지는 걸 매우 싫어해요. 씻겨주면 좋아해요.' },
    Naughty: { id: 'Naughty', label: '장난꾸러기', description: '자주 말썽을 부리지만, 훈육하면 똑똑해져요.' },
    Gentle: { id: 'Gentle', label: '온순한', description: '행복도가 잘 떨어지지 않아요.' },
    Lonely: { id: 'Lonely', label: '외로움타는', description: '가만히 두면 우울해해요. 자주 칭찬해주세요.' }
};

export function calculatePersonality(actionLog: string[], statDeltaLog: { stat: string; delta: number }[]): Personality {
    // Basic counting based on logs
    let playCount = 0;
    let sleepCount = 0;
    let quizCount = 0;
    let feedCount = 0;
    let washCount = 0;
    let scoldCount = 0;
    let praiseCount = 0;

    actionLog.forEach(log => {
        if (log.includes('train_ball') || log.includes('train_frisbee') || log.includes('train_walk')) playCount++;
        if (log.includes('sleep_')) sleepCount++;
        if (log.includes('feed_')) feedCount++;
        if (log.includes('wash_')) washCount++;
        if (log.includes('train_discipline') || log.includes('scold')) scoldCount++;
        if (log.includes('praise')) praiseCount++;
    });

    statDeltaLog.forEach(log => {
        if (log.stat === 'intelligence' && log.delta > 0) quizCount++;
    });

    const counts = [
        { p: 'Active' as Personality, v: playCount },
        { p: 'Lazy' as Personality, v: sleepCount * 1.5 },
        { p: 'Smart' as Personality, v: quizCount * 2 },
        { p: 'Gluttonous' as Personality, v: feedCount },
        { p: 'Clean' as Personality, v: washCount * 1.5 },
        { p: 'Naughty' as Personality, v: scoldCount * 2 },
        { p: 'Lonely' as Personality, v: praiseCount * 1.5 }
    ];

    counts.sort((a, b) => b.v - a.v);

    if (counts[0].v < 3) return 'Normal'; // Not enough bias
    return counts[0].p;
}
