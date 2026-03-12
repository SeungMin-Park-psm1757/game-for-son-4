import { FSM, PetState } from './fsm';
import { getAgeYearsFromActiveSeconds } from './growth';

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

interface AnimationSnapshot {
    id: string;
    progress: number;
    pulse: number;
    bounce: number;
    sway: number;
    wiggle: number;
    flutter: number;
}

interface PoseProfile {
    neckScale: number;
    bodyScaleY: number;
    headOffsetX: number;
    headOffsetY: number;
    bodyOffsetY: number;
    tailExtra: number;
    expression?: ExpressionKey;
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
    if (ageYears < 1) return 1.14;
    if (ageYears < 3) return 1.04;
    if (ageYears < 6) return 0.92;
    return 0.84;
}

function headSizeFactor(ageYears: number): number {
    if (ageYears < 1) return 1.28;
    if (ageYears < 3) return 1.2;
    if (ageYears < 6) return 1.12;
    return 1.04;
}

/** Walking animation speed divisor – higher = slower feet */
function legSpeedDivisor(ageYears: number): number {
    if (ageYears < 1) return 48;
    if (ageYears < 2) return 58;
    if (ageYears < 3) return 68;
    if (ageYears < 5) return 78;
    if (ageYears < 7) return 90;
    if (ageYears < 10) return 104;
    return 118;
}

// ─────────────────────────────────────────────────────────────────────────────
export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    constructor(canvasElement: HTMLCanvasElement, private fsm: FSM) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d')!;
        this.width = canvasElement.width;
        this.height = canvasElement.height;
        this.syncCanvasSize();
    }

    private syncCanvasSize() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const cssWidth = Math.max(1, Math.floor(this.canvas.clientWidth || this.canvas.width));
        const cssHeight = Math.max(1, Math.floor(this.canvas.clientHeight || this.canvas.height));
        const pixelWidth = Math.floor(cssWidth * dpr);
        const pixelHeight = Math.floor(cssHeight * dpr);

        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.canvas.width = pixelWidth;
            this.canvas.height = pixelHeight;
        }

        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = cssWidth;
        this.height = cssHeight;
    }

    private drawCloud(x: number, y: number, scale: number, alpha: number) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 24 * scale, 13 * scale, 0, 0, Math.PI * 2);
        this.ctx.ellipse(x - 20 * scale, y + 4 * scale, 17 * scale, 11 * scale, 0, 0, Math.PI * 2);
        this.ctx.ellipse(x + 18 * scale, y + 4 * scale, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    private drawBackground(state: PetState, tickCount: number, animId?: string) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#dff5ff');
        sky.addColorStop(0.55, '#f8fbff');
        sky.addColorStop(1, '#f7ecd1');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        const sunGlow = ctx.createRadialGradient(this.width - 82, 72, 12, this.width - 82, 72, 82);
        sunGlow.addColorStop(0, 'rgba(255,244,177,0.95)');
        sunGlow.addColorStop(0.5, 'rgba(255,209,115,0.35)');
        sunGlow.addColorStop(1, 'rgba(255,209,115,0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(this.width - 82, 72, 82, 0, Math.PI * 2);
        ctx.fill();

        this.drawCloud(82 + Math.sin(tickCount / 120) * 10, 68, 1, 0.72);
        this.drawCloud(295 - Math.sin(tickCount / 160) * 8, 108, 0.82, 0.58);

        ctx.fillStyle = '#b8e0b9';
        ctx.beginPath();
        ctx.ellipse(this.width * 0.4, this.height - 50, this.width * 0.6, 92, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7bc47f';
        ctx.beginPath();
        ctx.ellipse(this.width * 0.62, this.height - 26, this.width * 0.72, 104, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6aa96f';
        ctx.fillRect(0, this.height / 2 + 105, this.width, this.height);

        ctx.strokeStyle = 'rgba(79, 123, 84, 0.18)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2 + 94);
        ctx.quadraticCurveTo(this.width * 0.42, this.height / 2 + 78, this.width, this.height / 2 + 96);
        ctx.stroke();

        for (let i = 0; i < 6; i++) {
            const flowerX = 32 + i * 62 + ((tickCount / 10 + i * 13) % 14);
            const flowerY = this.height / 2 + 115 + Math.sin((tickCount + i * 20) / 18) * 2;
            ctx.strokeStyle = '#4f8c5c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(flowerX, flowerY + 10);
            ctx.lineTo(flowerX, flowerY - 10);
            ctx.stroke();
            ctx.fillStyle = i % 2 === 0 ? '#fda4af' : '#fcd34d';
            for (let petal = 0; petal < 5; petal++) {
                const angle = (Math.PI * 2 * petal) / 5;
                ctx.beginPath();
                ctx.ellipse(flowerX + Math.cos(angle) * 6, flowerY - 13 + Math.sin(angle) * 6, 4, 3, angle, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#fff5b3';
            ctx.beginPath();
            ctx.arc(flowerX, flowerY - 13, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.fsm.activeEvent === 'MeteorShower') {
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const meteorX = 80 + i * 74 + ((tickCount * 5 + i * 30) % 120);
                const meteorY = 34 + i * 18;
                ctx.beginPath();
                ctx.moveTo(meteorX, meteorY);
                ctx.lineTo(meteorX - 26, meteorY + 16);
                ctx.stroke();
            }
        } else if (this.fsm.activeEvent === 'VolcanicAsh') {
            ctx.fillStyle = 'rgba(94,94,94,0.15)';
            ctx.fillRect(0, 0, this.width, this.height);
        } else if (this.fsm.activeEvent === 'Drought') {
            ctx.fillStyle = 'rgba(251,191,36,0.14)';
            ctx.fillRect(0, 0, this.width, this.height);
        }

        if (animId === 'interact_pasture') {
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            for (let i = 0; i < 8; i++) {
                const bladeX = 20 + i * 48 + (tickCount % 8);
                ctx.fillRect(bladeX, this.height / 2 + 96, 2, 18 + (i % 3) * 6);
            }
        }

        if (state === 'Sleep') {
            ctx.fillStyle = 'rgba(83, 109, 254, 0.08)';
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
    }

    private getMotionFactor() {
        return this.fsm.stats.preferences?.comfortMode ? 0.55 : 1;
    }

    private getPoseProfile(state: PetState, tickCount: number): PoseProfile {
        const bond = this.fsm.stats.bond;
        const sway = Math.sin(tickCount / 92);
        const float = Math.cos(tickCount / 76);

        switch (state) {
            case 'Hungry':
                return { neckScale: 0.94, bodyScaleY: 0.96, headOffsetX: -6, headOffsetY: 14, bodyOffsetY: 4, tailExtra: -4, expression: 'hungry' };
            case 'Dirty':
                return { neckScale: 0.97, bodyScaleY: 1, headOffsetX: 2 + sway, headOffsetY: 6, bodyOffsetY: 2, tailExtra: -2, expression: 'worried' };
            case 'Sleepy':
                return { neckScale: 0.92, bodyScaleY: 0.95, headOffsetX: -4, headOffsetY: 14 + float * 2, bodyOffsetY: 4, tailExtra: -4, expression: 'sleepy' };
            case 'Sleep':
                return { neckScale: 0.86, bodyScaleY: 0.92, headOffsetX: -12, headOffsetY: 18, bodyOffsetY: 6, tailExtra: -6, expression: 'tired' };
            case 'Sick':
                return { neckScale: 0.9, bodyScaleY: 0.94, headOffsetX: -5, headOffsetY: 16, bodyOffsetY: 6, tailExtra: -5, expression: bond >= 45 ? 'sad' : 'sick' };
            case 'Naughty':
                return { neckScale: 1.04, bodyScaleY: 1.03, headOffsetX: 4 + sway * 2, headOffsetY: -4, bodyOffsetY: -2, tailExtra: 4, expression: bond >= 45 ? 'smug' : 'angry' };
            case 'Idle':
                if (bond >= 70) {
                    return { neckScale: 1.04, bodyScaleY: 1.02, headOffsetX: sway * 3, headOffsetY: -5 + float * 2, bodyOffsetY: -2, tailExtra: 4, expression: this.fsm.stats.happiness >= 60 ? 'loving' : 'calm' };
                }
                if (bond >= 45) {
                    return { neckScale: 1.01, bodyScaleY: 1.01, headOffsetX: sway * 2, headOffsetY: -2 + float, bodyOffsetY: -1, tailExtra: 2, expression: this.fsm.stats.happiness >= 70 ? 'happy' : 'calm' };
                }
                if (bond < 20) {
                    return { neckScale: 0.98, bodyScaleY: 0.98, headOffsetX: -2 + sway, headOffsetY: 2, bodyOffsetY: 1, tailExtra: -2, expression: this.fsm.stats.happiness >= 45 ? 'shy' : 'confused' };
                }
                return { neckScale: 1, bodyScaleY: 1, headOffsetX: sway, headOffsetY: float, bodyOffsetY: 0, tailExtra: 0 };
            default:
                return { neckScale: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0, bodyOffsetY: 0, tailExtra: 0 };
        }
    }

    private getIdleExpression(tickCount: number, isMouthOpen: boolean): ExpressionKey {
        const happiness = this.fsm.stats.happiness;
        const bond = this.fsm.stats.bond;

        if (isMouthOpen) {
            return bond >= 45 ? 'loving' : 'playful';
        }
        if (bond >= 70 && happiness >= 60) {
            return tickCount % 240 < 120 ? 'loving' : 'happy';
        }
        if (bond >= 45 && happiness >= 55) {
            return happiness >= 80 ? 'happy' : 'calm';
        }
        if (bond < 20 && happiness >= 45) {
            return 'shy';
        }
        if (happiness >= 90) return 'excited';
        if (happiness >= 75) return 'happy';
        if (happiness >= 50) return 'calm';
        return 'bored';
    }

    private getAnimationSnapshot(now: number): AnimationSnapshot | null {
        const animation = this.fsm.activeAnimation;
        if (!animation) return null;

        const durationMs = Math.max(animation.durationMs, 1);
        const progress = this.clamp((now - animation.startedAt) / durationMs, 0, 1);

        return {
            id: animation.id,
            progress,
            pulse: Math.sin(progress * Math.PI),
            bounce: Math.abs(Math.sin(progress * Math.PI * 4)),
            sway: Math.sin(progress * Math.PI * 2),
            wiggle: Math.sin(progress * Math.PI * 6),
            flutter: Math.abs(Math.sin(progress * Math.PI * 8)),
        };
    }

    private drawEmoji(icon: string, x: number, y: number, size: number, rotation: number = 0, alpha: number = 1) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.globalAlpha = alpha;
        this.ctx.font = `${Math.max(12, Math.round(size))}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(icon, 0, 0);
        this.ctx.restore();
    }

    private drawSparkle(x: number, y: number, size: number, color: string, alpha: number = 1) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.lineWidth = Math.max(1.5, size / 6);
        this.ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 4) + i * (Math.PI / 2);
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * size * 0.15, Math.sin(angle) * size * 0.15);
            this.ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    private drawHeart(x: number, y: number, size: number, color: string, alpha: number = 1) {
        const s = size / 16;
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(s, s);
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 6);
        this.ctx.bezierCurveTo(0, 1, -8, 1, -8, 8);
        this.ctx.bezierCurveTo(-8, 14, -1, 17, 0, 20);
        this.ctx.bezierCurveTo(1, 17, 8, 14, 8, 8);
        this.ctx.bezierCurveTo(8, 1, 0, 1, 0, 6);
        this.ctx.fill();
        this.ctx.restore();
    }

    private drawScribble(x: number, y: number, size: number, color: string) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = Math.max(2, size / 10);
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.45, -size * 0.25);
        this.ctx.lineTo(-size * 0.1, -size * 0.52);
        this.ctx.lineTo(size * 0.24, -size * 0.1);
        this.ctx.lineTo(-size * 0.04, size * 0.22);
        this.ctx.lineTo(size * 0.36, size * 0.48);
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawActionProps(
        animation: AnimationSnapshot,
        tickCount: number,
        sizeMul: number,
        headX: number,
        headY: number,
        bodyRadiusX: number,
    ) {
        const ctx = this.ctx;

        switch (animation.id) {
            case 'feed_fern':
                this.drawEmoji('🌿', headX + 42 * sizeMul, headY + 18 * sizeMul + animation.wiggle * 6, 34 * sizeMul, animation.sway * 0.12);
                ctx.fillStyle = 'rgba(74, 222, 128, 0.65)';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.ellipse(
                        headX + 12 * sizeMul + i * 8 * sizeMul,
                        headY + 14 * sizeMul - animation.bounce * 14 + i * 5,
                        4 * sizeMul,
                        2 * sizeMul,
                        animation.progress + i * 0.3,
                        0,
                        Math.PI * 2,
                    );
                    ctx.fill();
                }
                break;
            case 'feed_conifer':
                this.drawEmoji('🌲', headX + 58 * sizeMul, headY - 8 * sizeMul - animation.pulse * 12, 38 * sizeMul, -0.1);
                ctx.strokeStyle = 'rgba(62, 138, 78, 0.42)';
                ctx.lineWidth = 2 * sizeMul;
                for (let i = 0; i < 3; i++) {
                    const needleY = headY + i * 10 - animation.progress * 12;
                    ctx.beginPath();
                    ctx.moveTo(headX + 36 * sizeMul + i * 4, needleY);
                    ctx.lineTo(headX + 22 * sizeMul + i * 2, needleY + 6);
                    ctx.stroke();
                }
                break;
            case 'feed_vitamin':
                this.drawEmoji('🍋', headX + 36 * sizeMul, headY + 10 * sizeMul - animation.bounce * 6, 32 * sizeMul, animation.sway * 0.14);
                this.drawSparkle(headX + 56 * sizeMul, headY - 18 * sizeMul, 10 * sizeMul, '#facc15', 0.9);
                this.drawSparkle(headX + 20 * sizeMul, headY - 10 * sizeMul - animation.pulse * 6, 7 * sizeMul, '#fde047', 0.85);
                break;
            case 'feed_medicine':
                this.drawEmoji('💊', headX + 36 * sizeMul, headY + 10 * sizeMul + animation.wiggle * 3, 30 * sizeMul, animation.sway * 0.08);
                ctx.fillStyle = 'rgba(147, 197, 253, 0.55)';
                for (let i = 0; i < 2; i++) {
                    ctx.beginPath();
                    ctx.ellipse(headX + 12 * sizeMul + i * 10, headY + 18 * sizeMul - animation.progress * 16, 5 * sizeMul, 3 * sizeMul, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'feed_special':
                this.drawEmoji('🍓', headX + 34 * sizeMul, headY + 14 * sizeMul - animation.bounce * 6, 32 * sizeMul, animation.sway * 0.12);
                this.drawHeart(headX + 50 * sizeMul, headY - 10 * sizeMul - animation.progress * 12, 12 * sizeMul, '#fb7185', 0.8);
                break;
            case 'train_ball': {
                const ballX = -110 + animation.progress * 220;
                const ballY = 82 - Math.abs(Math.sin(animation.progress * Math.PI * 3)) * 68;
                this.drawEmoji('⚽', ballX, ballY, 36 * sizeMul, animation.progress * Math.PI * 6);
                ctx.fillStyle = 'rgba(146, 184, 120, 0.45)';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(ballX - 14 - i * 8, 106 + i * 2, (4 - i) * sizeMul, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case 'train_frisbee': {
                const flyX = 122 - animation.progress * 214;
                const flyY = -42 - Math.sin(animation.progress * Math.PI) * 48;
                ctx.save();
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
                ctx.lineWidth = 4 * sizeMul;
                ctx.beginPath();
                ctx.moveTo(flyX + 24, flyY + 6);
                ctx.quadraticCurveTo(flyX + 62, flyY - 10, flyX + 108, flyY + 18);
                ctx.stroke();
                ctx.restore();
                this.drawEmoji('🥏', flyX, flyY, 32 * sizeMul, animation.progress * Math.PI * 8);
                break;
            }
            case 'train_discipline':
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 3 * sizeMul;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(headX + 14 * sizeMul + i * 10, headY - 46 * sizeMul + i * 3);
                    ctx.lineTo(headX + 14 * sizeMul + i * 10, headY - 28 * sizeMul + i * 3);
                    ctx.stroke();
                }
                ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
                ctx.fillRect(headX + 42 * sizeMul, headY - 20 * sizeMul, 26 * sizeMul, 16 * sizeMul);
                break;
            case 'train_walk':
                this.drawEmoji('👣', -40 + animation.progress * 80, 116, 28 * sizeMul, 0, 0.75);
                this.drawEmoji('👣', -58 + animation.progress * 82, 108, 22 * sizeMul, 0, 0.45);
                break;
            case 'train_sing':
                this.drawEmoji('🎵', headX + 52 * sizeMul, headY - 22 * sizeMul - animation.progress * 16, 24 * sizeMul, 0.12);
                this.drawEmoji('🎶', headX + 78 * sizeMul, headY - 48 * sizeMul - animation.pulse * 10, 24 * sizeMul, -0.1, 0.9);
                break;
            case 'train_dance':
                this.drawEmoji('🎵', headX + 56 * sizeMul, headY - 24 * sizeMul - animation.progress * 16, 24 * sizeMul, animation.sway * 0.2);
                this.drawEmoji('✨', headX - 46 * sizeMul, headY - 18 * sizeMul - animation.bounce * 8, 20 * sizeMul, 0, 0.9);
                this.drawEmoji('✨', headX + 84 * sizeMul, headY + 10 * sizeMul - animation.flutter * 6, 18 * sizeMul, 0, 0.85);
                break;
            case 'wash_face':
                this.drawEmoji('🧽', headX + 48 * sizeMul, headY + animation.wiggle * 10, 26 * sizeMul, animation.sway * 0.14);
                this.drawEmoji('🫧', headX + 10 * sizeMul, headY - 22 * sizeMul - animation.progress * 12, 18 * sizeMul, 0, 0.85);
                this.drawEmoji('🫧', headX + 38 * sizeMul, headY - 10 * sizeMul - animation.pulse * 8, 14 * sizeMul, 0, 0.8);
                break;
            case 'wash_feet':
                ctx.fillStyle = 'rgba(125, 211, 252, 0.68)';
                for (let i = 0; i < 5; i++) {
                    const splashX = -26 + i * 12;
                    const splashY = 118 - Math.abs(Math.sin(animation.progress * Math.PI * 5 + i)) * 18;
                    ctx.beginPath();
                    ctx.arc(splashX, splashY, (i % 2 === 0 ? 3.5 : 2.5) * sizeMul, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'wash_body':
                this.drawEmoji('🧼', bodyRadiusX * 0.52, 34 * sizeMul + animation.wiggle * 6, 28 * sizeMul, animation.sway * 0.12);
                this.drawEmoji('🫧', 10 * sizeMul, 12 * sizeMul - animation.progress * 18, 18 * sizeMul, 0, 0.9);
                this.drawEmoji('🫧', -28 * sizeMul, 28 * sizeMul - animation.pulse * 12, 16 * sizeMul, 0, 0.8);
                break;
            case 'wash_shower':
                this.drawEmoji('🚿', -12, -104 * sizeMul, 30 * sizeMul);
                ctx.fillStyle = '#7dd3fc';
                for (let i = 0; i < 7; i++) {
                    const dropX = -24 + i * 8;
                    const dropY = -82 * sizeMul + ((animation.progress * 180 + i * 22) % 150);
                    ctx.beginPath();
                    ctx.arc(dropX, dropY, (i % 2 === 0 ? 3.2 : 2.4) * sizeMul, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'wash_bath':
                this.drawEmoji('🫧', bodyRadiusX * 0.54, 16 - ((tickCount + 10) % 60), 18 * sizeMul, 0, 0.82);
                this.drawEmoji('🫧', -bodyRadiusX * 0.3, 34 - ((tickCount + 34) % 56), 16 * sizeMul, 0, 0.76);
                this.drawEmoji('🫧', bodyRadiusX * 0.08, 8 - ((tickCount + 22) % 54), 14 * sizeMul, 0, 0.7);
                break;
            case 'wash_mud':
                ctx.fillStyle = 'rgba(120, 69, 41, 0.68)';
                for (let i = 0; i < 6; i++) {
                    ctx.beginPath();
                    ctx.arc(
                        -46 + i * 18 + animation.sway * 6,
                        78 + Math.abs(Math.sin(animation.progress * Math.PI * 4 + i)) * 18,
                        (i % 2 === 0 ? 5 : 3.5) * sizeMul,
                        0,
                        Math.PI * 2,
                    );
                    ctx.fill();
                }
                break;
            case 'interact_praise':
                this.drawHeart(headX + 14 * sizeMul, headY - 30 * sizeMul - animation.progress * 18, 16 * sizeMul, '#fb7185', 0.9);
                this.drawHeart(headX + 42 * sizeMul, headY - 14 * sizeMul - animation.pulse * 14, 12 * sizeMul, '#f472b6', 0.8);
                break;
            case 'interact_scold':
                this.drawScribble(headX + 44 * sizeMul, headY - 18 * sizeMul, 22 * sizeMul, '#ef4444');
                break;
            case 'interact_hospital':
                ctx.save();
                ctx.translate(headX + 60 * sizeMul, headY - 22 * sizeMul - animation.pulse * 6);
                ctx.fillStyle = 'rgba(255,255,255,0.88)';
                ctx.beginPath();
                ctx.roundRect(-16 * sizeMul, -16 * sizeMul, 32 * sizeMul, 32 * sizeMul, 10 * sizeMul);
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-4 * sizeMul, -11 * sizeMul, 8 * sizeMul, 22 * sizeMul);
                ctx.fillRect(-11 * sizeMul, -4 * sizeMul, 22 * sizeMul, 8 * sizeMul);
                ctx.restore();
                break;
            case 'interact_pasture':
                this.drawEmoji('🍃', -56 + animation.progress * 110, -28 - animation.pulse * 16, 24 * sizeMul, animation.sway * 0.2);
                this.drawEmoji('🌼', 72 - animation.progress * 40, 88 - animation.bounce * 18, 22 * sizeMul, 0, 0.9);
                break;
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

    private lightenColor(color: string, percent: number): string {
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
        r = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
        g = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
        b = Math.min(255, Math.floor(b + (255 - b) * percent / 100));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /** Draw one chunky pillar leg with 3 toe-bumps scaled with body */
    private drawLeg(x: number, y: number, length: number, color: string, scale: number = 1.0) {
        const w = 13 * scale;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        (this.ctx as any).roundRect(x - w, y, w * 2, length, [6 * scale, 6 * scale, 0, 0]);
        this.ctx.fill();

        // Ankle shadow line
        this.ctx.strokeStyle = this.darkenColor(color, 12);
        this.ctx.lineWidth = 1.5 * scale;
        this.ctx.beginPath();
        this.ctx.moveTo(x - w + 2 * scale, y + length - 5 * scale);
        this.ctx.lineTo(x + w - 2 * scale, y + length - 5 * scale);
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

    private drawBlush(x: number, y: number, color: string, scale: number) {
        const ctx = this.ctx;
        const s = scale;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 8 * s);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(x, y, 10 * s, 6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // ─── Expression drawing ────────────────────────────────────────────────

    /** Draw a single eye at (x,y) given expression descriptor */
    private drawExpressionEye(x: number, y: number, expr: Expression, isLeft: boolean, scale: number = 1) {
        const s = scale;
        const et = expr.eyeType;
        const ctx = this.ctx;

        if (et === 'open' || et === 'wide') {
            const r = et === 'wide' ? 9.6 * s : 8.6 * s;
            // Sclera
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2); ctx.fill();
            // Iris
            ctx.fillStyle = '#2d3748';
            ctx.beginPath(); ctx.arc(x + 0.5 * s, y + 0.9 * s, r * 0.62, 0, Math.PI * 2); ctx.fill();
            // Pupil shine (More refined position)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(x + 1.2 * s, y - 2.9 * s, r * 0.28, 0, Math.PI * 2); ctx.fill();
            // Upper eyelid & Eyelashes
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.5 * s;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();

            const lashLen = 3.2 * s;
            for (let i = 0; i < 2; i++) {
                const angle = Math.PI * 1.22 + (i * 0.42);
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

        // Blush
        if (expression.blush && !overrideBlink) {
            this.drawBlush(eye1X - 6 * faceScale, eyeY + 9 * faceScale, expression.blushColor || '#fca5a5', faceScale);
            this.drawBlush(eye2X + 6 * faceScale, eyeY + 9 * faceScale, expression.blushColor || '#fca5a5', faceScale);
        }

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
        this.syncCanvasSize();
        if (this.fsm.isEgg) return;
        if (this.fsm.stats.isDead) {
            this.renderDead(tickCount);
            return;
        }

        const state = petState;
        const now = Date.now();
        const comfortMode = this.fsm.stats.preferences?.comfortMode ?? false;
        const motionFactor = this.getMotionFactor();
        const motionTick = comfortMode ? tickCount * 0.6 : tickCount;
        const animation = this.getAnimationSnapshot(now);
        this.drawBackground(state, motionTick, animation?.id);

        // ── Age calculations ──────────────────────────────────────────────
        const ageYears = getAgeYearsFromActiveSeconds(this.fsm.stats.ageTicks);
        const sizeMul = ageSizeMultiplier(ageYears);
        const roundness = headRoundness(ageYears);
        const headSize = headSizeFactor(ageYears);
        const speedDiv = legSpeedDivisor(ageYears);

        // ── Base body dimensions ──────────────────────────────────────────
        const minWeight = 50, maxWeight = 150;
        const boundedWeight = Math.max(minWeight, Math.min(maxWeight, this.fsm.stats.weight));
        const weightFactor = (boundedWeight - minWeight) / (maxWeight - minWeight);

        // Base at age-4 body = 65×48; scaled by age
        const BASE_BRX = (65 + weightFactor * 40) * sizeMul;
        const BASE_BRY = (48 + weightFactor * 12) * sizeMul;

        // ── Animation state (Tempo reduced by 50%: divisors doubled) ──
        let breath = Math.sin(motionTick / 42) * 1.35;
        let tailWag = state === 'Sleep' ? 0 : Math.sin(motionTick / 40) * 5.5;
        let headOscillationX = 0;
        let headOscillationY = 0;
        let bodyOscillationY = 0;
        let renderShiftX = 0;
        let isDancing = false;
        let isMouthOpen = false;
        let animationExpression: ExpressionKey | null = null;

        // Blink timing: normal blink every ~5s, double-blink occasionally
        const blinkCycle = motionTick % (comfortMode ? 240 : 180);
        const isBlinking = blinkCycle < 5 || (blinkCycle > 10 && blinkCycle < 14);

        if (animation) {
            switch (animation.id) {
                case 'feed_fern':
                    headOscillationY = 8 + animation.bounce * 18;
                    headOscillationX = animation.sway * 5;
                    isMouthOpen = animation.flutter > 0.35;
                    tailWag = animation.wiggle * 14;
                    animationExpression = 'playful';
                    break;
                case 'feed_conifer':
                    headOscillationY = -18 * animation.pulse;
                    headOscillationX = 24 * animation.pulse;
                    renderShiftX = 8 * animation.pulse;
                    bodyOscillationY = -6 * animation.pulse;
                    isMouthOpen = animation.progress < 0.4 || animation.flutter > 0.5;
                    tailWag = animation.sway * 16;
                    animationExpression = 'excited';
                    break;
                case 'feed_vitamin':
                    bodyOscillationY = -10 * animation.bounce;
                    headOscillationY = -8 * animation.bounce;
                    headOscillationX = animation.sway * 6;
                    tailWag = animation.wiggle * 18;
                    animationExpression = 'excited';
                    break;
                case 'feed_medicine': {
                    const recoil = animation.progress < 0.35 ? Math.sin((animation.progress / 0.35) * Math.PI) : 0;
                    const relief = animation.progress > 0.45 ? Math.sin(((animation.progress - 0.45) / 0.55) * Math.PI * 0.9) : 0;
                    headOscillationX = -12 * recoil + 6 * relief;
                    headOscillationY = -4 * recoil + 8 * relief;
                    bodyOscillationY = 4 * recoil - 6 * relief;
                    isMouthOpen = animation.progress > 0.24 && animation.progress < 0.58;
                    animationExpression = recoil > 0.1 ? 'confused' : 'calm';
                    break;
                }
                case 'feed_special':
                    bodyOscillationY = -12 * animation.bounce;
                    headOscillationY = -6 * animation.bounce;
                    tailWag = animation.wiggle * 20;
                    animationExpression = 'loving';
                    break;
                case 'train_ball':
                    renderShiftX = (animation.progress * 2 - 1) * 20;
                    bodyOscillationY = -18 * animation.bounce;
                    headOscillationX = animation.sway * 14;
                    headOscillationY = -12 * animation.bounce;
                    tailWag = animation.wiggle * 24;
                    animationExpression = 'excited';
                    break;
                case 'train_frisbee':
                    renderShiftX = 18 * animation.pulse;
                    bodyOscillationY = -24 * animation.pulse;
                    headOscillationX = 22 * animation.pulse;
                    headOscillationY = -20 * animation.pulse;
                    tailWag = animation.sway * 26;
                    animationExpression = 'excited';
                    break;
                case 'train_discipline':
                    headOscillationY = Math.abs(animation.wiggle) * 12;
                    bodyOscillationY = -4 * animation.pulse;
                    tailWag = 0;
                    animationExpression = 'thinking';
                    break;
                case 'train_walk':
                    renderShiftX = animation.sway * 18;
                    bodyOscillationY = -10 * animation.bounce;
                    headOscillationX = animation.sway * 6;
                    tailWag = animation.wiggle * 18;
                    animationExpression = 'proud';
                    break;
                case 'train_sing':
                    isDancing = true;
                    bodyOscillationY = -8 * animation.bounce;
                    headOscillationX = animation.sway * 10;
                    headOscillationY = -4 * animation.pulse;
                    isMouthOpen = true;
                    tailWag = animation.wiggle * 16;
                    animationExpression = 'loving';
                    break;
                case 'train_dance':
                    isDancing = true;
                    bodyOscillationY = -18 * animation.bounce;
                    headOscillationX = animation.wiggle * 12;
                    headOscillationY = -6 * animation.bounce;
                    tailWag = animation.sway * 30;
                    animationExpression = 'excited';
                    break;
                case 'wash_face':
                    headOscillationX = animation.wiggle * 8;
                    headOscillationY = 4 + animation.bounce * 8;
                    animationExpression = 'shy';
                    break;
                case 'wash_feet':
                    bodyOscillationY = -4 * animation.bounce;
                    animationExpression = 'playful';
                    break;
                case 'wash_body':
                    headOscillationX = animation.sway * 6;
                    bodyOscillationY = -8 * animation.bounce;
                    tailWag = animation.wiggle * 12;
                    animationExpression = 'calm';
                    break;
                case 'wash_shower':
                    headOscillationX = animation.wiggle * 7;
                    bodyOscillationY = Math.sin(animation.progress * Math.PI * 6) * -4;
                    animationExpression = 'shy';
                    break;
                case 'wash_bath':
                    headOscillationX = animation.sway * 4;
                    headOscillationY = -2 + animation.sway * 3;
                    bodyOscillationY = 8 * animation.pulse;
                    animationExpression = 'calm';
                    break;
                case 'wash_mud':
                    headOscillationX = animation.sway * 10;
                    bodyOscillationY = -10 * animation.bounce;
                    tailWag = animation.wiggle * 22;
                    animationExpression = 'smug';
                    break;
                case 'interact_praise':
                    headOscillationY = -6 * animation.pulse;
                    bodyOscillationY = -8 * animation.pulse;
                    tailWag = animation.wiggle * 20;
                    animationExpression = 'loving';
                    break;
                case 'interact_scold':
                    headOscillationX = -animation.wiggle * 8;
                    bodyOscillationY = 5 * animation.pulse;
                    tailWag = 0;
                    animationExpression = 'angry';
                    break;
                case 'interact_hospital':
                    headOscillationY = -4 * animation.pulse;
                    bodyOscillationY = -3 * animation.bounce;
                    animationExpression = animation.progress < 0.45 ? 'worried' : 'calm';
                    break;
                case 'interact_pasture':
                    renderShiftX = animation.sway * 24;
                    bodyOscillationY = -10 * animation.bounce;
                    headOscillationX = animation.sway * 8;
                    tailWag = animation.wiggle * 18;
                    animationExpression = 'excited';
                    break;
            }
        } else if (state === 'Idle') {
            const isHighStat = this.fsm.stats.happiness >= 80 && this.fsm.stats.energy >= 80 && this.fsm.stats.fullness >= 80;
            if (isHighStat) {
                bodyOscillationY = Math.sin(motionTick / 44) * -3.2;
                headOscillationX = Math.sin(motionTick / 52) * 3.8;
                headOscillationY = Math.cos(motionTick / 60) * 2.4;
                tailWag = Math.sin(motionTick / 34) * 8;
                breath = Math.sin(motionTick / 48) * 1.6;
            }
        }

        const poseProfile = this.getPoseProfile(state, motionTick);
        headOscillationX += poseProfile.headOffsetX;
        headOscillationY += poseProfile.headOffsetY;
        bodyOscillationY += poseProfile.bodyOffsetY;
        tailWag += poseProfile.tailExtra;

        breath *= comfortMode ? 0.72 : 1;
        tailWag *= motionFactor;
        headOscillationX *= motionFactor;
        headOscillationY *= motionFactor;
        bodyOscillationY *= motionFactor;
        renderShiftX *= motionFactor;

        // ── Canvas transform ──────────────────────────────────────────────
        this.ctx.save();
        const currentWanderX = this.fsm.wanderX || 0;
        const renderX = this.width / 2 + currentWanderX + renderShiftX;
        const flipH = !animation && this.fsm.wanderTargetX < this.fsm.wanderX;

        const stageGroundY = this.height * 0.72;
        this.ctx.translate(renderX, stageGroundY + breath + bodyOscillationY);
        if (flipH) this.ctx.scale(-1, 1);

        // ── Body color by state ───────────────────────────────────────────
        let bodyColor = '#86efac';
        if (state === 'Hungry') bodyColor = '#fca5a5';
        else if (state === 'Dirty') bodyColor = '#cbd5e1';
        else if (state === 'Sleepy') bodyColor = '#93c5fd';
        else if (state === 'Sleep') bodyColor = '#1e3a8a';
        else if (state === 'Naughty') bodyColor = '#fb923c';
        else if (state === 'Sick') bodyColor = '#bef264';

        const darkColor = this.darkenColor(bodyColor, 18);
        const lightColor = this.lightenColor(bodyColor, 30);

        const tier = this.fsm.stats.evolutionTier;

        // ── Geometry ──────────────────────────────────────────────────────
        const bodyRadiusX = BASE_BRX;
        const bodyRadiusY = BASE_BRY * poseProfile.bodyScaleY;

        // Neck length & head position scale with age
        const neckLen = (60 + tier * 35) * sizeMul * poseProfile.neckScale;
        const headX = (28 + headOscillationX) * sizeMul;
        const headY = -neckLen + headOscillationY;

        // Head shape: younger = rounder
        const headRX = 26 * sizeMul * headSize;
        const headRY = headRX * roundness;
        const snoutRX = 17 * sizeMul * Math.max(0.92, headSize * 0.9);
        const snoutRY = 11.5 * sizeMul * Math.max(0.92, roundness * 0.96);

        // Face scale for expressions
        const faceScale = sizeMul * Math.max(1.1, headSize * 0.94);

        // Eye positions
        const eye1X = headX - 12 * sizeMul;
        const eye2X = headX + 10 * sizeMul;
        const eyeY = headY - 7 * sizeMul;
        const mouthX = headX - 1 * sizeMul;
        const mouthY = headY + 14 * sizeMul;

        // ── Shadow ────────────────────────────────────────────────────────
        this.ctx.fillStyle = 'rgba(0,0,0,0.10)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, bodyRadiusY + 55 * sizeMul, bodyRadiusX + 15, 10 * sizeMul, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // ─── 1. TAIL ──────────────────────────────────────────────────────
        this.ctx.strokeStyle = bodyColor;
        this.ctx.lineWidth = (16 + tier * 2) * sizeMul;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-bodyRadiusX + 18, 40 * sizeMul);
        this.ctx.quadraticCurveTo(-bodyRadiusX - 25, 35 * sizeMul, -bodyRadiusX - 42 * sizeMul - tier * 8 * sizeMul, 60 * sizeMul + tailWag);
        this.ctx.stroke();
        this.drawDirtSpot(-bodyRadiusX - 14, 48 * sizeMul + tailWag * 0.5, 22, 11, this.fsm.stats.spotDirt.tail, 'tail');

        // ─── 2. BACK LEGS ─────────────────────────────────────────────────
        this.drawLeg(-bodyRadiusX * 0.42, 58 * sizeMul, 46 * sizeMul, darkColor, sizeMul);
        this.drawLeg(bodyRadiusX * 0.42, 58 * sizeMul, 46 * sizeMul, darkColor, sizeMul);

        // ─── 3. NECK ─────────────────────────────────────────────────────
        this.ctx.strokeStyle = bodyColor;
        this.ctx.lineWidth = (22 + tier * 3) * sizeMul;
        this.ctx.beginPath();
        this.ctx.moveTo(-8 * sizeMul, 35 * sizeMul);
        this.ctx.quadraticCurveTo(18 * sizeMul + headOscillationX * 0.5, 10 * sizeMul + headOscillationY * 0.5, headX, headY + 14 * sizeMul);
        this.ctx.stroke();
        this.drawDirtSpot((headX - 8 * sizeMul) / 2, (headY + 14 * sizeMul + 35 * sizeMul) / 2, 13, 22, this.fsm.stats.spotDirt.neck, 'neck');

        // ─── Bath prop ────────────────────────────────────────────────────
        if (animation?.id === 'wash_bath') {
            this.ctx.fillStyle = '#e0f2fe';
            this.ctx.beginPath();
            this.ctx.rect(-bodyRadiusX - 10, 28 * sizeMul, bodyRadiusX * 2 + 20, 38 * sizeMul);
            this.ctx.fill();
            this.ctx.fillStyle = '#bae6fd';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 28 * sizeMul, bodyRadiusX + 10, 9 * sizeMul, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // ─── 4. BODY ─────────────────────────────────────────────────────
        // Main body ellipse
        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 42 * sizeMul, bodyRadiusX, bodyRadiusY, -0.05, 0, Math.PI * 2);
        this.ctx.fill();

        // Belly gradient highlight (cute chubby look)
        const grad = this.ctx.createRadialGradient(6 * sizeMul, 52 * sizeMul, 2, 6 * sizeMul, 52 * sizeMul, bodyRadiusX * 0.8);
        grad.addColorStop(0, 'rgba(255,255,255,0.28)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.ellipse(6 * sizeMul, 52 * sizeMul, bodyRadiusX * 0.7, bodyRadiusY * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Dorsal ridge
        this.ctx.strokeStyle = darkColor;
        this.ctx.lineWidth = 2.5 * sizeMul;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-bodyRadiusX * 0.62, 8 * sizeMul);
        this.ctx.quadraticCurveTo(-bodyRadiusX * 0.08, -10 * sizeMul, bodyRadiusX * 0.22, 4 * sizeMul);
        this.ctx.stroke();

        // Subtle scale ellipses
        this.ctx.fillStyle = darkColor;
        this.ctx.globalAlpha = 0.28;
        const scales = [[-28 - weightFactor * 6, 18, 11, 7, -0.3], [-5, 3, 15, 9, 0.1], [20 + weightFactor * 4, 14, 10, 6, 0.4]] as const;
        for (const [sx, sy, srx, sry, rot] of scales) {
            this.ctx.beginPath();
            this.ctx.ellipse(sx * sizeMul, sy * sizeMul, srx * sizeMul, sry * sizeMul, rot, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        // Body dirt
        this.drawDirtSpot(0, 42 * sizeMul, bodyRadiusX, bodyRadiusY, this.fsm.stats.spotDirt.body, 'body');

        // ─── 5. FRONT LEGS ────────────────────────────────────────────────
        // Leg animation
        let legOffset1 = 0, legOffset2 = 0;
        if (animation) {
            switch (animation.id) {
                case 'train_walk':
                case 'interact_pasture':
                    legOffset1 = Math.sin(animation.progress * Math.PI * 8) * 14;
                    legOffset2 = Math.cos(animation.progress * Math.PI * 8) * 14;
                    break;
                case 'train_ball':
                    legOffset1 = Math.sin(animation.progress * Math.PI * 6) * 8;
                    legOffset2 = -18 * animation.pulse;
                    break;
                case 'train_frisbee':
                    legOffset1 = -14 * animation.pulse;
                    legOffset2 = -8 * animation.pulse;
                    break;
                case 'train_discipline':
                    legOffset1 = Math.abs(Math.sin(animation.progress * Math.PI * 4)) * 5;
                    legOffset2 = Math.abs(Math.cos(animation.progress * Math.PI * 4)) * 3;
                    break;
                case 'wash_feet':
                    if (animation.progress < 0.5) legOffset1 = -14 * Math.abs(Math.sin(animation.progress * Math.PI * 4));
                    else legOffset2 = -14 * Math.abs(Math.sin(animation.progress * Math.PI * 4));
                    break;
                case 'wash_mud':
                    legOffset1 = Math.sin(animation.progress * Math.PI * 6) * 10;
                    legOffset2 = Math.cos(animation.progress * Math.PI * 6) * 10;
                    break;
            }
        } else if (Math.abs(this.fsm.wanderTargetX - this.fsm.wanderX) > 1) {
            legOffset1 = Math.sin(motionTick / speedDiv) * 8.5;
            legOffset2 = Math.cos(motionTick / speedDiv) * 8.5;
        } else if (state === 'Idle') {
            const mood = (this.fsm.stats.happiness + this.fsm.stats.energy) / 200;
            if (mood > 0.7) {
                const stompSpeed = speedDiv * 1.4; // slightly slower than walk
                legOffset1 = Math.sin(motionTick / stompSpeed) * (2.5 + mood * 2.2);
                legOffset2 = Math.cos(motionTick / stompSpeed) * (2.5 + mood * 2.2);
            }
        }

        legOffset1 *= motionFactor;
        legOffset2 *= motionFactor;

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
        // Skull dome
        this.ctx.beginPath();
        this.ctx.ellipse(headX, headY, headRX, headRY, 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        const headHighlight = this.ctx.createRadialGradient(
            headX - 10 * sizeMul,
            headY - 14 * sizeMul,
            4 * sizeMul,
            headX - 6 * sizeMul,
            headY - 10 * sizeMul,
            headRX * 0.95,
        );
        headHighlight.addColorStop(0, 'rgba(255,255,255,0.34)');
        headHighlight.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = headHighlight;
        this.ctx.beginPath();
        this.ctx.ellipse(headX - 1 * sizeMul, headY - 2 * sizeMul, headRX * 0.92, headRY * 0.9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Snout – wider when young (cute pug), flatter when older
        this.ctx.fillStyle = bodyColor;
        this.ctx.beginPath();
        this.ctx.ellipse(headX + 13 * sizeMul, headY + 7 * sizeMul, snoutRX, snoutRY, 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        // Cheek bulge (cute)
        this.ctx.fillStyle = lightColor;
        this.ctx.globalAlpha = 0.38;
        this.ctx.beginPath();
        this.ctx.ellipse(headX + 1 * sizeMul, headY + 12 * sizeMul, 16 * sizeMul, 11 * sizeMul, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        // Nostril
        this.ctx.fillStyle = darkColor;
        this.ctx.beginPath();
        this.ctx.ellipse(headX + 23 * sizeMul, headY + 5 * sizeMul, 2.5 * sizeMul, 2 * sizeMul, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawDirtSpot(headX + 3 * sizeMul, headY + 4 * sizeMul, 32 * sizeMul, 24 * sizeMul, this.fsm.stats.spotDirt.head, 'head');

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
            const zzzOffset = Math.sin(motionTick / 20) * 5;
            this.ctx.fillText('Zzz', 0, headY - 30 * sizeMul + zzzOffset);
        } else if (state === 'Hungry') exprKey = 'hungry';
        else if (state === 'Dirty') exprKey = 'worried';
        else if (state === 'Naughty') exprKey = 'angry';
        else if (state === 'Sick') exprKey = 'sick';
        else if (state === 'Sleepy') exprKey = 'sleepy';
        else {
            exprKey = this.getIdleExpression(motionTick, isMouthOpen);
        }

        if (animationExpression) {
            exprKey = animationExpression;
        } else if (poseProfile.expression) {
            exprKey = poseProfile.expression;
        }

        // Dirty state also shows flies
        if (state === 'Dirty') {
            this.ctx.fillStyle = '#475569';
            this.ctx.fillRect(-30 + (motionTick % 15), -40 * sizeMul - (motionTick % 10), 3, 3);
            this.ctx.fillRect(20 - (motionTick % 12), -50 * sizeMul + (motionTick % 14), 3, 3);
        }

        this.renderFace(exprKey, headX, headY, eye1X, eye2X, eyeY, mouthX, mouthY, faceScale, isBlinking);

        // Dancing music note
        if (isDancing && !animation && motionTick % 35 === 0) {
            this.ctx.font = `${20 * sizeMul}px Arial`;
            this.ctx.fillText('🎵', headX + 28 * sizeMul, headY - 10 * sizeMul);
        }

        // ─── 8. FOREGROUND ANIMATION PROPS ───────────────────────────────
        if (animation) {
            this.drawActionProps(animation, tickCount, sizeMul, headX, headY, bodyRadiusX);
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
