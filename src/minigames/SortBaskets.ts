import { Minigame, MinigameId, MinigameResult } from './MinigameInterface';
import { MG_BALANCE } from '../minigameBalance';

interface FallingItem {
    id: number;
    icon: string;
    label: string;
    x: number;
    y: number;
    speed: number;
    size: number;
    spin: number;
}

const ITEM_POOL = [
    { icon: '🍎', label: '사과 상자' },
    { icon: '🥕', label: '당근 바구니' },
    { icon: '🍐', label: '배 꾸러미' },
    { icon: '🥬', label: '잎채소 묶음' },
] as const;

export class SortBaskets implements Minigame {
    id: MinigameId = 'sort_baskets';
    title = '바구니 받기';

    private durationMs = MG_BALANCE.SORT.DURATION_S * 1000;
    private elapsed = 0;
    private score = 0;
    private mistakes = 0;
    private combo = 0;
    private comboBonus = 0;
    private done = false;

    private canvas: HTMLCanvasElement | null = null;
    private canvasW = 360;
    private canvasH = 560;

    private catcherX = 180;
    private targetX = 180;
    private spawnTimer = 0;
    private nextSpawnMs = 700;
    private itemSerial = 0;
    private items: FallingItem[] = [];

    private feedbackText = '';
    private feedbackTimer = 0;
    private feedbackColor = '#16a34a';

    start(_seed: number) {
        this.elapsed = 0;
        this.score = 0;
        this.mistakes = 0;
        this.combo = 0;
        this.comboBonus = 0;
        this.done = false;
        this.spawnTimer = 0;
        this.nextSpawnMs = 700;
        this.itemSerial = 0;
        this.items = [];
        this.feedbackText = '';
        this.feedbackTimer = 0;
        this.catcherX = this.canvasW / 2;
        this.targetX = this.catcherX;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    handlePointerDown(e: PointerEvent) {
        this.updateTargetX(e);
    }

    handlePointerMove(e: PointerEvent) {
        this.updateTargetX(e);
    }

    handlePointerUp(e: PointerEvent) {
        this.updateTargetX(e);
    }

    update(dtMs: number) {
        if (this.done) return;

        this.elapsed += dtMs;
        this.spawnTimer += dtMs;
        if (this.feedbackTimer > 0) this.feedbackTimer -= dtMs;

        const moveSpeed = MG_BALANCE.SORT.CATCHER_SPEED_PX_PER_S * (dtMs / 1000);
        if (Math.abs(this.targetX - this.catcherX) <= moveSpeed) {
            this.catcherX = this.targetX;
        } else if (this.targetX > this.catcherX) {
            this.catcherX += moveSpeed;
        } else {
            this.catcherX -= moveSpeed;
        }

        if (this.spawnTimer >= this.nextSpawnMs) {
            this.spawnTimer = 0;
            this.spawnItem();
            this.nextSpawnMs = this.randomBetween(
                MG_BALANCE.SORT.SPAWN_INTERVAL_MIN_MS,
                MG_BALANCE.SORT.SPAWN_INTERVAL_MAX_MS,
            );
        }

        const catchY = this.canvasH * 0.78;
        const catchHalfWidth = MG_BALANCE.SORT.CATCH_WIDTH_PX / 2;

        this.items = this.items.filter((item) => {
            item.y += item.speed * (dtMs / 1000);
            item.spin += 0.05;

            const isCaught =
                item.y >= catchY - item.size * 0.35 &&
                item.y <= catchY + item.size * 0.4 &&
                Math.abs(item.x - this.catcherX) <= catchHalfWidth;

            if (isCaught) {
                this.onCatch();
                return false;
            }

            if (item.y > this.canvasH + item.size) {
                this.onMiss();
                return false;
            }

            return true;
        });

        if (this.elapsed >= this.durationMs) {
            this.done = true;
        }
    }

    render(ctx: CanvasRenderingContext2D, w: number, h: number) {
        if (!this.canvas) this.canvas = ctx.canvas;
        this.canvasW = w;
        this.canvasH = h;

        const remaining = Math.max(0, Math.ceil((this.durationMs - this.elapsed) / 1000));
        const catchY = h * 0.78;
        const basketWidth = MG_BALANCE.SORT.CATCH_WIDTH_PX;

        ctx.fillStyle = '#f6fbff';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#d8f0ff';
        ctx.fillRect(0, h * 0.12, w, h * 0.58);

        ctx.fillStyle = '#9fd48f';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.quadraticCurveTo(w * 0.2, h * 0.66, w * 0.45, h * 0.71);
        ctx.quadraticCurveTo(w * 0.72, h * 0.76, w, h * 0.68);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = remaining <= 5 ? '#dc2626' : '#1f2937';
        ctx.font = `bold ${Math.round(h * 0.08)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${remaining}`, w / 2, h * 0.09);

        ctx.font = `bold ${Math.round(h * 0.045)}px sans-serif`;
        ctx.fillStyle = '#475569';
        ctx.fillText(`받은 꾸러미 ${this.score}개`, w / 2, h * 0.16);

        ctx.font = `bold ${Math.round(h * 0.04)}px sans-serif`;
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`콤보 ${this.combo}`, w * 0.22, h * 0.22);
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`놓침 ${this.mistakes}`, w * 0.78, h * 0.22);

        ctx.save();
        ctx.translate(this.catcherX, catchY);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 34, 56, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6dd5a2';
        ctx.beginPath();
        ctx.ellipse(-8, -4, 34, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78e2b2';
        ctx.beginPath();
        ctx.ellipse(22, -28, 18, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(28, -31, 2.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d8a15d';
        ctx.beginPath();
        (ctx as any).roundRect(-basketWidth / 2, 4, basketWidth, 28, 14);
        ctx.fill();
        ctx.strokeStyle = '#a56b36';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#a56b36';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-basketWidth / 2 + 14, 4);
        ctx.quadraticCurveTo(0, -12, basketWidth / 2 - 14, 4);
        ctx.stroke();

        ctx.restore();

        for (const item of this.items) {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(Math.sin(item.spin) * 0.12);

            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(0, 0, item.size * 0.52, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = `${Math.round(item.size)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.icon, 0, 0);
            ctx.restore();
        }

        if (this.feedbackTimer > 0) {
            ctx.globalAlpha = Math.min(1, this.feedbackTimer / 400);
            ctx.font = `bold ${Math.round(h * 0.06)}px sans-serif`;
            ctx.fillStyle = this.feedbackColor;
            ctx.textAlign = 'center';
            ctx.fillText(this.feedbackText, w / 2, h * 0.3);
            ctx.globalAlpha = 1;
        }

        ctx.font = `${Math.round(h * 0.038)}px sans-serif`;
        ctx.fillStyle = '#64748b';
        ctx.fillText('좌우로 움직여서 떨어지는 꾸러미를 받아 주세요.', w / 2, h * 0.94);
    }

    isDone() {
        return this.done;
    }

    getResult(): MinigameResult {
        const goldEarned = this.score * MG_BALANCE.SORT.GOLD_PER_POINT + this.comboBonus;
        const amberEarned = Math.floor(this.score / MG_BALANCE.SORT.AMBER_DIVISOR);
        return {
            score: this.score,
            goldEarned,
            amberEarned,
            details: { mistakes: this.mistakes, combo: this.combo },
        };
    }

    private updateTargetX(e: PointerEvent) {
        if (this.done || !this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const localX = (e.clientX - rect.left) * (this.canvasW / rect.width);
        const margin = MG_BALANCE.SORT.CATCH_WIDTH_PX * 0.55;
        this.targetX = Math.max(margin, Math.min(this.canvasW - margin, localX));
    }

    private spawnItem() {
        const pick = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
        const safeMargin = 36;
        const difficultyBoost = Math.min(90, this.score * 4);

        this.items.push({
            id: this.itemSerial++,
            icon: pick.icon,
            label: pick.label,
            x: this.randomBetween(safeMargin, this.canvasW - safeMargin),
            y: -20,
            speed: this.randomBetween(
                MG_BALANCE.SORT.FALL_SPEED_MIN_PX_PER_S + difficultyBoost,
                MG_BALANCE.SORT.FALL_SPEED_MAX_PX_PER_S + difficultyBoost,
            ),
            size: this.randomBetween(28, 36),
            spin: Math.random() * Math.PI,
        });
    }

    private onCatch() {
        this.score++;
        this.combo++;

        if (this.combo > 0 && this.combo % MG_BALANCE.SORT.COMBO_BONUS_EVERY === 0) {
            this.comboBonus += MG_BALANCE.SORT.COMBO_BONUS_GOLD;
            this.showFeedback(`콤보 보너스 +${MG_BALANCE.SORT.COMBO_BONUS_GOLD}G`, '#d97706');
            return;
        }

        this.showFeedback('착!', '#16a34a');
    }

    private onMiss() {
        this.mistakes++;
        this.combo = 0;
        this.showFeedback('앗, 놓쳤어!', '#ef4444');
    }

    private showFeedback(text: string, color: string) {
        this.feedbackText = text;
        this.feedbackColor = color;
        this.feedbackTimer = 900;
    }

    private randomBetween(min: number, max: number) {
        return min + Math.random() * (max - min);
    }
}
