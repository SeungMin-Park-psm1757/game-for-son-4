// ============================================================
// TracePath.ts — 길 따라가기 미니게임
// id: trace_path | 조작: 드래그 | 15초
// ============================================================
import { Minigame, MinigameId, MinigameResult } from './MinigameInterface';
import { MG_BALANCE } from '../minigameBalance';

interface Vec2 { x: number; y: number; }

interface PathData {
    start: Vec2;
    ctrl1: Vec2;
    ctrl2: Vec2;
    end: Vec2;
}

export class TracePath implements Minigame {
    id: MinigameId = 'trace_path';
    title = '🐾 산책 길찾기';

    private durationMs = MG_BALANCE.TRACE.DURATION_S * 1000;
    private elapsed = 0;
    private score = 0;
    private done = false;

    private path: PathData | null = null;
    private tracing = false;       // 손가락이 시작점을 눌렀는지
    private deviateTimer = 0;      // 이탈 누적 시간(ms)
    private lastPos: Vec2 | null = null;
    private progressT = 0;         // 현재 완료된 경로 비율 (0~1)

    // Feedback
    private feedbackText = '';
    private feedbackTimer = 0;
    private feedbackColor = '#16a34a';

    // Precomputed path points for faster lookup
    private canvas: HTMLCanvasElement | null = null;
    private pathPoints: Vec2[] = [];
    private readonly PATH_SAMPLES = 80;

    // Canvas logical size (set during render, used in pointer)
    private canvasW = 360;
    private canvasH = 560;

    start(seed: number) {
        this.elapsed = 0;
        this.score = 0;
        this.done = false;
        this.tracing = false;
        this.deviateTimer = 0;
        this.lastPos = null;
        this.progressT = 0;
        this.generatePath(seed);
    }

    private generatePath(seed: number) {
        let rng = seed;
        const rand = (min: number, max: number) => {
            rng = (rng * 1664525 + 1013904223) >>> 0;
            return min + (rng / 0x100000000) * (max - min);
        };

        const w = this.canvasW;
        const h = this.canvasH;

        // Start near bottom-left, end near top-right (or varied)
        const startX = rand(w * 0.1, w * 0.25);
        const startY = rand(h * 0.65, h * 0.8);
        const endX = rand(w * 0.72, w * 0.9);
        const endY = rand(h * 0.2, h * 0.38);

        // Two control points for cubic bezier
        const ctrl1: Vec2 = { x: rand(w * 0.25, w * 0.5), y: rand(h * 0.55, h * 0.75) };
        const ctrl2: Vec2 = { x: rand(w * 0.5, w * 0.75), y: rand(h * 0.25, h * 0.45) };

        this.path = {
            start: { x: startX, y: startY },
            ctrl1,
            ctrl2,
            end: { x: endX, y: endY },
        };

        // Pre-sample path points
        this.pathPoints = [];
        for (let i = 0; i <= this.PATH_SAMPLES; i++) {
            const t = i / this.PATH_SAMPLES;
            this.pathPoints.push(this.bezier(t));
        }
    }

    /** Cubic bezier point at t */
    private bezier(t: number): Vec2 {
        if (!this.path) return { x: 0, y: 0 };
        const { start: p0, ctrl1: p1, ctrl2: p2, end: p3 } = this.path;
        const mt = 1 - t;
        return {
            x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
            y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
        };
    }

    /** Find closest point index on precomputed path */
    private closestOnPath(pos: Vec2): { point: Vec2; t: number; dist: number } {
        let best = { point: this.pathPoints[0], t: 0, dist: Infinity };
        for (let i = 0; i < this.pathPoints.length; i++) {
            const pt = this.pathPoints[i];
            const dx = pos.x - pt.x;
            const dy = pos.y - pt.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < best.dist) {
                best = { point: pt, t: i / this.PATH_SAMPLES, dist: d };
            }
        }
        return best;
    }

    handlePointerDown(e: PointerEvent) {
        if (this.done || !this.path) return;
        const pos = this.eventToLogical(e);
        if (!pos) return;

        if (!this.tracing) {
            // Must start from the start point
            const dx = pos.x - this.path.start.x;
            const dy = pos.y - this.path.start.y;
            if (Math.sqrt(dx * dx + dy * dy) <= MG_BALANCE.TRACE.START_RADIUS) {
                this.tracing = true;
                this.deviateTimer = 0;
                this.progressT = 0;
                this.lastPos = pos;
            }
        }
    }

    handlePointerMove(e: PointerEvent) {
        if (!this.tracing || this.done || !this.path) return;
        const pos = this.eventToLogical(e);
        if (!pos) return;
        this.lastPos = pos;
    }

    handlePointerUp(_e: PointerEvent) {
        if (this.tracing) {
            this.tracing = false;
            this.deviateTimer = 0;
            this.progressT = 0;
            this.showFeedback('손가락을 떼면 처음부터 다시!', '#f59e0b');
        }
    }

    private eventToLogical(e: PointerEvent): Vec2 | null {
        if (!this.canvas) return null;
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvasW / rect.width),
            y: (e.clientY - rect.top) * (this.canvasH / rect.height),
        };
    }

    private showFeedback(text: string, color: string) {
        this.feedbackText = text;
        this.feedbackColor = color;
        this.feedbackTimer = 1000;
    }

    update(dtMs: number) {
        if (this.done) return;
        this.elapsed += dtMs;
        if (this.feedbackTimer > 0) this.feedbackTimer -= dtMs;

        if (this.tracing && this.lastPos && this.path) {
            const { dist, t } = this.closestOnPath(this.lastPos);
            const r = MG_BALANCE.TRACE.ALLOW_R;

            if (dist > r) {
                // Deviate
                this.deviateTimer += dtMs;
                if (this.deviateTimer >= MG_BALANCE.TRACE.DEVIATE_TIMEOUT_S * 1000) {
                    // Reset to start
                    this.tracing = false;
                    this.deviateTimer = 0;
                    this.progressT = 0;
                    this.showFeedback('🔄 시작점으로 돌아가세요!', '#f59e0b');
                }
            } else {
                this.deviateTimer = 0;
                // Only advance progress (no going back)
                if (t > this.progressT) this.progressT = t;

                // Check end reached
                const endDx = this.lastPos.x - this.path.end.x;
                const endDy = this.lastPos.y - this.path.end.y;
                const endDist = Math.sqrt(endDx * endDx + endDy * endDy);
                if (endDist <= MG_BALANCE.TRACE.END_RADIUS && this.progressT > 0.7) {
                    this.score++;
                    this.showFeedback('🎉 도착!', '#16a34a');
                    this.tracing = false;
                    this.progressT = 0;
                    // Generate new path
                    this.generatePath(Date.now() + this.score);
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

        // Background
        ctx.fillStyle = '#ecfdf5';
        ctx.fillRect(0, 0, w, h);

        // Timer
        ctx.fillStyle = remaining <= 5 ? '#dc2626' : '#1e293b';
        ctx.font = `bold ${Math.round(h * 0.075)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`⏱ ${remaining}초`, w / 2, h * 0.09);

        // Score
        ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
        ctx.fillStyle = '#475569';
        ctx.fillText(`성공: ${this.score}회`, w / 2, h * 0.16);

        if (!this.path || this.pathPoints.length === 0) return;

        // Draw path (thick line = road)
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Road background
        ctx.strokeStyle = '#d1fae5';
        ctx.lineWidth = MG_BALANCE.TRACE.PATH_LINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();

        // Road center line (dashed)
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Progress trail
        if (this.progressT > 0) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 10;
            ctx.beginPath();
            const maxI = Math.floor(this.progressT * this.PATH_SAMPLES);
            ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
            for (let i = 1; i <= maxI; i++) {
                ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
            }
            ctx.stroke();
        }

        ctx.restore();

        // Start marker
        const sp = this.path.start;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, MG_BALANCE.TRACE.START_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.tracing ? '#10b981' : '#34d399';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(MG_BALANCE.TRACE.START_RADIUS * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', sp.x, sp.y);

        // End marker
        const ep = this.path.end;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, MG_BALANCE.TRACE.END_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(MG_BALANCE.TRACE.END_RADIUS * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', ep.x, ep.y);

        // Current finger position indicator
        if (this.tracing && this.lastPos) {
            ctx.beginPath();
            ctx.arc(this.lastPos.x, this.lastPos.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Deviate warning bar
        if (this.deviateTimer > 0) {
            const ratio = this.deviateTimer / (MG_BALANCE.TRACE.DEVIATE_TIMEOUT_S * 1000);
            ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + ratio * 0.5})`;
            ctx.fillRect(0, h * 0.88, w * ratio, 6);
        }

        // Feedback
        if (this.feedbackTimer > 0) {
            ctx.globalAlpha = Math.min(1, this.feedbackTimer / 400);
            ctx.font = `bold ${Math.round(h * 0.065)}px sans-serif`;
            ctx.fillStyle = this.feedbackColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(this.feedbackText, w / 2, h * 0.22);
            ctx.globalAlpha = 1;
        }

        // Instructions
        if (!this.tracing) {
            ctx.font = `${Math.round(h * 0.04)}px sans-serif`;
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('S에서 시작해 길 위로 🏁까지 드래그하세요', w / 2, h * 0.95);
        }
    }

    isDone() { return this.done; }

    getResult(): MinigameResult {
        const goldEarned = this.score * MG_BALANCE.TRACE.GOLD_PER_SUCCESS;
        const amberEarned = Math.floor(this.score / MG_BALANCE.TRACE.AMBER_DIVISOR);
        return { score: this.score, goldEarned, amberEarned };
    }
}
