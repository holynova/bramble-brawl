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
export const weaponTraining = 15
export const passiveTraining = 16
export const maxRank = 5
export const awakeningRank = 3
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
} as const
export const heroEvolution = [Evo.fork, Evo.beacon, Evo.fault]
export const spellEvolution = [Evo.twins, Evo.echo, Evo.cluster, Evo.shatter, Evo.vortex, Evo.thorns]
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
]
export const art = (key: string) =>
  (globalThis as { brambleArt?: Record<string, string> }).brambleArt?.[key] ?? './art/' + key + '.webp'
export const clock = (value: number) =>
  [Math.floor(value / 60), Math.floor(value % 60)].map((n) => String(n).padStart(2, '0')).join(':')
export const gearCost = (level: number) => 20 + level * 25
export type Profile = {
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
    p.hero = int(raw.hero, 2)
    p.unlocked = int(raw.unlocked, 2)
    p.contract = int(raw.contract, p.unlocked)
    if (
      Array.isArray(raw.deck) &&
      raw.deck.length === 3 &&
      new Set(raw.deck).size === 3 &&
      raw.deck.every((i: unknown) => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < 6)
    )
      p.deck = raw.deck
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
