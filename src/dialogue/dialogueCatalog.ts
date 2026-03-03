import { DialogueEntry } from './types';

// Priorities:
// 0: Idle chatter
// 1: Action react
// 2: State hint

export const dialogueCatalog: DialogueEntry[] = [
    // --- State Hints (Priority 2) ---
    // Hungry
    { id: 'hint_hungry_1', text: '배가 꼬르륵거려요... 잎사귀 하나만 무심코 떨어졌으면...', tags: ['state_hungry'], cooldownSec: 300, priority: 2, personalityWeights: { Gluttonous: 2.0, Normal: 1.0 } },
    { id: 'hint_hungry_2', text: '양치식물... 침엽수... 다 먹고싶다...', tags: ['state_hungry'], cooldownSec: 300, priority: 2, personalityWeights: { Gluttonous: 2.0, Active: 1.5, Lazy: 1.5 } },
    { id: 'hint_hungry_3', text: '기운이 없어서 고개가 아래로 꺾일 것 같아.', tags: ['state_hungry'], cooldownSec: 300, priority: 2, followUps: [{ label: '간식 주기', actionId: 'feed_fern' }] },
    { id: 'hint_hungry_4', text: '아무거나 입에 넣고 싶어! 돌멩이는 안 되나?', tags: ['state_hungry'], cooldownSec: 300, priority: 2, personalityWeights: { Gluttonous: 3.0 } },
    { id: 'hint_hungry_5', text: '밥 먹을 시간 지난 거 아니야? 내 배꼽시계는 정확하다구.', tags: ['state_hungry'], cooldownSec: 300, priority: 2, personalityWeights: { Smart: 2.0 } },
    // Dirty
    { id: 'hint_dirty_1', text: '먼지가 너무 많이 묻었어요. 씻고 싶어!', tags: ['state_dirty'], cooldownSec: 300, priority: 2, personalityWeights: { Clean: 2.0, Lazy: 0.5, Normal: 1.0 } },
    { id: 'hint_dirty_2', text: '진흙탕에 구른 것 같아요! 샤워기가 어디 있지?', tags: ['state_dirty'], cooldownSec: 300, priority: 2, personalityWeights: { Clean: 2.0, Active: 1.5 }, followUps: [{ label: '목욕 시키기', actionId: 'wash_bath' }] },
    { id: 'hint_dirty_3', text: '간지러워... 벼룩이 생기진 않았겠지?', tags: ['state_dirty'], cooldownSec: 300, priority: 2 },
    { id: 'hint_dirty_4', text: '에취! 코에 먼지가 들어갔어!', tags: ['state_dirty'], cooldownSec: 300, priority: 2 },
    { id: 'hint_dirty_5', text: '내 예쁜 비늘이 흙투성이가 됐잖아...', tags: ['state_dirty'], cooldownSec: 300, priority: 2, personalityWeights: { Clean: 3.0 } },
    // Sleepy
    { id: 'hint_sleepy_1', text: '눈꺼풀이 무거워져요... 잠자리에 들 시간인가 봐요.', tags: ['state_sleepy'], cooldownSec: 300, priority: 2, personalityWeights: { Lazy: 2.0, Active: 0.5, Normal: 1.0 } },
    { id: 'hint_sleepy_2', text: '하암... 조금만 자고 일어나서 놀면 안 될까요?', tags: ['state_sleepy'], cooldownSec: 300, priority: 2, personalityWeights: { Lazy: 2.0, Gentle: 1.5 } },
    { id: 'hint_sleepy_3', text: '(꾸벅꾸벅 무거운 머리를 주체하지 못하고 있다.)', tags: ['state_sleepy'], cooldownSec: 300, priority: 2, followUps: [{ label: '재우기', actionId: 'sleep_bed' }] },
    { id: 'hint_sleepy_4', text: '밤이 되니까 마법처럼 졸음이 몰려와...', tags: ['state_sleepy'], cooldownSec: 300, priority: 2 },
    { id: 'hint_sleepy_5', text: '지금 눈 감으면 3초 만에 잠들 수 있어.', tags: ['state_sleepy'], cooldownSec: 300, priority: 2, personalityWeights: { Lazy: 2.5 } },
    // Sick
    { id: 'hint_sick_1', text: '콜록콜록... 몸이 이상해요... 약이 필요한 것 같아요.', tags: ['state_sick'], cooldownSec: 120, priority: 2, followUps: [{ label: '특효약 먹이기', actionId: 'feed_medicine' }, { label: '병원 가기', actionId: 'interact_hospital' }] },
    { id: 'hint_sick_2', text: '머리가 어질어질... 열이 나는 것 같아요...', tags: ['state_sick'], cooldownSec: 120, priority: 2, followUps: [{ label: '병원 가기', actionId: 'interact_hospital' }] },
    { id: 'hint_sick_3', text: '온몸이 덜덜 떨려요... 도와주세요.', tags: ['state_sick'], cooldownSec: 120, priority: 2 },
    { id: 'hint_sick_4', text: '아무것도 하기 싫어요... 아파...', tags: ['state_sick'], cooldownSec: 120, priority: 2 },
    // Naughty
    { id: 'hint_naughty_1', text: '흥! 아무것도 안 할 거야! 내 맘대로 할래!', tags: ['state_naughty'], cooldownSec: 300, priority: 2, followUps: [{ label: '엄하게 혼내기', actionId: 'interact_scold' }] },
    { id: 'hint_naughty_2', text: '나 지금 화났어! 다 부숴버릴지도 몰라!', tags: ['state_naughty'], cooldownSec: 300, priority: 2 },
    { id: 'hint_naughty_3', text: '미운 네 살 브라키오사우루스가 뭔지 보여주지!', tags: ['state_naughty'], cooldownSec: 300, priority: 2 },
    { id: 'hint_naughty_4', text: '(반항적인 눈빛으로 무언가를 노려보고 있다)', tags: ['state_naughty'], cooldownSec: 300, priority: 2 },

    // --- Action Reacts (Priority 1) ---
    // Feed
    { id: 'react_feed_fern_1', text: '아삭아삭! 양치식물은 언제 먹어도 맛있지!', tags: ['feed_fern'], cooldownSec: 30, priority: 1, personalityWeights: { Normal: 1.0, Gluttonous: 1.5 } },
    { id: 'react_feed_fern_2', text: '음~ 풀내음! 조금 찔기지만 맛있어.', tags: ['feed_fern'], cooldownSec: 30, priority: 1, personalityWeights: { Gentle: 1.5, Smart: 1.5 } },
    { id: 'react_feed_fern_3', text: '기본 중의 기본! 질리지 않는 맛이야.', tags: ['feed_fern'], cooldownSec: 30, priority: 1, personalityWeights: { Normal: 2.0 } },

    { id: 'react_feed_conifer_1', text: '침엽수! 씹는 맛이 최고야!', tags: ['feed_conifer'], cooldownSec: 30, priority: 1, personalityWeights: { Active: 1.5, Normal: 1.0 } },
    { id: 'react_feed_conifer_2', text: '소화시키는 데 시간이 좀 걸리겠지만 아주 든든해.', tags: ['feed_conifer'], cooldownSec: 30, priority: 1, personalityWeights: { Smart: 2.0, Gluttonous: 1.5 } },
    { id: 'react_feed_conifer_3', text: '이거 완전 솔의 눈 같은 향긋함이네!', tags: ['feed_conifer'], cooldownSec: 30, priority: 1 },

    { id: 'react_feed_vitamin_1', text: '오옷! 새콤달콤 짜릿해!', tags: ['feed_vitamin'], cooldownSec: 30, priority: 1 },
    { id: 'react_feed_vitamin_2', text: '비타민 풀충전! 눈이 번쩍 뜨이는 맛이야.', tags: ['feed_vitamin'], cooldownSec: 30, priority: 1, personalityWeights: { Active: 2.0 } },
    { id: 'react_feed_vitamin_3', text: '신맛 때문에 턱관절이 찌릿해...', tags: ['feed_vitamin'], cooldownSec: 30, priority: 1, personalityWeights: { Lazy: 2.0 } },

    { id: 'react_feed_medicine_1', text: '으엑, 써! 그래도 꾹 참고 먹을게.', tags: ['feed_medicine'], cooldownSec: 30, priority: 1 },
    { id: 'react_feed_medicine_2', text: '약 먹고 빨리 낫고 싶어!', tags: ['feed_medicine'], cooldownSec: 30, priority: 1, personalityWeights: { Active: 1.5, Gentle: 1.5 } },

    // Train (Play)
    { id: 'react_train_ball_1', text: '헤딩 마스터가 될 테야! 슈웃!', tags: ['train_ball'], cooldownSec: 30, priority: 1, personalityWeights: { Active: 2.0, Lazy: 0.1 } },
    { id: 'react_train_ball_2', text: '공 쫓아가는 건 너무 재밌어! 한 번 더?', tags: ['train_ball'], cooldownSec: 30, priority: 1, personalityWeights: { Active: 1.5, Normal: 1.0 } },
    { id: 'react_train_ball_3', text: '이얍! 꼬리로 정확하게 골인!', tags: ['train_ball'], cooldownSec: 30, priority: 1 },

    { id: 'react_train_frisbee_1', text: '원반 캐치! 내 목길이를 얕보지 마라!', tags: ['train_frisbee'], cooldownSec: 30, priority: 1, personalityWeights: { Active: 2.5 } },
    { id: 'react_train_frisbee_2', text: '바람을 가르는 프리스비! 멋져!', tags: ['train_frisbee'], cooldownSec: 30, priority: 1, personalityWeights: { Smart: 1.5 } },
    { id: 'react_train_frisbee_3', text: '이리저리 뛰는 건 힘들어. 다음엔 던져주지 마...', tags: ['train_frisbee'], cooldownSec: 30, priority: 1, personalityWeights: { Lazy: 2.5 } },

    { id: 'react_train_discipline_1', text: '후욱... 나는 참을 수 있다... 화내지 않는다...', tags: ['train_discipline'], cooldownSec: 45, priority: 1, personalityWeights: { Smart: 2.0 } },
    { id: 'react_train_discipline_2', text: '가끔은 이런 엄격한 수련도 필요하지.', tags: ['train_discipline'], cooldownSec: 45, priority: 1, personalityWeights: { Gentle: 1.5 } },

    { id: 'react_train_walk_1', text: '동네 한 바퀴 도는 게 정말 즐거워!', tags: ['train_walk'], cooldownSec: 60, priority: 1, personalityWeights: { Active: 2.0 } },
    { id: 'react_train_walk_2', text: '바깥 공기를 마시니 머리가 맑아져.', tags: ['train_walk'], cooldownSec: 60, priority: 1, personalityWeights: { Smart: 1.5, Gentle: 1.5 } },
    { id: 'react_train_walk_3', text: '다리 아파... 업어줘...', tags: ['train_walk'], cooldownSec: 60, priority: 1, personalityWeights: { Lazy: 2.0 } },

    { id: 'react_train_sing_1', text: '라~ 라라라~♪ 거대 공룡의 세레나데!', tags: ['train_sing'], cooldownSec: 45, priority: 1, personalityWeights: { Normal: 1.5, Active: 1.5 } },
    { id: 'react_train_sing_2', text: '(흥얼흥얼) 나 좀 소질 있을지도?', tags: ['train_sing'], cooldownSec: 45, priority: 1 },

    { id: 'react_train_dance_1', text: '둠칫 둠칫! 길다란 목을 흔들어봐!', tags: ['train_dance'], cooldownSec: 45, priority: 1, personalityWeights: { Active: 2.0 } },
    { id: 'react_train_dance_2', text: '리듬에 몸을 맡겨~!', tags: ['train_dance'], cooldownSec: 45, priority: 1 },

    // Sleep
    { id: 'react_sleep_floor_1', text: '맨바닥이라도 눈만 감으면 꿈나라지.', tags: ['sleep_floor'], cooldownSec: 60, priority: 1, personalityWeights: { Lazy: 1.5 } },
    { id: 'react_sleep_floor_2', text: '등이 배겨서 금방 깰 거 같은데...', tags: ['sleep_floor'], cooldownSec: 60, priority: 1, personalityWeights: { Clean: 2.0 } },

    { id: 'react_sleep_outside_1', text: '밤하늘의 별을 보면서 잠드는 낭만!', tags: ['sleep_outside'], cooldownSec: 60, priority: 1, personalityWeights: { Smart: 2.0 } },
    { id: 'react_sleep_outside_2', text: '밖에 벌레가 너무 많아... 무서워...', tags: ['sleep_outside'], cooldownSec: 60, priority: 1, personalityWeights: { Lonely: 2.0, Clean: 1.5 } },

    { id: 'react_sleep_bed_1', text: '역시 침대가 최고야... 구름 위에 누운 기분.', tags: ['sleep_bed'], cooldownSec: 60, priority: 1, personalityWeights: { Lazy: 2.0, Normal: 1.5 } },
    { id: 'react_sleep_bed_2', text: '침대에서 일어나고 싶지 않아 ㅠㅠ', tags: ['sleep_bed'], cooldownSec: 60, priority: 1, personalityWeights: { Lazy: 2.5 } },

    // Wash
    { id: 'react_wash_face_1', text: '얼굴에 물 한 번 묻혔을 뿐인데 개운해!', tags: ['wash_face'], cooldownSec: 30, priority: 1 },
    { id: 'react_wash_face_2', text: '코에 물 들어갔어! 에취!', tags: ['wash_face'], cooldownSec: 30, priority: 1 },

    { id: 'react_wash_feet_1', text: '발가락 사이사이 꼼꼼하게 닦아야지.', tags: ['wash_feet'], cooldownSec: 30, priority: 1, personalityWeights: { Clean: 2.0 } },
    { id: 'react_wash_feet_2', text: '발이 제일 먼저 더러워지니까 중요해!', tags: ['wash_feet'], cooldownSec: 30, priority: 1 },

    { id: 'react_wash_shower_1', text: '쏴아아아- 워터파크가 따로 없네!', tags: ['wash_shower'], cooldownSec: 60, priority: 1, personalityWeights: { Active: 2.0 } },
    { id: 'react_wash_shower_2', text: '시원한 물줄기 최고야!', tags: ['wash_shower'], cooldownSec: 60, priority: 1 },

    { id: 'react_wash_bath_1', text: '보글보글 거품 목욕이 세상에서 제일 좋아~', tags: ['wash_bath'], cooldownSec: 60, priority: 1, personalityWeights: { Clean: 2.0, Lazy: 1.5 } },
    { id: 'react_wash_bath_2', text: '때를 밀었더니 몸이 한결 가벼워진 기분!', tags: ['wash_bath'], cooldownSec: 60, priority: 1, personalityWeights: { Clean: 2.0, Active: 1.5 } },

    { id: 'react_wash_mud_1', text: '철푸덕! 얼굴까지 진흙팩을 해야 진짜지!', tags: ['wash_mud'], cooldownSec: 60, priority: 1, personalityWeights: { Active: 2.0, Naughty: 2.0 } },
    { id: 'react_wash_mud_2', text: '으악 찝찝해! 이렇게까지 해야 돼?', tags: ['wash_mud'], cooldownSec: 60, priority: 1, personalityWeights: { Clean: 3.0 } },

    // Interact
    { id: 'react_interact_praise_1', text: '칭찬은 브라키오를 춤추게 한다구! 에헤헤.', tags: ['interact_praise'], cooldownSec: 45, priority: 1, personalityWeights: { Gentle: 2.0 } },
    { id: 'react_interact_praise_2', text: '나 잘했지? 더 칭찬해줘!', tags: ['interact_praise'], cooldownSec: 45, priority: 1, personalityWeights: { Lonely: 2.0, Normal: 1.5 } },

    { id: 'react_interact_scold_1', text: '우우... 알았어, 앞으로 안 그럴게...', tags: ['interact_scold'], cooldownSec: 60, priority: 1, personalityWeights: { Gentle: 2.0 } },
    { id: 'react_interact_scold_2', text: '쳇, 이번 한 번만 봐주는 거라고!', tags: ['interact_scold'], cooldownSec: 60, priority: 1, personalityWeights: { Naughty: 2.0 } },

    { id: 'react_interact_hospital_1', text: '주사는 무섭지만 아픈 것보단 나아.', tags: ['interact_hospital'], cooldownSec: 120, priority: 1, personalityWeights: { Smart: 2.0 } },
    { id: 'react_interact_hospital_2', text: '병원 냄새 너무 싫어 ㅠㅠ 안 아프게 해줘요!', tags: ['interact_hospital'], cooldownSec: 120, priority: 1, personalityWeights: { Lonely: 2.0 } },

    { id: 'react_interact_pasture_1', text: '우와! 끝없이 펼쳐진 초원이다! 심호흡 들이쉬고~ 하아.', tags: ['interact_pasture'], cooldownSec: 120, priority: 1, personalityWeights: { Active: 2.0 } },
    { id: 'react_interact_pasture_2', text: '친구들은 다 어디 숨었지?', tags: ['interact_pasture'], cooldownSec: 120, priority: 1, personalityWeights: { Lonely: 2.0 } },

    // --- Idle Chatter: Normal ---
    { id: 'idle_norm_1', text: '오늘은 어떤 재밌는 일이 생길까?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_2', text: '하늘 구름 모양이 꼭 양치식물 같아 보여.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_3', text: '저기 멀리 화산이 보여! 조금 무섭기도 하고...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_4', text: '발톱이 조금 길어진 것 같은데, 기분 탓인가?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_5', text: '내 긴 목이 참 마음에 들어. 멀리 볼 수 있잖아!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_6', text: '바람이 시원하게 불어서 기분이 정말 좋아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_7', text: '나랑 같이 퀴즈나 풀래? 골드가 필요해!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 }, followUps: [{ label: '아르바이트(퀴즈)', actionId: 'btn-start-quiz' }] },
    { id: 'idle_norm_8', text: '목을 길게 빼고 스트레칭을 쭉~', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_9', text: '작은 새들이 내 등에 앉아서 쉬고 가는 게 참 좋아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_10', text: '가끔은 아무것도 안 하고 가만히 있는 것도 좋아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_11', text: '나를 키워줘서 항상 고마워!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_12', text: '어제보다 내 몸집이 조금 더 커진 것 같지 않아?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_13', text: '발 밑의 작은 풀들도 다 소중한 생명이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_14', text: '햇볕이 따뜻해서 눈이 스르르 감기네.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_15', text: '골드를 모아서 상점에서 선물을 사고 싶어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_16', text: '비가 올 때는 잎이 큰 나무 아래로 피해야 해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_17', text: '내 울음소리는 아주 멀리멀리 퍼진단다.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_18', text: '너랑 놀 때가 제일 안심이 되고 즐거워.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_19', text: '오늘 날씨가 어때? 내 기분은 맑음이야!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },
    { id: 'idle_norm_20', text: '가끔은 옛날 쥐라기 시절이 어땠을까 상상해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Normal: 2.0 } },

    // --- Idle Chatter: Gluttonous ---
    { id: 'idle_glut_1', text: '음... 뭔가 씹을 거리가 없을까?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_2', text: '먹어도 먹어도 배가 고픈 기분이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_3', text: '특별 간식을 먹고 나면 세상을 다 가진 기분이 들어!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_4', text: '침엽수 잎은 너무 꼭꼭 씹어야 해서 가끔 귀찮지...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_5', text: '혹시 지금 주머니에 먹을 게 들어있어?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 }, followUps: [{ label: '간식 주기', actionId: 'feed_special' }] },
    { id: 'idle_glut_6', text: '배에 꼬르륵 소리가 나는 건 건강하다는 증거라구!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_7', text: '맛있는 냄새가 바람을 타고 여기까지 날아온 것 같아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_8', text: '위석을 꿀꺽 삼키면 소화가 정말 잘 돼.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_9', text: '나뭇잎 한 장도 남기지 않고 다 먹을 테야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_10', text: '먹박사가 되는 게 내 꿈이야!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_11', text: '아침밥 먹고 뒤돌아서면 바로 점심 생각뿐이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_12', text: '나무젓가락을 씹어도 맛있을까? 농담이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_13', text: '간식 배는 무조건 따로따로 존재하지!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_14', text: '푸드득 소리... 내 뱃속에서 천둥 치는 줄 알았네.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_15', text: '식도를 따라 넘어가는 풀의 느낌이 너무 짜릿해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_16', text: '많이 먹고 푹 자는 게 보약이라고 했어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_17', text: '오늘의 메뉴는... 뷔페로 해줄래?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 }, followUps: [{ label: '듬뿍 먹이기', actionId: 'feed_fern' }] },
    { id: 'idle_glut_18', text: '꿀꺽! 위장 연동운동이 활발해지고 있어!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_19', text: '나에게 먹을 것을 주면 평생 충성할게!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },
    { id: 'idle_glut_20', text: '요리사 자격증은 없지만 미식가 자격증은 있다구!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gluttonous: 2.0 } },

    // --- Idle Chatter: Clean ---
    { id: 'idle_clean_1', text: '발가락 사이에 흙이 끼었나 봐, 신경 쓰여.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_2', text: '비늘이 햇빛을 받아 반짝거리게 매일 닦아야 해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_3', text: '아까 누가 내 꼬리를 밟았어! 얼른 씻어야지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_4', text: '샤워기 물줄기 소리만 들어도 기분이 좋아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_5', text: '머리부터 꼬리 끝까지 깨끗하게 관리할 거야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 }, followUps: [{ label: '가볍게 씻기', actionId: 'wash_face' }] },
    { id: 'idle_clean_6', text: '진흙탕 근처에는 절대로 가지 않을 테야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_7', text: '청결함의 비결은 부지런함이야!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_8', text: '혹시 내 등에 얼룩이 묻어있니?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_9', text: '목욕할 때 거품을 잔뜩 내는 게 핵심이라구.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_10', text: '우와! 바람이 불어도 향긋한 냄새가 나.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_11', text: '아... 목 쪽에 뭐가 묻은 것 같은데 손이 안 닿아...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_12', text: '세균 따위 내 빛나는 피부를 뚫을 수 없지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_13', text: '내 잠자리에는 티끌 하나 떨어지면 안 돼.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_14', text: '먹을 때 입가에 묻히고 먹는 건 딱 질색이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_15', text: '때를 밀 때는 강약 조절이 참 중요해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_16', text: '거울이 있다면 전신을 비춰보고 싶어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_17', text: '빗질 한 번 싹 해주면 기분이 날아갈 텐데!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_18', text: '깔끔하게 씻고 나면 음식도 더 맛있는 기분!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },
    { id: 'idle_clean_19', text: '항상 목욕 도구들을 준비하고 있어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 }, followUps: [{ label: '지금 샤워하기', actionId: 'wash_shower' }] },
    { id: 'idle_clean_20', text: '아름다움의 90퍼센트는 청결에서 나온다!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Clean: 2.0 } },

    // --- Idle Chatter: Active ---
    { id: 'idle_act_1', text: '다리에 근육이 꿈틀거려! 당장 달려나가야 할 것 같아!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_2', text: '가만히 있는 건 정말 지루해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_3', text: '공원에 가서 신나게 뛰어놀고 싶다!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 }, followUps: [{ label: '마을 산책', actionId: 'train_walk' }] },
    { id: 'idle_act_4', text: '운동을 멈추는 건 있을 수 없는 일이지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_5', text: '저기 저 나무까지 누가 먼저 뛰어가나 시합할래?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_6', text: '땀을 흠뻑 흘렸을 때의 성취감이 최고야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_7', text: '내 긴 다리로 달리면 엄청 빠르다구!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_8', text: '공놀이 하자! 빨리 던져봐!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 }, followUps: [{ label: '공놀이', actionId: 'train_ball' }] },
    { id: 'idle_act_9', text: '다같이 몸을 움직여보자! 하나 둘 셋!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_10', text: '오늘도 에너지 100%! 완벽 충전!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_11', text: '목을 빙글빙글 돌리는 것도 아주 좋은 체조가 돼.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_12', text: '점프 한 번 엄청 높게 해볼까?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_13', text: '쉬는 시간 따위 나에겐 필요 없어! 스퍼트!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_14', text: '꼬리치기 훈련을 더 빡세게 해야겠어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_15', text: '바람을 가르며 달리는 그 느낌이 미치도록 좋아!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_16', text: '아자아자! 근손실 오기 전에 움직이자!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_17', text: '심박수가 올라가면 내 피도 뜨거워져!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_18', text: '스포츠는 룰을 지키기 때문에 멋진 거라고.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },
    { id: 'idle_act_19', text: '혹시 프리스비 없어? 나 잡는 거 진짜 잘해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 }, followUps: [{ label: '프리스비', actionId: 'train_frisbee' }] },
    { id: 'idle_act_20', text: '에너지가 흘러넘쳐서 터질 거 같아!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Active: 2.0 } },

    // --- Idle Chatter: Lazy ---
    { id: 'idle_lazy_1', text: '하암... 침대가 날 부르는 것 같은데...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_2', text: '오늘 할 일은 내일로 미뤄도 되지 않을까?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_3', text: '가장 좋은 운동법은 바로 숨쉬기 운동이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_4', text: '포근한 곳에서 꼼짝도 하기 싫어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 }, followUps: [{ label: '침대에서 자기', actionId: 'sleep_bed' }] },
    { id: 'idle_lazy_5', text: '바닥에 누워서 하늘의 구름이나 보고 싶다...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_6', text: '왜 뛰는 걸까? 걸어갈 수 있는데.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_7', text: '너무 피곤해... 에너지 다 썼어...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_8', text: '(꾸벅꾸벅 졸고 있다...)', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_9', text: '누가 입까지 먹이 좀 가져다주면 좋겠네.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_10', text: '세상의 중심에서 낮잠을 자고 싶다.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_11', text: '아무것도 안 하는 중인데 더 격렬하게 아무것도 안 하고 싶다.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_12', text: '에너지 보존 법칙을 온몸으로 실천 중이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_13', text: '말하는 것도 에너지가 들어... 후우...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_14', text: '나를 깨우지 말아줘. 꿈속이 너무 재밌단 말이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_15', text: '몸집이 커서 움직이기가 두 배로 힘들어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_16', text: '세상사 다 귀찮다... 퉤퉤...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_17', text: '저기 멀리 있는 밥까지 닿을 정도로 내 목이 더 길었으면.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_18', text: '뒹굴뒹굴 구르는 게 세상에서 제일 재미난 취미지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_19', text: '스트레스 안 받는 방법 중 최고는 누워있는 거야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 } },
    { id: 'idle_lazy_20', text: '나 좀 그만 귀찮게 하고 불 꺼줘...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lazy: 2.0 }, followUps: [{ label: '그냥 두기', actionId: 'sleep_floor' }] },

    // --- Idle Chatter: Smart ---
    { id: 'idle_smart_1', text: '양치식물과 침엽수의 영양 성분 차이가 궁금한걸.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_2', text: '오를 수 없는 나무는 없다고 생각해. 목만 길다면.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_3', text: '퀴즈 아르바이트라면 언제든 자신있어! 날 뽐낼 기회야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 }, followUps: [{ label: '아르바이트(퀴즈)', actionId: 'btn-start-quiz' }] },
    { id: 'idle_smart_4', text: '지혜를 기르면 세상을 보는 눈이 달라진달까.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_5', text: '어제 읽은 책 내용이 참 흥미로웠지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_6', text: '왜 별들은 반짝이는 걸까? 우주는 참 신비로워.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_7', text: '모든 행동에는 인내심이 따르는 법이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 }, followUps: [{ label: '인내심 훈련', actionId: 'train_discipline' }] },
    { id: 'idle_smart_8', text: '나는 생각한다. 고로 존재한다 🦕.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_9', text: '지식을 쌓는 일은 배고픔을 채우는 것과 통하지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_10', text: '가끔은 나도 천재가 아닐까 싶어!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_11', text: '논리적으로 생각해보면 정답은 늘 하나로 귀결되지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_12', text: '내 뇌의 주름이 조금 더 깊어진 기분이 들어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_13', text: '경험은 훌륭한 스승이지만, 체계적인 학습도 중요하지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_14', text: '날짜가 지나는 걸 보며 시간의 상대성을 느끼고 있어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_15', text: '기초 대사량을 조절하는 방법을 마스터하면 생존력이 높아져.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_16', text: '공룡의 뼈대에 대해 논문을 하나 써볼까?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_17', text: '계산 능력을 키우는 최고의 훈련은 역시 퀴즈야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_18', text: '어리석은 실수를 반복하지 않는 자가 현명한 자지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_19', text: '항상 최적의 동선으로 움직이기 위해 머릿속으로 시뮬레이션 중이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },
    { id: 'idle_smart_20', text: '토론할 상대가 필요해. 나랑 이야기점 해줄래?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Smart: 2.0 } },

    // --- Idle Chatter: Gentle ---
    { id: 'idle_gentle_1', text: '작은 친구들도 다치지 않게 발걸음을 조심해야 해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_2', text: '세상의 모든 생명은 소중하단다.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_3', text: '화내지 않고 사이좋게 지내는 게 최고야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_4', text: '너의 미소를 보면 나도 기분이 참 맑아져.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 }, followUps: [{ label: '쓰다듬기', actionId: 'interact_praise' }] },
    { id: 'idle_gentle_5', text: '바람에 흔들리는 꽃을 보면 마음이 포근해져.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_6', text: '오늘 하루도 평화롭게 지나가길 바라.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_7', text: '혹시 힘든 일 있으면 나한테 다 털어놓아!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_8', text: '우리는 좋은 친구가 될 수 있을 거야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_9', text: '다 같이 둥글게 둥글게 사는 세상!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_10', text: '따뜻한 말 한마디가 참 중요한 것 같아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_11', text: '내 넓은 등은 언제든 쉬어갈 수 있도록 열려있어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_12', text: '싸움은 싫어. 말로 잘 풀어야지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_13', text: '햇볕이 내리쬐는 오후의 나른함은 정말 평화로워.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_14', text: '누군가를 배려하는 마음은 스스로를 기쁘게도 해줘.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_15', text: '너무 급하게 서두르지 않아도 돼. 천천히 해봐.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_16', text: '보듬어주는 사람이 곁에 있다면 아픔도 금방 낫겠지.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_17', text: '토닥토닥. 오늘도 고생 많았다고 말해주고 싶네.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 }, followUps: [{ label: '같이 쓰다듬어주기', actionId: 'interact_praise' }] },
    { id: 'idle_gentle_18', text: '내 목소리가 자장가처럼 부드럽게 들렸으면 좋겠어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_19', text: '서로 눈을 마주보고 웃음짓는 일이 많아졌으면 해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },
    { id: 'idle_gentle_20', text: '네가 행복하면 나도 따라서 행복한걸.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Gentle: 2.0 } },

    // --- Idle Chatter: Lonely ---
    { id: 'idle_lonely_1', text: '주변에 아무도 없으면 어딘가 텅 빈 느낌이야.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_2', text: '나랑 같이 놀아줄래? 쓸쓸해...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_3', text: '머리를 좀 쓰다듬어 주면 기분이 훨씬 나아질 텐데.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 }, followUps: [{ label: '쓰다듬기', actionId: 'interact_praise' }] },
    { id: 'idle_lonely_4', text: '혼자서 밥 먹을 땐 잎사귀도 덜 맛있는 것 같아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_5', text: '혼자 있는 시간은 항상 너무 길게 느껴져.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_6', text: '저기 멀리 누구 지나가나? 아니네...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_7', text: '나를 잊은 건 아니겠지?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_8', text: '나랑 춤출까? 외로움을 날려버리게!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 }, followUps: [{ label: '춤추기', actionId: 'train_dance' }] },
    { id: 'idle_lonely_9', text: '관심이 고파요! 봐주세요!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_10', text: '너랑 같이 있을 때가 가장 행복해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_11', text: '어두운 밤보다 혼자 남겨진 조용한 낮이 더 슬퍼.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_12', text: '그림자가 내 유일한 대화 상대가 되진 않았으면 좋겠어.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_13', text: '나만 두고 어디 간 건 아니라고 말해줘.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_14', text: '소리가 없으니까 내 심장 뛰는 소리만 들려...', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_15', text: '내가 너무 크니까 다치게 할까봐 멀리하는 걸까?', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_16', text: '조금 있다가 또 올 거지? 꼭 약속해!', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_17', text: '누구든지 좋으니까 내 이름 한 번만 불러주면 좋겠다.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_18', text: '마음에 난 빈 자리는 맛있는 걸 먹는다고 채워지지 않아.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_19', text: '안녕? 나랑 이야기 조금만 하고 가주라.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
    { id: 'idle_lonely_20', text: '가끔 네가 바쁠 땐 나 혼자 울적해지기도 해.', tags: ['idle'], cooldownSec: 120, priority: 0, personalityWeights: { Lonely: 2.0 } },
];
