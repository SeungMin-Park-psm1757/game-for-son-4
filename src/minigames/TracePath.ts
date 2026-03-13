import { Minigame, MinigameId, MinigameResult } from './MinigameInterface';
import { MG_BALANCE } from '../minigameBalance';

interface Vec2 {
    x: number;
    y: number;
}

export class TracePath implements Minigame {
    id: MinigameId = 'trace_path';
    title = '산책 길찾기';

    private durationMs = MG_BALANCE.TRACE.DURATION_S * 1000;
    private elapsed = 0;
    private score = 0;
    private level = 1;
    private done = false;

    private canvas: HTMLCanvasElement | null = null;
    private canvasW = 360;
    private canvasH = 560;

    private pathPoints: Vec2[] = [];
    private tracing = false;
    private deviateTimer = 0;
    private lastPos: Vec2 | null = null;
    private progressIndex = 0;

    private feedbackText = '';
    private feedbackTimer = 0;
    private feedbackColor = '#16a34a';

    start(seed: number) {
        this.elapsed = 0;
        this.score = 0;
        this.level = 1;
        this.done = false;
        this.tracing = false;
        this.deviateTimer = 0;
        this.lastPos = null;
        this.progressIndex = 0;
        this.generatePath(seed);
    }

    handlePointerDown(e: PointerEvent) {
        if (this.done || this.pathPoints.length === 0) return;

        const pos = this.eventToLogical(e);
        if (!pos) return;

        const start = this.pathPoints[0];
        if (this.distance(pos, start) <= this.getStartRadius()) {
            this.tracing = true;
            this.deviateTimer = 0;
            this.progressIndex = 0;
            this.lastPos = pos;
        }
    }

    handlePointerMove(e: PointerEvent) {
        if (!this.tracing || this.done) return;
        const pos = this.eventToLogical(e);
        if (!pos) return;
        this.lastPos = pos;
    }

    handlePointerUp(_e: PointerEvent) {
        if (!this.tracing) return;
        this.tracing = false;
        this.deviateTimer = 0;
        this.progressIndex = 0;
        this.showFeedback('처음부터 다시 이어 보자!', '#f59e0b');
    }

    update(dtMs: number) {
        if (this.done) return;

        this.elapsed += dtMs;
        if (this.feedbackTimer > 0) this.feedbackTimer -= dtMs;

        if (this.tracing && this.lastPos && this.pathPoints.length > 0) {
            const closest = this.closestOnPath(this.lastPos);
            if (closest.dist > this.getAllowRadius()) {
                this.deviateTimer += dtMs;
                if (this.deviateTimer >= this.getDeviateTimeoutMs()) {
                    this.tracing = false;
                    this.deviateTimer = 0;
                    this.progressIndex = 0;
                    this.showFeedback('길을 벗어났어. 다시 출발!', '#ef4444');
                }
            } else {
                this.deviateTimer = 0;
                this.progressIndex = Math.max(this.progressIndex, closest.index);

                const end = this.pathPoints[this.pathPoints.length - 1];
                const reachedEnd = this.distance(this.lastPos, end) <= this.getEndRadius();
                const enoughProgress = this.progressIndex >= Math.floor(this.pathPoints.length * 0.82);

                if (reachedEnd && enoughProgress) {
                    this.score++;
                    this.level = this.score + 1;
                    this.tracing = false;
                    this.progressIndex = 0;
                    this.showFeedback(`성공! 다음은 Lv.${this.level}`, '#16a34a');
                    this.generatePath(Date.now() + this.score * 17);
                }
            }
        }

        if (this.elapsed >= this.durationMs) {
            this.done = true;
        }
    }

    render(ctx: CanvasRenderingContext2D, w: number, h: number) {
        if (!this.canvas) this.canvas = ctx.canvas;
        this.canvasW = w;
        this.canvasH = h;

        const remaining = Math.max(0, Math.ceil((this.durationMs - this.elapsed) / 1000));

        ctx.fillStyle = '#f0fdf4';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#dcfce7';
        ctx.fillRect(0, h * 0.12, w, h * 0.68);

        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.78);
        ctx.quadraticCurveTo(w * 0.25, h * 0.72, w * 0.5, h * 0.8);
        ctx.quadraticCurveTo(w * 0.75, h * 0.88, w, h * 0.75);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = remaining <= 5 ? '#dc2626' : '#1f2937';
        ctx.font = `bold ${Math.round(h * 0.075)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${remaining}`, w / 2, h * 0.09);

        ctx.font = `bold ${Math.round(h * 0.045)}px sans-serif`;
        ctx.fillStyle = '#0f766e';
        ctx.fillText(`성공 ${this.score}회`, w * 0.24, h * 0.16);
        ctx.fillStyle = '#2563eb';
        ctx.fillText(`Lv.${this.level}`, w * 0.76, h * 0.16);

        if (this.pathPoints.length > 1) {
            const roadWidth = this.getRoadWidth();

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.strokeStyle = '#d9f99d';
            ctx.lineWidth = roadWidth;
            ctx.beginPath();
            ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
            for (let i = 1; i < this.pathPoints.length; i++) {
                ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
            }
            ctx.stroke();

            ctx.strokeStyle = '#65a30d';
            ctx.lineWidth = Math.max(3, roadWidth * 0.22);
            ctx.setLineDash([10, 8]);
            ctx.beginPath();
            ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
            for (let i = 1; i < this.pathPoints.length; i++) {
                ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            if (this.progressIndex > 0) {
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = Math.max(6, roadWidth * 0.34);
                ctx.beginPath();
                ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
                for (let i = 1; i <= this.progressIndex; i++) {
                    ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
                }
                ctx.stroke();
            }

            ctx.restore();
        }

        const start = this.pathPoints[0];
        const end = this.pathPoints[this.pathPoints.length - 1];

        if (start) {
            ctx.beginPath();
            ctx.arc(start.x, start.y, this.getStartRadius(), 0, Math.PI * 2);
            ctx.fillStyle = this.tracing ? '#0ea5e9' : '#38bdf8';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(this.getStartRadius() * 0.85)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', start.x, start.y);
        }

        if (end) {
            ctx.beginPath();
            ctx.arc(end.x, end.y, this.getEndRadius(), 0, Math.PI * 2);
            ctx.fillStyle = '#f97316';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(this.getEndRadius() * 0.52)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GOAL', end.x, end.y);
        }

        if (this.tracing && this.lastPos) {
            ctx.beginPath();
            ctx.arc(this.lastPos.x, this.lastPos.y, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(20, 184, 166, 0.25)';
            ctx.fill();
            ctx.strokeStyle = '#14b8a6';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (this.deviateTimer > 0) {
            const ratio = this.deviateTimer / this.getDeviateTimeoutMs();
            ctx.fillStyle = `rgba(239, 68, 68, ${0.25 + ratio * 0.45})`;
            ctx.fillRect(0, h * 0.88, w * Math.min(1, ratio), 7);
        }

        if (this.feedbackTimer > 0) {
            ctx.globalAlpha = Math.min(1, this.feedbackTimer / 400);
            ctx.font = `bold ${Math.round(h * 0.06)}px sans-serif`;
            ctx.fillStyle = this.feedbackColor;
            ctx.textAlign = 'center';
            ctx.fillText(this.feedbackText, w / 2, h * 0.24);
            ctx.globalAlpha = 1;
        }

        ctx.font = `${Math.round(h * 0.038)}px sans-serif`;
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText('S에서 시작해 길을 따라 GOAL까지 이어 주세요.', w / 2, h * 0.95);
    }

    isDone() {
        return this.done;
    }

    getTimerText() {
        return Math.max(0, Math.ceil((this.durationMs - this.elapsed) / 1000)).toString();
    }

    getResult(): MinigameResult {
        return {
            score: this.score,
            goldEarned: this.score * MG_BALANCE.TRACE.GOLD_PER_SUCCESS,
            amberEarned: Math.floor(this.score / MG_BALANCE.TRACE.AMBER_DIVISOR),
        };
    }

    private generatePath(seed: number) {
        let rng = seed >>> 0;
        const rand = (min: number, max: number) => {
            rng = (rng * 1664525 + 1013904223) >>> 0;
            return min + (rng / 0x100000000) * (max - min);
        };

        const turnCount = Math.min(8, 4 + Math.floor((this.level - 1) / 2));
        const anchors: Vec2[] = [];
        anchors.push({
            x: rand(this.canvasW * 0.15, this.canvasW * 0.28),
            y: rand(this.canvasH * 0.72, this.canvasH * 0.82),
        });

        for (let i = 1; i <= turnCount; i++) {
            const progress = i / (turnCount + 1);
            const laneBias = i % 2 === 0 ? 0.26 : 0.74;
            const wiggle = Math.min(0.28, 0.08 + this.level * 0.018);
            anchors.push({
                x: rand(
                    this.canvasW * Math.max(0.1, laneBias - wiggle),
                    this.canvasW * Math.min(0.9, laneBias + wiggle),
                ),
                y: this.canvasH * (0.82 - progress * 0.58) + rand(-this.canvasH * 0.035, this.canvasH * 0.035),
            });
        }

        anchors.push({
            x: rand(this.canvasW * 0.72, this.canvasW * 0.88),
            y: rand(this.canvasH * 0.16, this.canvasH * 0.28),
        });

        this.pathPoints = [];
        const samplesPerSegment = 12;
        for (let i = 0; i < anchors.length - 1; i++) {
            const start = anchors[i];
            const end = anchors[i + 1];
            for (let step = 0; step < samplesPerSegment; step++) {
                const t = step / samplesPerSegment;
                this.pathPoints.push({
                    x: start.x + (end.x - start.x) * t,
                    y: start.y + (end.y - start.y) * t,
                });
            }
        }
        this.pathPoints.push(anchors[anchors.length - 1]);
    }

    private closestOnPath(pos: Vec2) {
        let bestIndex = 0;
        let bestDist = Infinity;

        for (let i = 0; i < this.pathPoints.length; i++) {
            const dist = this.distance(pos, this.pathPoints[i]);
            if (dist < bestDist) {
                bestDist = dist;
                bestIndex = i;
            }
        }

        return {
            index: bestIndex,
            dist: bestDist,
        };
    }

    private eventToLogical(e: PointerEvent): Vec2 | null {
        if (!this.canvas) return null;
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvasW / rect.width),
            y: (e.clientY - rect.top) * (this.canvasH / rect.height),
        };
    }

    private distance(a: Vec2, b: Vec2) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private showFeedback(text: string, color: string) {
        this.feedbackText = text;
        this.feedbackColor = color;
        this.feedbackTimer = 1000;
    }

    private getAllowRadius() {
        return Math.max(10, MG_BALANCE.TRACE.ALLOW_R - (this.level - 1) * 2.6);
    }

    private getStartRadius() {
        return Math.max(12, MG_BALANCE.TRACE.START_RADIUS - (this.level - 1) * 0.6);
    }

    private getEndRadius() {
        return Math.max(12, MG_BALANCE.TRACE.END_RADIUS - (this.level - 1) * 0.6);
    }

    private getRoadWidth() {
        return Math.max(20, MG_BALANCE.TRACE.PATH_LINE_WIDTH - (this.level - 1) * 4.2);
    }

    private getDeviateTimeoutMs() {
        return Math.max(240, MG_BALANCE.TRACE.DEVIATE_TIMEOUT_S * 1000 - (this.level - 1) * 85);
    }
}
