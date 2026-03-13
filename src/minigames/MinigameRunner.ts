// ============================================================
// MinigameRunner.ts — Canvas 기반 공통 미니게임 루프
// ============================================================
import { Minigame, MinigameResult } from './MinigameInterface';

export class MinigameRunner {
    private raf: number | null = null;
    private lastTime: number = 0;
    private game: Minigame | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private timerEl: HTMLElement | null = null;
    private onDone: ((result: MinigameResult) => void) | null = null;
    private boundDown: (e: PointerEvent) => void;
    private boundMove: (e: PointerEvent) => void;
    private boundUp: (e: PointerEvent) => void;
    private boundResize: () => void;

    constructor() {
        this.boundDown = (e) => { e.preventDefault(); this.game?.handlePointerDown(e); };
        this.boundMove = (e) => { e.preventDefault(); this.game?.handlePointerMove(e); };
        this.boundUp = (e) => { e.preventDefault(); this.game?.handlePointerUp(e); };
        this.boundResize = () => this.resizeCanvas();
    }

    start(
        game: Minigame,
        canvas: HTMLCanvasElement,
        timerEl: HTMLElement,
        titleEl: HTMLElement,
        onDone: (result: MinigameResult) => void
    ) {
        this.game = game;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.timerEl = timerEl;
        this.onDone = onDone;

        // Fit canvas to its CSS display size
        this.resizeCanvas();

        if (titleEl) titleEl.textContent = game.title;

        const seed = Date.now();
        game.start(seed);

        // Pointer events (unified mouse + touch)
        canvas.addEventListener('pointerdown', this.boundDown, { passive: false });
        canvas.addEventListener('pointermove', this.boundMove, { passive: false });
        canvas.addEventListener('pointerup', this.boundUp, { passive: false });
        window.addEventListener('resize', this.boundResize);

        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    private resizeCanvas() {
        const c = this.canvas!;
        const rect = c.getBoundingClientRect();
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        c.width = Math.max(1, Math.floor(rect.width * dpr));
        c.height = Math.max(1, Math.floor(rect.height * dpr));
        this.ctx = c.getContext('2d')!;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /** Logical width/height (CSS pixels) */
    private get logicalW() { return this.canvas!.width / Math.max(1, window.devicePixelRatio || 1); }
    private get logicalH() { return this.canvas!.height / Math.max(1, window.devicePixelRatio || 1); }

    private loop = (now: number) => {
        const dt = now - this.lastTime;
        this.lastTime = now;

        if (!this.game || !this.ctx) return;

        this.game.update(dt);

        if (this.timerEl) {
            this.timerEl.textContent = this.game.getTimerText ? this.game.getTimerText() : '';
        }

        const ctx = this.ctx;
        const w = this.logicalW;
        const h = this.logicalH;
        ctx.clearRect(0, 0, w, h);
        this.game.render(ctx, w, h);

        if (this.game.isDone()) {
            const finishedGame = this.game;
            this.stop();
            const result = finishedGame.getResult();
            if (this.onDone) this.onDone(result);
            return;
        }

        this.raf = requestAnimationFrame(this.loop);
    };

    stop() {
        if (this.raf !== null) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
        if (this.canvas) {
            this.canvas.removeEventListener('pointerdown', this.boundDown);
            this.canvas.removeEventListener('pointermove', this.boundMove);
            this.canvas.removeEventListener('pointerup', this.boundUp);
        }
        window.removeEventListener('resize', this.boundResize);
        this.game = null;
    }

    setTimerText(text: string) {
        if (this.timerEl) this.timerEl.textContent = text;
    }
}
