'use strict';

const STAT_KEYS = ['STR', 'DEX', 'AGE', 'CON', 'POW', 'INT', 'APP'];
const STAT_LABELS = {
  STR: '筋力',
  DEX: '敏捷力',
  AGE: '器用度',
  CON: '体力',
  POW: '精神力',
  INT: '知力',
  APP: '魅力'
};

const ORIGINS = {
  nest: {
    label: '巣の出身',
    note: 'APP/INTが高め、CON/POWが低め。豊かな巣で育ったフィクサー向け。',
    dice: { STR: '3d6', DEX: '3d6', AGE: '3d6', CON: '2d6', POW: '1d6', INT: '2d6+6', APP: '2d6+6' }
  },
  backstreet: {
    label: '裏路地の出身',
    note: 'AGE/DEXが高め、STR/CON/POWは標準。裏路地で鍛えられた生存者向け。',
    dice: { STR: '3d6', DEX: '2d6+6', AGE: '2d6+6', CON: '3d6', POW: '3d6', INT: '2d6', APP: '2d6' }
  },
  outskirts: {
    label: '外郭の出身',
    note: 'STR/CON/POWが高め、APPが低め。外郭で生き延びたタフな人物向け。',
    dice: { STR: '2d6+6', DEX: '3d6', AGE: '3d6', CON: '2d6+6', POW: '2d6+6', INT: '2d6', APP: '1d6' }
  },
  prosthetic: {
    label: '全身義体',
    note: 'APPのみ2d6。その他の主能力値は義体パーツやVC裁定に合わせて手入力してください。',
    dice: { STR: '義体', DEX: '義体', AGE: '義体', CON: '義体', POW: '義体', INT: '義体', APP: '2d6' }
  }
};

const SPECIALTIES = {
  combat: {
    label: '戦闘',
    note: '正面戦闘に強いアタッカー型。STR+2、CON+2。',
    mods: { STR: 2, CON: 2 },
    fixed: { name: '臨戦無退', text: '感情レベルが上昇するたびに、パワー1・忍耐1を得る。' },
    choices: [
      { name: '技量', text: '攻撃的中時、または防御ダイスでマッチ勝利時、混乱ダメージを3与える。' },
      { name: '突撃姿勢', text: '幕の開始時、脆弱3・パワー1を得る。' },
      { name: '高揚', text: '感情レベル上昇時、その幕に限り、速度ダイス1つ分の一方攻撃またはマッチで使用する戦闘技能の合計コストを-2する。' }
    ]
  },
  guard: {
    label: '護衛',
    note: '仲間を守るディフェンダー型。CON+2、POW+2。',
    mods: { CON: 2, POW: 2 },
    fixed: { name: '鉄壁', text: '永続的に忍耐1を得る。感情レベルが3以上なら、忍耐2を得る効果に置き換わる。' },
    choices: [
      { name: '傷兵保護', text: '幕の終了時、最もダメージを受けた味方に保護2を付与する。' },
      { name: '受け止める', text: '毎幕1回、一方攻撃を受けたときに防御ダイス1つを得て防御する。' },
      { name: '救援', text: '応急手当判定を行うとき、消費する光が2になり、判定時+6の補正を受ける。' }
    ]
  },
  assassination: {
    label: '暗殺',
    note: '速度と奇襲に寄せたスピード型。DEX+2、AGE+2。',
    mods: { DEX: 2, AGE: 2 },
    fixed: { name: '刹那の奇襲', text: '毎幕の速度ダイスで最低値が出た場合、一度だけ速度ダイスを振りなおす。' },
    choices: [
      { name: '隙を狙う', text: 'マッチ時、自分の速度が相手の速度より高い場合、守備ダイス1つを破壊する。' },
      { name: '蝕む一撃', text: '攻撃的中時に付与する火傷・出血・麻痺の値を+1する。' },
      { name: '間隙', text: '自分の速度が相手より2以上高い場合、攻撃ダイスの達成値+2。反撃ダイスには適用しない。' }
    ]
  },
  intel: {
    label: '情報収集',
    note: '調査・交渉・観察に強いサポート型。INT+2、AGE+2。',
    mods: { INT: 2, AGE: 2 },
    fixed: { name: '弱点把握', text: '毎幕開始時に1回、キャラクター1人を選択して1d6を振る。選択したキャラクターに自身の攻撃が命中したとき、出目に応じた耐性を1段階減少させてダメージを算出する。1:斬撃耐性 / 2:斬撃混乱耐性 / 3:貫通耐性 / 4:貫通混乱耐性 / 5:打撃耐性 / 6:打撃混乱耐性。' },
    choices: [
      { name: '情報把握', text: 'INTを用いるすべての行為判定の達成値+1。' },
      { name: '巧みな話術', text: '交渉判定・対話判定の達成値+2。' },
      { name: '慧眼', text: '探知判定・観測判定の達成値+2。' }
    ]
  }
};

const LIGHT_SEEDS = [
  '力こそがすべて',
  '目指すべき目標',
  '決して曲げたくない信念',
  '忠誠や誰かに対する恩義',
  '隠していたい過去や後悔',
  '守るべきものの存在',
  '地位への固執',
  'ある人物や組織への復讐',
  '技術崇拝',
  '特定の何かへの妄執'
];

const TACTIC_SKILLS = [
  tacticSkill('戦術指揮・攻勢', '覚醒', [
    [1, '1幕', 'ランダムな味方2人にパワー+1'],
    [2, '1幕', 'ランダムな味方2人にパワー+2'],
    [3, '1幕', 'ランダムな味方2人にパワー+3']
  ]),
  tacticSkill('戦術指揮・後援', '覚醒', [
    [1, '1幕', 'ランダムな味方2人に忍耐+1'],
    [2, '1幕', 'ランダムな味方2人に忍耐+2'],
    [3, '1幕', 'ランダムな味方2人に忍耐+3']
  ]),
  tacticSkill('戦術指揮・迅速', '覚醒', [
    [1, '1幕', 'ランダムな味方2人にクイック+1'],
    [2, '1幕', 'ランダムな味方2人にクイック+2'],
    [3, '1幕', 'ランダムな味方2人にクイック+3']
  ]),
  tacticSkill('戦術指揮・休止', '覚醒', [
    [1, '1幕', '味方全員の光回復+1'],
    [2, '1幕', '味方全員の光回復+2'],
    [3, '1幕', '味方全員の光回復+3']
  ]),
  tacticSkill('戦術指揮・活力', '覚醒', [
    [1, '1幕', '味方全員の与えるダメージ量+2'],
    [2, '1幕', '味方全員の与えるダメージ量+4'],
    [3, '1幕', '味方全員の与えるダメージ量+6']
  ]),
  tacticSkill('戦術指揮・守勢', '覚醒', [
    [1, '1幕', '味方全員に保護+2'],
    [2, '2幕', '味方全員に保護+2'],
    [3, '3幕', '味方全員に保護+2']
  ]),
  tacticSkill('戦術指揮・重合', '覚醒', [
    [1, '1幕', '味方全員に混乱保護+2'],
    [2, '2幕', '味方全員に混乱保護+2'],
    [3, '3幕', '味方全員に混乱保護+2']
  ]),
  tacticSkill('戦術指揮・蓄積', '覚醒', [
    [1, '2幕', '味方全員の蓄積エモーション+1'],
    [2, '3幕', '味方全員の蓄積エモーション+1'],
    [3, '4幕', '味方全員の蓄積エモーション+1']
  ]),
  tacticSkill('戦術指揮・背水', '崩壊', [
    [1, '1幕', '味方全員の忍耐+2、味方全員のパワー-1'],
    [2, '1幕', '味方全員の忍耐+3、味方全員のパワー-1'],
    [3, '1幕', '味方全員の忍耐+4、味方全員のパワー-1']
  ]),
  tacticSkill('戦術指揮・突撃', '崩壊', [
    [1, '1幕', '味方全員の忍耐-1、味方全員のパワー+2'],
    [2, '1幕', '味方全員の忍耐-1、味方全員のパワー+3'],
    [3, '1幕', '味方全員の忍耐-1、味方全員のパワー+4']
  ]),
  tacticSkill('戦術指揮・撤退', '崩壊', [
    [1, '1幕', '味方全員のパワー-3、味方全員の速度判定の達成値+2'],
    [2, '1幕', '味方全員のパワー-3、味方全員の速度判定の達成値+4'],
    [3, '1幕', '味方全員のパワー-3、味方全員の速度判定の達成値+6']
  ])
];

const TACTIC_SKILL_OPTIONS = TACTIC_SKILLS.flatMap((skill) => skill.levels.map((level) => ({
  value: `${skill.name} SL${level.sl}`,
  label: `${skill.name} SL${level.sl}`,
  skillName: skill.name,
  usage: skill.usage,
  emotion: skill.emotion,
  sl: level.sl,
  time: level.time,
  effect: level.effect
})));

const TACTIC_SKILL_OPTION_MAP = Object.fromEntries(TACTIC_SKILL_OPTIONS.map((option) => [option.value, option]));

const RANK_TABLE = [
  { grade: '9級', level: 1, fame: 0, next: 20 },
  { grade: '8級', level: 2, fame: 20, next: 50 },
  { grade: '7級', level: 3, fame: 50, next: 100 },
  { grade: '6級', level: 4, fame: 100, next: 200 },
  { grade: '5級', level: 5, fame: 200, next: 400 },
  { grade: '4級', level: 6, fame: 400, next: 700 },
  { grade: '3級', level: 7, fame: 700, next: 1100 },
  { grade: '2級', level: 8, fame: 1100, next: 1600 },
  { grade: '1級', level: 9, fame: 1600, next: 2600 },
  { grade: '特色', level: 10, fame: 2600, next: null }
];

const OFFICE_LEVEL_TABLE = [
  { level: 1, fame: 0, next: 40 },
  { level: 2, fame: 40, next: 100 },
  { level: 3, fame: 100, next: 180 },
  { level: 4, fame: 180, next: 280 },
  { level: 5, fame: 280, next: 400 },
  { level: 6, fame: 400, next: 540 },
  { level: 7, fame: 540, next: 700 },
  { level: 8, fame: 700, next: 880 },
  { level: 9, fame: 880, next: 1080 },
  { level: 10, fame: 1080, next: null }
];

const ENHANCE_COST_TABLE = [
  { min: 0, max: 5, bonus: 0, cost: 100000 },
  { min: 6, max: 11, bonus: 1, cost: 250000 },
  { min: 12, max: 17, bonus: 2, cost: 500000 },
  { min: 18, max: 23, bonus: 3, cost: 750000 },
  { min: 24, max: 29, bonus: 4, cost: 1000000 },
  { min: 30, max: 35, bonus: 5, cost: 1500000 },
  { min: 36, max: 41, bonus: 6, cost: 2000000 },
  { min: 42, max: 47, bonus: 7, cost: 3000000 },
  { min: 48, max: 53, bonus: 8, cost: 5000000 },
  { min: 54, max: 59, bonus: 9, cost: 7500000 },
  { min: 60, max: 65, bonus: 10, cost: 10000000 }
];

const RESISTANCES = ['脆弱', '弱点', '普通', '抵抗', '耐性', '免疫'];
const WEAPON_RANKS = ['D', 'C', 'B', 'A', 'S'];
const ATTACK_TYPES = ['斬', '貫', '打', '斬撃', '貫通', '打撃', '斬貫', '斬打', '貫打', '斬貫打', '防御', '回避', '混乱', 'その他'];

const OFFICIAL_WEAPONS = [
  officialWeapon('格闘', 'D', '素手', 0, '打', '0', '0', '近', 0, ''),
  officialWeapon('格闘', 'D', 'セスタス', 2, '打', '1', '+2', '近', 30000, ''),
  officialWeapon('格闘', 'D', 'ナックルダスター', 4, '打', '2', '+2', '近', 40000, ''),
  officialWeapon('格闘', 'D', '拳打強化指輪', 2, '打', '1', '+2', '近', 45000, 'STRが6以下ならSTRに+1のボーナス'),
  officialWeapon('格闘', 'C', 'アイアンナックル', 4, '打', '4', '+2', '近', 450000, ''),
  officialWeapon('格闘', 'C', 'クロー', 4, '斬', '4', '+2', '近', 450000, ''),
  officialWeapon('格闘', 'C', 'バグナウ', 6, '斬打', '5', '+1', '近', 525000, ''),
  officialWeapon('格闘', 'C', 'ジャマダハル', 6, '斬貫', '5', '+1', '近', 525000, ''),
  officialWeapon('格闘', 'C', 'ヒートグローブ', 4, '打', '4', '+2', '近', 560000, '燃焼'),
  officialWeapon('格闘', 'C', 'バタ', 8, '斬貫', '6', '+1', '近', 600000, ''),
  officialWeapon('格闘', 'C', 'ヘビーナックル', 10, '打', '7', '+2', '近', 675000, ''),
  officialWeapon('格闘', 'B', 'スチームガントレット', 10, '打', '9', '+2', '近', 3450000, '煙(2)'),
  officialWeapon('格闘', 'B', 'エネルギーガントレット', 10, '打', '9', '+2', '近', 3450000, '充電(2)'),
  officialWeapon('格闘', 'B', 'バルカンガントレット', 12, '打', '10', '+2', '近', 3750000, '燃焼'),
  officialWeapon('格闘', 'B', 'コオリグローブ', 12, '打', '10', '+2', '近', 4500000, '麻痺。攻撃対象と同じ速度のランダムな敵一体に麻痺+2'),
  officialWeapon('格闘', 'B', '風の谷工房のガントレット', 12, '打', '10', '+2', '近', 4500000, '遠距離攻撃とマッチするとき、相手の速度値-2'),
  officialWeapon('格闘', 'B', 'ミール工房のガントレット', 16, '打', '12', '+2', '近', 5250000, '速度ダイスをロールする直前に任意で判定値を1/2にする宣言を行う。宣言後、その幕において与ダメージ+5'),
  officialWeapon('格闘', 'A', 'アラス工房のグローブ', 16, '打', '14', '+2', '近', 30000000, '戦闘技能「判定減少」のコスト-1'),

  officialWeapon('片手剣', 'D', 'ナイフ', 3, '斬貫', '3', '-1', '近', 62500, '出血 / 投擲'),
  officialWeapon('片手剣', 'D', '屠殺ノコギリ', 4, '斬', '4', '0', '近', 75000, '出血'),
  officialWeapon('片手剣', 'D', 'シミター', 8, '斬', '6', '0', '近', 80000, ''),
  officialWeapon('片手剣', 'D', 'ショートソード', 6, '斬貫打', '5', '-2', '近', 87500, '出血'),
  officialWeapon('片手剣', 'D', 'スチールソード', 8, '斬貫', '6', '-1', '近', 88000, '貫通+1'),
  officialWeapon('片手剣', 'D', '解体包丁', 6, '斬', '5', '0', '近', 100000, '出血 / 出血付与値+1'),
  officialWeapon('片手剣', 'D', '短刀', 8, '斬貫', '6', '-1', '近', 100000, '出血'),
  officialWeapon('片手剣', 'D', 'ブロードソード', 12, '斬打', '7', '-1', '近', 100000, ''),
  officialWeapon('片手剣', 'D', '銃刀', 12, '斬貫打', '7', '-2', '近', 125000, '出血'),
  officialWeapon('片手剣', 'C', '良質なナイフ', 4, '斬貫', '5', '-1', '近', 525000, ''),
  officialWeapon('片手剣', 'C', 'ヒートナイフ', 4, '斬貫', '5', '-1', '近', 650000, ''),
  officialWeapon('片手剣', 'C', 'レイピア', 6, '斬貫', '7', '-1', '近', 810000, '貫通+2'),
  officialWeapon('片手剣', 'C', '脇差', 8, '斬貫', '8', '-1', '近', 935000, '出血'),
  officialWeapon('片手剣', 'C', 'マンゴーシュ', 8, '斬貫', '8', '-1', '近', 825000, '攻撃ダイスによる被ダメージ-1'),
  officialWeapon('片手剣', 'C', 'ファルシオン', 12, '斬', '10', '0', '近', 900000, ''),
  officialWeapon('片手剣', 'C', 'ロングソード', 18, '斬貫打', '13', '-2', '近', 1125000, ''),
  officialWeapon('片手剣', 'C', '打刀', 14, '斬貫打', '11', '-2', '近', 1200000, '出血'),
  officialWeapon('片手剣', 'B', '忍刀', 8, '斬貫', '10', '-1', '近', 3750000, '出血'),
  officialWeapon('片手剣', 'B', '処刑人の剣', 14, '斬打', '14', '-1', '近', 4000000, ''),
  officialWeapon('片手剣', 'B', 'エネルギーブレイド', 16, '斬', '14', '0', '近', 5000000, '充電(3)'),
  officialWeapon('片手剣', 'B', 'スチームブレード', 16, '斬', '14', '0', '近', 5000000, '煙(3)'),
  officialWeapon('片手剣', 'B', '太刀', 18, '斬貫打', '15', '-2', '近', 5200000, '出血'),
  officialWeapon('片手剣', 'B', 'スティグマ工房のロングソード', 18, '斬貫打', '16', '-2', '近', 5500000, '燃焼'),
  officialWeapon('片手剣', 'A', 'スキアヴォーナ', 20, '斬', '18', '-1', '近', 35500000, '攻撃ダイスによる被ダメージ-4'),
  officialWeapon('片手剣', 'S', '狼牙工房のナイフ', 8, '斬貫', '14', '-1', '近', 50000000, '出血 / 投擲'),
  officialWeapon('片手剣', 'S', 'クリスタルナハトエンの双剣', 36, '斬貫', '28', '-1', '近', 75000000, '片手装備不可'),
  officialWeapon('片手剣', 'S', 'レーヴァテイン', 28, '斬', '24', '0', '近', 81250000, '燃焼'),
  officialWeapon('片手剣', 'S', 'デュランダル', 24, '斬', '22', '0', '近', 90000000, '戦闘技能「攻勢」のコスト-1'),

  officialWeapon('両手剣', 'D', '粗悪な鉄大剣', 16, '斬打', '12', '-3', '近', 140000, ''),
  officialWeapon('両手剣', 'D', 'チェーンソー', 22, '斬', '15', '-2', '近', 212500, '麻痺'),
  officialWeapon('両手剣', 'C', 'ツヴァイハンダー', 20, '斬貫', '16', '-3', '近', 1350000, ''),
  officialWeapon('両手剣', 'C', 'エストック', 16, '斬貫', '14', '-3', '近', 1450000, '貫通+2'),
  officialWeapon('両手剣', 'C', 'バスタードソード', 28, '斬貫打', '20', '-4', '近', 1650000, ''),
  officialWeapon('両手剣', 'C', 'フレイムブレード', 20, '斬打', '16', '-3', '近', 1680000, '燃焼'),
  officialWeapon('両手剣', 'C', '大太刀', 24, '斬貫打', '18', '-4', '近', 1875000, '出血'),
  officialWeapon('両手剣', 'B', 'クレイモア', 28, '斬貫打', '22', '-4', '近', 6000000, ''),
  officialWeapon('両手剣', 'B', '野太刀', 24, '斬貫打', '20', '-4', '近', 6750000, '出血'),
  officialWeapon('両手剣', 'B', 'グレートソード', 34, '斬', '25', '-2', '近', 6750000, ''),
  officialWeapon('両手剣', 'B', 'フランベルジュ', 20, '斬貫', '19', '-3', '近', 6800000, '貫通+4'),
  officialWeapon('両手剣', 'B', 'ジェットブレイド', 24, '斬', '20', '-2', '近', 6875000, '煙(4)'),
  officialWeapon('両手剣', 'B', 'ライトニングブレイド', 24, '斬', '20', '-2', '近', 6875000, '充電(4)'),
  officialWeapon('両手剣', 'A', 'スティグマ工房のグレイモア', 25, '斬貫打', '25', '-3', '近', 41500000, '燃焼'),
  officialWeapon('両手剣', 'S', 'ムク工房の太刀', 36, '斬貫', '30', '-3', '近', 420000000, '出血 / 戦闘技能「光回復」のコスト-2 / 次の攻撃のコスト-1'),
  officialWeapon('両手剣', 'S', 'ホイールズ・インダストリーの機構大剣', 46, '斬', '35', '-2', '近', 166500000, 'マッチ勝利:相手の次のダイスを破壊'),

  officialWeapon('槍', 'D', 'ジャベリン', 6, '貫', '5', '-1', '近', 70000, '投擲'),
  officialWeapon('槍', 'D', 'ショートスピア', 7, '貫', '6', '-1', '近', 80000, ''),
  officialWeapon('槍', 'D', 'スピア', 11, '貫', '8', '-1', '近', 100000, ''),
  officialWeapon('槍', 'C', 'アールシェピース', 11, '貫', '10', '-1', '近', 900000, ''),
  officialWeapon('槍', 'C', 'ロングスピア', 15, '貫', '12', '-1', '近', 1050000, ''),
  officialWeapon('槍', 'C', 'パイク', 23, '貫打', '16', '-2', '近', 1350000, ''),
  officialWeapon('槍', 'C', '薙刀', 19, '斬貫', '14', '-2', '近', 1500000, '出血'),
  officialWeapon('槍', 'B', 'フレイムピラム', 14, '貫', '12', '-1', '近', 4375000, '燃焼 / 投擲'),
  officialWeapon('槍', 'B', 'コルセスカ', 19, '貫', '16', '-1', '近', 4500000, ''),
  officialWeapon('槍', 'B', 'ハルチザン', 23, '斬貫', '18', '-2', '近', 5000000, ''),
  officialWeapon('槍', 'B', 'ランス', 27, '貫打', '20', '-2', '近', 5500000, ''),
  officialWeapon('槍', 'B', 'グレイブ', 31, '斬貫', '22', '-2', '近', 6000000, ''),
  officialWeapon('槍', 'B', 'スチームスピア', 23, '斬貫', '18', '-2', '近', 6250000, '煙(3)'),
  officialWeapon('槍', 'B', 'エネルギースピア', 23, '斬貫', '18', '-2', '近', 6250000, '充電(3)'),
  officialWeapon('槍', 'A', 'スポントゥーン', 27, '斬貫', '22', '-2', '近', 30000000, ''),
  officialWeapon('槍', 'A', '灯火の槍', 21, '斬貫', '19', '-2', '近', 32200000, '燃焼'),
  officialWeapon('槍', 'A', 'ホーネットハープーン', 15, '貫', '16', '-1', '近', 32500000, '投擲。投擲した場合でも次の幕に再利用可'),
  officialWeapon('槍', 'A', '木の葉工房の槍', 23, '貫', '20', '-1', '近', 36000000, '煙(4)'),
  officialWeapon('槍', 'S', 'アラス工房の騎兵槍', 35, '貫', '28', '-1', '近', 110000000, '戦闘技能「判定減少」のコスト-1'),
  officialWeapon('槍', 'S', '激動の青龍刀', 31, '斬貫', '26', '-2', '近', 125000000, '火傷 / 感情レベルが2つ上昇するなら全ダイス判定+1'),

  officialWeapon('斧', 'D', 'トマホーク', 7, '斬', '6', '-1', '近', 80000, '投擲'),
  officialWeapon('斧', 'D', 'ブージ', 9, '斬', '7', '-1', '近', 90000, ''),
  officialWeapon('斧', 'D', 'ハンドアックス', 14, '斬', '10', '-1', '近', 150000, '出血'),
  officialWeapon('斧', 'C', 'フランキスカ', 12, '斬', '11', '-1', '近', 975000, ''),
  officialWeapon('斧', 'C', 'ポールアックス', 20, '斬貫', '15', '-2', '近', 1275000, ''),
  officialWeapon('斧', 'C', 'ブロードアックス', 16, '斬', '13', '-1', '近', 1400000, '出血'),
  officialWeapon('斧', 'C', 'バルディッシュ', 24, '斬', '17', '-1', '近', 1425000, ''),
  officialWeapon('斧', 'C', '高熱の斧', 18, '斬打', '14', '-2', '近', 1500000, '燃焼'),
  officialWeapon('斧', 'B', 'ハルバード', 26, '斬貫', '20', '-2', '近', 5250000, ''),
  officialWeapon('斧', 'B', 'グレートアックス', 32, '斬', '23', '-1', '近', 6250000, ''),
  officialWeapon('斧', 'B', 'スチームアクス', 26, '斬', '20', '-2', '近', 6600000, '煙(3)'),
  officialWeapon('斧', 'B', 'エネルギーアックス', 26, '斬', '20', '-2', '近', 6600000, '充電(3)'),
  officialWeapon('斧', 'A', 'クーゼ', 34, '斬貫', '26', '-2', '近', 35000000, ''),
  officialWeapon('斧', 'A', '火鎌の双斧', 42, '斬打', '30', '-2', '近', 50000000, '燃焼 / 片手装備不可'),
  officialWeapon('斧', 'S', 'ケヤキ工房のクレセントアックス', 25, '斬', '24', '-1', '近', 100000000, '次の攻撃のコスト-1'),

  officialWeapon('棍杖', 'D', '六尺棒', 4, '打', '3', '+1', '近', 50000, ''),
  officialWeapon('棍杖', 'D', '松明', 4, '打', '3', '+1', '近', 60000, '燃焼 / 暗闇の中での探索判定時+1'),
  officialWeapon('棍杖', 'D', 'ブラックジャック', 6, '打', '4', '+1', '近', 60000, ''),
  officialWeapon('棍杖', 'D', 'スタンバトン', 6, '打', '4', '+1', '近', 75000, ''),
  officialWeapon('棍杖', 'D', 'ファイアーバット', 8, '打', '5', '+1', '近', 100000, '燃焼。任意のタイミングで燃焼攻撃のコスト-1、発動後2幕使用不可。火傷付与時、自身にも火傷1。'),
  officialWeapon('棍杖', 'C', 'ヌンチャク', 6, '打', '6', '+1', '近', 600000, ''),
  officialWeapon('棍杖', 'C', 'バトルロッド', 8, '打', '7', '+1', '近', 675000, ''),
  officialWeapon('棍杖', 'C', 'フレイル', 12, '打', '9', '+1', '近', 825000, ''),
  officialWeapon('棍杖', 'C', '日輪の杖', 8, '貫打', '7', '+1', '近', 1050000, '燃焼 / 精神力判定時+2'),
  officialWeapon('棍杖', 'C', 'アイアンロッド', 14, '打', '10', '+1', '近', 1125000, '麻痺'),
  officialWeapon('棍杖', 'B', 'エネルギーロッド', 14, '打', '12', '+1', '近', 4400000, '充電(2)'),
  officialWeapon('棍杖', 'B', 'スチームバトン', 14, '打', '12', '+1', '近', 4400000, '煙(2)'),
  officialWeapon('棍杖', 'B', 'ヘビーフレイル', 16, '打', '13', '+1', '近', 4700000, '麻痺'),
  officialWeapon('棍杖', 'A', '蒼熱棍', 18, '打', '16', '+1', '近', 27500000, '燃焼'),
  officialWeapon('棍杖', 'S', 'ケヤキ工房のメイス', 18, '打', '18', '+1', '近', 72500000, '次の攻撃のコスト-1'),

  officialWeapon('銃火器', 'B', 'ハンドガン', 6, '貫', '8', '0', '遠', 2500000, ''),
  officialWeapon('銃火器', 'A', 'アサルトライフル', 16, '貫打', '16', '-2', '遠', 22500000, ''),
  officialWeapon('銃火器', 'A', '対物ライフル', 32, '貫', '25', '-2', '遠', 33750000, ''),
  officialWeapon('銃火器', 'A', '親指のマスケット銃', 24, '貫打', '20', '-2', '遠', null, '非売品'),
  officialWeapon('銃火器', 'S', 'ロジックアトリエのハンドガン', 20, '貫', '19', '0', '遠', 52500000, ''),
  officialWeapon('銃火器', 'S', 'ロジックアトリエのショットガン', 30, '打', '25', '-1', '遠', 67500000, ''),

  officialWeapon('特殊', 'A', '噴煙機', 28, '打', '24', '-1', '近', 37000000, '煙4')
];

const ARMOR_RESISTANCE_FIELDS = [
  { key: 'slash', label: '斬', fullLabel: '斬撃耐性', panic: false },
  { key: 'slashPanic', label: '混斬', fullLabel: '斬撃混乱耐性', panic: true },
  { key: 'pierce', label: '貫', fullLabel: '貫通耐性', panic: false },
  { key: 'piercePanic', label: '混貫', fullLabel: '貫通混乱耐性', panic: true },
  { key: 'blunt', label: '打', fullLabel: '打撃耐性', panic: false },
  { key: 'bluntPanic', label: '混打', fullLabel: '打撃混乱耐性', panic: true }
];

const ARMOR_RESISTANCE_COSTS = [
  { resistance: '脆弱', cost: 0, note: '耐性倍率2倍。防具作成用の公式耐性費用。' },
  { resistance: '弱点', cost: 250000, note: '耐性倍率1.5倍。防具作成用の公式耐性費用。' },
  { resistance: '普通', cost: 1000000, note: '耐性倍率1倍。防具作成用の公式耐性費用。' },
  { resistance: '抵抗', cost: 10000000, note: '耐性倍率0.5倍。抵抗以上は付与数に制限あり。' },
  { resistance: '耐性', cost: 25000000, note: '耐性倍率0.25倍。耐性/免疫は1種類のみ付与可能。' },
  { resistance: '免疫', cost: 100000000, panicOnly: true, note: '耐性倍率0倍。免疫は混乱耐性のみ付与可能。' }
];

const OFFICIAL_ITEMS = [
  officialItem('回復アイテム', 'パナー工房の包帯', 100000, 1, 0, 'HPを2D6回復し、出血状態異常が取り除かれる。'),
  officialItem('回復アイテム', '鎮静剤', 250000, 1, 0, '狂気による精神力判定の直後に使用した場合、狂気点を1D3点回復する。'),
  officialItem('回復アイテム', 'HP薬', 200000, 1, 0, '戦闘時使用不可。安静にすると全HPの1/2まで回復できる。'),
  officialItem('回復アイテム', '緊急手当てキット', 1000000, 3, 0, '骨折程度の怪我をカバーすることが可能。全HPの3分の1まで回復する。'),
  officialItem('回復アイテム', 'K社のナノテクノロジー(Aランク)', 25000000, 4, 0, '即座にHPを全回復し、出血など無益な状態異常をすべて取り払う。'),
  officialItem('回復アイテム', 'K社のナノテクノロジー(Sランク)', 30000000, 4, 0, '即座にHPと狂気点を全回復し、出血など無益な状態異常をすべて取り払う。'),
  officialItem('銃弾', 'Bランク弾丸', 1500000, 1, 0, '銃火器の攻撃時に消費する弾丸。'),
  officialItem('銃弾', 'Aランク弾丸', 10000000, 1, 0, '銃火器の攻撃時に消費する弾丸。'),
  officialItem('銃弾', 'Sランク弾丸', 25000000, 1, 0, '銃火器の攻撃時に消費する弾丸。'),
  ...officialSpecialBullets('徹甲弾', 1.5, 'マッチ時、相手の行為判定の達成値-1。'),
  ...officialSpecialBullets('氷結弾', 1.5, '命中時、麻痺1と忍耐-1を付与。'),
  ...officialSpecialBullets('火炎弾', 1.2, '命中時、火傷2を付与。'),
  officialItem('収納アイテム', 'U社の現状保存容器(Cランク)', 5000000, 1, 3, '収納重量5。収納した物品の時間経過を停止し劣化を止める。'),
  officialItem('収納アイテム', 'U社の現状保存容器(Bランク)', 10000000, 1, 5, '収納重量10。収納した物品の時間経過を停止し劣化を止める。'),
  officialItem('収納アイテム', 'U社の現状保存容器(Aランク)', 25000000, 1, 10, '収納重量20。収納した物品の時間経過を停止し劣化を止める。'),
  officialItem('収納アイテム', 'U社の現状保存容器(Sランク)', 50000000, 1, 15, '収納重量30。収納した物品の時間経過を停止し劣化を止める。'),
  officialItem('収納アイテム', '次元かばん(Bランク)', 10000000, 1, 5, '収納重量150。収納重量以下の物品を収納可能。生物は収納不可。'),
  officialItem('収納アイテム', '次元かばん(Aランク)', 25000000, 1, 10, '収納重量300。収納重量以下の物品を収納可能。生物は収納不可。'),
  officialItem('収納アイテム', '次元かばん(Sランク)', 50000000, 1, 15, '収納重量450。収納重量以下の物品を収納可能。生物は収納不可。'),
  officialItem('収納アイテム', '次元手袋(Bランク)', 15000000, 1, 0, '収納重量100。収納重量以下の物品を収納可能。生物は収納不可。'),
  officialItem('収納アイテム', '次元手袋(Aランク)', 30000000, 1, 0, '収納重量200。収納重量以下の物品を収納可能。生物は収納不可。'),
  officialItem('収納アイテム', '次元手袋(Sランク)', 75000000, 1, 0, '収納重量300。収納重量以下の物品を収納可能。生物は収納不可。')
];

const PROSTHETIC_SERIES = [
  { rank: '粗悪な', handCost: [500000, 650000, 650000], torsoCost: [1000000, 1250000, 1250000], hand: [[2, 3], [3, 1], [1, 5]], torso: [[3, 7], [1, 9], [5, 5]] },
  { rank: 'Dランクの', handCost: [2000000, 2500000, 2500000], torsoCost: [4000000, 5000000, 5000000], hand: [[3, 6], [4, 5], [2, 8]], torso: [[6, 12], [5, 10], [8, 16]] },
  { rank: 'Cランクの', handCost: [6500000, 8000000, 8000000], torsoCost: [13000000, 16500000, 16500000], hand: [[5, 10], [6, 8], [4, 11]], torso: [[10, 20], [8, 16], [11, 22]] },
  { rank: 'Bランクの', handCost: [15000000, 18500000, 18500000], torsoCost: [30000000, 37500000, 37500000], hand: [[7, 13], [8, 11], [6, 17]], torso: [[13, 26], [11, 22], [17, 34]] },
  { rank: 'Aランクの', handCost: [30000000, 37500000, 37500000], torsoCost: [60000000, 75000000, 75000000], hand: [[10, 19], [11, 17], [9, 20]], torso: [[19, 38], [17, 34], [20, 40]] },
  { rank: 'Sランクの', handCost: [60000000, 75000000, 75000000], torsoCost: [120000000, 150000000, 150000000], hand: [[12, 25], [13, 23], [11, 26]], torso: [[25, 50], [23, 46], [26, 52]] }
];

const PROSTHETIC_RANKS = ['粗悪', 'D', 'C', 'B', 'A', 'S'];
const PROSTHETIC_LOCATIONS = ['義手', '義足', '胴体', '頭部'];

const OFFICIAL_PROSTHETICS = [
  ...buildProstheticSeries('義手', ['STR', 'AGE'], 'hand'),
  ...buildProstheticSeries('義足', ['STR', 'DEX'], 'hand'),
  ...buildProstheticSeries('胴体', ['POW', 'CON'], 'torso'),
  ...buildProstheticSeries('頭部', ['POW', 'INT'], 'torso')
];

const EQUIPMENT_CATALOG_GROUPS = [
  {
    id: 'weapons',
    label: '武器',
    note: 'ルールブック「武器」表に掲載されている武器のみを追加します。',
    target: 'weapons',
    entries: OFFICIAL_WEAPONS
  },
  {
    id: 'armors',
    label: '防具',
    note: 'ルールブック「防具」の耐性費用表に基づき、各耐性欄を個別購入します。',
    target: 'armors',
    entries: buildOfficialArmorEntries()
  },
  {
    id: 'items',
    label: 'アイテム',
    note: 'ルールブックに掲載されている回復・銃弾・特殊弾・収納アイテムを追加します。',
    target: 'items',
    entries: OFFICIAL_ITEMS
  },
  {
    id: 'prosthetics',
    label: '義体',
    note: 'ルールブック「義体」表に掲載されている義手・義足・胴体・頭部を追加します。',
    target: 'prosthetics',
    entries: OFFICIAL_PROSTHETICS
  }
];

const EQUIPMENT_CATALOG_ENTRY_MAP = Object.fromEntries(EQUIPMENT_CATALOG_GROUPS.flatMap((group) => (
  group.entries.map((entry) => [`${group.id}:${entry.id}`, { ...entry, group: group.label, target: group.target }])
)));

const EQUIPMENT_UPGRADE_RANK_COSTS = {
  weight: { D: 50000, C: 500000, B: 2500000, A: 10000000, S: 20000000 },
  quality: { D: 150000, C: 1500000, B: 7500000, A: 30000000, S: 60000000 },
  optimize: { D: 1500000, C: 2500000, B: 25000000, A: 150000000, S: 500000000 },
  statusAptitude: { D: 250000, C: 1000000, B: 5000000, A: 30000000, S: 75000000 }
};

const EQUIPMENT_UPGRADE_STEP_COSTS = {
  statusInflict: { 1: 2500000, 2: 15000000, 3: 50000000 },
  damageReduction: { 1: 150000, 2: 500000, 3: 5000000, 4: 10000000, 5: 25000000 }
};

const PHYSICAL_DAMAGE_TYPES = ['斬撃', '貫通', '打撃'];
const STATUS_APTITUDES = ['出血', '燃焼', '麻痺'];

const EQUIPMENT_UPGRADE_CATALOG = [
  equipmentUpgrade('weight-adjust', '武器強化', '重量調整', 'weapon', {
    valueOptions: [0, -3, -2, -1, 1, 2, 3].map((value) => ({ value, label: value > 0 ? `重量+${value} / 威力+${value}` : value < 0 ? `重量${value} / 威力${value}` : '未調整' })),
    attributeType: 'none',
    rankCostKey: 'weight',
    costMode: 'rankPerAbsValue',
    summary: '武器の重量と威力を同じ値だけ増減する。',
    detail: '重量を1動かすごとに威力も1変化する。調整範囲は-3から+3までで、調整後の重量は1未満にできない。',
    limit: 'セッション終了ごとに1回。調整値は上限範囲内で指定できる。'
  }),
  equipmentUpgrade('quality-up', '武器強化', '上質化', 'weapon', {
    valueOptions: [0, 1, 2, 3].map((value) => ({ value, label: value ? `威力+${value}` : '未強化' })),
    attributeType: 'none',
    rankCostKey: 'quality',
    costMode: 'rankPerValue',
    summary: '重量を変えずに武器の威力を上げる。',
    detail: '武器の威力を+1する強化。最大で+3まで上げられる。',
    limit: 'セッション終了ごとに1回。上限範囲内で強化できる。'
  }),
  equipmentUpgrade('optimize', '武器強化', '最適化', 'weapon', {
    valueOptions: [0, 1, 2, 3].map((value) => ({ value, label: value ? `命中補正+${value}` : '未強化' })),
    attributeType: 'none',
    rankCostKey: 'optimize',
    costMode: 'rankPerValue',
    summary: '武器の命中補正を上げる。',
    detail: '命中補正を+1する強化。最大で+3まで強化できる。',
    limit: 'セッション終了ごとに1回、1点ずつ強化する。'
  }),
  equipmentUpgrade('status-aptitude', '武器強化', '状態異常適正付与', 'weapon', {
    valueOptions: [{ value: 1, label: '適正付与' }],
    attributeType: 'status',
    rankCostKey: 'statusAptitude',
    costMode: 'rankFlat',
    summary: '武器に状態異常の適正を1種類付与する。',
    detail: '出血、燃焼、麻痺から1つを選び、武器の効果欄に適正を追記する。すでに状態異常適正を持つ武器には付与できない。',
    limit: 'セッション終了ごとに1回。'
  }),
  equipmentUpgrade('status-inflict', '武器強化', '状態異常付与値追加', 'weapon', {
    valueOptions: [0, 1, 2, 3].map((value) => ({ value, label: value ? `付与値+${value}` : '未強化' })),
    attributeType: 'statusInflict',
    stepCostKey: 'statusInflict',
    costMode: 'stepValue',
    summary: '出血または燃焼適正を持つ武器の付与値を増やす。',
    detail: '攻撃時に付与する状態異常値を段階的に増やす。高い段階を行うには下位段階の強化が先に必要。',
    limit: '最大+3。セッション終了ごとに1回。'
  }),
  equipmentUpgrade('physical-reduction', '防具強化', '属性物理ダメージ軽減', 'armor', {
    valueOptions: [0, 1, 2, 3, 4, 5].map((value) => ({ value, label: value ? `物理ダメージ-${value}` : '未強化' })),
    attributeType: 'physical',
    stepCostKey: 'damageReduction',
    costMode: 'stepValue',
    summary: '防具に斬撃、貫通、打撃いずれかの物理ダメージ軽減を追加する。',
    detail: '選んだ属性の物理ダメージを段階分だけ軽減する。防具の特殊効果欄に「斬撃物理ダメージ-1」のように記録する。',
    limit: '各属性ごとに最大-5。購入時または購入後に適用できる。'
  }),
  equipmentUpgrade('panic-reduction', '防具強化', '属性混乱ダメージ軽減', 'armor', {
    valueOptions: [0, 1, 2, 3, 4, 5].map((value) => ({ value, label: value ? `混乱ダメージ-${value}` : '未強化' })),
    attributeType: 'physical',
    stepCostKey: 'damageReduction',
    costMode: 'stepValue',
    summary: '防具に斬撃、貫通、打撃いずれかの混乱ダメージ軽減を追加する。',
    detail: '選んだ属性の混乱ダメージを段階分だけ軽減する。防具の特殊効果欄に「斬撃混乱ダメージ-1」のように記録する。',
    limit: '各属性ごとに最大-5。購入時または購入後に適用できる。'
  })
];

const EQUIPMENT_UPGRADE_MAP = Object.fromEntries(EQUIPMENT_UPGRADE_CATALOG.map((entry) => [entry.id, entry]));

function equipmentUpgrade(id, group, name, target, options) {
  return {
    id,
    group,
    name,
    target,
    targetLabel: target === 'weapon' ? '武器' : '防具',
    ...options
  };
}

function officialWeapon(category, rank, name, weight, type, power, hit, range, cost, effect) {
  const isUnavailable = cost === null;
  const costText = isUnavailable ? '非売品' : formatStaticMoney(cost);
  const effectText = effect || '特殊効果なし';
  return {
    id: `weapon-${category}-${rank}-${name}`,
    name,
    category,
    rank,
    effect: effect || '',
    description: `${category} / ${rank}ランク`,
    meta: [`分類:${category}`, `重量:${weight}`, `属性:${type}`, `威力:${power}`, `命中:${hit}`, `射程:${range}`, costText],
    row: {
      name,
      rank,
      type,
      power,
      hit,
      weight,
      cost: isUnavailable ? 0 : cost,
      memo: [`公式武器表`, `分類:${category}`, `射程:${range}`, isUnavailable ? '非売品' : '', effectText].filter(Boolean).join(' / ')
    }
  };
}

function buildOfficialArmorEntries() {
  return ARMOR_RESISTANCE_FIELDS.flatMap((field) => (
    ARMOR_RESISTANCE_COSTS
      .filter((entry) => !entry.panicOnly || field.panic)
      .map((entry) => officialArmor({ ...entry, targetField: field.key, targetLabel: field.label, targetFullLabel: field.fullLabel }))
  ));
}

function officialArmor(entry) {
  const fields = ARMOR_RESISTANCE_FIELDS.map((field) => field.key);
  const row = {
    name: `${entry.targetLabel}耐性: ${entry.resistance}`,
    slash: '脆弱',
    slashPanic: '脆弱',
    pierce: '脆弱',
    piercePanic: '脆弱',
    blunt: '脆弱',
    bluntPanic: '脆弱',
    weight: 0,
    cost: entry.cost,
    memo: `公式防具耐性費用表 / ${entry.targetFullLabel}を${entry.resistance}にする個別購入項目。${entry.note}`
  };
  fields.forEach((field) => { row[field] = '脆弱'; });
  row[entry.targetField] = entry.resistance;
  return {
    id: `armor-${entry.targetField}-${entry.resistance}`,
    name: row.name,
    description: entry.note,
    meta: [`欄:${entry.targetFullLabel}`, `耐性:${entry.resistance}`, formatStaticMoney(entry.cost)],
    targetField: entry.targetField,
    targetLabel: entry.targetLabel,
    targetFullLabel: entry.targetFullLabel,
    resistance: entry.resistance,
    resistanceCost: entry.cost,
    row
  };
}

function officialItem(category, name, cost, qty, weight, effect) {
  return {
    id: `item-${category}-${name}`,
    name,
    description: category,
    effect,
    meta: [`分類:${category}`, `個数:${qty}`, `重量:${weight}`, formatStaticMoney(cost)],
    row: {
      name,
      qty,
      weight,
      cost,
      memo: `公式アイテム表 / 効果:${effect}`
    }
  };
}

function officialSpecialBullets(name, multiplier, effect) {
  return [
    { rank: 'B', cost: 1500000 },
    { rank: 'A', cost: 10000000 },
    { rank: 'S', cost: 25000000 }
  ].map(({ rank, cost }) => officialItem(
    '特殊弾',
    `${rank}ランク${name}`,
    Math.round(cost * multiplier),
    1,
    0,
    `${effect} 公式特殊弾価格倍率x${Math.round(multiplier * 100)}%。`
  ));
}

function buildProstheticSeries(location, statLabels, statKey) {
  const variants = ['①', '②', '③'];
  return PROSTHETIC_SERIES.flatMap((series) => {
    const costList = statKey === 'torso' ? series.torsoCost : series.handCost;
    return series[statKey].map(([first, second], index) => {
      const marker = variants[index];
      const name = `${series.rank}${location}${marker}`;
      const rank = normalizeProstheticRank(series.rank);
      const statText = `${statLabels[0]}:${first} / ${statLabels[1]}:${second}`;
      const cost = costList[index];
      return {
        id: `prosthetic-${location}-${series.rank}-${marker}`,
        name,
        description: `${location} / ${rank || series.rank.replace('の', '')}`,
        rank,
        location,
        meta: [`ランク:${rank || '-'}`, `部位:${location}`, statText, formatStaticMoney(cost)],
        row: {
          name,
          rank,
          location,
          stat: statText,
          weight: 0,
          cost,
          memo: '公式義体表 / 能力値は主能力値欄へ手入力してください。義体表に重量項目がないため重量0で追加します。'
        }
      };
    });
  });
}

const COMBAT_EFFECT_GROUPS = [
  {
    label: '基本スキル',
    note: '基本攻撃として扱う技能です。斬撃・貫通・打撃は技能点0で選択習得できます。',
    effects: [
      {
        id: 'basic-slash',
        name: '斬撃',
        note: '斬撃属性の基本攻撃技能。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 0, requirement: '選択習得', lightCost: '1', effect: '斬撃属性の基本攻撃を行う。基礎熟練取得時はコスト0。' }
        ]
      },
      {
        id: 'basic-pierce',
        name: '貫通',
        note: '貫通属性の基本攻撃技能。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 0, requirement: '選択習得', lightCost: '1', effect: '貫通属性の基本攻撃を行う。基礎熟練取得時はコスト0。' }
        ]
      },
      {
        id: 'basic-blunt',
        name: '打撃',
        note: '打撃属性の基本攻撃技能。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 0, requirement: '選択習得', lightCost: '1', effect: '打撃属性の基本攻撃を行う。基礎熟練取得時はコスト0。' }
        ]
      }
    ]
  },
  {
    label: '基本付与',
    note: '汎用的に使用できる基本系の戦闘特技です。',
    effects: [
      {
        id: 'light-recovery',
        name: '光回復',
        note: '次の幕に戦闘技能へ使う光を回復する。基本行動の攻撃ダイス以外とは同時使用不可。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 250, requirement: 'レベル1以上', lightCost: '0', effect: '【マッチ勝利】次の幕に光+1。効力値1/2。' },
          { key: 'sl2', label: 'SL2', skill: 500, requirement: 'レベル3以上', lightCost: '0', effect: '【的中時】次の幕に光+1。効力値1/3。' },
          { key: 'sl3', label: 'SL3', skill: 1500, requirement: 'レベル5以上', lightCost: '0', effect: '【使用時】次の幕に光+1。全ダイス効力値1/4。' },
          { key: 'sl4', label: 'SL4', skill: 2000, requirement: 'レベル7以上', lightCost: '1', effect: '【使用時】次の幕に光+2。全ダイス効力値1/3。' },
          { key: 'sl5', label: 'SL5', skill: 3500, requirement: 'レベル9以上', lightCost: '2', effect: '【使用時】次の幕に光+3。全ダイス効力値1/2。' }
        ]
      },
      {
        id: 'dice-add',
        name: 'ダイス追加',
        note: '任意属性のダイスを追加する。追加したダイスはこの戦闘技能を使った速度ダイスにのみ適用される。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 0, requirement: '初期習得', lightCost: '1', effect: '任意属性のダイスを1つ追加。全ダイス達成値-2、全ダイス効力値1/2。基礎熟練取得時はコスト0。' },
          { key: 'sl2', label: 'SL2', skill: 500, requirement: 'レベル2以上', lightCost: '1', effect: '任意属性のダイスを2つ追加。全ダイス達成値-2、全ダイス効力値1/3。' },
          { key: 'sl3', label: 'SL3', skill: 1500, requirement: 'レベル4以上', lightCost: '1', effect: '任意属性のダイスを1つ追加。全ダイス達成値-1、全ダイス効力値1/2。' },
          { key: 'sl4', label: 'SL4', skill: 2000, requirement: 'レベル6以上', lightCost: '2', effect: '任意属性のダイスを2つ追加。全ダイス達成値-1、全ダイス効力値1/3。' },
          { key: 'sl5', label: 'SL5', skill: 3500, requirement: 'レベル8以上', lightCost: '3', effect: '任意属性のダイスを3つ追加。全ダイス達成値-1、全ダイス効力値1/4。' }
        ]
      },
      {
        id: 'strong-attack',
        name: '強攻撃（各属性）',
        note: '斬撃・貫通・打撃の各属性ダイスが命中した時のダメージを増加させる。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 250, requirement: 'レベル1以上', lightCost: '1', effect: 'ダメージ量+4。' },
          { key: 'sl2', label: 'SL2', skill: 500, requirement: 'レベル3以上', lightCost: '2', effect: 'ダメージ量+8。' },
          { key: 'sl3', label: 'SL3', skill: 1500, requirement: 'レベル5以上', lightCost: '3', effect: 'ダメージ量+12。' },
          { key: 'sl4', label: 'SL4', skill: 2000, requirement: 'レベル7以上', lightCost: '4', effect: 'ダメージ量+16。' },
          { key: 'sl5', label: 'SL5', skill: 3500, requirement: 'レベル9以上', lightCost: '5', effect: 'ダメージ量+20。' }
        ]
      },
      {
        id: 'fixed-damage',
        name: '固定ダメージ',
        note: 'マッチ勝利または攻撃的中時に耐性の影響を受けない固定ダメージを与える。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 250, requirement: 'レベル1以上', lightCost: '1', effect: '【マッチ勝利】2ダメージを与える。' },
          { key: 'sl2', label: 'SL2', skill: 500, requirement: 'レベル3以上', lightCost: '2', effect: '【的中時】4ダメージを与える。' },
          { key: 'sl3', label: 'SL3', skill: 1500, requirement: 'レベル5以上', lightCost: '2', effect: '【マッチ勝利】6ダメージを与える。' },
          { key: 'sl4', label: 'SL4', skill: 2000, requirement: 'レベル7以上', lightCost: '3', effect: '【的中時】8ダメージを与える。' },
          { key: 'sl5', label: 'SL5', skill: 3500, requirement: 'レベル9以上', lightCost: '3', effect: '【マッチ勝利】10ダメージを与える。' }
        ]
      },
      {
        id: 'judge-down',
        name: '判定減少',
        note: 'マッチ時に相手の判定達成値を下げる。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 250, requirement: 'レベル1以上', lightCost: '1', effect: '【的中時】相手の次のダイスの判定達成値-1。' },
          { key: 'sl2', label: 'SL2', skill: 500, requirement: 'レベル3以上', lightCost: '1', effect: '相手の現在のダイスの判定達成値-1。' },
          { key: 'sl3', label: 'SL3', skill: 1500, requirement: 'レベル5以上', lightCost: '2', effect: '相手の現在のダイスの判定達成値-2。' },
          { key: 'sl4', label: 'SL4', skill: 2000, requirement: 'レベル7以上', lightCost: '2', effect: '【マッチ開始時】相手の全ダイスの判定達成値-1。' },
          { key: 'sl5', label: 'SL5', skill: 3500, requirement: 'レベル9以上', lightCost: '3', effect: '【マッチ開始時】相手の全ダイスの判定達成値-2。' }
        ]
      }
    ]
  },
  {
    label: '状態異常付与',
    note: '状態異常属性の武器装備が必要な攻撃系の戦闘技能です。',
    effects: [
      {
        id: 'bleed-attack',
        name: '出血攻撃',
        note: '攻撃の的中時やマッチ勝利時に出血を付与する。出血属性武器装備が必要。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 300, requirement: 'レベル1以上 / 出血属性武器装備', lightCost: '0', effect: '【的中時】次の幕、出血+1付与。' },
          { key: 'sl2', label: 'SL2', skill: 750, requirement: 'レベル3以上 / 出血属性武器装備', lightCost: '1', effect: '【的中時】次の幕、出血+2付与。' },
          { key: 'sl3', label: 'SL3', skill: 2000, requirement: 'レベル5以上 / 出血属性武器装備', lightCost: '2', effect: '【的中時】次の幕、出血+3付与。' },
          { key: 'sl4', label: 'SL4', skill: 3500, requirement: 'レベル7以上 / 出血属性武器装備', lightCost: '3', effect: '【的中時】次の幕と2幕後に、出血+2付与。' },
          { key: 'sl5', label: 'SL5', skill: 7500, requirement: 'レベル9以上 / 出血属性武器装備', lightCost: '3', effect: '【的中時】次の幕と2幕後に、出血+3付与。' }
        ]
      },
      {
        id: 'burn-attack',
        name: '燃焼攻撃',
        note: '攻撃の的中時やマッチ勝利時に火傷を付与する。燃焼属性武器装備が必要。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 300, requirement: 'レベル1以上 / 燃焼属性武器装備', lightCost: '0', effect: '【的中時】次の幕、火傷+1付与。' },
          { key: 'sl2', label: 'SL2', skill: 750, requirement: 'レベル3以上 / 燃焼属性武器装備', lightCost: '1', effect: '【的中時】次の幕、火傷+2付与。' },
          { key: 'sl3', label: 'SL3', skill: 2000, requirement: 'レベル5以上 / 燃焼属性武器装備', lightCost: '2', effect: '【的中時】次の幕、火傷+3付与。' },
          { key: 'sl4', label: 'SL4', skill: 3500, requirement: 'レベル7以上 / 燃焼属性武器装備', lightCost: '3', effect: '【的中時】次の幕、攻撃対象に火傷+2、敵全員に火傷+1付与。' },
          { key: 'sl5', label: 'SL5', skill: 7500, requirement: 'レベル9以上 / 燃焼属性武器装備', lightCost: '3', effect: '【的中時】次の幕、攻撃対象に火傷+3、敵全員に火傷+2付与。' }
        ]
      },
      {
        id: 'paralysis-attack',
        name: '麻痺攻撃',
        note: '攻撃の的中時やマッチ勝利時に麻痺を付与する。麻痺属性武器装備が必要。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 300, requirement: 'レベル1以上 / 麻痺属性武器装備', lightCost: '0', effect: '【的中時】次の幕、麻痺+1付与。' },
          { key: 'sl2', label: 'SL2', skill: 750, requirement: 'レベル3以上 / 麻痺属性武器装備', lightCost: '1', effect: '【的中時】次の幕、麻痺+2付与。' },
          { key: 'sl3', label: 'SL3', skill: 2000, requirement: 'レベル5以上 / 麻痺属性武器装備', lightCost: '2', effect: '【的中時】次の幕、麻痺+3付与。' },
          { key: 'sl4', label: 'SL4', skill: 3500, requirement: 'レベル7以上 / 麻痺属性武器装備', lightCost: '3', effect: '【的中時】次の幕と2幕後に、麻痺+1付与。' },
          { key: 'sl5', label: 'SL5', skill: 7500, requirement: 'レベル9以上 / 麻痺属性武器装備', lightCost: '3', effect: '【的中時】次の幕と2幕後に、麻痺+2付与。' }
        ]
      }
    ]
  },
  {
    label: 'デバフ付与',
    note: '次の幕に敵のパワー、忍耐、クイックを下げる戦闘技能です。',
    effects: [
      {
        id: 'break-power',
        name: '体制崩し',
        note: '次の幕に相手の攻撃ダイスを弱体化させる。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 750, requirement: 'レベル1以上', lightCost: '1', effect: '【的中時】次の幕、ランダムな敵1名にパワー-1付与。' },
          { key: 'sl2', label: 'SL2', skill: 2000, requirement: 'レベル3以上', lightCost: '2', effect: '【的中時】次の幕、ランダムな敵2名にパワー-1付与。' },
          { key: 'sl3', label: 'SL3', skill: 3500, requirement: 'レベル5以上', lightCost: '2', effect: '【的中時】次の幕、攻撃対象にパワー-1付与。' },
          { key: 'sl4', label: 'SL4', skill: 7000, requirement: 'レベル7以上', lightCost: '3', effect: '【的中時】次の幕、攻撃対象にパワー-2、ランダムな敵1名にパワー-1付与。' },
          { key: 'sl5', label: 'SL5', skill: 12500, requirement: 'レベル9以上', lightCost: '3', effect: '【的中時】次の幕、攻撃対象にパワー-2、ランダムな敵2名にパワー-1付与。' }
        ]
      },
      {
        id: 'break-endurance',
        name: '守制崩し',
        note: '次の幕に相手の防御ダイスを弱体化させる。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 600, requirement: 'レベル1以上', lightCost: '1', effect: '【的中時】次の幕、ランダムな敵1名に忍耐-1付与。' },
          { key: 'sl2', label: 'SL2', skill: 1750, requirement: 'レベル3以上', lightCost: '2', effect: '【的中時】次の幕、ランダムな敵2名に忍耐-1付与。' },
          { key: 'sl3', label: 'SL3', skill: 3000, requirement: 'レベル5以上', lightCost: '2', effect: '【的中時】次の幕、攻撃対象に忍耐-1付与。' },
          { key: 'sl4', label: 'SL4', skill: 6000, requirement: 'レベル7以上', lightCost: '3', effect: '【的中時】次の幕、攻撃対象に忍耐-2、ランダムな敵1名に忍耐-1付与。' },
          { key: 'sl5', label: 'SL5', skill: 8000, requirement: 'レベル9以上', lightCost: '3', effect: '【的中時】次の幕、攻撃対象に忍耐-2、ランダムな敵2名に忍耐-1付与。' }
        ]
      },
      {
        id: 'bind-attack',
        name: '拘束攻撃',
        note: '次の幕に敵の速度ダイスの速度値を減少させる。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 350, requirement: 'レベル1以上', lightCost: '1', effect: '【的中時】次の幕、ランダムな敵1名にクイック-1付与。' },
          { key: 'sl2', label: 'SL2', skill: 1250, requirement: 'レベル3以上', lightCost: '2', effect: '【的中時】次の幕、ランダムな敵2名にクイック-1付与。' },
          { key: 'sl3', label: 'SL3', skill: 2500, requirement: 'レベル5以上', lightCost: '2', effect: '【的中時】次の幕、攻撃対象にクイック-1付与。' },
          { key: 'sl4', label: 'SL4', skill: 4000, requirement: 'レベル7以上', lightCost: '3', effect: '【的中時】次の幕、攻撃対象にクイック-2、ランダムな敵1名にクイック-1付与。' },
          { key: 'sl5', label: 'SL5', skill: 6000, requirement: 'レベル9以上', lightCost: '3', effect: '【的中時】次の幕、攻撃対象にクイック-2、ランダムな敵2名にクイック-1付与。' }
        ]
      }
    ]
  },
  {
    label: '自己強化',
    note: '次の幕に自分、または効果拡大時に味方全員へバフを得る戦闘技能です。',
    effects: [
      {
        id: 'buff-power',
        name: '強化:攻勢',
        note: '次の幕にパワーを得る。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 1000, requirement: 'レベル1以上', lightCost: '1', effect: '【的中時】次の幕、パワー1を得る。' },
          { key: 'sl2', label: 'SL2', skill: 2500, requirement: 'レベル3以上', lightCost: '2', effect: '【使用時】次の幕、パワー1を得る。' },
          { key: 'sl3', label: 'SL3', skill: 4000, requirement: 'レベル5以上', lightCost: '2', effect: '【的中時】次の幕、パワー2を得る。' },
          { key: 'sl4', label: 'SL4', skill: 8000, requirement: 'レベル7以上', lightCost: '3', effect: '【使用時】次の幕、パワー2を得る。' },
          { key: 'sl5', label: 'SL5', skill: 15000, requirement: 'レベル9以上', lightCost: '3', effect: '【的中時】次の幕、パワー3を得る。' }
        ]
      },
      {
        id: 'buff-endurance',
        name: '強化:守護',
        note: '次の幕に忍耐を得る。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 750, requirement: 'レベル1以上', lightCost: '1', effect: '【的中時】次の幕、忍耐1を得る。' },
          { key: 'sl2', label: 'SL2', skill: 2000, requirement: 'レベル3以上', lightCost: '2', effect: '【使用時】次の幕、忍耐1を得る。' },
          { key: 'sl3', label: 'SL3', skill: 3500, requirement: 'レベル5以上', lightCost: '2', effect: '【的中時】次の幕、忍耐2を得る。' },
          { key: 'sl4', label: 'SL4', skill: 7000, requirement: 'レベル7以上', lightCost: '3', effect: '【使用時】次の幕、忍耐2を得る。' },
          { key: 'sl5', label: 'SL5', skill: 10000, requirement: 'レベル9以上', lightCost: '3', effect: '【的中時】次の幕、忍耐3を得る。' }
        ]
      },
      {
        id: 'buff-quick',
        name: '強化:迅速',
        note: '次の幕にクイックを得る。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 500, requirement: 'レベル1以上', lightCost: '1', effect: '【的中時】次の幕、クイック1を得る。' },
          { key: 'sl2', label: 'SL2', skill: 1500, requirement: 'レベル3以上', lightCost: '2', effect: '【使用時】次の幕、クイック1を得る。' },
          { key: 'sl3', label: 'SL3', skill: 3000, requirement: 'レベル5以上', lightCost: '2', effect: '【的中時】次の幕、クイック2を得る。' },
          { key: 'sl4', label: 'SL4', skill: 4500, requirement: 'レベル7以上', lightCost: '3', effect: '【使用時】次の幕、クイック2を得る。' },
          { key: 'sl5', label: 'SL5', skill: 8000, requirement: 'レベル9以上', lightCost: '3', effect: '【的中時】次の幕、クイック3を得る。' }
        ]
      },
      {
        id: 'effect-expand',
        name: '効果拡大',
        note: '自己強化分類の戦闘技能を味方全員へ広げる。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 2500, requirement: 'レベル5以上', lightCost: '解説参照', effect: '自己強化の本来コストと同じ値の光を追加消費し、味方全員に適用する。' }
        ]
      }
    ]
  },
  {
    label: '煙・放電',
    note: '対応する特殊属性武器を装備している場合に使う戦闘技能です。',
    effects: [
      {
        id: 'smoke',
        name: '煙',
        note: '煙属性武器装備時のみ使用可能。煙の消費量で効果が変動する。',
        levels: [
          { key: 'dense-smoke', label: '噴煙', skill: 300, requirement: '煙武器装備', lightCost: '右記参照', effect: '追加で光を消費し、消費した光の2倍の数だけ煙の付与値を倍化する。' },
          { key: 'smoke-apply', label: '煙付与', skill: 300, requirement: '煙武器装備', lightCost: '右記参照', effect: '攻撃的中時、自分が煙を得ない代わりに相手に煙を付与する。' },
          { key: 'smoke-stay', label: '煙滞留', skill: 1500, requirement: '煙武器装備', lightCost: '右記参照', effect: '攻撃的中時、煙を3消費するごとに次に使用する戦闘特技コスト減少（最低値-3）。' },
          { key: 'smoke-obstruct', label: '煙阻害', skill: 2500, requirement: '煙武器装備', lightCost: '右記参照', effect: 'マッチ時、煙を2消費するごとに相手のダイス達成値-1（最大値-5）。' },
          { key: 'smoke-stun', label: '煙朦朧', skill: 2500, requirement: '煙武器装備', lightCost: '右記参照', effect: '攻撃的中時、煙の消費量の3倍の混乱ダメージを与える。' },
          { key: 'smoke-corrosion', label: '煙浸食', skill: 3000, requirement: '煙武器装備', lightCost: '右記参照', effect: '煙を2消費し、出血/燃焼/麻痺攻撃と同時使用すると状態異常付与値を1増加させる。' }
        ]
      },
      {
        id: 'charge',
        name: '放電',
        note: '充電属性武器装備時のみ使用可能。充電の消費量で効果が変動する。',
        levels: [
          { key: 'quick-charge', label: '急速充電', skill: 300, requirement: '充電武器装備', lightCost: '光（右記参照）', effect: '追加で光を消費し、消費した光の倍数だけ充電の付与値を倍化する。' },
          { key: 'charge-light', label: '放電:光', skill: 1500, requirement: '充電武器装備', lightCost: '充電（右記参照）', effect: '充電を2消費するごとに、次の幕に光回復+1（最大値+3）。' },
          { key: 'charge-cycle', label: '放電:循環', skill: 1500, requirement: '充電武器装備', lightCost: '充電（右記参照）', effect: '充電を3消費するごとに、次に使用する戦闘特技コスト-1（最低値-3）。' },
          { key: 'charge-accuracy', label: '放電:確実化', skill: 2500, requirement: '充電武器装備', lightCost: '充電（右記参照）', effect: '充電を2消費するごとに、ダイス達成値+1（最大値+5）。' },
          { key: 'charge-power', label: '放電:パワー', skill: 5000, requirement: '充電武器装備', lightCost: '充電（右記参照）', effect: '充電を3消費するごとに、次の幕にパワー+1獲得（最大値+3）。' },
          { key: 'charge-endurance', label: '放電:忍耐', skill: 4000, requirement: '充電武器装備', lightCost: '充電（右記参照）', effect: '充電を3消費するごとに、次の幕に忍耐+1獲得（最大値+3）。' },
          { key: 'charge-quick', label: '放電:クイック', skill: 3500, requirement: '充電武器装備', lightCost: '充電（右記参照）', effect: '充電を3消費するごとに、次の幕にクイック+1獲得（最大値+3）。' },
          { key: 'charge-shield', label: '放電:シールド', skill: 3000, requirement: '充電武器装備', lightCost: '充電（右記参照）', effect: '充電を2消費するごとに、今回の幕と次の幕に全味方へ保護+1（最大値+2）。' }
        ]
      }
    ]
  },
  {
    label: '特殊行動',
    note: '反撃や手加減など、戦闘中の挙動を変える戦闘技能です。',
    effects: [
      {
        id: 'counter',
        name: '反撃',
        note: '選択したダイスを反撃ダイスに変更する。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 5000, requirement: 'レベル6以上', lightCost: '1', effect: '選択した自分のダイスを反撃ダイスに変更する。' }
        ]
      },
      {
        id: 'mercy',
        name: '手加減',
        note: '相手に致命傷を与えないように攻撃する。',
        levels: [
          { key: 'sl1', label: 'SL1', skill: 500, requirement: 'レベル1以上', lightCost: '1', effect: 'ダイス効力値1/4。この攻撃でHPが戦闘不能状態になった対象は生死判定を行わず戦闘不能になる。' }
        ]
      }
    ]
  }
];

const COMBAT_EFFECT_OPTIONS = COMBAT_EFFECT_GROUPS.flatMap((group) => group.effects.flatMap((effect) => effect.levels.map((level) => ({
  ...level,
  group: group.label,
  effectId: effect.id,
  name: effect.name,
  note: effect.note,
  optionId: `${effect.id}:${level.key}`
}))));

const COMBAT_EFFECT_OPTION_MAP = Object.fromEntries(COMBAT_EFFECT_OPTIONS.map((option) => [option.optionId, option]));
const BASIC_SKILL_COST_NAMES = ['斬撃', '貫通', '打撃', 'ダイス追加', '回避', '防御'];
const BASIC_SKILL_COST_EFFECT_IDS = ['basic-slash', 'basic-pierce', 'basic-blunt', 'dice-add'];

function passiveLevel(sl, skill, requirement, effect) {
  return { key: `sl${sl}`, sl, label: `SL${sl}`, skill, requirement, effect };
}

function officialPassive(id, name, note, maxSl, levels, options = {}) {
  return { id, name, note, maxSl, levels, ...options };
}

const LEVEL_REQ_13579 = ['レベル1以上', 'レベル3以上', 'レベル5以上', 'レベル7以上', 'レベル9以上'];
const PASSIVE_HIGH_COSTS = [1000, 3000, 5000, 15000, 30000];
const PASSIVE_DAMAGE_COSTS = [300, 750, 2000, 4000, 7500];
const PASSIVE_STATUS_COSTS = [500, 1500, 3000, 5000, 7500];

const OFFICIAL_PASSIVE_GROUPS = [
  {
    label: '達成値補正',
    note: '命中、防御、回避、逃走などの達成値を上げるパッシブです。',
    passives: [
      officialPassive('weapon-proficiency', '武器熟達:〇〇', '指定した武器種を扱う際の命中判定達成値を上げる。〇〇には武器種を記入する。', 5, PASSIVE_HIGH_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `指定した武器の命中判定の達成値+${index + 1}`)), { allowMultiple: true }),
      officialPassive('weapon-proficiency-versatile', '武器熟達:多才', '扱うすべての武器種に命中判定ボーナスを得る。武器熟達:〇〇とは重複しない。', 3, [
        passiveLevel(1, 7500, 'レベル5以上 / 任意の武器熟達:〇〇を習得済み', '命中判定の達成値+1（武器指定問わず）'),
        passiveLevel(2, 25000, 'レベル7以上 / 任意の武器熟達:〇〇を習得済み', '命中判定の達成値+2（武器指定問わず）'),
        passiveLevel(3, 50000, 'レベル9以上 / 任意の武器熟達:〇〇を習得済み', '命中判定の達成値+3（武器指定問わず）')
      ]),
      officialPassive('defense-mastery', '熟達:防御', '防御ダイスで防御判定を行う際の達成値を上げる。', 5, PASSIVE_HIGH_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `防御判定の達成値+${index + 1}`))),
      officialPassive('dodge-mastery', '熟達:回避', '回避ダイスで回避判定を行う際の達成値を上げる。', 5, PASSIVE_HIGH_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `回避判定の達成値+${index + 1}`))),
      officialPassive('escape-technique', '逃走術', '逃走判定を行う際の達成値を上げる。', 3, [
        passiveLevel(1, 250, 'レベル1以上', '逃走判定の達成値+1'),
        passiveLevel(2, 500, 'レベル3以上', '逃走判定の達成値+2'),
        passiveLevel(3, 1500, 'レベル5以上', '逃走判定の達成値+3')
      ]),
      officialPassive('surprise-attack', '奇襲', '最初の幕に限り、ダイス達成値を上げる。', 3, [
        passiveLevel(1, 2500, 'レベル4以上', '舞台開始時、全ダイス達成値+1'),
        passiveLevel(2, 4000, 'レベル5以上', '舞台開始時、全ダイス達成値+2'),
        passiveLevel(3, 7500, 'レベル7以上', '舞台開始時、全ダイス達成値+3')
      ])
    ]
  },
  {
    label: 'ダメージ増加',
    note: '攻撃属性ごとのダメージ量、混乱ダメージ量を上げるパッシブです。',
    passives: [
      officialPassive('slash-damage', '斬撃術', '斬撃ダイスで攻撃した際のダメージ量を増やす。', 5, PASSIVE_DAMAGE_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `斬撃ダメージ量+${index + 1}`))),
      officialPassive('slash-panic-damage', '斬撃術:混乱', '斬撃ダイスで攻撃した際の混乱ダメージ量を増やす。', 5, PASSIVE_DAMAGE_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `斬撃混乱ダメージ量+${index + 1}`))),
      officialPassive('pierce-damage', '貫通術', '貫通ダイスで攻撃した際のダメージ量を増やす。', 5, PASSIVE_DAMAGE_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `貫通ダメージ量+${index + 1}`))),
      officialPassive('pierce-panic-damage', '貫通術:混乱', '貫通ダイスで攻撃した際の混乱ダメージ量を増やす。', 5, PASSIVE_DAMAGE_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `貫通混乱ダメージ量+${index + 1}`))),
      officialPassive('blunt-damage', '打撃術', '打撃ダイスで攻撃した際のダメージ量を増やす。', 5, PASSIVE_DAMAGE_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `打撃ダメージ量+${index + 1}`))),
      officialPassive('blunt-panic-damage', '打撃術:混乱', '打撃ダイスで攻撃した際の混乱ダメージ量を増やす。', 5, PASSIVE_DAMAGE_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `打撃混乱ダメージ量+${index + 1}`)))
    ]
  },
  {
    label: 'ステータス強化',
    note: '速度、光、HP、MP、最大重量を伸ばすパッシブです。',
    passives: [
      officialPassive('speed-dice', '速度', '戦闘開始時に持つ速度ダイスの個数を増やす。', 3, [
        passiveLevel(1, 5000, 'レベル5以上', '速度ダイス+1'),
        passiveLevel(2, 15000, 'レベル7以上', '速度ダイス+1。感情レベル3以上なら追加で速度ダイス+1'),
        passiveLevel(3, 30000, 'レベル9以上', '速度ダイス+2')
      ]),
      officialPassive('basic-training', '基礎熟練', '基本行動を行うときの消費コストを0にする。', 1, [
        passiveLevel(1, 3000, 'レベル5以上', '基本行動のコストが0になる')
      ]),
      officialPassive('light-initial-up', '光初期値上昇', '戦闘開始時の光初期値を増やす。', 1, [
        passiveLevel(1, 10000, 'レベル8以上', '光初期値が3から4に増加する')
      ]),
      officialPassive('sturdy', '頑健', 'HPおよび最大HPを増やす。現在習得している中で一番高いSLのみ適用。', 5, PASSIVE_STATUS_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `HP/最大HP+${(index + 1) * 12}`))),
      officialPassive('calm', '冷静', 'MPおよび最大MPを増やす。現在習得している中で一番高いSLのみ適用。', 5, PASSIVE_STATUS_COSTS.map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `MP/最大MP+${(index + 1) * 12}`))),
      officialPassive('carrier', '運搬術', 'PC最大重量を増やす。増加するのは最大重量のみで、武器の片手持ち制限には影響しない。', 5, [250, 500, 1000, 2000, 4000].map((cost, index) => passiveLevel(index + 1, cost, LEVEL_REQ_13579[index], `最大重量+${(index + 1) * 5}`)))
    ]
  },
  {
    label: '回復',
    note: 'マッチ勝利、攻撃的中、幕終了時にHPやMPを回復するパッシブです。',
    passives: [
      officialPassive('breathing', '呼吸法', 'マッチ勝利時または攻撃的中時にHPを回復する。HPが最大の場合は回復しない。', 3, [
        passiveLevel(1, 1000, 'レベル3以上', 'マッチ勝利時、HPを1回復'),
        passiveLevel(2, 3000, 'レベル5以上', '攻撃的中時、HPを1回復'),
        passiveLevel(3, 5000, 'レベル7以上', '攻撃的中時、HPを2回復')
      ]),
      officialPassive('concentration', '集中力', 'マッチ勝利時または攻撃的中時にMPを回復する。MPが最大の場合は回復しない。', 3, [
        passiveLevel(1, 1000, 'レベル3以上', 'マッチ勝利時、MPを1回復'),
        passiveLevel(2, 3000, 'レベル5以上', '攻撃的中時、MPを1回復'),
        passiveLevel(3, 5000, 'レベル7以上', '攻撃的中時、MPを2回復')
      ]),
      officialPassive('solid', '堅牢', '幕終了時、条件を満たしていればMPを回復する。混乱状態では回復しない。', 3, [
        passiveLevel(1, 1000, 'レベル3以上', '幕終了時、攻撃を2回以上受けていればMPを1回復'),
        passiveLevel(2, 3000, 'レベル5以上', '幕終了時、攻撃を2回以上受けていれば、その幕の開始時から減少したMPの半分を回復'),
        passiveLevel(3, 5000, 'レベル7以上', '幕終了時、その幕に受けた混乱ダメージ量の半分だけMPを回復')
      ])
    ]
  },
  {
    label: '戦闘',
    note: '状態異常付与、属性攻撃、単独戦闘、煙などを強化するパッシブです。',
    passives: [
      officialPassive('bleed-mastery', '習熟:出血', '出血攻撃で付与する出血の値を増やす。得意分野「暗殺」の選択パッシブ「蝕む一撃」と効果は重複する。', 3, [
        passiveLevel(1, 1500, 'レベル3以上', '出血攻撃で与える出血の値+1'),
        passiveLevel(2, 3000, 'レベル5以上', '出血攻撃で与える出血の値+2'),
        passiveLevel(3, 6000, 'レベル7以上', '出血攻撃で与える出血の値+2。出血攻撃のコスト-1')
      ]),
      officialPassive('burn-mastery', '習熟:燃焼', '燃焼攻撃で付与する火傷の値を増やす。得意分野「暗殺」の選択パッシブ「蝕む一撃」と効果は重複する。', 3, [
        passiveLevel(1, 1500, 'レベル3以上', '燃焼攻撃で与える火傷の値+1'),
        passiveLevel(2, 3000, 'レベル5以上', '燃焼攻撃で与える火傷の値+2'),
        passiveLevel(3, 6000, 'レベル7以上', '燃焼攻撃で与える火傷の値+2。燃焼攻撃のコスト-1')
      ]),
      officialPassive('paralysis-mastery', '習熟:麻痺', '麻痺攻撃で付与する麻痺の値を増やす。得意分野「暗殺」の選択パッシブ「蝕む一撃」と効果は重複する。', 3, [
        passiveLevel(1, 1500, 'レベル3以上', '麻痺攻撃で与える麻痺の値+1'),
        passiveLevel(2, 3000, 'レベル5以上', '麻痺攻撃で与える麻痺の値+2'),
        passiveLevel(3, 6000, 'レベル7以上', '麻痺攻撃で与える麻痺の値+2。麻痺攻撃のコスト-1')
      ]),
      officialPassive('sharp-strike', '鋭利な一撃', '斬撃攻撃で攻撃した際に付与効果を与える。', 2, [
        passiveLevel(1, 3000, 'レベル4以上', '斬撃攻撃が的中したとき、次の幕に出血1を付与'),
        passiveLevel(2, 7500, 'レベル8以上', '斬撃攻撃が的中したとき、次の幕に出血1を付与。出血状態の敵を攻撃するときダメージ量+3')
      ]),
      officialPassive('piercing-run', '一気通貫', '貫通攻撃で攻撃した際に付与効果を与える。', 2, [
        passiveLevel(1, 3000, 'レベル4以上', '貫通攻撃が的中したとき、次の幕に保護-1を付与（最大4回）'),
        passiveLevel(2, 7500, 'レベル8以上', '貫通攻撃が的中したとき、次の幕に保護-1、パワー-1を付与（最大4回）')
      ]),
      officialPassive('concussion', '脳震', '打撃攻撃で攻撃した際に固定の混乱ダメージを与える。', 2, [
        passiveLevel(1, 3000, 'レベル4以上', '打撃攻撃が的中したとき、相手に混乱ダメージ2を与える'),
        passiveLevel(2, 7500, 'レベル8以上', '打撃攻撃が的中したとき、相手に混乱ダメージ4を与える')
      ]),
      officialPassive('sniper', '狙撃の名手', '遠距離攻撃ダイスで近距離攻撃ダイスとマッチする際、相手の命中判定達成値を下げる。', 2, [
        passiveLevel(1, 5000, 'レベル5以上', '遠距離攻撃ダイスで近距離攻撃ダイスとマッチするとき、相手の攻撃ダイスの命中判定達成値-1'),
        passiveLevel(2, 8000, 'レベル7以上', '遠距離攻撃ダイスで近距離攻撃ダイスとマッチするとき、相手の攻撃ダイスの命中判定達成値-2')
      ]),
      officialPassive('lonely-fixer', '孤独なフィクサー', '味方が戦闘不能、または味方がいないときに効果を発揮する。', 5, [
        passiveLevel(1, 500, 'レベル1以上', '他の味方が戦闘不能になった時、次の幕にパワー1を得る'),
        passiveLevel(2, 1500, 'レベル3以上', '戦闘不能状態の味方がいるとき、その舞台の幕開始時にパワー1を得る'),
        passiveLevel(3, 3000, 'レベル5以上', '戦闘不能状態の味方がいるとき、戦闘不能の味方の数だけ舞台の幕開始時にパワー1を得る（最大2）'),
        passiveLevel(4, 5000, 'レベル7以上', '戦闘不能状態の味方がいるとき、その舞台の幕開始時にパワー2を得る'),
        passiveLevel(5, 7500, 'レベル9以上', '他の味方がいなければパワー3を永続的に得る')
      ]),
      officialPassive('smoky', 'もくもく', '煙の効果を自分に有利になるように変更する。', 3, [
        passiveLevel(1, 4000, 'レベル4以上', '煙の効果で受けるダメージ量が増加せず、代わりに攻撃で与えるダメージ量が増加'),
        passiveLevel(2, 6000, 'レベル6以上', '煙の効果で受けるダメージ量が増加せず、攻撃で与えるダメージ量が増加。得る煙の値+1'),
        passiveLevel(3, 8000, 'レベル8以上', '煙の効果で受けるダメージ量が増加せず、攻撃で与えるダメージ量が増加。得る煙の値+1。自分の煙が10以上ならダメージ量+3')
      ]),
      officialPassive('smoke-addiction', '煙中毒', 'もくもく習得後に獲得できる煙系パッシブ。煙覚醒と同時習得不可。', 1, [
        passiveLevel(1, 7000, 'もくもく習得 / レベル5以上', '煙覚醒と同時習得不可。攻撃時、相手に煙が8以上あれば麻痺2付与')
      ]),
      officialPassive('smoke-awakening', '煙覚醒', 'もくもく習得後に獲得できる煙系パッシブ。煙中毒と同時習得不可。', 1, [
        passiveLevel(1, 7000, 'もくもく習得 / レベル5以上', '煙中毒と同時習得不可。幕開始時に煙があれば、幕ごとに1回、防御判定時に煙の数値分出目が増加')
      ])
    ]
  },
  {
    label: 'その他',
    note: '特殊条件で発動する単発効果や高レベル向けパッシブです。',
    passives: [
      officialPassive('one-strike', '一撃', '行動が攻撃ダイス一つのみの場合に発動する。', 1, [
        passiveLevel(1, 3500, 'レベル5以上', '行動が攻撃ダイス一つのみの場合、命中判定+2。獲得する感情値が2倍')
      ]),
      officialPassive('unyielding', '不屈', 'HPが0になるダメージを受けたとき、一定量までダメージを軽減する。', 1, [
        passiveLevel(1, 20000, 'レベル7以上', 'HPが0になるダメージを受けたとき、そのダメージを含め幕終了時まで受けるダメージ-25（1戦闘ごとに1回）')
      ]),
      officialPassive('return', '復帰', '攻撃を受けて混乱状態になった時に復帰する。', 1, [
        passiveLevel(1, 15000, 'レベル7以上', '攻撃を受け混乱状態になった時、混乱状態を解除し混乱抵抗値を全快する（舞台ごとに1回）')
      ]),
      officialPassive('hot-blood', '熱血', '感情レベルが高い時、攻撃ダイスを強化する。', 1, [
        passiveLevel(1, 8000, 'レベル7以上', '感情レベルが3以上なら攻撃ダイスの命中判定達成値・ダメージ量+1')
      ]),
      officialPassive('counter-stance', '反撃態勢', '戦闘開始時に反撃ダイスを追加する。', 1, [
        passiveLevel(1, 7500, 'レベル7以上', '戦闘開始時、任意の属性の反撃ダイスを1つ追加する')
      ]),
      officialPassive('pressure', '強圧', '守備ダイスとマッチした時に相手の守備判定を下げる。', 1, [
        passiveLevel(1, 12000, 'レベル8以上', '守備ダイスとマッチしたとき、相手の防御判定・回避判定に-1の修正を与える')
      ]),
      officialPassive('mental-fullness', '精神充実', '幕終了時、次の幕に受けるマイナス状態を一つ取り除く。', 1, [
        passiveLevel(1, 20000, 'レベル8以上', '幕終了時、次の幕のパワー・忍耐・クイックのマイナス値になっているものを1つ取り除く')
      ]),
      officialPassive('madness', '狂気', '毎幕開始時に4面ダイスを振り、出目に応じた効果を得る。', 1, [
        passiveLevel(1, 15000, 'レベル8以上', '毎幕開始時に1D4を振る。1:パワー2 / 2:クイック2 / 3:忍耐2 / 4:保護-5を得る')
      ]),
      officialPassive('skill', '腕前', '相手より速度が高いとき、速度差に応じて判定とダメージ量を増やす。', 1, [
        passiveLevel(1, 50000, 'レベル9以上', '相手の速度が自分より低いとき、全ダイスの判定・ダメージ量が速度差に比例して増加（差が2毎に1、最大5）')
      ]),
      officialPassive('guts', '根性', 'HPが0になるダメージを受けたときに踏みとどまる。', 1, [
        passiveLevel(1, 50000, 'レベル9以上', 'HPが0になるダメージを受けたとき、そのダメージを0にして体力を全快。その後、幕終了時に混乱抵抗値を全快（1セッション中に1回）')
      ])
    ]
  }
];

const OFFICIAL_PASSIVE_OPTIONS = OFFICIAL_PASSIVE_GROUPS.flatMap((group) => group.passives.flatMap((passive) => passive.levels.map((level) => ({
  ...level,
  group: group.label,
  passiveId: passive.id,
  name: passive.name,
  note: passive.note,
  maxSl: passive.maxSl,
  allowMultiple: Boolean(passive.allowMultiple),
  optionId: `${passive.id}:${level.key}`
}))));

const OFFICIAL_PASSIVE_OPTION_MAP = Object.fromEntries(OFFICIAL_PASSIVE_OPTIONS.map((option) => [option.optionId, option]));

const TEKEY_STATUS_COLUMNS = [
  { label: '混乱', isCheck: true, isOver: false },
  { label: 'HP', isCheck: false, isOver: false },
  { label: 'MP', isCheck: false, isOver: false },
  { label: '光', isCheck: false, isOver: false },
  { label: 'PE', isCheck: false, isOver: false },
  { label: 'NE', isCheck: false, isOver: false },
  { label: '感情レベル', isCheck: false, isOver: false },
  { label: '狂気点', isCheck: false, isOver: false },
  { label: 'ねじれ点', isCheck: false, isOver: false },
  { label: 'パワｌ', isCheck: false, isOver: false },
  { label: 'クイック', isCheck: false, isOver: false },
  { label: '忍耐', isCheck: false, isOver: false },
  { label: '保護', isCheck: false, isOver: false },
  { label: '脆弱', isCheck: false, isOver: false },
  { label: '出血', isCheck: false, isOver: false },
  { label: '火傷', isCheck: false, isOver: false },
  { label: '麻痺', isCheck: false, isOver: false }
];

const TEKEY_STATUS_TABLE_CONFIG = {
  initiative: { disabled: true, label: '速度' },
  correction: { label: '修正値', disabled: true },
  columns: [
    { columnID: '16537129483020537', order: 0, isOver: false, open: false, isCheck: true, label: '混乱' },
    { columnID: '165434499852106876', order: 1, isOver: false, isCheck: false, open: false, label: 'HP' },
    { columnID: '1', order: 2, isOver: false, open: false, label: 'MP', isCheck: false },
    { columnID: '2', order: 3, isOver: false, open: false, isCheck: false, label: '光' },
    { columnID: '16537129030060785', order: 4, isOver: false, label: 'PE', open: false, isCheck: false },
    { columnID: '16537129146530076', order: 5, isOver: false, open: false, label: 'NE', isCheck: false },
    { columnID: '16537287654600685', order: 6, isOver: false, label: '感情レベル', open: false, isCheck: false },
    { columnID: '165371396590307219', order: 7, isOver: false, isCheck: false, label: '狂気点', open: false },
    { columnID: '165371399558305620', order: 8, isOver: false, isCheck: false, label: 'ねじれ点', open: false },
    { columnID: '166026329480301029', order: 9, isOver: false, open: false, isCheck: false, label: 'パワｌ' },
    { columnID: '166026342001004140', order: 10, isOver: false, label: 'クイック', isCheck: false, open: false },
    { columnID: '166026342001003041', order: 11, isOver: false, label: '忍耐', isCheck: false, open: false },
    { columnID: '166026342001003742', order: 12, isOver: false, label: '保護', isCheck: false, open: false },
    { columnID: '166026345091505143', order: 13, label: '脆弱', isCheck: false, isOver: false, open: false },
    { columnID: '166026345310202944', order: 14, label: '出血', isCheck: false, isOver: false, open: false },
    { columnID: '166026345741404345', order: 15, label: '火傷', isCheck: false, isOver: false, open: false },
    { columnID: '166026357704609946', order: 16, label: '麻痺', isCheck: false, isOver: false, open: false }
  ]
};

const TEKEY_COUNTER_REMOTE_CONFIG = {
  counters: [
    { buttonID: '166026492837003275', order: 0, label: 'HP', columnID: '165434499852106876', operator: 'ADD', correction: '', columnName: 'HP' },
    { buttonID: '166026495169708077', order: 1, label: 'MP', columnID: '1', operator: 'ADD', correction: '', columnName: 'MP' },
    { buttonID: '166026496405009078', order: 2, label: '光', columnID: '2', operator: 'ADD', correction: '', columnName: '光' },
    { buttonID: '166026496564405179', order: 3, label: 'PE', columnID: '16537129030060785', operator: 'ADD', correction: '', columnName: 'PE' },
    { buttonID: '166026496682201080', order: 4, label: 'NE', columnID: '16537129146530076', operator: 'ADD', correction: '', columnName: 'NE' },
    { buttonID: '166026498005806881', order: 5, label: '感情レベル', columnID: '16537287654600685', operator: 'ADD', correction: '', columnName: '感情レベル' },
    { buttonID: '166026509763601191', order: 6, label: '狂気点', columnID: '165371396590307219', operator: 'ADD', correction: '', columnName: '狂気点' },
    { buttonID: '166026513250300193', order: 7, label: 'パワー', columnID: '166026329480301029', operator: 'ADD', correction: '', columnName: 'パワｌ' },
    { buttonID: '166026515154101195', order: 8, label: 'クイック', columnID: '166026342001004140', operator: 'ADD', correction: '', columnName: 'クイック' },
    { buttonID: '166026516561904097', order: 9, label: '忍耐', columnID: '166026342001003041', operator: 'ADD', correction: '', columnName: '忍耐' },
    { buttonID: '166026517966509099', order: 10, label: '保護', columnID: '166026342001003742', operator: 'ADD', correction: '', columnName: '保護' },
    { buttonID: '1660265199795089101', order: 11, label: '脆弱', columnID: '166026345091505143', operator: 'ADD', correction: '', columnName: '脆弱' },
    { buttonID: '1660265213521015103', order: 12, label: '出血', columnID: '166026345310202944', operator: 'ADD', correction: '', columnName: '出血' },
    { buttonID: '1660265237099022105', order: 13, label: '火傷', columnID: '166026345741404345', operator: 'ADD', correction: '', columnName: '火傷' },
    { buttonID: '1660265257617083107', order: 14, label: '麻痺', columnID: '166026357704609946', operator: 'ADD', correction: '', columnName: '麻痺' }
  ]
};

const FIXER_HISTORY_TABLES = {
  A: {
    '1-1': 'ペットを飼っている/いた',
    '1-2': '貴方はセッション若しくはキャンペーン中の誰かに強い好意もしくは興味をもっている',
    '1-3': '巣から出たことがない/なかった',
    '1-4': '欠番（VCと相談）',
    '1-5': '高名なフィクサーに助けられたことがある',
    '1-6': '路地裏の深夜に野外にいたことがある',
    '2-1': 'とある研究所の実験体である/あった',
    '2-2': '組織にいたことがある',
    '2-3': '義体の四肢がある/義体である',
    '2-4': '生まれついての体ではない',
    '2-5': '親に棄てられた',
    '2-6': '都市の神を見たことがある',
    '3-1': 'とある組織と因縁がある',
    '3-2': '赤貧を経験した',
    '3-3': '敬愛している人物がいる',
    '3-4': '外郭の暮らしを経験したことがある',
    '3-5': '巣の羽だった',
    '3-6': '天才と呼ばれたことがある',
    '4-1': '伴侶がいる/いた',
    '4-2': '人肉を食べたことがある',
    '4-3': '天涯孤独の身である/あった',
    '4-4': 'どうしても復讐したい対象がいる/いた',
    '4-5': 'お金に執着している',
    '4-6': '誰かの夢を手伝っている/いた',
    '5-1': '里親に育てられた',
    '5-2': '裕福な家庭で育った',
    '5-3': '見てはいけないものを見たことがある',
    '5-4': '遺跡にいったことがある',
    '5-5': 'ワープ列車が苦手だ',
    '5-6': '子供がいる/いた',
    '6-1': '喫煙者である',
    '6-2': '記憶消去措置を受けたことがある',
    '6-3': '昔は強かった',
    '6-4': '大変気に入っている本や詩、映画がある',
    '6-5': '英雄になりたい/なりたかった',
    '6-6': '夢を持っている/いた'
  },
  B: {
    '1-1': '宗教勧誘を受けたことがある',
    '1-2': '忘れられない衝撃を受けたことがある',
    '1-3': '許されない罪を犯したことがある',
    '1-4': '親友がいる/いた',
    '1-5': '翼戦争に参加したことがある',
    '1-6': '戦闘意思のない民間人を殺したことがある',
    '2-1': '行きつけの飯屋がある',
    '2-2': '工房オタクである',
    '2-3': '役に立ちそうにない特技がある',
    '2-4': '誰にも言えない秘密がある',
    '2-5': '知り合い/家族がねじれた',
    '2-6': 'ねじれが原因で身近な人が被害を受けた',
    '3-1': 'とても綺麗な声をきいたことがある',
    '3-2': '調律者の調律で被害を受けたことがある',
    '3-3': '生粋の裏路地出身である',
    '3-4': '翼の重役の知り合いがいる/いた',
    '3-5': '遭難したことがある',
    '3-6': '大きな後悔がある',
    '4-1': '自分の才能に自信がある/あった',
    '4-2': '誰かを救ったことがある',
    '4-3': '貴方はハムハムパンパンを宣伝しなければならない',
    '4-4': 'どうしても知りたいことがある',
    '4-5': '兄弟/姉妹がいる',
    '4-6': '何かの生き残りである',
    '5-1': '指令を受けたことがある',
    '5-2': '大きな裏切りをされた/した',
    '5-3': '幼馴染みがいる/いた',
    '5-4': '一定期間の記憶がどうしても思い出せない',
    '5-5': 'タブーハンターに追われたことがある',
    '5-6': '集めている物がある',
    '6-1': '忘れたい記憶がある',
    '6-2': '罪悪感を持っている',
    '6-3': '解雇されたことがある',
    '6-4': '遠い地区の出身である',
    '6-5': '組織の抗争に巻き込まれたことがある',
    '6-6': '折れた巣に住んでいた'
  },
  C: {
    '1-1': '体のどこかに入れ墨がある',
    '1-2': '師と呼べる人がいる',
    '1-3': '恥ずかしい癖をもっている',
    '1-4': '破産したことがある',
    '1-5': '放浪児だった',
    '1-6': '誰かに深い恩がある',
    '2-1': '顔に傷がある',
    '2-2': '大切な約束をした',
    '2-3': '両親に愛されて育った',
    '2-4': '大切な人と生き別れた',
    '2-5': '引きこもってたことがある',
    '2-6': '大きな失敗をしたことがある',
    '3-1': '様々な地区をまわったことがある',
    '3-2': '幻想体に遭遇したことがある',
    '3-3': '告白されたことがある',
    '3-4': '金持ちの知り合いがいる',
    '3-5': '田舎で育った',
    '3-6': '苛烈な受験戦争を経験した',
    '4-1': '鏡写しの様な人間を知っている',
    '4-2': '誘拐されたことがある',
    '4-3': '大きな苦労をしたことがない',
    '4-4': '監禁されたことがある',
    '4-5': '恥ずかしい渾名がある',
    '4-6': '料理がてんで駄目だ',
    '5-1': '虐殺をしたことがある',
    '5-2': '巣に住むことを夢見ている/いた',
    '5-3': '本を書いたことがある',
    '5-4': '嫌いな家族がいる/家族が嫌いだ',
    '5-5': '住んでいる地区から出たことがない',
    '5-6': 'フィクサー一家である',
    '6-1': '自殺を試みたことがある',
    '6-2': '何かの中毒者である/あった',
    '6-3': '重大なトラウマを抱えている',
    '6-4': '大きな嘘をついたことがある',
    '6-5': '規律に厳しい環境で育った',
    '6-6': '強いこだわりがある　例:約束 服装など'
  }
};

const DRAFT_STORAGE_KEY = 'lomtrpg-character-creator';
const ACCOUNT_STORAGE_KEY = 'lomtrpg-character-creator-accounts';
const ACTIVE_ACCOUNT_KEY = 'lomtrpg-character-creator-active-account';
const SHARE_CODE_PREFIX = 'LOMTRPG-CHARACTER-CODE-V2';
const SHARE_CODE_SUFFIX = 'END-LOMTRPG-CHARACTER-CODE';
const REFUND_WINDOW_MS = 60 * 60 * 1000;
const ACTIVE_TO_WAREHOUSE = { weapons: 'warehouseWeapons', armors: 'warehouseArmors', items: 'warehouseItems' };
const WAREHOUSE_TO_ACTIVE = { warehouseWeapons: 'weapons', warehouseArmors: 'armors', warehouseItems: 'items' };

const DEFAULT_STATE = {
  meta: { libraryId: '', librarySavedAt: '', importedFromShare: false, sharedBy: null, sharedAt: '' },
  profile: { characterName: '', playerName: '', age: '', gender: '', role: '', fixerHistory: '', history: '', appearance: '', bonds: '' },
  build: { origin: 'nest', specialty: 'combat', specialtyPassive: '技量' },
  growth: { fame: 0, cashStart: 3000000, skillPointStart: 1000 },
  rewards: { cash: 0, skillPoints: 0, fame: 0, officeFame: 0, germinationRate: 0, items: [] },
  stats: {
    STR: { base: 0, boost: 0, misc: 0 },
    DEX: { base: 0, boost: 0, misc: 0 },
    AGE: { base: 0, boost: 0, misc: 0 },
    CON: { base: 0, boost: 0, misc: 0 },
    POW: { base: 0, boost: 0, misc: 0 },
    INT: { base: 0, boost: 0, misc: 0 },
    APP: { base: 0, boost: 0, misc: 0 }
  },
  combat: { speedMode: 'max', speedChoices: [], speedDiceExtra: 0, lightMaxExtra: 0, lightCurrent: 3 },
  emotion: { level: 1, pe: 0, ne: 0 },
  conditions: { confused: false, power: 0, quick: 0, endurance: 0, protection: 0, fragile: 0, bleed: 0, burn: 0, paralysis: 0 },
  mind: { insanityCurrent: 5, twistPoint: 0 },
  lightSeed: { number: 1, text: LIGHT_SEEDS[0], germinationRate: 0, memo: '' },
  equipment: {
    weapons: [{ name: '', rank: 'D', type: '斬撃', power: '', hit: '', weight: 0, cost: 0, memo: '' }],
    armors: [{ name: '', slash: '脆弱', slashPanic: '脆弱', pierce: '脆弱', piercePanic: '脆弱', blunt: '脆弱', bluntPanic: '脆弱', weight: 0, cost: 0, memo: '' }],
    items: [{ name: '', qty: 1, weight: 0, cost: 0, memo: '' }],
    consumedItemCost: 0,
    prosthetics: [],
    upgrades: []
  },
  warehouse: { weapons: [], armors: [], items: [] },
  skills: {
    combat: [
      { kind: '基本付与', name: 'ダイス追加', sl: 1, lightCost: '1', pointCost: 0, requirement: '初期習得', effects: [], catalogId: 'dice-add:sl1', catalogEffectId: 'dice-add', memo: '任意属性のダイスを1つ追加。全ダイス達成値-2、全ダイス効力値1/2。' },
      { kind: '基本スキル', name: '回避', sl: 1, lightCost: '1', pointCost: 0, requirement: '初期習得', effects: [], catalogId: '', catalogEffectId: '', memo: '回避ダイスを使用する基本スキル。' },
      { kind: '基本スキル', name: '防御', sl: 1, lightCost: '1', pointCost: 0, requirement: '初期習得', effects: [], catalogId: '', catalogEffectId: '', memo: '防御ダイスを使用する基本スキル。' }
    ],
    passives: []
  },
  office: { name: '', leader: '', level: 1, fame: 0, members: '', tactic1: '', tactic2: '', memo: '' },
  tekey: {
    referenceUrl: '',
    imageUrl: '',
    x: 0,
    y: 0,
    size: 1,
    initiative: 0,
    color: '#dfb85f',
    portrait: '',
    paletteLabel: ''
  }
};

let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
let saveTimer = null;
let warehouseRefundDebugUnlocked = false;
let warehouseDebugBuffer = '';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const clampNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const int = (value, fallback = 0) => Math.trunc(clampNumber(value, fallback));
function formatStaticMoney(value) {
  return `${Math.trunc(Number(value) || 0).toLocaleString('ja-JP')}眼`;
}
const formatMoney = (value) => `${int(value).toLocaleString('ja-JP')}眼`;
const bonusOf = (value) => Math.floor(Math.max(0, int(value)) / 6);

function tacticSkill(name, emotion, levels) {
  return {
    name,
    usage: '戦闘',
    emotion,
    levels: levels.map(([sl, time, effect]) => ({ sl, time, effect }))
  };
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((acc, key) => {
    if (acc[key] === undefined || acc[key] === null) acc[key] = {};
    return acc[key];
  }, obj);
  target[last] = value;
}

function getInputValue(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number') return clampNumber(el.value, 0);
  return el.value;
}

function setInputValue(el, value) {
  if (el.type === 'checkbox') el.checked = Boolean(value);
  else if (el.type === 'number') el.value = value ?? 0;
  else el.value = value ?? '';
}

function normalizeArmorRow(row) {
  const fallback = row?.panic || '脆弱';
  return {
    name: row?.name || '',
    slash: row?.slash || '脆弱',
    slashPanic: row?.slashPanic || fallback,
    pierce: row?.pierce || '脆弱',
    piercePanic: row?.piercePanic || fallback,
    blunt: row?.blunt || '脆弱',
    bluntPanic: row?.bluntPanic || fallback,
    weight: row?.weight ?? 0,
    cost: row?.cost ?? 0,
    memo: row?.memo || '',
    purchasedAt: row?.purchasedAt || ''
  };
}

function normalizeWeaponRow(row) {
  return {
    name: row?.name || '',
    rank: row?.rank || 'D',
    type: row?.type || '斬撃',
    power: row?.power || '',
    hit: row?.hit || '',
    weight: row?.weight ?? 0,
    cost: row?.cost ?? 0,
    memo: row?.memo || '',
    purchasedAt: row?.purchasedAt || ''
  };
}

function normalizeItemRow(row) {
  return {
    name: row?.name || '',
    qty: Math.max(1, int(row?.qty, 1)),
    weight: row?.weight ?? 0,
    cost: row?.cost ?? 0,
    memo: row?.memo || '',
    purchasedAt: row?.purchasedAt || ''
  };
}

function normalizeProstheticRank(value) {
  const text = String(value || '').replace(/ランク/g, '').replace(/の/g, '').trim();
  if (!text) return '';
  if (text.includes('粗悪')) return '粗悪';
  const matched = PROSTHETIC_RANKS.find((rank) => rank !== '粗悪' && text.includes(rank));
  return matched || '';
}

function normalizeProstheticLocation(value) {
  const text = String(value || '').trim();
  return PROSTHETIC_LOCATIONS.find((location) => text.includes(location)) || text;
}

function normalizeProstheticRow(row) {
  const sourceText = `${row?.rank || ''} ${row?.name || ''} ${row?.memo || ''}`;
  return {
    name: row?.name || '',
    rank: normalizeProstheticRank(row?.rank || sourceText),
    location: normalizeProstheticLocation(row?.location || row?.name),
    stat: row?.stat || '',
    weight: row?.weight ?? 0,
    cost: row?.cost ?? 0,
    memo: row?.memo || ''
  };
}

function createBlankArmorRow(name = '') {
  return {
    name,
    slash: '脆弱',
    slashPanic: '脆弱',
    pierce: '脆弱',
    piercePanic: '脆弱',
    blunt: '脆弱',
    bluntPanic: '脆弱',
    weight: 0,
    cost: 0,
    memo: '',
    purchasedAt: ''
  };
}

function formatArmorResistanceLine(row) {
  const armor = normalizeArmorRow(row);
  return `物理[斬撃:${armor.slash} / 貫通:${armor.pierce} / 打撃:${armor.blunt}] 混乱[斬撃:${armor.slashPanic} / 貫通:${armor.piercePanic} / 打撃:${armor.bluntPanic}]`;
}

function formatProstheticLine(row, singleLine = false) {
  const prosthetic = normalizeProstheticRow(row);
  const line = `・${prosthetic.name || '無名義体'} [${prosthetic.rank || '-'} / ${prosthetic.location || '-'}] ${prosthetic.stat || '-'} 重量:${prosthetic.weight || 0} 価格:${formatMoney(prosthetic.cost || 0)} ${prosthetic.memo || ''}`;
  return singleLine ? oneLine(line.replace(/^・/, '')) : line;
}

function armorResistanceCostFor(resistance) {
  return ARMOR_RESISTANCE_COSTS.find((entry) => entry.resistance === resistance)?.cost || 0;
}

function calculateOfficialArmorCost(row) {
  const armor = normalizeArmorRow(row);
  return ARMOR_RESISTANCE_FIELDS.reduce((sum, field) => sum + armorResistanceCostFor(armor[field.key]), 0);
}

function isBlankArmorRow(row) {
  const armor = normalizeArmorRow(row);
  return !armor.name
    && !armor.memo
    && int(armor.cost) === 0
    && clampNumber(armor.weight) === 0
    && ARMOR_RESISTANCE_FIELDS.every((field) => armor[field.key] === '脆弱');
}


function isBlankWeaponRow(row) {
  const weapon = normalizeWeaponRow(row);
  return !weapon.name
    && !weapon.memo
    && !weapon.power
    && !weapon.hit
    && int(weapon.cost) === 0
    && clampNumber(weapon.weight) === 0;
}

function isBlankItemRow(row) {
  const item = normalizeItemRow(row);
  return !item.name
    && !item.memo
    && int(item.cost) === 0
    && clampNumber(item.weight) === 0
    && int(item.qty, 1) <= 1;
}

function equipmentKindFromArrayName(name) {
  return WAREHOUSE_TO_ACTIVE[name] || name;
}

function isTrackedEquipmentArray(name) {
  return ['weapons', 'armors', 'items', 'warehouseWeapons', 'warehouseArmors', 'warehouseItems'].includes(name);
}

function isBlankEquipmentRow(arrayName, row) {
  const kind = equipmentKindFromArrayName(arrayName);
  if (kind === 'weapons') return isBlankWeaponRow(row);
  if (kind === 'armors') return isBlankArmorRow(row);
  if (kind === 'items') return isBlankItemRow(row);
  return false;
}

function equipmentRowCost(arrayName, row) {
  const kind = equipmentKindFromArrayName(arrayName);
  if (kind === 'items') return int(row?.cost) * Math.max(1, int(row?.qty, 1));
  return int(row?.cost);
}

function ensurePurchaseMetadata(row, arrayName, force = false) {
  if (!row || !isTrackedEquipmentArray(arrayName)) return row;
  if (!force && isBlankEquipmentRow(arrayName, row)) return row;
  if (force || !row.purchasedAt) row.purchasedAt = new Date().toISOString();
  return row;
}

function stampPurchasedRow(row, arrayName) {
  const copy = structuredCloneSafe(row);
  ensurePurchaseMetadata(copy, arrayName, true);
  return copy;
}

function purchaseTimestamp(row) {
  const time = Date.parse(row?.purchasedAt || '');
  return Number.isFinite(time) ? time : null;
}

function refundRemainingMs(row) {
  const time = purchaseTimestamp(row);
  if (time === null) return -1;
  return REFUND_WINDOW_MS - (Date.now() - time);
}

function isRefundWindowOpen(row) {
  return refundRemainingMs(row) > 0;
}

function canShowRefundDelete(arrayName, row) {
  if (isBlankEquipmentRow(arrayName, row)) return true;
  if (isRefundWindowOpen(row)) return true;
  return Boolean(WAREHOUSE_TO_ACTIVE[arrayName] && warehouseRefundDebugUnlocked);
}

function refundStatusText(arrayName, row) {
  if (isBlankEquipmentRow(arrayName, row)) return '';
  const remaining = refundRemainingMs(row);
  if (remaining > 0) return `返金可: 残り${Math.ceil(remaining / 60000)}分`;
  if (WAREHOUSE_TO_ACTIVE[arrayName] && warehouseRefundDebugUnlocked) return 'デバッグ返金可';
  return '返金期限切れ';
}

function ensureWarehouseState(target = state) {
  if (!target.warehouse || typeof target.warehouse !== 'object') target.warehouse = structuredCloneSafe(DEFAULT_STATE.warehouse);
  if (!Array.isArray(target.warehouse.weapons)) target.warehouse.weapons = [];
  if (!Array.isArray(target.warehouse.armors)) target.warehouse.armors = [];
  if (!Array.isArray(target.warehouse.items)) target.warehouse.items = [];
  return target.warehouse;
}

function normalizeEquipmentCollections(character) {
  ensureWarehouseState(character);
  character.equipment.weapons = (Array.isArray(character.equipment?.weapons) ? character.equipment.weapons : [])
    .map(normalizeWeaponRow)
    .map((row) => ensurePurchaseMetadata(row, 'weapons'));
  character.equipment.armors = mergeCatalogArmorRows(Array.isArray(character.equipment?.armors) ? character.equipment.armors : [])
    .map((row) => ensurePurchaseMetadata(row, 'armors'));
  character.equipment.items = (Array.isArray(character.equipment?.items) ? character.equipment.items : [])
    .map(normalizeItemRow)
    .map((row) => ensurePurchaseMetadata(row, 'items'));
  character.warehouse.weapons = character.warehouse.weapons
    .map(normalizeWeaponRow)
    .map((row) => ensurePurchaseMetadata(row, 'warehouseWeapons'));
  character.warehouse.armors = character.warehouse.armors
    .map(normalizeArmorRow)
    .map((row) => ensurePurchaseMetadata(row, 'warehouseArmors'));
  character.warehouse.items = character.warehouse.items
    .map(normalizeItemRow)
    .map((row) => ensurePurchaseMetadata(row, 'warehouseItems'));
}

function isOfficialArmorCatalogRow(row) {
  const armor = normalizeArmorRow(row);
  return armor.name === '防具耐性セット' || armor.memo.includes('公式防具耐性費用表');
}

function parseCatalogArmorPurchase(row) {
  const armor = normalizeArmorRow(row);
  const text = `${armor.name} ${armor.memo}`;
  const purchasedFields = ARMOR_RESISTANCE_FIELDS.filter((entry) => armor[entry.key] !== '脆弱');
  const field = purchasedFields.length === 1
    ? purchasedFields[0]
    : [...ARMOR_RESISTANCE_FIELDS]
      .sort((a, b) => b.fullLabel.length - a.fullLabel.length)
      .find((entry) => text.includes(entry.fullLabel) || text.includes(`${entry.label}耐性`));
  if (!field) return null;
  const resistance = RESISTANCES.find((value) => (
    armor[field.key] === value || text.includes(`: ${value}`) || text.includes(`を${value}`)
  ));
  if (!resistance) return null;
  return { field: field.key, resistance };
}

function buildArmorCatalogMemo(row, latestEntry = null) {
  const armor = normalizeArmorRow(row);
  const summary = ARMOR_RESISTANCE_FIELDS.map((field) => `${field.label}:${armor[field.key]}`).join(' / ');
  const latest = latestEntry ? ` / 最終購入:${latestEntry.targetFullLabel}を${latestEntry.resistance}` : '';
  return `公式防具耐性費用表 / ${summary}${latest}`;
}

function normalizeOfficialArmorSet(row, latestEntry = null) {
  const armor = normalizeArmorRow(row);
  if (!armor.name) armor.name = '防具耐性セット';
  armor.cost = calculateOfficialArmorCost(armor);
  armor.memo = buildArmorCatalogMemo(armor, latestEntry);
  return armor;
}

function mergeCatalogArmorRows(rows) {
  const normalized = (rows || []).map(normalizeArmorRow);
  const aggregate = createBlankArmorRow('防具耐性セット');
  const keep = [];
  let foundCatalogRow = false;

  normalized.forEach((row) => {
    if (!isOfficialArmorCatalogRow(row)) {
      if (!isBlankArmorRow(row)) keep.push(row);
      return;
    }
    const purchasedFields = ARMOR_RESISTANCE_FIELDS.filter((field) => row[field.key] !== '脆弱');
    if (row.name === '防具耐性セット' || purchasedFields.length > 1) {
      ARMOR_RESISTANCE_FIELDS.forEach((field) => {
        if (row[field.key] !== '脆弱') aggregate[field.key] = row[field.key];
      });
      foundCatalogRow = true;
      return;
    }
    const purchase = parseCatalogArmorPurchase(row);
    if (purchase) {
      aggregate[purchase.field] = purchase.resistance;
      foundCatalogRow = true;
      return;
    }
  });

  if (!foundCatalogRow) return normalized;
  return [normalizeOfficialArmorSet(aggregate), ...keep];
}

function normalizeTacticValue(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (TACTIC_SKILL_OPTION_MAP[text]) return text;
  const cleaned = text
    .replace(/[【】]/g, '')
    .replace(/用途:.*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const exact = TACTIC_SKILL_OPTIONS.find((option) => cleaned === option.label || cleaned === `${option.skillName}:SL${option.sl}`);
  if (exact) return exact.value;
  const skill = TACTIC_SKILLS.find((entry) => {
    const shortName = entry.name.replace('戦術指揮・', '');
    return cleaned === entry.name || cleaned === shortName || cleaned.includes(entry.name) || cleaned.includes(shortName);
  });
  return skill ? `${skill.name} SL1` : '';
}

function getTacticOption(value) {
  return TACTIC_SKILL_OPTION_MAP[normalizeTacticValue(value)] || null;
}

function formatTacticSelection(value) {
  const option = getTacticOption(value);
  if (!option) return '-';
  return `${option.label}（用途:${option.usage} / エモーション:${option.emotion} / 時間:${option.time} / 効果:${option.effect}）`;
}

function formatTacticCompact(value) {
  const option = getTacticOption(value);
  if (!option) return '-';
  return `${option.label}: ${option.effect}`;
}

function formatTacticList(values, formatter = formatTacticSelection, separator = '\n') {
  const lines = values.map((value) => getTacticOption(value) ? formatter(value) : '').filter(Boolean);
  return lines.length ? lines.join(separator) : '-';
}

function mergeDefaults(input) {
  const base = structuredCloneSafe(DEFAULT_STATE);
  const merge = (target, source) => {
    Object.keys(source || {}).forEach((key) => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    });
    return target;
  };
  const merged = merge(base, input || {});
  if (input && !input.conditions && input.mind?.insanityCurrent === 0) merged.mind.insanityCurrent = DEFAULT_STATE.mind.insanityCurrent;
  delete merged.tekey.initiativeAdjust;
  delete merged.build.specialtyPassiveCustom;
  delete merged.build.specialtyPassiveCustomText;
  if (!Array.isArray(merged.combat.speedChoices)) merged.combat.speedChoices = [];
  normalizeEquipmentCollections(merged);
  if (Array.isArray(merged.equipment?.prosthetics)) {
    merged.equipment.prosthetics = merged.equipment.prosthetics.map(normalizeProstheticRow);
  }
  if (!Array.isArray(merged.equipment?.upgrades)) {
    merged.equipment.upgrades = [];
  } else {
    merged.equipment.upgrades = merged.equipment.upgrades.map(normalizeEquipmentUpgradeRow).filter(Boolean);
  }
  if (!merged.rewards || typeof merged.rewards !== 'object') merged.rewards = structuredCloneSafe(DEFAULT_STATE.rewards);
  if (!Array.isArray(merged.rewards.items)) merged.rewards.items = structuredCloneSafe(DEFAULT_STATE.rewards.items);
  if (Array.isArray(merged.skills?.combat)) {
    merged.skills.combat = migrateCombatSkillRows(merged.skills.combat);
  }
  if (merged.office) {
    merged.office.tactic1 = normalizeTacticValue(merged.office.tactic1);
    merged.office.tactic2 = normalizeTacticValue(merged.office.tactic2);
  }
  return merged;
}

function populateSelects() {
  const origin = $('#origin');
  origin.innerHTML = Object.entries(ORIGINS).map(([key, data]) => `<option value="${key}">${data.label}</option>`).join('');
  const specialty = $('#specialty');
  specialty.innerHTML = Object.entries(SPECIALTIES).map(([key, data]) => `<option value="${key}">${data.label}</option>`).join('');
  const seed = $('#lightSeedNumber');
  seed.innerHTML = LIGHT_SEEDS.map((label, index) => `<option value="${index + 1}">${index + 1}. ${label}</option>`).join('');
  ['#tactic1', '#tactic2'].forEach((selector) => {
    const select = $(selector);
    if (select) select.innerHTML = buildTacticSelectOptions();
  });
}

function renderStatRows() {
  const tbody = $('#statRows');
  tbody.innerHTML = STAT_KEYS.map((key) => `
    <tr data-stat="${key}">
      <td><div class="stat-name">${key}</div><small>${STAT_LABELS[key]}</small></td>
      <td class="origin-dice" data-role="dice">-</td>
      <td><input type="number" step="1" data-stat-field="base" aria-label="${key}基礎値" /></td>
      <td><input type="number" step="1" data-stat-field="boost" aria-label="${key}強化" /></td>
      <td><input type="number" step="1" data-stat-field="misc" aria-label="${key}その他" /></td>
      <td class="readonly-cell" data-role="specialty">0</td>
      <td class="readonly-cell" data-role="total">0</td>
      <td class="readonly-cell" data-role="bonus">0</td>
      <td class="readonly-cell" data-role="boostCost">0眼</td>
    </tr>
  `).join('');
  tbody.addEventListener('input', (event) => {
    const input = event.target.closest('input[data-stat-field]');
    if (!input) return;
    const row = input.closest('tr[data-stat]');
    const key = row.dataset.stat;
    const field = input.dataset.statField;
    state.stats[key][field] = int(input.value);
    updateAll(true);
  });
}

function renderEnhancementRows() {
  const tbody = $('#enhancementRows');
  if (!tbody) return;
  tbody.innerHTML = STAT_KEYS.map((key) => `
    <tr data-enhancement-row="${key}">
      <td><div class="stat-name">${key}</div><small>${STAT_LABELS[key]}</small></td>
      <td class="readonly-cell" data-enhancement-role="base">0</td>
      <td class="readonly-cell" data-enhancement-role="specialty">0</td>
      <td class="readonly-cell" data-enhancement-role="misc">0</td>
      <td><input type="number" min="0" step="1" data-enhancement-stat="${key}" aria-label="${key}施術" /></td>
      <td class="readonly-cell" data-enhancement-role="before">0</td>
      <td class="readonly-cell" data-enhancement-role="after">0</td>
      <td class="readonly-cell" data-enhancement-role="bonus">0</td>
      <td class="readonly-cell" data-enhancement-role="cost">0眼</td>
      <td class="readonly-cell enhancement-detail" data-enhancement-role="detail">未施術</td>
    </tr>
  `).join('');
  tbody.addEventListener('input', (event) => {
    const input = event.target.closest('input[data-enhancement-stat]');
    if (!input) return;
    const key = input.dataset.enhancementStat;
    state.stats[key].boost = Math.max(0, int(input.value));
    updateAll(true);
  });
}

function createOptions(values, selected) {
  return values.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
}

function buildTacticSelectOptions() {
  const groups = ['覚醒', '崩壊'].map((emotion) => {
    const options = TACTIC_SKILL_OPTIONS
      .filter((option) => option.emotion === emotion)
      .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)} / ${escapeHtml(option.effect)}</option>`)
      .join('');
    return `<optgroup label="${emotion}">${options}</optgroup>`;
  }).join('');
  return `<option value="">未選択</option>${groups}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function renderArmorResistanceGroup(arrayName, index, mainField, panicField) {
  return `
    <div class="armor-resistance-group">
      <label class="armor-resistance-field armor-resistance-field-physical">
        <span>耐性</span>
        <select data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="${mainField}">${createOptions(RESISTANCES, getArrayByName(arrayName)[index]?.[mainField])}</select>
      </label>
      <label class="armor-resistance-field armor-resistance-field-panic">
        <span>混乱耐性</span>
        <select data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="${panicField}">${createOptions(RESISTANCES, getArrayByName(arrayName)[index]?.[panicField])}</select>
      </label>
    </div>
  `;
}

function renderRefundStatus(arrayName, row) {
  const text = refundStatusText(arrayName, row);
  return text ? `<small class="refund-status">${escapeHtml(text)}</small>` : '';
}

function renderEquipmentActions(arrayName, index, row, options = {}) {
  const stored = Boolean(WAREHOUSE_TO_ACTIVE[arrayName]);
  const blank = isBlankEquipmentRow(arrayName, row);
  const buttons = [];
  if (options.allowUse && !blank) buttons.push(`<button type="button" class="primary small" data-use-item="${index}">使用</button>`);
  if (!blank && stored) buttons.push(`<button type="button" class="primary small" data-equip-equipment="${escapeHtml(arrayName)}" data-index="${index}">装備</button>`);
  if (!blank && !stored) buttons.push(`<button type="button" class="ghost small" data-store-equipment="${escapeHtml(arrayName)}" data-index="${index}">保管</button>`);
  if (canShowRefundDelete(arrayName, row)) buttons.push(`<button type="button" class="danger small" data-remove="${escapeHtml(arrayName)}" data-index="${index}">返金削除</button>`);
  return `<div class="row-actions">${buttons.join('')}${renderRefundStatus(arrayName, row)}</div>`;
}

function renderWeaponCells(row, index, arrayName) {
  const weapon = normalizeWeaponRow(row);
  return `
    <td><input data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="name" value="${escapeHtml(weapon.name)}" /></td>
    <td><select data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="rank">${createOptions(WEAPON_RANKS, weapon.rank)}</select></td>
    <td><select data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="type">${createOptions(ATTACK_TYPES, weapon.type)}</select></td>
    <td><input data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="power" value="${escapeHtml(weapon.power)}" /></td>
    <td><input data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="hit" value="${escapeHtml(weapon.hit)}" /></td>
    <td><input type="number" data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="weight" value="${weapon.weight ?? 0}" /></td>
    <td><input type="number" data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="cost" value="${weapon.cost ?? 0}" /></td>
    <td><textarea data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="memo">${escapeHtml(weapon.memo)}</textarea></td>
    <td>${renderEquipmentActions(arrayName, index, weapon)}</td>
  `;
}

function renderArmorCells(row, index, arrayName) {
  const armor = normalizeArmorRow(row);
  getArrayByName(arrayName)[index] = armor;
  return `
    <td><input data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="name" value="${escapeHtml(armor.name)}" /></td>
    <td>${renderArmorResistanceGroup(arrayName, index, 'slash', 'slashPanic')}</td>
    <td>${renderArmorResistanceGroup(arrayName, index, 'pierce', 'piercePanic')}</td>
    <td>${renderArmorResistanceGroup(arrayName, index, 'blunt', 'bluntPanic')}</td>
    <td><input type="number" data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="weight" value="${armor.weight ?? 0}" /></td>
    <td><input type="number" data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="cost" value="${armor.cost ?? 0}" /></td>
    <td><textarea data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="memo">${escapeHtml(armor.memo)}</textarea></td>
    <td>${renderEquipmentActions(arrayName, index, armor)}</td>
  `;
}

function renderItemCells(row, index, arrayName, options = {}) {
  const item = normalizeItemRow(row);
  return `
    <td><input data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="name" value="${escapeHtml(item.name)}" /></td>
    <td><input type="number" data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="qty" value="${item.qty ?? 1}" /></td>
    <td><input type="number" data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="weight" value="${item.weight ?? 0}" /></td>
    <td><input type="number" data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="cost" value="${item.cost ?? 0}" /></td>
    <td><textarea data-array="${escapeHtml(arrayName)}" data-index="${index}" data-field="memo">${escapeHtml(item.memo)}</textarea></td>
    <td>${renderEquipmentActions(arrayName, index, item, options)}</td>
  `;
}

function renderDynamicTables() {
  ensureWarehouseState();
  renderRows('weaponRows', state.equipment.weapons, 'weapons', (row, index) => renderWeaponCells(row, index, 'weapons'));
  renderRows('armorRows', state.equipment.armors, 'armors', (row, index) => renderArmorCells(row, index, 'armors'));
  renderRows('itemRows', state.equipment.items, 'items', (row, index) => renderItemCells(row, index, 'items', { allowUse: true }));

  if (!state.rewards || !Array.isArray(state.rewards.items)) state.rewards = structuredCloneSafe(DEFAULT_STATE.rewards);
  renderRows('rewardItemRows', state.rewards.items, 'rewardItems', (row, index) => `
    <td><input data-array="rewardItems" data-index="${index}" data-field="name" value="${escapeHtml(row.name)}" /></td>
    <td><input type="number" min="1" data-array="rewardItems" data-index="${index}" data-field="qty" value="${row.qty ?? 1}" /></td>
    <td><input type="number" min="0" data-array="rewardItems" data-index="${index}" data-field="weight" value="${row.weight ?? 0}" /></td>
    <td><textarea data-array="rewardItems" data-index="${index}" data-field="memo">${escapeHtml(row.memo)}</textarea></td>
    <td><button type="button" class="danger small" data-remove="rewardItems" data-index="${index}">削除</button></td>
  `);

  renderRows('warehouseWeaponRows', state.warehouse.weapons, 'warehouseWeapons', (row, index) => renderWeaponCells(row, index, 'warehouseWeapons'));
  renderRows('warehouseArmorRows', state.warehouse.armors, 'warehouseArmors', (row, index) => renderArmorCells(row, index, 'warehouseArmors'));
  renderRows('warehouseItemRows', state.warehouse.items, 'warehouseItems', (row, index) => renderItemCells(row, index, 'warehouseItems'));

  renderRows('prostheticRows', state.equipment.prosthetics, 'prosthetics', (row, index) => {
    const prosthetic = normalizeProstheticRow(row);
    state.equipment.prosthetics[index] = prosthetic;
    return `
    <td><input data-array="prosthetics" data-index="${index}" data-field="name" value="${escapeHtml(prosthetic.name)}" /></td>
    <td><select data-array="prosthetics" data-index="${index}" data-field="rank">${createLabeledOptions([{ value: '', label: '未設定' }, ...PROSTHETIC_RANKS.map((rank) => ({ value: rank, label: rank === '粗悪' ? '粗悪' : `${rank}ランク` }))], prosthetic.rank)}</select></td>
    <td><select data-array="prosthetics" data-index="${index}" data-field="location">${createLabeledOptions([{ value: '', label: '未設定' }, ...PROSTHETIC_LOCATIONS.map((location) => ({ value: location, label: location }))], prosthetic.location)}</select></td>
    <td><input data-array="prosthetics" data-index="${index}" data-field="stat" value="${escapeHtml(prosthetic.stat)}" /></td>
    <td><input type="number" data-array="prosthetics" data-index="${index}" data-field="weight" value="${prosthetic.weight ?? 0}" /></td>
    <td><input type="number" data-array="prosthetics" data-index="${index}" data-field="cost" value="${prosthetic.cost ?? 0}" /></td>
    <td><textarea data-array="prosthetics" data-index="${index}" data-field="memo">${escapeHtml(prosthetic.memo)}</textarea></td>
    <td><button type="button" class="danger small" data-remove="prosthetics" data-index="${index}">削除</button></td>
    `;
  });

  if (!Array.isArray(state.equipment.upgrades)) state.equipment.upgrades = [];
  renderRows('equipmentUpgradeRows', state.equipment.upgrades, 'equipmentUpgrades', (row, index) => {
    const normalized = normalizeEquipmentUpgradeRow(row);
    state.equipment.upgrades[index] = normalized;
    const def = getEquipmentUpgradeDef(normalized.upgradeId);
    const rankDisabled = def.rankCostKey ? '' : ' disabled';
    const attributeOptions = getEquipmentUpgradeAttributeOptions(def);
    const attributeDisabled = attributeOptions.length <= 1 ? ' disabled' : '';
    const valueOptions = getEquipmentUpgradeValueOptions(def);
    return `
      <td><strong>${escapeHtml(def.targetLabel)}</strong><small>${escapeHtml(def.group)}</small></td>
      <td><input data-array="equipmentUpgrades" data-index="${index}" data-field="targetName" value="${escapeHtml(normalized.targetName)}" placeholder="${escapeHtml(def.targetLabel)}名" /></td>
      <td><select data-array="equipmentUpgrades" data-index="${index}" data-field="upgradeId">${createLabeledOptions(EQUIPMENT_UPGRADE_CATALOG.map((entry) => ({ value: entry.id, label: `${entry.group} / ${entry.name}` })), normalized.upgradeId)}</select></td>
      <td><select data-array="equipmentUpgrades" data-index="${index}" data-field="rank"${rankDisabled}>${createOptions(WEAPON_RANKS, normalized.rank)}</select></td>
      <td><select data-array="equipmentUpgrades" data-index="${index}" data-field="attribute"${attributeDisabled}>${createLabeledOptions(attributeOptions, normalized.attribute)}</select></td>
      <td><select data-array="equipmentUpgrades" data-index="${index}" data-field="value">${createLabeledOptions(valueOptions, normalized.value)}</select></td>
      <td class="upgrade-cost-cell">${formatMoney(getEquipmentUpgradeCost(normalized))}<small>${escapeHtml(equipmentUpgradeCostBreakdown(normalized))}</small></td>
      <td class="upgrade-effect-cell">${escapeHtml(formatEquipmentUpgradeEffect(normalized))}<small>${escapeHtml(def.limit)}</small></td>
      <td><textarea data-array="equipmentUpgrades" data-index="${index}" data-field="memo">${escapeHtml(normalized.memo)}</textarea></td>
      <td><button type="button" class="danger small" data-remove="equipmentUpgrades" data-index="${index}">削除</button></td>
    `;
  });

  renderRows('skillRows', state.skills.combat, 'skills', (row, index) => {
    const isBasicCost = isBasicSkillCostTarget(row);
    const lightCost = getCombatSkillLightCost(row);
    const readonly = isBasicCost ? ' readonly title="基本スキルの光コストは基礎熟練の有無で自動反映します"' : '';
    const lightCostClass = isBasicCost ? ' class="readonly-input"' : '';
    return `
      <td><input data-array="skills" data-index="${index}" data-field="kind" value="${escapeHtml(row.kind)}" /></td>
      <td><input data-array="skills" data-index="${index}" data-field="name" value="${escapeHtml(row.name)}" /></td>
      <td><input type="number" data-array="skills" data-index="${index}" data-field="sl" value="${row.sl ?? 1}" /></td>
      <td><input data-array="skills" data-index="${index}" data-field="lightCost" value="${escapeHtml(lightCost)}"${readonly}${lightCostClass} /></td>
      <td><input type="number" data-array="skills" data-index="${index}" data-field="pointCost" value="${row.pointCost ?? 0}" /></td>
      <td><input data-array="skills" data-index="${index}" data-field="requirement" value="${escapeHtml(row.requirement)}" /></td>
      <td><textarea data-array="skills" data-index="${index}" data-field="memo">${escapeHtml(row.memo)}</textarea></td>
      <td><button type="button" class="danger small" data-remove="skills" data-index="${index}">削除</button></td>
    `;
  });

  renderRows('passiveRows', state.skills.passives, 'passives', (row, index) => `
    <td><input data-array="passives" data-index="${index}" data-field="name" value="${escapeHtml(row.name)}" /></td>
    <td><input data-array="passives" data-index="${index}" data-field="kind" value="${escapeHtml(row.kind)}" /></td>
    <td><input type="number" data-array="passives" data-index="${index}" data-field="sl" value="${row.sl ?? 1}" /></td>
    <td><input type="number" data-array="passives" data-index="${index}" data-field="pointCost" value="${row.pointCost ?? 0}" /></td>
    <td><textarea data-array="passives" data-index="${index}" data-field="memo">${escapeHtml(row.memo)}</textarea></td>
    <td><button type="button" class="danger small" data-remove="passives" data-index="${index}">削除</button></td>
  `);
}

function renderRows(tbodyId, rows, arrayName, template) {
  const tbody = $(`#${tbodyId}`);
  tbody.innerHTML = rows.map((row, index) => `<tr>${template(row, index)}</tr>`).join('');
}

function renderCombatEffectCatalog() {
  const root = $('#combatEffectCatalog');
  if (!root) return;
  root.innerHTML = COMBAT_EFFECT_GROUPS.map((group) => `
    <details class="effect-catalog-group">
      <summary>
        <strong>${escapeHtml(group.label)}</strong>
        <span>${escapeHtml(group.note)}</span>
      </summary>
      <div class="effect-catalog-list">
        ${group.effects.map((effect) => `
          <section class="effect-catalog-item">
            <h3>${escapeHtml(effect.name)}</h3>
            <p>${escapeHtml(effect.note)}</p>
            <div class="effect-level-list">
              ${effect.levels.map((level) => `
                <div class="effect-level-row">
                  <strong>${escapeHtml(level.label)}</strong>
                  <span>技:${int(level.skill).toLocaleString('ja-JP')}</span>
                  <span>条:${escapeHtml(level.requirement)}</span>
                  <span>光:${escapeHtml(level.lightCost)}</span>
                  <small>${escapeHtml(level.effect)}</small>
                  <button type="button" class="primary small" data-learn-combat-skill="${escapeHtml(`${effect.id}:${level.key}`)}">習得</button>
                </div>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </details>
  `).join('');
}

function renderOfficialPassiveCatalog() {
  const root = $('#officialPassiveCatalog');
  if (!root) return;
  root.innerHTML = OFFICIAL_PASSIVE_GROUPS.map((group) => `
    <details class="effect-catalog-group">
      <summary>
        <strong>${escapeHtml(group.label)}</strong>
        <span>${escapeHtml(group.note)}</span>
      </summary>
      <div class="effect-catalog-list">
        ${group.passives.map((passive) => `
          <section class="effect-catalog-item">
            <h3>${escapeHtml(passive.name)} <small>最大SL:${int(passive.maxSl, 1)}</small></h3>
            <p>${escapeHtml(passive.note)}</p>
            <div class="effect-level-list">
              ${passive.levels.map((level) => `
                <div class="effect-level-row official-passive-level-row">
                  <strong>${escapeHtml(level.label)}</strong>
                  <span>技:${int(level.skill).toLocaleString('ja-JP')}</span>
                  <span>条:${escapeHtml(level.requirement)}</span>
                  <small>${escapeHtml(level.effect)}</small>
                  <button type="button" class="primary small" data-learn-official-passive="${escapeHtml(`${passive.id}:${level.key}`)}">取得</button>
                </div>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </details>
  `).join('');
}

function renderPurchaseItem(group, entry) {
  const effect = entry.effect || '';
  return `
    <section class="purchase-item">
      <div>
        <h3>${escapeHtml(entry.name)}</h3>
        <p>${escapeHtml(entry.description)}</p>
        ${effect ? `<p class="purchase-effect"><strong>特殊効果</strong>${escapeHtml(effect)}</p>` : ''}
      </div>
      <div class="purchase-meta">
        ${(entry.meta || []).map((label) => `<span>${escapeHtml(label)}</span>`).join('')}
      </div>
      <button type="button" class="primary small" data-purchase-id="${escapeHtml(`${group.id}:${entry.id}`)}">購入</button>
    </section>
  `;
}

function renderWeaponCatalogGroup(group) {
  const categories = Array.from(new Map(group.entries.map((entry) => [entry.category || 'その他', entry.category || 'その他'])).values());
  return `
    <div class="purchase-subgroups weapon-catalog-subgroups">
      ${categories.map((category) => {
        const entries = group.entries.filter((entry) => (entry.category || 'その他') === category);
        return `
          <details class="purchase-subgroup">
            <summary>
              <strong>${escapeHtml(category)}</strong>
              <span>${entries.length}件</span>
            </summary>
            <div class="purchase-list weapon-purchase-list">
              ${entries.map((entry) => renderPurchaseItem(group, entry)).join('')}
            </div>
          </details>
        `;
      }).join('')}
    </div>
  `;
}

function renderArmorCatalogGroup(group) {
  const armorGroups = [
    { label: '斬撃', physical: 'slash', panic: 'slashPanic' },
    { label: '貫通', physical: 'pierce', panic: 'piercePanic' },
    { label: '打撃', physical: 'blunt', panic: 'bluntPanic' }
  ];
  return `
    <div class="purchase-subgroups armor-catalog-subgroups">
      ${armorGroups.map((armorGroup) => {
        const physicalEntries = group.entries.filter((entry) => entry.targetField === armorGroup.physical);
        const panicEntries = group.entries.filter((entry) => entry.targetField === armorGroup.panic);
        return `
          <details class="purchase-subgroup">
            <summary>
              <strong>${escapeHtml(armorGroup.label)}</strong>
              <span>物理耐性 / 混乱耐性</span>
            </summary>
            <div class="armor-catalog-types">
              <section>
                <h3>物理耐性</h3>
                <div class="purchase-list armor-purchase-list">
                  ${physicalEntries.map((entry) => renderPurchaseItem(group, entry)).join('')}
                </div>
              </section>
              <section>
                <h3>混乱耐性</h3>
                <div class="purchase-list armor-purchase-list">
                  ${panicEntries.map((entry) => renderPurchaseItem(group, entry)).join('')}
                </div>
              </section>
            </div>
          </details>
        `;
      }).join('')}
    </div>
  `;
}

function renderProstheticCatalogGroup(group) {
  return `
    <div class="purchase-subgroups prosthetic-catalog-subgroups">
      ${PROSTHETIC_RANKS.map((rank) => {
        const rankEntries = group.entries.filter((entry) => entry.rank === rank);
        if (!rankEntries.length) return '';
        return `
          <details class="purchase-subgroup">
            <summary>
              <strong>${escapeHtml(rank)}${rank === '粗悪' ? '' : 'ランク'}</strong>
              <span>${rankEntries.length}件 / 部位別</span>
            </summary>
            <div class="prosthetic-location-groups">
              ${PROSTHETIC_LOCATIONS.map((location) => {
                const entries = rankEntries.filter((entry) => entry.location === location);
                if (!entries.length) return '';
                return `
                  <section class="prosthetic-location-group">
                    <h3>${escapeHtml(location)}</h3>
                    <div class="purchase-list prosthetic-purchase-list">
                      ${entries.map((entry) => renderPurchaseItem(group, entry)).join('')}
                    </div>
                  </section>
                `;
              }).join('')}
            </div>
          </details>
        `;
      }).join('')}
    </div>
  `;
}

function renderDefaultCatalogGroup(group) {
  return `<div class="purchase-list">${group.entries.map((entry) => renderPurchaseItem(group, entry)).join('')}</div>`;
}

function renderEquipmentCatalogGroupBody(group) {
  if (group.id === 'weapons') return renderWeaponCatalogGroup(group);
  if (group.id === 'armors') return renderArmorCatalogGroup(group);
  if (group.id === 'prosthetics') return renderProstheticCatalogGroup(group);
  return renderDefaultCatalogGroup(group);
}

function renderEquipmentCatalog() {
  const root = $('#equipmentCatalog');
  if (!root) return;
  root.innerHTML = EQUIPMENT_CATALOG_GROUPS.map((group) => `
    <details class="purchase-catalog-group">
      <summary>
        <strong>${escapeHtml(group.label)}</strong>
        <span>${escapeHtml(group.note)}</span>
      </summary>
      ${renderEquipmentCatalogGroupBody(group)}
    </details>
  `).join('');
}

function renderEquipmentUpgradeCatalog() {
  const root = $('#equipmentUpgradeCatalog');
  if (!root) return;
  const groups = ['武器強化', '防具強化'].map((groupLabel) => ({
    label: groupLabel,
    note: groupLabel === '武器強化' ? '重量・威力・命中補正・状態異常適正を扱います。' : '属性ごとの物理/混乱ダメージ軽減を扱います。',
    entries: EQUIPMENT_UPGRADE_CATALOG.filter((entry) => entry.group === groupLabel)
  }));
  root.innerHTML = groups.map((group) => `
    <details class="purchase-catalog-group">
      <summary>
        <strong>${escapeHtml(group.label)}</strong>
        <span>${escapeHtml(group.note)}</span>
      </summary>
      <div class="purchase-list">
        ${group.entries.map((entry) => `
          <section class="purchase-item">
            <div>
              <h3>${escapeHtml(entry.name)}</h3>
              <p>${escapeHtml(entry.summary)}</p>
              <p class="purchase-effect"><strong>詳細</strong>${escapeHtml(entry.detail)}</p>
              <p class="purchase-effect"><strong>制限</strong>${escapeHtml(entry.limit)}</p>
            </div>
            <div class="purchase-meta">
              ${equipmentUpgradeCatalogMeta(entry).map((label) => `<span>${escapeHtml(label)}</span>`).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </details>
  `).join('');
}

function equipmentUpgradeCatalogMeta(def) {
  const labels = [`対象:${def.targetLabel}`];
  if (def.rankCostKey) {
    const costs = EQUIPMENT_UPGRADE_RANK_COSTS[def.rankCostKey] || {};
    labels.push(`費用:${WEAPON_RANKS.map((rank) => `${rank} ${formatStaticMoney(costs[rank] || 0)}`).join(' / ')}`);
  }
  if (def.stepCostKey) {
    const costs = EQUIPMENT_UPGRADE_STEP_COSTS[def.stepCostKey] || {};
    labels.push(`段階費用:${Object.entries(costs).map(([step, cost]) => `${step} ${formatStaticMoney(cost)}`).join(' / ')}`);
  }
  return labels;
}

function getEquipmentUpgradeDef(upgradeId) {
  return EQUIPMENT_UPGRADE_MAP[upgradeId] || EQUIPMENT_UPGRADE_CATALOG[0];
}

function getEquipmentUpgradeValueOptions(def) {
  return def.valueOptions || [{ value: 0, label: '未設定' }];
}

function getEquipmentUpgradeAttributeOptions(def) {
  if (def.attributeType === 'physical') return PHYSICAL_DAMAGE_TYPES.map((value) => ({ value, label: value }));
  if (def.attributeType === 'status') return STATUS_APTITUDES.map((value) => ({ value, label: value }));
  if (def.attributeType === 'statusInflict') return ['出血', '燃焼'].map((value) => ({ value, label: value }));
  return [{ value: '', label: 'なし' }];
}

function createLabeledOptions(options, selected) {
  return options.map((option) => {
    const value = option.value ?? '';
    const label = option.label ?? value;
    return `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');
}

function getDefaultEquipmentUpgradeRow() {
  const def = EQUIPMENT_UPGRADE_CATALOG[0];
  return {
    targetName: '',
    upgradeId: def.id,
    rank: 'D',
    attribute: getEquipmentUpgradeAttributeOptions(def)[0]?.value || '',
    value: getEquipmentUpgradeValueOptions(def)[0]?.value ?? 0,
    memo: ''
  };
}

function normalizeEquipmentUpgradeRow(row) {
  const def = getEquipmentUpgradeDef(row?.upgradeId);
  const attributeOptions = getEquipmentUpgradeAttributeOptions(def);
  const valueOptions = getEquipmentUpgradeValueOptions(def);
  let attribute = row?.attribute ?? attributeOptions[0]?.value ?? '';
  let value = row?.value ?? valueOptions[0]?.value ?? 0;
  if (!attributeOptions.some((option) => String(option.value) === String(attribute))) attribute = attributeOptions[0]?.value || '';
  if (!valueOptions.some((option) => String(option.value) === String(value))) value = valueOptions[0]?.value ?? 0;
  return {
    targetName: row?.targetName || row?.name || '',
    upgradeId: def.id,
    rank: WEAPON_RANKS.includes(row?.rank) ? row.rank : 'D',
    attribute,
    value: Number(value),
    memo: row?.memo || ''
  };
}

function getEquipmentUpgradeCost(row) {
  const normalized = normalizeEquipmentUpgradeRow(row);
  const def = getEquipmentUpgradeDef(normalized.upgradeId);
  const value = int(normalized.value);
  if (def.costMode === 'rankPerAbsValue') {
    return (EQUIPMENT_UPGRADE_RANK_COSTS[def.rankCostKey]?.[normalized.rank] || 0) * Math.abs(value);
  }
  if (def.costMode === 'rankPerValue') {
    return (EQUIPMENT_UPGRADE_RANK_COSTS[def.rankCostKey]?.[normalized.rank] || 0) * Math.max(0, value);
  }
  if (def.costMode === 'rankFlat') {
    return EQUIPMENT_UPGRADE_RANK_COSTS[def.rankCostKey]?.[normalized.rank] || 0;
  }
  if (def.costMode === 'stepValue') {
    return EQUIPMENT_UPGRADE_STEP_COSTS[def.stepCostKey]?.[Math.abs(value)] || 0;
  }
  return 0;
}

function equipmentUpgradeCostBreakdown(row) {
  const normalized = normalizeEquipmentUpgradeRow(row);
  const def = getEquipmentUpgradeDef(normalized.upgradeId);
  const value = int(normalized.value);
  if (def.costMode === 'rankPerAbsValue') {
    const unit = EQUIPMENT_UPGRADE_RANK_COSTS[def.rankCostKey]?.[normalized.rank] || 0;
    return `${normalized.rank}ランク ${formatMoney(unit)} x ${Math.abs(value)}`;
  }
  if (def.costMode === 'rankPerValue') {
    const unit = EQUIPMENT_UPGRADE_RANK_COSTS[def.rankCostKey]?.[normalized.rank] || 0;
    return `${normalized.rank}ランク ${formatMoney(unit)} x ${Math.max(0, value)}`;
  }
  if (def.costMode === 'rankFlat') {
    return `${normalized.rank}ランク固定費用`;
  }
  if (def.costMode === 'stepValue') {
    const step = Math.abs(value);
    return step ? `${step}段階目の施工費用` : '段階未選択';
  }
  return '-';
}

function formatEquipmentUpgradeEffect(row) {
  const normalized = normalizeEquipmentUpgradeRow(row);
  const def = getEquipmentUpgradeDef(normalized.upgradeId);
  const value = int(normalized.value);
  const absValue = Math.abs(value);
  const attr = normalized.attribute;
  if (def.id === 'weight-adjust') {
    if (!value) return '未調整。重量と威力を同値で増減する。';
    return `重量${signed(value)} / 威力${signed(value)}。調整後の重量は1未満不可。`;
  }
  if (def.id === 'quality-up') {
    return value ? `威力+${value}。重量は変化しない。` : '未強化。威力のみを上げる。';
  }
  if (def.id === 'optimize') {
    return value ? `命中補正+${value}。` : '未強化。命中補正を上げる。';
  }
  if (def.id === 'status-aptitude') {
    return `${attr || '状態異常'}適正を付与。既に出血・燃焼・麻痺の適正を持つ武器には不可。`;
  }
  if (def.id === 'status-inflict') {
    return absValue ? `${attr || '状態異常'}付与値+${absValue}。下位段階の強化が前提。` : '未強化。出血または燃焼の付与値を増やす。';
  }
  if (def.id === 'physical-reduction') {
    return absValue ? `${attr || '属性'}物理ダメージ-${absValue}。` : '未強化。属性物理ダメージを軽減する。';
  }
  if (def.id === 'panic-reduction') {
    return absValue ? `${attr || '属性'}混乱ダメージ-${absValue}。` : '未強化。属性混乱ダメージを軽減する。';
  }
  return def.detail;
}

function formatEquipmentUpgradeLine(row) {
  const normalized = normalizeEquipmentUpgradeRow(row);
  const def = getEquipmentUpgradeDef(normalized.upgradeId);
  const targetName = normalized.targetName || '対象未設定';
  const attr = normalized.attribute ? ` / ${normalized.attribute}` : '';
  const memo = normalized.memo ? ` / ${oneLine(normalized.memo)}` : '';
  return `・${targetName} [${def.targetLabel}] ${def.name}${attr} / ${formatEquipmentUpgradeEffect(normalized)} / 費用:${formatMoney(getEquipmentUpgradeCost(normalized))}${memo}`;
}

function hasEquipmentUpgradeContent(row) {
  const normalized = normalizeEquipmentUpgradeRow(row);
  return Boolean(normalized.targetName || normalized.memo || int(normalized.value) || getEquipmentUpgradeCost(normalized));
}

function getSelectedCombatEffectIds(row) {
  return normalizeCombatEffectIds(row.effects);
}

function normalizeCombatEffectIds(effectIds) {
  const selectedByEffect = new Map();
  (Array.isArray(effectIds) ? effectIds : []).forEach((id) => {
    const option = COMBAT_EFFECT_OPTION_MAP[id];
    if (option) selectedByEffect.set(option.effectId, id);
  });
  return Array.from(selectedByEffect.values());
}

function parseSkillLevel(label) {
  const match = String(label || '').match(/\d+/);
  return match ? int(match[0], 1) : 1;
}

function combatSkillRowFromOption(option) {
  return {
    kind: option.group,
    name: option.name,
    sl: parseSkillLevel(option.label),
    lightCost: option.lightCost,
    pointCost: int(option.skill),
    requirement: option.requirement,
    effects: [],
    catalogId: option.optionId,
    catalogEffectId: option.effectId,
    memo: option.effect
  };
}

function normalizeCombatSkillName(name) {
  return String(name || '').replace(/[（）]/g, (ch) => (ch === '（' ? '(' : ')')).replace(/\s+/g, '').trim();
}

function isBasicSkillCostTarget(row) {
  const normalizedName = normalizeCombatSkillName(row?.name);
  return BASIC_SKILL_COST_NAMES.some((name) => normalizeCombatSkillName(name) === normalizedName)
    || BASIC_SKILL_COST_EFFECT_IDS.includes(row?.catalogEffectId);
}

function hasBasicTrainingPassive() {
  return (state.skills.passives || []).some((row) => (
    row.catalogPassiveId === 'basic-training'
    || row.catalogPassiveOptionId === 'basic-training:sl1'
    || normalizeCombatSkillName(row.name) === '基礎熟練'
  ));
}

function getCombatSkillLightCost(row) {
  if (isBasicSkillCostTarget(row)) return hasBasicTrainingPassive() ? '0' : '1';
  return row.lightCost || '';
}

function migrateCombatSkillRows(rows) {
  const migrated = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const effects = normalizeCombatEffectIds(row.effects);
    const isOldBasicAction = ['斬撃', '貫通', '打撃'].includes(row.name) && !int(row.pointCost) && (!row.memo || row.memo === '初期取得');
    const isOldInitialDefense = ['回避', '防御'].includes(row.name) && !int(row.pointCost) && (!row.memo || row.memo === '初期取得');
    const isOldDiceAdd = row.name === 'ダイス追加' && row.memo === '初期取得' && !row.requirement;
    if (isOldDiceAdd && COMBAT_EFFECT_OPTION_MAP['dice-add:sl1']) {
      migrated.push(combatSkillRowFromOption(COMBAT_EFFECT_OPTION_MAP['dice-add:sl1']));
    }
    if (!isOldBasicAction && !isOldInitialDefense && !isOldDiceAdd && (row.name || row.memo || row.requirement || int(row.pointCost))) {
      migrated.push({
        kind: row.kind || '戦闘特技',
        name: row.name || '',
        sl: int(row.sl, 1),
        lightCost: row.lightCost || '',
        pointCost: int(row.pointCost),
        requirement: row.requirement || '',
        effects: [],
        catalogId: row.catalogId || '',
        catalogEffectId: row.catalogEffectId || '',
        memo: row.memo || ''
      });
    }
    effects.forEach((id) => {
      const option = COMBAT_EFFECT_OPTION_MAP[id];
      if (option) migrated.push(combatSkillRowFromOption(option));
    });
  });

  return ensureInitialCombatSkills(dedupeCombatSkillRows(migrated.length ? migrated : structuredCloneSafe(DEFAULT_STATE.skills.combat)));
}

function dedupeCombatSkillRows(rows) {
  const byKey = new Map();
  rows.forEach((row) => {
    const key = row.catalogEffectId || normalizeCombatSkillName(row.name);
    if (!key) return;
    byKey.set(key, row);
  });
  return Array.from(byKey.values());
}

function ensureInitialCombatSkills(rows) {
  const result = [...rows];
  DEFAULT_STATE.skills.combat.forEach((initialRow) => {
    const exists = result.some((row) => normalizeCombatSkillName(row.name) === normalizeCombatSkillName(initialRow.name));
    if (!exists) result.push(structuredCloneSafe(initialRow));
  });
  return dedupeCombatSkillRows(result);
}

function learnCombatSkillOption(optionId) {
  const option = COMBAT_EFFECT_OPTION_MAP[optionId];
  if (!option) return;
  const row = combatSkillRowFromOption(option);
  const existingIndex = state.skills.combat.findIndex((skill) => (
    (skill.catalogEffectId && skill.catalogEffectId === option.effectId)
    || normalizeCombatSkillName(skill.name) === normalizeCombatSkillName(option.name)
  ));
  if (existingIndex >= 0) {
    state.skills.combat[existingIndex] = { ...state.skills.combat[existingIndex], ...row };
    toast(`${option.name}を${option.label}に更新しました`);
  } else {
    state.skills.combat.push(row);
    toast(`${option.name} ${option.label}を習得しました`);
  }
  renderDynamicTables();
  updateAll(true);
}

function passiveRowFromOfficialOption(option) {
  return {
    name: option.name,
    kind: `公式/${option.group}`,
    sl: int(option.sl, 1),
    pointCost: int(option.skill),
    memo: `条件:${option.requirement} / 効果:${option.effect}`,
    catalogPassiveId: option.passiveId,
    catalogPassiveOptionId: option.optionId
  };
}

function learnOfficialPassiveOption(optionId) {
  const option = OFFICIAL_PASSIVE_OPTION_MAP[optionId];
  if (!option) return;
  const row = passiveRowFromOfficialOption(option);
  const existingIndex = option.allowMultiple ? -1 : state.skills.passives.findIndex((passive) => (
    (passive.catalogPassiveId && passive.catalogPassiveId === option.passiveId)
    || normalizeCombatSkillName(passive.name) === normalizeCombatSkillName(option.name)
  ));
  if (existingIndex >= 0) {
    state.skills.passives[existingIndex] = { ...state.skills.passives[existingIndex], ...row };
    toast(`${option.name}を${option.label}に更新しました`);
  } else {
    state.skills.passives.push(row);
    toast(`${option.name} ${option.label}を取得しました`);
  }
  renderDynamicTables();
  updateAll(true);
}

function getSelectedCombatEffects(row) {
  return getSelectedCombatEffectIds(row).map((id) => COMBAT_EFFECT_OPTION_MAP[id]).filter(Boolean);
}

function getCombatSkillEffectPointCost(row) {
  return getSelectedCombatEffects(row).reduce((sum, effect) => sum + int(effect.skill), 0);
}

function getCombatSkillTotalPointCost(row) {
  return int(row.pointCost);
}

function combatSkillCostBreakdown(row) {
  return `技能点:${int(row.pointCost).toLocaleString('ja-JP')}`;
}

function combatEffectLabel(option) {
  return `${option.name} ${option.label}`;
}

function combatEffectDetail(option) {
  return `${combatEffectLabel(option)}（技:${int(option.skill).toLocaleString('ja-JP')} / 条:${option.requirement} / 光:${option.lightCost} / ${option.effect}）`;
}

function formatCombatSkillLine(row) {
  return `・【${row.name || '名称未設定'}】SL${row.sl || 1} 技:${getCombatSkillTotalPointCost(row).toLocaleString('ja-JP')} 条:${row.requirement || '-'} コ:${getCombatSkillLightCost(row) || '-'} 効:${row.memo || '-'}`;
}

function formatPassiveSkillLine(row, options = {}) {
  const prefix = options.bullet === false ? '' : '・';
  const memo = options.singleLine ? oneLine(row.memo) : (row.memo || '');
  return `${prefix}${row.name || '名称未設定'} SL${int(row.sl, 1)} [${row.kind || '汎用'}] 技能点:${int(row.pointCost).toLocaleString('ja-JP')} ${memo}`;
}

function hasCombatSkillContent(row) {
  return Boolean(row.name || row.memo || row.requirement || int(row.pointCost));
}

function refreshCombatSkillCostDisplays() {
  $$('[data-skill-total-index]').forEach((el) => {
    const row = state.skills.combat[int(el.dataset.skillTotalIndex)];
    if (row) el.textContent = getCombatSkillTotalPointCost(row).toLocaleString('ja-JP');
  });
  $$('[data-skill-breakdown-index]').forEach((el) => {
    const row = state.skills.combat[int(el.dataset.skillBreakdownIndex)];
    if (row) el.textContent = combatSkillCostBreakdown(row);
  });
}

function hookDynamicTables() {
  ['weaponRows', 'armorRows', 'itemRows', 'warehouseWeaponRows', 'warehouseArmorRows', 'warehouseItemRows', 'rewardItemRows', 'prostheticRows', 'equipmentUpgradeRows', 'skillRows', 'passiveRows'].forEach((id) => {
    const tbody = $(`#${id}`);
    if (!tbody) return;
    tbody.addEventListener('input', handleDynamicInput);
    tbody.addEventListener('change', handleDynamicInput);
    tbody.addEventListener('click', (event) => {
      const useItemButton = event.target.closest('[data-use-item]');
      if (useItemButton) {
        useItem(int(useItemButton.dataset.useItem));
        return;
      }
      const storeButton = event.target.closest('[data-store-equipment]');
      if (storeButton) {
        storeEquipmentRow(storeButton.dataset.storeEquipment, int(storeButton.dataset.index));
        return;
      }
      const equipButton = event.target.closest('[data-equip-equipment]');
      if (equipButton) {
        equipWarehouseRow(equipButton.dataset.equipEquipment, int(equipButton.dataset.index));
        return;
      }
      const btn = event.target.closest('[data-remove]');
      if (!btn) return;
      removeDynamicRow(btn.dataset.remove, int(btn.dataset.index));
    });
  });
}

function handleDynamicInput(event) {
  const el = event.target.closest('[data-array]');
  if (!el) return;
  const arrayName = el.dataset.array;
  const index = int(el.dataset.index);
  const field = el.dataset.field;
  const target = getArrayByName(arrayName);
  if (!target[index]) return;
  target[index][field] = getInputValue(el);
  if (isTrackedEquipmentArray(arrayName)) ensurePurchaseMetadata(target[index], arrayName);
  if (arrayName === 'equipmentUpgrades' && field === 'upgradeId') {
    target[index] = normalizeEquipmentUpgradeRow(target[index]);
    renderDynamicTables();
  }
  updateAll(true);
}

function getArrayByName(name) {
  if (name === 'weapons') return state.equipment.weapons;
  if (name === 'armors') return state.equipment.armors;
  if (name === 'items') return state.equipment.items;
  if (name === 'warehouseWeapons') return ensureWarehouseState().weapons;
  if (name === 'warehouseArmors') return ensureWarehouseState().armors;
  if (name === 'warehouseItems') return ensureWarehouseState().items;
  if (name === 'rewardItems') {
    if (!state.rewards || !Array.isArray(state.rewards.items)) state.rewards = structuredCloneSafe(DEFAULT_STATE.rewards);
    return state.rewards.items;
  }
  if (name === 'prosthetics') return state.equipment.prosthetics;
  if (name === 'equipmentUpgrades') {
    if (!Array.isArray(state.equipment.upgrades)) state.equipment.upgrades = [];
    return state.equipment.upgrades;
  }
  if (name === 'skills') return state.skills.combat;
  if (name === 'passives') return state.skills.passives;
  throw new Error(`Unknown array: ${name}`);
}

function addDynamicRow(name) {
  const rowMap = {
    weapons: { name: '', rank: 'D', type: '斬撃', power: '', hit: '', weight: 0, cost: 0, memo: '', purchasedAt: '' },
    armors: { name: '', slash: '脆弱', slashPanic: '脆弱', pierce: '脆弱', piercePanic: '脆弱', blunt: '脆弱', bluntPanic: '脆弱', weight: 0, cost: 0, memo: '', purchasedAt: '' },
    items: { name: '', qty: 1, weight: 0, cost: 0, memo: '', purchasedAt: '' },
    rewardItems: { name: '', qty: 1, weight: 0, memo: '' },
    prosthetics: { name: '', rank: '', location: '', stat: '', weight: 0, cost: 0, memo: '' },
    equipmentUpgrades: getDefaultEquipmentUpgradeRow(),
    skills: { kind: '戦闘特技', name: '', sl: 1, lightCost: '', pointCost: 0, requirement: '', effects: [], memo: '' },
    passives: { name: '', kind: '汎用', sl: 1, pointCost: 0, memo: '' }
  };
  getArrayByName(name).push(structuredCloneSafe(rowMap[name]));
  renderDynamicTables();
  updateAll(true);
}

function purchaseCatalogEntry(catalogId) {
  const entry = EQUIPMENT_CATALOG_ENTRY_MAP[catalogId];
  if (!entry) return;
  if (entry.target === 'armors' && entry.targetField) {
    purchaseArmorResistance(entry);
    return;
  }
  const target = getArrayByName(entry.target);
  target.push(stampPurchasedRow(entry.row, entry.target));
  renderDynamicTables();
  updateAll(true);
  toast(`${entry.name}を追加しました`);
}

function getArmorPurchaseTarget() {
  if (!Array.isArray(state.equipment.armors)) state.equipment.armors = [];
  let index = state.equipment.armors.findIndex(isOfficialArmorCatalogRow);
  if (index < 0) index = state.equipment.armors.findIndex(isBlankArmorRow);
  if (index < 0) {
    state.equipment.armors.push(createBlankArmorRow('防具耐性セット'));
    index = state.equipment.armors.length - 1;
  }
  if (!state.equipment.armors[index]) state.equipment.armors[index] = createBlankArmorRow('防具耐性セット');
  state.equipment.armors[index] = normalizeArmorRow(state.equipment.armors[index]);
  if (!state.equipment.armors[index].name) state.equipment.armors[index].name = '防具耐性セット';
  return state.equipment.armors[index];
}

function purchaseArmorResistance(entry) {
  state.equipment.armors = mergeCatalogArmorRows(state.equipment.armors);
  const armor = getArmorPurchaseTarget();
  const field = ARMOR_RESISTANCE_FIELDS.find((item) => item.key === entry.targetField);
  if (!field) return;
  armor[entry.targetField] = entry.resistance;
  Object.assign(armor, normalizeOfficialArmorSet(armor, entry));
  ensurePurchaseMetadata(armor, 'armors', true);
  renderDynamicTables();
  updateAll(true);
  toast(`${entry.targetFullLabel}を${entry.resistance}に更新しました`);
}

function moveEquipmentRow(sourceName, targetName, index, message) {
  const source = getArrayByName(sourceName);
  if (!source[index]) return;
  const [row] = source.splice(index, 1);
  getArrayByName(targetName).push(row);
  renderDynamicTables();
  updateAll(true);
  toast(message);
}

function storeEquipmentRow(sourceName, index) {
  const targetName = ACTIVE_TO_WAREHOUSE[sourceName];
  if (!targetName) return;
  moveEquipmentRow(sourceName, targetName, index, '倉庫に保管しました');
}

function equipWarehouseRow(sourceName, index) {
  const targetName = WAREHOUSE_TO_ACTIVE[sourceName];
  if (!targetName) return;
  moveEquipmentRow(sourceName, targetName, index, '装備欄に戻しました');
}

function removeDynamicRow(name, index) {
  getArrayByName(name).splice(index, 1);
  renderDynamicTables();
  updateAll(true);
}

function useItem(index) {
  if (!Array.isArray(state.equipment.items)) state.equipment.items = [];
  if (!Number.isFinite(Number(state.equipment.consumedItemCost))) state.equipment.consumedItemCost = 0;
  const row = state.equipment.items[index];
  if (!row) return;
  const qty = Math.max(1, int(row.qty, 1));
  state.equipment.consumedItemCost += Math.max(0, int(row.cost));
  if (qty > 1) {
    row.qty = qty - 1;
  } else {
    state.equipment.items.splice(index, 1);
  }
  renderDynamicTables();
  updateAll(true);
  toast(`${row.name || 'アイテム'}を使用しました`);
}

function hasRewardItemContent(row) {
  return Boolean(oneLine(row?.name) || oneLine(row?.memo) || clampNumber(row?.weight) || int(row?.qty) > 1);
}

function resetRewards() {
  state.rewards = structuredCloneSafe(DEFAULT_STATE.rewards);
}

function rewardItemToEquipmentItem(row) {
  return {
    name: oneLine(row.name) || '報酬アイテム',
    qty: Math.max(1, int(row.qty, 1)),
    weight: Math.max(0, clampNumber(row.weight)),
    cost: 0,
    memo: row.memo || ''
  };
}

function applyRewards() {
  collectBoundInputs();
  if (!state.rewards || !Array.isArray(state.rewards.items)) state.rewards = structuredCloneSafe(DEFAULT_STATE.rewards);
  const reward = state.rewards;
  const cash = Math.max(0, int(reward.cash));
  const skillPoints = Math.max(0, int(reward.skillPoints));
  const fame = Math.max(0, int(reward.fame));
  const officeFame = Math.max(0, int(reward.officeFame));
  const germinationRate = Math.max(0, int(reward.germinationRate));
  const rewardItems = reward.items.filter(hasRewardItemContent).map(rewardItemToEquipmentItem);
  const hasReward = Boolean(cash || skillPoints || fame || officeFame || germinationRate || rewardItems.length);
  if (!hasReward) {
    toast('適用する報酬がありません');
    return;
  }
  state.growth.cashStart = int(state.growth.cashStart) + cash;
  state.growth.skillPointStart = int(state.growth.skillPointStart) + skillPoints;
  state.growth.fame = int(state.growth.fame) + fame;
  state.office.fame = int(state.office.fame) + officeFame;
  state.lightSeed.germinationRate = Math.min(100, Math.max(0, int(state.lightSeed.germinationRate) + germinationRate));
  if (!Array.isArray(state.equipment.items)) state.equipment.items = [];
  state.equipment.items.push(...rewardItems);
  resetRewards();
  populateStateToDom();
  saveState();
  toast(`報酬を適用しました（アイテム${rewardItems.length}件）`);
}

function updateRewardPreview() {
  const root = $('#rewardPreview');
  if (!root) return;
  const reward = state.rewards || DEFAULT_STATE.rewards;
  const currentGermination = int(state.lightSeed.germinationRate);
  const nextGermination = Math.min(100, Math.max(0, currentGermination + Math.max(0, int(reward.germinationRate))));
  const currentFame = int(state.growth.fame);
  const nextFame = currentFame + Math.max(0, int(reward.fame));
  const nextRank = getRankInfo(nextFame);
  const currentOfficeFame = int(state.office.fame);
  const nextOfficeFame = currentOfficeFame + Math.max(0, int(reward.officeFame));
  const nextOfficeLevel = getOfficeLevelInfo(nextOfficeFame);
  const itemCount = Array.isArray(reward.items) ? reward.items.filter(hasRewardItemContent).length : 0;
  root.innerHTML = [
    ['所持金', formatMoney(state.growth.cashStart), `+${formatMoney(Math.max(0, int(reward.cash)))}`],
    ['技能点', int(state.growth.skillPointStart).toLocaleString('ja-JP'), `+${Math.max(0, int(reward.skillPoints)).toLocaleString('ja-JP')}`],
    ['名声点', currentFame.toLocaleString('ja-JP'), `+${Math.max(0, int(reward.fame)).toLocaleString('ja-JP')} / 適用後 ${nextRank.grade}/Lv${nextRank.level}`],
    ['事務所名声点', currentOfficeFame.toLocaleString('ja-JP'), `+${Math.max(0, int(reward.officeFame)).toLocaleString('ja-JP')} / 適用後 事務所Lv${nextOfficeLevel.level}`],
    ['発芽率', `${currentGermination}%`, `適用後 ${nextGermination}%`],
    ['報酬アイテム', `${itemCount}件`, '単価0で所持品へ追加']
  ].map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`).join('');
}
function populateStateToDom() {
  $$('.bind').forEach((el) => setInputValue(el, getPath(state, el.dataset.path)));
  STAT_KEYS.forEach((key) => {
    const row = $(`tr[data-stat="${key}"]`);
    ['base', 'boost', 'misc'].forEach((field) => {
      row.querySelector(`[data-stat-field="${field}"]`).value = state.stats[key][field] ?? 0;
    });
  });
  updateSpecialtyPassiveOptions();
  renderDynamicTables();
  updateAll(false);
}

function collectBoundInputs() {
  $$('.bind').forEach((el) => setPath(state, el.dataset.path, getInputValue(el)));
  const seedNum = Math.max(1, Math.min(10, int(state.lightSeed.number, 1)));
  state.lightSeed.number = seedNum;
  if (!state.lightSeed.text) state.lightSeed.text = LIGHT_SEEDS[seedNum - 1];
  state.office.tactic1 = normalizeTacticValue(state.office.tactic1);
  state.office.tactic2 = normalizeTacticValue(state.office.tactic2);
}

function updateSpecialtyPassiveOptions() {
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const select = $('#specialtyPassive');
  const current = state.build.specialtyPassive || specialty.choices[0].name;
  select.innerHTML = specialty.choices.map((choice) => `<option value="${escapeHtml(choice.name)}">${choice.name}</option>`).join('');
  if (!specialty.choices.some((choice) => choice.name === current)) state.build.specialtyPassive = specialty.choices[0].name;
  select.value = state.build.specialtyPassive;
}

function getSpecialtyMod(key) {
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  return int(specialty.mods[key] || 0);
}

function getTotalStats() {
  const total = {};
  STAT_KEYS.forEach((key) => {
    const row = state.stats[key] || {};
    total[key] = int(row.base) + int(row.boost) + int(row.misc) + getSpecialtyMod(key);
  });
  return total;
}

function costForValue(value) {
  const row = ENHANCE_COST_TABLE.find((entry) => value >= entry.min && value <= entry.max);
  return row ? row.cost : ENHANCE_COST_TABLE.at(-1).cost;
}

function enhancementCostForStat(key) {
  const data = state.stats[key];
  const baseWithMiscAndSpecialty = int(data.base) + int(data.misc) + getSpecialtyMod(key);
  const boost = Math.max(0, int(data.boost));
  let total = 0;
  for (let i = 1; i <= boost; i += 1) total += costForValue(baseWithMiscAndSpecialty + i);
  return total;
}

function totalEnhancementCost() {
  return STAT_KEYS.reduce((sum, key) => sum + enhancementCostForStat(key), 0);
}

function getEnhancementStepCosts(key) {
  const data = state.stats[key];
  const before = int(data.base) + int(data.misc) + getSpecialtyMod(key);
  const boost = Math.max(0, int(data.boost));
  return Array.from({ length: boost }, (_, index) => {
    const value = before + index + 1;
    return { value, cost: costForValue(value) };
  });
}

function getEnhancementInfo(key) {
  const data = state.stats[key];
  const base = int(data.base);
  const misc = int(data.misc);
  const specialty = getSpecialtyMod(key);
  const boost = Math.max(0, int(data.boost));
  const before = base + misc + specialty;
  const after = before + boost;
  const steps = getEnhancementStepCosts(key);
  const cost = steps.reduce((sum, step) => sum + step.cost, 0);
  return { base, misc, specialty, boost, before, after, bonus: bonusOf(after), steps, cost };
}

function formatEnhancementDetail(key) {
  const info = getEnhancementInfo(key);
  if (!info.steps.length) return '未施術';
  return info.steps.map((step) => `${step.value}:${formatMoney(step.cost)}`).join(' / ');
}

function formatEnhancementLine(key, singleLine = false) {
  const info = getEnhancementInfo(key);
  const memo = info.steps.length ? `内訳:${formatEnhancementDetail(key)}` : '未施術';
  const line = `・${key}（${STAT_LABELS[key]}）施術+${info.boost} ${info.before}->${info.after} B${info.bonus} 費用:${formatMoney(info.cost)} ${memo}`;
  return singleLine ? oneLine(line) : line;
}

function buildEnhancementLines(singleLine = false) {
  const lines = STAT_KEYS
    .filter((key) => getEnhancementInfo(key).boost > 0)
    .map((key) => formatEnhancementLine(key, singleLine));
  return lines.length ? lines.join('\n') : '・なし';
}

function getRankInfo(fame) {
  let current = RANK_TABLE[0];
  RANK_TABLE.forEach((row) => {
    if (int(fame) >= row.fame) current = row;
  });
  return current;
}

function getOfficeLevelInfo(fame) {
  let current = OFFICE_LEVEL_TABLE[0];
  OFFICE_LEVEL_TABLE.forEach((row) => {
    if (int(fame) >= row.fame) current = row;
  });
  return current;
}

function syncOfficeLevel() {
  const info = getOfficeLevelInfo(state.office.fame);
  state.office.level = info.level;
  return info;
}

function formatProgressNext(current, info, unit) {
  if (info.next === null) return '最大値に到達';
  const remaining = Math.max(0, info.next - int(current));
  return `次まで ${remaining.toLocaleString('ja-JP')}${unit}`;
}

function speedChoiceFallback() {
  return state.combat.speedMode === 'min' ? 'min' : 'max';
}

function getSpeedChoicesForBonus(dexBonus) {
  const needed = Math.floor(Math.max(0, int(dexBonus)) / 2);
  const fallback = speedChoiceFallback();
  const current = Array.isArray(state.combat.speedChoices) ? state.combat.speedChoices : [];
  let changed = !Array.isArray(state.combat.speedChoices);
  const next = current.slice();

  for (let i = 0; i < needed; i += 1) {
    if (next[i] !== 'min' && next[i] !== 'max') {
      next[i] = fallback;
      changed = true;
    }
  }

  if (changed) state.combat.speedChoices = next;
  return next.slice(0, needed);
}

function getSpeedExpression(dexBonus, choicesOrMode = 'max', extraDice = 0) {
  let min = 1;
  let max = 2;
  const choices = Array.isArray(choicesOrMode) ? choicesOrMode : [];
  const fallback = Array.isArray(choicesOrMode) ? 'max' : choicesOrMode;
  let choiceIndex = 0;

  for (let i = 1; i <= Math.max(0, dexBonus); i += 1) {
    if (i % 2 === 1) max += 1;
    else {
      const choice = choices[choiceIndex] || fallback;
      if (choice === 'min' && min < max) min += 1;
      else max += 1;
      choiceIndex += 1;
    }
  }
  const faces = Math.max(1, max - min + 1);
  const fixed = min - 1;
  const single = faces === 1 ? `${min}` : `1d${faces}${fixed ? `+${fixed}` : ''}`;
  const count = Math.max(1, 1 + int(extraDice));
  return count === 1 ? single : `${single} x${count}`;
}

function getDerived() {
  const stats = getTotalStats();
  const bonuses = Object.fromEntries(STAT_KEYS.map((key) => [key, bonusOf(stats[key])]));
  const rank = getRankInfo(state.growth.fame);
  const officeLevel = getOfficeLevelInfo(state.office.fame);
  const level = rank.level;
  const hp = stats.CON * 4 + level * 5;
  const mp = stats.POW * 2 + level * 5;
  const dodge = bonuses.DEX + level;
  const defense = bonuses.CON + level;
  const hit = bonuses.AGE + level;
  const maxWeight = stats.STR;
  const lightMax = Math.max(0, 3 + int(state.combat.lightMaxExtra));
  const insanityMax = 5 + bonuses.POW;
  const speedChoices = getSpeedChoicesForBonus(bonuses.DEX);
  const speed = getSpeedExpression(bonuses.DEX, speedChoices, state.combat.speedDiceExtra);
  return { stats, bonuses, rank, level, officeLevel, hp, mp, dodge, defense, hit, maxWeight, lightMax, insanityMax, speed };
}

function getTotals() {
  ensureWarehouseState();
  const weaponCost = state.equipment.weapons.reduce((sum, row) => sum + equipmentRowCost('weapons', row), 0);
  const armorCost = state.equipment.armors.reduce((sum, row) => sum + equipmentRowCost('armors', row), 0);
  const itemCost = state.equipment.items.reduce((sum, row) => sum + equipmentRowCost('items', row), 0);
  const warehouseWeaponCost = state.warehouse.weapons.reduce((sum, row) => sum + equipmentRowCost('warehouseWeapons', row), 0);
  const warehouseArmorCost = state.warehouse.armors.reduce((sum, row) => sum + equipmentRowCost('warehouseArmors', row), 0);
  const warehouseItemCost = state.warehouse.items.reduce((sum, row) => sum + equipmentRowCost('warehouseItems', row), 0);
  const warehouseCost = warehouseWeaponCost + warehouseArmorCost + warehouseItemCost;
  const consumedItemCost = Math.max(0, int(state.equipment.consumedItemCost));
  const prostheticCost = state.equipment.prosthetics.reduce((sum, row) => sum + int(row.cost), 0);
  const equipmentUpgradeCost = (state.equipment.upgrades || []).reduce((sum, row) => sum + getEquipmentUpgradeCost(row), 0);
  const weaponWeight = state.equipment.weapons.reduce((sum, row) => sum + clampNumber(row.weight), 0);
  const armorWeight = state.equipment.armors.reduce((sum, row) => sum + clampNumber(row.weight), 0);
  const itemWeight = state.equipment.items.reduce((sum, row) => sum + clampNumber(row.weight) * Math.max(1, int(row.qty, 1)), 0);
  const prostheticWeight = state.equipment.prosthetics.reduce((sum, row) => sum + clampNumber(row.weight), 0);
  const skillCost = state.skills.combat.reduce((sum, row) => sum + getCombatSkillTotalPointCost(row), 0);
  const passiveCost = state.skills.passives.reduce((sum, row) => sum + int(row.pointCost), 0);
  const enhanceCost = totalEnhancementCost();
  const activeEquipmentCost = weaponCost + armorCost + itemCost + consumedItemCost + prostheticCost;
  return {
    moneyUsed: activeEquipmentCost + warehouseCost + equipmentUpgradeCost + enhanceCost,
    equipmentCost: activeEquipmentCost + warehouseCost,
    activeEquipmentCost,
    warehouseCost,
    consumedItemCost,
    equipmentUpgradeCost,
    enhanceCost,
    totalWeight: weaponWeight + armorWeight + itemWeight + prostheticWeight,
    skillUsed: skillCost + passiveCost,
    skillCost,
    passiveCost
  };
}

function getDisplayCharacterName() {
  return oneLine(state.profile.characterName);
}

function updateCharacterIdentity() {
  const name = getDisplayCharacterName();
  const displayName = name || '未設定';
  const titleEl = $('#currentCharacterTitle');
  if (titleEl) titleEl.textContent = `現在のキャラクター：${displayName}`;
  document.title = name ? `LoMTRPG (${name})` : 'LoMTRPG キャラクリシート';
}

function updateOfficeLevelDisplay(info = getOfficeLevelInfo(state.office.fame)) {
  const input = $('#officeLevel');
  if (input) input.value = info.level;
  const detail = $('#officeLevelDetail');
  if (detail) {
    detail.textContent = `事務所名声点 ${int(state.office.fame).toLocaleString('ja-JP')} / 事務所Lv${info.level}（${formatProgressNext(state.office.fame, info, '点')}）`;
  }
}

function updateAll(shouldSave = true) {
  collectBoundInputs();
  const officeLevelInfo = syncOfficeLevel();
  updateCharacterIdentity();
  updateOfficeLevelDisplay(officeLevelInfo);
  const specialtyBefore = $('#specialtyPassive').value;
  updateSpecialtyPassiveOptions();
  if (specialtyBefore && $('#specialtyPassive').value !== specialtyBefore) state.build.specialtyPassive = $('#specialtyPassive').value;
  updateTacticDetails();
  updateStatTable();
  updateEnhancementPanel();
  renderSpeedChoiceControls();
  updateDerivedCards();
  updateInfoTables();
  updateNotes();
  updateWarnings();
  updateOutput();
  updateJsonBox();
  refreshCombatSkillCostDisplays();
  updateBottomSkillBar();
  updateRewardPreview();
  updateLibraryUi();
  if (shouldSave) scheduleSave();
}

function updateStatTable() {
  const origin = ORIGINS[state.build.origin] || ORIGINS.nest;
  const derived = getDerived();
  STAT_KEYS.forEach((key) => {
    const data = state.stats[key];
    const row = $(`tr[data-stat="${key}"]`);
    if (!row) return;
    ['base', 'boost', 'misc'].forEach((field) => {
      const input = row.querySelector(`[data-stat-field="${field}"]`);
      if (input && input !== document.activeElement) input.value = data[field] ?? 0;
    });
    const enhancementInput = $(`input[data-enhancement-stat="${key}"]`);
    if (enhancementInput && enhancementInput !== document.activeElement) enhancementInput.value = Math.max(0, int(data.boost));
    row.querySelector('[data-role="dice"]').textContent = origin.dice[key] || '-';
    row.querySelector('[data-role="specialty"]').textContent = signed(getSpecialtyMod(key));
    row.querySelector('[data-role="total"]').textContent = derived.stats[key];
    row.querySelector('[data-role="bonus"]').textContent = derived.bonuses[key];
    row.querySelector('[data-role="boostCost"]').textContent = formatMoney(enhancementCostForStat(key));
  });
}

function updateEnhancementPanel() {
  const summary = $('#enhancementSummary');
  const tbody = $('#enhancementRows');
  if (!summary || !tbody) return;
  const totals = getTotals();
  const cashLeft = int(state.growth.cashStart) - totals.moneyUsed;
  const enhancedStats = STAT_KEYS.filter((key) => getEnhancementInfo(key).boost > 0).length;
  summary.innerHTML = [
    ['施術済み能力', `${enhancedStats}/${STAT_KEYS.length}`, '強化値が1以上の能力数'],
    ['施術費合計', formatMoney(totals.enhanceCost), '能力値強化に消費した眼'],
    ['現在所持金', formatMoney(state.growth.cashStart), '作成時または現在の所持金'],
    ['残金', formatMoney(cashLeft), '装備・強化・施術を差し引いた残り']
  ].map(([label, value, memo]) => `<article class="derived-card"><span>${label}</span><strong>${value}</strong><small>${memo}</small></article>`).join('');

  STAT_KEYS.forEach((key) => {
    const info = getEnhancementInfo(key);
    const row = tbody.querySelector(`tr[data-enhancement-row="${key}"]`);
    if (!row) return;
    const input = row.querySelector(`input[data-enhancement-stat="${key}"]`);
    if (input && input !== document.activeElement) input.value = info.boost;
    row.querySelector('[data-enhancement-role="base"]').textContent = info.base;
    row.querySelector('[data-enhancement-role="specialty"]').textContent = signed(info.specialty);
    row.querySelector('[data-enhancement-role="misc"]').textContent = info.misc;
    row.querySelector('[data-enhancement-role="before"]').textContent = info.before;
    row.querySelector('[data-enhancement-role="after"]').textContent = info.after;
    row.querySelector('[data-enhancement-role="bonus"]').textContent = info.bonus;
    row.querySelector('[data-enhancement-role="cost"]').textContent = formatMoney(info.cost);
    row.querySelector('[data-enhancement-role="detail"]').textContent = formatEnhancementDetail(key);
  });

  const table = $('#enhancementCostTable');
  if (table) {
    table.innerHTML = `<table class="info-table"><thead><tr><th>能力値帯</th><th>ボーナス</th><th>1点費用</th></tr></thead><tbody>${ENHANCE_COST_TABLE.map((row) => `<tr><td>${row.min}～${row.max}</td><td>${row.bonus}</td><td>${formatMoney(row.cost)}</td></tr>`).join('')}</tbody></table>`;
  }

  const breakdown = $('#enhancementBreakdown');
  if (breakdown) {
    breakdown.innerHTML = `<table class="info-table"><thead><tr><th>能力</th><th>施術</th><th>費用</th></tr></thead><tbody>${STAT_KEYS.map((key) => {
      const info = getEnhancementInfo(key);
      return `<tr><td>${key}（${STAT_LABELS[key]}）</td><td>+${info.boost}</td><td>${formatMoney(info.cost)}</td></tr>`;
    }).join('')}<tr><th>合計</th><th></th><th>${formatMoney(totals.enhanceCost)}</th></tr></tbody></table>`;
  }
}

function signed(value) {
  const n = int(value);
  return n > 0 ? `+${n}` : String(n);
}

function updateDerivedCards() {
  const d = getDerived();
  const cards = [
    ['HP', d.hp, 'CON×4 + レベル×5'],
    ['MP', d.mp, 'POW×2 + レベル×5'],
    ['回避力', d.dodge, 'DEXボーナス + レベル'],
    ['防御力', d.defense, 'CONボーナス + レベル'],
    ['命中力', d.hit, 'AGEボーナス + レベル'],
    ['最大重量', d.maxWeight, 'STRと同値'],
    ['光最大値', d.lightMax, '初期3 + 補正'],
    ['狂気点上限', d.insanityMax, '5 + POWボーナス'],
    ['速度', d.speed, formatSpeedChoiceSummary(d.bonuses.DEX)],
    ['階級/レベル', `${d.rank.grade} / ${d.level}`, `名声点 ${int(state.growth.fame)}（${formatProgressNext(state.growth.fame, d.rank, '点')}）`],
    ['事務所Lv', d.officeLevel.level, `事務所名声 ${int(state.office.fame)}（${formatProgressNext(state.office.fame, d.officeLevel, '点')}）`]
  ];
  $('#derivedCards').innerHTML = cards.map(([label, value, formula]) => `<article class="derived-card"><span>${label}</span><strong>${value}</strong><small>${formula}</small></article>`).join('');
  $('#summaryGrade').textContent = d.rank.grade;
  $('#summaryLevel').textContent = d.level;
  $('#summaryHp').textContent = d.hp;
  $('#summaryMp').textContent = d.mp;
  $('#summaryLight').textContent = `${int(state.combat.lightCurrent)}/${d.lightMax}`;
  $('#summarySpeed').textContent = d.speed;
}

function renderSpeedChoiceControls() {
  const root = $('#speedChoiceControls');
  if (!root) return;

  const dexBonus = bonusOf(getTotalStats().DEX);
  const choices = getSpeedChoicesForBonus(dexBonus);
  if (!choices.length) {
    root.innerHTML = `
      <div class="speed-choice-head">
        <strong>速度成長選択</strong>
        <small>DEXボーナスが2以上になると、偶数ボーナスごとに最低値か最大値を選べます。</small>
      </div>
      <p class="note">現在のDEXボーナスは ${dexBonus} です。速度は基本値 1d2 から計算されます。</p>
    `;
    return;
  }

  root.innerHTML = `
    <div class="speed-choice-head">
      <strong>速度成長選択</strong>
      <small>DEXボーナス2、4、6…に到達するたび、速度の最低値か最大値を上げます。</small>
    </div>
    <div class="speed-choice-grid">
      ${choices.map((choice, index) => {
        const bonus = (index + 1) * 2;
        return `
          <label class="speed-choice-item">
            <span>DEXボーナス ${bonus}</span>
            <select data-speed-choice-index="${index}">
              <option value="max" ${choice === 'max' ? 'selected' : ''}>最大値を上げる</option>
              <option value="min" ${choice === 'min' ? 'selected' : ''}>最低値を上げる</option>
            </select>
          </label>
        `;
      }).join('')}
    </div>
  `;
}

function formatSpeedChoiceSummary(dexBonus) {
  const choices = getSpeedChoicesForBonus(dexBonus);
  if (!choices.length) return 'DEXボーナス2以上で選択';
  return choices
    .map((choice, index) => `B${(index + 1) * 2}:${choice === 'min' ? '最低値' : '最大値'}`)
    .join(' / ');
}

function updateInfoTables() {
  $('#rankTable').innerHTML = `<table class="info-table"><thead><tr><th>階級</th><th>Lv</th><th>必要名声</th></tr></thead><tbody>${RANK_TABLE.map((row) => `<tr><td>${row.grade}</td><td>${row.level}</td><td>${row.fame}</td></tr>`).join('')}</tbody></table>`;
  const officeLevelTable = $('#officeLevelTable');
  if (officeLevelTable) {
    officeLevelTable.innerHTML = `<table class="info-table"><thead><tr><th>事務所Lv</th><th>必要事務所名声</th></tr></thead><tbody>${OFFICE_LEVEL_TABLE.map((row) => `<tr><td>${row.level}</td><td>${row.fame}</td></tr>`).join('')}</tbody></table>`;
  }
  $('#costTable').innerHTML = `<table class="info-table"><thead><tr><th>能力値</th><th>ボーナス</th><th>1点費用</th></tr></thead><tbody>${ENHANCE_COST_TABLE.map((row) => `<tr><td>${row.min}～${row.max}</td><td>${row.bonus}</td><td>${formatMoney(row.cost)}</td></tr>`).join('')}</tbody></table>`;
  const totals = getTotals();
  const d = getDerived();
  const cashLeft = int(state.growth.cashStart) - totals.moneyUsed;
  const skillLeft = int(state.growth.skillPointStart) - totals.skillUsed;
  const weightState = getWeightPenalty(totals.totalWeight, d.maxWeight);
  $('#resourceSummary').innerHTML = `
    <table class="info-table"><tbody>
      <tr><th>所持金</th><td>${formatMoney(state.growth.cashStart)}</td></tr>
      <tr><th>装備費</th><td>${formatMoney(totals.equipmentCost)}</td></tr>
      <tr><th>倉庫保管分</th><td>${formatMoney(totals.warehouseCost)}</td></tr>
      <tr><th>装備強化費</th><td>${formatMoney(totals.equipmentUpgradeCost)}</td></tr>
      <tr><th>強化費</th><td>${formatMoney(totals.enhanceCost)}</td></tr>
      <tr><th>残金</th><td>${formatMoney(cashLeft)}</td></tr>
      <tr><th>技能点</th><td>${int(state.growth.skillPointStart)} / 使用 ${totals.skillUsed} / 残 ${skillLeft}</td></tr>
      <tr><th>名声</th><td>${d.rank.grade} / Lv${d.level}（${formatProgressNext(state.growth.fame, d.rank, '点')}）</td></tr>
      <tr><th>事務所名声</th><td>事務所Lv${d.officeLevel.level}（${formatProgressNext(state.office.fame, d.officeLevel, '点')}）</td></tr>
      <tr><th>重量</th><td>${totals.totalWeight.toLocaleString('ja-JP')} / ${d.maxWeight} (${weightState.label})</td></tr>
    </tbody></table>`;
}

function getWeightPenalty(totalWeight, maxWeight) {
  if (maxWeight <= 0) return { label: '最大重量未設定', severity: 'info' };
  const ratio = totalWeight / maxWeight;
  if (ratio <= 1) return { label: '問題なし', severity: 'ok' };
  if (ratio <= 1.2) return { label: '重量超過：各判定-2', severity: 'warn' };
  if (ratio <= 1.5) return { label: '重量超過：各判定-4', severity: 'warn' };
  return { label: '過積載：各判定-4、移動不可、速度0目安', severity: 'danger' };
}

function updateNotes() {
  const origin = ORIGINS[state.build.origin] || ORIGINS.nest;
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = getSelectedSpecialtyPassive();
  $('#originNote').textContent = `出身ダイス：${STAT_KEYS.map((key) => `${key}=${origin.dice[key]}`).join(' / ')}。${origin.note}`;
  $('#specialtyNote').textContent = `得意分野：${specialty.note} 固有パッシブ「${specialty.fixed.name}」、選択パッシブ「${selected.name}」。`;
  const detailHtml = buildSpecialtyPassiveDetailHtml(specialty, selected);
  $('#selectedSpecialtyPassiveEffect').innerHTML = detailHtml;
  $('#specialtyPassivePreview').innerHTML = detailHtml;
  if (state.lightSeed.text === LIGHT_SEEDS[int(state.lightSeed.number) - 1]) $('#lightSeedText').value = state.lightSeed.text;
}

function updateWarnings() {
  const d = getDerived();
  const totals = getTotals();
  const warnings = [];
  const missingStats = STAT_KEYS.filter((key) => d.stats[key] <= 0);
  if (missingStats.length) warnings.push({ type: 'info', text: `未入力の能力値があります：${missingStats.join(', ')}。全身義体の場合は義体パーツに合わせて手入力してください。` });
  const cashLeft = int(state.growth.cashStart) - totals.moneyUsed;
  if (cashLeft < 0) warnings.push({ type: 'danger', text: `残金がマイナスです：${formatMoney(cashLeft)}。装備・強化費を確認してください。` });
  const skillLeft = int(state.growth.skillPointStart) - totals.skillUsed;
  if (skillLeft < 0) warnings.push({ type: 'danger', text: `技能点が不足しています：${skillLeft}点。戦闘技能・パッシブを確認してください。` });
  const weight = getWeightPenalty(totals.totalWeight, d.maxWeight);
  if (weight.severity !== 'ok') warnings.push({ type: weight.severity === 'info' ? 'info' : 'danger', text: `重量チェック：${weight.label}。現在 ${totals.totalWeight.toLocaleString('ja-JP')} / 最大 ${d.maxWeight}。` });
  if (int(state.mind.insanityCurrent) <= 0) warnings.push({ type: 'danger', text: `狂気点が0以下です。発狂処理の確認が必要です。` });
  if (int(state.mind.insanityCurrent) > d.insanityMax) warnings.push({ type: 'info', text: `狂気点が上限を超えています。現在 ${int(state.mind.insanityCurrent)} / 上限 ${d.insanityMax}。` });
  if (!warnings.length) warnings.push({ type: 'ok', text: '現時点で大きな不足・超過はありません。' });
  $('#warnings').innerHTML = warnings.map((w) => `<div class="warning ${w.type === 'ok' ? 'ok' : w.type === 'info' ? 'info' : ''}">${escapeHtml(w.text)}</div>`).join('');
}

function updateOutput() {
  $('#sheetText').textContent = buildSheetText();
  $('#tekeyPalette').textContent = buildTekeyPalette();
  $('#tekeyValues').textContent = buildTekeyValues();
  $('#tekeyColumns').textContent = buildTekeyColumns();
  $('#tekeyApiUrl').value = buildTekeyApiUrl();
  $('#tekeySetColumnsUrl').value = buildTekeySetColumnsUrl();
  $('#ccfoliaJson').value = buildCcfoliaJson();
}

function updateBottomSkillBar() {
  const root = $('.skill-point-bar');
  if (!root) return;
  const totals = getTotals();
  const owned = int(state.growth.skillPointStart);
  const left = owned - totals.skillUsed;
  const cashLeft = int(state.growth.cashStart) - totals.moneyUsed;
  $('#bottomSkillOwned').textContent = owned.toLocaleString('ja-JP');
  $('#bottomCashLeft').textContent = formatMoney(cashLeft);
  $('#bottomMoneyUsed').textContent = formatMoney(totals.moneyUsed);
  $('#bottomSkillUsed').textContent = totals.skillUsed.toLocaleString('ja-JP');
  $('#bottomSkillLeft').textContent = left.toLocaleString('ja-JP');
  root.classList.toggle('negative', left < 0);
  root.classList.toggle('cash-negative', cashLeft < 0);
}

function updateLibraryUi() {
  updateAccountStatus();
  renderCurrentCharacterSaveSummary();
  renderSavedCharacterList();
  updateShareCodeFields();
}

function safeFileName(name, fallback = 'lomtrpg_character') {
  return (name || fallback).replace(/[\\/:*?"<>|]/g, '_').trim() || fallback;
}

function normalizeAccountId(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

function makeId(prefix = 'id') {
  if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function getAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn(error);
    return {};
  }
}

function setAccounts(accounts) {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
}

function getActiveAccountId() {
  return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || '';
}

function setActiveAccountId(accountId) {
  if (accountId) localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
  else localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
}

function getActiveAccount() {
  const accountId = getActiveAccountId();
  if (!accountId) return null;
  const accounts = getAccounts();
  const account = accounts[accountId];
  if (!account) {
    setActiveAccountId('');
    return null;
  }
  if (!Array.isArray(account.characters)) account.characters = [];
  return account;
}

function loginAccount() {
  const accountName = normalizeAccountId($('#loginName').value);
  if (!accountName) {
    toast('アカウント名を入力してください');
    return;
  }

  const now = new Date().toISOString();
  const displayName = $('#loginDisplayName').value.trim() || accountName;
  const accounts = getAccounts();
  const existing = accounts[accountName];
  accounts[accountName] = {
    id: accountName,
    name: accountName,
    displayName,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    characters: Array.isArray(existing?.characters) ? existing.characters : []
  };
  setAccounts(accounts);
  setActiveAccountId(accountName);
  updateLibraryUi();
  toast(`${displayName}でログインしました`);
}

function logoutAccount() {
  setActiveAccountId('');
  updateLibraryUi();
  toast('ログアウトしました');
}

function updateAccountStatus() {
  const status = $('#accountStatus');
  if (!status) return;
  const account = getActiveAccount();
  status.textContent = account ? `ログイン: ${account.displayName || account.name}` : '未ログイン';
  status.classList.toggle('logged-in', Boolean(account));

  const note = $('#accountNote');
  if (note) {
    note.textContent = account
      ? `${account.displayName || account.name} の保存庫に ${account.characters.length}件保存されています。この情報はこのブラウザだけに保存されます。`
      : 'アカウント名を入力すると、このブラウザ内にキャラクター保存庫を作れます。';
  }
}

function cloneCharacterForLibrary(characterData = state) {
  return mergeDefaults(structuredCloneSafe(characterData));
}

function getSavedShareSource(characterData = state, existingEntry = null) {
  const meta = characterData?.meta || {};
  const sharedBy = meta.sharedBy || existingEntry?.sharedBy || existingEntry?.data?.meta?.sharedBy || null;
  if (!sharedBy) return { sharedBy: null, sharedAt: '' };
  return {
    sharedBy,
    sharedAt: meta.sharedAt || existingEntry?.sharedAt || existingEntry?.data?.meta?.sharedAt || ''
  };
}

function saveCurrentCharacterToLibrary() {
  const activeId = getActiveAccountId();
  const accounts = getAccounts();
  const account = accounts[activeId];
  if (!activeId || !account) {
    activateTab('library');
    toast('先に保存庫でログインしてください');
    return;
  }

  collectBoundInputs();
  syncOfficeLevel();

  const now = new Date().toISOString();
  if (!Array.isArray(account.characters)) account.characters = [];
  const existingId = state.meta?.libraryId || '';
  const existing = account.characters.find((entry) => entry.id === existingId);
  const characterId = existing ? existing.id : makeId('character');
  const nameInput = $('#librarySaveName');
  const memoInput = $('#librarySaveMemo');
  const saveName = (nameInput?.value || '').trim() || state.profile.characterName || existing?.name || '無名キャラクター';
  const saveMemo = memoInput ? memoInput.value.trim() : existing?.memo || '';
  const sharedSource = getSavedShareSource(state, existing);

  state.meta = {
    ...(state.meta || {}),
    libraryId: characterId,
    librarySavedAt: now,
    importedFromShare: Boolean(sharedSource.sharedBy),
    sharedBy: sharedSource.sharedBy,
    sharedAt: sharedSource.sharedAt
  };

  const entry = {
    id: characterId,
    name: saveName,
    memo: saveMemo,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    sharedBy: sharedSource.sharedBy,
    sharedAt: sharedSource.sharedAt,
    data: cloneCharacterForLibrary(state)
  };
  account.characters = [
    entry,
    ...account.characters.filter((character) => character.id !== characterId)
  ].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  account.updatedAt = now;
  accounts[activeId] = account;
  setAccounts(accounts);
  if (nameInput) nameInput.value = saveName;
  if (memoInput) memoInput.value = saveMemo;
  saveState();
  updateLibraryUi();
  toast('キャラクターを保存しました');
}

function loadCharacterFromLibrary(characterId) {
  const account = getActiveAccount();
  const entry = account?.characters.find((character) => character.id === characterId);
  if (!entry) {
    toast('保存キャラクターが見つかりません');
    return;
  }

  state = mergeDefaults(entry.data);
  const sharedSource = getSavedShareSource(state, entry);
  state.meta = {
    ...(state.meta || {}),
    libraryId: entry.id,
    librarySavedAt: entry.updatedAt || '',
    importedFromShare: Boolean(sharedSource.sharedBy),
    sharedBy: sharedSource.sharedBy,
    sharedAt: sharedSource.sharedAt
  };
  populateStateToDom();
  $('#librarySaveName').value = entry.name || state.profile.characterName || '';
  $('#librarySaveMemo').value = entry.memo || '';
  saveState();
  activateTab('basic');
  toast(`${entry.name || state.profile.characterName || 'キャラクター'}を読み込みました`);
}

function deleteCharacterFromLibrary(characterId) {
  const activeId = getActiveAccountId();
  const accounts = getAccounts();
  const account = accounts[activeId];
  const entry = account?.characters?.find((character) => character.id === characterId);
  if (!entry) return;
  if (!confirm(`「${entry.name || '無名キャラクター'}」を保存庫から削除します。よろしいですか？`)) return;

  account.characters = account.characters.filter((character) => character.id !== characterId);
  account.updatedAt = new Date().toISOString();
  accounts[activeId] = account;
  setAccounts(accounts);
  if (state.meta?.libraryId === characterId) {
    state.meta.libraryId = '';
    state.meta.librarySavedAt = '';
    saveState();
  }
  updateLibraryUi();
  toast('保存キャラクターを削除しました');
}

function newCharacterFromLibrary() {
  if (!confirm('現在の編集中内容を新規キャラクターに切り替えます。保存していない変更は失われます。よろしいですか？')) return;
  state = structuredCloneSafe(DEFAULT_STATE);
  $('#librarySaveName').value = '';
  $('#librarySaveMemo').value = '';
  populateStateToDom();
  saveState();
  activateTab('basic');
  toast('新規キャラクターを作成しました');
}

function handleSavedCharacterAction(event) {
  const button = event.target.closest('[data-library-action]');
  if (!button) return;
  const characterId = button.dataset.characterId;
  const action = button.dataset.libraryAction;
  if (action === 'load') loadCharacterFromLibrary(characterId);
  if (action === 'delete') deleteCharacterFromLibrary(characterId);
  if (action === 'share') {
    const account = getActiveAccount();
    const entry = account?.characters.find((character) => character.id === characterId);
    if (entry) copyText(buildShareImportCodeForState(entry.data), '保存キャラの共有コードをコピーしました');
  }
}

function withTemporaryState(characterData, callback) {
  const current = state;
  state = mergeDefaults(characterData);
  try {
    return callback();
  } finally {
    state = current;
  }
}

function summarizeCharacterData(characterData) {
  return withTemporaryState(characterData, () => {
    const d = getDerived();
    const totals = getTotals();
    const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
    return {
      name: state.profile.characterName || '未設定',
      playerName: state.profile.playerName || '-',
      specialty: specialty.label,
      grade: d.rank.grade,
      level: d.level,
      hp: d.hp,
      mp: d.mp,
      skillOwned: int(state.growth.skillPointStart),
      skillUsed: totals.skillUsed,
      skillLeft: int(state.growth.skillPointStart) - totals.skillUsed
    };
  });
}

function renderCurrentCharacterSaveSummary() {
  const root = $('#currentCharacterSaveSummary');
  if (!root) return;
  const summary = summarizeCharacterData(state);
  const savedLabel = state.meta?.libraryId
    ? `保存IDあり / ${formatDateTime(state.meta.librarySavedAt) || '未同期'}`
    : '保存庫未登録';
  const cards = [
    ['キャラクター', summary.name, `PL: ${summary.playerName}`],
    ['階級/レベル', `${summary.grade} / Lv${summary.level}`, summary.specialty],
    ['HP/MP', `${summary.hp} / ${summary.mp}`, '読込時の自動計算値'],
    ['技能点', `${summary.skillUsed} / ${summary.skillOwned}`, `残 ${summary.skillLeft}`],
    ['保存状態', savedLabel, 'キャラ保存で保存庫へ反映']
  ];
  if (state.meta?.importedFromShare) {
    cards.push([
      '共有元',
      formatAccountName(state.meta.sharedBy),
      state.meta.sharedAt ? `共有日時: ${formatDateTime(state.meta.sharedAt)}` : '共有コードから読み込み'
    ]);
  }
  root.innerHTML = cards.map(([label, value, note]) => `
    <article class="derived-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </article>
  `).join('');
}

function renderSavedCharacterList() {
  const root = $('#savedCharacterList');
  if (!root) return;
  const account = getActiveAccount();
  if (!account) {
    root.innerHTML = '<div class="character-empty">ログインすると、保存したキャラクターの一覧を確認できます。</div>';
    return;
  }
  if (!account.characters.length) {
    root.innerHTML = '<div class="character-empty">まだ保存されたキャラクターはありません。「このキャラを保存」から登録できます。</div>';
    return;
  }

  root.innerHTML = account.characters.map((entry) => {
    const summary = summarizeCharacterData(entry.data);
    const activeLabel = state.meta?.libraryId === entry.id ? '<span>編集中</span>' : '';
    const sharedSource = getSavedShareSource(entry.data, entry);
    const sharedSourceLabel = sharedSource.sharedBy
      ? `<span>共有元: ${escapeHtml(formatAccountName(sharedSource.sharedBy))}</span>`
      : '';
    return `
      <article class="character-card">
        <div class="character-card-header">
          <div>
            <h3>${escapeHtml(entry.name || summary.name)}</h3>
            <p>${escapeHtml(entry.memo || 'メモなし')}</p>
          </div>
          <div class="character-meta">${activeLabel}<span>${escapeHtml(formatDateTime(entry.updatedAt))}</span></div>
        </div>
        <div class="character-meta">
          <span>PC: ${escapeHtml(summary.name)}</span>
          <span>PL: ${escapeHtml(summary.playerName)}</span>
          ${sharedSourceLabel}
          <span>${escapeHtml(summary.grade)} / Lv${summary.level}</span>
          <span>${escapeHtml(summary.specialty)}</span>
          <span>HP ${summary.hp}</span>
          <span>MP ${summary.mp}</span>
          <span>技能 ${summary.skillUsed}/${summary.skillOwned} 残${summary.skillLeft}</span>
        </div>
        <div class="character-card-actions">
          <button type="button" class="primary small" data-library-action="load" data-character-id="${escapeHtml(entry.id)}">読み込む</button>
          <button type="button" class="ghost small" data-library-action="share" data-character-id="${escapeHtml(entry.id)}">共有コードコピー</button>
          <button type="button" class="danger small" data-library-action="delete" data-character-id="${escapeHtml(entry.id)}">削除</button>
        </div>
      </article>
    `;
  }).join('');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function updateShareCodeFields() {
  const field = $('#shareCode');
  if (field) field.value = buildShareImportCodeForState(state);
  const accountRoot = $('#shareAccountInfo');
  if (accountRoot) {
    const account = getActiveAccount();
    accountRoot.innerHTML = account
      ? `共有者: <strong>${escapeHtml(formatAccountName(account))}</strong>`
      : '共有者: <strong>未ログイン</strong>';
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64ToBase64Url(value) {
  return String(value || '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBase64(value) {
  const normalized = String(value || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
}

function getShareAccountSnapshot() {
  const account = getActiveAccount();
  if (!account) return null;
  return {
    name: account.name || account.id || '',
    displayName: account.displayName || account.name || account.id || ''
  };
}

function formatAccountName(account) {
  if (!account) return '未ログイン';
  const name = account.name || account.id || '';
  const displayName = account.displayName || name || '未ログイン';
  if (name && displayName && name !== displayName) return `${displayName}（${name}）`;
  return displayName || name || '未ログイン';
}

function encodeSharePayload(characterData, options = {}) {
  const payload = {
    app: 'lomtrpg-character-creator',
    version: 2,
    sharedAt: options.sharedAt || new Date().toISOString(),
    sharedBy: options.sharedBy === undefined ? getShareAccountSnapshot() : options.sharedBy,
    data: cloneCharacterForLibrary(characterData)
  };
  const json = JSON.stringify(payload);
  if (window.TextEncoder) return base64ToBase64Url(bytesToBase64(new TextEncoder().encode(json)));
  return base64ToBase64Url(btoa(unescape(encodeURIComponent(json))));
}

function decodeSharePayload(encoded) {
  let json = '';
  const base64 = base64UrlToBase64(encoded);
  if (window.TextDecoder) json = new TextDecoder().decode(base64ToBytes(base64));
  else json = decodeURIComponent(escape(atob(base64)));
  const payload = JSON.parse(json);
  return {
    data: mergeDefaults(payload.data || payload),
    sharedBy: payload.sharedBy || null,
    sharedAt: payload.sharedAt || ''
  };
}

function buildShareImportCodeForState(characterData = state, options = {}) {
  const encoded = encodeSharePayload(characterData, options);
  return `${SHARE_CODE_PREFIX}\n${encoded}\n${SHARE_CODE_SUFFIX}`;
}

function buildShareUrlForState(characterData = state) {
  const url = new URL(window.location.href);
  url.hash = `share=${encodeURIComponent(encodeSharePayload(characterData))}`;
  return url.toString();
}

function extractShareCodeValue(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const hash = url.hash.replace(/^#/, '');
      if (hash.startsWith('share=')) return decodeURIComponent(hash.slice(6));
      const params = new URLSearchParams(hash);
      const share = params.get('share');
      if (share) return share;
    } catch (error) {
      console.warn(error);
    }
  }

  if (raw.startsWith('share=')) return decodeURIComponent(raw.slice(6));
  if (raw.startsWith('#share=')) return decodeURIComponent(raw.slice(7));
  if (raw.includes(SHARE_CODE_PREFIX)) {
    return raw
      .replace(SHARE_CODE_PREFIX, '')
      .replace(SHARE_CODE_SUFFIX, '')
      .replace(/\s+/g, '')
      .trim();
  }
  return raw.replace(/\s+/g, '');
}

function getShareHashValue() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return '';
  if (raw.startsWith('share=')) return decodeURIComponent(raw.slice(6));
  const params = new URLSearchParams(raw);
  return params.get('share') || '';
}

function loadSharedCharacterFromHash(options = {}) {
  const { render = true, notify = true } = options;
  const encoded = getShareHashValue();
  if (!encoded) {
    if (notify) toast('URLに共有データがありません');
    return false;
  }

  try {
    const decoded = decodeSharePayload(encoded);
    state = decoded.data;
    state.meta = {
      ...(state.meta || {}),
      libraryId: '',
      librarySavedAt: '',
      importedFromShare: true,
      sharedBy: decoded.sharedBy || null,
      sharedAt: decoded.sharedAt || ''
    };
    if (render) {
      populateStateToDom();
      saveState();
    }
    if (notify) toast('共有キャラクターを読み込みました');
    return true;
  } catch (error) {
    console.error(error);
    if (notify) toast('共有データの読み込みに失敗しました');
    return false;
  }
}

function importShareCode() {
  const field = $('#shareImportCode');
  const code = field?.value || '';
  const encoded = extractShareCodeValue(code);
  if (!encoded) {
    toast('共有コードを入力してください');
    return false;
  }

  try {
    const decoded = decodeSharePayload(encoded);
    state = decoded.data;
    state.meta = {
      ...(state.meta || {}),
      libraryId: '',
      librarySavedAt: '',
      importedFromShare: true,
      sharedBy: decoded.sharedBy || null,
      sharedAt: decoded.sharedAt || ''
    };
    populateStateToDom();
    saveState();
    activateTab('basic');
    toast(`共有キャラクターを読み込みました（共有者: ${formatAccountName(decoded.sharedBy)}）`);
    return true;
  } catch (error) {
    console.error(error);
    toast('共有コードの読み込みに失敗しました');
    return false;
  }
}

function buildSheetText() {
  const d = getDerived();
  const totals = getTotals();
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = getSelectedSpecialtyPassive();
  const cashLeft = int(state.growth.cashStart) - totals.moneyUsed;
  const skillLeft = int(state.growth.skillPointStart) - totals.skillUsed;
  const statLine = STAT_KEYS.map((key) => `${key}:${d.stats[key]}(B${d.bonuses[key]})`).join(' / ');
  const conditionLine = buildConditionLine();
  const weapons = state.equipment.weapons.filter((row) => row.name || row.memo).map((row) => `・${row.name || '無名武器'} [${row.rank}/${row.type}] 威力:${row.power || '-'} 命中:${row.hit || '-'} 重量:${row.weight || 0} ${row.memo || ''}`).join('\n') || '・なし';
  const armors = state.equipment.armors.filter((row) => row.name || row.memo).map((row) => `・${row.name || '無名防具'} ${formatArmorResistanceLine(row)} 重量:${row.weight || 0} ${row.memo || ''}`).join('\n') || '・なし';
  const items = state.equipment.items.filter((row) => row.name || row.memo).map((row) => `・${row.name || '無名アイテム'} x${row.qty || 1} 重量:${row.weight || 0} 価格:${formatMoney(row.cost || 0)} ${row.memo || ''}`).join('\n') || '・なし';
  const prosthetics = state.equipment.prosthetics.filter((row) => row.name || row.memo).map((row) => formatProstheticLine(row)).join('\n') || '・なし';
  const equipmentUpgrades = (state.equipment.upgrades || []).filter(hasEquipmentUpgradeContent).map(formatEquipmentUpgradeLine).join('\n') || '・なし';
  const enhancements = buildEnhancementLines();
  const skills = state.skills.combat.filter(hasCombatSkillContent).map(formatCombatSkillLine).join('\n') || '・なし';
  const tactics = formatTacticList([state.office.tactic1, state.office.tactic2], (value) => `・${formatTacticSelection(value)}`, '\n');
  const passives = [
    `・固有:${specialty.fixed.name} - ${specialty.fixed.text}`,
    `・選択:${selected.name} - ${selected.text}`,
    ...state.skills.passives.filter((row) => row.name || row.memo).map((row) => formatPassiveSkillLine(row))
  ].join('\n');

  return `【LoMTRPG キャラクターシート】
名前：${state.profile.characterName || '未設定'}　PL：${state.profile.playerName || '未設定'}
年齢：${state.profile.age || '-'}　性別：${state.profile.gender || '-'}　役割：${state.profile.role || '-'}
出身：${ORIGINS[state.build.origin]?.label || '-'}　得意分野：${specialty.label}
階級：${d.rank.grade}　レベル：${d.level}　名声点：${int(state.growth.fame)}

■主能力値
${statLine}

■副能力値
HP:${d.hp}　MP:${d.mp}　回避力:${d.dodge}　防御力:${d.defense}　命中力:${d.hit}
光:${int(state.combat.lightCurrent)}/${d.lightMax}　速度:${d.speed}（${formatSpeedChoiceSummary(d.bonuses.DEX)}）　最大重量:${d.maxWeight}
狂気点:${int(state.mind.insanityCurrent)}/${d.insanityMax}　ねじれ点:${int(state.mind.twistPoint)}
感情レベル:${int(state.emotion.level, 1)}　PE:${int(state.emotion.pe)}　NE:${int(state.emotion.ne)}　混乱:${state.conditions.confused ? 'あり' : 'なし'}
状態:${conditionLine || 'なし'}

■光の種
${int(state.lightSeed.number)}. ${state.lightSeed.text || LIGHT_SEEDS[int(state.lightSeed.number) - 1] || '-'}
発芽率：${int(state.lightSeed.germinationRate)}%
${state.lightSeed.memo || ''}

■武器
${weapons}

■防具
${armors}

■アイテム
${items}

■義体
${prosthetics}

■装備強化
${equipmentUpgrades}

■強化施術
${enhancements}

■戦闘技能
${skills}

■パッシブ
${passives}

■事務所
事務所名：${state.office.name || '-'}　代表：${state.office.leader || '-'}　Lv:${d.officeLevel.level}　名声:${int(state.office.fame)}
戦術スキル：
${tactics}
メンバー：${state.office.members || '-'}

■リソース
初期所持金：${formatMoney(state.growth.cashStart)}　使用：${formatMoney(totals.moneyUsed)}　残金：${formatMoney(cashLeft)}
装備費：${formatMoney(totals.equipmentCost)}　装備強化費：${formatMoney(totals.equipmentUpgradeCost)}　能力値強化費：${formatMoney(totals.enhanceCost)}
技能点：${int(state.growth.skillPointStart)}　使用：${totals.skillUsed}　残：${skillLeft}
重量：${totals.totalWeight.toLocaleString('ja-JP')} / ${d.maxWeight}（${getWeightPenalty(totals.totalWeight, d.maxWeight).label}）

■プロフィール
経歴表：${state.profile.fixerHistory || '-'}
経歴：${state.profile.history || '-'}
外見・性格：${state.profile.appearance || '-'}
関係者・目的：${state.profile.bonds || '-'}

■メモ
${state.office.memo || ''}`;
}

function buildConditionLine() {
  const labels = [
    ['パワー', state.conditions.power],
    ['クイック', state.conditions.quick],
    ['忍耐', state.conditions.endurance],
    ['保護', state.conditions.protection],
    ['脆弱', state.conditions.fragile],
    ['出血', state.conditions.bleed],
    ['火傷', state.conditions.burn],
    ['麻痺', state.conditions.paralysis]
  ];
  return labels
    .filter(([, value]) => int(value) !== 0)
    .map(([label, value]) => `${label}:${int(value)}`)
    .join(' / ');
}

function getSelectedSpecialtyPassive() {
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = specialty.choices.find((choice) => choice.name === state.build.specialtyPassive) || specialty.choices[0];
  return { ...selected };
}

function buildTacticDetailHtml(value) {
  const option = getTacticOption(value);
  if (!option) return '<span class="empty">未選択</span>';
  return `
    <div class="tactic-detail-head">
      <strong>${escapeHtml(option.label)}</strong>
      <span>用途:${escapeHtml(option.usage)} / エモーション:${escapeHtml(option.emotion)} / 時間:${escapeHtml(option.time)}</span>
    </div>
    <p>${escapeHtml(option.effect)}</p>
  `;
}

function updateTacticDetails() {
  ['tactic1', 'tactic2'].forEach((key) => {
    const select = $(`#${key}`);
    const detail = $(`#${key}Detail`);
    if (select && select.value !== state.office[key]) select.value = state.office[key] || '';
    if (detail) detail.innerHTML = buildTacticDetailHtml(state.office[key]);
  });
}

function formatSpecialtyMods(specialty) {
  const mods = Object.entries(specialty.mods || {});
  if (!mods.length) return 'なし';
  return mods.map(([key, value]) => `${key}（${STAT_LABELS[key]}）${signed(value)}`).join(' / ');
}

function buildSpecialtyPassiveDetailHtml(specialty, selected) {
  const choices = specialty.choices.map((choice) => `
    <li class="${choice.name === selected.name ? 'active' : ''}">
      <strong>${escapeHtml(choice.name)}</strong>
      <span>${escapeHtml(choice.text)}</span>
    </li>
  `).join('');

  return `
    <div class="passive-detail-head">
      <div>
        <span>得意分野</span>
        <strong>${escapeHtml(specialty.label)}</strong>
        <small>${escapeHtml(specialty.note)}</small>
      </div>
      <div>
        <span>能力値補正</span>
        <strong>${escapeHtml(formatSpecialtyMods(specialty))}</strong>
        <small>主能力値の合計へ自動加算されます。</small>
      </div>
    </div>
    <div class="passive-detail-grid">
      <section>
        <h3>固有パッシブ</h3>
        <strong>${escapeHtml(specialty.fixed.name)}</strong>
        <p>${escapeHtml(specialty.fixed.text)}</p>
      </section>
      <section>
        <h3>現在の選択パッシブ</h3>
        <strong>${escapeHtml(selected.name)}</strong>
        <p>${escapeHtml(selected.text)}</p>
      </section>
    </div>
    <div class="passive-choice-list">
      <h3>この得意分野で選べる候補</h3>
      <ul>${choices}</ul>
    </div>
  `;
}

function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function ccfoliaSignedTerm(value, fallback = 0) {
  const n = int(value, fallback);
  return n >= 0 ? `+${n}` : String(n);
}

function buildCcfoliaWeaponCommandLines() {
  return state.equipment.weapons
    .filter((row) => oneLine(row.name))
    .flatMap((row) => {
      const name = oneLine(row.name);
      return [
        `2d6${ccfoliaSignedTerm(row.hit)}+{HIT}+{POWER} （${name}）命中判定`,
        `2d6${ccfoliaSignedTerm(row.power)}+{POWER} （${name}）ダメージ判定`
      ];
    });
}

function normalizeColor(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : '#DFB85F';
}

function getTekeyInitiative() {
  return int(state.tekey.initiative);
}

function buildTekeyStatuses() {
  const d = getDerived();
  return [
    { name: '混乱', value: state.conditions.confused ? 1 : 0, max: null, checkbox: true, allowOver: false },
    { name: 'HP', value: d.hp, max: d.hp, checkbox: false, allowOver: false },
    { name: 'MP', value: d.mp, max: d.mp, checkbox: false, allowOver: false },
    { name: '光', value: int(state.combat.lightCurrent), max: d.lightMax, checkbox: false, allowOver: false },
    { name: 'PE', value: int(state.emotion.pe), max: null, checkbox: false, allowOver: false },
    { name: 'NE', value: int(state.emotion.ne), max: null, checkbox: false, allowOver: false },
    { name: '感情レベル', value: int(state.emotion.level, 1), max: Math.max(1, d.officeLevel.level), checkbox: false, allowOver: false },
    { name: '狂気点', value: int(state.mind.insanityCurrent), max: d.insanityMax, checkbox: false, allowOver: false },
    { name: 'ねじれ点', value: int(state.mind.twistPoint), max: 5, checkbox: false, allowOver: false },
    { name: 'パワｌ', value: int(state.conditions.power), max: null, checkbox: false, allowOver: false },
    { name: 'クイック', value: int(state.conditions.quick), max: null, checkbox: false, allowOver: false },
    { name: '忍耐', value: int(state.conditions.endurance), max: null, checkbox: false, allowOver: false },
    { name: '保護', value: int(state.conditions.protection), max: null, checkbox: false, allowOver: false },
    { name: '脆弱', value: int(state.conditions.fragile), max: null, checkbox: false, allowOver: false },
    { name: '出血', value: int(state.conditions.bleed), max: null, checkbox: false, allowOver: false },
    { name: '火傷', value: int(state.conditions.burn), max: null, checkbox: false, allowOver: false },
    { name: '麻痺', value: int(state.conditions.paralysis), max: null, checkbox: false, allowOver: false }
  ];
}

function buildTekeyValues() {
  return buildTekeyStatuses()
    .map((row) => `${row.name}:${row.value}${row.max === null ? '' : `:${row.max}`}`)
    .join(',');
}

function buildTekeyColumns() {
  return TEKEY_STATUS_COLUMNS
    .map((row) => `${row.label}:${row.isCheck ? 'true' : 'false'}:${row.isOver ? 'true' : 'false'}`)
    .join(',');
}

function buildTekeyInfo() {
  const d = getDerived();
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = getSelectedSpecialtyPassive();
  const totals = getTotals();
  const statLine = STAT_KEYS.map((key) => `${key}:${d.stats[key]}(B${d.bonuses[key]})`).join(' / ');
  const weapons = state.equipment.weapons
    .filter((row) => row.name || row.memo)
    .map((row) => `${row.name || '無名武器'}[${row.rank}/${row.type}] 威力:${row.power || '-'} 命中:${row.hit || '-'} ${oneLine(row.memo)}`)
    .join(' / ') || 'なし';
  const armors = state.equipment.armors
    .filter((row) => row.name || row.memo)
    .map((row) => `${row.name || '無名防具'}[${formatArmorResistanceLine(row)}] ${oneLine(row.memo)}`)
    .join(' / ') || 'なし';
  const prosthetics = state.equipment.prosthetics
    .filter((row) => row.name || row.memo)
    .map((row) => formatProstheticLine(row, true))
    .join(' / ') || 'なし';
  const equipmentUpgrades = (state.equipment.upgrades || [])
    .filter(hasEquipmentUpgradeContent)
    .map((row) => oneLine(formatEquipmentUpgradeLine(row).replace(/^・/, '')))
    .join(' / ') || 'なし';
  const skills = state.skills.combat
    .filter(hasCombatSkillContent)
    .map((row) => oneLine(formatCombatSkillLine(row).replace(/^・/, '')))
    .join(' / ') || 'なし';
  const tactics = formatTacticList([state.office.tactic1, state.office.tactic2], formatTacticCompact, ' / ');
  return [
    `PL:${state.profile.playerName || '-'} / ${state.profile.role || '-'}`,
    `出身:${ORIGINS[state.build.origin]?.label || '-'} / 得意分野:${specialty.label} / 階級:${d.rank.grade} Lv:${d.level}`,
    `能力値:${statLine}`,
    `副能力値:HP${d.hp} MP${d.mp} 光${int(state.combat.lightCurrent)}/${d.lightMax} 速度${d.speed}（${formatSpeedChoiceSummary(d.bonuses.DEX)}） 命中${d.hit} 回避${d.dodge} 防御${d.defense}`,
    `パッシブ:固有 ${specialty.fixed.name}（${oneLine(specialty.fixed.text)}） / 選択 ${selected.name}（${oneLine(selected.text)}）`,
    `感情:Lv${int(state.emotion.level, 1)} PE${int(state.emotion.pe)} NE${int(state.emotion.ne)} / 混乱:${state.conditions.confused ? 'あり' : 'なし'} / 状態:${buildConditionLine() || 'なし'}`,
    `経歴表:${state.profile.fixerHistory || '-'}`,
    `光の種:${int(state.lightSeed.number)}. ${state.lightSeed.text || LIGHT_SEEDS[int(state.lightSeed.number) - 1] || '-'} 発芽率${int(state.lightSeed.germinationRate)}%`,
    `武器:${weapons}`,
    `防具:${armors}`,
    `義体:${prosthetics}`,
    `装備強化:${equipmentUpgrades}`,
    `技能:${skills}`,
    `重量:${totals.totalWeight.toLocaleString('ja-JP')}/${d.maxWeight} ${getWeightPenalty(totals.totalWeight, d.maxWeight).label}`,
    `事務所:${state.office.name || '-'} / 戦術:${tactics}`
  ].join('\n');
}

function buildTekeySetupMemo() {
  return [
    'システム: DiceBot',
    'ステータステーブル: 「ステータステーブルJSON保存」で出力したJSONをTekeyのステータステーブルへロード',
    'カウンターリモコン: 「カウンターリモコンJSON保存」で出力したJSONをTekeyのカウンターリモコンへロード',
    '速度表: マップを縦16・横16にして設置。速度ダイス決定後、PL/VC/行動済みの位置でコマを管理',
    '速度/修正値: 付属ステータステーブルでは非表示。必要に応じてPL=1、VC=2以降などで修正値を統一'
  ].join('\n');
}

function buildTekeyApiUrl() {
  const params = new URLSearchParams();
  const { apiKey, room, password } = getTekeyCredentials();
  const name = state.profile.characterName || 'LoMTRPGキャラクター';

  if (apiKey) params.set('apikey', apiKey);
  params.set('command', 'addCharacter');
  if (room) params.set('room', room);
  if (password) params.set('password', password);
  params.set('name', name);
  if (state.tekey.referenceUrl) params.set('url', state.tekey.referenceUrl);
  params.set('info', buildTekeyInfo());
  params.set('x', int(state.tekey.x));
  params.set('y', int(state.tekey.y));
  params.set('size', Math.max(1, int(state.tekey.size, 1)));
  params.set('initiative', getTekeyInitiative());
  if (state.tekey.imageUrl) params.set('image', state.tekey.imageUrl);
  params.set('values', buildTekeyValues());
  return `https://tekey.jp/api?${params.toString()}`;
}

function getTekeyCredentials() {
  const credential = (selector) => oneLine($(selector)?.value || '');
  return {
    apiKey: credential('#tekeyApiKey'),
    room: credential('#tekeyRoom'),
    password: credential('#tekeyPassword')
  };
}

function buildTekeySetColumnsUrl() {
  const params = new URLSearchParams();
  const { apiKey, room, password } = getTekeyCredentials();
  if (apiKey) params.set('apikey', apiKey);
  params.set('command', 'setColumns');
  if (room) params.set('room', room);
  if (password) params.set('password', password);
  params.set('columns', buildTekeyColumns());
  return `https://tekey.jp/api?${params.toString()}`;
}

function buildTekeyBundle() {
  return `【Tekey コマ作成】
ルーム設定
${buildTekeySetupMemo()}

addCharacter API URL
${buildTekeyApiUrl()}

setColumns API URL
${buildTekeySetColumnsUrl()}

ステータステーブル values
${buildTekeyValues()}

ステータステーブル columns
${buildTekeyColumns()}

ステータステーブルJSON
${JSON.stringify(TEKEY_STATUS_TABLE_CONFIG)}

カウンターリモコンJSON
${JSON.stringify(TEKEY_COUNTER_REMOTE_CONFIG)}

キャラクター詳細 info
${buildTekeyInfo()}

【Tekey チャットパレット】
${buildTekeyPalette()}`;
}

function ccfoliaStatus(label, value, max = 0) {
  const numericValue = int(value);
  const numericMax = max === null ? 0 : int(max);
  return { label, value: numericValue, max: numericMax };
}

function ccfoliaParam(label, value) {
  return { label, value: String(value ?? '') };
}

function buildCcfoliaStatuses() {
  const d = getDerived();
  return [
    ccfoliaStatus('HP', d.hp, d.hp),
    ccfoliaStatus('MP', d.mp, d.mp),
    ccfoliaStatus('光', int(state.combat.lightCurrent), d.lightMax),
    ccfoliaStatus('PE', int(state.emotion.pe), Math.max(0, int(state.emotion.pe))),
    ccfoliaStatus('NE', int(state.emotion.ne), Math.max(0, int(state.emotion.ne))),
    ccfoliaStatus('感情レベル', int(state.emotion.level, 1), Math.max(1, d.officeLevel.level)),
    ccfoliaStatus('狂気点', int(state.mind.insanityCurrent), d.insanityMax),
    ccfoliaStatus('ねじれ点', int(state.mind.twistPoint), 5),
    ccfoliaStatus('混乱', state.conditions.confused ? 1 : 0, 1),
    ccfoliaStatus('パワー', int(state.conditions.power)),
    ccfoliaStatus('クイック', int(state.conditions.quick)),
    ccfoliaStatus('忍耐', int(state.conditions.endurance)),
    ccfoliaStatus('保護', int(state.conditions.protection)),
    ccfoliaStatus('脆弱', int(state.conditions.fragile)),
    ccfoliaStatus('出血', int(state.conditions.bleed)),
    ccfoliaStatus('火傷', int(state.conditions.burn)),
    ccfoliaStatus('麻痺', int(state.conditions.paralysis))
  ];
}

function buildCcfoliaParams() {
  const d = getDerived();
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = getSelectedSpecialtyPassive();
  const germinationBonus = Math.floor(Math.max(0, int(state.lightSeed.germinationRate)) / 10);
  return [
    ccfoliaParam('NAME', oneLine(state.profile.characterName || 'LoMTRPGキャラクター')),
    ccfoliaParam('PL', oneLine(state.profile.playerName || '-')),
    ccfoliaParam('ORIGIN', ORIGINS[state.build.origin]?.label || '-'),
    ccfoliaParam('SPECIALTY', specialty.label),
    ccfoliaParam('FIXED_PASSIVE', specialty.fixed.name),
    ccfoliaParam('SELECTED_PASSIVE', selected.name),
    ccfoliaParam('GRADE', d.rank.grade),
    ccfoliaParam('LEVEL', d.level),
    ccfoliaParam('HP', d.hp),
    ccfoliaParam('HPMAX', d.hp),
    ccfoliaParam('MP', d.mp),
    ccfoliaParam('MPMAX', d.mp),
    ccfoliaParam('LIGHT', int(state.combat.lightCurrent)),
    ccfoliaParam('LIGHTMAX', d.lightMax),
    ccfoliaParam('PE', int(state.emotion.pe)),
    ccfoliaParam('NE', int(state.emotion.ne)),
    ccfoliaParam('EMOTION', int(state.emotion.level, 1)),
    ccfoliaParam('INSANITY', int(state.mind.insanityCurrent)),
    ccfoliaParam('INSANITYMAX', d.insanityMax),
    ccfoliaParam('DISTORTION', int(state.mind.twistPoint)),
    ccfoliaParam('GERMINATION', int(state.lightSeed.germinationRate)),
    ccfoliaParam('GERMINATIONB', germinationBonus),
    ccfoliaParam('POWER', int(state.conditions.power)),
    ccfoliaParam('QUICK', int(state.conditions.quick)),
    ccfoliaParam('ENDURANCE', int(state.conditions.endurance)),
    ccfoliaParam('PROTECTION', int(state.conditions.protection)),
    ccfoliaParam('FRAGILE', int(state.conditions.fragile)),
    ccfoliaParam('BLEED', int(state.conditions.bleed)),
    ccfoliaParam('BURN', int(state.conditions.burn)),
    ccfoliaParam('PARALYSIS', int(state.conditions.paralysis)),
    ccfoliaParam('HIT', d.hit),
    ccfoliaParam('DODGE', d.dodge),
    ccfoliaParam('DEFENSE', d.defense),
    ccfoliaParam('SPEED', d.speed),
    ccfoliaParam('FAME', int(state.growth.fame)),
    ...STAT_KEYS.flatMap((key) => [
      ccfoliaParam(key, d.stats[key]),
      ccfoliaParam(`${key}B`, d.bonuses[key])
    ])
  ];
}

function buildCcfoliaMemo() {
  const d = getDerived();
  const totals = getTotals();
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = getSelectedSpecialtyPassive();
  const cashLeft = int(state.growth.cashStart) - totals.moneyUsed;
  const skillLeft = int(state.growth.skillPointStart) - totals.skillUsed;
  const statLine = STAT_KEYS.map((key) => `${key}:${d.stats[key]}(B${d.bonuses[key]})`).join(' / ');
  const weapons = state.equipment.weapons
    .filter((row) => row.name || row.memo)
    .map((row) => `・${row.name || '無名武器'} [${row.rank}/${row.type}] 威力:${row.power || '-'} 命中:${row.hit || '-'} 重量:${row.weight || 0} ${oneLine(row.memo)}`)
    .join('\n') || '・なし';
  const armors = state.equipment.armors
    .filter((row) => row.name || row.memo)
    .map((row) => `・${row.name || '無名防具'} ${formatArmorResistanceLine(row)} 重量:${row.weight || 0} ${oneLine(row.memo)}`)
    .join('\n') || '・なし';
  const items = state.equipment.items
    .filter((row) => row.name || row.memo)
    .map((row) => `・${row.name || '無名アイテム'} x${row.qty || 1} 重量:${row.weight || 0} 価格:${formatMoney(row.cost || 0)} ${oneLine(row.memo)}`)
    .join('\n') || '・なし';
  const combatSkills = state.skills.combat
    .filter(hasCombatSkillContent)
    .map(formatCombatSkillLine)
    .join('\n') || '・なし';
  const tactics = formatTacticList([state.office.tactic1, state.office.tactic2], (value) => `・${formatTacticSelection(value)}`, '\n');
  const extraPassives = state.skills.passives
    .filter((row) => row.name || row.memo)
    .map((row) => formatPassiveSkillLine(row, { singleLine: true }))
    .join('\n') || '・なし';
  const choiceLines = specialty.choices
    .map((choice) => `・${choice.name}${choice.name === selected.name ? '（選択中）' : ''}: ${oneLine(choice.text)}`)
    .join('\n');

  return [
    '【LoMTRPG ココフォリア用メモ】',
    `階級:${d.rank.grade} Lv:${d.level}`,
    `能力値:${statLine}`,
    `副能力値:HP${d.hp} MP${d.mp} 光${int(state.combat.lightCurrent)}/${d.lightMax} 速度${d.speed}（${formatSpeedChoiceSummary(d.bonuses.DEX)}） 命中${d.hit} 回避${d.dodge} 防御${d.defense}`,
    '',
    '■パッシブ詳細',
    `能力値補正:${formatSpecialtyMods(specialty)}`,
    `固有パッシブ:${specialty.fixed.name} - ${oneLine(specialty.fixed.text)}`,
    `選択パッシブ:${selected.name} - ${oneLine(selected.text)}`,
    '選択候補:',
    choiceLines,
    'その他パッシブ:',
    extraPassives,
    '',
    '■装備',
    '武器:',
    weapons,
    '防具:',
    armors,
    'アイテム:',
    items,
    '',
    '■戦闘技能',
    combatSkills,
    '',
    '■事務所',
    `事務所:${state.office.name || '-'} / 代表:${state.office.leader || '-'}`,
    '戦術スキル:',
    tactics,
    '',
    '■リソース',
    `所持金:${formatMoney(state.growth.cashStart)} / 使用:${formatMoney(totals.moneyUsed)} / 残:${formatMoney(cashLeft)}`,
    `装備費:${formatMoney(totals.equipmentCost)}`,
    `技能点:${int(state.growth.skillPointStart)} / 使用:${totals.skillUsed} / 残:${skillLeft}`,
    `重量:${totals.totalWeight.toLocaleString('ja-JP')}/${d.maxWeight}（${getWeightPenalty(totals.totalWeight, d.maxWeight).label}）`
  ].join('\n');
}
function buildCcfoliaCommands() {
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = getSelectedSpecialtyPassive();
  const weaponCommandLines = buildCcfoliaWeaponCommandLines();
  const passiveLines = [
    `固有パッシブ ${specialty.fixed.name}: ${oneLine(specialty.fixed.text)}`,
    `選択パッシブ ${selected.name}: ${oneLine(selected.text)}`
  ];
  if (specialty.fixed.name === '弱点把握') passiveLines.push('1d6 弱点把握（1:斬撃耐性/2:斬撃混乱耐性/3:貫通耐性/4:貫通混乱耐性/5:打撃耐性/6:打撃混乱耐性）');

  return [
    '2d6+{STRB}+{LEVEL} 筋力判定',
    '2d6+{STRB}+{LEVEL} 水泳判定',
    '2d6+{STRB}+{LEVEL} 跳躍判定',
    '2d6+{DEXB}+{LEVEL} 隠密判定',
    '2d6+{DEXB}+{LEVEL} 登攀判定',
    '2d6+{DEXB}+{LEVEL} 逃走判定',
    '2d6+{DEXB}+{LEVEL} 逃走妨害判定',
    '2d6+{AGEB}+{LEVEL} 応急手当判定',
    '2d6+{AGEB}+{LEVEL} 隠蔽判定',
    '2d6+{AGEB}+{LEVEL} 開錠判定',
    '2d6+{CONB}+{LEVEL} 生死判定',
    '2d6+{CONB}+{LEVEL} 生命抵抗力判定',
    '2d6+{POWB} 精神力判定',
    '2d6+{INTB}+{LEVEL} 追跡判定',
    '2d6+{INTB}+{LEVEL} 異常感知判定',
    '2d6+{INTB}+{LEVEL} 危険感知判定',
    '2d6+{INTB}+{LEVEL} 聞き耳判定',
    '2d6+{INTB}+{LEVEL} 探知判定',
    '2d6+{INTB}+{LEVEL} 観測判定',
    '2d6+{INTB}+{LEVEL} 見識判定',
    '2d6+{INTB}+{LEVEL} 調査判定',
    '2d6+{APPB}+{LEVEL} 交渉判定',
    '2d6+{APPB} 対話判定',
    '2d6+{GERMINATIONB} ねじれ判定',
    ...weaponCommandLines,
    '2d6+{DEFENSE}+{ENDURANCE} 防御判定',
    '2d6+{DODGE}+{ENDURANCE} 回避判定',
    ...passiveLines,
    '（セリフ）'
  ].join('\n');
}

function buildCcfoliaCharacter() {
  const name = state.profile.characterName || 'LoMTRPGキャラクター';
  const size = Math.max(1, int(state.tekey.size, 1));
  return {
    kind: 'character',
    data: {
      name,
      memo: buildCcfoliaMemo(),
      initiative: getTekeyInitiative(),
      externalUrl: state.tekey.referenceUrl || '',
      status: buildCcfoliaStatuses(),
      params: buildCcfoliaParams(),
      iconUrl: null,
      faces: [],
      angle: 0,
      width: size,
      height: size,
      secret: false,
      invisible: false,
      hideStatus: false,
      color: normalizeColor(state.tekey.color),
      commands: buildCcfoliaCommands(),
      owner: null
    }
  };
}

function buildCcfoliaJson() {
  return JSON.stringify(buildCcfoliaCharacter(), null, 2);
}

function buildTekeyPalette() {
  const d = getDerived();
  const specialty = SPECIALTIES[state.build.specialty] || SPECIALTIES.combat;
  const selected = getSelectedSpecialtyPassive();
  const name = state.profile.characterName || 'LoMTRPGキャラクター';
  const label = state.tekey.paletteLabel || name;
  const color = normalizeColor(state.tekey.color);
  const portrait = oneLine(state.tekey.portrait);
  const germinationBonus = Math.floor(Math.max(0, int(state.lightSeed.germinationRate)) / 10);
  const statParams = STAT_KEYS.flatMap((key) => [`// ${key}=${d.stats[key]}`, `// ${key}B=${d.bonuses[key]}`]);
  const weapons = state.equipment.weapons
    .filter((row) => row.name || row.memo)
    .map((row) => `${row.name || '無名武器'} | ${row.rank}/${row.type} | 威力:${row.power || '-'} | 命中:${row.hit || '-'} | ${oneLine(row.memo)}`)
    .join('\n') || '武器未設定';
  const armors = state.equipment.armors
    .filter((row) => row.name || row.memo)
    .map((row) => `${row.name || '無名防具'} | ${formatArmorResistanceLine(row)} | ${oneLine(row.memo)}`)
    .join('\n') || '防具未設定';
  const equipmentUpgrades = (state.equipment.upgrades || [])
    .filter(hasEquipmentUpgradeContent)
    .map((row) => oneLine(formatEquipmentUpgradeLine(row).replace(/^・/, '')))
    .join('\n') || '装備強化未設定';
  const combatSkills = state.skills.combat
    .filter(hasCombatSkillContent)
    .map((row) => oneLine(formatCombatSkillLine(row).replace(/^・/, '')))
    .join('\n') || '戦闘技能未設定';
  const passiveSkills = [
    `固有:${specialty.fixed.name} | ${oneLine(specialty.fixed.text)}`,
    `選択:${selected.name} | ${oneLine(selected.text)}`,
    ...state.skills.passives
    .filter((row) => row.name || row.memo)
    .map((row) => formatPassiveSkillLine(row, { bullet: false, singleLine: true }).replace(/ 技能点:/, ' | 技:'))
  ].join('\n');
  const portraitLine = portrait ? `（セリフ）@${portrait}` : '（セリフ）';

  return [
    `### ${label} パラメータ`,
    `// NAME=${oneLine(name)}`,
    `// HP=${d.hp}`,
    `// HPMAX=${d.hp}`,
    `// MP=${d.mp}`,
    `// MPMAX=${d.mp}`,
    `// LIGHT=${int(state.combat.lightCurrent)}`,
    `// LIGHTMAX=${d.lightMax}`,
    `// INSANITY=${int(state.mind.insanityCurrent)}`,
    `// INSANITYMAX=${d.insanityMax}`,
    `// DISTORTION=${int(state.mind.twistPoint)}`,
    `// PE=${int(state.emotion.pe)}`,
    `// NE=${int(state.emotion.ne)}`,
    `// EMOTION=${int(state.emotion.level, 1)}`,
    `// GERMINATION=${int(state.lightSeed.germinationRate)}`,
    `// GERMINATIONB=${germinationBonus}`,
    `// POWER=${int(state.conditions.power)}`,
    `// QUICK=${int(state.conditions.quick)}`,
    `// ENDURANCE=${int(state.conditions.endurance)}`,
    `// PROTECTION=${int(state.conditions.protection)}`,
    `// FRAGILE=${int(state.conditions.fragile)}`,
    `// BLEED=${int(state.conditions.bleed)}`,
    `// BURN=${int(state.conditions.burn)}`,
    `// PARALYSIS=${int(state.conditions.paralysis)}`,
    `// HIT=${d.hit}`,
    `// DODGE=${d.dodge}`,
    `// DEFENSE=${d.defense}`,
    `// SPEED=${d.speed}`,
    `// LEVEL=${d.level}`,
    `// FAME=${int(state.growth.fame)}`,
    ...statParams,
    '###',
    `### ${label} ステータス`,
    'HP {HP}/{HPMAX}',
    'MP {MP}/{MPMAX}',
    '光 {LIGHT}/{LIGHTMAX}',
    '狂気点 {INSANITY}/{INSANITYMAX}',
    'ねじれ点 {DISTORTION}',
    '感情レベル {EMOTION} / PE {PE} / NE {NE}',
    '速度 {SPEED}',
    '###',
    `### ${label} 各種判定`,
    '2d6+{STRB}+{LEVEL} 筋力判定',
    '2d6+{STRB}+{LEVEL} 水泳判定',
    '2d6+{STRB}+{LEVEL} 跳躍判定',
    '2d6+{DEXB}+{LEVEL} 隠密判定',
    '2d6+{DEXB}+{LEVEL} 回避判定',
    '2d6+{DEXB}+{LEVEL} 登攀判定',
    '2d6+{DEXB}+{LEVEL} 逃走判定',
    '2d6+{DEXB}+{LEVEL} 逃走妨害判定',
    '2d6+{AGEB}+{LEVEL} 応急手当判定',
    '2d6+{AGEB}+{LEVEL} 隠蔽判定',
    '2d6+{AGEB}+{LEVEL} 開錠判定',
    '2d6+{AGEB}+{LEVEL} 命中判定',
    '2d6+{CONB}+{LEVEL} 生死判定',
    '2d6+{CONB}+{LEVEL} 防御判定',
    '2d6+{CONB}+{LEVEL} 生命抵抗力判定',
    '2d6+{POWB} 精神力判定',
    '2d6+{INTB}+{LEVEL} 追跡判定',
    '2d6+{INTB}+{LEVEL} 異常感知判定',
    '2d6+{INTB}+{LEVEL} 危険感知判定',
    '2d6+{INTB}+{LEVEL} 聞き耳判定',
    '2d6+{INTB}+{LEVEL} 探知判定',
    '2d6+{INTB}+{LEVEL} 観測判定',
    '2d6+{INTB}+{LEVEL} 見識判定',
    '2d6+{INTB}+{LEVEL} 調査判定',
    '2d6+{APPB}+{LEVEL} 交渉判定',
    '2d6+{APPB} 対話判定',
    '2d6+{GERMINATIONB} ねじれ判定',
    '###',
    `### ${label} 能力値`,
    ...STAT_KEYS.map((key) => `${STAT_LABELS[key]} ${key}:{${key}} / B:{${key}B}`),
    '###',
    `### ${label} 戦闘参照`,
    '2d6+{HIT} 命中判定',
    '2d6+{DEFENSE} 防御判定',
    '2d6+{DODGE} 回避判定',
    '速度 {SPEED}',
    '状態 パワー{POWER}/クイック{QUICK}/忍耐{ENDURANCE}/保護{PROTECTION}/脆弱{FRAGILE}/出血{BLEED}/火傷{BURN}/麻痺{PARALYSIS}',
    '###',
    `### ${label} 装備`,
    weapons,
    armors,
    equipmentUpgrades,
    '###',
    `### ${label} 技能`,
    combatSkills,
    passiveSkills,
    '###',
    `### ${label} RP補助`,
    '（セリフ）',
    `（セリフ）@${color}`,
    portraitLine,
    '###'
  ].join('\n');
}

function updateJsonBox() {
  $('#jsonBox').value = JSON.stringify(state, null, 2);
}

function rollExpression(expr) {
  const match = String(expr).match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;
  const count = int(match[1]);
  const faces = int(match[2]);
  const mod = int(match[3] || 0);
  let total = mod;
  const rolls = [];
  for (let i = 0; i < count; i += 1) {
    const roll = Math.floor(Math.random() * faces) + 1;
    rolls.push(roll);
    total += roll;
  }
  return { total, rolls, mod };
}

function rollStats() {
  const origin = ORIGINS[state.build.origin] || ORIGINS.nest;
  const details = [];
  STAT_KEYS.forEach((key) => {
    const result = rollExpression(origin.dice[key]);
    if (result) {
      state.stats[key].base = result.total;
      const row = $(`tr[data-stat="${key}"]`);
      row.querySelector('[data-stat-field="base"]').value = result.total;
      details.push(`${key}:${result.total}`);
    }
  });
  updateAll(true);
  toast(`出身ダイス：${details.join(' / ') || '手入力が必要です'}`);
}

function randomSeed() {
  const number = Math.floor(Math.random() * 10) + 1;
  state.lightSeed.number = number;
  state.lightSeed.text = LIGHT_SEEDS[number - 1];
  $('#lightSeedNumber').value = number;
  $('#lightSeedText').value = state.lightSeed.text;
  updateAll(true);
  toast(`光の種：${number}. ${state.lightSeed.text}`);
}

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollFixerHistory() {
  const tableRoll = rollD6();
  const table = tableRoll <= 2 ? 'A' : tableRoll <= 4 ? 'B' : 'C';
  const row = rollD6();
  const col = rollD6();
  const key = `${row}-${col}`;
  const text = FIXER_HISTORY_TABLES[table][key] || '欠番（VCと相談）';
  const result = `${table}表 ${key}: ${text}`;
  state.profile.fixerHistory = result;
  $('#fixerHistory').value = result;
  updateAll(true);
  toast(`経歴表：${result}`);
}

function handleWarehouseDebugShortcut(event) {
  const activeTab = $('.tab.active')?.dataset.tab;
  if (activeTab !== 'warehouse') return;
  if (event.key === 'Shift') return;
  if (!event.shiftKey) {
    warehouseDebugBuffer = '';
    return;
  }
  if (event.key === 'Delete') {
    warehouseDebugBuffer = 'DELETE';
  } else if (/^[a-z]$/i.test(event.key)) {
    warehouseDebugBuffer = `${warehouseDebugBuffer}${event.key.toUpperCase()}`.slice(-6);
  } else {
    return;
  }
  if (warehouseDebugBuffer === 'DELETE') {
    warehouseRefundDebugUnlocked = true;
    warehouseDebugBuffer = '';
    renderDynamicTables();
    updateAll(false);
    toast('倉庫デバッグ: 返金削除を表示しました');
  }
}

function scheduleSave() {
  $('#saveStatus').textContent = '編集中...';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 350);
}

function saveState() {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
  $('#saveStatus').textContent = '保存済み';
}

function loadState() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) state = mergeDefaults(JSON.parse(raw));
  } catch (error) {
    console.warn(error);
    state = structuredCloneSafe(DEFAULT_STATE);
  }
}

function download(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    toast(message);
  }
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function resetSheet() {
  if (!confirm('入力内容を初期化します。よろしいですか？')) return;
  state = structuredCloneSafe(DEFAULT_STATE);
  localStorage.removeItem(DRAFT_STORAGE_KEY);
  populateStateToDom();
  saveState();
  toast('初期化しました');
}

function applyJsonText(text) {
  const parsed = JSON.parse(text);
  state = mergeDefaults(parsed);
  populateStateToDom();
  saveState();
  toast('JSONを反映しました');
}

function hookEvents() {
  document.addEventListener('input', (event) => {
    if (event.target.closest('.bind')) updateAll(true);
  });
  document.addEventListener('change', (event) => {
    if (event.target.closest('.bind')) updateAll(true);
  });
  document.addEventListener('change', (event) => {
    const speedChoice = event.target.closest('[data-speed-choice-index]');
    if (!speedChoice) return;
    const index = int(speedChoice.dataset.speedChoiceIndex);
    if (!Array.isArray(state.combat.speedChoices)) state.combat.speedChoices = [];
    state.combat.speedChoices[index] = speedChoice.value === 'min' ? 'min' : 'max';
    updateAll(true);
  });
  document.addEventListener('input', (event) => {
    if (event.target.closest('.tekey-live')) updateOutput();
  });
  document.addEventListener('change', (event) => {
    if (event.target.closest('.tekey-live')) updateOutput();
  });
  $('#specialty').addEventListener('change', () => {
    collectBoundInputs();
    updateSpecialtyPassiveOptions();
    populateStateToDom();
  });
  $('#lightSeedNumber').addEventListener('change', () => {
    const number = int($('#lightSeedNumber').value, 1);
    state.lightSeed.number = number;
    state.lightSeed.text = LIGHT_SEEDS[number - 1];
    $('#lightSeedText').value = state.lightSeed.text;
    updateAll(true);
  });
  $$('.tab').forEach((button) => button.addEventListener('click', () => {
    activateTab(button.dataset.tab);
  }));
  $('#rollStats').addEventListener('click', rollStats);
  $('#randomSeed').addEventListener('click', randomSeed);
  $('#rollFixerHistory').addEventListener('click', rollFixerHistory);
  $('#resetSheet').addEventListener('click', resetSheet);
  $('#saveNow').addEventListener('click', () => { updateAll(false); saveState(); toast('保存しました'); });
  $('#openLibrary').addEventListener('click', () => activateTab('library'));
  $('#saveCharacterToLibrary').addEventListener('click', saveCurrentCharacterToLibrary);
  $('#loginAccount').addEventListener('click', loginAccount);
  $('#logoutAccount').addEventListener('click', logoutAccount);
  $('#saveCharacterToLibraryPanel').addEventListener('click', saveCurrentCharacterToLibrary);
  $('#newCharacterFromLibrary').addEventListener('click', newCharacterFromLibrary);
  $('#copyShareCode').addEventListener('click', () => copyText(buildShareImportCodeForState(state), '共有コードをコピーしました'));
  $('#importShareCode').addEventListener('click', importShareCode);
  $('#savedCharacterList').addEventListener('click', handleSavedCharacterAction);
  $('#addRewardItem').addEventListener('click', () => addDynamicRow('rewardItems'));
  $('#applyRewards').addEventListener('click', applyRewards);
  $('#equipmentCatalog').addEventListener('click', (event) => {
    const button = event.target.closest('[data-purchase-id]');
    if (button) purchaseCatalogEntry(button.dataset.purchaseId);
  });
  $('#combatEffectCatalog').addEventListener('click', (event) => {
    const button = event.target.closest('[data-learn-combat-skill]');
    if (button) learnCombatSkillOption(button.dataset.learnCombatSkill);
  });
  $('#officialPassiveCatalog').addEventListener('click', (event) => {
    const button = event.target.closest('[data-learn-official-passive]');
    if (button) learnOfficialPassiveOption(button.dataset.learnOfficialPassive);
  });
  window.addEventListener('hashchange', () => {
    if (getShareHashValue()) loadSharedCharacterFromHash({ render: true, notify: true });
  });
  document.addEventListener('keydown', handleWarehouseDebugShortcut);
  $('#jumpTekey').addEventListener('click', () => activateTab('output'));
  $('#exportJson').addEventListener('click', () => downloadJson());
  $('#downloadJson').addEventListener('click', () => downloadJson());
  $('#copyJson').addEventListener('click', () => copyText(JSON.stringify(state, null, 2), 'JSONをコピーしました'));
  $('#applyJson').addEventListener('click', () => {
    try { applyJsonText($('#jsonBox').value); } catch (error) { toast('JSONの読み込みに失敗しました'); console.error(error); }
  });
  $('#importJson').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { applyJsonText(await file.text()); } catch (error) { toast('JSONの読み込みに失敗しました'); console.error(error); }
    event.target.value = '';
  });
  $('#printSheet').addEventListener('click', () => window.print());
  $('#copySheet').addEventListener('click', () => copyText(buildSheetText(), 'シートテキストをコピーしました'));
  $('#downloadText').addEventListener('click', () => download(`${safeFileName(state.profile.characterName, 'lomtrpg_character')}.txt`, buildSheetText()));
  $('#copyTekeySetup').addEventListener('click', () => copyText(buildTekeySetupMemo(), 'Tekey設定メモをコピーしました'));
  $('#downloadTekeyStatusTable').addEventListener('click', () => download('LoMTRPG用ステータステーブル(Tekey).json', JSON.stringify(TEKEY_STATUS_TABLE_CONFIG), 'application/json'));
  $('#downloadTekeyCounterRemote').addEventListener('click', () => download('LoMTRPG用カウンターリモコン(Tekey).json', JSON.stringify(TEKEY_COUNTER_REMOTE_CONFIG), 'application/json'));
  $('#copyTekeyApiUrl').addEventListener('click', () => copyText(buildTekeyApiUrl(), 'Tekey API URLをコピーしました'));
  $('#copyTekeySetColumnsUrl').addEventListener('click', () => copyText(buildTekeySetColumnsUrl(), 'Tekey setColumns URLをコピーしました'));
  $('#copyTekeyValues').addEventListener('click', () => copyText(buildTekeyValues(), 'Tekey valuesをコピーしました'));
  $('#copyTekeyColumns').addEventListener('click', () => copyText(buildTekeyColumns(), 'Tekey columnsをコピーしました'));
  $('#downloadTekeyBundle').addEventListener('click', () => download(`${safeFileName(state.profile.characterName, 'lomtrpg_character')}_tekey.txt`, buildTekeyBundle()));
  $('#copyTekeyPalette').addEventListener('click', () => copyText(buildTekeyPalette(), 'Tekeyチャットパレットをコピーしました'));
  $('#downloadTekeyPalette').addEventListener('click', () => download(`${safeFileName(state.profile.characterName, 'lomtrpg_character')}_tekey_palette.txt`, buildTekeyPalette()));
  $('#copyCcfoliaJson').addEventListener('click', () => copyText(buildCcfoliaJson(), 'ココフォリアコマJSONをコピーしました'));
  $('#downloadCcfoliaJson').addEventListener('click', () => download(`${safeFileName(state.profile.characterName, 'lomtrpg_character')}_ccfolia.json`, buildCcfoliaJson(), 'application/json'));
  $('#addWeapon').addEventListener('click', () => addDynamicRow('weapons'));
  $('#addArmor').addEventListener('click', () => addDynamicRow('armors'));
  $('#addItem').addEventListener('click', () => addDynamicRow('items'));
  $('#addProsthetic').addEventListener('click', () => addDynamicRow('prosthetics'));
  $('#addEquipmentUpgrade').addEventListener('click', () => addDynamicRow('equipmentUpgrades'));
  $('#addSkill').addEventListener('click', () => addDynamicRow('skills'));
  $('#addPassive').addEventListener('click', () => addDynamicRow('passives'));
  hookDynamicTables();
}

function activateTab(tabName) {
  $$('.tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tabName));
  $$('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${tabName}`));
}

function downloadJson() {
  const name = safeFileName(state.profile.characterName, 'lomtrpg_character');
  download(`${name}.json`, JSON.stringify(state, null, 2), 'application/json');
  toast('JSONを書き出しました');
}

function init() {
  populateSelects();
  renderStatRows();
  renderEnhancementRows();
  renderCombatEffectCatalog();
  renderOfficialPassiveCatalog();
  renderEquipmentCatalog();
  renderEquipmentUpgradeCatalog();
  loadState();
  const sharedLoaded = loadSharedCharacterFromHash({ render: false, notify: false });
  populateStateToDom();
  hookEvents();
  saveState();
  if (sharedLoaded) toast('共有キャラクターを読み込みました');
}

init();
