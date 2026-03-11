import { BALANCE } from './balance';
import { HOOKS } from './events/hooks';
import { Personality } from './events/personality';
import {
    getAgeYearsFromActiveSeconds,
    getDisplayAgeYears,
    getEvolutionTierFromActiveSeconds,
    getNextGrowthMilestone,
} from './growth';

export type PetState = 'Idle' | 'Hungry' | 'Dirty' | 'Sleepy' | 'Sleep' | 'Quiz' | 'Sick' | 'Naughty';

export interface ActiveAnimation {
    id: string;
    startedAt: number;
    until: number;
    durationMs: number;
}

export interface GraveyardRecord {
    name: string;
    personality: string;
    bornAtMs: number;
    diedAtMs: number;
    reason: string;
    tier: number;
}

export interface PetStats {
    name: string;
    fullness: number;
    happiness: number;
    cleanliness: number;
    energy: number;
    gold: number;
    amber: number;
    xp: number;
    wisdom: number;
    ageTicks: number; // Ticks for fine-grained age tracking
    evolutionTier: number; // 0: Baby, 1: Child, 2: Teen, 3: Adult
    medicine: number; // For treating Sick state
    weight: number;   // Dynamic body weight
    hasGastroliths: boolean;   // 1.5x fullness per meal
    hasAirSacs: boolean;       // -50% energy cost for special moves
    scaleScutes: boolean;      // -20% cleanliness decay (tough armored skin)
    thickSkin: boolean;        // -30% spot dirt gain from weather events
    longNeck: boolean;         // bonus +10 fullness from tall-plant foods
    strongTail: boolean;       // +5 bonus happiness from play actions
    sharpSense: boolean;       // detect sickness 30s earlier, prevent one miss
    fastMetabolism: boolean;   // +20% energy recovery during sleep
    mudLover: boolean;         // mud bath gives +happiness without dirt penalty
    buffs: { vitaminUntil?: number, snackUntil?: number }; // temporary buffs
    personality: Personality;
    unlockedPersonalities: Personality[];
    pastureEndTime?: number;
    introSeen: boolean;
    inventory: Record<string, number>;
    unlockedItems: string[];

    bornAtMs: number;
    isDead: boolean;
    deathReason?: string;
    diedAtMs?: number;
    sickDurationMs: number;
    graveyardRecords: GraveyardRecord[];
    minigameCountToday: number;
    lastMinigameResetDay: string;

    spotDirt: { head: number; neck: number; body: number; legs: number; tail: number };
    pmStats: { athletics: number; intellect: number; elegance: number; discipline: number; charm: number; health: number };
    gameLastPlayedMs: Record<string, number>; // per-game 4h cooldown timestamps
    mathQuizTier: number; // persisted DDA tier for math quiz

    // Counter system for trait unlocks
    actionCounts: {
        bath: number;
        wash: number;
        feedConifer: number;
        train: number;
        vitamin: number;
        sleepBed: number;
        washMud: number;
    };
}

export class FSM {
    public currentState: PetState = 'Idle';
    public stats: PetStats = {
        name: '',
        fullness: 100,
        happiness: 100,
        cleanliness: 100,
        energy: 100,
        gold: 0,
        amber: 0,
        xp: 0,
        wisdom: 0,
        ageTicks: 0,
        evolutionTier: 0,
        medicine: 0,
        weight: 50, // Base weight
        hasGastroliths: false,
        hasAirSacs: false,
        scaleScutes: false,
        thickSkin: false,
        longNeck: false,
        strongTail: false,
        sharpSense: false,
        fastMetabolism: false,
        mudLover: false,
        buffs: {},
        personality: 'Normal',
        unlockedPersonalities: ['Normal'],
        pastureEndTime: undefined,
        introSeen: false,
        inventory: {},
        unlockedItems: [],
        bornAtMs: Date.now(),
        isDead: false,
        sickDurationMs: 0,
        graveyardRecords: [],
        minigameCountToday: 0,
        lastMinigameResetDay: new Date().toDateString(),
        spotDirt: { head: 0, neck: 0, body: 0, legs: 0, tail: 0 },
        pmStats: { athletics: 0, intellect: 0, elegance: 0, discipline: 0, charm: 0, health: 0 },
        gameLastPlayedMs: {},
        mathQuizTier: 0,
        actionCounts: {
            bath: 0,
            wash: 0,
            feedConifer: 0,
            train: 0,
            vitamin: 0,
            sleepBed: 0,
            washMud: 0,
        },
    };

    public lastTick: number = Date.now();
    public isSleeping: boolean = false; // changed to public for UI access
    public sleepType: 'bed' | 'floor' | 'outside' | null = null;
    public careMisses: number = 0;
    public zeroStatTimers = { fullness: 0, cleanliness: 0 };
    public lastPlayString: string = '';

    // Weather Event ('None', 'Drought', 'MeteorShower', 'VolcanicAsh')
    public activeEvent: 'None' | 'Drought' | 'MeteorShower' | 'VolcanicAsh' = 'None';
    public eventEndTime: number = 0;

    public isEvolutionTriggered: boolean = false;

    // Animation States
    public activeAnimation: ActiveAnimation | null = null;
    public wanderX: number = 0;
    public wanderTargetX: number = 0;
    public wanderWaitUntil: number = 0;

    constructor(initialStats?: PetStats, lastTick?: number) {
        if (initialStats) {
            this.stats = { ...initialStats };
            // Backwards compatibility for old saved states
            if (this.stats.gold === undefined) this.stats.gold = 0; // Migrated from old coins if needed in storage
            if (this.stats.wisdom === undefined) this.stats.wisdom = 0;
            if (this.stats.ageTicks === undefined) this.stats.ageTicks = 0;
            if (this.stats.evolutionTier === undefined) this.stats.evolutionTier = 0;
            if (this.stats.medicine === undefined) this.stats.medicine = 0;
            if (this.stats.weight === undefined) this.stats.weight = 50;
            if (this.stats.hasGastroliths === undefined) this.stats.hasGastroliths = false;
            if (this.stats.hasAirSacs === undefined) this.stats.hasAirSacs = this.stats.evolutionTier >= 2;
            if (this.stats.buffs === undefined) this.stats.buffs = {};
            if (this.stats.personality === undefined) this.stats.personality = 'Normal';
            if (this.stats.unlockedPersonalities === undefined) this.stats.unlockedPersonalities = ['Normal'];
        }
        if (lastTick) {
            this.lastTick = lastTick;
            this.lastPlayString = new Date(lastTick).toDateString();
            // Ensure new properties exist in loaded states
            if (this.stats.introSeen === undefined) this.stats.introSeen = false;
            if (!this.stats.inventory) this.stats.inventory = {};
            if (!this.stats.unlockedItems) this.stats.unlockedItems = [];

            if (this.stats.bornAtMs === undefined) this.stats.bornAtMs = Date.now() - (this.stats.ageTicks * 1000);
            if (this.stats.isDead === undefined) this.stats.isDead = false;
            if (this.stats.sickDurationMs === undefined) this.stats.sickDurationMs = 0;
            if (!this.stats.graveyardRecords) this.stats.graveyardRecords = [];
            if (this.stats.minigameCountToday === undefined) this.stats.minigameCountToday = 0;
            if (this.stats.lastMinigameResetDay === undefined) this.stats.lastMinigameResetDay = new Date().toDateString();

            if (!this.stats.spotDirt) this.stats.spotDirt = { head: 0, neck: 0, body: 0, legs: 0, tail: 0 };
            if (!this.stats.pmStats) this.stats.pmStats = { athletics: 0, intellect: 0, elegance: 0, discipline: 0, charm: 0, health: 0 };
            if (!this.stats.gameLastPlayedMs) this.stats.gameLastPlayedMs = {};
            if (this.stats.mathQuizTier === undefined) this.stats.mathQuizTier = 0;
            // Hydrate new passive traits
            if (this.stats.scaleScutes === undefined) this.stats.scaleScutes = false;
            if (this.stats.thickSkin === undefined) this.stats.thickSkin = false;
            if (this.stats.longNeck === undefined) this.stats.longNeck = false;
            if (this.stats.strongTail === undefined) this.stats.strongTail = false;
            if (this.stats.sharpSense === undefined) this.stats.sharpSense = false;
            if (this.stats.fastMetabolism === undefined) this.stats.fastMetabolism = false;
            if (this.stats.mudLover === undefined) this.stats.mudLover = false;

            if (!this.stats.actionCounts) {
                this.stats.actionCounts = {
                    bath: 0, wash: 0, feedConifer: 0, train: 0, vitamin: 0, sleepBed: 0, washMud: 0
                };
            }

            this.applyOfflineTime(Date.now()); // Reverted to original call as per analysis
        } else {
            this.lastPlayString = new Date().toDateString();
        }
    }

    public checkDailyReset() {
        const today = new Date().toDateString();
        if (this.stats.lastMinigameResetDay !== today) {
            this.stats.minigameCountToday = 0;
            this.stats.lastMinigameResetDay = today;
        }
    }

    public canPlayMinigame(): boolean {
        this.checkDailyReset();
        return this.stats.minigameCountToday < 10;
    }

    public canPlayGame(gameId: string): boolean {
        const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
        const last = this.stats.gameLastPlayedMs[gameId] || 0;
        return Date.now() - last >= COOLDOWN_MS;
    }

    public getAgeYears(): number {
        return getAgeYearsFromActiveSeconds(this.stats.ageTicks);
    }

    public getDisplayAgeYears(): number {
        return getDisplayAgeYears(this.stats.ageTicks);
    }

    public getNextGrowthMilestone() {
        return getNextGrowthMilestone(this.stats.ageTicks);
    }

    public skipActiveAnimation() {
        this.activeAnimation = null;
    }

    private getAnimationDuration(actionId: string): number {
        switch (actionId) {
            case 'feed_fern': return 1800;
            case 'feed_conifer': return 2200;
            case 'feed_vitamin': return 1700;
            case 'feed_medicine': return 2200;
            case 'feed_special': return 2000;
            case 'train_ball': return 2300;
            case 'train_frisbee': return 2500;
            case 'train_discipline': return 1800;
            case 'train_walk': return 2600;
            case 'train_sing': return 2400;
            case 'train_dance': return 3200;
            case 'wash_face': return 1700;
            case 'wash_feet': return 1800;
            case 'wash_body': return 2100;
            case 'wash_shower': return 2600;
            case 'wash_bath': return 3600;
            case 'wash_mud': return 2200;
            case 'interact_praise': return 1700;
            case 'interact_scold': return 1700;
            case 'interact_hospital': return 2200;
            case 'interact_pasture': return 2800;
            default: return 2000;
        }
    }

    public recordGamePlayed(gameId: string) {
        this.stats.gameLastPlayedMs[gameId] = Date.now();
    }

    public getGameCooldownRemaining(gameId: string): number {
        const COOLDOWN_MS = 4 * 60 * 60 * 1000;
        const last = this.stats.gameLastPlayedMs[gameId] || 0;
        return Math.max(0, COOLDOWN_MS - (Date.now() - last));
    }


    public die(reason: string) {
        if (this.stats.isDead) return;
        this.stats.isDead = true;
        this.stats.deathReason = reason;
        this.stats.diedAtMs = Date.now();

        this.stats.graveyardRecords.push({
            name: '브라키오',
            personality: this.stats.personality,
            bornAtMs: this.stats.bornAtMs,
            diedAtMs: this.stats.diedAtMs,
            reason: reason,
            tier: this.stats.evolutionTier
        });

        HOOKS.onActionPerformed('die', { reason });
    }

    public reincarnate() {
        const retainedGold = this.stats.gold;
        const retainedAmber = this.stats.amber;
        const retainedUnlockedPersonalities = this.stats.unlockedPersonalities;
        const retainedUnlockedItems = this.stats.unlockedItems;
        const retainedGraveyard = this.stats.graveyardRecords;

        this.stats = {
            ...new FSM().stats, // get default
            gold: retainedGold,
            amber: retainedAmber,
            unlockedPersonalities: retainedUnlockedPersonalities,
            unlockedItems: retainedUnlockedItems,
            graveyardRecords: retainedGraveyard,
            bornAtMs: Date.now(),
            spotDirt: { head: 0, neck: 0, body: 0, legs: 0, tail: 0 },
            pmStats: { athletics: 0, intellect: 0, elegance: 0, discipline: 0, charm: 0, health: 0 },
            // Reset passives so new life can earn them via evolution
            scaleScutes: false,
            thickSkin: false,
            longNeck: false,
            strongTail: false,
            sharpSense: false,
            fastMetabolism: false,
            mudLover: false,
            actionCounts: {
                bath: 0, wash: 0, feedConifer: 0, train: 0, vitamin: 0, sleepBed: 0, washMud: 0
            }
        };
        this.stats.introSeen = false;
        this.lastTick = Date.now();
        this.careMisses = 0;
        this.currentState = 'Idle';
    }

    public get isEgg(): boolean {
        return !this.stats.introSeen;
    }

    public hatchEgg() {
        this.stats.introSeen = true;
        this.stats.bornAtMs = Date.now();
        this.stats.ageTicks = 0;
        this.stats.evolutionTier = 0;
        this.lastTick = Date.now();
        this.stats.inventory['feed_fern'] = 5;
        this.stats.inventory['train_ball'] = 1;
        this.evaluateState();
    }

    public hasItem(productId: string): boolean {
        return (this.stats.inventory[productId] && this.stats.inventory[productId] > 0) || this.stats.unlockedItems.includes(productId);
    }

    public consumeItem(productId: string): boolean {
        if (this.stats.unlockedItems.includes(productId)) return true; // Permanent item
        if (this.stats.inventory[productId] && this.stats.inventory[productId] > 0) {
            this.stats.inventory[productId]--;
            return true;
        }
        return false;
    }

    public get isObese(): boolean {
        return this.stats.weight >= 80;
    }

    private applyStatChange(stat: keyof PetStats, amount: number, minClamp: number = 0) {
        if (typeof this.stats[stat] !== 'number') return;
        const val = this.stats[stat] as number;
        if (val < minClamp && amount < 0) return; // Don't drop further if already below and minClamp applies

        // Buffer stat changes to HOOKS if noticeable
        const newValue = Math.max(minClamp, val + amount);
        if (Math.abs(newValue - val) >= 0.1) {
            HOOKS.onStatChanged({ stat: stat as string, delta: amount, newValue, reason: 'decay/action' });
        }
        (this.stats as any)[stat] = newValue;
    }

    private applyOfflineTime(currentNow: number) {
        const dtSeconds = (currentNow - this.lastTick) / 1000;
        if (dtSeconds > 0) {
            // Cap offline decay to avoid dropping everything instantly to 0 over a day
            const maxDecaySeconds = 8 * 60 * 60;
            const effectiveDt = Math.min(dtSeconds, maxDecaySeconds);

            const cleanDelta = effectiveDt * BALANCE.DECAY_RATES.CLEANLINESS;
            this.stats.fullness = Math.max(0, this.stats.fullness - effectiveDt * BALANCE.DECAY_RATES.FULLNESS);
            this.stats.cleanliness = Math.max(0, this.stats.cleanliness - cleanDelta);
            this.stats.energy = Math.max(0, this.stats.energy - effectiveDt * BALANCE.DECAY_RATES.ENERGY);
            this.stats.happiness = Math.max(0, this.stats.happiness - effectiveDt * BALANCE.DECAY_RATES.HAPPINESS);

            const parts = ['head', 'neck', 'body', 'legs', 'tail'] as const;
            for (let i = 0; i < 5; i++) { // Distribute offline dirt roughly
                const targetPart = parts[Math.floor(Math.random() * parts.length)];
                this.stats.spotDirt[targetPart] = Math.min(100, this.stats.spotDirt[targetPart] + (cleanDelta * 0.1));
            }
        }
        this.lastTick = currentNow;
        this.evaluateState();
    }

    public update() {
        const now = Date.now();
        const dt = (now - this.lastTick) / 1000;
        this.lastTick = now;

        if (this.isEgg) return;

        const todayStr = new Date(now).toDateString();
        if (this.lastPlayString !== todayStr) {
            const newP = HOOKS.onDayBoundaryReached();
            if (newP !== this.stats.personality && newP !== 'Normal') {
                this.stats.personality = newP;
                if (!this.stats.unlockedPersonalities.includes(newP)) {
                    this.stats.unlockedPersonalities.push(newP);
                }
            }
            this.lastPlayString = todayStr;
        }

        const modes = this.checkSpecialModes();
        const decayMultiplier = modes.isSchoolMode ? BALANCE.SCHOOL_MODE_MULTIPLIER : 1.0;
        const minClamp = modes.isSchoolMode ? BALANCE.SCHOOL_MODE_MIN_STAT : 0;

        this.stats.ageTicks += dt;
        this.checkEvolution();

        if (this.stats.isDead) return;

        // Death logic based on age / care misses
        const ageDays = (this.stats.ageTicks * 1000) / BALANCE.MS_PER_DAY;
        const maxLifespanDays = BALANCE.LIFESPAN.BASE_DAYS - (this.careMisses * BALANCE.LIFESPAN.CARE_MISS_PENALTY_DAYS);

        if (ageDays >= Math.max(1, maxLifespanDays)) { // minimum 1 day lifespan
            this.die('수명을 다해 평화롭게 여행을 떠났습니다.');
            return;
        }

        if (this.currentState === 'Sick') {
            this.stats.sickDurationMs += dt * 1000;
            if (this.stats.sickDurationMs >= BALANCE.LIFESPAN.MAX_SICK_DURATION_MS) {
                this.die('병을 이기지 못하고 멀리 떠났습니다.');
                return;
            }
        } else {
            this.stats.sickDurationMs = 0; // reset
        }

        // Animation & Movement Update
        if (this.activeAnimation && now > this.activeAnimation.until) {
            this.activeAnimation = null;
        }

        if (!this.activeAnimation && this.currentState === 'Idle') {
            if (now > this.wanderWaitUntil) {
                if (Math.abs(this.wanderTargetX - this.wanderX) < 5) {
                    // Pick new target
                    this.wanderTargetX = (Math.random() - 0.5) * 160; // wider stroll range
                    this.wanderWaitUntil = now + 2000 + Math.random() * 5000; // Wait 2~7 sec after reaching
                } else {
                    // Move towards target
                    const speed = 20 * dt; // pixels per second
                    if (this.wanderTargetX > this.wanderX) {
                        this.wanderX = Math.min(this.wanderX + speed, this.wanderTargetX);
                    } else {
                        this.wanderX = Math.max(this.wanderX - speed, this.wanderTargetX);
                    }
                }
            }
        } else if (this.currentState === 'Sleep') {
            this.wanderX = 0;
            this.wanderTargetX = 0;
        }

        // Weather Event Logic
        if (this.activeEvent !== 'None' && now > this.eventEndTime) {
            this.activeEvent = 'None';
        } else if (this.activeEvent === 'None') {
            const roll = Math.random();
            if (roll < dt * BALANCE.WEATHER_PROB.METEOR_SHOWER) {
                this.activeEvent = 'MeteorShower';
                this.eventEndTime = now + Math.random() * BALANCE.WEATHER_DURATION_MS.METEOR_SHOWER;
            } else if (roll < dt * BALANCE.WEATHER_PROB.DROUGHT) {
                this.activeEvent = 'Drought';
                this.eventEndTime = now + Math.random() * BALANCE.WEATHER_DURATION_MS.DROUGHT;
            } else if (roll < dt * BALANCE.WEATHER_PROB.VOLCANIC_ASH) {
                this.activeEvent = 'VolcanicAsh';
                this.eventEndTime = now + Math.random() * BALANCE.WEATHER_DURATION_MS.VOLCANIC_ASH;
            }
        }

        if (!this.isSleeping) {
            const droughtMultiplier = this.activeEvent === 'Drought' ? BALANCE.WEATHER.DROUGHT_CLEAN_MULT : 1.0;
            const ashMultiplier = this.activeEvent === 'VolcanicAsh' ? BALANCE.WEATHER.ASH_CLEAN_MULT : 1.0;

            const pInfo = this.stats.personality;
            const gluttonDecay = pInfo === 'Gluttonous' ? 1.2 : 1.0;
            const cleanDecay = pInfo === 'Clean' ? 1.2 : 1.0;
            const activeDecay = pInfo === 'Active' ? 1.2 : 1.0;
            const lazyDecay = pInfo === 'Lazy' ? 0.8 : 1.0;
            const gentleDecay = pInfo === 'Gentle' ? 0.8 : 1.0;
            const lonelyDecay = pInfo === 'Lonely' ? 1.2 : 1.0;

            // Age & PM Stats modifiers
            const ageYears = this.getDisplayAgeYears();
            let ageMultiplier = 1.0;
            if (ageYears >= 8) ageMultiplier = 1.2; // Gets tired/hungry faster when old
            if (ageYears <= 1) ageMultiplier = 1.1; // Babies need more care

            const healthDecayMod = Math.max(0.5, 1.0 - (this.stats.pmStats.health / 200)); // Up to 50% slower decay with 100 health
            const athleticsDecayMod = Math.max(0.7, 1.0 - (this.stats.pmStats.athletics / 300)); // Up to 33% slower energy decay
            const scaleDecayMod = this.stats.scaleScutes ? 0.8 : 1.0; // scaleScutes: -20% cleanliness decay

            const cleanDelta = dt * BALANCE.DECAY_RATES.CLEANLINESS * decayMultiplier * droughtMultiplier * ashMultiplier * cleanDecay * ageMultiplier * scaleDecayMod;

            this.applyStatChange('fullness', -dt * BALANCE.DECAY_RATES.FULLNESS * decayMultiplier * gluttonDecay * ageMultiplier, minClamp);
            this.applyStatChange('cleanliness', -cleanDelta, minClamp);

            if (cleanDelta > 0) {
                const parts = ['head', 'neck', 'body', 'legs', 'tail'] as const;
                const targetPart = parts[Math.floor(Math.random() * parts.length)];
                let weight = 1.0;
                if (this.activeEvent === 'VolcanicAsh' && (targetPart === 'head' || targetPart === 'neck')) weight = 2.0;
                if (this.activeEvent === 'Drought' && (targetPart === 'legs' || targetPart === 'body')) weight = 2.0;
                const thickSkinMod = this.stats.thickSkin ? 0.7 : 1.0; // thickSkin: -30% weather dirt gain

                // Spot dirt fills up roughly 1:1 with cleanliness dropping, distributed randomly
                this.stats.spotDirt[targetPart] = Math.min(100, this.stats.spotDirt[targetPart] + (cleanDelta * weight * thickSkinMod));
            }
            this.applyStatChange('energy', -dt * BALANCE.DECAY_RATES.ENERGY * decayMultiplier * activeDecay * lazyDecay * ageMultiplier * athleticsDecayMod, minClamp);

            const sickMultiplier = this.currentState === 'Sick' ? BALANCE.WEATHER.SICK_HAPPY_MULT : 1.0;
            this.applyStatChange('happiness', -dt * BALANCE.DECAY_RATES.HAPPINESS * decayMultiplier * sickMultiplier * gentleDecay * lonelyDecay * ageMultiplier, minClamp);

            // Sickness chance check
            if (this.currentState !== 'Sick') {
                const hasVitamin = this.stats.buffs.vitaminUntil && Date.now() < this.stats.buffs.vitaminUntil;

                if (this.stats.fullness === 0) {
                    this.zeroStatTimers.fullness += dt;
                    if (this.zeroStatTimers.fullness > 60 * 60) { // 1 hour of zero fullness is a care miss condition
                        if (!hasVitamin && Math.random() < 0.2 * healthDecayMod) {
                            this.currentState = 'Sick';
                            this.careMisses++;
                            HOOKS.onActionPerformed('care_miss', { reason: 'starved' });
                        }
                        this.zeroStatTimers.fullness = 0;
                    }
                } else {
                    this.zeroStatTimers.fullness = 0;
                }

                if (this.stats.cleanliness === 0) {
                    this.zeroStatTimers.cleanliness += dt;
                    if (this.zeroStatTimers.cleanliness > 60 * 60) { // 1 hour of 0 cleanliness -> Sick
                        if (!hasVitamin && Math.random() < 0.5 * healthDecayMod) {
                            this.currentState = 'Sick';
                            this.careMisses++;
                            HOOKS.onActionPerformed('care_miss', { reason: 'dirty' });
                        }
                        this.zeroStatTimers.cleanliness = 0;
                    }
                } else if (this.activeEvent === 'VolcanicAsh' && this.stats.cleanliness < 50) {
                    if (!hasVitamin && Math.random() < 0.00005 * healthDecayMod) {
                        this.currentState = 'Sick';
                        this.careMisses++;
                    }
                } else {
                    this.zeroStatTimers.cleanliness = 0;
                }
            }
        } else {
            let recoveryRate = 10.0;
            if (this.sleepType === 'floor') recoveryRate = 10.0;
            else if (this.sleepType === 'bed') recoveryRate = 15.0;
            else if (this.sleepType === 'outside') recoveryRate = 5.0;

            if (this.stats.personality === 'Lazy') recoveryRate *= 1.2;
            if (this.stats.fastMetabolism) recoveryRate *= 1.2; // fastMetabolism passive

            this.stats.energy = Math.min(100, this.stats.energy + dt * recoveryRate);
        }

        this.evaluateState();
    }

    public checkSpecialModes() {
        const hour = new Date().getHours();
        const isSchoolMode = hour >= 8 && hour < 14;
        return { isSchoolMode };
    }

    public checkEvolution() {
        const oldTier = this.stats.evolutionTier;
        this.stats.evolutionTier = getEvolutionTierFromActiveSeconds(this.stats.ageTicks);
        this.stats.hasAirSacs = this.stats.evolutionTier >= 2;

        if (this.stats.evolutionTier > oldTier) {
            this.isEvolutionTriggered = true;
        }
    }

    public evaluateState() {
        if (this.currentState === 'Quiz') return; // Don't override quiz state until complete

        if (this.stats.pastureEndTime && this.stats.pastureEndTime > Date.now()) {
            return; // Don't override state if away, though we could have a specific state
        }

        if (this.isSleeping) {
            this.currentState = 'Sleep';
            return;
        }

        if (this.stats.happiness <= 10) {
            this.currentState = 'Naughty';
        } else if (this.currentState === 'Sick') {
            // Keep sick state
        } else if (this.stats.fullness < 20) {
            this.currentState = 'Hungry';
        } else if (this.stats.cleanliness < 20) {
            this.currentState = 'Dirty';
        } else if (this.stats.energy < 20) {
            this.currentState = 'Sleepy';
        } else {
            this.currentState = 'Idle';
        }
    }

    // Handlers for Shop / Quiz remaining
    public playQuiz() { this.currentState = 'Quiz'; }
    public quizCombo: number = 0;

    public completeQuiz(isCorrect: boolean): { earnedAmber: number, earnedMedicine: boolean } {
        let earnedAmber = 0;
        let earnedMedicine = false;

        if (isCorrect) {
            this.quizCombo++;
            earnedAmber = this.activeEvent === 'MeteorShower' ? 3 : 1;
            if (this.stats.personality === 'Smart') earnedAmber += 1;
            this.stats.amber += earnedAmber;
            this.stats.xp += 10;
            this.applyStatChange('happiness', 15, 0);

            if (this.quizCombo >= 3) {
                this.stats.medicine += 1;
                earnedMedicine = true;
                this.quizCombo = 0;
            }
        } else {
            this.quizCombo = 0;
            this.stats.xp += 2;
        }

        this.applyStatChange('energy', -5, 0);
        this.currentState = 'Idle';
        this.evaluateState();

        return { earnedAmber, earnedMedicine };
    }

    public rewardAmber(amount: number) { this.stats.amber += amount; }
    public rewardGold(amount: number) { this.stats.gold += amount; }

    public performSpecificAction(actionId: string): { success: boolean, msg: string, react?: string } {
        let res: { success: boolean, msg: string, react?: string } = { success: false, msg: '알 수 없는 상호작용이야!' };

        if (this.stats.pastureEndTime && this.stats.pastureEndTime > Date.now()) {
            return { success: false, msg: '브라키오가 아직 들판에서 돌아오지 않았어!' };
        }

        if (this.isSleeping && !actionId.startsWith('sleep_')) {
            return { success: false, msg: '브라키오가 자고 있어요. 깨우려면 먼저 탭하세요!' };
        }

        switch (actionId) {
            // --- FEED ---
            case 'feed_fern':
                if (this.stats.fullness >= 100) { res = { success: false, msg: '배가 가득 찼어!' }; break; }
                const fernFull = this.stats.hasGastroliths ? 30 : 20;
                this.applyStatChange('fullness', this.stats.personality === 'Gluttonous' ? fernFull + 10 : fernFull);
                this.applyStatChange('weight', this.stats.personality === 'Gluttonous' ? 2 : 1);
                res = { success: true, msg: '앙상하지만 맛있는 양치기 냠냠!', react: '😋' };
                break;
            case 'feed_conifer':
                const energyCost = this.stats.hasAirSacs ? 8 : 15;
                if (this.stats.energy < energyCost) { res = { success: false, msg: '목을 길게 뻗을 에너지가 부족해!' }; break; }
                if (this.stats.fullness >= 100) { res = { success: false, msg: '배가 너무 불러서 침엽수를 넘길 수 없어!' }; break; }
                this.applyStatChange('energy', -energyCost);
                this.applyStatChange('fullness', this.stats.hasGastroliths ? 60 : 40);
                this.applyStatChange('weight', this.stats.fullness > 80 ? 5 : 2);
                this.stats.actionCounts.feedConifer++;
                if (this.stats.actionCounts.feedConifer >= 45) this.stats.longNeck = true;
                res = { success: true, msg: '든든한 침엽수 식사! (긴 목 특성 수집 중)', react: '🦕' };
                break;
            case 'feed_vitamin':
                this.stats.buffs.vitaminUntil = Date.now() + BALANCE.BUFF_DURATION_MS.VITAMIN;
                this.applyStatChange('happiness', 10);
                this.stats.actionCounts.vitamin++;
                if (this.stats.actionCounts.vitamin >= 25) this.stats.sharpSense = true;
                res = { success: true, msg: '비타민 꿀꺽! 당분간 병에 잘 안 걸려. (예리한 감각 수집 중)', react: '✨' };
                break;
            case 'feed_medicine':
                if (this.stats.medicine > 0 && this.currentState === 'Sick') {
                    this.stats.medicine -= 1;
                    this.applyStatChange('happiness', 20);
                    this.applyStatChange('energy', 20);
                    this.stats.cleanliness = 100;
                    this.currentState = 'Idle';
                    res = { success: true, msg: '약 먹고 완전히 기운 차렸어! 💊', react: '💪' };
                } else if (this.stats.medicine <= 0) {
                    res = { success: false, msg: '약이 없어! 상점에서 아르바이트(퀴즈)로 모아봐!' };
                } else {
                    res = { success: false, msg: '지금은 아프지 않아!' };
                }
                break;
            case 'feed_special':
                this.applyStatChange('fullness', 15);
                this.applyStatChange('happiness', 40);
                this.applyStatChange('weight', 2);
                res = { success: true, msg: '특별 간식! 기분이 날아갈 것 같아!', react: '🥰' };
                break;

            // --- TRAIN ---
            case 'train_ball':
                if (this.stats.energy < 10) { res = { success: false, msg: '에너지가 부족해!' }; break; }
                this.applyStatChange('energy', -10);
                this.applyStatChange('weight', -3);
                this.applyStatChange('happiness', (this.stats.personality === 'Active' ? 20 : 15) + (this.stats.strongTail ? 5 : 0));
                this.stats.pmStats.athletics = Math.min(100, this.stats.pmStats.athletics + 2);
                this.stats.pmStats.health = Math.min(100, this.stats.pmStats.health + 1);
                // Spot dirt: legs + body get muddy from kicking
                {
                    const dirtGain = this.stats.thickSkin ? 8 : 12;
                    this.stats.spotDirt.legs = Math.min(100, this.stats.spotDirt.legs + dirtGain * 1.5);
                    this.stats.spotDirt.body = Math.min(100, this.stats.spotDirt.body + dirtGain);
                }
                this.stats.actionCounts.train++;
                if (this.stats.actionCounts.train >= 40) this.stats.strongTail = true;
                res = { success: true, msg: '신나게 공을 찼어요! (운동+2, 건강+2, 발 더러워짐)', react: '⚽' };
                break;
            case 'train_frisbee':
                if (this.stats.energy < 15) { res = { success: false, msg: '에너지 부족!' }; break; }
                this.applyStatChange('energy', -15);
                this.applyStatChange('weight', -5);
                this.applyStatChange('happiness', 25 + (this.stats.strongTail ? 5 : 0));
                this.stats.pmStats.athletics = Math.min(100, this.stats.pmStats.athletics + 2);
                this.stats.pmStats.charm = Math.min(100, this.stats.pmStats.charm + 1);
                // Spot dirt: jumping around gets legs and body dirty
                {
                    const dirtGain = this.stats.thickSkin ? 8 : 14;
                    this.stats.spotDirt.legs = Math.min(100, this.stats.spotDirt.legs + dirtGain);
                    this.stats.spotDirt.body = Math.min(100, this.stats.spotDirt.body + dirtGain * 0.8);
                }
                this.stats.actionCounts.train++;
                if (this.stats.actionCounts.train >= 40) this.stats.strongTail = true;
                res = { success: true, msg: '프리스비 캐치 성공! (운동+2, 친화+1, 몸이 더러워짐)', react: '🥏' };
                break;
            case 'train_discipline':
                this.stats.wisdom += this.stats.personality === 'Naughty' ? 3 : 2;
                this.applyStatChange('energy', -5);
                this.applyStatChange('happiness', -5);
                this.stats.pmStats.discipline = Math.min(100, this.stats.pmStats.discipline + 3);
                this.stats.pmStats.intellect = Math.min(100, this.stats.pmStats.intellect + 1);
                res = { success: true, msg: '기다려! 인내심 훈련 성공! (절제+3, 지능+1)', react: '🦴' };
                break;
            case 'train_walk':
                if (this.stats.energy < 20) { res = { success: false, msg: '산책 갈 힘이 없어!' }; break; }
                this.applyStatChange('energy', -20);
                this.applyStatChange('weight', -2);
                this.applyStatChange('happiness', 20);
                this.stats.pmStats.health = Math.min(100, this.stats.pmStats.health + 2);
                this.stats.pmStats.athletics = Math.min(100, this.stats.pmStats.athletics + 1);
                // Spot dirt: walking on dirt path → legs+tail
                {
                    const dirtGain = this.stats.thickSkin ? 6 : 10;
                    this.stats.spotDirt.legs = Math.min(100, this.stats.spotDirt.legs + dirtGain);
                    this.stats.spotDirt.tail = Math.min(100, this.stats.spotDirt.tail + dirtGain * 0.5);
                }
                this.stats.actionCounts.train++;
                if (this.stats.actionCounts.train >= 40) this.stats.strongTail = true;
                res = { success: true, msg: '동네 한 바퀴 산책 완료! (건강+2, 운동+1, 발이 살짝 더러워짐)', react: '🐾' };
                break;
            case 'train_sing':
                if (this.stats.energy < 5) { res = { success: false, msg: '입을 벌릴 힘이 없어!' }; break; }
                this.applyStatChange('energy', -5);
                this.applyStatChange('happiness', 15);
                this.stats.pmStats.elegance = Math.min(100, this.stats.pmStats.elegance + 2);
                this.stats.pmStats.charm = Math.min(100, this.stats.pmStats.charm + 1);
                res = { success: true, msg: '브라키오와 노래를 불렀어! (품위+2, 친화+1)', react: '🎵' };
                break;
            case 'train_dance':
                if (this.stats.energy < 10) { res = { success: false, msg: '다리가 후들거려!' }; break; }
                this.applyStatChange('energy', -10);
                this.applyStatChange('happiness', 25 + (this.stats.strongTail ? 5 : 0));
                this.stats.pmStats.elegance = Math.min(100, this.stats.pmStats.elegance + 2);
                this.stats.pmStats.athletics = Math.min(100, this.stats.pmStats.athletics + 1);
                // Spot dirt: energetic dancing → body + legs light dust
                {
                    const dirtGain = this.stats.thickSkin ? 5 : 8;
                    this.stats.spotDirt.body = Math.min(100, this.stats.spotDirt.body + dirtGain);
                    this.stats.spotDirt.legs = Math.min(100, this.stats.spotDirt.legs + dirtGain * 0.5);
                }
                this.stats.actionCounts.train++;
                if (this.stats.actionCounts.train >= 40) this.stats.strongTail = true;
                res = { success: true, msg: '조금 쿵쾅거리지만 신나는 댄스! (품위+2, 운동+1, 몸에 먼지)', react: '💃' };
                break;

            // --- SLEEP ---
            case 'sleep_bed':
                this.isSleeping = !this.isSleeping;
                this.sleepType = this.isSleeping ? 'bed' : null;
                if (this.isSleeping) {
                    this.stats.actionCounts.sleepBed++;
                    if (this.stats.actionCounts.sleepBed >= 15) this.stats.fastMetabolism = true;
                }
                res = { success: true, msg: this.isSleeping ? '침대에서 꿀잠 자요!' : '침대에서 일어났어요!', react: '🛌' };
                break;
            case 'sleep_floor':
                this.isSleeping = !this.isSleeping;
                this.sleepType = this.isSleeping ? 'floor' : null;
                res = { success: true, msg: this.isSleeping ? '바닥에서 코 자요.' : '일어났어요!', react: '💤' };
                break;
            case 'sleep_outside':
                this.isSleeping = !this.isSleeping;
                this.sleepType = this.isSleeping ? 'outside' : null;
                if (!this.isSleeping) {
                    this.applyStatChange('happiness', 10); // Morning bonus for outside sleep
                }
                res = { success: true, msg: this.isSleeping ? '야외 캠핑 모드로 자요!' : '햇살을 받으며 상쾌하게 기상!', react: '🏕️' };
                break;

            // --- WASH ---
            case 'wash_face':
                this.stats.spotDirt.head = Math.max(0, this.stats.spotDirt.head - 50);
                this.applyStatChange('cleanliness', 15);
                this.applyStatChange('energy', -2);
                this.applyStatChange('happiness', 5);
                this.stats.actionCounts.wash++;
                if (this.stats.actionCounts.wash >= 30) this.stats.thickSkin = true;
                res = { success: true, msg: '세수 완료! 얼굴이 깨끗해졌어요.', react: '💧' };
                break;
            case 'wash_feet':
                this.stats.spotDirt.legs = Math.max(0, this.stats.spotDirt.legs - 80);
                this.applyStatChange('cleanliness', 20);
                this.applyStatChange('energy', -2);
                this.stats.actionCounts.wash++;
                if (this.stats.actionCounts.wash >= 30) this.stats.thickSkin = true;
                res = { success: true, msg: '발씻기 완료! 흙먼지가 떨어졌네요.', react: '🦶' };
                break;
            case 'wash_body':
                this.stats.spotDirt.body = Math.max(0, this.stats.spotDirt.body - 60);
                this.stats.spotDirt.neck = Math.max(0, this.stats.spotDirt.neck - 30);
                this.stats.spotDirt.tail = Math.max(0, this.stats.spotDirt.tail - 30);
                this.applyStatChange('cleanliness', 30);
                this.applyStatChange('energy', -5);
                this.stats.actionCounts.wash++;
                if (this.stats.actionCounts.wash >= 30) this.stats.thickSkin = true;
                res = { success: true, msg: '몸 씻기! 얼룩이 많이 지워졌습니다.', react: '🧽' };
                break;
            case 'wash_shower':
                // Find two dirtiest spots
                const spots: (keyof typeof this.stats.spotDirt)[] = ['head', 'neck', 'body', 'legs', 'tail'];
                spots.sort((a, b) => this.stats.spotDirt[b] - this.stats.spotDirt[a]);
                this.stats.spotDirt[spots[0]] = Math.max(0, this.stats.spotDirt[spots[0]] - 50);
                this.stats.spotDirt[spots[1]] = Math.max(0, this.stats.spotDirt[spots[1]] - 50);

                this.applyStatChange('cleanliness', 50);
                this.applyStatChange('happiness', this.stats.personality === 'Clean' ? 10 : 5);
                this.applyStatChange('energy', -8);
                this.stats.actionCounts.wash++;
                if (this.stats.actionCounts.wash >= 30) this.stats.thickSkin = true;
                res = { success: true, msg: '샤워기로 시원하게 씻었어요!', react: '🚿' };
                break;
            case 'wash_bath':
                this.stats.spotDirt = { head: 0, neck: 0, body: 0, legs: 0, tail: 0 };
                this.stats.cleanliness = 100;
                this.applyStatChange('happiness', 20);
                this.applyStatChange('energy', -15);
                this.stats.pmStats.elegance = Math.min(100, this.stats.pmStats.elegance + 1);
                this.stats.actionCounts.bath++;
                if (this.stats.actionCounts.bath >= 15) this.stats.scaleScutes = true;
                res = { success: true, msg: '따뜻한 목욕! 온몸이 반짝반짝! (품위+1)', react: '🛁' };
                break;
            case 'wash_mud':
                // mudLover trait: happiness bonus but no dirt penalty!
                if (this.stats.mudLover) {
                    this.applyStatChange('happiness', 40);
                    res = { success: true, msg: '진흙 목욕! 진흙 애호가라 전혀 더러워지지 않아요! 🐊', react: '💩' };
                } else {
                    this.stats.spotDirt.body = Math.min(100, this.stats.spotDirt.body + 40);
                    this.stats.spotDirt.legs = Math.min(100, this.stats.spotDirt.legs + 60);
                    this.applyStatChange('cleanliness', -30);
                    this.applyStatChange('happiness', 30);
                    this.stats.actionCounts.washMud++;
                    if (this.stats.actionCounts.washMud >= 12) this.stats.mudLover = true;
                    res = { success: true, msg: '진흙 목욕! 꼬질꼬질해졌지만 행복해요!', react: '💩' };
                }
                break;

            // --- INTERACT ---
            case 'interact_praise':
                if (this.stats.happiness > 50) {
                    this.stats.wisdom += 1;
                    this.applyStatChange('happiness', this.stats.personality === 'Lonely' ? 15 : 10);
                }
                res = { success: true, msg: '머리를 쓰다듬어 주니 좋아해!', react: '😍' };
                break;
            case 'interact_scold':
                this.applyStatChange('happiness', -15);
                if (this.currentState === 'Naughty' && Math.random() < 0.6) {
                    this.applyStatChange('happiness', 20);
                }
                res = { success: true, msg: '단호하게 안된다고 혼냈어요.', react: '💢' };
                break;
            case 'interact_hospital':
                if (this.stats.gold >= BALANCE.ACTIONS.HOSPITAL_COST) {
                    this.stats.gold -= BALANCE.ACTIONS.HOSPITAL_COST;
                    if (this.currentState === 'Sick') {
                        this.stats.cleanliness = 100;
                        this.stats.happiness = 100;
                        this.currentState = 'Idle';
                    } else {
                        this.applyStatChange('happiness', 10); // Checkup
                    }
                    res = { success: true, msg: '병원에서 꼼꼼히 진료를 받았어!', react: '🏥' };
                } else {
                    res = { success: false, msg: `골드가 부족해! (${BALANCE.ACTIONS.HOSPITAL_COST}g 필요)` };
                }
                break;
            case 'interact_pasture':
                this.stats.pastureEndTime = Date.now() + 5 * 60 * 1000; // 5 minutes real-time
                // Spot dirt: roaming the fields → all parts get dusty
                {
                    const dirtGain = this.stats.thickSkin ? 10 : 16;
                    this.stats.spotDirt.head = Math.min(100, this.stats.spotDirt.head + dirtGain * 0.5);
                    this.stats.spotDirt.neck = Math.min(100, this.stats.spotDirt.neck + dirtGain * 0.5);
                    this.stats.spotDirt.body = Math.min(100, this.stats.spotDirt.body + dirtGain);
                    this.stats.spotDirt.legs = Math.min(100, this.stats.spotDirt.legs + dirtGain * 1.5);
                    this.stats.spotDirt.tail = Math.min(100, this.stats.spotDirt.tail + dirtGain * 0.8);
                }
                res = { success: true, msg: '들판으로 산책을 나갔어! 5분 뒤에 돌아올 거야. (오고 나서 씻겨줘!)', react: '🌿' };
                break;
        }

        if (res.success) {
            HOOKS.onActionPerformed(actionId, { timestamp: Date.now() });

            // Trigger animation
            const startedAt = Date.now();
            const animDuration = this.getAnimationDuration(actionId);

            this.activeAnimation = {
                id: actionId,
                startedAt,
                until: startedAt + animDuration,
                durationMs: animDuration,
            };

            this.evaluateState();
        }
        return res;
    }
}
