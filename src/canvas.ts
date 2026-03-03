import { FSM, PetState } from './fsm';

// ─────────────────────────────────────────────────────────────────────────────
//  Expression catalog – 20 named presets using eye + mouth descriptors
// ─────────────────────────────────────────────────────────────────────────────
export type ExpressionKey =
    | 'happy' | 'excited' | 'proud' | 'loving' | 'playful'      // positive
    | 'sleepy' | 'tired' | 'bored' | 'calm' | 'thinking'         // neutral-low
    | 'hungry' | 'sad' | 'worried' | 'confused' | 'shy'          // negative mild
    | 'angry' | 'sick' | 'shocked' | 'crying' | 'smug';          // strong

interface Expression {
    eyeType: 'open' | 'half' | 'closed' | 'wide' | 'squint' | 'heart' | 'cross' | 'star' | 'tears';
    mouthType: 'smile' | 'bigSmile' | 'flat' | 'frown' | 'open' | 'openHappy' | 'smirk' | 'pout' | 'oo' | 'wavyTired';
    blush?: boolean;
    blushColor?: string;
    browType?: 'none' | 'angry' | 'worried' | 'raised';
}

const EXPRESSIONS: Record<ExpressionKey, Expression> = {
    happy: { eyeType: 'open', mouthType: 'smile', blush: true, blushColor: '#fca5a5' },
    excited: { eyeType: 'star', mouthType: 'bigSmile', blush: true, blushColor: '#fb923c' },
    proud: { eyeType: 'squint', mouthType: 'smirk', blush: false, browType: 'raised' },
    loving: { eyeType: 'heart', mouthType: 'smile', blush: true, blushColor: '#fb7185' },
    playful: { eyeType: 'open', mouthType: 'openHappy', blush: true, blushColor: '#fca5a5' },
    sleepy: { eyeType: 'half', mouthType: 'wavyTired', blush: false },
    tired: { eyeType: 'closed', mouthType: 'flat', blush: false },
    bored: { eyeType: 'half', mouthType: 'flat', blush: false },
    calm: { eyeType: 'open', mouthType: 'smile', blush: false },
    thinking: { eyeType: 'squint', mouthType: 'pout', blush: false, browType: 'raised' },
    hungry: { eyeType: 'open', mouthType: 'frown', blush: false, browType: 'worried' },
    sad: { eyeType: 'tears', mouthType: 'frown', blush: false, browType: 'worried' },
    worried: { eyeType: 'open', mouthType: 'pout', blush: false, browType: 'worried' },
    confused: { eyeType: 'wide', mouthType: 'oo', blush: false, browType: 'raised' },
    shy: { eyeType: 'half', mouthType: 'smile', blush: true, blushColor: '#fca5a5' },
    angry: { eyeType: 'squint', mouthType: 'frown', blush: false, browType: 'angry' },
    sick: { eyeType: 'cross', mouthType: 'wavyTired', blush: false },
    shocked: { eyeType: 'wide', mouthType: 'open', blush: false, browType: 'raised' },
    crying: { eyeType: 'tears', mouthType: 'frown', blush: false, browType: 'worried' },
    smug: { eyeType: 'squint', mouthType: 'smirk', blush: false, browType: 'none' },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Age helpers
//  ageTicks = real seconds elapsed.  1 game-year = 3 game-days = 3*86400 ticks
// ─────────────────────────────────────────────────────────────────────────────
const TICKS_PER_YEAR = 3 * 24 * 60 * 60; // 259200 s

function getAgeYears(ageTicks: number): number {
    return ageTicks / TICKS_PER_YEAR;
}

/** Returns a size multiplier based on age (4yr = 1.0 baseline) */
function ageSizeMultiplier(ageYears: number): number {
    if (ageYears < 0.1) return 0.35;        // just hatched – tiny
    if (ageYears < 1) return 0.35 + ageYears * 0.35;   // 0→1 : 0.35→0.70
    if (ageYears < 4) return 0.70 + (ageYears - 1) / 3 * 0.30; // 1→4 : 0.70→1.00
    if (ageYears < 6) return 1.00 + (ageYears - 4) / 2 * 0.18; // 4→6 : 1.00→1.18
    if (ageYears < 10) return 1.18;        // 6→9 : max size
    return Math.max(0.90, 1.18 - (ageYears - 10) * 0.04); // 10+ : shrink slowly
}

/** Face roundness: younger = rounder (0=square, 1=circle) → head Y radius relative to X */
function headRoundness(ageYears: number): number {
    if (ageYears < 1) return 1.05;  // baby: taller than wide = big cute dome
    if (ageYears < 3) return 0.95;
    if (ageYears < 6) return 0.80;
    return 0.72;                       // adult: flatter skull
}

/** Walking animation speed divisor – higher = slower feet */
function legSpeedDivisor(ageYears: number): number {
    // Slower movements to feel heavier (increased by ~43%)
    if (ageYears < 1) return 34;
    if (ageYears < 2) return 40;
    if (ageYears < 3) return 46;
    if (ageYears < 5) return 52;
    if (ageYears < 7) return 60;
    if (ageYears < 10) return 68;
    return 80;
}

// ─────────────────────────────────────────────────────────────────────────────
export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private bgImages: Record<string, HTMLImageElement> = {};
    private isBgLoaded: boolean = false;

    constructor(canvasElement: HTMLCanvasElement, private fsm: FSM) {
        this.ctx = canvasElement.getContext('2d')!;
        this.width = canvasElement.width;
        this.height = canvasElement.height;
        this.loadAssets();
    }

    private async loadAssets() {
        const paths = {
            jungle: './assets/bg_jungle.png',
            rocky: './assets/bg_rocky.png',
            path: './assets/bg_path.png',
            cave: './assets/bg_cave.png'
        };
        const entries = Object.entries(paths);
        let loadedCount = 0;
        for (const [key, path] of entries) {
            const img = new Image();
            img.onload = () => {
                this.bgImages[key] = img;
                loadedCount++;
                if (loadedCount === entries.length) this.isBgLoaded = true;
            };
            img.src = path;
        }
    }

    private drawBackground(state: PetState, animId?: string) {
        if (!this.isBgLoaded) {
            this.ctx.fillStyle = '#f5f5f4'; // Beige fallback
            this.ctx.fillRect(0, 0, this.width, this.height);
            return;
        }

        let bgKey = 'jungle';
        if (state === 'Sleep' || state === 'Sick' || state === 'Dirty') {
            bgKey = 'cave';
        } else if (animId === 'train_walk') {
            bgKey = 'path';
        } else if (animId?.startsWith('train_') || animId?.startsWith('interact_')) {
            bgKey = 'rocky';
        }

        const img = this.bgImages[bgKey];
        if (img) {
            // Draw background scaled to cover the canvas
            const scale = Math.max(this.width / img.width, this.height / img.height);
            const x = (this.width / 2) - (img.width / 2) * scale;
            const y = (this.height / 2) - (img.height / 2) * scale;
            this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
    }

    private darkenColor(color: string, percent: number): string {
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
        r = Math.max(0, Math.floor(r * (100 - percent) / 100));
        g = Math.max(0, Math.floor(g * (100 - percent) / 100));
        b = Math.max(0, Math.floor(b * (100 - percent) / 100));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /** Draw one chunky pillar leg with 3 toe-bumps scaled with body */
    private drawLeg(x: number, y: number, length: number, color: string, scale: number = 1.0) {
        const w = 15 * scale;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#422006'; // Sepia outline
        this.ctx.lineWidth = 1.6 * scale;

        // Tapered stumpy leg
        this.ctx.beginPath();
        this.ctx.moveTo(x - w * 0.8, y);
        this.ctx.bezierCurveTo(x - w, y + length * 0.5, x - w, y + length, x - w, y + length);
        this.ctx.lineTo(x + w, y + length);
        this.ctx.bezierCurveTo(x + w, y + length, x + w, y + length * 0.5, x + w * 0.8, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Ankle crease
        this.ctx.beginPath();
        this.ctx.moveTo(x - w * 0.6, y + length - 8 * scale);
        this.ctx.quadraticCurveTo(x, y + length - 6 * scale, x + w * 0.6, y + length - 8 * scale);
        this.ctx.stroke();

        // Toe bumps
        const footY = y + length;
        for (let t = -1; t <= 1; t++) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.ellipse(x + t * 9 * scale, footY + 5 * scale, 7 * scale, 5 * scale, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Toenail arc
            this.ctx.strokeStyle = this.darkenColor(color, 18);
            this.ctx.lineWidth = 1.5 * scale;
            this.ctx.beginPath();
            this.ctx.arc(x + t * 9 * scale, footY + 3 * scale, 4.5 * scale, Math.PI * 0.85, Math.PI * 2.15);
            this.ctx.stroke();
        }
    }

    // ─── Expression drawing ────────────────────────────────────────────────

    /** Draw a single eye at (x,y) given expression descriptor */
    private drawExpressionEye(x: number, y: number, expr: Expression, isLeft: boolean, scale: number = 1) {
        const s = scale;
        const et = expr.eyeType;
        const ctx = this.ctx;

        if (et === 'open' || et === 'wide') {
            const r = et === 'wide' ? 9 * s : 7.5 * s;
            // Sclera
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2); ctx.fill();
            // Iris
            ctx.fillStyle = '#2d3748';
            ctx.beginPath(); ctx.arc(x + 0.8 * s, y + 0.8 * s, r * 0.68, 0, Math.PI * 2); ctx.fill();
            // Pupil shine (More refined position)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(x + 1.5 * s, y - 2.5 * s, r * 0.3, 0, Math.PI * 2); ctx.fill();
            // Upper eyelid & Eyelashes
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.8 * s;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();

            // 3 Small eyelashes
            const lashLen = 4 * s;
            for (let i = 0; i < 3; i++) {
                const angle = Math.PI * 1.2 + (i * 0.25);
                const ex = x + Math.cos(angle) * r;
                const ey = y + Math.sin(angle) * r;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex + Math.cos(angle - 0.2) * lashLen, ey + Math.sin(angle - 0.2) * lashLen);
                ctx.stroke();
            }
        } else if (et === 'half') {
            // Half-closed: draw bottom half of sclera then lid covering top
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(x, y, 7.5 * s, 5.5 * s, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#2d3748';
            ctx.beginPath(); ctx.arc(x, y + 1.5 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
            // Heavy lid
            ctx.fillStyle = '#86efac'; // body color approx – overdrawn during face render
            ctx.beginPath(); ctx.rect(x - 9 * s, y - 9 * s, 18 * s, 8 * s); ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5 * s;
            ctx.beginPath(); ctx.arc(x, y, 7 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        } else if (et === 'closed') {
            // Crescent / U down (sleeping)
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5 * s;
            ctx.beginPath(); ctx.arc(x, y, 6 * s, 0, Math.PI); ctx.stroke();
        } else if (et === 'squint') {
            // ᴗ shape – happy squint
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5 * s;
            ctx.beginPath(); ctx.arc(x, y + 2 * s, 5 * s, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x - 5 * s, y + 2 * s); ctx.lineTo(x + 5 * s, y + 2 * s); ctx.stroke();

            // 2 Small eyelashes for squint
            const lashLen = 3 * s;
            for (let i = 0; i < 2; i++) {
                const angle = Math.PI * 1.25 + (i * 0.5);
                const ex = x + Math.cos(angle) * 5 * s;
                const ey = y + 2 * s + Math.sin(angle) * 5 * s;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(ex + Math.cos(angle - 0.3) * lashLen, ey + Math.sin(angle - 0.3) * lashLen);
                ctx.stroke();
            }
        } else if (et === 'heart') {
            ctx.fillStyle = '#fb7185';
            ctx.font = `${14 * s}px Arial`;
            ctx.fillText('♥', x - 7 * s, y + 5 * s);
        } else if (et === 'cross') {
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.5 * s;
            ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 5 * s); ctx.lineTo(x + 5 * s, y + 5 * s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 5 * s); ctx.lineTo(x - 5 * s, y + 5 * s); ctx.stroke();
        } else if (et === 'star') {
            ctx.fillStyle = '#fbbf24';
            ctx.font = `${16 * s}px Arial`;
            ctx.fillText('★', x - 8 * s, y + 6 * s);
        } else if (et === 'tears') {
            // Normal open eye + tear drop
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(x, y, 7.5 * s, 7.5 * s, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#2d3748';
            ctx.beginPath(); ctx.arc(x + 0.8 * s, y + 0.8 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2 * s;
            ctx.beginPath(); ctx.arc(x, y, 7.5 * s, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
            // Teardrop
            ctx.fillStyle = '#93c5fd';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + (isLeft ? -2 : 2) * s, y + 8 * s);
            ctx.bezierCurveTo(x + (isLeft ? -6 : 6) * s, y + 14 * s, x + (isLeft ? -2 : 2) * s, y + 18 * s, x, y + 20 * s);
            ctx.bezierCurveTo(x + (isLeft ? 2 : -2) * s, y + 18 * s, x + (isLeft ? 4 : -4) * s, y + 14 * s, x + (isLeft ? -2 : 2) * s, y + 8 * s);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    /** Draw brow above eye */
    private drawBrow(x: number, y: number, browType: string, isLeft: boolean, scale: number) {
        const s = scale;
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 2 * s;
        this.ctx.lineCap = 'round';
        if (browType === 'angry') {
            this.ctx.beginPath();
            if (isLeft) { this.ctx.moveTo(x - 8 * s, y - 11 * s); this.ctx.lineTo(x + 4 * s, y - 7 * s); }
            else { this.ctx.moveTo(x + 8 * s, y - 11 * s); this.ctx.lineTo(x - 4 * s, y - 7 * s); }
            this.ctx.stroke();
        } else if (browType === 'worried') {
            this.ctx.beginPath();
            if (isLeft) { this.ctx.moveTo(x - 7 * s, y - 8 * s); this.ctx.lineTo(x + 4 * s, y - 11 * s); }
            else { this.ctx.moveTo(x + 7 * s, y - 8 * s); this.ctx.lineTo(x - 4 * s, y - 11 * s); }
            this.ctx.stroke();
        } else if (browType === 'raised') {
            this.ctx.beginPath();
            this.ctx.arc(x, y - 14 * s, 6 * s, Math.PI * 1.2, Math.PI * 1.8);
            this.ctx.stroke();
        }
    }

    /** Draw mouth centered at (mx, my) */
    private drawMouth(mx: number, my: number, mouthType: string, scale: number) {
        const s = scale;
        const ctx = this.ctx;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2 * s;
        ctx.lineCap = 'round';

        switch (mouthType) {
            case 'smile':
                ctx.beginPath(); ctx.arc(mx, my, 6 * s, 0, Math.PI); ctx.stroke();
                break;
            case 'bigSmile':
                ctx.beginPath(); ctx.arc(mx, my, 10 * s, 0, Math.PI); ctx.stroke();
                // Teeth sparkle
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(mx - 7 * s, my, 14 * s, 4 * s);
                break;
            case 'flat':
                ctx.beginPath(); ctx.moveTo(mx - 5 * s, my); ctx.lineTo(mx + 5 * s, my); ctx.stroke();
                break;
            case 'frown':
                ctx.beginPath(); ctx.arc(mx, my + 8 * s, 6 * s, Math.PI, 0); ctx.stroke();
                break;
            case 'open':
                ctx.beginPath(); ctx.arc(mx, my - 4 * s, 8 * s, 0, Math.PI); ctx.stroke();
                ctx.fillStyle = '#be123c';
                ctx.beginPath(); ctx.arc(mx, my - 2 * s, 5 * s, 0, Math.PI); ctx.fill();
                break;
            case 'openHappy':
                ctx.beginPath(); ctx.arc(mx, my, 9 * s, 0, Math.PI); ctx.stroke();
                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.arc(mx, my + 1 * s, 5 * s, 0, Math.PI); ctx.fill();
                break;
            case 'smirk':
                ctx.beginPath();
                ctx.moveTo(mx - 5 * s, my + 2 * s);
                ctx.quadraticCurveTo(mx, my - 2 * s, mx + 7 * s, my);
                ctx.stroke();
                break;
            case 'pout':
                ctx.beginPath(); ctx.arc(mx, my + 4 * s, 5 * s, Math.PI, 0); ctx.stroke();
                // Pout lower lip
                ctx.beginPath(); ctx.arc(mx, my + 8 * s, 4 * s, 0, Math.PI); ctx.stroke();
                break;
            case 'oo':
                ctx.fillStyle = '#1e293b';
                ctx.beginPath(); ctx.ellipse(mx, my + 2 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
                break;
            case 'wavyTired':
                ctx.beginPath();
                ctx.moveTo(mx - 7 * s, my);
                ctx.quadraticCurveTo(mx - 3 * s, my + 4 * s, mx, my);
                ctx.quadraticCurveTo(mx + 3 * s, my - 4 * s, mx + 7 * s, my);
                ctx.stroke();
                break;
        }
    }


    /** Full face render based on expression key */
    private renderFace(
        expr: ExpressionKey,
        _headX: number, _headY: number,
        eye1X: number, eye2X: number, eyeY: number,
        mouthX: number, mouthY: number,
        faceScale: number,
        overrideBlink: boolean = false   // forces eyes closed for blink
    ) {
        const expression = EXPRESSIONS[expr];
        const actualEyeType = overrideBlink ? 'closed' : expression.eyeType;
        const e1: Expression = { ...expression, eyeType: actualEyeType as any };
        const e2: Expression = { ...expression, eyeType: actualEyeType as any };

        // Brows
        if (expression.browType && expression.browType !== 'none') {
            this.drawBrow(eye1X, eyeY, expression.browType, true, faceScale);
            this.drawBrow(eye2X, eyeY, expression.browType, false, faceScale);
        }

        // Eyes
        this.drawExpressionEye(eye1X, eyeY, e1, true, faceScale);
        this.drawExpressionEye(eye2X, eyeY, e2, false, faceScale);

        // Blush (REMOVED as per user request for less awkward look)
        /*
        if (expression.blush && !overrideBlink) {
            this.drawBlush(eye1X - 6 * faceScale, eyeY + 9 * faceScale, expression.blushColor || '#fca5a5', faceScale);
            this.drawBlush(eye2X + 6 * faceScale, eyeY + 9 * faceScale, expression.blushColor || '#fca5a5', faceScale);
        }
        */

        // Mouth
        /*
        if (expression.blush) {
            this.drawBlush(headX - 10 * faceScale, headY + 8 * faceScale, expression.blushColor || '#fca5a5', faceScale);
            this.drawBlush(headX + 26 * faceScale, headY + 8 * faceScale, expression.blushColor || '#fca5a5', faceScale);
        }
        */

        this.drawMouth(mouthX, mouthY, expression.mouthType, faceScale);
    }

    public render(petState: PetState, tickCount: number) {
        if (this.fsm.isEgg) return;
        if (this.fsm.stats.isDead) {
            this.renderDead(tickCount);
            return;
        }

        const state = petState;
        const animId = this.fsm.activeAnimation?.id;
        this.drawBackground(state, animId);

        // ── Age calculations ──────────────────────────────────────────────
        const ageYears = getAgeYears(this.fsm.stats.ageTicks);
        const sizeMul = ageSizeMultiplier(ageYears);
        const roundness = headRoundness(ageYears);
        const speedDiv = legSpeedDivisor(ageYears);

        // ── Base body dimensions ──────────────────────────────────────────
        const minWeight = 50, maxWeight = 150;
        const boundedWeight = Math.max(minWeight, Math.min(maxWeight, this.fsm.stats.weight));
        const weightFactor = (boundedWeight - minWeight) / (maxWeight - minWeight);

        // Base at age-4 body = 65×48; scaled by age
        const BASE_BRX = (65 + weightFactor * 40) * sizeMul;
        const BASE_BRY = (48 + weightFactor * 12) * sizeMul;

        // ── Animation state (Tempo reduced by 50%: divisors doubled) ──
        let breath = Math.sin(tickCount / 28) * 2;
        let tailWag = state === 'Sleep' ? 0 : Math.sin(tickCount / 28) * 8;
        let headOscillationX = 0;
        let headOscillationY = 0;
        let bodyOscillationY = 0;
        let isDancing = false;
        let isMouthOpen = false;

        // Blink timing: normal blink every ~5s, double-blink occasionally
        const blinkCycle = tickCount % 180;
        const isBlinking = blinkCycle < 5 || (blinkCycle > 10 && blinkCycle < 14);

        if (this.fsm.activeAnimation) {
            const animId = this.fsm.activeAnimation.id;
            const progress = 1 - (this.fsm.activeAnimation.until - Date.now()) / 2000;

            if (animId.startsWith('feed_')) {
                headOscillationY = Math.sin(progress * Math.PI * 4) * 25;
                isMouthOpen = (progress * 10) % 2 < 1;
            } else if (animId === 'train_ball' || animId === 'train_frisbee') {
                headOscillationY = -20 * sizeMul;
                headOscillationX = 15 * sizeMul;
            } else if (animId === 'train_dance') {
                isDancing = true;
                bodyOscillationY = Math.abs(Math.sin(progress * Math.PI * 6)) * -20;
                headOscillationX = Math.sin(progress * Math.PI * 8) * 20;
                tailWag = Math.sin(progress * Math.PI * 4) * 30;
            } else if (animId === 'wash_shower' || animId === 'wash_bath') {
                headOscillationX = Math.sin(progress * Math.PI * 6) * 10;
                bodyOscillationY = Math.sin(progress * Math.PI * 4) * -5;
            } else if (animId === 'train_walk' || animId === 'interact_pasture') {
                bodyOscillationY = Math.abs(Math.sin(progress * Math.PI * 10)) * -10;
            }
        } else if (state === 'Idle') {
            const isHighStat = this.fsm.stats.happiness >= 80 && this.fsm.stats.energy >= 80 && this.fsm.stats.fullness >= 80;
            if (isHighStat) {
                isDancing = true;
                bodyOscillationY = Math.abs(Math.sin(tickCount / 12)) * -15;
                headOscillationX = Math.sin(tickCount / 8) * 15;
                tailWag = Math.sin(tickCount / 12) * 20;
                const cycle = Math.floor(tickCount / 560) % 5;
                if (cycle === 1) headOscillationY = -10;
                else if (cycle === 2) { headOscillationY = 20; headOscillationX = 10; breath = Math.sin(tickCount / 14) * 3; }
                else if (cycle === 3) { headOscillationX = -20; }
                else if (cycle === 4) headOscillationY = Math.sin(tickCount / 42) * 8;
            }
        }

        // ── Canvas transform ──────────────────────────────────────────────
        this.ctx.save();
        const currentWanderX = this.fsm.wanderX || 0;
        const renderX = this.width / 2 + currentWanderX;
        const flipH = !this.fsm.activeAnimation && this.fsm.wanderTargetX < this.fsm.wanderX;

        this.ctx.translate(renderX, this.height / 2 + breath + bodyOscillationY);
        if (flipH) this.ctx.scale(-1, 1);

        // ── Body color by state ───────────────────────────────────────────
        let bodyColor = '#a7f3d0'; // Softer Watercolor green
        if (state === 'Hungry') bodyColor = '#fecaca';
        else if (state === 'Dirty') bodyColor = '#d1d5db';
        else if (state === 'Sleepy') bodyColor = '#bfdbfe';
        else if (state === 'Sleep') bodyColor = '#1e3a8a';
        else if (state === 'Naughty') bodyColor = '#fdba74';
        else if (state === 'Sick') bodyColor = '#d9f99d';

        const darkColor = this.darkenColor(bodyColor, 15);
        const sepiaColor = '#422006'; // Dark sepia pencil

        const tier = this.fsm.stats.evolutionTier;

        // ── Geometry ──────────────────────────────────────────────────────
        const bodyRadiusX = BASE_BRX;
        const bodyRadiusY = BASE_BRY;

        // Neck length & head position (Elegantly long neck)
        const neckLen = (70 + tier * 40) * sizeMul;
        const headX = (45 + headOscillationX) * sizeMul;
        const headY = -neckLen + headOscillationY;

        // Head shape: more integrated with neck
        const headRX = 28 * sizeMul;
        const headRY = 24 * sizeMul * roundness;
        const snoutRX = 24 * sizeMul;
        const snoutRY = 16 * sizeMul * roundness;

        // Face scale
        const faceScale = sizeMul;

        // Eye positions (matching the cute sticker look)
        const eye1X = headX - 4 * sizeMul;
        const eye2X = headX + 16 * sizeMul;
        const eyeY = headY - 6 * sizeMul;
        const mouthX = headX + 10 * sizeMul;
        const mouthY = headY + 14 * sizeMul;

        // ── Shadow ────────────────────────────────────────────────────────
        this.ctx.fillStyle = 'rgba(66, 32, 6, 0.08)'; // Sepia toned shadow
        this.ctx.beginPath();
        this.ctx.ellipse(0, bodyRadiusY + 55 * sizeMul, bodyRadiusX + 10, 12 * sizeMul, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // ─── 1. TAIL ──────────────────────────────────────────────────────
        this.ctx.fillStyle = bodyColor;
        this.ctx.strokeStyle = sepiaColor;
        this.ctx.lineWidth = 1.6 * sizeMul;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        const tailStartX = -bodyRadiusX * 0.8;
        const tailStartY = 25 * sizeMul;
        this.ctx.moveTo(tailStartX, tailStartY);
        // Tapered curve to point
        this.ctx.quadraticCurveTo(-bodyRadiusX * 1.5, tailStartY, -bodyRadiusX * 1.8 - tier * 10 * sizeMul, 45 * sizeMul + tailWag);
        this.ctx.quadraticCurveTo(-bodyRadiusX * 1.5, tailStartY + 15 * sizeMul, tailStartX, tailStartY + 35 * sizeMul);
        this.ctx.fill();
        this.ctx.stroke();

        this.drawDirtSpot(-bodyRadiusX * 1.2, 40 * sizeMul + tailWag * 0.5, 18, 9, this.fsm.stats.spotDirt.tail, 'tail');

        // ─── 2. BACK LEGS ─────────────────────────────────────────────────
        this.drawLeg(-bodyRadiusX * 0.55, 52 * sizeMul, 45 * sizeMul, darkColor, sizeMul);
        this.drawLeg(bodyRadiusX * 0.35, 52 * sizeMul, 45 * sizeMul, darkColor, sizeMul);

        // ─── 3. NECK ─────────────────────────────────────────────────────
        this.ctx.fillStyle = bodyColor;
        this.ctx.strokeStyle = sepiaColor;
        this.ctx.lineWidth = 1.6 * sizeMul;

        this.ctx.beginPath();
        const neckStartX = bodyRadiusX * 0.1;
        const neckStartY = 15 * sizeMul;
        // Outer curve
        this.ctx.moveTo(neckStartX, neckStartY);
        this.ctx.quadraticCurveTo(bodyRadiusX * 0.6 + headOscillationX * 0.5, -neckLen * 0.5, headX + headRX * 0.2, headY + headRY * 0.5);
        // Head back
        this.ctx.lineTo(headX - headRX * 0.8, headY - headRY * 0.3);
        // Inner curve
        this.ctx.quadraticCurveTo(bodyRadiusX * 0.1, -neckLen * 0.4, neckStartX - 25 * sizeMul, neckStartY + 10 * sizeMul);
        this.ctx.fill();
        this.ctx.stroke();

        this.drawDirtSpot((headX + neckStartX) / 2, (headY + 15 * sizeMul) / 2, 12, 20, this.fsm.stats.spotDirt.neck, 'neck');

        // ─── Bath prop ────────────────────────────────────────────────────
        if (this.fsm.activeAnimation?.id === 'wash_bath') {
            this.ctx.fillStyle = '#e0f2fe';
            this.ctx.beginPath();
            this.ctx.rect(-bodyRadiusX - 10, 28 * sizeMul, bodyRadiusX * 2 + 20, 38 * sizeMul);
            this.ctx.fill();
            this.ctx.fillStyle = '#bae6fd';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 28 * sizeMul, bodyRadiusX + 10, 9 * sizeMul, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // ─── 4. BODY (Pear-Shaped Redesign) ───────────────────────────────
        this.ctx.fillStyle = bodyColor;
        this.ctx.strokeStyle = sepiaColor;
        this.ctx.lineWidth = 1.6 * sizeMul;

        this.ctx.beginPath();
        const bW = bodyRadiusX;
        const bH = bodyRadiusY * 1.1;
        // Start top-back
        this.ctx.moveTo(-bW * 0.6, 15 * sizeMul);
        // Back to tail-base
        this.ctx.bezierCurveTo(-bW, 10 * sizeMul, -bW * 1.2, 50 * sizeMul, -bW * 0.5, 75 * sizeMul);
        // Belly base
        this.ctx.bezierCurveTo(-bW * 0.2, 85 * sizeMul, bW * 0.6, 85 * sizeMul, bW, 60 * sizeMul);
        // Front chest
        this.ctx.bezierCurveTo(bW * 1.1, 40 * sizeMul, bW * 0.8, 15 * sizeMul, bW * 0.2, 15 * sizeMul);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Belly gradient (watercolor feel)
        const grad = this.ctx.createRadialGradient(bW * 0.2, 60 * sizeMul, 5, bW * 0.2, 60 * sizeMul, bW * 0.8);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // Sketched dorsal highlights
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.lineWidth = 3 * sizeMul;
        this.ctx.beginPath();
        this.ctx.moveTo(-bW * 0.4, 20 * sizeMul);
        this.ctx.quadraticCurveTo(0, 15 * sizeMul, bW * 0.4, 25 * sizeMul);
        this.ctx.stroke();

        // Body dirt
        this.drawDirtSpot(0, 50 * sizeMul, bW * 0.8, bH * 0.6, this.fsm.stats.spotDirt.body, 'body');

        // ─── 5. FRONT LEGS ────────────────────────────────────────────────
        // Leg animation
        let legOffset1 = 0, legOffset2 = 0;
        if (this.fsm.activeAnimation) {
            const animId = this.fsm.activeAnimation.id;
            const progress = 1 - (this.fsm.activeAnimation.until - Date.now()) / 2000;
            if (animId === 'train_walk' || animId === 'interact_pasture') {
                legOffset1 = Math.sin(progress * Math.PI * 10) * 14;
                legOffset2 = Math.cos(progress * Math.PI * 10) * 14;
            } else if (animId === 'train_ball') {
                legOffset2 = -18;
            }
        } else if (Math.abs(this.fsm.wanderTargetX - this.fsm.wanderX) > 1) {
            legOffset1 = Math.sin(tickCount / speedDiv) * 14;
            legOffset2 = Math.cos(tickCount / speedDiv) * 14;
        } else if (state === 'Idle') {
            const mood = (this.fsm.stats.happiness + this.fsm.stats.energy) / 200;
            if (mood > 0.7) {
                const stompSpeed = speedDiv * 1.4; // slightly slower than walk
                legOffset1 = Math.sin(tickCount / stompSpeed) * (4 + mood * 4);
                legOffset2 = Math.cos(tickCount / stompSpeed) * (4 + mood * 4);
            }
        }

        const fLegX1 = -bodyRadiusX * 0.42 - 7 * sizeMul;
        const fLegY1 = 65 * sizeMul + (legOffset1 < 0 ? legOffset1 : 0);
        const fLegX2 = bodyRadiusX * 0.42 - 7 * sizeMul;
        const fLegY2 = 65 * sizeMul + (legOffset2 < 0 ? Math.max(legOffset2, -14) : 0);

        this.drawLeg(fLegX1, fLegY1, 40 * sizeMul + (legOffset1 > 0 ? legOffset1 : 0), bodyColor, sizeMul);
        this.drawLeg(fLegX2, fLegY2, 40 * sizeMul + (legOffset2 > 0 ? legOffset2 : 0), bodyColor, sizeMul);
        this.drawDirtSpot(fLegX1, fLegY1 + 14 * sizeMul, 12 * sizeMul, 18 * sizeMul, this.fsm.stats.spotDirt.legs, 'leg1');
        this.drawDirtSpot(fLegX2, fLegY2 + 14 * sizeMul, 12 * sizeMul, 18 * sizeMul, this.fsm.stats.spotDirt.legs, 'leg2');

        // ─── 6. HEAD ─────────────────────────────────────────────────────
        this.ctx.fillStyle = bodyColor;
        this.ctx.strokeStyle = sepiaColor;
        this.ctx.lineWidth = 1.6 * sizeMul;

        // Skull dome
        this.ctx.beginPath();
        this.ctx.ellipse(headX, headY, headRX, headRY, 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Snout – wider when young (cute pug), flatter when older
        this.ctx.beginPath();
        this.ctx.ellipse(headX + 17 * sizeMul, headY + 7 * sizeMul, snoutRX, snoutRY, 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Cheek highlight (watercolor bubble)
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(headX + 5 * sizeMul, headY + 10 * sizeMul, 12 * sizeMul, 9 * sizeMul, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Nostril
        this.ctx.fillStyle = sepiaColor;
        this.ctx.beginPath();
        this.ctx.ellipse(headX + 28 * sizeMul, headY + 4 * sizeMul, 3.5 * sizeMul, 2.5 * sizeMul, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawDirtSpot(headX + 5 * sizeMul, headY + 3 * sizeMul, 30 * sizeMul, 20 * sizeMul, this.fsm.stats.spotDirt.head, 'head');

        // Wisdom Crown
        if (tier === 3 && this.fsm.stats.wisdom > 10) {
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            const cx = headX, cy = headY - headRY;
            this.ctx.moveTo(cx - 10 * sizeMul, cy);
            this.ctx.lineTo(cx - 5 * sizeMul, cy - 20 * sizeMul);
            this.ctx.lineTo(cx, cy - 5 * sizeMul);
            this.ctx.lineTo(cx + 5 * sizeMul, cy - 20 * sizeMul);
            this.ctx.lineTo(cx + 10 * sizeMul, cy);
            this.ctx.fill();
        }

        // ─── 7. FACE (expressions) ────────────────────────────────────────
        let exprKey: ExpressionKey = 'happy';

        if (state === 'Sleep') {
            exprKey = 'tired';
            this.ctx.font = `${20 * sizeMul}px Arial`;
            this.ctx.fillStyle = '#64748b';
            const zzzOffset = Math.sin(tickCount / 20) * 5;
            this.ctx.fillText('Zzz', 0, headY - 30 * sizeMul + zzzOffset);
        } else if (state === 'Hungry') exprKey = 'hungry';
        else if (state === 'Dirty') exprKey = 'worried';
        else if (state === 'Naughty') exprKey = 'angry';
        else if (state === 'Sick') exprKey = 'sick';
        else if (state === 'Sleepy') exprKey = 'sleepy';
        else {
            // Happy / Idle - richer variation based on stats
            const h = this.fsm.stats.happiness;
            if (isMouthOpen) exprKey = 'playful';
            else if (h >= 90) exprKey = 'excited';
            else if (h >= 75) exprKey = 'happy';
            else if (h >= 50) exprKey = 'calm';
            else exprKey = 'bored';
        }

        // Dirty state also shows flies
        if (state === 'Dirty') {
            this.ctx.fillStyle = '#475569';
            this.ctx.fillRect(-30 + (tickCount % 15), -40 * sizeMul - (tickCount % 10), 3, 3);
            this.ctx.fillRect(20 - (tickCount % 12), -50 * sizeMul + (tickCount % 14), 3, 3);
        }

        this.renderFace(exprKey, headX, headY, eye1X, eye2X, eyeY, mouthX, mouthY, faceScale, isBlinking);

        // Dancing music note
        if (isDancing && tickCount % 35 === 0) {
            this.ctx.font = `${20 * sizeMul}px Arial`;
            this.ctx.fillText('🎵', headX + 28 * sizeMul, headY - 10 * sizeMul);
        }

        // ─── 8. FOREGROUND ANIMATION PROPS ───────────────────────────────
        if (this.fsm.activeAnimation) {
            const animId = this.fsm.activeAnimation.id;
            const progress = 1 - (this.fsm.activeAnimation.until - Date.now()) / 2000;
            this.ctx.font = '40px Arial';

            if (animId === 'feed_fern') this.ctx.fillText('🌿', headX + 32 * sizeMul, headY + 20 * sizeMul + Math.sin(progress * Math.PI * 4) * 10);
            else if (animId === 'feed_conifer') this.ctx.fillText('🌲', headX + 32 * sizeMul, headY + 20 * sizeMul + Math.sin(progress * Math.PI * 4) * 10);
            else if (animId === 'feed_vitamin') this.ctx.fillText('🍋', headX + 32 * sizeMul, headY + 20 * sizeMul + Math.sin(progress * Math.PI * 4) * 10);
            else if (animId === 'feed_medicine') this.ctx.fillText('💊', headX + 32 * sizeMul, headY + 20 * sizeMul + Math.sin(progress * Math.PI * 4) * 10);
            else if (animId === 'train_ball') {
                const bounceY = Math.abs(Math.sin(progress * Math.PI * 3)) * -60;
                this.ctx.fillText('⚽', 80 + progress * 100, 60 + bounceY);
            } else if (animId === 'train_frisbee') {
                const flyX = 200 - progress * 150;
                const flyY = -50 + Math.sin(progress * Math.PI) * 20;
                this.ctx.save();
                this.ctx.translate(flyX, flyY);
                this.ctx.rotate(progress * Math.PI * 4);
                this.ctx.fillText('🥏', 0, 0);
                this.ctx.restore();
            } else if (animId === 'wash_shower') {
                this.ctx.fillText('🚿', -20, -100 * sizeMul);
                this.ctx.fillStyle = '#bae6fd';
                for (let i = 0; i < 5; i++) {
                    const dropY = -80 * sizeMul + ((progress * 150 + i * 20) % 150);
                    this.ctx.beginPath();
                    this.ctx.arc((Math.random() - 0.5) * 40, dropY, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (animId === 'wash_bath') {
                this.ctx.font = '20px Arial';
                this.ctx.fillText('🫧', bodyRadiusX * 0.5 + Math.sin(tickCount / 5) * 5, 10 - (tickCount % 50));
                this.ctx.fillText('🫧', -bodyRadiusX * 0.3 + Math.cos(tickCount / 4) * 5, 30 - ((tickCount + 20) % 50));
            }
        }

        this.ctx.restore();
    }

    private renderDead(tickCount: number) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2 + 50);
        this.ctx.rotate(Math.PI / 2);
        this.ctx.globalAlpha = 0.6;

        const bodyColor = '#cbd5e1';
        const bodyRadiusX = 70;
        const bodyRadiusY = 50;

        this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
        this.ctx.beginPath(); this.ctx.ellipse(0, 0, bodyRadiusX + 20, 10, 0, 0, Math.PI * 2); this.ctx.fill();

        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath(); this.ctx.ellipse(0, 0, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2); this.ctx.fill();

        this.ctx.strokeStyle = bodyColor;
        this.ctx.lineWidth = 25;
        this.ctx.beginPath(); this.ctx.moveTo(10, 0); this.ctx.lineTo(80, 0); this.ctx.stroke();
        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath(); this.ctx.arc(80, 0, 25, 0, Math.PI * 2); this.ctx.fill();

        // X eyes
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 3;
        const ex = 85, ey = -5;
        this.ctx.beginPath(); this.ctx.moveTo(ex - 5, ey - 5); this.ctx.lineTo(ex + 5, ey + 5); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.moveTo(ex + 5, ey - 5); this.ctx.lineTo(ex - 5, ey + 5); this.ctx.stroke();

        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillText('☁️', 90, -40 + Math.sin(tickCount / 20) * 10);

        this.ctx.restore();
    }

    private drawDirtSpot(cx: number, cy: number, rx: number, ry: number, amount: number, partId: string) {
        if (amount <= 5) return;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        this.ctx.clip();

        const opacity = Math.min(0.5, amount / 100 * 0.6);
        this.ctx.fillStyle = `rgba(101, 89, 79, ${opacity})`;
        this.ctx.fill();

        const numDots = Math.floor(amount / 4);
        this.ctx.fillStyle = `rgba(75, 63, 53, 0.8)`;

        let seed = 0;
        for (let i = 0; i < partId.length; i++) seed += partId.charCodeAt(i);
        for (let i = 0; i < numDots; i++) {
            const rxRand = Math.sin(seed + i * 13.5);
            const ryRand = Math.cos(seed + i * 17.1);
            this.ctx.fillRect(cx + rxRand * rx * 0.8, cy + ryRand * ry * 0.8, 3, 3);
            if (amount > 50 && i % 3 === 0) {
                this.ctx.strokeStyle = `rgba(75, 63, 53, 0.4)`;
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(cx + rxRand * rx * 0.8 - 4, cy + ryRand * ry * 0.8 - 4);
                this.ctx.lineTo(cx + rxRand * rx * 0.8 + 4, cy + ryRand * ry * 0.8 + 4);
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    }
}
