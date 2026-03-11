export const BALANCE = {
    MS_PER_DAY: 24 * 60 * 60 * 1000,

    LIFESPAN: {
        BASE_DAYS: 15,
        CARE_MISS_PENALTY_DAYS: 0.5,
        MAX_SICK_DURATION_MS: 12 * 60 * 60 * 1000,
    },

    DECAY_RATES: {
        FULLNESS: 0.0015,
        CLEANLINESS: 0.0012,
        ENERGY: 0.0010,
        HAPPINESS: 0.0008,
    },

    SCHOOL_MODE_MULTIPLIER: 0.1,
    SCHOOL_MODE_MIN_STAT: 10,

    WEATHER: {
        DROUGHT_CLEAN_MULT: 2.0,
        ASH_CLEAN_MULT: 1.5,
        SICK_HAPPY_MULT: 3.0,
    },

    WEATHER_PROB: {
        METEOR_SHOWER: 0.00005,
        DROUGHT: 0.0001,
        VOLCANIC_ASH: 0.00015,
    },

    WEATHER_DURATION_MS: {
        METEOR_SHOWER: 15 * 60 * 1000,
        DROUGHT: 30 * 60 * 1000,
        VOLCANIC_ASH: 20 * 60 * 1000,
    },

    BUFF_DURATION_MS: {
        VITAMIN: 2 * 60 * 60 * 1000,
        SPECIAL_SNACK: 1 * 60 * 60 * 1000,
    },

    ACTIONS: {
        BATH_COOLDOWN_MS: 4 * 60 * 60 * 1000,
        HOSPITAL_COST: 50,
        PASTURE_DURATION_MS: 30 * 60 * 1000,
        PASTURE_REWARD: 100,
    },
};

export enum Season {
    SPRING = '봄',
    SUMMER = '여름',
    AUTUMN = '가을',
    WINTER = '겨울',
}

export function getCurrentSeason(): Season {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return Season.SPRING;
    if (month >= 6 && month <= 8) return Season.SUMMER;
    if (month >= 9 && month <= 11) return Season.AUTUMN;
    return Season.WINTER;
}
