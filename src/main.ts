import './style.css';
import { FSM } from './fsm';
import { CanvasRenderer } from './canvas';
import { UIManager } from './ui';
import { GameLoop } from './gameLoop';
import { StorageManager } from './storage';
import { registerSW } from 'virtual:pwa-register';
import { AUDIO } from './audio';

// Setup PWA Service Worker
registerSW({
    onNeedRefresh() { },
    onOfflineReady() {
        console.log('App is ready to work offline');
    },
});

document.addEventListener('DOMContentLoaded', async () => {
    const savedState = await StorageManager.load();
    const fsm = new FSM(savedState?.stats, savedState?.lastTick);

    if (savedState) {
        fsm.careMisses = savedState.careMisses;
        if (savedState.isObese && fsm.stats.weight === 50) {
            fsm.stats.weight = 85; // Backwards compatibility migration
        }
    }

    if (window.location.search.includes('cheatpsm1757')) {
        fsm.stats.gold += 10000;
        fsm.stats.amber += 10000;
        fsm.stats.medicine += 10000;
        fsm.stats.inventory['feed_fern'] = (fsm.stats.inventory['feed_fern'] || 0) + 10000;
        fsm.stats.inventory['feed_vitamin'] = (fsm.stats.inventory['feed_vitamin'] || 0) + 10000;
        fsm.stats.inventory['feed_medicine'] = (fsm.stats.inventory['feed_medicine'] || 0) + 10000;
        setTimeout(() => alert('치트 활성화: 1만 골드, 보석, 알약, 기본먹이 지급 완료!'), 500);
    }

    const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;
    const renderer = new CanvasRenderer(canvas, fsm);

    const ui = new UIManager(fsm);
    const loop = new GameLoop(fsm, renderer, ui);

    loop.start();

    const debugOverlay = new URLSearchParams(window.location.search).get('debugOverlay');
    const debugSubmenuTitleMap: Record<string, string> = {
        feed: '먹이 주기',
        train: '훈련하기',
        sleep: '재우기',
        wash: '씻기',
        interact: '교감하기',
    };
    if (debugOverlay) {
        window.setTimeout(() => {
            if (debugOverlay === 'shop') {
                document.getElementById('btn-main-shop')?.click();
                return;
            }

            const debugTitle = debugSubmenuTitleMap[debugOverlay];
            if (!debugTitle) return;

            const debugUI = ui as unknown as {
                switchOverlay: (target: 'SUBMENU', openAction?: () => void) => void;
                openSubmenu: (title: string, categoryId: string) => void;
            };
            debugUI.switchOverlay('SUBMENU', () => debugUI.openSubmenu(debugTitle, debugOverlay));
        }, 220);
    }

    // Save state periodically and on visibility hidden (better for mobile)
    setInterval(() => {
        StorageManager.save(fsm.stats, fsm.lastTick, fsm.careMisses);
    }, 10000); // Save every 10 seconds

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            StorageManager.save(fsm.stats, fsm.lastTick, fsm.careMisses);
        }
    });

    // Init audio on first interaction
    document.body.addEventListener('click', () => {
        AUDIO.init();
    }, { once: true });
});
