export const MG_BALANCE = {
    DAILY_PLAY_LIMIT: 10,
    QUIT_CONFIRM: true,

    FRUIT: {
        ROUNDS_PER_SESSION: 6,
        SPEED_MULTIPLIER: 1.1,
        RESTART_DELAY_MS: 900,
        SUMMARY_DELAY_MS: 850,
        AMBER_PERFECT_THRESHOLD: 3,
        AMBER_REWARD: 1,
        BOND_REWARD: 2,
    },

    SORT: {
        DURATION_S: 20,
        MAX_MISTAKES: 999,
        COMBO_BONUS_EVERY: 5,
        COMBO_BONUS_GOLD: 2,
        GOLD_PER_POINT: 2,
        AMBER_DIVISOR: 12,
        CATCH_WIDTH_PX: 96,
        CATCHER_SPEED_PX_PER_S: 460,
        SPAWN_INTERVAL_MIN_MS: 620,
        SPAWN_INTERVAL_MAX_MS: 980,
        FALL_SPEED_MIN_PX_PER_S: 150,
        FALL_SPEED_MAX_PX_PER_S: 220,
    },

    MEMORY: {
        DURATION_S: 30,
        FLIP_BACK_DELAY_MS: 700,
        HINT_DURATION_MS: 1000,
        HINT_DISABLE_SECS: 5,
        GOLD_PER_MATCH: 6,
        AMBER_FULL: 2,
        AMBER_GOOD: 1,
        AMBER_GOOD_THRESHOLD: 6,
        CARD_SYMBOLS: ['🍎', '🌿', '🥚', '🦕', '💎', '🌙', '☀️', '🧺'],
    },

    TRACE: {
        DURATION_S: 15,
        ALLOW_R: 26,
        DEVIATE_TIMEOUT_S: 0.85,
        GOLD_PER_SUCCESS: 8,
        AMBER_DIVISOR: 3,
        START_RADIUS: 18,
        END_RADIUS: 20,
        PATH_LINE_WIDTH: 50,
    },
} as const;
