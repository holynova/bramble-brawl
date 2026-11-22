export type School = 'wind' | 'fire' | 'hex' | 'fort' | 'frost' | 'arc'

type Tradition = {
  key: School
  name: string
  color: string
  effect: string
  tactics: string
  hero: number
  deck: [number, number, number]
  reserves: number[]
  priority: string
}
export const traditions: Tradition[] = [
  {
    key: 'wind',
    name: '疾风回刃',
    color: '#72ead2',
    hero: 3,
    deck: [6, 5, 12],
    reserves: [7, 4, 3, 1, 8, 10],
    effect: '每移动 180 距离蓄一刃，下次普攻附带一枚穿透风刃。',
    tactics: '绕到怪群侧面，改变回镖的返程路线，让内外两道刃线交叉。',
    priority: '先觉醒回镖，再升刃轮',
  },
  {
    key: 'fire',
    name: '燎原火径',
    color: '#ffac66',
    hero: 4,
    deck: [7, 2, 13],
    reserves: [4, 6, 11, 9, 0, 8],
    effect: '刚被火焰灼伤的敌人死亡时，会在原地留下一片野火。每两秒可蔓延一次。',
    tactics: '沿窄路铺下火径，绕回火池，引追兵穿过同一处交火点。',
    priority: '先升火径，再觉醒药瓶',
  },
  {
    key: 'hex',
    name: '蚀魂收割',
    color: '#ef9adf',
    hero: 5,
    deck: [8, 4, 14],
    reserves: [9, 3, 6, 10, 1, 7],
    effect: '带印敌人倒下时回复 5 生命，并射出魂丝打击邻敌。每两秒可触发一次。',
    tactics: '在怪群边缘放印，贴近伤敌收割，再借传印和回血接下一组。',
    priority: '先升魂印，再觉醒绯镰',
  },
  {
    key: 'fort',
    name: '蜂塔工事',
    color: '#ffdc76',
    hero: 2,
    deck: [0, 9, 15],
    reserves: [5, 10, 2, 11, 1, 3],
    effect: '站稳 1.2 秒后自动部署一座短时哨塔，部署间隔八秒。',
    tactics: '在炮台和巡蜂的射程内短暂停步。重锤推走近敌，下一波再换阵地。',
    priority: '先升炮芽，再升巡蜂',
  },
  {
    key: 'frost',
    name: '冻土碎击',
    color: '#94e5ff',
    hero: 0,
    deck: [3, 10, 16],
    reserves: [6, 5, 4, 0, 9, 11],
    effect: '主武器击中减速或冻结目标时，冰屑炸向周围敌人。间隔 1.5 秒。',
    tactics: '用脚下的冰雷封住追兵路线，回头用贯穿双枪引爆聚在一起的目标。',
    priority: '先升冰雷，再升双枪',
  },
  {
    key: 'arc',
    name: '雷网共振',
    color: '#c1a9ff',
    hero: 1,
    deck: [1, 11, 17],
    reserves: [9, 3, 0, 4, 2, 5],
    effect: '每第三次被动发动时，额外放出一道最多跳跃三次的电链。',
    tactics: '沿电栅横向移动，把怪群拉到同一条线上。优先缩短被动冷却。',
    priority: '先升落雷与电栅',
  },
]
export const traditionFor = (hero: number) => traditions.find(t => t.hero === hero)!

export const weaponSchools: School[][] = [['wind'], ['arc'], ['fort'], ['wind'], ['fire'], ['hex']]
export const passiveSchools: School[][] = [
  ['fort'],
  ['arc'],
  ['fire'],
  ['frost'],
  ['wind', 'hex'],
  ['fort', 'frost'],
  ['wind'],
  ['fire'],
  ['hex'],
  ['fort'],
  ['frost'],
  ['arc'],
  ['wind'], ['fire'], ['hex'], ['fort'], ['frost'], ['arc'],
]
export function schoolCount(key: School, hero: number, deck: number[]) {
  return (
    Number(weaponSchools[hero].includes(key)) + deck.filter((k) => passiveSchools[k].includes(key)).length
  )
}
export const activeTraditions = (hero: number, deck: number[]) =>
  traditions.filter((t) => schoolCount(t.key, hero, deck) >= 2)
export const actorTexture = (hero: number) => 'anim-' + [0, 1, 2, 8, 9, 10][hero]

export const masteryStart = 50
export const masteries: Record<School, { name: string; desc: string; art: string }> = {
  wind: { name: '双翼追风', desc: '蓄满的风刃会扇射三道，横切敌阵。', art: 'evo-9' },
  fire: { name: '飞火越阵', desc: '野火蔓延时，还会跃至近旁另一名敌人脚下。', art: 'evo-13' },
  hex: { name: '双生魂线', desc: '收割回复生命时，魂丝能同时追打两名邻敌。', art: 'evo-14' },
  fort: { name: '移动堡垒', desc: '短时哨塔部署时，为英雄展开 1.5 秒护盾。', art: 'evo-15' },
  frost: { name: '霜锁碎裂', desc: '碎冰爆炸同时定身周围普通敌人，首领受到短暂定身。', art: 'evo-16' },
  arc: {
    name: '电荷回流',
    desc: '额外电链跳满三次后，冷却剩余最长的出战被动立即回充两秒。',
    art: 'evo-17',
  },
}
export const isMastery = (id: number) => id >= masteryStart && id < masteryStart + traditions.length
