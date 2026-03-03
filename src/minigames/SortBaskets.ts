// ============================================================
// SortBaskets.ts — 바구니 정리 미니게임
// id: sort_baskets | 조작: 좌/우 스와이프 or 탭 | 20초
// ============================================================
import { Minigame, MinigameId, MinigameResult } from './MinigameInterface';
import { MG_BALANCE } from '../minigameBalance';

interface Item {
    emoji: string;
    label: string;
    correctSide: 'left' | 'right'; // leaf → left, stone → right
}

const ITEMS: Item[] = [
    { emoji: '🍃', label: '잎', correctSide: 'left' },
    { emoji: '🪨', label: '돌', correctSide: 'right' },
];

type Phase = 'waiting' | 'sliding' | 'done';

export class SortBaskets implements Minigame {
    id: MinigameId = 'sort_baskets';
    title = '🧺 바구니 정리';

    private durationMs = MG_BALANCE.SORT.DURATION_S * 1000;
    private elapsed = 0;
    private score = 0;
    private mistakes = 0;
    private combo = 0;
    private comboBonus = 0;

    private currentItem: Item = ITEMS[0];
    private phase: Phase = 'waiting';
    private slideX = 0;       // 0 = center, negative = left, positive = right
    private slideTarget = 0;
    private changeDelay = 0;

    // Swipe tracking
    private pointerStartX = 0;
    private pointerDown = false;

    // Feedback
    private feedbackText = '';
    private feedbackTimer = 0;
    private feedbackColor = '#16a34a';

    // Done
    private done = false;

    start(_seed: number) {
        this.elapsed = 0;
        this.score = 0;
        this.mistakes = 0;
        this.combo = 0;
        this.comboBonus = 0;
        this.done = false;
        this.phase = 'waiting';
        this.slideX = 0;
        this.feedbackText = '';
        this.changeDelay = 0;
        this.pickNextItem();
    }

    private pickNextItem() {
        this.currentItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        this.slideX = 0;
        this.phase = 'waiting';
    }

    private judge(side: 'left' | 'right') {
        if (this.phase !== 'waiting') return;
        this.phase = 'sliding';
        this.slideTarget = side === 'left' ? -1 : 1;

        if (side === this.currentItem.correctSide) {
            this.score++;
            this.combo++;
            const bonusTrigger = MG_BALANCE.SORT.COMBO_BONUS_EVERY;
            if (this.combo > 0 && this.combo % bonusTrigger === 0) {
                this.comboBonus += MG_BALANCE.SORT.COMBO_BONUS_GOLD;
                this.showFeedback(`🔥 ${this.combo}연속! +${MG_BALANCE.SORT.COMBO_BONUS_GOLD}G`, '#d97706');
            } else {
                this.showFeedback('✅ 정답!', '#16a34a');
            }
        } else {
            this.mistakes++;
            this.combo = 0;
            this.showFeedback('❌ 오답', '#dc2626');
        }

        this.changeDelay = MG_BALANCE.SORT.ITEM_CHANGE_DELAY_MS;
    }

    private showFeedback(text: string, color: string) {
        this.feedbackText = text;
        this.feedbackColor = color;
        this.feedbackTimer = 900;
    }

    handlePointerDown(e: PointerEvent) {
        if (this.done || this.phase !== 'waiting') return;
        this.pointerStartX = e.clientX;
        this.pointerDown = true;
    }

    handlePointerMove(_e: PointerEvent) { }

    handlePointerUp(e: PointerEvent) {
        if (!this.pointerDown || this.done || this.phase !== 'waiting') return;
        this.pointerDown = false;

        const dx = e.clientX - this.pointerStartX;
        const threshold = MG_BALANCE.SORT.SWIPE_THRESHOLD_PX;

        if (Math.abs(dx) >= threshold) {
            // Swipe
            this.judge(dx < 0 ? 'left' : 'right');
        } else {
            // Tap: left half = left basket, right half = right basket
            if (this.canvas) {
                const rect = this.canvas.getBoundingClientRect();
                const tapX = e.clientX - rect.left;
                this.judge(tapX < rect.width / 2 ? 'left' : 'right');
            }
        }
    }

    // Canvas ref for tap zone detection
    private canvas: HTMLCanvasElement | null = null;
    setCanvas(c: HTMLCanvasElement) { this.canvas = c; }

    update(dtMs: number) {
        if (this.done) return;
        this.elapsed += dtMs;
        if (this.feedbackTimer > 0) this.feedbackTimer -= dtMs;

        if (this.phase === 'sliding') {
            // Animate slide
            const speed = 0.012 * dtMs; // fraction per ms
            if (this.slideTarget < 0) {
                this.slideX = Math.max(this.slideTarget, this.slideX - speed);
            } else {
                this.slideX = Math.min(this.slideTarget, this.slideX + speed);
            }

            if (Math.abs(this.slideX - this.slideTarget) < 0.01) {
                this.phase = 'done';
            }
        }

        if (this.phase === 'done') {
            this.changeDelay -= dtMs;
            if (this.changeDelay <= 0) {
                this.pickNextItem();
            }
        }

        if (this.elapsed >= this.durationMs) {
            this.done = true;
        }
    }

    render(ctx: CanvasRenderingContext2D, w: number, h: number) {
        if (!this.canvas) this.canvas = ctx.canvas;
        const remaining = Math.max(0, Math.ceil((this.durationMs - this.elapsed) / 1000));

        // Background
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(0, 0, w, h);

        // Timer
        ctx.fillStyle = remaining <= 5 ? '#dc2626' : '#1e293b';
        ctx.font = `bold ${Math.round(h * 0.09)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`⏱ ${remaining}초`, w / 2, h * 0.1);

        // Score / mistakes
        ctx.font = `bold ${Math.round(h * 0.055)}px sans-serif`;
        ctx.fillStyle = '#475569';
        ctx.fillText(`점수: ${this.score}  실수: ${this.mistakes}/${MG_BALANCE.SORT.MAX_MISTAKES}`, w / 2, h * 0.18);

        // Left basket label
        ctx.font = `${Math.round(h * 0.14)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('🧺', w * 0.04, h * 0.72);
        ctx.font = `bold ${Math.round(h * 0.045)}px sans-serif`;
        ctx.fillStyle = '#15803d';
        ctx.fillText('잎', w * 0.09, h * 0.78);

        // Right basket label
        ctx.font = `${Math.round(h * 0.14)}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText('🧺', w * 0.96, h * 0.72);
        ctx.font = `bold ${Math.round(h * 0.045)}px sans-serif`;
        ctx.fillStyle = '#b45309';
        ctx.fillText('돌', w * 0.92, h * 0.78);

        // Center item (with slide offset)
        const centerX = w / 2 + this.slideX * w * 0.4;
        ctx.font = `${Math.round(h * 0.22)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(this.currentItem.emoji, centerX, h * 0.56);

        // Item label
        ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
        ctx.fillStyle = '#374151';
        ctx.fillText(this.currentItem.label, centerX, h * 0.65);

        // Left / Right indicator arrows
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${Math.round(h * 0.06)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('◀', w * 0.03, h * 0.48);
        ctx.textAlign = 'right';
        ctx.fillText('▶', w * 0.97, h * 0.48);

        // Feedback
        if (this.feedbackTimer > 0) {
            ctx.globalAlpha = Math.min(1, this.feedbackTimer / 400);
            ctx.font = `bold ${Math.round(h * 0.065)}px sans-serif`;
            ctx.fillStyle = this.feedbackColor;
            ctx.textAlign = 'center';
            ctx.fillText(this.feedbackText, w / 2, h * 0.3);
            ctx.globalAlpha = 1;
        }

        // Combo indicator
        if (this.combo >= 3) {
            ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
            ctx.fillStyle = '#f59e0b';
            ctx.textAlign = 'center';
            ctx.fillText(`🔥 ${this.combo}연속`, w / 2, h * 0.88);
        }

        // Instructions at bottom
        ctx.font = `${Math.round(h * 0.038)}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('스와이프 또는 좌/우 탭으로 분류하세요', w / 2, h * 0.95);
    }

    isDone() { return this.done; }

    getResult(): MinigameResult {
        const goldEarned = this.score * MG_BALANCE.SORT.GOLD_PER_POINT + this.comboBonus;
        const amberEarned = Math.floor(this.score / MG_BALANCE.SORT.AMBER_DIVISOR);
        return { score: this.score, goldEarned, amberEarned, details: { mistakes: this.mistakes, combo: this.combo } };
    }
}
