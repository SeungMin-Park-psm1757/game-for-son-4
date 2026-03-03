export type QuizType = 'Math' | 'Language';

export interface Question {
    text: string;
    options: string[];
    answerIndex: number;
    hint: string;
    tier: number;
}

export class QuizEngine {
    public currentTier: number = 0;
    public recentResults: boolean[] = []; // stores up to 10 recent results

    constructor() { }

    public generateQuestion(): Question {
        const isMath = Math.random() > 0.5;
        return isMath ? this.generateMathQuestion() : this.generateLanguageQuestion();
    }

    public recordResult(isCorrect: boolean) {
        this.recentResults.push(isCorrect);
        if (this.recentResults.length > 10) {
            this.recentResults.shift();
        }
        this.adjustDifficulty(isCorrect);
    }

    private adjustDifficulty(lastResultCorrect: boolean) {
        if (!lastResultCorrect) {
            // Check for 2 consecutive wrongs
            const len = this.recentResults.length;
            if (len >= 2 && !this.recentResults[len - 1] && !this.recentResults[len - 2]) {
                this.currentTier = Math.max(0, this.currentTier - 1);
            }
        } else {
            // Check for 3 consecutive rights or >85% overall success
            const len = this.recentResults.length;
            const consecutive3 = len >= 3 && this.recentResults[len - 1] && this.recentResults[len - 2] && this.recentResults[len - 3];

            let highWinRate = false;
            if (len >= 5) { // Need at least 5 answers to care about win rate
                const corrects = this.recentResults.filter(r => r).length;
                if (corrects / len >= 0.85) {
                    highWinRate = true;
                }
            }

            if (consecutive3 || highWinRate) {
                this.currentTier = Math.min(3, this.currentTier + 1);
            }
        }
    }

    private generateMathQuestion(): Question {
        const tier = this.currentTier;
        let text = '';
        let correctStr = '';
        let hint = '';

        if (tier === 0) {
            // Counting 0~10
            const num = Math.floor(Math.random() * 11);
            text = `손가락이 몇 개일까요? (${num}개)`;
            correctStr = String(num);
            hint = `천천히 하나씩 세어보자. 1, 2, 3...`;
        } else if (tier === 1) {
            // Addition/Subtraction under 10
            const a = Math.floor(Math.random() * 5) + 1;
            const b = Math.floor(Math.random() * (10 - a)) + 1;
            if (Math.random() > 0.5 && a >= b) {
                text = `${a} - ${b} = ?`;
                correctStr = String(a - b);
                hint = `${a}개에서 ${b}개를 빼보자.`;
            } else {
                text = `${a} + ${b} = ?`;
                correctStr = String(a + b);
                hint = `${a}개랑 ${b}개를 더하면?`;
            }
        } else if (tier === 2) {
            // Addition/Subtraction under 20, or find the missing number
            if (Math.random() > 0.5) {
                const a = Math.floor(Math.random() * 10) + 5;
                const b = Math.floor(Math.random() * 9) + 1;
                text = `${a} + ${b} = ?`;
                correctStr = String(a + b);
                hint = `${a}에서 ${b}번 더 앞으로 가보자.`;
            } else {
                const target = Math.floor(Math.random() * 5) + 5; // 5~9
                const a = Math.floor(Math.random() * target) + 1;
                text = `${a} + □ = ${target}`;
                correctStr = String(target - a);
                hint = `${a}개에 몇 개를 더 얹어야 ${target}개가 될까?`;
            }
        } else {
            // Word problems, sequences
            if (Math.random() > 0.5) {
                const apples = Math.floor(Math.random() * 5) + 3;
                text = `사과가 ${apples}개 있었는데 친구가 2개를 줬어. 몇 개일까?`;
                correctStr = String(apples + 2);
                hint = `그림을 그려보면 쉬워. ${apples}개 + 2개!`;
            } else {
                text = `2, 4, 6, □, 10 ... 빈 칸은?`;
                correctStr = "8";
                hint = "2씩 커지는 규칙이야!";
            }
        }

        const incorrect1 = String(Math.max(0, parseInt(correctStr) + (Math.random() > 0.5 ? 1 : -1)));
        const incorrect2 = String(Math.max(0, parseInt(correctStr) + (Math.random() > 0.5 ? 2 : -2)));

        // Ensure unique
        let pool = [correctStr, incorrect1, incorrect2];
        if (pool[0] === pool[1] || pool[0] === pool[2]) pool = [correctStr, String(parseInt(correctStr) + 3), String(Math.max(0, parseInt(correctStr) - 3))];

        const opts = this.shuffleArray(pool);
        return { text, options: opts.options, answerIndex: opts.answerIndex, hint, tier };
    }

    private generateLanguageQuestion(): Question {
        const tier = this.currentTier;
        let text = '';
        let correctStr = '';
        let hint = '';
        let distractors: string[] = [];

        if (tier === 0) {
            text = '같은 글자를 찾아보세요: 가';
            correctStr = '가';
            distractors = ['나', '다'];
            hint = 'ㄱ 과 ㅏ 가 합쳐진 글자야!';
        } else if (tier === 1) {
            text = '브라키오는 공룡입니다. "공"자는?';
            correctStr = '공';
            distractors = ['곰', '강'];
            hint = 'ㄱ + ㅗ + ㅇ 이야.';
        } else if (tier === 2) {
            // Easy spelling
            text = '맛있는 과일은? 사_';
            correctStr = '과';
            distractors = ['가', '바'];
            hint = '사! 과! 🍎';
        } else {
            // Short sentences
            text = '"친구가 넘어졌어요." 뭐라고 말할까?';
            correctStr = '괜찮아?';
            distractors = ['안녕!', '고마워'];
            hint = '친구가 아플 땐 걱정해줘야 해.';
        }

        const opts = this.shuffleArray([correctStr, distractors[0], distractors[1]]);
        return { text, options: opts.options, answerIndex: opts.answerIndex, hint, tier };
    }

    private shuffleArray(arr: string[]): { options: string[], answerIndex: number } {
        // Simple distinct logic
        const uniqueArr = Array.from(new Set(arr));
        while (uniqueArr.length < 3) {
            uniqueArr.push(`오답${Math.floor(Math.random() * 10)}`);
        }

        const originalAnswer = uniqueArr[0];
        const shuffled = [...uniqueArr].sort(() => Math.random() - 0.5);
        return {
            options: shuffled,
            answerIndex: shuffled.indexOf(originalAnswer)
        };
    }
}
