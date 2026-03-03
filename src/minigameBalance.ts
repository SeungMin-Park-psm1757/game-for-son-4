// ============================================================
// minigameBalance.ts — 미니게임 밸런스/상수 테이블
// Magic number 없이 여기서 한 번에 튜닝 가능
// ============================================================

export const MG_BALANCE = {
    /** 일일 플레이 한도 (과일따기 포함 합산) */
    DAILY_PLAY_LIMIT: 10,

    /** 그만하기 확인 모달 사용 여부 */
    QUIT_CONFIRM: true,

    // ----------------------------------------------------------
    // 바구니 정리 (sort_baskets)
    // ----------------------------------------------------------
    SORT: {
        DURATION_S: 20,          // 라운드 시간(초)
        MAX_MISTAKES: 3,         // 허용 실수 횟수 (초과해도 종료 X, 계속 진행)
        COMBO_BONUS_EVERY: 5,    // N연속 정답마다 콤보 보너스
        COMBO_BONUS_GOLD: 2,     // 콤보 보너스 골드
        GOLD_PER_POINT: 2,       // 정답 1개당 골드
        AMBER_DIVISOR: 12,       // floor(score / N) = amber
        SWIPE_THRESHOLD_PX: 30,  // 스와이프 인식 최소 이동 거리(px)
        ITEM_CHANGE_DELAY_MS: 600, // 판정 후 다음 아이템까지 대기(ms)
    },

    // ----------------------------------------------------------
    // 카드 짝맞추기 (memory_pairs_8)
    // ----------------------------------------------------------
    MEMORY: {
        DURATION_S: 30,           // 라운드 시간(초) — 35초까지 조절 가능
        FLIP_BACK_DELAY_MS: 700,  // 불일치 카드 닫히는 지연(ms)
        HINT_DURATION_MS: 1000,   // 힌트 전체 오픈 유지 시간(ms)
        HINT_DISABLE_SECS: 5,     // 남은 시간 N초 이하 힌트 비활성
        GOLD_PER_MATCH: 6,        // 쌍 1개당 골드
        AMBER_FULL: 2,            // 8쌍 완성 시 amber
        AMBER_GOOD: 1,            // 6쌍 이상 시 amber
        AMBER_GOOD_THRESHOLD: 6,  // AMBER_GOOD 기준 쌍 수
        CARD_SYMBOLS: ['🍀', '🍃', '🪨', '⭐', '💎', '🌙', '☀️', '🧪'], // 8종
    },

    // ----------------------------------------------------------
    // 길 따라가기 (trace_path)
    // ----------------------------------------------------------
    TRACE: {
        DURATION_S: 15,           // 라운드 시간(초)
        ALLOW_R: 28,              // 경로 허용 반경(px) — 관대하게
        DEVIATE_TIMEOUT_S: 1.0,   // 이탈 누적 허용 시간(초)
        GOLD_PER_SUCCESS: 8,      // 성공 1회당 골드
        AMBER_DIVISOR: 3,         // floor(성공 횟수 / N) = amber
        START_RADIUS: 20,         // 시작점 인식 반경(px)
        END_RADIUS: 22,           // 끝점 도달 인식 반경(px)
        PATH_LINE_WIDTH: 52,      // 경로 선 두께(px)
    },
} as const;
