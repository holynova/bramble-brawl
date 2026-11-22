export const heroes = [
  {
    name: '刺头',
    en: 'NEEDLE JACK',
    role: '双枪游侠',
    color: '#61df88',
    hp: 130,
    speed: 178,
    power: 24,
    rate: 0.48,
    desc: '双枪交替射出贯穿尖刺，边走边打最拿手。',
    passive: '贯穿射击',
  },
  {
    name: '霹雳',
    en: 'VIOLET VOLT',
    role: '风暴术士',
    color: '#c393ff',
    hp: 108,
    speed: 185,
    power: 33,
    rate: 0.78,
    desc: '雷球击中目标时弹向邻近敌人，专克扎堆的怪潮。',
    passive: '连锁雷球',
  },
  {
    name: '铁墩',
    en: 'IRON ANVIL',
    role: '重锤守卫',
    color: '#ffad62',
    hp: 200,
    speed: 157,
    power: 48,
    rate: 0.86,
    desc: '矿锤震开身边的敌人，在怪潮最密处开出一条路。',
    passive: '震地重击',
  },
  {
    name: '回砂',
    en: 'DUNE JACKAL',
    role: '飞刃信使',
    color: '#68e7d1',
    hp: 119,
    speed: 192,
    power: 31,
    rate: 0.86,
    desc: '月刃飞出后追着自己折返。横移能把回程刃线拉过另一排敌人。',
    passive: '逐风回镖',
  },
  {
    name: '烬铃',
    en: 'CINDER BREW',
    role: '熔火药师',
    color: '#ff9956',
    hp: 148,
    speed: 163,
    power: 39,
    rate: 1.04,
    desc: '向敌群抛出火药瓶。把追兵带回燃烧区，能持续灼伤整队敌人。',
    passive: '熔浆投瓶',
  },
  {
    name: '缝影',
    en: 'VESPER MOTH',
    role: '绯镰猎手',
    color: '#f399d8',
    hp: 116,
    speed: 183,
    power: 35,
    rate: 0.72,
    desc: '影镰优先追斩附近伤势最重的目标，对残血敌人造成重击。',
    passive: '绯镰追魂',
  },
]
export const spells = [
  {
    name: '炮芽哨兵',
    short: '炮芽',
    cooldown: 12,
    color: '#79d842',
    type: '召唤',
    desc: '在英雄脚下种下炮芽，持续 18 秒自动射击。最多同时存在三株。',
  },
  {
    name: '连锁闪电',
    short: '落雷',
    cooldown: 9,
    color: '#b077ff',
    type: '法术',
    desc: '锁定最近的敌人，连锁击中周围至多五个目标。',
  },
  {
    name: '陨星火球',
    short: '火球',
    cooldown: 14,
    color: '#fc8b3f',
    type: '法术',
    desc: '锁定附近敌人，陨星砸向其位置，短暂延迟后对大范围内的敌人造成重创。',
  },
  {
    name: '冰晶新星',
    short: '冰晶',
    cooldown: 13,
    color: '#69dfff',
    type: '控制',
    desc: '敌人进入身边时引爆冰晶，造成范围伤害并让命中的怪物减速 65%，持续 4 秒。',
  },
  {
    name: '荆棘旋风',
    short: '旋风',
    cooldown: 16,
    color: '#9ae952',
    type: '持续',
    desc: '在附近敌人脚下生成一股持续 6 秒的种子风暴，反复切割区域内的敌人。',
  },
  {
    name: '金棘护盾',
    short: '金盾',
    cooldown: 21,
    color: '#ffcb45',
    type: '守护',
    desc: '敌人逼近时回复 12 点生命，在接下来 3 秒抵挡伤害，并弹退贴身敌人。',
  },
  {
    name: '月牙刃轮',
    short: '刃轮',
    cooldown: 11,
    color: '#67dfcd',
    type: '环绕',
    desc: '双刃沿身边转动四秒。贴着怪群边缘走位，让刃尖反复扫中敌人。',
  },
  {
    name: '余烬足迹',
    short: '火径',
    cooldown: 12,
    color: '#ff9951',
    type: '地形',
    desc: '移动时在身后留下一串燃烧足迹，持续铺路四秒。引诱追兵踩过火径。',
  },
  {
    name: '蚀魂印记',
    short: '魂印',
    cooldown: 9,
    color: '#e78bd9',
    type: '诅咒',
    desc: '标记附近三名敌人，在六秒内反复侵蚀生命。',
  },
  {
    name: '巡游蜂',
    short: '巡蜂',
    cooldown: 13,
    color: '#ffe171',
    type: '召唤',
    desc: '放出一只跟随英雄的机械蜂，八秒内自动向附近敌人发射蜂针。',
  },
  {
    name: '冻土矿雷',
    short: '冰雷',
    cooldown: 10,
    color: '#80dfff',
    type: '陷阱',
    desc: '在脚下布雷，短暂布防后受敌人接近触发，冻结爆心周围的敌人。',
  },
  {
    name: '鸣弧线圈',
    short: '电栅',
    cooldown: 12,
    color: '#aa9bff',
    type: '电场',
    desc: '在面前横设一段电栅，持续五秒。横穿电线的敌人会反复受到电击。',
  },
  {"name": "镜砂分身", "short": "镜狐", "cooldown": 14, "color": "#72ead2", "type": "幻象", "desc": "召出留在原地的沙狐镜像，连续向靠近它的敌人发射飞针。"},
  {"name": "日轮焰盘", "short": "焰盘", "cooldown": 11, "color": "#ffab50", "type": "贴身", "desc": "展开一面随身移动的日轮，反复灼烧靠近英雄的敌人。"},
  {"name": "渡魂灯", "short": "魂灯", "cooldown": 13, "color": "#ea94e0", "type": "汲取", "desc": "悬灯照射附近的敌人，并把灯边的经验晶石牵回英雄身边。"},
  {"name": "牵引锚", "short": "重锚", "cooldown": 14, "color": "#efbd66", "type": "牵引", "desc": "向敌人投锚，将周围怪物拉向锚心，打断普通怪的冲刺。"},
  {"name": "霜羽飞梭", "short": "霜羽", "cooldown": 9, "color": "#a1eeff", "type": "穿刺", "desc": "向面前三路发射贯穿飞梭，命中的敌人减速。"},
  {"name": "蓄电战鼓", "short": "战鼓", "cooldown": 15, "color": "#c19aff", "type": "回充", "desc": "鼓声击退贴身追兵，为剩余冷却最长的另一项被动回充。"},
]
export const gears = [
  { name: '矿工拳套', desc: '每级提升 8% 基础攻击', color: '#ff9258' },
  { name: '翠石快靴', desc: '每级提升 5% 移速和拾取范围', color: '#6bdae1' },
  { name: '金棘徽章', desc: '每级提升 10% 最大生命', color: '#ffd16f' },
]
export const contracts = [
  { name: '落日矿谷', en: 'SUNSET QUARRY', rank: '初探', seconds: 240, factor: 1, bounty: 120 },
  { name: '紫晶暴动', en: 'CRYSTAL RIOT', rank: '精英', seconds: 360, factor: 1.22, bounty: 210 },
  { name: '终极通缉', en: 'LAST STAND', rank: '传奇', seconds: 480, factor: 1.43, bounty: 330 },
]
export const waveNames = ['前哨', '蝠群', '重甲', '夹击', '围攻', '决战']
export const nova = {
  name: '震荡爆发',
  cooldown: 18,
  radius: 146,
  desc: '击退身边的敌人，打断普通怪的攻击，并获得短暂保护。',
}
export const weaponTraining = 30
export const passiveTraining = 31
export const maxRank = 5
export const isEvolution = (id: number) => id >= 6 && id < weaponTraining
export const Evo = {
  fork: 6,
  beacon: 7,
  fault: 8,
  twins: 9,
  echo: 10,
  cluster: 11,
  shatter: 12,
  vortex: 13,
  thorns: 14,
  moon: 15, crucible: 16, reaper: 17,
  orbit: 18, rekindle: 19, plague: 20, flight: 21, ridge: 22, overload: 23,
} as const
export const heroEvolution = [Evo.fork, Evo.beacon, Evo.fault, Evo.moon, Evo.crucible, Evo.reaper]
export const spellEvolution = [Evo.twins, Evo.echo, Evo.cluster, Evo.shatter, Evo.vortex, Evo.thorns, Evo.orbit, Evo.rekindle, Evo.plague, Evo.flight, Evo.ridge, Evo.overload, 24, 25, 26, 27, 28, 29]
export const upgrades = [
  { name: '重装弹芯', desc: '基础伤害 +22%', art: 'gear-0', color: '#ff9f55', source: '攻击强化' },
  { name: '疾速扳机', desc: '普攻间隔缩短 12%', art: 'spell-1', color: '#ae92ff', source: '攻速强化' },
  {
    name: '荒野体魄',
    desc: '生命上限 +25，回复 45',
    art: 'gear-2',
    color: '#ffc044',
    source: '生存强化',
  },
  {
    name: '迅捷步伐',
    desc: '移速 +9%，扩大拾取范围',
    art: 'gear-1',
    color: '#5ee1de',
    source: '机动强化',
  },
  {
    name: '精密发条',
    desc: '所有被动冷却缩短 6%',
    art: 'spell-3',
    color: '#60dbff',
    source: '被动强化',
  },
  { name: '狂野法典', desc: '被动伤害 +12%', art: 'spell-2', color: '#ff904d', source: '法术强化' },
  {
    name: '爆荚双刺',
    desc: '尖刺首次命中时裂成两枚侧射弹，可击中两翼的敌人。',
    art: 'evo-0',
    color: '#d8ef74',
    source: '刺头 · 双枪觉醒',
  },
  {
    name: '留雷信标',
    desc: '每三次雷球命中留下一座雷塔，持续四秒攻击靠近的敌人。',
    art: 'evo-1',
    color: '#c797ff',
    source: '霹雳 · 雷杖觉醒',
  },
  {
    name: '地脉断层',
    desc: '每次砸地再向前推出一道裂隙，贯穿锤击范围外的敌人。',
    art: 'evo-2',
    color: '#ffbb73',
    source: '铁墩 · 矿锤觉醒',
  },
  {
    name: '双生炮阵',
    desc: '每次播种都长出两座炮芽，从两侧交叉射击。最多六株。',
    art: 'evo-3',
    color: '#a9ef76',
    source: '炮芽哨兵 · 进化',
  },
  {
    name: '雷印回响',
    desc: '雷击后在地面留下符印，稍后再次连锁劈向进入范围的敌人。',
    art: 'evo-4',
    color: '#c694ff',
    source: '连锁闪电 · 进化',
  },
  {
    name: '群星坠落',
    desc: '主火球炸开后三颗碎星散落在周围，分别引爆。',
    art: 'evo-5',
    color: '#ff9964',
    source: '陨星火球 · 进化',
  },
  {
    name: '碎冰连爆',
    desc: '冰环冻结敌人。冻住的敌人阵亡时爆裂，波及近邻。',
    art: 'evo-6',
    color: '#87e8ff',
    source: '冰晶新星 · 进化',
  },
  {
    name: '荆棘引力井',
    desc: '旋风把范围内的敌人持续拉向中心，首领受到较弱牵引。',
    art: 'evo-7',
    color: '#b4eb63',
    source: '荆棘旋风 · 进化',
  },
  {
    name: '金棘反击',
    desc: '护盾挡下攻击时，向八个方向射出金刺反击。',
    art: 'evo-8',
    color: '#ffdc73',
    source: '金棘护盾 · 进化',
  },
  {
    name: '双月回锋',
    desc: '向两侧同时掷出月刃，两道返程都追向英雄，交叉切开怪群。',
    art: 'evo-9',
    color: '#67dfcd',
    source: '回砂 · 回镖觉醒',
  },
  {
    name: '熔心坩埚',
    desc: '每片药瓶火池耗尽时喷发，震伤范围外沿的敌人。',
    art: 'evo-10',
    color: '#ff9951',
    source: '烬铃 · 药瓶觉醒',
  },
  {
    name: '绯影换命',
    desc: '影镰击杀目标后，绯影跃向附近另一名伤敌继续追斩。',
    art: 'evo-11',
    color: '#e78bd9',
    source: '缝影 · 影镰觉醒',
  },
  {
    name: '双轨刃阵',
    desc: '额外展开一圈反向旋转的远轨月刃，同时切割内外两圈。',
    art: 'evo-12',
    color: '#67dfcd',
    source: '月牙刃轮 · 进化',
  },
  {
    name: '烬路复燃',
    desc: '每道足迹熄灭时再爆一次，击中火径两侧的追兵。',
    art: 'evo-13',
    color: '#ff9951',
    source: '余烬足迹 · 进化',
  },
  {
    name: '疫印接力',
    desc: '带印敌人死亡时，印记会传给邻近的另一名敌人。',
    art: 'evo-14',
    color: '#e78bd9',
    source: '蚀魂印记 · 进化',
  },
  {
    name: '蜂群护航',
    desc: '派出第二只机械蜂，两只蜂从不同方位跟随、交错发射蜂针。',
    art: 'evo-15',
    color: '#ffe171',
    source: '巡游蜂 · 进化',
  },
  {
    name: '冰脊连营',
    desc: '主雷爆开后，两侧各生出一枚可独立触发的次生冰雷。',
    art: 'evo-16',
    color: '#80dfff',
    source: '冻土矿雷 · 进化',
  },
  {
    name: '雷弧过载',
    desc: '电栅命中时，向电线外的一名邻敌再放出一道电弧。',
    art: 'evo-17',
    color: '#aa9bff',
    source: '鸣弧线圈 · 进化',
  },
  {"name": "折镜双身", "desc": "镜像会在左右两侧同时出现，各自寻找射击目标。", "art": "spell-12", "color": "#72ead2", "source": "镜砂分身 · 改造"},
  {"name": "日蚀余烬", "desc": "日轮收拢时在英雄脚下留下火池，封住追兵的路。", "art": "spell-13", "color": "#ffab50", "source": "日轮焰盘 · 改造"},
  {"name": "还魂灯芯", "desc": "灯火每次从敌人身上汲取魂力，还会治疗英雄。", "art": "spell-14", "color": "#ea94e0", "source": "渡魂灯 · 改造"},
  {"name": "破岩锚链", "desc": "锚链收回时将聚拢的敌人向外震开。", "art": "spell-15", "color": "#efbd66", "source": "牵引锚 · 改造"},
  {"name": "霜针折返", "desc": "飞梭命中首个敌人时再向身后射出一枚反向冰羽。", "art": "spell-16", "color": "#a1eeff", "source": "霜羽飞梭 · 改造"},
  {"name": "二重鼓点", "desc": "第二声鼓点在短暂延迟后再次击退敌人并回充。", "art": "spell-17", "color": "#c19aff", "source": "蓄电战鼓 · 改造"},
]
export const art = (key: string) =>
  (globalThis as { brambleArt?: Record<string, string> }).brambleArt?.[key] ?? './art/' + key + '.webp'
export const clock = (value: number) =>
  [Math.floor(value / 60), Math.floor(value % 60)].map((n) => String(n).padStart(2, '0')).join(':')
export const gearCost = (level: number) => 20 + level * 25
export type Loadout = { hero: number; deck: number[] }
function validDeck(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 3 && new Set(value).size === 3 &&
    value.every(k => Number.isInteger(k) && k >= 0 && k < spells.length)
}
export type Profile = {
  loadouts: Loadout[]
  hero: number
  deck: number[]
  gear: number[]
  coins: number
  trophies: number
  wins: number
  plays: number
  best: number
  unlocked: number
  contract: number
  music: boolean
  audio: boolean
  motion: boolean
}
export function freshProfile(): Profile {
  return {
    hero: 0,
    loadouts: [],
    deck: [0, 1, 2],
    gear: [0, 0, 0],
    coins: 0,
    trophies: 0,
    wins: 0,
    plays: 0,
    best: 0,
    unlocked: 0,
    contract: 0,
    music: true,
    audio: true,
    motion: true,
  }
}
const saveKey = 'bramble-brawl.camp.v1'
export function readProfile(): Profile {
  const def = freshProfile()
  try {
    const raw = JSON.parse(localStorage.getItem(saveKey) || 'null')
    if (!raw || typeof raw !== 'object') return def
    const int = (n: unknown, max: number) =>
      typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0
    const p = { ...def }
    for (const k of ['coins', 'trophies', 'wins', 'plays', 'best'] as const) p[k] = int(raw[k], 1e9)
    p.hero = int(raw.hero, heroes.length - 1)
    p.unlocked = int(raw.unlocked, 2)
    p.contract = int(raw.contract, p.unlocked)
    if (validDeck(raw.deck)) p.deck = raw.deck
    if (Array.isArray(raw.loadouts)) {
      p.loadouts = raw.loadouts.filter((item: Loadout | null) =>
        item && Number.isInteger(item.hero) && item.hero >= 0 && item.hero < heroes.length && validDeck(item.deck)
      ).slice(0, 4)
    }
    if (Array.isArray(raw.gear) && raw.gear.length === 3)
      p.gear = raw.gear.map((n: unknown) => int(n, 5))
    p.music = raw.music === undefined ? raw.audio !== false : raw.music !== false
    p.audio = raw.audio !== false
    p.motion = raw.motion !== false
    return p
  } catch {
    return def
  }
}
export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(saveKey, JSON.stringify(p))
    return true
  } catch {
    return false
  }
}
