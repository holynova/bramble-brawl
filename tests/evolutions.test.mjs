import test from 'node:test'
import assert from 'node:assert/strict'
import { Battle } from '../src/simulation.ts'
import {
  Evo,
  freshProfile,
  heroEvolution,
  spellEvolution,
  weaponTraining,
  passiveTraining,
  isEvolution,
} from '../src/data.ts'
import { unitFrame, defeatFrame } from '../src/poses.ts'

function arena(hero = 0, card = 0) {
  const b = new Battle({ ...freshProfile(), hero }, 73)
  b.enemies = []
  b.deck = [card]
  b.passiveTimers.fill(Infinity)
  b.spawnClock = Infinity
  b.player.fire = Infinity
  return b
}
function spawnAt(b, x, y, hp = 800) {
  const e = b.spawn(3)
  Object.assign(e, { x, y, hp, max: hp, speed: 0 })
  return e
}
function tick(b, frames) {
  for (let n = 0; n < frames; n++) b.step(1 / 60, { x: 0, y: 0 })
}
function pick(b, id) {
  b.phase = 'upgrade'
  b.choices = [id]
  b.choose(id)
}

function fire(b, slot, point) {
  const key = b.deck[slot]
  b.passiveTimers[key] = 0
  return b.triggerPassive(key, point)
}
test('二阶解锁武器和携带被动的独有改造，三阶可以选择两条不同路线', () => {
  for (let hero = 0; hero < 6; hero++) {
    const b = arena(hero)
    b.deck = [1, 3, 5]
    pick(b, weaponTraining)
    assert.ok(b.evolutions.has(heroEvolution[hero]))
    assert.equal(b.trackChoices(0).length,2)
    for (const key of b.deck) {
      pick(b, passiveTraining + key)
      assert.ok(b.evolutions.has(spellEvolution[key]))
      assert.equal(b.trackChoices(key+1).length,2)
    }
  }
})
test('英雄攻击与敌人近战的命中发生在出手帧，走开可躲，倒下保留独立帧', () => {
  const b = arena(),
    p = b.player
  const e = spawnAt(b, p.x + 18, p.y)
  p.fire = 0
  tick(b, 1)
  assert.ok(p.strike && e.strike)
  assert.equal(b.shots.length, 0)
  assert.equal(p.hp, p.max)
  const first = p.strike
  const pose = { age: first.start, stride: 0, moving: false, strike: first, hitAt: -Infinity }
  assert.deepEqual(
    [0, 0.6, 1, 1 + (first.recovery * 0.75) / first.windup].map((t) =>
      unitFrame({ ...pose, age: first.start + first.windup * t + 1e-6 }, true),
    ),
    [8, 9, 10, 11],
  )
  p.x -= 65
  tick(b, 14)
  assert.equal(p.hp, p.max)
  assert.ok(b.shots.length > 0 || e.hp < e.max)
  b.hurt(e, 10000)
  assert.equal(b.fallen.at(-1).id, e.id)
  assert.deepEqual([0, 0.22].map(defeatFrame), [14, 15])
  assert.deepEqual(
    [0, 1, 2, 3].map((stride) =>
      unitFrame({ ...pose, age: 1, strike: null, moving: true, stride }, false),
    ),
    [4, 5, 6, 7],
  )
  assert.deepEqual(
    [0.01, 0.1].map((t) => unitFrame({ ...pose, age: 1 + t, hitAt: 1 }, true)),
    [12, 13],
  )
})
test('刺头首击分叉且支弹能分别命中两翼', () => {
  const b = arena(),
    p = b.player
  b.evolutions.add(Evo.fork)
  const center = spawnAt(b, p.x + 49, p.y)
  const wings = [-1, 1].map((sign) => spawnAt(b, center.x + 60, p.y + sign * 36))
  b.projectile(p, 0, 0, 24)
  tick(b, 7)
  const children = b.shots.filter((s) => s.style === 8)
  assert.equal(children.length, 2)
  assert.ok(children[0].vy * children[1].vy < 0)
  tick(b, 16)
  assert.ok(wings.every((e) => e.hp < e.max))
})
test('霹雳第三次命中放置信标，会攻击后来进入的敌人', () => {
  const b = arena(1),
    p = b.player
  b.evolutions.add(Evo.beacon)
  const e = spawnAt(b, p.x + 60, p.y)
  for (let hit = 1; hit <= 3; hit++) {
    b.projectile(e, 0, 1, 10)
    tick(b, 1)
    assert.equal(b.zones.filter((z) => z.type === 'beacon').length, hit === 3 ? 1 : 0)
  }
  const z = b.zones[0]
  e.x += 400
  const newcomer = spawnAt(b, z.x + 60, z.y)
  tick(b, 53)
  assert.ok(newcomer.hp < newcomer.max)
  tick(b, 210)
  assert.ok(!b.zones.some((z) => z.type === 'beacon'))
})
test('铁墩锤击后发出裂隙，连续命中普攻范围外的敌人', () => {
  const b = arena(2),
    p = b.player
  b.evolutions.add(Evo.fault)
  spawnAt(b, p.x + 69, p.y)
  const far = [150, 215].map((x) => spawnAt(b, p.x + x, p.y))
  p.fire = 0
  tick(b, 15)
  assert.ok(b.shots.some((s) => s.style === 9))
  p.fire = Infinity
  tick(b, 48)
  assert.ok(far.every((e) => e.hp < e.max))
})
test('炮芽由两侧分别建塔开火，上限六株，换塔保留凋落态', () => {
  const b = arena(),
    p = b.player
  b.evolutions.add(Evo.twins)
  const target = { x: p.x, y: p.y - 140 }
  spawnAt(b, target.x, target.y)
  fire(b, 0)
  assert.equal(b.turrets.length, 2)
  assert.ok(b.turrets[0].x < p.x && b.turrets[1].x > p.x)
  tick(b, 30)
  const shots = b.shots.filter((s) => s.style === 7)
  assert.equal(shots.length, 2)
  assert.ok(shots[0].vx * shots[1].vx < 0)
  for (let n = 0; n < 3; n++) {
    fire(b, 0)
  }
  assert.equal(b.turrets.length, 6)
  assert.equal(b.fallen.filter((f) => f.type === 7).length, 2)
})
test('雷印延迟二次索敌，碎星有三个独立的落点与延迟', () => {
  const b = arena(0, 1),
    at = { x: 500, y: 420 }
  b.evolutions.add(Evo.echo)
  fire(b, 0, at)
  const newcomer = spawnAt(b, at.x, at.y)
  tick(b, 30)
  assert.equal(newcomer.hp, newcomer.max)
  tick(b, 22)
  assert.equal(newcomer.hp, newcomer.max - 39)
  b.deck = [2]

  b.evolutions.add(Evo.cluster)
  fire(b, 0, at)
  tick(b, 27)
  const parts = b.zones.filter((z) => z.type === 'fragment')
  assert.equal(new Set(parts.map((z) => z.x)).size, 3)
  assert.equal(new Set(parts.map((z) => z.life)).size, 3)
  const struck = parts.map((z) => spawnAt(b, z.x, z.y))
  tick(b, 34)
  assert.ok(struck.every((e) => e.hp < e.max))
})
test('冰环能定身，冻结目标的死亡会引爆邻居且每个目标只结算一次', () => {
  const b = arena(0, 3),
    p = b.player
  b.evolutions.add(Evo.shatter)
  const pack = [40, 61, 81].map((x, i) => spawnAt(b, p.x + x, p.y, i === 1 ? 56 : 110))
  pack[0].speed = 70
  fire(b, 0, p)
  const before = pack[0].x
  tick(b, 25)
  assert.equal(pack[0].x, before)
  const hp = pack[2].hp
  b.hurt(pack[0], 100)
  assert.equal(b.kills, 2)
  assert.equal(pack[2].hp, hp - 56)
})
test('进化旋风将敌人拉向中心，首领牵引减弱', () => {
  const b = arena(0, 4),
    at = { x: 300, y: 370 }
  b.evolutions.add(Evo.vortex)
  const regular = spawnAt(b, at.x + 98, at.y)
  const boss = b.spawn(6)
  Object.assign(boss, { x: at.x - 98, y: at.y, speed: 0 })
  fire(b, 0, at)
  tick(b, 20)
  const normalPull = 98 - (regular.x - at.x),
    bossPull = 98 - (at.x - boss.x)
  assert.ok(normalPull > 25 && bossPull > 0 && bossPull < normalPull / 2)
})
test('金盾受击产生八向反刺，未受击不触发，连续受击有间隔', () => {
  const b = arena(0, 5)
  b.evolutions.add(Evo.thorns)
  spawnAt(b, b.player.x + 42, b.player.y)
  fire(b, 0)
  assert.equal(b.shots.length, 0)
  b.takeHit(90)
  b.takeHit(90)
  assert.equal(b.shots.length, 8)
  assert.equal(b.player.hp, b.player.max)
  assert.equal(new Set(b.shots.map((s) => Math.atan2(s.vy, s.vx))).size, 8)
})

test('进化冰晶能打断巨像蓄力并撤下对应的预警', () => {
  const b = arena(0, 3)
  const boss = b.spawn(6)
  Object.assign(boss, { x: b.player.x + 75, y: b.player.y })
  b.bossTimer = 0
  tick(b, 1)
  assert.equal(boss.strike.kind, 'slam')
  assert.ok(b.zones.some((z) => z.owner === boss.id))
  b.evolutions.add(Evo.shatter)
  fire(b, 0, boss)
  assert.equal(boss.strike, null)
  assert.ok(!b.zones.some((z) => z.owner === boss.id))
  tick(b, 32)
  assert.equal(boss.moving, false)
  assert.equal(b.player.hp, b.player.max)
})
