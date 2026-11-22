import test from 'node:test'
import assert from 'node:assert/strict'
import { Battle, segmentDistance } from '../src/simulation.ts'
import {
  freshProfile,
  contracts,
  gearCost,
  readProfile,
  saveProfile,
  weaponTraining,
  passiveTraining,
  isEvolution,
  nova,
} from '../src/data.ts'

test('独立被动冷却、守护触发条件、唯一主动和暂停', () => {
  const p = freshProfile()
  const b = new Battle(p, 73)
  b.deck = [0, 1, 5]
  b.arsenal.refreshSchools()
  b.enemies = []
  b.spawnClock = Infinity
  b.passiveTimers.fill(0)
  b.step(0.02, { x: 0, y: 0 })
  assert.equal(b.turrets.length, 1)
  assert.equal(b.passiveUses[1], 0)
  assert.equal(b.passiveUses[5], 0)
  assert.ok(b.passiveTimers[0] > 11)
  assert.equal(b.triggerPassive(0), false)
  const e = b.spawn(5)
  Object.assign(e, { x: b.player.x + 50, y: b.player.y, hp: 800 })
  b.step(0.02, { x: 0, y: 0 })
  assert.equal(b.passiveUses[1], 1)
  assert.equal(b.passiveUses[5], 1)
  assert.ok(b.releaseNova())
  assert.equal(b.novaTimer, nova.cooldown)
  assert.equal(b.releaseNova(), false)
  b.xp = b.need
  b.step(0.02, { x: 0, y: 0 })
  assert.equal(b.phase, 'upgrade')
  const timers = [...b.passiveTimers, b.novaTimer]
  b.step(0.04, { x: 1, y: 0 })
  assert.deepEqual([...b.passiveTimers, b.novaTimer], timers)
  assert.equal(b.releaseNova(), false)
  b.choose(999)
  assert.equal(b.phase, 'upgrade')
  assert.equal(new Set(b.choices).size, 3)
  b.choose(b.choices[0])
  assert.equal(b.phase, 'play')
})
test('火球延迟命中，冰晶减速，旋风持续伤害，金盾保护', () => {
  const p = freshProfile(),
    b = new Battle(p, 2)
  b.enemies = []
  b.spawnClock = 100
  b.player.fire = 100
  const e = b.spawn(6, false, 100)
  e.x = b.player.x + 45
  e.y = b.player.y
  e.speed = 0
  b.deck = [2, 3, 4]
  b.passiveTimers.fill(Infinity)
  b.passiveTimers[2] = 0
  const initial = e.hp
  b.triggerPassive(2, e)
  assert.equal(e.hp, initial)
  for (let i = 0; i < 25; i++) b.step(0.02, { x: 0, y: 0 })
  assert.equal(e.hp, initial - 97)
  b.passiveTimers[3] = 0
  b.triggerPassive(3, e)
  assert.equal(e.slow, 4)
  b.passiveTimers.fill(0)
  b.triggerPassive(4, e)
  const old = e.hp
  for (let i = 0; i < 30; i++) b.step(0.02, { x: 0, y: 0 })
  assert.ok(e.hp < old - 12)
  b.deck = [5, 0, 1]
  b.passiveTimers.fill(0)
  b.player.hp = 70
  b.triggerPassive(5)
  b.takeHit(100)
  assert.equal(b.player.hp, 82)
})
test('濒死、撤场前收益、上限以及本地存档兼容', () => {
  const b = new Battle(freshProfile(), 4)
  b.takeHit(1000)
  assert.equal(b.phase, 'lost')
  b.step(0.04, { x: 1, y: 1 })
  assert.equal(b.age, 0)
  const mem = new Map()
  globalThis.localStorage = { getItem: (k) => mem.get(k), setItem: (k, v) => mem.set(k, v) }
  const p = freshProfile()
  p.gear = [2, 1, 0]
  p.coins = 27
  assert.ok(saveProfile(p))
  assert.deepEqual(readProfile(), p)
  const legacy = { ...p, audio: false }
  delete legacy.music
  saveProfile(legacy)
  assert.equal(readProfile().audio, false)
  assert.equal(readProfile().music, false)
  const bad = { ...p, deck: [3, 3, 9], contract: 10, unlocked: 1, gear: [1, -3, 9999] }
  saveProfile(bad)
  assert.equal(readProfile().deck, undefined)
  assert.equal(readProfile().contract, 1)
  assert.deepEqual(readProfile().gear, [1, 0, 5])
  delete globalThis.localStorage
})
function play(p) {
  const b = new Battle(p, 107 + p.hero + p.contract)
  let sawElite = false,
    sawBoss = false
  for (
    let i = 0;
    i < (contracts[p.contract].seconds + 240) * 30 && ['play', 'upgrade'].includes(b.phase);
    i++
  ) {
    if (b.phase === 'upgrade') {
      const growth = b.choices
      const order = [
        ...b.trackChoices(0),
        ...[5, 0, 9].map(key => 100 + key),
        ...b.deck.flatMap(key => b.trackChoices(key + 1)),
        ...b.choices,
      ]
      if (b.player.hp < b.player.max * 0.5) order.unshift(2)
      assert.ok(b.choose(order.find(id => growth.includes(id))))
    }
    const p0 = b.player
    // Aim along a circuit, choosing a clear heading when a pack or warning blocks it.
    const angle = Math.atan2((p0.y - 550) / 150, (p0.x - 680) / 210) + 0.45
    const base = Math.atan2(550 + Math.sin(angle)*150 - p0.y, 680 + Math.cos(angle)*210 - p0.x)
    const near = b.nearby(p0, 210)
    let best = -Infinity, dx = 0, dy = 0
    for (let n=0; n<16; n++) {
      const a = base + n*Math.PI/8, x = Math.cos(a), y = Math.sin(a)
      let score = 38*Math.cos(a-base)
      for (const ahead of [.22, .48, .82]) {
        const at = {x:p0.x+x*b.speed*ahead, y:p0.y+y*b.speed*ahead}
        if (at.x<102 || at.x>1258 || at.y<102 || at.y>978) score-=90
        for (const e of near) {
          const heading = e.dive?.angle ?? Math.atan2(p0.y-e.y,p0.x-e.x)
          const travel = e.dive ? e.dive.range*.55 : e.speed*ahead*.7
          const gap = Math.hypot(at.x-e.x-Math.cos(heading)*travel, at.y-e.y-Math.sin(heading)*travel)
          score-=Math.max(0,e.radius+36-gap)*2
        }
        for (const z of b.zones) {
          if ((z.type==='slam'||z.type==='fissure') && Math.abs(z.life-ahead)<.32)
            score-=Math.max(0,z.radius+20-segmentDistance(at,z,z.end??z))*4
        }
      }
      if (score>best) {best=score; dx=x; dy=y}
    }
    if (b.nearby(p0, 94).length >= 4 || b.nearby(p0, 103).some((e) => e.type === 6)) b.releaseNova()
    b.step(1 / 30, { x: dx, y: dy })
    b.events.length = 0
    sawElite ||= b.eliteCount > 0
    sawBoss ||= b.bossId > 0
  }
  return {
    phase: b.phase,
    kills: b.kills,
    level: b.level,
    hp: Math.round(b.player.hp),
    time: Math.round(b.age),
    reward: b.coins,
    sawElite,
    sawBoss,
  }
}
for (let hero = 0; hero < 3; hero++) {
  test('完成三份通缉令并用所得赏金强化，英雄 ' + hero, (t) => {
    const p = freshProfile()
    p.hero = hero
    for (let contract = 0; contract < 3; contract++) {
      p.contract = contract
      const outcome = play(p)
      t.diagnostic(JSON.stringify({ contract, gear: [...p.gear], ...outcome }))
      assert.equal(outcome.phase, 'won')
      assert.ok(outcome.sawElite && outcome.sawBoss)
      assert.ok(outcome.level >= 2)
      assert.ok(outcome.reward >= contracts[contract].bounty)
      p.coins += outcome.reward
      for (let pass = 0; pass < 5; pass++)
        for (const slot of [0, 2, 1]) {
          const cost = gearCost(p.gear[slot])
          if (p.coins >= cost && p.gear[slot] < 5) {
            p.coins -= cost
            p.gear[slot]++
          }
        }
    }
  })
}

test('武器进阶和被动进阶分别生效，进行中的冷却保留进度', () => {
  const battle = new Battle({ ...freshProfile(), hero: 1 }, 9)
  const upgrade = (id) => {
    battle.phase = 'upgrade'
    battle.choices = [id]
    battle.choose(id)
  }
  const initialDamage = battle.damage
  const full = battle.passiveCooldown(1)
  battle.passiveTimers[1] = full / 2
  const other = battle.passiveCooldown(11)
  upgrade(passiveTraining + 1)
  assert.equal(battle.passiveRanks[1], 2)
  assert.ok(battle.passiveCooldown(1) < full)
  assert.equal(battle.passiveTimers[1] / battle.passiveCooldown(1), 0.5)
  assert.equal(battle.passiveCooldown(11), other)
  assert.equal(battle.damage, initialDamage)
  const cd = battle.passiveTimers[1]
  upgrade(weaponTraining)
  assert.equal(battle.weaponRank, 2)
  assert.ok(battle.damage > initialDamage)
  assert.equal(battle.passiveTimers[1], cd)
})

test('冲刺蝠先预警再扑击，单次冲刺只结算一次，可以用震荡打断', () => {
  const make = () => {
    const b = new Battle(freshProfile(), 5)
    b.age = contracts[0].seconds / 6
    b.enemies = []
    b.spawnClock = b.player.fire = b.raidTimer = Infinity
    b.passiveTimers.fill(Infinity)
    const bat = b.spawn(4)
    Object.assign(bat, {x:b.player.x + 100, y:b.player.y, diveAt:0, hp:200})
    return { b, bat }
  }
  const idle = {x:0,y:0}
  const {b,bat} = make()
  const x = bat.x
  for (let i=0;i<9;i++) b.step(.05,idle)
  assert.ok(bat.dive)
  assert.equal(bat.x,x)
  assert.equal(b.player.hp,b.player.max)
  for (let i=0;i<12;i++) b.step(.05,idle)
  assert.equal(bat.dive,null)
  assert.equal(b.events.filter(f=>f.type==='hurt').length,1)
  const interrupted = make()
  interrupted.b.step(.05,idle)
  assert.ok(interrupted.bat.dive)
  assert.ok(interrupted.b.releaseNova())
  assert.equal(interrupted.bat.dive,null)
  assert.ok(interrupted.bat.x > x)
})

test('每关六波，首领在第 4、6、8 分钟出现，原地站桩撑不到首领', () => {
  assert.deepEqual(contracts.map(c=>c.seconds),[240,360,480])
  for (let contract=0;contract<3;contract++) {
    const span = contracts[contract].seconds
    const p = {...freshProfile(),contract}
    const timing = new Battle(p,33)
    timing.age=span-0.1
    timing.step(.05,{x:0,y:0})
    assert.equal(timing.wave,6)
    assert.equal(timing.bossId,0)
    timing.step(.06,{x:0,y:0})
    assert.ok(timing.bossId)
    const player = new Battle(p,1331+contract)
    for (let i=0;i<span*20;i++){
      if(player.phase==='upgrade') player.choose(player.choices.find(isEvolution)??player.choices[0])
      if(player.phase!=='play')break
      player.step(.05,{x:0,y:0})
      player.events.length=0
    }
    assert.equal(player.phase,'lost')
    assert.equal(player.bossId,0)
  }
})

test('矿印位置在警铃时锁定，直行会命中，改向能躲过；第四波出现并排截击', () => {
  function encounter(wave, turn) {
    const b = new Battle(freshProfile(), 24)
    b.age = (wave-1)*contracts[0].seconds/6
    b.enemies = []
    b.spawnClock = b.raidTimer = b.player.fire = Infinity
    b.eliteCount = 3
    b.passiveTimers.fill(Infinity)
    b.hazardTimer = 0
    b.step(.02, {x:1,y:0})
    const marks = b.zones.filter(z=>z.type==='slam')
    assert.equal(b.events.filter(e=>e.type==='warning').length, 1)
    assert.equal(marks.length, wave===4 ? 2 : 1)
    assert.ok(marks.every(z=>z.x>b.player.x && z.life>=.95))
    const positions=marks.map(z=>[z.x,z.y])
    assert.equal(b.player.hp,b.player.max)
    const input=turn?{x:0,y:1}:{x:1,y:0}
    for(let i=0;i<28;i++) b.step(.02,input)
    assert.deepEqual(marks.map(z=>[z.x,z.y]),positions)
    assert.equal(b.player.hp,b.player.max)
    for(let i=0;i<33;i++) b.step(.02,input)
    return b.events.filter(e=>e.type==='hurt').length
  }
  for(const wave of [2,4]){
    assert.equal(encounter(wave,false),1)
    assert.equal(encounter(wave,true),0)
  }
})

test('首领半血阶段发出错拍双落击，同一轮预警只响一次', () => {
  const b=new Battle(freshProfile(), 46)
  b.enemies=[]
  b.spawnClock=b.raidTimer=b.player.fire=Infinity
  b.passiveTimers.fill(Infinity)
  const boss=b.spawn(6,false,210)
  b.bossId=boss.id
  b.bossTimer=0
  boss.hp=boss.max*.40
  b.step(.02,{x:1,y:0})
  const zones=b.zones.filter(z=>z.owner===boss.id)
  assert.equal(zones.length,2)
  assert.ok(zones[1].life>zones[0].life+.1)
  assert.ok(zones[1].x>zones[0].x+100)
  assert.equal(b.events.filter(e=>e.type==='warning').length,1)
})

test('裂地长带锁定当时的走向，预警中无伤，横切可躲，留在带内只结算一次', () => {
  for (const turn of [false,true]) {
    const b = new Battle(freshProfile(), 55)
    b.enemies = []
    b.spawnClock = b.raidTimer = b.player.fire = Infinity
    b.passiveTimers.fill(Infinity)
    b.fissureTimer = 0
    b.step(.02, {x:1,y:0})
    const lane = b.zones.find(z => z.type==='fissure')
    assert.ok(lane.end.x > b.player.x+b.speed && lane.x < b.player.x)
    const endpoints = [lane.x,lane.y,lane.end.x,lane.end.y]
    assert.equal(b.events.filter(f=>f.type==='warning').length,1)
    for (let i=0; i<20; i++) b.step(.05, turn ? {x:0,y:1} : {x:1,y:0})
    assert.deepEqual([lane.x,lane.y,lane.end.x,lane.end.y],endpoints)
    assert.equal(b.player.hp,b.player.max)
    for (let i=0; i<10; i++) b.step(.05,{x:0,y:0})
    assert.equal(b.events.filter(f=>f.type==='hurt').length,turn?0:1)
    assert.equal(b.events.filter(f=>f.type==='fissure').length,1)
  }
  assert.equal(segmentDistance({x:14,y:3},{x:0,y:0},{x:10,y:0}),5)
})

test('后两关的首领每三次重踏从两翼增援，狂暴后交替使用落击和裂地', () => {
  for (const contract of [0,1,2]) {
    const b = new Battle({...freshProfile(),contract}, 71)
    b.enemies = []
    b.passiveTimers.fill(Infinity)
    b.spawnClock = b.raidTimer = b.player.fire = Infinity
    const boss = b.spawn(6,false,210)
    boss.hp = boss.max * .5
    b.bossId = boss.id
    for (let n=1; n<=3; n++) {
      boss.strike = null
      b.bossTimer = 0
      b.zones = []
      b.step(.02,{x:1,y:0})
      assert.ok(b.zones.every(z=>z.owner===boss.id))
      assert.equal(b.zones.filter(z=>z.type==='fissure').length,n===2?1:0)
    }
    assert.equal(b.enemies.filter(e=>e.type===4).length,contract*2)
  }
})
