import { FSM } from '../fsm';

export type CategoryId = 'feed' | 'train' | 'sleep' | 'wash' | 'interact';

export interface ActionDef {
    id: string;
    categoryId: CategoryId;
    label: string;
    icon: string;
    desc: string;
    currency: 'gold' | 'amber';
    price: number;
    isPermanent?: boolean;
    unlockReq?: { gold?: number, tier?: number };
    enabledWhen: (fsm: FSM) => boolean;
    onSelect: (fsm: FSM) => { success: boolean; msg: string; react?: string };
}

export const ActionCatalog: ActionDef[] = [
    { id: 'feed_fern', categoryId: 'feed', label: '고사리', icon: '🌿', desc: '기본 먹이예요. 포만감을 부드럽게 채워줘요.', currency: 'gold', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_fern') },
    { id: 'feed_conifer', categoryId: 'feed', label: '침엽수', icon: '🌲', desc: '배는 든든하지만 에너지가 조금 필요해요.', currency: 'gold', price: 15, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_conifer') },
    { id: 'feed_vitamin', categoryId: 'feed', label: '비타민', icon: '✨', desc: '기운을 북돋우고 컨디션을 지켜줘요.', currency: 'gold', price: 30, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_vitamin') },
    { id: 'feed_medicine', categoryId: 'feed', label: '특효약', icon: '💊', desc: '아플 때 꼭 필요한 회복 아이템이에요.', currency: 'gold', price: 50, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('feed_medicine') },

    { id: 'train_ball', categoryId: 'train', label: '공놀이', icon: '⚽', desc: '가볍게 뛰놀며 운동해요.', currency: 'gold', price: 50, isPermanent: true, enabledWhen: (f) => f.stats.energy >= 10, onSelect: (f) => f.performSpecificAction('train_ball') },
    { id: 'train_frisbee', categoryId: 'train', label: '프리스비', icon: '🥏', desc: '빠르게 반응하며 체력과 매력을 키워요.', currency: 'gold', price: 150, isPermanent: true, unlockReq: { gold: 100 }, enabledWhen: (f) => f.stats.energy >= 15, onSelect: (f) => f.performSpecificAction('train_frisbee') },
    { id: 'train_discipline', categoryId: 'train', label: '집중 훈련', icon: '📏', desc: '차분함과 지혜를 길러줘요.', currency: 'gold', price: 200, isPermanent: true, unlockReq: { gold: 300 }, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('train_discipline') },
    { id: 'train_walk', categoryId: 'train', label: '산책', icon: '🐾', desc: '밖으로 나가 건강하게 걸어요.', currency: 'gold', price: 300, isPermanent: true, unlockReq: { tier: 1 }, enabledWhen: (f) => f.stats.energy >= 20, onSelect: (f) => f.performSpecificAction('train_walk') },
    { id: 'train_sing', categoryId: 'train', label: '노래', icon: '🎵', desc: '기분 좋게 노래하며 매력을 올려요.', currency: 'gold', price: 400, isPermanent: true, unlockReq: { tier: 1 }, enabledWhen: (f) => f.stats.energy >= 5, onSelect: (f) => f.performSpecificAction('train_sing') },
    { id: 'train_dance', categoryId: 'train', label: '춤추기', icon: '💃', desc: '리듬에 맞춰 신나게 몸을 움직여요.', currency: 'amber', price: 20, isPermanent: true, unlockReq: { tier: 2 }, enabledWhen: (f) => f.stats.energy >= 10, onSelect: (f) => f.performSpecificAction('train_dance') },

    { id: 'sleep_floor', categoryId: 'sleep', label: '바닥 낮잠', icon: '😴', desc: '언제든 편하게 쉴 수 있어요.', currency: 'gold', price: 0, isPermanent: true, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('sleep_floor') },
    { id: 'sleep_outside', categoryId: 'sleep', label: '캠핑 잠자리', icon: '🏕️', desc: '밖에서 자고 상쾌한 아침 보너스를 받아요.', currency: 'gold', price: 100, isPermanent: true, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('sleep_outside') },
    { id: 'sleep_bed', categoryId: 'sleep', label: '포근한 침대', icon: '🛏️', desc: '가장 푹 쉬면서 에너지를 빨리 회복해요.', currency: 'amber', price: 30, isPermanent: true, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('sleep_bed') },

    { id: 'wash_face', categoryId: 'wash', label: '세수', icon: '🫧', desc: '얼굴을 산뜻하게 닦아요.', currency: 'gold', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_face') },
    { id: 'wash_feet', categoryId: 'wash', label: '발 닦기', icon: '🧼', desc: '흙 묻은 발을 깨끗하게 씻어요.', currency: 'gold', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_feet') },
    { id: 'wash_shower', categoryId: 'wash', label: '샤워', icon: '🚿', desc: '시원하게 물줄기를 맞으며 씻어요.', currency: 'gold', price: 15, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_shower') },
    { id: 'wash_bath', categoryId: 'wash', label: '목욕', icon: '🛁', desc: '통째로 푹 담그고 반짝반짝해져요.', currency: 'gold', price: 30, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_bath') },
    { id: 'wash_mud', categoryId: 'wash', label: '진흙 목욕', icon: '🪨', desc: '엉망이 되지만 엄청 즐거워해요.', currency: 'amber', price: 5, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('wash_mud') },

    { id: 'interact_praise', categoryId: 'interact', label: '칭찬하기', icon: '👏', desc: '잘한 일을 칭찬해 기분을 올려줘요.', currency: 'gold', price: 10, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_praise') },
    { id: 'interact_scold', categoryId: 'interact', label: '훈육하기', icon: '💢', desc: '말썽을 부릴 때 차분히 알려줘요.', currency: 'gold', price: 10, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_scold') },
    { id: 'interact_hospital', categoryId: 'interact', label: '병원 가기', icon: '🏥', desc: '검진하거나 치료를 받을 수 있어요.', currency: 'gold', price: 100, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_hospital') },
    { id: 'interact_pasture', categoryId: 'interact', label: '들판 산책', icon: '🌼', desc: '잠깐 들판에 다녀오며 보상을 챙겨와요.', currency: 'gold', price: 30, enabledWhen: () => true, onSelect: (f) => f.performSpecificAction('interact_pasture') },
];

export function getActionsByCategory(categoryId: CategoryId): ActionDef[] {
    return ActionCatalog.filter((action) => action.categoryId === categoryId);
}
