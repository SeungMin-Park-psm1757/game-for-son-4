// src/events/hooks.ts
import { Personality, calculatePersonality } from './personality';

export interface EventInputs {
    actionId: string;
    context?: any;
}

export interface StatChangeContext {
    stat: string;
    delta: number;
    reason: string;
    newValue: number;
}

export class EventTracker {
    public actionLog: string[] = [];
    public statDeltaLog: StatChangeContext[] = [];

    public actionListeners: ((actionId: string, context: any) => void)[] = [];
    public statListeners: ((ctx: StatChangeContext) => void)[] = [];

    public subscribeAction(cb: (actionId: string, context: any) => void) {
        this.actionListeners.push(cb);
    }

    public subscribeStat(cb: (ctx: StatChangeContext) => void) {
        this.statListeners.push(cb);
    }

    // Hook: Triggered when any valid action is performed
    public onActionPerformed(actionId: string, context?: any) {
        const logEntry = `[Action] ${actionId} at ${new Date().toISOString()} | Context: ${JSON.stringify(context || {})}`;
        this.actionLog.push(logEntry);
        if (this.actionLog.length > 50) this.actionLog.shift();

        this.actionListeners.forEach(cb => cb(actionId, context));
    }

    // Hook: Triggered when any stat changes by a significant amount or via action
    public onStatChanged(ctx: StatChangeContext) {
        if (Math.abs(ctx.delta) < 0.1) return; // Ignore micro-decays
        this.statDeltaLog.push(ctx);
        if (this.statDeltaLog.length > 50) this.statDeltaLog.shift();

        this.statListeners.forEach(cb => cb(ctx));
    }

    // Hook: Nightly wrap-up or offline day tracking
    public onDayBoundaryReached(): Personality {
        const newPersonality = calculatePersonality(this.actionLog, this.statDeltaLog);

        // Clear logs after calculation
        this.actionLog = [];
        this.statDeltaLog = [];

        return newPersonality;
    }

    // Hook: Input for Personality Seed calculation
    public getPersonalitySeedInputs() {
        return {
            recentActions: [...this.actionLog],
            recentStatChanges: [...this.statDeltaLog]
        };
    }
}

// Global Singleton for hooks
export const HOOKS = new EventTracker();
