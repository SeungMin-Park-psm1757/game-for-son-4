export const BALANCE = {
    // Time Constants
    MS_PER_DAY: 24 * 60 * 60 * 1000,

    LIFESPAN: {
        BASE_DAYS: 15, // Base lifespan of 15 days
        CARE_MISS_PENALTY_DAYS: 0.5, // Each care miss reduces lifespan by 0.5 days
        MAX_SICK_DURATION_MS: 12 * 60 * 60 * 1000, // 12 real-world hours of sickness leads to death
    },

    // Stat decay rates per second (real-time balanced)
    // Goal: 2~4 cares a day to maintain. 100 to 0 takes ~16-20 hours.
    // Previous prototype rates were around 1.0~2.0 per second.
    // New rates: ~0.0015 per second (about 5.4 per hour).
    DECAY_RATES: {
        FULLNESS: 0.0015,
        CLEANLINESS: 0.0012,
        ENERGY: 0.0010,
        HAPPINESS: 0.0008,
    },
    // Multiplier during school mode (08:00 ~ 14:00)
    SCHOOL_MODE_MULTIPLIER: 0.1,
    // Minimum stat clamp for school mode (don't drop below 10 if started higher)
    SCHOOL_MODE_MIN_STAT: 10,

    // Weather Event Multipliers
    WEATHER: {
        DROUGHT_CLEAN_MULT: 2.0,
        ASH_CLEAN_MULT: 1.5,
        SICK_HAPPY_MULT: 3.0,
    },

    // Weather Event probabilities per second (very low)
    WEATHER_PROB: {
        METEOR_SHOWER: 0.00005, // Very rare
        DROUGHT: 0.0001,
        VOLCANIC_ASH: 0.00015
    },
    WEATHER_DURATION_MS: {
        METEOR_SHOWER: 15 * 60 * 1000,
        DROUGHT: 30 * 60 * 1000,
        VOLCANIC_ASH: 20 * 60 * 1000,
    },

    // Buff Durations
    BUFF_DURATION_MS: {
        VITAMIN: 2 * 60 * 60 * 1000, // 2 hours of reduced sick chance
        SPECIAL_SNACK: 1 * 60 * 60 * 1000 // 1 hour of happiness boost
    },

    // Action Cooldowns / Costs
    ACTIONS: {
        BATH_COOLDOWN_MS: 4 * 60 * 60 * 1000, // 4 hours
        HOSPITAL_COST: 50,
        PASTURE_DURATION_MS: 30 * 60 * 1000, // 30 mins
        PASTURE_REWARD: 100, // Gold
    }
};

export enum Season {
    SPRING = '🌸 봄',
    SUMMER = '☀️ 여름',
    AUTUMN = '🍂 가을',
    WINTER = '❄️ 겨울'
}

export function getCurrentSeason(): Season {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return Season.SPRING;
    if (m >= 6 && m <= 8) return Season.SUMMER;
    if (m >= 9 && m <= 11) return Season.AUTUMN;
    return Season.WINTER;
}
