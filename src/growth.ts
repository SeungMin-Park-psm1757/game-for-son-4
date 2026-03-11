export const ACTIVE_SECONDS_PER_HOUR = 60 * 60;
export const EARLY_GROWTH_HOURS = [6, 12] as const;
export const DAILY_GROWTH_HOURS = 24;

export interface GrowthMilestone {
    ageYears: number;
    activeSecondsRequired: number;
    secondsUntil: number;
}

export function getAgeYearsFromActiveSeconds(activeSeconds: number): number {
    if (activeSeconds <= 0) return 0;

    const firstMilestone = EARLY_GROWTH_HOURS[0] * ACTIVE_SECONDS_PER_HOUR;
    const secondMilestone = EARLY_GROWTH_HOURS[1] * ACTIVE_SECONDS_PER_HOUR;

    if (activeSeconds < firstMilestone) {
        return activeSeconds / firstMilestone;
    }

    if (activeSeconds < secondMilestone) {
        return 1 + (activeSeconds - firstMilestone) / (secondMilestone - firstMilestone);
    }

    return 2 + (activeSeconds - secondMilestone) / (DAILY_GROWTH_HOURS * ACTIVE_SECONDS_PER_HOUR);
}

export function getDisplayAgeYears(activeSeconds: number): number {
    return Math.max(0, Math.floor(getAgeYearsFromActiveSeconds(activeSeconds)));
}

export function getEvolutionTierFromActiveSeconds(activeSeconds: number): number {
    const ageYears = getAgeYearsFromActiveSeconds(activeSeconds);
    if (ageYears >= 3) return 3;
    if (ageYears >= 2) return 2;
    if (ageYears >= 1) return 1;
    return 0;
}

export function getNextGrowthMilestone(activeSeconds: number): GrowthMilestone {
    const currentAge = getDisplayAgeYears(activeSeconds);
    const nextAge = currentAge + 1;
    const activeSecondsRequired = getActiveSecondsForAge(nextAge);

    return {
        ageYears: nextAge,
        activeSecondsRequired,
        secondsUntil: Math.max(0, activeSecondsRequired - activeSeconds),
    };
}

export function getActiveSecondsForAge(ageYears: number): number {
    if (ageYears <= 0) return 0;
    if (ageYears === 1) return EARLY_GROWTH_HOURS[0] * ACTIVE_SECONDS_PER_HOUR;
    if (ageYears === 2) return EARLY_GROWTH_HOURS[1] * ACTIVE_SECONDS_PER_HOUR;

    return (
        EARLY_GROWTH_HOURS[1] * ACTIVE_SECONDS_PER_HOUR
        + (ageYears - 2) * DAILY_GROWTH_HOURS * ACTIVE_SECONDS_PER_HOUR
    );
}
