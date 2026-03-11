export interface MathQuestion {
    text: string;
    options: string[];
    answerIndex: number;
    hint: string;
    tier: number;
    correctAnswer: number;
}

export interface MathQuizSession {
    combo: number;
    goldEarned: number;
    currentTier: number;
    isDone: boolean;
}

export const MATH_QUIZ_GOLD: readonly number[] = [0, 10, 16, 24] as const;
export const MATH_QUIZ_AMBER_BONUS = 1;

type Operator = '+' | '-';

const TIER_HINTS = [
    {
        plus: '앞 수에서 뒤 수만큼 더해 봐요.',
        minus: '앞 수에서 뒤 수만큼 천천히 빼 봐요.',
    },
    {
        plus: '손가락이나 머릿속 블록으로 하나씩 더해도 좋아요.',
        minus: '큰 수에서 작은 수를 하나씩 빼면 쉬워요.',
    },
    {
        plus: '먼저 큰 수를 말하고, 뒤 수만큼 올라가 봐요.',
        minus: '큰 수에서 뒤 수를 한 칸씩 내려가며 세어 봐요.',
    },
    {
        plus: '정답과 가까운 수를 골라 보세요.',
        minus: '앞 수가 더 크니까 차이를 세면 돼요.',
    },
] as const;

export class MathQuizEngine {
    public currentTier = 0;
    private recentResults: boolean[] = [];

    constructor(initialTier: number = 0) {
        this.currentTier = Math.max(0, Math.min(3, initialTier));
    }

    public generateQuestion(): MathQuestion {
        for (let attempt = 0; attempt < 20; attempt++) {
            const question = this.tryGenerate(this.currentTier);
            if (question) return question;
        }

        return this.tryGenerate(0)!;
    }

    private tryGenerate(tier: number): MathQuestion | null {
        const op: Operator = Math.random() < 0.55 ? '+' : '-';
        let a = this.randomInt(1, 20);
        const b = this.randomInt(1, 10);

        if (op === '-' && a <= b) {
            a = this.randomInt(b + 1, 20);
        }

        const correct = op === '+' ? a + b : a - b;
        if (correct < 0) return null;

        const hintSet = TIER_HINTS[Math.max(0, Math.min(TIER_HINTS.length - 1, tier))];
        const options = this.buildOptions(correct, tier);

        return {
            text: `${a} ${op} ${b} = ?`,
            options: options.opts,
            answerIndex: options.answerIdx,
            hint: op === '+' ? hintSet.plus : hintSet.minus,
            tier,
            correctAnswer: correct,
        };
    }

    private buildOptions(correct: number, tier: number): { opts: string[]; answerIdx: number } {
        const offsetsByTier = [
            [1, 2, 3, 4],
            [1, 2, 4, 5],
            [1, 3, 4, 6],
            [2, 3, 5, 6],
        ];
        const offsets = offsetsByTier[Math.max(0, Math.min(offsetsByTier.length - 1, tier))];
        const distractors = new Set<number>();

        for (const offset of offsets) {
            if (correct - offset >= 0) distractors.add(correct - offset);
            if (correct + offset <= 30) distractors.add(correct + offset);
            if (distractors.size >= 3) break;
        }

        while (distractors.size < 3) {
            const offset = this.randomInt(1, 8);
            const candidate = correct + (Math.random() < 0.5 ? -offset : offset);
            if (candidate >= 0 && candidate <= 30 && candidate !== correct) {
                distractors.add(candidate);
            }
        }

        const allOptions = [String(correct), ...Array.from(distractors).slice(0, 3).map(String)];
        for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }

        return {
            opts: allOptions,
            answerIdx: allOptions.indexOf(String(correct)),
        };
    }

    public recordResult(isCorrect: boolean) {
        this.recentResults.push(isCorrect);
        if (this.recentResults.length > 6) this.recentResults.shift();
        this.adjustDifficulty();
    }

    private adjustDifficulty() {
        const len = this.recentResults.length;
        if (len < 2) return;

        const lastTwo = this.recentResults.slice(-2);
        if (lastTwo.every(Boolean)) {
            this.currentTier = Math.min(3, this.currentTier + 1);
            return;
        }

        if (lastTwo.every((result) => !result)) {
            this.currentTier = Math.max(0, this.currentTier - 1);
        }
    }

    public getTier() {
        return this.currentTier;
    }

    private randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
