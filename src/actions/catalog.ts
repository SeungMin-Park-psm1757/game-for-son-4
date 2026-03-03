// src/actions/catalog.ts
import { FSM } from '../fsm';

export type CategoryId = 'feed' | 'train' | 'sleep' | 'wash' | 'interact';

export interface ActionDef {
    id: string; // Serves as productId
    categoryId: CategoryId;
    label: string;
    icon: string;
    desc: string;
    currency: 'gold' | 'amber';
    price: number;
    isPermanent?: boolean; // If true, buying once unlocks it forever. Else it's consumable.
    unlockReq?: { gold?: number, tier?: number }; // Requirements to buy
    enabledWhen: (fsm: FSM) => boolean;
    onSelect: (fsm: FSM) => { success: boolean; msg: string; react?: string };
}

export const ActionCatalog: ActionDef[] = [
    // --- FEED (Consumables) ---
    { id: 'feed_fern', categoryId: 'feed', label: '양치식물', icon: '🌿', desc: '가장 기본적인 풀입니다.', currency: 'gold', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_fern') },
    { id: 'feed_conifer', categoryId: 'feed', label: '침엽수', icon: '🌲', desc: '조금 질기지만 포만감이 큽니다.', currency: 'gold', price: 15, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_conifer') },
    { id: 'feed_vitamin', categoryId: 'feed', label: '비타민', icon: '🍋', desc: '면역력을 높여 질병을 예방합니다.', currency: 'gold', price: 30, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_vitamin') },
    { id: 'feed_medicine', categoryId: 'feed', label: '알약', icon: '💊', desc: '질병을 치료하는 특효약입니다.', currency: 'gold', price: 50, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_medicine') },

    // --- TRAIN (Tools - Permanent) ---
    { id: 'train_ball', categoryId: 'train', label: '공놀이', icon: '⚽', desc: '기본적인 훈련 도구입니다.', currency: 'gold', price: 50, isPermanent: true, enabledWhen: (f) => f.stats.energy >= 10, onSelect: (f) => f.performSpecificAction('train_ball') },
    { id: 'train_frisbee', categoryId: 'train', label: '프리스비', icon: '🥏', desc: '더 큰 보상을 줍니다.', currency: 'gold', price: 150, isPermanent: true, unlockReq: { gold: 100 }, enabledWhen: (f) => f.stats.energy >= 15, onSelect: (f) => f.performSpecificAction('train_frisbee') },
    { id: 'train_discipline', categoryId: 'train', label: '절제 키우기', icon: '🦴', desc: '참을성을 길러줍니다.', currency: 'gold', price: 200, isPermanent: true, unlockReq: { gold: 300 }, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('train_discipline') },
    { id: 'train_walk', categoryId: 'train', label: '산책', icon: '🐾', desc: '체력을 길러주는 산책 코스입니다.', currency: 'gold', price: 300, isPermanent: true, unlockReq: { tier: 1 }, enabledWhen: (f) => f.stats.energy >= 20, onSelect: (f) => f.performSpecificAction('train_walk') },
    { id: 'train_sing', categoryId: 'train', label: '노래', icon: '🎵', desc: '즐겁게 노래를 부릅니다.', currency: 'gold', price: 400, isPermanent: true, unlockReq: { tier: 1 }, enabledWhen: (f) => f.stats.energy >= 5, onSelect: (f) => f.performSpecificAction('train_sing') },
    { id: 'train_dance', categoryId: 'train', label: '춤', icon: '💃', desc: '신나게 춤을 춥니다.', currency: 'amber', price: 20, isPermanent: true, unlockReq: { tier: 2 }, enabledWhen: (f) => f.stats.energy >= 10, onSelect: (f) => f.performSpecificAction('train_dance') },

    // --- SLEEP (Permanent Unlocks) ---
    { id: 'sleep_floor', categoryId: 'sleep', label: '맨바닥', icon: '💤', desc: '딱딱하지만 잠은 잘 수 있습니다.', currency: 'gold', price: 0, isPermanent: true, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('sleep_floor') },
    { id: 'sleep_outside', categoryId: 'sleep', label: '마당', icon: '🏕️', desc: '밖에서 잡니다. (효율 낮음)', currency: 'gold', price: 100, isPermanent: true, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('sleep_outside') },
    { id: 'sleep_bed', categoryId: 'sleep', label: '최고급 침대', icon: '🛌', desc: '푹신한 침대입니다. (회복률 최고)', currency: 'amber', price: 30, isPermanent: true, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('sleep_bed') },

    // --- WASH (Consumables) ---
    { id: 'wash_face', categoryId: 'wash', label: '세수', icon: '💧', desc: '가볍게 세수를 합니다.', currency: 'gold', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_face') },
    { id: 'wash_feet', categoryId: 'wash', label: '발씻기', icon: '🦶', desc: '더러워진 발을 씻습니다.', currency: 'gold', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_feet') },
    { id: 'wash_shower', categoryId: 'wash', label: '샤워', icon: '🚿', desc: '개운하게 샤워 물을 뿌립니다.', currency: 'gold', price: 15, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_shower') },
    { id: 'wash_bath', categoryId: 'wash', label: '목욕', icon: '🛁', desc: '욕조에서 피로를 풉니다.', currency: 'gold', price: 30, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_bath') },
    { id: 'wash_mud', categoryId: 'wash', label: '진흙목욕', icon: '💩', desc: '피부에 양보하세요. (재미 증가)', currency: 'amber', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_mud') },

    // --- INTERACT (Consumables) ---
    { id: 'interact_praise', categoryId: 'interact', label: '칭찬 간식', icon: '😍', desc: '가벼운 간식으로 칭찬합니다.', currency: 'gold', price: 10, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_praise') },
    { id: 'interact_scold', categoryId: 'interact', label: '엄격한 훈육', icon: '💢', desc: '잘못된 행동을 교정합니다.', currency: 'gold', price: 10, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_scold') },
    { id: 'interact_hospital', categoryId: 'interact', label: '병원 진료', icon: '🏥', desc: '아프면 병원에 가야죠.', currency: 'gold', price: 100, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_hospital') },
    { id: 'interact_pasture', categoryId: 'interact', label: '들판 입장권', icon: '🌿', desc: '5분간 넓은 들판에 다녀옵니다.', currency: 'gold', price: 30, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_pasture') }
];

export function getActionsByCategory(categoryId: CategoryId): ActionDef[] {
    return ActionCatalog.filter(a => a.categoryId === categoryId);
}

