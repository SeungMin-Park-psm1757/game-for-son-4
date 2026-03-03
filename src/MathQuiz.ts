// ============================================================
// MathQuiz.ts — 수학 퀴즈 엔진 (Tier 0-3, 초등 1학년 기준)
// 4가지 보기 | 3콤보 시스템 | DDA 난이도 조정
// ============================================================

export interface MathQuestion {
    text: string;
    options: string[];   // 4개
    answerIndex: number;
    hint: string;
    tier: number;        // 0~3
    correctAnswer: number;
}

export interface MathQuizSession {
    combo: number;       // 0~3 (정답 누적)
    goldEarned: number;
    currentTier: number;
    isDone: boolean;     // 3콤보 달성 시 true
}

/** 각 콤보별 골드 보상 */
export const MATH_QUIZ_GOLD: readonly number[] = [0, 10, 16, 24] as const;
/** 3콤보 완성 시 추가 amber */
export const MATH_QUIZ_AMBER_BONUS = 1;

export class MathQuizEngine {
    public currentTier: number = 0;
    private recentResults: boolean[] = [];

    constructor(initialTier: number = 0) {
        this.currentTier = Math.max(0, Math.min(3, initialTier));
    }

    public generateQuestion(): MathQuestion {
        // 실패 시 재시도 (음수 결과 방지)
        for (let attempt = 0; attempt < 20; attempt++) {
            const q = this.tryGenerate(this.currentTier);
            if (q) return q;
        }
        // Fallback to Tier 0
        return this.tryGenerate(0)!;
    }

    private tryGenerate(tier: number): MathQuestion | null {
        let a = 0, b = 0;
        let op: '+' | '-' = '+';
        let hint = '';

        if (tier === 0) {
            // 10의 자리 + 1의 자리, 받아올림 없음
            a = [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)];
            if (Math.random() > 0.5) {
                // 덧셈: tens + single
                b = Math.floor(Math.random() * 9) + 1; // 1~9
                op = '+';
                hint = `${a}에 ${b}를 더해봐. 일의 자리만 바뀌어!`;
            } else {
                // 뺄셈: tens - single (결과 >= 0)
                b = Math.floor(Math.random() * (a / 10)); // 0 ~ a/10-1 범위 (0~4) — 받아내림 없음
                if (b === 0) b = 1;
                op = '-';
                hint = `${a}에서 ${b}를 빼보자. ${a}는 ${a / 10}개묶음이야.`;
            }
        } else if (tier === 1) {
            // 두 자리(10~90) + 한 자리(1~9), 받아올림 없음 우선
            const tens = (Math.floor(Math.random() * 8) + 1) * 10; // 10~80
            b = Math.floor(Math.random() * 9) + 1;
            if (Math.random() > 0.5) {
                // 덧셈 — 받아올림 없음: (tens % 10) + b < 10
                // tens는 이미 x0이므로 일의 자리 = b
                op = '+';
                a = tens;
                hint = `${a}은 ${Math.floor(a / 10)}묶음. 거기에 ${b}개 더 넣기!`;
            } else {
                // 뺄셈: (11~99) - (1~9), 받아내림 없음: 일의 자리 >= b
                const ones = Math.floor(Math.random() * 9) + 1; // 일의 자리
                if (ones < b) return null; // 받아내림 발생 → 건너뜀
                a = tens + ones;
                op = '-';
                hint = `${a}의 일의 자리 ${ones}에서 ${b}를 빼봐!`;
            }
        } else if (tier === 2) {
            if (Math.random() > 0.5) {
                // 덧셈: 받아올림 1회 (예: 47+6=53)
                // a의 일의 자리 + b >= 10
                const tens = (Math.floor(Math.random() * 8) + 1) * 10;
                const ones = Math.floor(Math.random() * 4) + 6; // 6~9 (받아올림 유발)
                b = Math.floor(Math.random() * (10 - ones)) + (10 - ones); // b >= (10-ones)
                if (b < 2) b = 2;
                a = tens + ones;
                op = '+';
                if (a + b > 99) return null;
                hint = `일의 자리 ${ones}+${b}=${ones + b}, 10넘으면 십의 자리로 올라가!`;
            } else {
                // 뺄셈: 받아내림 1회 (예: 52-7=45)
                const tens = (Math.floor(Math.random() * 8) + 2) * 10; // 20~90
                const ones = Math.floor(Math.random() * 4); // 0~3 (받아내림 유발)
                b = Math.floor(Math.random() * 5) + (ones + 1) + 1; // b > ones
                if (b > 9) b = 9;
                a = tens + ones;
                op = '-';
                if (a - b < 0) return null;
                hint = `${a}에서 ${b}를 빼려면 윗 자리에서 10을 빌려와야 해!`;
            }
        } else {
            // Tier 3: 두 자리 ± 두 자리
            if (Math.random() > 0.5) {
                // 덧셈: 결과 99 이하
                a = Math.floor(Math.random() * 50) + 10; // 10~59
                b = Math.floor(Math.random() * 30) + 10; // 10~39
                op = '+';
                if (a + b > 99) return null;
                hint = `십의 자리끼리, 일의 자리끼리 더해봐!`;
            } else {
                // 뺄셈: A >= B, 항상 음수 없음
                a = Math.floor(Math.random() * 70) + 20; // 20~89
                b = Math.floor(Math.random() * (a - 10)) + 10; // 10 ~ (a-1)
                if (b >= a) return null;
                op = '-';
                hint = `${a} - ${b}: 십의 자리부터 천천히 빼보자.`;
            }
        }

        const correct = op === '+' ? a + b : a - b;
        if (correct < 0) return null;

        const text = `${a} ${op === '+' ? '+' : '−'} ${b} = ?`;
        const options = this.buildOptions(correct, tier);

        return {
            text,
            options: options.opts,
            answerIndex: options.answerIdx,
            hint,
            tier,
            correctAnswer: correct
        };
    }

    /** 4개 보기 생성 (오답 3 + 정답 1, 중복 없음) */
    private buildOptions(correct: number, tier: number): { opts: string[]; answerIdx: number } {
        const spread = tier <= 1 ? [1, 2, 3] : [1, 2, 5];
        const distractors = new Set<number>();
        for (const d of spread) {
            if (correct + d >= 0) distractors.add(correct + d);
            if (correct - d >= 0 && correct - d !== correct) distractors.add(correct - d);
        }
        // 추가 오답 생성이 부족할 때
        let extra = 1;
        while (distractors.size < 3) {
            const v = correct + (extra * (Math.random() > 0.5 ? 1 : -1));
            if (v >= 0 && v !== correct) distractors.add(v);
            extra++;
        }
        const wrongArr = Array.from(distractors).filter(v => v !== correct).slice(0, 3);
        const allOpts = [String(correct), ...wrongArr.map(String)];
        // Fisher-Yates shuffle
        for (let i = allOpts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOpts[i], allOpts[j]] = [allOpts[j], allOpts[i]];
        }
        return { opts: allOpts, answerIdx: allOpts.indexOf(String(correct)) };
    }

    public recordResult(isCorrect: boolean) {
        this.recentResults.push(isCorrect);
        if (this.recentResults.length > 8) this.recentResults.shift();
        this.adjustDDA(isCorrect);
    }

    private adjustDDA(last: boolean) {
        const len = this.recentResults.length;
        if (!last) {
            // 연속 2틀리면 tier 낮춤
            if (len >= 2 && !this.recentResults[len - 1] && !this.recentResults[len - 2]) {
                this.currentTier = Math.max(0, this.currentTier - 1);
            }
        } else {
            // 정답 후 → 다음 문제 tier +1 (3콤보 시스템이므로 매 정답마다 tier 올림)
            this.currentTier = Math.min(3, this.currentTier + 1);
        }
    }

    /** 저장/복원을 위한 currentTier 반환 */
    public getTier(): number { return this.currentTier; }
}
