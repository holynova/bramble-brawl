import test from 'node:test'
import assert from 'node:assert/strict'
import { Battle } from '../src/simulation.ts'
import { Evo, freshProfile, heroes, spells, readProfile, saveProfile } from '../src/data.ts'
import { actorTexture, activeTraditions, traditions, masteryStart, isMastery } from '../src/builds.ts'

const still = { x: 0, y: 0 }
function arena(hero, deck) {
  const b = new Battle({ ...freshProfile(), hero, deck }, 19)
  b.enemies = []
  b.spawnClock = b.raidTimer = b.player.fire = Infinity
  b.passiveTimers.fill(Infinity)
  return b
}
function enemy(b, dx, dy = 0, hp = 500) {
  const e = b.spawn(3)
  Object.assign(e, { x: b.player.x + dx, y: b.player.y + dy, speed: 0, hp, max: hp })
  return e
}
function advance(b, time, input = still) {
  for (let n = 0; n < Math.round(time * 60); n++) b.step(1 / 60, input)
}
function fire(b, k, at) {
  b.passiveTimers[k] = 0
  assert.ok(b.triggerPassive(k, at))
}
function specialize(b, key) {
  b.level = 6
  b.choices = b.growthChoices()
  const id = masteryStart + traditions.findIndex((t) => t.key === key)
  assert.ok(b.choices.includes(id))
  b.phase = 'upgrade'
  b.choose(id)
  assert.equal(b.arsenal.mastery, key)
  assert.ok(b.growthChoices().every((v) => !isMastery(v)))
}

test('六职业和十八被动可自由搭配，推荐配装激活对应流派，收藏保留高编号英雄和技能', () => {
  assert.equal(heroes.length, 6)
  assert.equal(spells.length, 18)
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(actorTexture), [
    'anim-0',
    'anim-1',
    'anim-2',
    'anim-8',
    'anim-9',
    'anim-10',
  ])
  for (const t of traditions) assert.ok(activeTraditions(t.hero, t.deck).includes(t))
  assert.deepEqual(
    activeTraditions(3, [6, 2, 7]).map((t) => t.key),
    ['wind', 'fire'],
  )
  const map = new Map()
  globalThis.localStorage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) }
  try {
    const p = { ...freshProfile(), hero: 5, deck: [11, 10, 9], loadouts: [{ hero: 4, deck: [2, 7, 11] }] }
    assert.ok(saveProfile(p))
    assert.deepEqual(readProfile(), p)
    saveProfile({ ...p, loadouts: [null, { hero: 8, deck: [0, 1, 2] }, { hero: 2, deck: [9, 9, 10] }] })
    assert.deepEqual(readProfile().loadouts, [])
  } finally {
    delete globalThis.localStorage
  }
})
test('回旋镖去回两段分别命中，回程追踪英雄，双月觉醒增加第二条刃线', () => {
  const b = arena(3, [1, 2, 3]),
    e = enemy(b, 92)
  b.arsenal.newWeapon(e, 0)
  advance(b, 0.37)
  assert.equal(e.hp, 500 - b.damage)
  advance(b, 0.79)
  assert.equal(e.hp, 500 - 2 * b.damage)
  b.evolutions.add(Evo.moon)
  b.arsenal.newWeapon(e, 0)
  const blades = b.arsenal.devices.filter((d) => d.kind === 'moon')
  assert.equal(blades.length, 2)
  assert.notEqual(blades[0].angle, blades[1].angle)
  advance(b, 0.58, { x: 0, y: 1 })
  assert.ok(blades.every((d) => Math.sin(d.angle) > 0))
})
test('熔浆投瓶先落地再灼烧，坩埚到期喷发打中火池外围', () => {
  const b = arena(4, [0, 1, 3]),
    e = enemy(b, 110),
    outer = enemy(b, 185)
  b.evolutions.add(Evo.crucible)
  b.arsenal.newWeapon(e, 0)
  advance(b, 0.27)
  assert.equal(e.hp, 500)
  advance(b, 0.23)
  assert.ok(e.hp < 500 && b.arsenal.devices.some((d) => d.kind === 'pool'))
  assert.equal(outer.hp, 500)
  advance(b, 2.5)
  assert.ok(outer.hp < 500)
})
test('影镰选伤敌，换命斩第二目标，疫印传递与魂线回血独立触发', () => {
  const b = arena(5, [8, 3, 2]),
    a = enemy(b, 70),
    wounded = enemy(b, 100),
    next = enemy(b, 155)
  wounded.hp = 10
  next.hp = 250
  assert.equal(b.arsenal.weaponTarget(225), wounded)
  b.evolutions.add(Evo.reaper)
  b.evolutions.add(Evo.plague)
  b.player.hp -= 15
  b.arsenal.newWeapon(wounded, 0)
  assert.ok(wounded.hp <= 0 && next.hp < 250 && a.hp < 500)
  assert.equal(b.player.hp, b.player.max - 10)
  assert.ok(b.arsenal.marks.has(a.id))
  assert.equal(b.arsenal.triggers.hex, 1)
})
test('月牙远轨反转，足迹需要移动且会复燃，双蜂各自追射', () => {
  const b = arena(3, [6, 7, 9])
  b.evolutions.add(Evo.orbit)
  b.evolutions.add(Evo.rekindle)
  b.evolutions.add(Evo.flight)
  fire(b, 6)
  fire(b, 7)
  fire(b, 9)
  const orbits = b.arsenal.devices.filter((d) => d.kind === 'orbit')
  assert.equal(orbits.length, 4)
  assert.equal(new Set(orbits.map((d) => d.radius)).size, 2)
  const e = enemy(b, 100)
  advance(b, 0.35)
  assert.equal(b.arsenal.devices.filter((d) => d.kind === 'ember').length, 0)
  assert.ok(b.events.filter((f) => f.type === 'shot' && f.size === 12).length >= 2)
  advance(b, 0.7, { x: 1, y: 0 })
  assert.ok(b.arsenal.devices.some((d) => d.kind === 'ember' && d.variant))
  advance(b, 3)
  assert.ok(b.events.some((f) => f.type === 'impact' && f.color === 0))
  assert.ok(e.hp < 500)
})
test('冰雷布防后冻结并生成两枚次雷，进化电栅能劈向线外目标', () => {
  const b = arena(1, [10, 11, 0])
  b.evolutions.add(Evo.ridge)
  b.evolutions.add(Evo.overload)
  const e = enemy(b, 38)
  fire(b, 10)
  advance(b, 0.3)
  assert.equal(e.hp, 500)
  advance(b, 0.25)
  assert.ok(e.frozenUntil > b.age)
  assert.equal(b.arsenal.devices.filter((d) => d.kind === 'mine' && d.variant).length, 2)
  const previousHP = e.hp
  const more = enemy(b, 69),
    out = enemy(b, 134)
  fire(b, 11, more)
  advance(b, 0.04)
  assert.ok(more.hp < 500)
  assert.ok(e.hp < previousHP) // nearest target outside the line takes the extra arc
  assert.equal(out.hp, 500)
})
test('单局专精只可选一次，混搭可二选一。风刃蓄距、野火传播和工事护盾能实际触发', () => {
  const b = arena(3, [6, 2, 7])
  b.level = 5
  assert.ok(b.growthChoices().every((v) => !isMastery(v)))
  b.level = 6
  assert.equal(b.growthChoices().filter(isMastery).length, 2)
  specialize(b, 'wind')
  b.arsenal.moved(190, 1)
  b.arsenal.onWeaponFired(0)
  assert.equal(b.shots.filter((s) => s.style === 13).length, 3)
  const f = arena(4, [2, 7, 1])
  specialize(f, 'fire')
  const e = enemy(f, 70)
  enemy(f, 110)
  f.arsenal.scorched(e)
  f.hurt(e, 900)
  assert.equal(f.arsenal.devices.filter((d) => d.kind === 'ember').length, 2)
  const fort = arena(2, [0, 9, 5])
  specialize(fort, 'fort')
  advance(fort, 1.35)
  assert.ok(fort.player.shield > 0 && fort.arsenal.devices.some((d) => d.kind === 'sentry'))
})
test('冰爆定身、双魂丝与三跳回充三种专精改变后续战斗', () => {
  const frost = arena(0, [3, 10, 1])
  specialize(frost, 'frost')
  const a = enemy(frost, 50),
    other = enemy(frost, 73)
  a.slow = 1
  frost.arsenal.onWeaponHit(a)
  assert.ok(other.frozenUntil > frost.age && other.hp < other.max)
  const hex = arena(5, [8, 3, 0])
  specialize(hex, 'hex')
  const dead = enemy(hex, 60),
    h1 = enemy(hex, 85),
    h2 = enemy(hex, 110)
  fire(hex, 8, dead)
  hex.hurt(dead, 900)
  assert.ok(h1.hp < 500 && h2.hp < 500)
  const arc = arena(1, [11, 1, 9])
  specialize(arc, 'arc')
  for (const x of [65, 95, 130]) enemy(arc, x)
  arc.passiveTimers[1] = 8
  arc.passiveTimers[11] = 13
  arc.passiveTimers[9] = 9
  arc.arsenal.onPassive()
  arc.arsenal.onPassive()
  arc.arsenal.onPassive()
  assert.equal(arc.passiveTimers[11], 11)
  assert.equal(arc.arsenal.triggers.arc, 1)
})
