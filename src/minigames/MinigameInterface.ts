// ============================================================
// MinigameInterface.ts — 공통 Minigame 인터페이스
// ============================================================

export type MinigameId = 'fruit_pick' | 'sort_baskets' | 'memory_pairs_8' | 'trace_path';

export interface MinigameResult {
    score: number;
    goldEarned: number;
    amberEarned: number;
    details?: Record<string, unknown>;
}

export interface Minigame {
    id: MinigameId;
    title: string;

    /** 게임 초기화. seed는 재현 가능 셔플 등에 사용 */
    start(seed: number): void;

    /** 포인터 이벤트 (터치/마우스 통합) */
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;

    /** dt: delta milliseconds */
    update(dtMs: number): void;

    /** ctx: canvas context, w/h: canvas logical size */
    render(ctx: CanvasRenderingContext2D, w: number, h: number): void;

    /** 게임이 끝났는지 (시간 종료 또는 클리어) */
    isDone(): boolean;

    /** 최종 결과 반환 */
    getResult(): MinigameResult;

    /** 상단 타이머 표시용 문자열 */
    getTimerText?(): string;
}
