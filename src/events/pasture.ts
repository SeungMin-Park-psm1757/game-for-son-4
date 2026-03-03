export interface PastureResult {
    msg: string;
    amber?: number;
    gold?: number;
    happiness?: number;
    wisdom?: number;
}

export function getPastureResult(_durationMinutes: number): PastureResult {
    const events: PastureResult[] = [
        { msg: '들판을 뛰놀다 예쁜 호박석을 주웠어!', amber: 2, happiness: 10 },
        { msg: '야생의 티렉스를 만나 도망쳤어! 무서웠지만 경험이 됐어.', wisdom: 5, happiness: -5 },
        { msg: '길 잃은 아기 지렁이를 구원해줬어. 꼬물꼬물 귀여워!', happiness: 20 },
        { msg: '흙을 깊숙이 파다가 반짝이는 동전을 뭉치로 발견했어!', gold: 50 },
        { msg: '독특한 냄새가 나는 버섯을 먹을 뻔 했지만 잘 참았어. 현명해!', wisdom: 3 },
        { msg: '따뜻한 햇살 아래서 하루종일 낮잠만 잤어. 개운해!', happiness: 15 },
        { msg: '나비 떼를 쫓아가다 신비로운 숲을 구경했어.', happiness: 10 },
        { msg: '오래된 뼈 화석 조각을 찾아서 돌아왔어!', amber: 1, gold: 30 }
    ];

    return events[Math.floor(Math.random() * events.length)];
}
