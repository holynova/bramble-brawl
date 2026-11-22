import test from 'node:test'
import assert from 'node:assert/strict'
import { Battle } from '../src/simulation.ts'
import { Evo, freshProfile, heroes, spells, readProfile, saveProfile } from '../src/data.ts'
import { actorTexture, activeTraditions, traditions, masteryStart, isMastery } from '../src/builds.ts'

const still = { x: 0, y: 0 }
function arena(hero, deck) {
  const b = new Battle({ ...freshProfile(), hero }, 19)
  b.deck = [...deck]
  b.arsenal.refreshSchools()
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
  const id = masteryStart + traditions.findIndex((t) => t.key === key)
  assert.ok(b.availableGrowth().includes(id))
  b.choices = [id]
  b.phase = 'upgrade'
  b.choose(id)
  assert.equal(b.arsenal.mastery, key)
  assert.ok(b.growthChoices().every((v) => !isMastery(v)))
}

test('六名英雄各有三项自动起手、六项可研习和一项独有被动，旧配装不影响开局', () => {
  assert.equal(heroes.length,6)
  assert.deepEqual(heroes.map((_,i)=>actorTexture(i)), ['anim-0','anim-1','anim-2','anim-8','anim-9','anim-10'])
  const pools = new Set(), starters = new Set()
  for (const t of traditions) {
    const b = new Battle({...freshProfile(), hero:t.hero, deck:[0,1,2]}, 77)
    assert.deepEqual(b.deck, t.deck)
    assert.ok(activeTraditions(t.hero, b.deck).includes(t))
    assert.equal(t.deck.length,3)
    assert.equal(t.reserves.length,6)
    assert.deepEqual(b.passivePool,[...t.deck,...t.reserves])
    assert.equal(new Set(b.passivePool).size,9)
    pools.add([...b.passivePool].sort((a,b)=>a-b).join())
    for(const k of b.deck) starters.add(k)
    for(const k of b.passivePool) assert.ok(spells[k])
    const exclusive = t.deck.at(-1)
    assert.equal(traditions.filter(other=>[...other.deck,...other.reserves].includes(exclusive)).length,1)
    b.phase='upgrade'
    for(const key of spells.keys()){
      const offered=b.availableGrowth().includes(100+key)
      assert.equal(offered,t.reserves.includes(key))
      if(!b.passivePool.includes(key)){
        assert.deepEqual(b.trackChoices(key+1),[])
        b.phase='play'
        assert.equal(b.pinGoal(key+1,0),false)
        b.phase='upgrade'
        b.choices=[100+key]
        assert.equal(b.choose(100+key),false)
      }
    }
    for(let i=0;i<20;i++){
      const picks=b.growthChoices()
      assert.equal(new Set(picks).size,3)
      assert.ok(picks.filter(id=>id>=100&&id<200).every(id=>t.reserves.includes(id-100)))
    }
  }
  assert.equal(pools.size,6)
  assert.equal(starters.size,18)
})
test('读取旧存档保留进度、装备和设置；更新后使用当前英雄技能', () => {
  const map=new Map()
  globalThis.localStorage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}
  try {
    const progress={...freshProfile(),hero:5,unlocked:2,contract:1,gear:[3,1,2],coins:177,wins:2,plays:9,trophies:53,best:610,audio:false}
    const legacy=JSON.stringify({...progress,deck:[11,10,9],loadouts:[{hero:4,deck:[2,7,11]}]})
    map.set('bramble-brawl.camp.v1',legacy)
    assert.deepEqual(readProfile(),progress)
    const updated={...progress,hero:2}
    assert.ok(saveProfile(updated))
    assert.equal(map.get('bramble-brawl.camp.v1'),legacy)
    assert.deepEqual(readProfile(),updated)
    assert.deepEqual(new Battle(readProfile(),4).deck,[0,9,15])
  } finally {delete globalThis.localStorage}
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
test('单局专精只可选一次，混搭可抽到任一已激活专精。风刃蓄距、野火传播和工事护盾能实际触发', () => {
  const b = arena(3, [6, 2, 7])
  b.level = 5
  assert.ok(b.growthChoices().every((v) => !isMastery(v)))
  b.level = 6
  const eligible = b.availableGrowth().filter(isMastery)
  assert.equal(eligible.length, 2)
  const offered = new Set()
  for (let i=0; i<36; i++) {
    const mastery = b.growthChoices().filter(isMastery)
    assert.equal(mastery.length, 1)
    offered.add(mastery[0])
  }
  assert.deepEqual(offered, new Set(eligible))
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
