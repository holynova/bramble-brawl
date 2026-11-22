import test from 'node:test'
import assert from 'node:assert/strict'
import { Battle } from '../src/simulation.ts'
import { heroes, spells, freshProfile, weaponTraining, passiveTraining } from '../src/data.ts'
import { traditions } from '../src/builds.ts'
import { pathsFor, signature, blueprints, forkId, isRecruit, recruitStart } from '../src/forge.ts'
function arena(hero = 0, deck = [0, 1, 2]) {
  const b = new Battle({ ...freshProfile(), hero }, 917)
  b.deck = [...deck]
  b.arsenal.refreshSchools()
  b.enemies = []
  b.player.fire = b.spawnClock = b.raidTimer = b.hazardTimer = Infinity
  b.passiveTimers.fill(Infinity)
  return b
}
function advance(b, secs) {
  for (let i = 0; i < Math.round(secs * 50); i++) {
    b.age += 0.02
    b.foundry.step(0.02)
  }
}
function foe(b, x = 64, y = 0, hp = 3000) {
  const e = b.spawn(3)
  Object.assign(e, { x: b.player.x + x, y: b.player.y + y, hp, max: hp, speed: 0 })
  return e
}
function choose(b, id) {
  b.phase = 'upgrade'
  assert.ok(b.availableGrowth().includes(id))
  b.choices = [id]
  assert.equal(b.choose(id), true)
  assert.equal(b.phase, 'play')
}
function rank(b, track, side, last = 5) {
  for (let n = 2; n <= last; n++) choose(b, n === 3 ? forkId(track, side) : weaponTraining + track)
}
test('六英雄与十八被动的 48 条起点至终式路线均可正常升满，三阶互斥且满阶移出升级池', () => {
  const paths = new Set()
  for (let source = 0; source < 24; source++)
    for (const side of [0, 1]) {
      const track = source < 6 ? 0 : source - 5,
        b = new Battle({...freshProfile(), hero: track ? traditions.find(t=>t.deck.includes(track-1)).hero : source}, 917)
      choose(b, weaponTraining + track)
      assert.ok(b.evolutions.has(signature(b.hero, track)))
      assert.deepEqual(b.trackChoices(track), [forkId(track, 0), forkId(track, 1)])
      const id = pathsFor(b.hero, track)[side],
        route = blueprints[id]
      choose(b, forkId(track, side))
      paths.add(id)
      b.phase = 'upgrade'
      assert.equal(b.choose(forkId(track, 1 - side)), false)
      assert.equal(b.upgradeInfo(weaponTraining + track).name, route.midName)
      choose(b, weaponTraining + track)
      assert.equal(b.upgradeInfo(weaponTraining + track).name, route.endName)
      choose(b, weaponTraining + track)
      assert.equal(b.rankOf(track), 5)
      assert.deepEqual(b.trackChoices(track), [])
    }
  assert.equal(paths.size, 12)
  assert.equal(heroes.length + spells.length, 24)
})
test('职业池可研习两项，满槽时保留已投入的被动与路线', () => {
  const profile = { ...freshProfile(), hero: 3 }
  const b = new Battle(profile, 5)
  assert.equal(b.availableGrowth().filter(isRecruit).length, 6)
  assert.equal(b.growthChoices().filter(isRecruit).length, 1)
  choose(b, recruitStart + 7)
  rank(b, 8, 0)
  assert.ok(b.arsenal.schools.has('wind'))
  assert.ok(b.pinGoal(5, 1))
  choose(b, recruitStart + 3)
  assert.equal(b.goal, undefined)
  assert.equal(b.pinGoal(5, 1), false)
  b.phase = 'upgrade'
  assert.deepEqual(b.availableGrowth().filter(isRecruit), [])
  assert.equal(new Set(b.growthChoices()).size, 3)
  assert.equal(b.choose(recruitStart + 17), false)
  assert.equal(b.phase, 'upgrade')
  assert.deepEqual(b.deck,[6,5,12,7,3])
  assert.equal(b.rankOf(8), 5)
  assert.equal(b.foundry.paths.get(8), pathsFor(b.hero,8)[0])
  assert.ok(b.evolutions.has(signature(b.hero,8)))
  assert.ok(b.arsenal.schools.has('wind'))
  assert.deepEqual(new Battle(profile,5).deck,[6,5,12])
})
test('走位、架势和收割型改造会在冷却过半后分别提前激活；没有满足动作时不会提前', () => {
  for (const [key, side, mode] of [
    [6, 0, 'step'],
    [10, 0, 'still'],
    [8, 0, 'kill'],
  ]) {
    const b = arena(0, [key, 0, 2])
    rank(b, key + 1, side, 3)
    b.passiveTimers[key] = b.passiveCooldown(key) * 0.49
    if (mode === 'step') {
      b.foundry.chargePassives(0, 2)
      assert.ok(b.passiveTimers[key] > 0)
      b.foundry.chargePassives(150, 0.7)
    }
    if (mode === 'still') {
      b.foundry.chargePassives(2, 2)
      assert.ok(b.passiveTimers[key] > 0)
      b.foundry.chargePassives(0, 1.35)
    }
    if (mode === 'kill') {
      b.hurt(foe(b), 9000)
      assert.ok(b.passiveTimers[key] > 0)
      b.hurt(foe(b), 9000)
    }
    assert.equal(b.passiveTimers[key], 0)
  }
})
const byKey = [6, 6, 7, 2, 8, 8, 9, 0, 10, 3, 1, 11]
function forge(id, rankGoal = 5) {
  const key = byKey[id],
    b = arena(0, [key, 17]),
    track = key + 1
  rank(b, track, pathsFor(0, track).indexOf(id), rankGoal)
  return {
    b,
    track,
    fire: (aim) => b.foundry.onUse(track, aim, 0),
    nodes: (k) => b.foundry.constructs.filter((n) => n.kind === k),
  }
}
test('裂翎的交叉扇形、驻月与双月折返、十字火路的落种数量逐阶改变', () => {
  for (const [r, count] of [
    [3, 3],
    [4, 6],
    [5, 9],
  ]) {
    const { b, fire } = forge(0, r)
    fire(foe(b))
    assert.equal(b.shots.length, count)
  }
  for (const r of [3, 4, 5]) {
    const { b, fire, nodes } = forge(1, r)
    fire(foe(b))
    advance(b, 0.5)
    assert.equal(nodes('moon').length, r === 5 ? 2 : 1)
    assert.equal(nodes('moon')[0].returning, r === 3)
  }
  for (const r of [3, 4, 5]) {
    const { b, fire, nodes } = forge(2, r)
    fire(foe(b))
    b.player.y += 48
    advance(b, 0.02)
    assert.equal(nodes('fire').length, r === 5 ? 3 : 1)
    advance(b, 2.4)
    assert.equal(
      b.events.some((f) => f.type === 'ring' && f.size === 64),
      r >= 4,
    )
  }
})
test('引星牵引与追击碎星，死亡传疫及双向爆发，汲魂锁敌与双目标满血护盾', () => {
  for (const r of [3, 4, 5]) {
    const { b, fire, nodes } = forge(3, r),
      e = foe(b, 83),
      pos = { x: e.x - 40, y: e.y }
    foe(b, 125)
    fire(pos)
    advance(b, 0.3)
    assert.equal(e.x < pos.x + 40, r >= 4)
    advance(b, 0.38)
    assert.equal(nodes('star').length, r === 5 ? 2 : 0)
    const plague = forge(4, r),
      host = foe(plague.b)
    foe(plague.b, 90)
    foe(plague.b, 130)
    plague.fire(host)
    plague.b.hurt(host, 9000)
    assert.equal(plague.nodes('plague').filter((n) => n.life > 0).length, r === 5 ? 2 : r === 4 ? 1 : 0)
    const drain = forge(5, r),
      e1 = foe(drain.b),
      e2 = foe(drain.b, 90)
    drain.fire(e1)
    assert.equal(e1.frozenUntil > 0, r >= 4)
    assert.equal(e2.hp < e2.max, r === 5)
    assert.equal(drain.b.player.shield > 0, r === 5)
  }
})
test('蜂巢分裂蜂针与俯冲、工事的护盾与迁移，冰矿冻结和次生雷，双环追猎均进入真实战场', () => {
  for (const r of [3, 4, 5]) {
    const h = forge(6, r)
    foe(h.b)
    h.fire(h.b.player)
    advance(h.b, 0.04)
    assert.equal(h.nodes('bee').length, r === 5 ? 2 : 1)
    assert.equal(h.b.shots[0].style, r >= 4 ? 16 : 12)
    advance(h.b, 3.5)
    assert.equal(
      h.b.events.some((e) => e.type === 'slash'),
      r === 5,
    )
    const t = forge(7, r)
    t.fire(foe(t.b))
    advance(t.b, 0.04)
    assert.equal(t.b.player.shield > 0, r >= 4)
    const x = t.nodes('tower')[0].x
    t.b.player.x += 100
    advance(t.b, 0.2)
    assert.equal(t.nodes('tower')[0].x > x, r === 5)
    const m = forge(8, r),
      e = foe(m.b)
    m.fire(e)
    advance(m.b, 0.42)
    assert.equal(e.frozenUntil > 0, r >= 4)
    assert.equal(m.nodes('mine').length, r === 5 ? 2 : 0)
    const ring = forge(9, r),
      victim = foe(ring.b)
    victim.slow = 1
    ring.fire(victim)
    assert.equal(victim.frozenUntil > 0, r >= 4)
    assert.equal(ring.nodes('frost').length, r === 5 ? 1 : 0)
  }
})
test('逆流只在三跳后回充，风暴信标延续伤害，线外敌人规避单栅却会撞上线阵的第二道线', () => {
  for (const r of [3, 4, 5]) {
    const { b, fire, nodes } = forge(10, r)
    b.passiveTimers[17] = 8
    foe(b, 85)
    foe(b, 130)
    fire(foe(b, 42))
    assert.equal(b.passiveTimers[17] < 8, r >= 4)
    assert.equal(nodes('beacon').length, r === 5 ? 1 : 0)
    const wire = forge(11, r),
      base = { x: wire.b.player.x, y: wire.b.player.y },
      side = foe(wire.b, 65),
      cross = foe(wire.b, 0, 64)
    wire.fire(base)
    advance(wire.b, 0.02)
    assert.equal(side.hp < side.max, r === 5)
    assert.equal(cross.y < base.y + 64, r >= 4)
  }
})
test('六个新被动自动触发：镜像分身、跟身火轮、吸晶魂灯、聚怪锚、反向霜羽和回充战鼓', () => {
  for (let key = 12; key < 18; key++) {
    const b = arena(0, [key, 0, 1]),
      track = key + 1
    choose(b, passiveTraining + key)
    const e = foe(b, 70)
    b.passiveTimers[key] = 0
    b.passiveTimers[0] = 6
    b.passiveTimers[1] = 3
    b.player.hp -= 30
    const hp = b.player.hp
    b.drops.push({ id: ++b.serial, x: e.x, y: e.y, type: 0, value: 1 })
    assert.ok(b.triggerPassive(key, e))
    if (key === 12) assert.equal(b.foundry.constructs.filter((n) => n.kind === 'decoy').length, 2)
    if (key === 13) {
      b.player.x += 20
      advance(b, 0.04)
      assert.equal(b.foundry.constructs[0].x, b.player.x)
      advance(b, 3.65)
      assert.ok(b.foundry.constructs.some((d) => d.kind === 'fire'))
    }
    if (key === 14) {
      advance(b, 0.04)
      assert.ok(b.player.hp > hp)
      assert.ok(Math.abs(b.drops[0].x - b.player.x) <= 18.1)
    }
    if (key === 15) {
      const e2 = foe(b, 110)
      advance(b, 0.3)
      assert.ok(e2.x < b.player.x + 110)
      advance(b, 1.95)
      assert.ok(e2.hp < e2.max)
    }
    if (key === 16) {
      assert.equal(b.shots.filter((s) => s.style === 19).length, 3)
      b.foundry.onShot(19, e, 0, true, 12)
      assert.equal(b.shots.at(-1).style, 20)
      assert.ok(e.slow > 0)
    }
    if (key === 17) {
      advance(b, 1.1)
      assert.ok(b.passiveTimers[0] < 4)
      assert.ok(e.x > b.player.x + 70)
    }
    assert.equal(b.rankOf(track), 2)
  }
})
test('追踪未携带技能后保留同一目标，依次推荐研习、改造、指定岔路、进阶、满阶终式', () => {
  const b = new Battle(freshProfile(), 5),
    key = 6,
    track = key + 1
  assert.ok(b.pinGoal(track, 1))
  assert.deepEqual(b.choices, [])
  for (const id of [
    recruitStart + key,
    weaponTraining + track,
    forkId(track, 1),
    weaponTraining + track,
    weaponTraining + track,
  ]) {
    b.phase = 'upgrade'
    b.choices = b.growthChoices()
    assert.equal(b.choices[0], id)
    assert.equal(b.choices.length, 3)
    assert.equal(new Set(b.choices).size, 3)
    assert.ok(b.choose(id))
  }
  assert.equal(b.goal, undefined)
  assert.equal(b.rankOf(track), 5)
})
test('专属武器分支直接改写主攻击，双枪能扇射或前后同射，锤子可远点落击，药瓶可改变落点', () => {
  for (const side of [0, 1]) {
    const gun = arena(0)
    rank(gun, 0, side, 3)
    foe(gun, 70)
    gun.player.fire = 0
    for (let i = 0; i < 12; i++) gun.step(0.02, { x: 0, y: 0 })
    const rounds = gun.shots.filter((v) => v.style === 0)
    assert.equal(rounds.length, side === 0 ? 3 : 2)
    assert.equal(
      rounds.some((v) => v.vx < 0),
      side === 1,
    )
    const hammer = arena(2)
    rank(hammer, 0, side, 3)
    const distant = foe(hammer, 155)
    hammer.player.fire = 0
    for (let i = 0; i < 20; i++) hammer.step(0.02, { x: 0, y: 0 })
    assert.equal(distant.hp < distant.max, side === 1)
    const flask = arena(4)
    rank(flask, 0, side, 3)
    const target = foe(flask, 160)
    flask.arsenal.newWeapon(target, 0)
    const bottle = flask.arsenal.devices.find((v) => v.kind === 'flask')
    assert.equal(bottle.x, side === 0 ? flask.player.x + 80 : target.x)
    assert.equal(bottle.radius > 60, side === 1)
  }
})

test('每级三张不同实牌，未发出的合法技能不能选，查看路线也不能改动当前牌面', () => {
  for (const hero of heroes.keys()) {
    const b = new Battle({...freshProfile(), hero}, 42)
    const discovery = new Set()
    for (let i=0; i<120; i++) {
      b.level = 2 + i % 17
      const cards = b.growthChoices()
      assert.equal(cards.length, 3)
      assert.equal(new Set(cards).size, 3)
      assert.ok(cards.every(id => id < 6 || b.availableGrowth().includes(id)))
      cards.filter(isRecruit).forEach(id => discovery.add(id-recruitStart))
      assert.ok(cards.every(id => b.upgradeInfo(id)?.name))
    }
    assert.deepEqual(discovery, new Set(traditions.find(t=>t.hero===hero).reserves))
    b.xp = b.need
    b.collect(0)
    const hand = [...b.choices]
    const unseen = b.availableGrowth().find(id => !hand.includes(id))
    assert.equal(b.choose(unseen), false)
    assert.equal(b.pinGoal(0, 1), false)
    assert.deepEqual(b.choices, hand)
    assert.ok(b.choose(hand[0]))
    assert.equal(b.choose(hand[1]), false)
  }
})

test('三阶两条路线各是一张可立即生效的牌；所有进阶用尽时可继续三选一', () => {
  for (const side of [0, 1]) {
    const b = new Battle(freshProfile(), 44)
    assert.ok(b.pinGoal(0, side))
    choose(b, weaponTraining)
    b.xp = b.need
    b.collect(0)
    const forks = b.trackChoices(0)
    assert.ok(forks.every(id => b.choices.includes(id)))
    assert.equal(b.choices.length, 3)
    assert.equal(b.choices[0], forks[side])
    assert.ok(b.choose(forks[side]))
    assert.equal(b.rankOf(0), 3)
    assert.equal(b.foundry.paths.get(0), pathsFor(b.hero, 0)[side])
    b.weaponRank = 5
    b.passiveRanks.fill(5)
    b.deck = b.passivePool.slice(0, 5)
    b.arsenal.mastery = 'wind'
    b.xp = b.need
    b.collect(0)
    assert.equal(b.choices.length, 3)
    assert.equal(new Set(b.choices).size, 3)
    assert.ok(b.choices.every(id => id>=0 && id<6))
    assert.ok(b.choose(b.choices[2]))
  }
})
