import { FSM } from './fsm';
import { ActionCatalog } from './actions/catalog';

export interface TimeSaleItem {
    id: string;
    icon: string;
    name: string;
    desc: string;
    price: number;
    action: (fsm: FSM) => boolean;
}

export interface ShopItem {
    id: string;
    type: 'feed' | 'tool' | 'instant';
    icon: string;
    name: string;
    desc: string;
    currency: 'gold' | 'amber';
    price: number;
    level?: number;
    unlockReq?: { gold?: number, tier?: number };
    action?: (fsm: FSM) => { success: boolean, msg: string };
    isPermanent?: boolean;
}

export class ShopSystem {
    private fsm: FSM;
    public purchases: Record<string, number> = {};
    public totalGoldEarned: number = 0; // tracked for unlocking

    constructor(fsm: FSM) {
        this.fsm = fsm;
        this.loadPurchases();
    }

    private loadPurchases() {
        const saved = localStorage.getItem('mlb_shop_purchases');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.purchases = data.purchases || {};
                this.totalGoldEarned = data.totalGold || 0;

                const today = new Date().toDateString();
                if (this.purchases['_date'] !== today as unknown as number) {
                    // Only clear daily limited purchases, but keep permanent tool upgrades
                    const newPurchases: any = { '_date': today };
                    for (const key in this.purchases) {
                        if (key.startsWith('train_') || key.startsWith('sleep_') || key.startsWith('perm-')) {
                            newPurchases[key] = this.purchases[key];
                        }
                    }
                    this.purchases = newPurchases;
                }
            } catch (e) { }
        } else {
            this.purchases = { '_date': new Date().toDateString() as unknown as number };
        }
    }

    public savePurchases() {
        localStorage.setItem('mlb_shop_purchases', JSON.stringify({
            purchases: this.purchases,
            totalGold: this.totalGoldEarned
        }));
    }

    public recordGoldEarned(amount: number) {
        this.totalGoldEarned += amount;
        this.savePurchases();
    }

    public isTimeSaleActive(): boolean {
        const now = Date.now();
        if (Math.abs(now - this.fsm.lastTick) > 24 * 60 * 60 * 1000) return false;
        const hour = new Date(now).getHours();
        return (hour === 12) || (hour === 18) || (hour === 19);
    }

    public getTimeSaleItems(): TimeSaleItem[] {
        if (!this.isTimeSaleActive()) return [];
        return [
            {
                id: 'sale-scarf', icon: '🧣', name: '따뜻한 목도리 (한정판)', desc: '질병 예방 및 행복도 50 상승!', price: 15,
                action: (fsm) => {
                    if (fsm.stats.amber >= 15) {
                        fsm.stats.amber -= 15;
                        fsm.stats.happiness = Math.min(100, fsm.stats.happiness + 50);
                        if (fsm.currentState === 'Sick') {
                            fsm.stats.cleanliness = 100;
                            fsm.stats.happiness = 100;
                            fsm.currentState = 'Idle';
                        }
                        return true;
                    }
                    return false;
                }
            },
            {
                id: 'sale-sunglasses', icon: '🕶️', name: '멋쟁이 선글라스', desc: '경험치(XP) 500 즉시 획득!', price: 25,
                action: (fsm) => {
                    if (fsm.stats.amber >= 25) {
                        fsm.stats.amber -= 25; fsm.stats.xp += 500; return true;
                    }
                    return false;
                }
            }
        ];
    }

    public buyTimeSaleItem(itemId: string): { success: boolean, msg: string } {
        if (!this.isTimeSaleActive()) return { success: false, msg: '세일 시간이 지났어요!' };
        if (this.purchases[itemId] >= 1) return { success: false, msg: '오늘 이미 구매한 한정 상품이에요!' };

        const item = this.getTimeSaleItems().find(i => i.id === itemId);
        if (!item) return { success: false, msg: '상품을 찾을 수 없어요.' };

        if (item.action(this.fsm)) {
            this.purchases[itemId] = 1;
            this.savePurchases();
            return { success: true, msg: `${item.name} 구매 완료! ✨` };
        } else {
            return { success: false, msg: '호박석이 부족해요! 💎' };
        }
    }

    public getFeedItems(): ShopItem[] {
        const consumables = ActionCatalog.filter(a => !a.isPermanent && a.price > 0).map(a => ({
            id: a.id,
            type: 'feed' as const,
            icon: a.icon,
            name: a.label,
            desc: a.desc,
            currency: a.currency,
            price: a.price,
            unlockReq: a.unlockReq,
            isPermanent: a.isPermanent
        }));

        const instantItems: ShopItem[] = [
            { id: 'shop_feed_special', type: 'instant', icon: '🍩', name: '특별간식', desc: '상점 즉시 섭취 (행복도 크게 상승)', currency: 'amber', price: 2, action: (f: FSM) => f.performSpecificAction('feed_special') },
            { id: 'shop_feed_ancient', type: 'instant', icon: '🍈', name: '고대 과일', desc: '상점 즉시 섭취 (전체 스탯 회복!)', currency: 'amber', price: 5, action: (f: FSM) => { f.stats.fullness = 100; f.stats.happiness = 100; f.stats.energy = 100; f.stats.cleanliness = 100; return { success: true, msg: '엄청난 기운이 솟아납니다!' }; } }
        ];

        return [...consumables, ...instantItems];
    }

    public getToolItems(): ShopItem[] {
        return ActionCatalog.filter(a => a.isPermanent && a.price > 0).map(a => ({
            id: a.id,
            type: 'tool' as const,
            icon: a.icon,
            name: a.label,
            desc: a.desc,
            currency: a.currency,
            price: a.price,
            unlockReq: a.unlockReq,
            isPermanent: a.isPermanent
        }));
    }

    public buyItem(item: ShopItem): { success: boolean, msg: string } {
        if (item.isPermanent && this.fsm.hasItem(item.id)) {
            return { success: false, msg: '이미 해금한 영구 아이템입니다.' };
        }

        // Check locks
        if (item.unlockReq) {
            if (item.unlockReq.gold !== undefined && this.totalGoldEarned < item.unlockReq.gold) {
                return { success: false, msg: `[잠김] 누적 획득 골드 ${item.unlockReq.gold} 달성 필요` };
            }
            if (item.unlockReq.tier !== undefined && this.fsm.stats.evolutionTier < item.unlockReq.tier) {
                return { success: false, msg: `[잠김] 진화 단계 레벨 ${item.unlockReq.tier} 필요` };
            }
        }

        if (item.currency === 'gold' && this.fsm.stats.gold >= item.price) {
            this.fsm.stats.gold -= item.price;
            this.processPurchase(item);
            return { success: true, msg: `${item.name} 구매 완료!` };
        } else if (item.currency === 'amber' && this.fsm.stats.amber >= item.price) {
            this.fsm.stats.amber -= item.price;
            this.processPurchase(item);
            return { success: true, msg: `${item.name} 구매 완료!` };
        }
        return { success: false, msg: `${item.currency === 'gold' ? '골드' : '호박석'}가 부족합니다!` };
    }

    private processPurchase(item: ShopItem) {
        if (item.type === 'instant' && item.action) {
            item.action(this.fsm);
        } else {
            if (item.isPermanent) {
                if (!this.fsm.stats.unlockedItems.includes(item.id)) {
                    this.fsm.stats.unlockedItems.push(item.id);
                }
            } else {
                this.fsm.stats.inventory[item.id] = (this.fsm.stats.inventory[item.id] || 0) + 1;
            }
        }
        this.purchases[item.id] = (this.purchases[item.id] || 0) + 1;
        this.fsm.evaluateState();
        this.savePurchases();
    }
}
