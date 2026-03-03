// ============================================================
// MemoryPairs.ts — 카드 짝맞추기 미니게임
// id: memory_pairs_8 | 조작: 탭 | 30초 | 4x4=16장 8쌍
// ============================================================
import { Minigame, MinigameId, MinigameResult } from './MinigameInterface';
import { MG_BALANCE } from '../minigameBalance';

type CardState = 'hidden' | 'revealed' | 'matched';

interface Card {
    symbol: string;
    state: CardState;
    flipProgress: number; // 0(뒷면) ~ 1(앞면), 애니메이션용
}

export class MemoryPairs implements Minigame {
    id: MinigameId = 'memory_pairs_8';
    title = '🃏 카드 짝맞추기';

    private durationMs = MG_BALANCE.MEMORY.DURATION_S * 1000;
    private elapsed = 0;
    private cards: Card[] = [];
    private firstIdx: number | null = null;
    private secondIdx: number | null = null;
    private lockMs = 0;        // 비교 잠금 타이머
    private matches = 0;
    private done = false;
    private hintUsed = false;
    private hintActive = false;
    private hintTimer = 0;

    // Feedback
    private feedbackText = '';
    private feedbackTimer = 0;
    private feedbackColor = '#16a34a';

    // Layout (computed in render)
    private cols = 4;
    private rows = 4;

    start(seed: number) {
        this.elapsed = 0;
        this.matches = 0;
        this.done = false;
        this.firstIdx = null;
        this.secondIdx = null;
        this.lockMs = 0;
        this.hintUsed = false;
        this.hintActive = false;
        this.hintTimer = 0;
        this.feedbackText = '';

        const symbols = MG_BALANCE.MEMORY.CARD_SYMBOLS;
        const deck: string[] = [];
        for (const s of symbols) { deck.push(s, s); } // 8쌍

        // Fisher-Yates shuffle with seed-based LCG
        let rng = seed;
        const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 0x100000000; };
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        this.cards = deck.map(sym => ({ symbol: sym, state: 'hidden' as CardState, flipProgress: 0 }));
    }

    handlePointerDown(e: PointerEvent) {
        if (this.done || this.lockMs > 0 || this.hintActive) return;

        const { col, row } = this.pointerToGrid(e);
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

        const idx = row * this.cols + col;
        const card = this.cards[idx];
        if (!card || card.state !== 'hidden') return;

        if (this.firstIdx === null) {
            this.firstIdx = idx;
            card.state = 'revealed';
        } else if (this.secondIdx === null && idx !== this.firstIdx) {
            this.secondIdx = idx;
            card.state = 'revealed';
            this.checkMatch();
        }
    }

    handlePointerMove(_e: PointerEvent) { }
    handlePointerUp(_e: PointerEvent) { }

    private checkMatch() {
        const a = this.firstIdx!;
        const b = this.secondIdx!;
        if (this.cards[a].symbol === this.cards[b].symbol) {
            // Match!
            this.lockMs = 300;
            setTimeout(() => {
                if (this.cards[a]) this.cards[a].state = 'matched';
                if (this.cards[b]) this.cards[b].state = 'matched';
                this.matches++;
                this.showFeedback('✨ 매치!', '#16a34a');
                this.firstIdx = null;
                this.secondIdx = null;
                if (this.matches >= 8) this.done = true;
            }, 300);
        } else {
            // No match — lock then flip back
            this.lockMs = MG_BALANCE.MEMORY.FLIP_BACK_DELAY_MS;
            setTimeout(() => {
                if (this.cards[a]) this.cards[a].state = 'hidden';
                if (this.cards[b]) this.cards[b].state = 'hidden';
                this.firstIdx = null;
                this.secondIdx = null;
            }, MG_BALANCE.MEMORY.FLIP_BACK_DELAY_MS);
        }
    }

    private showFeedback(text: string, color: string) {
        this.feedbackText = text;
        this.feedbackColor = color;
        this.feedbackTimer = 800;
    }

    // Grid layout state (set during render)
    private gridLeft = 0;
    private gridTop = 0;
    private cellW = 0;
    private cellH = 0;

    private pointerToGrid(e: PointerEvent): { col: number; row: number } {
        if (!this.canvas) return { col: -1, row: -1 };
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor((x - this.gridLeft) / this.cellW);
        const row = Math.floor((y - this.gridTop) / this.cellH);
        return { col, row };
    }

    activateHint() {
        const remaining = (this.durationMs - this.elapsed) / 1000;
        if (this.hintUsed || remaining <= MG_BALANCE.MEMORY.HINT_DISABLE_SECS) return;
        this.hintUsed = true;
        this.hintActive = true;
        this.hintTimer = MG_BALANCE.MEMORY.HINT_DURATION_MS;
    }

    update(dtMs: number) {
        if (this.done) return;
        this.elapsed += dtMs;
        if (this.lockMs > 0) this.lockMs = Math.max(0, this.lockMs - dtMs);
        if (this.feedbackTimer > 0) this.feedbackTimer -= dtMs;

        if (this.hintActive) {
            this.hintTimer -= dtMs;
            if (this.hintTimer <= 0) this.hintActive = false;
        }

        // Animate flip progress
        for (const c of this.cards) {
            const target = (c.state === 'revealed' || c.state === 'matched' || this.hintActive) ? 1 : 0;
            const speed = 0.008 * dtMs;
            if (c.flipProgress < target) c.flipProgress = Math.min(target, c.flipProgress + speed);
            else if (c.flipProgress > target) c.flipProgress = Math.max(target, c.flipProgress - speed);
        }

        if (this.elapsed >= this.durationMs) {
            this.done = true;
        }
    }

    private canvas: HTMLCanvasElement | null = null;

    render(ctx: CanvasRenderingContext2D, w: number, h: number) {
        if (!this.canvas) this.canvas = ctx.canvas;
        const remaining = Math.max(0, Math.ceil((this.durationMs - this.elapsed) / 1000));

        // Background
        ctx.fillStyle = '#f0fdf4';
        ctx.fillRect(0, 0, w, h);

        // Timer
        ctx.fillStyle = remaining <= 5 ? '#dc2626' : '#1e293b';
        ctx.font = `bold ${Math.round(h * 0.08)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`⏱ ${remaining}초`, w / 2, h * 0.09);

        // Score
        ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
        ctx.fillStyle = '#475569';
        ctx.fillText(`쌍: ${this.matches} / 8`, w / 2, h * 0.16);

        // Grid layout
        const margin = w * 0.03;
        const gridW = w - margin * 2;
        const topOffset = h * 0.2;
        const gridH = h - topOffset - h * 0.05;
        this.cellW = gridW / this.cols;
        this.cellH = gridH / this.rows;
        this.gridLeft = margin;
        this.gridTop = topOffset;

        const pad = 4;
        const fontSize = Math.max(18, Math.min(this.cellW, this.cellH) * 0.5);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const idx = r * this.cols + c;
                const card = this.cards[idx];
                if (!card) continue;
                const x = this.gridLeft + c * this.cellW + pad;
                const y = this.gridTop + r * this.cellH + pad;
                const cw = this.cellW - pad * 2;
                const ch = this.cellH - pad * 2;

                const fp = card.flipProgress;

                // Draw card
                const radius = 8;
                ctx.save();
                ctx.translate(x + cw / 2, y + ch / 2);

                if (fp > 0.5) {
                    // Front face
                    const scaleX = (fp - 0.5) * 2;
                    ctx.scale(scaleX, 1);
                    ctx.fillStyle = card.state === 'matched' ? '#bbf7d0' : '#fffbeb';
                    roundRect(ctx, -cw / 2, -ch / 2, cw, ch, radius);
                    ctx.fill();
                    ctx.strokeStyle = card.state === 'matched' ? '#16a34a' : '#fbbf24';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.font = `${Math.round(fontSize)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(card.symbol, 0, 0);
                } else {
                    // Back face
                    const scaleX = 1 - fp * 2;
                    ctx.scale(scaleX, 1);
                    ctx.fillStyle = '#818cf8';
                    roundRect(ctx, -cw / 2, -ch / 2, cw, ch, radius);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = `${Math.round(fontSize * 0.6)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', 0, 0);
                }
                ctx.restore();
            }
        }

        // Feedback
        if (this.feedbackTimer > 0) {
            ctx.globalAlpha = Math.min(1, this.feedbackTimer / 400);
            ctx.font = `bold ${Math.round(h * 0.065)}px sans-serif`;
            ctx.fillStyle = this.feedbackColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(this.feedbackText, w / 2, h * 0.21);
            ctx.globalAlpha = 1;
        }
    }

    isDone() { return this.done; }

    getResult(): MinigameResult {
        const goldEarned = this.matches * MG_BALANCE.MEMORY.GOLD_PER_MATCH;
        let amberEarned = 0;
        if (this.matches >= 8) amberEarned = MG_BALANCE.MEMORY.AMBER_FULL;
        else if (this.matches >= MG_BALANCE.MEMORY.AMBER_GOOD_THRESHOLD) amberEarned = MG_BALANCE.MEMORY.AMBER_GOOD;
        return { score: this.matches, goldEarned, amberEarned };
    }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
