import { FSM } from './fsm';

import { ShopSystem } from './shop';
import { CategoryId, getActionsByCategory } from './actions/catalog';
import { PERSONALITIES } from './events/personality';
import { getPastureResult } from './events/pasture';
import { AUDIO } from './audio';
import { HOOKS } from './events/hooks';
import { DialogueManager } from './dialogue/DialogueManager';
import { DialogueContext, DialogueResult } from './dialogue/types';
import { MinigameRunner } from './minigames/MinigameRunner';
import { SortBaskets } from './minigames/SortBaskets';
import { MemoryPairs } from './minigames/MemoryPairs';
import { TracePath } from './minigames/TracePath';
import type { MinigameId } from './minigames/MinigameInterface';
import { MG_BALANCE } from './minigameBalance';
import { MathQuizEngine, MathQuestion, MATH_QUIZ_GOLD, MATH_QUIZ_AMBER_BONUS } from './MathQuiz';

export type UIOverlayState = 'NONE' | 'SUBMENU' | 'SHOP' | 'QUIZ' | 'ARBEIT' | 'ENCYCLOPEDIA' | 'MINIGAME' | 'CANVAS_MG' | 'INTRO' | 'DEATH';

export class UIManager {
    private barsElement: HTMLElement;
    private buttonsElement: HTMLElement;
    private stateTextElement: HTMLElement;
    private amberElement: HTMLElement;
    private goldElement: HTMLElement;
    private medicineElement: HTMLElement;

    private quizOverlay: HTMLElement;
    public shopSystem: ShopSystem;

    // Math quiz state
    private mathQuizEngine: MathQuizEngine | null = null;
    private mathCurrentQ: MathQuestion | null = null;
    private mathCombo: number = 0;          // 0~3
    private mathGoldEarned: number = 0;
    private mathHintShown: boolean = false;


    private shopOverlay: HTMLElement;
    private submenuOverlay: HTMLElement;
    private submenuOptions: HTMLElement;
    private submenuTitle: HTMLElement;

    private arbeitOverlay: HTMLElement;
    private minigameOverlay: HTMLElement;
    private mgCursor: HTMLElement;
    private mgResult: HTMLElement;
    private mgLoop: number | null = null;
    private mgPos: number = 0;
    private mgDir: number = 1;
    private mgSpeed: number = 1.0; // Halved base speed from 2.0
    private mgCombo: number = 0;

    // Canvas minigame runner
    private canvasMgOverlay: HTMLElement;
    private canvasMgRunner: MinigameRunner | null = null;
    private currentCanvasGame: MinigameId | null = null;

    private currentOverlay: UIOverlayState = 'NONE';
    private overlayTransitioning: boolean = false;

    private dialogueManager: DialogueManager;
    private speechBubble!: HTMLElement;
    private bubbleHideTimer: any = null;
    private lastFsmState: string = 'Idle';
    private lastUiTime: number;
    private lastStateTextUpdate: number = 0;

    constructor(private fsm: FSM) {
        this.barsElement = document.getElementById('status-bars')!;
        this.buttonsElement = document.getElementById('interaction-buttons')!;
        this.stateTextElement = document.getElementById('state-text')!;
        this.amberElement = document.getElementById('stat-amber')!;
        this.goldElement = document.getElementById('stat-gold')!;
        this.medicineElement = document.getElementById('stat-medicine')!;

        this.quizOverlay = document.getElementById('quiz-overlay')!;
        this.shopSystem = new ShopSystem(this.fsm);


        this.shopOverlay = document.getElementById('shop-overlay')!;
        this.submenuOverlay = document.getElementById('submenu-overlay')!;
        this.submenuOptions = document.getElementById('submenu-options')!;
        this.submenuTitle = document.getElementById('submenu-title')!;

        this.arbeitOverlay = document.getElementById('arbeit-overlay')!;
        this.minigameOverlay = document.getElementById('minigame-overlay')!;
        this.mgCursor = document.getElementById('minigame-cursor')!;
        this.mgResult = document.getElementById('minigame-result')!;
        this.canvasMgOverlay = document.getElementById('canvas-mg-overlay')!;

        this.initUI();
        this.initQuizEvents();
        this.initShopEvents();
        this.initArbeitEvents();
        this.initNotifications();
        this.initHUDButtons();
        this.initIntroEvents();

        const encOverlay = document.getElementById('encyclopedia-overlay');
        if (encOverlay) {
            document.getElementById('btn-close-encyclopedia')!.addEventListener('click', () => {
                this.switchOverlay('NONE');
            });
        }

        // Set season
        const seasonBadge = document.getElementById('season-badge');
        if (seasonBadge) seasonBadge.innerText = this.getSeasonName();

        // Global click sound for all buttons
        document.body.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button')) {
                AUDIO.playClick();
            }
            if (this.speechBubble && !target.closest('#speech-bubble') && !this.speechBubble.classList.contains('opacity-0')) {
                this.hideDialogue();
            }
        });

        if (this.fsm.isEgg) {
            this.switchOverlay('INTRO');
        }

        this.dialogueManager = new DialogueManager();
        this.lastUiTime = performance.now();
        this.initSpeechBubble();
        this.initDeathOverlay();

        HOOKS.subscribeAction((actionId) => {
            const dRes = this.dialogueManager.triggerActionReact(actionId, this.getDialogueContext());
            if (dRes) this.showDialogue(dRes);
        });
    }

    private initIntroEvents() {
        const egg = document.getElementById('intro-egg')!;
        const counter = document.getElementById('intro-counter')!;
        const title = document.querySelector('#intro-overlay h1')!;
        const introText = document.getElementById('intro-text')!;
        const namingContent = document.getElementById('naming-content')!;
        let clicks = 0;

        egg.addEventListener('click', () => {
            if (this.fsm.stats.introSeen) return;
            clicks++;
            AUDIO.playClick();

            // Visual feedback
            egg.classList.add('scale-110');
            setTimeout(() => egg.classList.remove('scale-110'), 100);

            const crack = document.getElementById('egg-crack')!;
            crack.style.opacity = (clicks / 3).toString();

            counter.innerText = `알을 터치해주세요! (${clicks}/3)`;

            if (clicks >= 3) {
                AUDIO.playSuccess();
                egg.classList.add('hidden');
                counter.classList.add('hidden');
                title.classList.add('hidden');
                introText.classList.add('hidden');

                // Show Naming UI
                namingContent.classList.remove('hidden');
            }
        });

        document.getElementById('btn-confirm-name')?.addEventListener('click', () => {
            const input = document.getElementById('pet-name-input') as HTMLInputElement;
            const name = input.value.trim();
            this.fsm.stats.name = name || '브라키오';

            this.fsm.hatchEgg();
            this.switchOverlay('NONE');
            this.showToast(`${this.fsm.stats.name} 환영해!`);
            this.update();
        });
    }

    private initHUDButtons() {
        const btnCur = document.getElementById('btn-currency');
        if (btnCur) {
            btnCur.addEventListener('click', () => {
                this.switchOverlay('SHOP', () => this.openShop());
            });
        }

        const btnEnc = document.getElementById('btn-encyclopedia');
        if (btnEnc) {
            btnEnc.addEventListener('click', () => {
                this.switchOverlay('ENCYCLOPEDIA', () => this.openEncyclopedia());
            });
        }

        const weatherBadge = document.getElementById('weather-badge');
        if (weatherBadge) {
            weatherBadge.addEventListener('click', () => {
                const title = document.getElementById('weather-title');
                if (title) {
                    title.classList.toggle('hidden');
                    if (!title.classList.contains('hidden')) {
                        setTimeout(() => title.classList.add('hidden'), 3000);
                    }
                }
            });
        }

        document.getElementById('btn-close-submenu')?.addEventListener('click', () => {
            this.switchOverlay('NONE');
        });
    }

    public async switchOverlay(target: UIOverlayState, openAction?: () => void) {
        if (this.currentOverlay === target && target !== 'SUBMENU') return;
        if (this.overlayTransitioning) return;

        this.overlayTransitioning = true;

        const overlayMap: Record<string, HTMLElement | null> = {
            'SHOP': this.shopOverlay,
            'QUIZ': this.quizOverlay,
            'ARBEIT': this.arbeitOverlay,
            'ENCYCLOPEDIA': document.getElementById('encyclopedia-overlay'),
            'MINIGAME': this.minigameOverlay,
            'CANVAS_MG': this.canvasMgOverlay,
            'INTRO': document.getElementById('intro-overlay'),
            'DEATH': document.getElementById('death-overlay')
        };

        // Close current
        if (this.currentOverlay !== 'NONE') {
            if (this.currentOverlay === 'SUBMENU') {
                document.getElementById('submenu-sheet')!.classList.add('translate-y-full');
                await new Promise(r => setTimeout(r, 200));
                this.submenuOverlay.classList.remove('flex');
                this.submenuOverlay.classList.add('hidden');
            } else {
                const el = overlayMap[this.currentOverlay];
                if (el) {
                    el.classList.add('hidden');
                    el.classList.remove('flex');
                }
                await new Promise(r => setTimeout(r, 50));
            }
        }

        this.currentOverlay = target;

        if (target !== 'NONE' && target !== 'SUBMENU') {
            const el = overlayMap[target];
            if (el) {
                el.classList.remove('hidden');
                el.classList.add('flex');
            }
        }

        if (openAction) openAction();

        this.overlayTransitioning = false;
    }

    private getSeasonName() {
        const m = new Date().getMonth() + 1;
        if (m >= 3 && m <= 5) return '🌸 봄';
        if (m >= 6 && m <= 8) return '☀️ 여름';
        if (m >= 9 && m <= 11) return '🍂 가을';
        return '❄️ 겨울';
    }

    public showToast(msg: string) {
        const container = document.getElementById('toast-container')!;
        const t = document.createElement('div');
        t.className = 'bg-slate-800 text-white text-[13px] font-bold px-4 py-2 rounded-xl text-center shadow-lg transition-all flex justify-center w-max mx-auto mb-2';
        t.innerText = msg;
        container.appendChild(t);
        setTimeout(() => {
            t.classList.add('opacity-0');
            setTimeout(() => t.remove(), 300);
        }, 2000);
    }



    private initNotifications() {
        const btn = document.getElementById('btn-noti-perm');
        if (btn) {
            if ('Notification' in window && Notification.permission === 'granted') {
                btn.classList.add('opacity-30');
            }
            btn.addEventListener('click', async () => {
                if (!('Notification' in window)) return;
                if (Notification.permission !== 'granted') {
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                        btn.classList.add('opacity-30');
                        new Notification('알림이 설정되었어요!', { body: '이제 학교 갈 시간과 잘 시간 🦕을 알려줄게요.' });
                    }
                } else {
                    alert('이미 알림 권한이 허용되어 있습니다. ✅');
                }
            });
        }

        setInterval(() => this.checkRoutinePush(), 60000);
    }

    private checkRoutinePush() {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const hour = new Date().getHours();
        const lastSchool = localStorage.getItem('mlb_last_school_noti') || '';
        const lastSleep = localStorage.getItem('mlb_last_sleep_noti') || '';
        const todayStr = new Date().toDateString();

        if (hour === 8 && lastSchool !== todayStr) {
            new Notification('학교 갈 시간! 🎒', { body: '브라키오도 학교에 갑니다. 점심때까지 얌전히 있을 거예요.' });
            localStorage.setItem('mlb_last_school_noti', todayStr);
        }

        if (hour === 21 && lastSleep !== todayStr) {
            new Notification('코~ 잘 시간! 🌙', { body: '브라키오를 재워주세요 (에너지 회복).' });
            localStorage.setItem('mlb_last_sleep_noti', todayStr);
        }
    }

    public showReaction(emoji: string) {
        const c = document.getElementById('main-canvas')!;
        const r = document.createElement('div');
        r.className = 'absolute text-5xl animate-bounce pointer-events-none drop-shadow-md z-20';
        r.innerText = emoji;
        r.style.left = `${20 + Math.random() * 60}%`;
        r.style.top = `${20 + Math.random() * 50}%`;
        c.parentElement!.appendChild(r);
        setTimeout(() => {
            r.classList.add('opacity-0', '-translate-y-10', 'transition-all', 'duration-500');
            setTimeout(() => r.remove(), 500);
        }, 1500);
    }

    private handleActionResult(res: { success: boolean, msg: string, react?: string }) {
        this.showToast(res.msg);
        if (res.react) this.showReaction(res.react);
        this.switchOverlay('NONE');
    }

    private openSubmenu(title: string, categoryId: CategoryId) {
        const items = getActionsByCategory(categoryId);
        this.submenuTitle.innerText = title;
        this.submenuOptions.innerHTML = items.map((it, i) => {
            const hasItem = this.fsm.hasItem(it.id);
            const count = this.fsm.stats.inventory[it.id] || 0;
            const statusLabel = hasItem ? (it.isPermanent ? '✅ 보유' : `🎒 ${count}`) : `❌ 눌러서 🛒 ${it.price}${it.currency === 'gold' ? 'G' : '💎'} 구매`;
            return `
      <button class="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-3 active:scale-95 transition-all text-sm font-bold text-slate-700 ${!it.enabledWhen(this.fsm) ? 'opacity-40 grayscale' : ''}" id="submenu-btn-${i}">
        <span class="text-3xl mb-1">${it.icon}</span>
        <span class="break-keep">${it.label}</span>
        <span class="text-[10px] ${hasItem ? 'text-indigo-600' : 'text-slate-500'} mt-1">${statusLabel}</span>
      </button>
    `}).join('');

        items.forEach((it, i) => {
            document.getElementById(`submenu-btn-${i}`)!.addEventListener('click', () => {
                if (!it.enabledWhen(this.fsm)) {
                    this.showToast('지금은 할 수 없어요!');
                    return;
                }

                if (this.fsm.consumeItem(it.id)) {
                    const res = it.onSelect(this.fsm);
                    this.handleActionResult(res);
                } else {
                    // Buy flow directly in submenu
                    if (it.unlockReq) {
                        if (it.unlockReq.tier !== undefined && this.fsm.stats.evolutionTier < it.unlockReq.tier) {
                            this.showToast(`[잠김] 진화 레벨 ${it.unlockReq.tier} 필요`);
                            return;
                        }
                        if (it.unlockReq.gold !== undefined && this.shopSystem.totalGoldEarned < it.unlockReq.gold) {
                            this.showToast(`[잠김] 누적 ${it.unlockReq.gold}G 획득 필요`);
                            return;
                        }
                    }

                    if ((it.currency === 'gold' && this.fsm.stats.gold >= it.price) ||
                        (it.currency === 'amber' && this.fsm.stats.amber >= it.price)) {

                        if (it.currency === 'gold') this.fsm.stats.gold -= it.price;
                        else this.fsm.stats.amber -= it.price;

                        if (it.isPermanent) {
                            this.fsm.stats.unlockedItems.push(it.id);
                        } else {
                            this.fsm.stats.inventory[it.id] = (this.fsm.stats.inventory[it.id] || 0) + 1;
                        }

                        AUDIO.playClick();
                        this.showToast(`${it.price}${it.currency === 'gold' ? 'G' : '💎'}로 즉시 구매 완료!`);
                        this.fsm.consumeItem(it.id);
                        const res = it.onSelect(this.fsm);
                        this.handleActionResult(res);
                    } else {
                        AUDIO.playError();
                        this.showToast(`${it.currency === 'gold' ? '골드' : '호박석'}가 부족해서 구매할 수 없어요!`);
                    }
                }
                this.update();
            });
        });

        this.submenuOverlay.classList.remove('hidden');
        this.submenuOverlay.classList.add('flex');
        setTimeout(() => {
            document.getElementById('submenu-sheet')!.classList.remove('translate-y-full');
        }, 10);
    }

    private initUI() {
        const stats = ['fullness', 'happiness', 'cleanliness', 'energy'] as const;
        const labels = ['🍖 포만', '🎵 행복', '✨ 청결', '⚡ 기력'];
        const colors = ['bg-rose-400', 'bg-yellow-400', 'bg-sky-400', 'bg-violet-400'];

        this.barsElement.innerHTML = stats.map((stat, i) => `
      <div class="flex-1 flex flex-col gap-1 items-center bg-slate-50 border border-slate-100/50 rounded-lg p-1">
        <label class="text-[10px] text-slate-600 tracking-tighter">${labels[i]}</label>
        <div class="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div id="bar-${stat}" class="h-full ${colors[i]} rounded-full transition-all duration-300 ease-out" style="width: 100%"></div>
        </div>
      </div>
    `).join('');

        const mainBtns = [
            { id: 'btn-main-feed', icon: '🍖', text: '먹이주기', menu: 'feed' },
            { id: 'btn-main-train', icon: '🎾', text: '훈련', menu: 'train' },
            { id: 'btn-main-sleep', icon: '🌙', text: '자기', menu: 'sleep' },
            { id: 'btn-main-wash', icon: '🚿', text: '씻기', menu: 'wash' },
            { id: 'btn-main-shop', icon: '🛒', text: '상점', menu: 'shop' },
            { id: 'btn-main-interact', icon: '💬', text: '상호작용', menu: 'interact' }
        ];

        this.buttonsElement.innerHTML = mainBtns.map(b => `
      <button id="${b.id}" class="relative flex flex-col items-center justify-center py-2 px-1 bg-white rounded-2xl shadow-sm border border-slate-200 focus:outline-none hover:bg-slate-50 active:scale-95 transition-all text-slate-700 font-bold text-xs sm:text-sm">
        <span class="text-2xl mb-1">${b.icon}</span>
        <span>${b.text}</span>
      </button>
    `).join('');

        document.getElementById('btn-main-feed')!.addEventListener('click', () => this.switchOverlay('SUBMENU', () => this.openSubmenu('🍖 먹이주기', 'feed')));
        document.getElementById('btn-main-train')!.addEventListener('click', () => this.switchOverlay('SUBMENU', () => this.openSubmenu('🎾 훈련', 'train')));
        document.getElementById('btn-main-sleep')!.addEventListener('click', () => this.switchOverlay('SUBMENU', () => this.openSubmenu('🌙 재우기', 'sleep')));
        document.getElementById('btn-main-wash')!.addEventListener('click', () => this.switchOverlay('SUBMENU', () => this.openSubmenu('🚿 씻기', 'wash')));
        document.getElementById('btn-main-interact')!.addEventListener('click', () => this.switchOverlay('SUBMENU', () => this.openSubmenu('💬 상호작용', 'interact')));

        document.getElementById('btn-main-shop')!.addEventListener('click', () => this.switchOverlay('SHOP', () => this.openShop()));
    }

    private openEncyclopedia() {
        const encOverlay = document.getElementById('encyclopedia-overlay')!;
        const encContent = document.getElementById('enc-content')!;

        // Build PM Stats section
        const pm = this.fsm.stats.pmStats;
        const pmDefs = [
            { key: 'health', icon: '❤️', label: '건강', color: '#ef4444' },
            { key: 'athletics', icon: '⚡', label: '운동', color: '#f59e0b' },
            { key: 'intellect', icon: '🧠', label: '지능', color: '#6366f1' },
            { key: 'elegance', icon: '✨', label: '품위', color: '#ec4899' },
            { key: 'discipline', icon: '🦴', label: '절제', color: '#14b8a6' },
            { key: 'charm', icon: '💬', label: '친화', color: '#f97316' },
        ] as const;

        const pmHtml = `
        <section class="mb-5">
          <h3 class="text-sm font-black text-slate-700 mb-3 flex items-center gap-1">📊 능력치</h3>
          <div class="flex flex-col gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            ${pmDefs.map(def => {
            const val = (pm as any)[def.key] as number;
            const pct = Math.min(100, val);
            const tier = pct >= 80 ? 'SS' : pct >= 60 ? 'S' : pct >= 40 ? 'A' : pct >= 20 ? 'B' : 'C';
            return `<div class="flex items-center gap-2">
                  <span class="text-base w-6 text-center">${def.icon}</span>
                  <span class="text-xs font-bold text-slate-700 w-8">${def.label}</span>
                  <div class="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div class="h-full rounded-full transition-all duration-500" style="width:${pct}%;background:${def.color}"></div>
                  </div>
                  <span class="text-[10px] font-black text-slate-500 w-6 text-right">${val}</span>
                  <span class="text-[10px] font-black w-6 text-center rounded-full px-1" style="color:${def.color}">${tier}</span>
                </div>`;
        }).join('')}
          </div>
        </section>`;

        // Build Personalities section
        const unlocked = this.fsm.stats.unlockedPersonalities || ['Normal'];
        const personalitiesHtml = `
        <section class="mb-5">
          <h3 class="text-sm font-black text-slate-700 mb-3 flex items-center gap-1">✨ 발견한 성격들</h3>
          <div class="grid grid-cols-2 gap-2">
            ${Object.values(PERSONALITIES).map(p => {
            const isUnlocked = unlocked.includes(p.id as import('./events/personality').Personality);
            const isCurrent = this.fsm.stats.personality === p.id;
            return `<div class="p-3 rounded-2xl shadow-sm border ${isCurrent ? 'bg-indigo-100 border-indigo-400' : isUnlocked ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-50'} flex flex-col gap-1 relative">
                    ${isCurrent ? '<div class="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">현재</div>' : ''}
                    <span class="font-black text-sm ${isUnlocked ? 'text-indigo-800' : 'text-slate-400'}">${isUnlocked ? p.label : '???'}</span>
                    <span class="text-[10px] ${isUnlocked ? 'text-slate-600' : 'text-slate-400'} leading-tight">${isUnlocked ? p.description : '조건을 달성하여 해금하세요.'}</span>
                </div>`;
        }).join('')}
          </div>
        </section>`;

        // Build Passives section - all 9 traits
        const allPassives = [
            { flag: 'hasGastroliths', icon: '🪨', name: '위석 (Gastroliths)', desc: '먹이를 먹을 때 포만감이 더 많이 오릅니다.', how: '진화 2단계 달성 시 자동 획득' },
            { flag: 'hasAirSacs', icon: '💨', name: '기낭 (Air Sacs)', desc: '활동 및 특수 먹이 섭취 시 에너지 소모 감소.', how: '진화 2단계 달성 시 자동 획득' },
            { flag: 'scaleScutes', icon: '🛡️', name: '인갑 (Scale Scutes)', desc: '단단한 비늘 덕분에 청결이 20% 느리게 떨어집니다.', how: '목욕 15회 완료 시 획득' },
            { flag: 'thickSkin', icon: '🦏', name: '두꺼운 피부', desc: '훈련/날씨로 인한 얼룩이 30% 덜 붙습니다.', how: '씻기 30회 완료 시 획득' },
            { flag: 'longNeck', icon: '🦒', name: '긴 목 (Long Neck)', desc: '키 큰 식물을 먹을 때 포만감이 +10 추가됩니다.', how: '침엽수 45회 먹이기 완료 시 획득' },
            { flag: 'strongTail', icon: '🦖', name: '강한 꼬리 (Strong Tail)', desc: '공놀이·춤 등 놀이 시 행복이 +5 추가됩니다.', how: '훈련 40회 완료 시 획득' },
            { flag: 'sharpSense', icon: '👁️', name: '예리한 감각', desc: '병에 걸릴 위기 상황을 미리 감지하여 한 번 막습니다.', how: '비타민 25회 먹이기 완료 시 획득' },
            { flag: 'fastMetabolism', icon: '⚡', name: '빠른 대사', desc: '잠을 잘 때 에너지 회복이 20% 빨라집니다.', how: '침대에서 15회 재우기 완료 시 획득' },
            { flag: 'mudLover', icon: '🐊', name: '진흙 애호가', desc: '진흙목욕이 더러움 없이 행복만 +40 줍니다.', how: '진흙목욕 12회 완료 시 획득' },
        ] as const;

        const passivesHtml = `
        <section>
          <h3 class="text-sm font-black text-slate-700 mb-3 flex items-center gap-1">🧬 보유 특성</h3>
          <div class="flex flex-col gap-2">
            ${allPassives.map(p => {
            const has = !!(this.fsm.stats as any)[p.flag];
            return `<div class="flex items-center gap-3 ${has ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'} p-3 rounded-xl border shadow-sm">
                  <span class="text-2xl shrink-0">${has ? p.icon : '🔒'}</span>
                  <div class="flex flex-col flex-1">
                    <span class="font-bold text-slate-800 text-xs">${p.name}</span>
                    <span class="text-[10px] text-slate-500 leading-tight">${has ? p.desc : p.how}</span>
                  </div>
                  ${has ? '<span class="text-emerald-500 text-xs font-black shrink-0">보유</span>' : '<span class="text-slate-400 text-xs shrink-0">잠김</span>'}
                </div>`;
        }).join('')}
          </div>
        </section>`;

        encContent.innerHTML = pmHtml + personalitiesHtml + passivesHtml;

        encOverlay.classList.remove('hidden');
        encOverlay.classList.add('flex');
    }


    private initShopEvents() {
        document.getElementById('btn-close-shop')!.addEventListener('click', () => {
            this.switchOverlay('NONE');
        });

        document.getElementById('btn-part-time')!.addEventListener('click', () => {
            this.switchOverlay('ARBEIT');
        });
    }

    private openShop() {
        document.getElementById('shop-gold')!.innerText = Math.floor(this.fsm.stats.gold).toString();
        document.getElementById('shop-amber')!.innerText = Math.floor(this.fsm.stats.amber).toString();

        // Render Time Sale
        const tsContainer = document.getElementById('time-sale-container')!;
        const tsItems = document.getElementById('time-sale-items')!;
        if (this.shopSystem.isTimeSaleActive()) {
            tsContainer.classList.remove('hidden');
            tsItems.innerHTML = this.shopSystem.getTimeSaleItems().map(item => `
        <div class="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-red-100">
          <div class="flex items-center gap-2">
            <span class="text-3xl">${item.icon}</span>
            <div class="flex flex-col">
              <span class="font-bold text-slate-800 text-sm">${item.name} 💎${item.price}</span>
              <span class="text-[10px] text-red-500 font-semibold">${item.desc}</span>
            </div>
          </div>
          <button class="btn-buy-ts bg-red-500 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all text-xs font-bold" data-id="${item.id}">구매</button>
        </div>
      `).join('');

            tsItems.querySelectorAll('.btn-buy-ts').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = (e.currentTarget as HTMLElement).dataset.id!;
                    const res = this.shopSystem.buyTimeSaleItem(id);
                    this.showToast(res.msg);
                    if (res.success) this.openShop();
                });
            });
        } else {
            tsContainer.classList.add('hidden');
        }

        // Render Feeds
        const feedContainer = document.getElementById('shop-feed-items')!;
        feedContainer.innerHTML = this.shopSystem.getFeedItems().map((item) => `
      <div class="flex flex-col bg-white p-2 rounded-xl shadow-sm border border-slate-100 items-center text-center gap-1 relative">
        <span class="text-3xl">${item.icon}</span>
        <span class="font-bold text-slate-700 leading-tight">${item.name}</span>
        <span class="text-[9px] text-slate-500">${item.desc}</span>
        <button class="btn-buy mt-1 bg-blue-50 text-blue-600 border border-blue-200 w-full py-1.5 rounded-lg active:scale-95 transition-all flex justify-center items-center gap-1" data-id="${item.id}">
          <span class="text-xs">${item.currency === 'gold' ? '💰' : '💎'}</span><span>${item.price}</span>
        </button>
      </div>
    `).join('');

        // Render Tools
        const toolContainer = document.getElementById('shop-tool-items')!;
        toolContainer.innerHTML = this.shopSystem.getToolItems().map((item) => {
            const isLockedTier = item.unlockReq?.tier && this.fsm.stats.evolutionTier < item.unlockReq.tier;
            const isLockedGold = item.unlockReq?.gold && this.shopSystem.totalGoldEarned < item.unlockReq.gold;
            const isBought = this.shopSystem.purchases[item.id] > 0;

            let statusHtml = '';
            if (isBought) {
                statusHtml = `<div class="mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full text-center">✅ 획득완료</div>`;
            } else if (isLockedTier || isLockedGold) {
                const reqTexts = [];
                if (isLockedTier) reqTexts.push(`진화 ${item.unlockReq!.tier}단계`);
                if (isLockedGold) reqTexts.push(`총 누적 ${item.unlockReq!.gold}g`);
                statusHtml = `<div class="mt-2 text-[10px] font-bold text-slate-400 bg-slate-100 flex items-center justify-center py-1.5 rounded-lg">🔒 필요: ${reqTexts.join(', ')}</div>`;
            } else {
                statusHtml = `<button class="btn-buy mt-2 bg-amber-100 text-amber-700 border border-amber-200 w-full py-1.5 rounded-lg active:scale-95 transition-all text-sm font-bold flex justify-center items-center gap-1" data-id="${item.id}">구매 ${item.currency === 'gold' ? '💰' : '💎'}${item.price}</button>`;
            }

            return `
      <div class="flex flex-col bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <span class="text-4xl">${item.icon}</span>
          <div class="flex-1 flex flex-col pointer-events-none">
            <span class="font-bold text-slate-800 text-sm">${item.name}</span>
            <span class="text-[10px] text-slate-500">${item.desc}</span>
            <div class="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                <div class="bg-indigo-300 h-full" style="width: ${item.level ? (item.level / 5) * 100 : 0}%"></div>
            </div>
          </div>
        </div>
        ${statusHtml}
      </div>
    `}).join('');

        const buyHandler = (e: Event) => {
            const id = (e.currentTarget as HTMLElement).dataset.id!;
            const item = [...this.shopSystem.getFeedItems(), ...this.shopSystem.getToolItems()].find(i => i.id === id);
            if (item) {
                const res = this.shopSystem.buyItem(item);
                this.showToast(res.msg);
                if (res.success) this.openShop();
            }
        };

        feedContainer.querySelectorAll('.btn-buy').forEach(btn => btn.addEventListener('click', buyHandler));
        toolContainer.querySelectorAll('.btn-buy').forEach(btn => btn.addEventListener('click', buyHandler));

        this.shopOverlay.classList.remove('hidden');
        this.shopOverlay.classList.add('flex');
        this.update(); // sync HUD
    }

    private initQuizEvents() {
        // Back arrow — go back to arbeit menu, give partial reward
        document.getElementById('btn-back-quiz')?.addEventListener('click', () => {
            this.finishMathQuizEarly();
        });

        // "여기까지 할래요" — same as back
        document.getElementById('btn-quit-quiz-early')?.addEventListener('click', () => {
            this.finishMathQuizEarly();
        });

        // "너무 어려워요, 다음 문제" — skip current question (no penalty)
        document.getElementById('btn-next-quiz')!.addEventListener('click', () => {
            if (!this.mathQuizEngine) return;
            this.mathQuizEngine.recordResult(false);
            this.showMathQuiz();
        });
    }

    /** 현재까지 획득한 골드 지급 후 아르바이트 메뉴로 복귀 */
    private finishMathQuizEarly() {
        if (this.mathGoldEarned > 0) {
            this.fsm.rewardGold(this.mathGoldEarned);
            this.shopSystem.recordGoldEarned(this.mathGoldEarned);
            this.showToast(`수학 알바 완료! 💰+${this.mathGoldEarned}`);
        } else {
            this.showToast('수학 알바를 그만뒀어요.');
        }
        this.fsm.stats.mathQuizTier = this.mathQuizEngine?.getTier() ?? 0;
        this.mathQuizEngine = null;
        this.mathCurrentQ = null;
        this.mathCombo = 0;
        this.mathGoldEarned = 0;
        this.switchOverlay('ARBEIT');
    }

    /** 수학 퀴즈 화면 표시 */
    private showMathQuiz() {
        if (!this.mathQuizEngine) return;
        this.mathCurrentQ = this.mathQuizEngine.generateQuestion();
        this.mathHintShown = false;

        const qText = document.getElementById('question-text')!;
        const qOpts = document.getElementById('quiz-options')!;
        const qHint = document.getElementById('quiz-hint')!;
        const btnNext = document.getElementById('btn-next-quiz')!;
        const btnQuitEarly = document.getElementById('btn-quit-quiz-early')!;
        const tierBadge = document.getElementById('quiz-tier-badge')!;
        const goldPreview = document.getElementById('quiz-gold-preview')!;

        qText.textContent = this.mathCurrentQ.text;
        qHint.textContent = `💡 ${this.mathCurrentQ.hint}`;
        qHint.classList.add('hidden');
        btnNext.classList.add('hidden');

        // Tier badge
        const tierNames = ['워밍업', '기본', '확장', '숙련'];
        tierBadge.textContent = `Lv.${this.mathCurrentQ.tier + 1} ${tierNames[this.mathCurrentQ.tier]}`;

        // 여기까지 버튼: combo >= 1부터 표시
        if (this.mathCombo >= 1) {
            btnQuitEarly.classList.remove('hidden');
        } else {
            btnQuitEarly.classList.add('hidden');
        }

        // Gold preview
        goldPreview.textContent = `💰 +${this.mathGoldEarned}`;

        // Combo indicator bars
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById(`quiz-combo-${i}`)!;
            if (i <= this.mathCombo) {
                el.className = 'flex-1 h-8 rounded-xl border-2 border-yellow-400 bg-yellow-100 flex items-center justify-center text-xs font-black text-yellow-700 transition-all';
                el.textContent = `${i}콤보 ✅`;
            } else {
                const golds = [10, 16, 24];
                el.className = 'flex-1 h-8 rounded-xl border-2 border-slate-200 bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 transition-all';
                el.textContent = `${i}콤보 +${golds[i - 1]}G`;
            }
        }

        // 4-option buttons
        qOpts.innerHTML = this.mathCurrentQ.options.map((opt, i) =>
            `<button class="quiz-opt-btn h-16 bg-white border-2 border-blue-200 rounded-2xl text-2xl font-black text-blue-800 active:scale-95 transition-all shadow-sm" data-index="${i}">${opt}</button>`
        ).join('');
        qOpts.querySelectorAll('.quiz-opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt((e.currentTarget as HTMLElement).dataset.index!);
                this.handleMathAnswer(idx);
            });
        });
    }

    private handleMathAnswer(index: number) {
        if (!this.mathCurrentQ || !this.mathQuizEngine) return;
        const isCorrect = index === this.mathCurrentQ.answerIndex;

        if (isCorrect) {
            AUDIO.playSuccess();
            this.mathQuizEngine.recordResult(true);
            this.mathCombo++;
            const reward = MATH_QUIZ_GOLD[this.mathCombo] ?? 0;
            this.mathGoldEarned += reward;

            if (this.mathCombo >= 3) {
                // 3콤보 달성! 세션 종료
                this.fsm.rewardGold(this.mathGoldEarned);
                this.fsm.rewardAmber(MATH_QUIZ_AMBER_BONUS);
                this.shopSystem.recordGoldEarned(this.mathGoldEarned);
                this.fsm.stats.mathQuizTier = this.mathQuizEngine.getTier();
                this.fsm.recordGamePlayed('math_quiz');
                this.update();
                alert(`🎉 3콤보 달성! 수학 알바 완료!\n💰 +${this.mathGoldEarned} · 💎 +${MATH_QUIZ_AMBER_BONUS}`);
                this.mathQuizEngine = null;
                this.mathCurrentQ = null;
                this.mathCombo = 0;
                this.mathGoldEarned = 0;
                this.switchOverlay('ARBEIT');
            } else {
                this.showToast(`정답! 💰+${reward} (${this.mathCombo}/3콤보)`);
                this.showMathQuiz();
            }
        } else {
            AUDIO.playError();
            this.mathQuizEngine.recordResult(false);
            const qHint = document.getElementById('quiz-hint')!;
            if (!this.mathHintShown) {
                this.mathHintShown = true;
                qHint.classList.remove('hidden');
                document.getElementById('btn-next-quiz')!.classList.remove('hidden');
                this.showToast('틀렸어! 힌트를 보고 다시 풀어봐 🦕');
            } else {
                this.showToast('다시 한번 힌트를 천천히 읽어봐 😊');
            }
        }
    }



    public update() {
        if (this.fsm.stats.isDead && this.currentOverlay !== 'DEATH') {
            this.showDeathOverlay();
            this.switchOverlay('DEATH');
            return;
        }

        const now = performance.now();
        const dt = (now - this.lastUiTime) / 1000;
        this.lastUiTime = now;

        if (dt > 0 && dt < 1) {
            const dRes = this.dialogueManager.update(dt, this.getDialogueContext());
            if (dRes) this.showDialogue(dRes);
        }

        // General update
        if (now - this.lastStateTextUpdate > 5000) {
            this.lastStateTextUpdate = now;
            if (this.fsm.currentState !== this.lastFsmState) {
                this.lastFsmState = this.fsm.currentState;
                let stateTag = '';
                if (this.fsm.currentState === 'Hungry') stateTag = 'state_hungry';
                else if (this.fsm.currentState === 'Dirty') stateTag = 'state_dirty';
                else if (this.fsm.currentState === 'Sleepy') stateTag = 'state_sleepy';
                else if (this.fsm.currentState === 'Sick') stateTag = 'state_sick';
                else if (this.fsm.currentState === 'Naughty') stateTag = 'state_naughty';

                if (stateTag) {
                    const dRes = this.dialogueManager.triggerStateHint(stateTag, this.getDialogueContext());
                    if (dRes) this.showDialogue(dRes);
                }
            }
        }

        const s = this.fsm.stats;
        document.getElementById('bar-fullness')!.style.width = `${s.fullness}%`;
        document.getElementById('bar-happiness')!.style.width = `${s.happiness}%`;
        document.getElementById('bar-cleanliness')!.style.width = `${s.cleanliness}%`;
        document.getElementById('bar-energy')!.style.width = `${s.energy}%`;

        this.amberElement.innerText = Math.floor(s.amber).toString();
        this.goldElement.innerText = Math.floor(s.gold).toString();
        this.medicineElement.innerText = Math.floor(s.medicine).toString();

        // Weather alert badge
        const weatherBadge = document.getElementById('weather-badge')!;
        const weatherIcon = document.getElementById('weather-icon')!;
        const weatherTitle = document.getElementById('weather-title')!;

        if (this.fsm.activeEvent === 'None') {
            weatherBadge.classList.add('hidden');
        } else {
            weatherBadge.classList.remove('hidden');
            if (this.fsm.activeEvent === 'Drought') {
                weatherIcon.innerText = "🏜️";
                weatherTitle.innerText = "가뭄: 씻고싶어해요";
            } else if (this.fsm.activeEvent === 'MeteorShower') {
                weatherIcon.innerText = "🌠";
                weatherTitle.innerText = "유성우: 훈련보상 UP";
            } else if (this.fsm.activeEvent === 'VolcanicAsh') {
                weatherIcon.innerText = "🌋";
                weatherTitle.innerText = "화산재: 병에 걸려요";
            }
        }

        // Check Pasture Return
        if (this.fsm.stats.pastureEndTime && Date.now() >= this.fsm.stats.pastureEndTime) {
            const result = getPastureResult(5);

            if (result.amber) this.fsm.rewardAmber(result.amber);
            if (result.gold) { this.fsm.rewardGold(result.gold); this.shopSystem.recordGoldEarned(result.gold); }
            if (result.happiness) this.fsm.stats.happiness = Math.min(100, Math.max(0, this.fsm.stats.happiness + result.happiness));
            if (result.wisdom) this.fsm.stats.wisdom += result.wisdom;

            this.fsm.stats.pastureEndTime = undefined;

            const rewardStrs: string[] = [];
            if (result.amber) rewardStrs.push(`💎+${result.amber}`);
            if (result.gold) rewardStrs.push(`💰+${result.gold}`);
            if (result.happiness) rewardStrs.push(`🌿${result.happiness > 0 ? '+' : ''}${result.happiness}`);
            if (result.wisdom) rewardStrs.push(`🧠+${result.wisdom}`);

            setTimeout(() => {
                alert(`[방목 귀환] ${result.msg}\n${rewardStrs.length > 0 ? '보상: ' + rewardStrs.join(', ') : ''}`);
            }, 100);
        }

        // Sleep Alert
        const hour = new Date().getHours();
        const isSleepRoutine = hour >= 21 || hour < 7;
        const sleepAlert = document.getElementById('sleep-alert')!;
        if (isSleepRoutine && !this.fsm.isSleeping) {
            sleepAlert.classList.remove('hidden');
        } else {
            sleepAlert.classList.add('hidden');
        }

        // Evolution Trigger Check
        if (this.fsm.isEvolutionTriggered) {
            this.fsm.isEvolutionTriggered = false; // consume trigger
            AUDIO.playSuccess();
            AUDIO.playSuccess();
            setTimeout(() => {
                alert(`✨ 축하합니다! 브라키오가 ${this.fsm.stats.evolutionTier}단계로 진화했습니다! ✨\n더 크게 쑥쑥 자랐어요!`);
            }, 500);

            // Sparkle reactions
            for (let i = 0; i < 5; i++) {
                setTimeout(() => this.showReaction('✨'), i * 200);
            }
        }
        // Update HUD Name
        const petNameHeader = document.querySelector('h1.text-xl.font-black.text-slate-800');
        if (petNameHeader) {
            petNameHeader.textContent = s.name || '브라키오';
        }

        switch (this.fsm.currentState) {
            case 'Idle': this.stateTextElement.innerText = '기분이 좋아요! 🌿'; break;
            case 'Hungry': this.stateTextElement.innerText = '배고파요... 🍖'; break;
            case 'Dirty': this.stateTextElement.innerText = '씻고 싶어요 🚿'; break;
            case 'Sleepy': this.stateTextElement.innerText = '졸려요... 🥱'; break;
            case 'Sleep': this.stateTextElement.innerText = '쿨쿨... 🌙'; break;
            case 'Quiz': this.stateTextElement.innerText = '아르바이트 중! ✏️'; break;
            case 'Naughty': this.stateTextElement.innerText = '말썽 부릴 거야! 💢'; break;
            case 'Sick': this.stateTextElement.innerText = '아파요... 💊 (특효약 필요!)'; break;
        }
    }

    private initArbeitEvents() {
        document.getElementById('btn-close-arbeit')!.addEventListener('click', () => {
            this.switchOverlay('SHOP', () => this.openShop());
        });

        // 수학 퀴즈 알바
        document.getElementById('btn-start-quiz')!.addEventListener('click', () => {
            if (!this.fsm.canPlayGame('math_quiz')) {
                const ms = this.fsm.getGameCooldownRemaining('math_quiz');
                const hrs = Math.ceil(ms / 3600000);
                AUDIO.playError();
                this.showToast(`수학 알바는 ${hrs}시간 후에 다시 할 수 있어요! 📚`);
                return;
            }
            // Init math quiz engine with persisted tier
            this.mathQuizEngine = new MathQuizEngine(this.fsm.stats.mathQuizTier || 0);
            this.mathCombo = 0;
            this.mathGoldEarned = 0;
            this.switchOverlay('QUIZ', () => {
                this.fsm.playQuiz();
                this.showMathQuiz();
            });
        });

        // 과일따기
        document.getElementById('btn-start-minigame')!.addEventListener('click', () => {
            if (!this.fsm.canPlayGame('fruit_pick')) {
                const ms = this.fsm.getGameCooldownRemaining('fruit_pick');
                const hrs = Math.ceil(ms / 3600000);
                AUDIO.playError();
                this.showToast(`과일따기는 ${hrs}시간 후에 다시 가능해요! 🍎`);
                return;
            }
            this.switchOverlay('MINIGAME', () => this.startMinigame());
        });

        document.getElementById('btn-close-minigame')!.addEventListener('click', () => {
            this.stopMinigame();
            this.switchOverlay('ARBEIT');
        });

        document.getElementById('btn-minigame-tap')!.addEventListener('click', () => {
            this.handleMinigameTap();
        });

        // 신규 3종 미니게임 버튼
        document.getElementById('btn-start-sort')!.addEventListener('click', () => {
            this.startCanvasMinigame('sort_baskets');
        });
        document.getElementById('btn-start-memory')!.addEventListener('click', () => {
            this.startCanvasMinigame('memory_pairs_8');
        });
        document.getElementById('btn-start-trace')!.addEventListener('click', () => {
            this.startCanvasMinigame('trace_path');
        });

        document.getElementById('btn-close-canvas-mg')!.addEventListener('click', () => {
            const ok = MG_BALANCE.QUIT_CONFIRM
                ? confirm('게임을 그만둘까요? (페널티 없음)')
                : true;
            if (ok) {
                this.stopCanvasMinigame();
                this.switchOverlay('ARBEIT');
            }
        });

        document.getElementById('btn-mg-hint')!.addEventListener('click', () => {
            if (this.currentCanvasGame === 'memory_pairs_8' && this._memoryGameRef) {
                this._memoryGameRef.activateHint();
            }
        });
    }

    private _memoryGameRef: MemoryPairs | null = null;

    private startCanvasMinigame(gameId: MinigameId) {
        if (!this.fsm.canPlayGame(gameId)) {
            const ms = this.fsm.getGameCooldownRemaining(gameId);
            const hrs = Math.ceil(ms / 3600000);
            AUDIO.playError();
            this.showToast(`${hrs}시간 후에 다시 할 수 있어요! ⏰`);
            return;
        }

        this.currentCanvasGame = gameId;
        this.switchOverlay('CANVAS_MG', () => {
            const canvas = document.getElementById('mg-canvas') as HTMLCanvasElement;
            const timerEl = document.getElementById('canvas-mg-timer')!;
            const titleEl = document.getElementById('canvas-mg-title')!;
            const hintBtn = document.getElementById('btn-mg-hint')!;

            hintBtn.classList.toggle('hidden', gameId !== 'memory_pairs_8');

            let game: SortBaskets | MemoryPairs | TracePath;
            if (gameId === 'sort_baskets') {
                const g = new SortBaskets();
                (g as SortBaskets).setCanvas(canvas);
                this._memoryGameRef = null;
                game = g;

            } else if (gameId === 'memory_pairs_8') {
                const g = new MemoryPairs();
                this._memoryGameRef = g;
                game = g;
            } else {
                this._memoryGameRef = null;
                game = new TracePath();
            }

            this.canvasMgRunner = new MinigameRunner();
            this.canvasMgRunner.start(game, canvas, timerEl, titleEl, (result) => {
                this.fsm.rewardGold(result.goldEarned);
                if (result.amberEarned > 0) this.fsm.rewardAmber(result.amberEarned);
                this.shopSystem.recordGoldEarned(result.goldEarned);
                this.fsm.recordGamePlayed(gameId); // 4-hour cooldown
                this.update();

                const amberStr = result.amberEarned > 0 ? ` · 💎+${result.amberEarned}` : '';
                setTimeout(() => {
                    this.showToast(`수고했어요! 💰+${result.goldEarned}${amberStr}`);
                    this.switchOverlay('ARBEIT');
                }, 400);
            });
        });
    }

    private stopCanvasMinigame() {
        if (this.canvasMgRunner) {
            this.canvasMgRunner.stop();
            this.canvasMgRunner = null;
        }
        this._memoryGameRef = null;
        this.currentCanvasGame = null;
    }

    private startMinigame() {
        if (!this.fsm.canPlayMinigame()) {
            document.getElementById('minigame-limit-msg')!.classList.remove('hidden');
            document.getElementById('minigame-game-area')!.classList.add('hidden');
            return;
        } else {
            document.getElementById('minigame-limit-msg')!.classList.add('hidden');
            document.getElementById('minigame-game-area')!.classList.remove('hidden');
        }

        this.minigameOverlay.classList.remove('hidden');
        this.minigameOverlay.classList.add('flex');
        this.mgResult.innerText = '';
        this.mgPos = 0;
        this.mgDir = 1;

        // Base speed 1.0 + difficulty scaling with combo
        this.mgSpeed = 1.0 + (this.mgCombo * 0.15);
        document.getElementById('minigame-combo')!.innerText = `콤보: ${this.mgCombo}`;

        if (this.mgLoop !== null) cancelAnimationFrame(this.mgLoop);

        const loop = () => {
            this.mgPos += this.mgSpeed * this.mgDir;
            if (this.mgPos > 100) { this.mgPos = 100; this.mgDir = -1; }
            if (this.mgPos < 0) { this.mgPos = 0; this.mgDir = 1; }
            this.mgCursor.style.left = `${this.mgPos}%`;
            this.mgLoop = requestAnimationFrame(loop);
        };
        this.mgLoop = requestAnimationFrame(loop);
    }

    private stopMinigame() {
        if (this.mgLoop !== null) cancelAnimationFrame(this.mgLoop);
        this.mgLoop = null;
    }

    private handleMinigameTap() {
        if (this.mgLoop === null) return;
        this.stopMinigame();

        const isSuccess = this.mgPos > 35 && this.mgPos < 65;
        const isPerfect = this.mgPos > 45 && this.mgPos < 55;

        // Combo-scaled gold: Perfect 15/20/25, Hit 8/10/12 at combo 0/1/2+
        const comboSlot = Math.min(2, this.mgCombo); // 0=first, 1=second, 2+=highest
        const perfectGolds = [15, 20, 25];
        const hitGolds = [8, 10, 12];

        if (isPerfect) {
            AUDIO.playSuccess();
            AUDIO.playSuccess();
            const gold = perfectGolds[comboSlot];
            this.mgResult.innerText = `✨ 퍼펙트! 💰 +${gold}  🔥${this.mgCombo + 1}콤보`;
            this.mgResult.className = 'text-xl font-bold h-8 text-center mt-4 text-emerald-600 animate-bounce';
            this.fsm.rewardGold(gold);
            this.shopSystem.recordGoldEarned(gold);
            this.mgCombo++;
            if (this.mgCombo === 1) this.fsm.recordGamePlayed('fruit_pick'); // 1회 기록은 첫 성공 시
        } else if (isSuccess) {
            AUDIO.playSuccess();
            const gold = hitGolds[comboSlot];
            this.mgResult.innerText = `👍 성공! 💰 +${gold}  🔥${this.mgCombo + 1}콤보`;
            this.mgResult.className = 'text-xl font-bold h-8 text-center mt-4 text-blue-600 animate-bounce';
            this.fsm.rewardGold(gold);
            this.shopSystem.recordGoldEarned(gold);
            this.mgCombo++;
            if (this.mgCombo === 1) this.fsm.recordGamePlayed('fruit_pick');
        } else {
            AUDIO.playError();
            this.mgResult.innerText = '💦 아쉽다! 콤보가 끊겼어.';
            this.mgResult.className = 'text-xl font-bold h-8 text-center mt-4 text-rose-500';
            this.fsm.rewardGold(1);
            this.mgCombo = 0;
        }

        this.update();
        setTimeout(() => {
            if (!this.minigameOverlay.classList.contains('hidden')) {
                this.startMinigame();
            }
        }, 1200);
    }

    private initSpeechBubble() {
        this.speechBubble = document.createElement('div');
        this.speechBubble.id = 'speech-bubble';
        this.speechBubble.className = 'absolute top-[4.5rem] left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-white/95 backdrop-blur-sm border-2 border-indigo-200 rounded-3xl p-4 shadow-xl z-50 flex flex-col gap-3 transition-opacity duration-300 opacity-0 pointer-events-none';

        const tail = document.createElement('div');
        tail.className = 'absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/95 border-r-2 border-b-2 border-indigo-200 rotate-45';
        this.speechBubble.appendChild(tail);

        const textContainer = document.createElement('div');
        textContainer.id = 'speech-text';
        textContainer.className = 'text-slate-700 font-bold text-sm leading-relaxed text-center break-keep relative z-10';
        this.speechBubble.appendChild(textContainer);

        const optsContainer = document.createElement('div');
        optsContainer.id = 'speech-options';
        optsContainer.className = 'flex gap-2 justify-center relative z-10';
        this.speechBubble.appendChild(optsContainer);

        document.getElementById('app')!.appendChild(this.speechBubble);
    }

    private hideDialogue() {
        this.speechBubble.classList.add('opacity-0');
        this.speechBubble.classList.add('pointer-events-none');
        if (this.bubbleHideTimer) {
            clearTimeout(this.bubbleHideTimer);
            this.bubbleHideTimer = null;
        }
    }

    private showDialogue(res: DialogueResult) {
        const textContainer = document.getElementById('speech-text')!;
        const optsContainer = document.getElementById('speech-options')!;

        textContainer.innerText = res.text;

        optsContainer.innerHTML = '';
        if (res.followUps && res.followUps.length > 0) {
            res.followUps.slice(0, 2).forEach(f => {
                const btn = document.createElement('button');
                btn.className = 'bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm pointer-events-auto active:scale-95';
                btn.innerText = f.label;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.hideDialogue();
                    if (f.actionId.startsWith('btn-')) {
                        const targetBtn = document.getElementById(f.actionId);
                        if (targetBtn) targetBtn.click();
                    } else {
                        const actionRes = this.fsm.performSpecificAction(f.actionId);
                        this.handleActionResult(actionRes);
                    }
                };
                optsContainer.appendChild(btn);
            });
            this.speechBubble.classList.remove('pointer-events-none');
        } else {
            this.speechBubble.classList.add('pointer-events-none');
        }

        this.speechBubble.classList.remove('opacity-0');

        if (this.bubbleHideTimer) clearTimeout(this.bubbleHideTimer);
        this.bubbleHideTimer = setTimeout(() => {
            this.hideDialogue();
        }, res.ttlMs);
    }

    private getDialogueContext(): DialogueContext {
        return {
            personality: this.fsm.stats.personality,
            fsmState: this.fsm.currentState,
            stats: {
                fullness: this.fsm.stats.fullness,
                energy: this.fsm.stats.energy,
                cleanliness: this.fsm.stats.cleanliness,
                happiness: this.fsm.stats.happiness
            },
            timeOfDay: new Date().getHours(),
            season: document.getElementById('season-badge')?.innerText || '🌸 봄',
            weather: this.fsm.activeEvent,
            lastActions: HOOKS.actionLog.slice(-5).map(log => {
                const match = log.match(/\[Action\] ([\w_]+)/);
                return match ? match[1] : '';
            }),
            isInOverlay: this.currentOverlay !== 'NONE'
        };
    }

    private initDeathOverlay() {
        const btnReincarnate = document.getElementById('btn-reincarnate');
        if (btnReincarnate) {
            btnReincarnate.addEventListener('click', () => {
                this.fsm.reincarnate();
                // Also need to save right away!
                import('./storage').then(({ StorageManager }) => {
                    StorageManager.save(this.fsm.stats, this.fsm.lastTick, this.fsm.careMisses).then(() => {
                        window.location.reload();
                    });
                });
            });
        }
    }

    private showDeathOverlay() {
        const reasonEl = document.getElementById('death-reason');
        const ageEl = document.getElementById('death-age');
        const personalityEl = document.getElementById('death-personality');
        const tierEl = document.getElementById('death-tier');

        if (reasonEl) reasonEl.innerText = this.fsm.stats.deathReason || '평화롭게 여행을 떠났습니다.';

        if (ageEl) {
            const msLived = (this.fsm.stats.diedAtMs || Date.now()) - this.fsm.stats.bornAtMs;
            const daysLived = Math.max(1, Math.floor(msLived / (24 * 60 * 60 * 1000)));
            const ageYears = Math.floor((this.fsm.stats.ageTicks * 1000) / (24 * 60 * 60 * 1000) / 3); // 3 days = 1 year roughly, based on old balancing
            ageEl.innerText = `${ageYears}살 (생존 ${daysLived}일)`;
        }

        if (personalityEl) {
            personalityEl.innerText = this.fsm.stats.personality;
        }

        if (tierEl) {
            const tiers = ['아기(알)', '어린이', '청소년', '어른'];
            tierEl.innerText = tiers[this.fsm.stats.evolutionTier] || '어른';
        }
    }
}
