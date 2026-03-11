export class AudioManager {
    private ctx: AudioContext | null = null;
    private initialized = false;
    private bgm: HTMLAudioElement | null = null;
    private bgmStarted = false;

    public init() {
        if (!this.initialized) {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                this.ctx = new AudioContextClass();
                this.initialized = true;
            } catch (e) {
                console.warn('Web Audio API not supported');
            }
        }

        this.ensureBackgroundMusic();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.playBackgroundMusic();
    }

    private playTone(freq: number, type: OscillatorType, dur: number, vol: number = 0.1) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    public playClick() {
        this.playTone(600, 'sine', 0.1, 0.05);
    }

    public playSuccess() {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.setValueAtTime(660, this.ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    public playError() {
        this.playTone(150, 'sawtooth', 0.3, 0.1);
    }

    public playPop() {
        this.playTone(800, 'sine', 0.1, 0.08);
    }

    private ensureBackgroundMusic() {
        if (this.bgm) return;

        this.bgm = new Audio(new URL('../background.mp3', import.meta.url).href);
        this.bgm.loop = true;
        this.bgm.preload = 'auto';
        this.bgm.volume = 0.3;

        document.addEventListener('visibilitychange', () => {
            if (!this.bgm) return;
            if (document.visibilityState === 'hidden') {
                this.bgm.pause();
            } else if (this.bgmStarted) {
                this.playBackgroundMusic();
            }
        });
    }

    private playBackgroundMusic() {
        if (!this.bgm) return;
        this.bgmStarted = true;
        this.bgm.play().catch(() => {
            this.bgmStarted = false;
        });
    }
}

export const AUDIO = new AudioManager();
