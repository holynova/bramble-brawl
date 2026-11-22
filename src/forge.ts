import { heroes, spells, heroEvolution, spellEvolution, upgrades } from './data.ts'

export const recruitStart = 100
export const forkStart = 200
export const battleSlots = 5
export const isRecruit = (id: number) => id >= recruitStart && id < recruitStart + spells.length
export const isFork = (id: number) => id >= forkStart && id < forkStart + (spells.length + 1) * 2
export const forkId = (track: number, side: number) => forkStart + track * 2 + side
export const forkTrack = (id: number) => Math.floor((id - forkStart) / 2)
export const signature = (hero: number, track: number) =>
  track === 0 ? heroEvolution[hero] : spellEvolution[track - 1]
export const trackName = (hero: number, track: number) =>
  track === 0 ? heroes[hero].passive : spells[track - 1].name
export const trackArt = (hero: number, track: number) =>
  track === 0 ? 'face-' + hero : 'spell-' + (track - 1)

// Weapon rows first, then one row for each passive. Each item offers two exclusive blueprints.
const recipes: [number, number][] = [
  [0, 1],
  [10, 11],
  [7, 8],
  [1, 0],
  [2, 3],
  [4, 5],
  [6, 7],
  [10, 11],
  [3, 2],
  [9, 8],
  [1, 4],
  [7, 9],
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 10],
  [8, 9],
  [11, 10],
  [0, 6],
  [2, 9],
  [5, 4],
  [7, 11],
  [0, 8],
  [10, 7],
]
export const blueprints = [
  [
    '裂翎',
    '沿瞄准方向展开扇形穿透飞刃。',
    '交错切线',
    '从目标侧面发射第二道交叉刃线。',
    '万羽合围',
    '从目标两翼向中心对射，封住横向退路。',
  ],
  [
    '回月',
    '月刃飞出后转向英雄，返程可再次命中。',
    '驻月',
    '月刃转向前悬停，持续切割折返点。',
    '双月交锋',
    '两枚月刃分向飞出，沿不同路线追随英雄折返。',
  ],
  [
    '熔路',
    '在英雄身后沿实际移动路线铺下火种。',
    '复燃',
    '火种熄灭时爆开，波及两侧。',
    '十字焰径',
    '每次落种同时向行进方向两翼铺设火带。',
  ],
  [
    '星陨',
    '在目标脚下落下一枚延时陨星。',
    '引星',
    '落点先将附近敌人向中心牵引。',
    '群星接力',
    '主星落地后向附近不同敌人追加两颗追击碎星。',
  ],
  [
    '疫契',
    '给目标施加持续蚀魂的疫印。',
    '传疫',
    '带疫敌人阵亡时将疫印传给邻敌。',
    '群鸦疫潮',
    '每次传染分向两名敌人，同时在尸体处引爆。',
  ],
  [
    '汲魂',
    '对范围内生命比例最低的敌人汲取生命，命中回血。',
    '锁魂',
    '汲取会短暂锁住猎物，让英雄拉开距离。',
    '双生血契',
    '血束分向两名伤敌，满生命时汲取转为护盾。',
  ],
  [
    '蜂巢',
    '释放一只机械蜂，环绕英雄并射击追兵。',
    '蜂刺爆裂',
    '蜂针首次命中会横向分裂。',
    '王蜂出巡',
    '双蜂从两翼射击，退场时向最近目标俯冲爆破。',
  ],
  [
    '扎营',
    '在出手位置部署独立索敌的短时哨塔。',
    '铁壁',
    '靠近自己的工事时持续获得护盾。',
    '移动堡垒',
    '哨塔缓慢跟随英雄，撤离时发出一圈击退波。',
  ],
  [
    '冰矿',
    '在目标附近埋下冰雷，敌人接近才会引爆。',
    '碎冰锁链',
    '爆心冻结普通敌人并打断冲刺。',
    '冰脊雷阵',
    '主雷炸裂后在两侧留下可独立触发的次生雷。',
  ],
  [
    '霜环',
    '以英雄为中心施放一圈寒霜，减速附近敌人。',
    '冰封',
    '寒霜会冻结已经减速的目标。',
    '双环追猎',
    '第一圈之后，在命中目标的位置再次绽放霜环。',
  ],
  [
    '导雷',
    '从技能目标向相邻敌人传导电弧。',
    '逆流',
    '电弧命中三个不同目标，为另一道被动回充。',
    '风暴信标',
    '末端立起信标，周期性对周围敌人放电。',
  ],
  [
    '电栅',
    '在目标横向布置电线，只有靠近线段的敌人触电。',
    '磁捕',
    '每次放电将敌人向线段中央牵引。',
    '封锁矩阵',
    '叠加一道垂直电栅，形成十字封锁区。',
  ],
].map(([name, start, midName, mid, endName, end], i) => ({
  name,
  start,
  midName,
  mid,
  endName,
  end,
  art: 'hammer-' + i,
}))
export function pathsFor(hero: number, track: number) {
  return recipes[track ? heroes.length + track - 1 : hero]
}
export function promotion(hero: number, track: number, rank: number, chosen: number | undefined) {
  const base = trackName(hero, track),
    evo = upgrades[signature(hero, track)]
  if (rank === 1) return { ...evo, source: base + ' · Ⅱ阶改造' }
  const path = blueprints[chosen ?? pathsFor(hero, track)[0]]
  return {
    name: rank === 3 ? path.midName : path.endName,
    desc: rank === 3 ? path.mid : path.end,
    art: path.art,
    color: track ? spells[track - 1].color : heroes[hero].color,
    source: base + (rank === 3 ? ' · Ⅳ阶进阶' : ' · Ⅴ阶终式'),
  }
}

const weaponChanges = [
  ['两管改为正面三发霰刺，每发威力降低，适合贴近扫射。', '前后枪管同时开火，撤退也能清理身后的追兵。'],
  ['优先瞄准射程边缘的敌人，让电球从后排向内跳。', '从两翼斜射两枚较弱电球，在目标前交叉。'],
  ['短柄重锤留在身边，引发更强的击退以守住工事。', '改为远点落锤，能隔空震击目标脚下并减速。'],
  ['回镖提前转弯，适合把追兵引进近处的折返点。', '去程延长，双刃向两侧张开，横移可收割远处敌人。'],
  ['药瓶落在自己与追兵之间，先铺火再引怪。', '药瓶提高抛物线，延迟落地，在远端炸开更大的火池。'],
  ['主镰命中时把魂印同时刻给一名邻敌，方便成片传印。', '主镰专注残血，处决门槛提高，亲自击杀会回血。'],
]
const triggers = [
  'step',
  'step',
  'step',
  'still',
  'kill',
  'kill',
  'step',
  'still',
  'still',
  'still',
  'kill',
  'still',
] as const
export const triggerMode = (path: number) => triggers[path]
export function castingChange(hero: number, track: number, side: number) {
  if (!track) return weaponChanges[hero][side]
  const mode = triggerMode(pathsFor(hero, track)[side])
  return mode === 'step'
    ? '走位蓄力：冷却过半后，累计移动 145 距离可提前发动。'
    : mode === 'still'
      ? '架势蓄力：冷却过半后，站稳 1.3 秒可提前发动。'
      : '收割蓄力：冷却过半后，击杀两名敌人可提前发动。'
}
