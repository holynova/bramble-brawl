import type { Strike } from './poses.ts'
import {
  contracts,
  heroes,
  spells,
  Evo,
  heroEvolution,
  spellEvolution,
  nova,
  waveNames,
  weaponTraining,
  passiveTraining,
  maxRank,
  awakeningRank,
  isEvolution,
  upgrades,
} from './data.ts'
import type { Profile } from './data.ts'

export type Point = { x: number; y: number }
export type Enemy = Point & {
  id: number
  type: number
  hp: number
  max: number
  speed: number
  radius: number
  elite: boolean
  slow: number
  hitAt: number
  frozenUntil: number
  stride: number
  moving: boolean
  strike: Strike | null
  dive: { angle: number; start: number; range: number; hit: boolean } | null
  diveAt: number
  readyAt: number
  face: number
}
export type Shot = Point & {
  id: number
  vx: number
  vy: number
  life: number
  damage: number
  style: number
  pierce: number
  hit: number[]
}
export type Drop = Point & { id: number; type: number; value: number }
export type Turret = Point & {
  id: number
  life: number
  timer: number
  born: number
  face: number
  strike: Strike | null
}
export type Fallen = Point & { id: number; type: number; elite: boolean; face: number; at: number }
export type Zone = Point & {
  id: number
  type: 'meteor' | 'storm' | 'slam' | 'fragment' | 'echo' | 'beacon'
  owner?: number
  life: number
  radius: number
  tick: number
}
export type Fx = Point & {
  type:
    | 'shot'
    | 'spark'
    | 'bolt'
    | 'ring'
    | 'burst'
    | 'heal'
    | 'gem'
    | 'hurt'
    | 'wave'
    | 'cast'
    | 'text'
    | 'impact'
    | 'nova'
    | 'guard'
    | 'stomp'
    | 'hammer'
  color: number
  size: number
  to?: Point
  label?: string
}
export const WORLD = { w: 1360, h: 1080 }
export const props = [
  { x: 275, y: 260, type: 1, r: 24 },
  { x: 640, y: 242, type: 0, r: 18 },
  { x: 985, y: 318, type: 2, r: 20 },
  { x: 398, y: 536, type: 0, r: 18 },
  { x: 875, y: 625, type: 3, r: 19 },
  { x: 594, y: 785, type: 2, r: 19 },
  { x: 1050, y: 839, type: 0, r: 18 },
  { x: 224, y: 790, type: 3, r: 18 },
  { x: 1118, y: 521, type: 1, r: 20 },
]
const limit = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
function separate(p: Point, radius: number) {
  for (const o of props) {
    const dx = p.x - o.x,
      dy = p.y - o.y,
      d = Math.hypot(dx, dy),
      r = radius + o.r
    if (d < r) {
      p.x = o.x + (d ? dx / d : 1) * r
      p.y = o.y + (d ? dy / d : 0) * r
    }
  }
  p.x = limit(p.x, 86, WORLD.w - 86)
  p.y = limit(p.y, 80, WORLD.h - 80)
}
export class Battle {
  hero: number
  contract: number
  deck: number[]
  seed: number
  serial = 0
  player = {
    x: 680,
    y: 552,
    hp: 130,
    max: 130,
    face: 1,
    moving: false,
    stride: 0,
    hitAt: -Infinity,
    strike: null as Strike | null,
    shield: 0,
    invuln: 0,
    fire: 0,
  }
  evolutions = new Set<number>()
  beaconHits = 0
  reflectAt = 0
  fallen: Fallen[] = []
  phase: 'play' | 'upgrade' | 'won' | 'lost' = 'play'
  age = 0
  wave = 1
  kills = 0
  level = 1
  xp = 0
  need = 5
  coins = 0
  chests = 0
  weaponRank = 1
  passiveRanks = spells.map(() => 1)
  passiveTimers = spells.map(() => 0)
  passiveUses = spells.map(() => 0)
  novaTimer = 0
  guardFxAt = -1
  raidTimer = 23
  raidCount = 0
  bossId = 0
  bossTimer = 3
  hazardTimer = 10
  eliteCount = 0
  damage: number
  speed: number
  rate: number
  spellPower = 1
  cooldownScale = 1
  magnet = 100
  spawnClock = 1
  choices: number[] = []
  enemies: Enemy[] = []
  shots: Shot[] = []
  drops: Drop[] = []
  turrets: Turret[] = []
  zones: Zone[] = []
  events: Fx[] = []
  constructor(profile: Profile, seed = Math.floor(Math.random() * 0xffffffff)) {
    this.seed = seed
    this.hero = profile.hero
    this.contract = profile.contract
    this.deck = [...profile.deck]
    this.deck.forEach((key, slot) => {
      this.passiveTimers[key] = 2 + slot * 1.65
    })
    const h = heroes[this.hero]
    this.player.max = this.player.hp = Math.round(h.hp * (1 + profile.gear[2] * 0.1))
    this.damage = h.power * (1 + profile.gear[0] * 0.08)
    this.speed = h.speed * (1 + profile.gear[1] * 0.05)
    this.rate = h.rate
    this.magnet += profile.gear[1] * 8
    for (let i = 0; i < 5; i++) this.spawn(i === 3 ? 4 : 3, false, 185 + i * 20)
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0
    return this.seed / 4294967296
  }
  effect(type: Fx['type'], p: Point, color: number, size = 1, to?: Point, label?: string) {
    this.events.push({ type, x: p.x, y: p.y, color, size, to: to && { x: to.x, y: to.y }, label })
  }
  spawn(
    type: number,
    elite = false,
    radius = 275 + this.random() * 110,
    approach = this.random() * Math.PI * 2,
  ) {
    const angle = approach,
      p = this.player,
      difficulty = contracts[this.contract].factor
    const max = Math.round(
      ({ 3: 32, 4: 21, 5: 93, 6: 3750 }[type] ?? 30) *
        difficulty *
        (type === 6 ? 1 + this.contract * 0.47 : 1 + 0.16 * (this.wave - 1)) *
        (elite ? 2.45 : 1),
    )
    const enemy: Enemy = {
      id: ++this.serial,
      x: p.x + Math.cos(angle) * radius,
      y: p.y + Math.sin(angle) * radius,
      type,
      hp: max,
      max,
      speed:
        ({ 3: 62, 4: 95, 5: 46, 6: 45 }[type] ?? 50) *
        (1 + 0.042 * this.contract + 0.029 * (this.wave - 1)),
      radius: type === 6 ? 32 : type === 5 ? 18 : 12,
      elite,
      slow: 0,
      hitAt: -Infinity,
      frozenUntil: 0,
      stride: (this.serial * 1.37) % 4,
      moving: false,
      strike: null,
      readyAt: 0,
      dive: null,
      diveAt: this.age + 0.8,
      face: 1,
    }
    separate(enemy, enemy.radius)
    if (distance(enemy, p) < 110) {
      enemy.x = limit(p.x + (p.x < WORLD.w / 2 ? 180 : -180), 90, WORLD.w - 90)
    }
    this.enemies.push(enemy)
    return enemy
  }
  nearby(p: Point, range: number) {
    return this.enemies
      .filter((e) => e.hp > 0 && distance(p, e) <= range)
      .sort((a, b) => distance(p, a) - distance(p, b))
  }
  hurt(e: Enemy, amount: number) {
    if (e.hp <= 0 || this.phase !== 'play') return
    e.hp -= amount
    e.hitAt = this.age
    this.effect('spark', e, e.type === 5 || e.type === 6 ? 0xffc36d : 0xffedd1, amount)
    if (e.hp > 0) return
    this.fallen.push({
      id: e.id,
      x: e.x,
      y: e.y,
      type: e.type,
      elite: e.elite,
      face: e.face,
      at: this.age,
    })
    this.kills++
    this.coins += e.elite ? 6 : this.kills % 3 === 0 ? 1 : 0
    this.effect('burst', e, e.type === 4 ? 0x9963ff : 0xffc66d, e.elite ? 24 : 14)
    const xp = e.elite ? 8 : e.type === 5 ? 3 : 1
    const stack =
      this.drops.length >= 120 ? this.drops.find((d) => d.type === 0 && distance(d, e) < 100) : undefined
    if (stack) stack.value += xp
    else this.drops.push({ id: ++this.serial, x: e.x, y: e.y, type: 0, value: xp })
    if (e.elite) {
      this.drops.push({ id: ++this.serial, x: e.x + 10, y: e.y + 5, type: 3, value: 12 })
    } else if (this.kills % (24 + this.contract * 8) === 0) {
      this.drops.push({ id: ++this.serial, x: e.x + 10, y: e.y, type: 2, value: 17 })
    }
    if (e.frozenUntil > this.age && this.evolutions.has(Evo.shatter)) {
      this.effect('impact', e, 2, 84)
      this.area(e, 78, 28 * this.passivePower(3), 0x91e6ff)
    }
    if (e.type === 6 && this.phase === 'play') {
      this.phase = 'won'
      this.coins += contracts[this.contract].bounty
    }
  }
  area(at: Point, r: number, power: number, color: number) {
    this.effect('ring', at, color, r)
    for (const e of this.nearby(at, r)) this.hurt(e, power)
  }
  strike(
    from: Point,
    target: Point,
    id: number,
    windup: number,
    recovery: number,
    kind: Strike['kind'] = 'basic',
  ): Strike {
    return {
      start: this.age,
      windup,
      recovery,
      target: id,
      angle: Math.atan2(target.y - from.y, target.x - from.x),
      fired: false,
      kind,
    }
  }
  projectile(from: Point, angle: number, style: number, damage: number, exclude: number[] = []) {
    const speed = style === 9 ? 300 : style === 1 ? 355 : 450
    this.shots.push({
      id: ++this.serial,
      x: from.x,
      y: from.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: style === 9 ? 0.88 : style === 10 ? 0.55 : 1.05,
      damage,
      style,
      pierce: style === 0 ? 2 : style === 9 ? 75 : 1,
      hit: exclude,
    })
  }
  shoot(from: Point, angle: number, style: number, damage: number) {
    this.projectile(from, angle, style, damage)
    this.effect('shot', from, style === 1 ? 0xc3a5ff : 0xf4fd65, style)
  }
  plant(at: Point, delay: number) {
    const cap = this.evolutions.has(Evo.twins) ? 6 : 3
    if (this.turrets.length >= cap) {
      const old = this.turrets.shift()!
      this.wilt(old)
    }
    this.turrets.push({
      ...at,
      id: ++this.serial,
      life: 18 + this.passiveRanks[0] - 1,
      timer: 0.25 + delay,
      born: this.age,
      face: 1,
      strike: null,
    })
    this.effect('ring', at, 0x94fc4c, 37)
  }
  wilt(t: Turret) {
    this.fallen.push({ id: t.id, type: 7, elite: false, face: t.face, x: t.x, y: t.y, at: this.age })
  }
  lightning(from: Point, at: Point, power: number, radius = 200) {
    for (const enemy of this.nearby(at, radius).slice(0, 5)) {
      this.effect('bolt', from, 0xb98bff, 5, enemy)
      this.hurt(enemy, power)
      from = enemy
    }
    this.effect('impact', at, 1, 96)
  }
  passiveCooldown(key: number) {
    return spells[key].cooldown * (1 - 0.055 * (this.passiveRanks[key] - 1)) * this.cooldownScale
  }
  passivePower(key: number) {
    return this.spellPower * (1 + 0.16 * (this.passiveRanks[key] - 1))
  }
  releaseNova() {
    if (this.phase !== 'play' || this.novaTimer > 0) return false
    const p = this.player
    this.novaTimer = nova.cooldown
    p.invuln = Math.max(p.invuln, 0.48)
    this.effect('nova', p, 0xffc759, nova.radius)
    for (const e of this.nearby(p, nova.radius)) {
      const d = Math.max(1, distance(e, p)),
        shove = e.type === 6 ? 14 : e.elite ? 40 : 78
      this.hurt(e, 38 + this.damage * 0.42)
      if (e.type !== 6) {
        e.dive = null
        e.strike = null
        e.readyAt = Math.max(e.readyAt, this.age + 0.48)
      }
      e.x += ((e.x - p.x) * shove) / d
      e.y += ((e.y - p.y) * shove) / d
      separate(e, e.radius * 0.48)
    }
    return true
  }
  triggerPassive(key: number, point?: Point) {
    if (this.phase !== 'play' || !this.deck.includes(key) || this.passiveTimers[key] > 0) return false
    const p = this.player
    const range = key === 5 ? 88 : key === 3 ? 145 : 390
    const target = point ?? this.nearby(p, range)[0]
    if (!target && key !== 0) return false
    const origin = key === 0 || key === 3 || key === 5 ? (point ?? p) : target!
    const at = { x: limit(origin.x, 85, WORLD.w - 85), y: limit(origin.y, 85, WORLD.h - 85) }
    const power = this.passivePower(key)
    this.passiveTimers[key] = this.passiveCooldown(key)
    this.passiveUses[key]++
    this.effect('cast', at, 0xffd976, key)
    if (key === 0) {
      if (this.evolutions.has(Evo.twins)) {
        const center = limit(at.x, 112, WORLD.w - 112)
        this.plant({ x: center - 25, y: at.y }, 0)
        this.plant({ x: center + 25, y: at.y }, 0.12)
      } else this.plant(at, 0)
    } else if (key === 1) {
      this.lightning(p, at, 58 * power)
      if (this.evolutions.has(Evo.echo))
        this.zones.push({ ...at, id: ++this.serial, type: 'echo', life: 0.8, radius: 128, tick: 0 })
    } else if (key === 2) {
      this.zones.push({ ...at, id: ++this.serial, type: 'meteor', life: 0.42, radius: 124, tick: 0 })
    } else if (key === 3) {
      for (const enemy of this.nearby(at, 156)) {
        enemy.slow = 4
        if (this.evolutions.has(Evo.shatter)) {
          enemy.frozenUntil = this.age + (enemy.type === 6 ? 0.65 : 1.8)
          if (enemy.strike?.kind === 'slam') this.zones = this.zones.filter((z) => z.owner !== enemy.id)
          enemy.strike = null
          enemy.dive = null
        }
      }
      this.area(at, 156, 36 * power, 0x7bedff)
      this.effect('impact', at, 2, 180)
    } else if (key === 4) {
      this.zones.push({ ...at, id: ++this.serial, type: 'storm', life: 6, radius: 105, tick: 0 })
    } else {
      p.shield = 3 + 0.18 * (this.passiveRanks[5] - 1)
      p.hp = Math.min(p.max, p.hp + 12 + 3 * (this.passiveRanks[5] - 1))
      this.area(p, 80, 28 * power, 0xffdf60)
      for (const e of this.nearby(p, 83)) {
        const d = Math.max(1, distance(e, p))
        e.x += ((e.x - p.x) * 48) / d
        e.y += ((e.y - p.y) * 48) / d
      }
      this.effect('heal', p, 0xffd45b, 3)
    }
    return true
  }
  takeHit(amount: number) {
    const p = this.player
    if (this.phase !== 'play') return
    if (p.shield > 0) {
      if (this.age - this.guardFxAt > 0.3) {
        this.effect('guard', p, 0xffd458, 32)
        this.guardFxAt = this.age
      }
      if (this.evolutions.has(Evo.thorns) && this.age >= this.reflectAt) {
        this.reflectAt = this.age + 0.55
        for (let n = 0; n < 8; n++) this.projectile(p, (n * Math.PI) / 4, 10, 26 * this.passivePower(5))
        this.effect('ring', p, 0xffdb56, 60)
      }
      return
    }
    if (p.invuln > 0) return
    p.hitAt = this.age
    p.hp = Math.max(0, p.hp - amount)
    p.invuln = 0.74
    this.effect('hurt', p, 0xff654d, amount)
    if (!p.hp) this.phase = 'lost'
  }
  choose(index: number) {
    if (this.phase !== 'upgrade' || !this.choices.includes(index)) return
    if (isEvolution(index)) this.evolutions.add(index)
    if (index === weaponTraining) {
      this.weaponRank++
      this.damage *= 1.22
      this.rate *= 0.95
    }
    if (index >= passiveTraining) {
      const key = index - passiveTraining,
        old = this.passiveCooldown(key)
      this.passiveRanks[key]++
      this.passiveTimers[key] *= this.passiveCooldown(key) / old
    }
    if (index === 0) this.damage *= 1.22
    if (index === 1) this.rate = Math.max(0.15, this.rate * 0.88)
    if (index === 2) {
      this.player.max += 25
      this.player.hp = Math.min(this.player.max, this.player.hp + 45)
    }
    if (index === 3) {
      this.speed *= 1.09
      this.magnet += 14
    }
    if (index === 4) {
      this.cooldownScale *= 0.94
      this.deck.forEach((k) => {
        this.passiveTimers[k] *= 0.94
      })
    }
    if (index === 5) this.spellPower *= 1.12
    this.choices = []
    this.phase = 'play'
    this.player.invuln = Math.max(this.player.invuln, 0.6)
  }
  upgradeInfo(id: number) {
    if (id === weaponTraining)
      return {
        name: heroes[this.hero].passive,
        desc: '武器伤害提高 22%，攻击间隔缩短 5%。',
        source: '武器 · ' + this.weaponRank + ' → ' + (this.weaponRank + 1) + ' 阶',
        color: heroes[this.hero].color,
        art: 'face-' + this.hero,
      }
    if (id >= passiveTraining) {
      const k = id - passiveTraining,
        rank = this.passiveRanks[k],
        evo = this.evolutions.has(spellEvolution[k])
      return {
        name: evo ? upgrades[spellEvolution[k]].name : spells[k].name,
        desc:
          '增强被动威力，基础冷却再缩短 ' +
          Number((spells[k].cooldown * 0.055 * this.cooldownScale).toFixed(1)) +
          ' 秒。',
        source: '被动 · ' + rank + ' → ' + (rank + 1) + ' 阶',
        art: evo ? upgrades[spellEvolution[k]].art : 'spell-' + k,
        color: spells[k].color,
      }
    }
    return upgrades[id]
  }
  growthChoices() {
    const heroEvo = heroEvolution[this.hero]
    const weapon =
      this.weaponRank >= awakeningRank && !this.evolutions.has(heroEvo)
        ? heroEvo
        : this.weaponRank < maxRank
          ? weaponTraining
          : undefined
    const passives = this.deck.flatMap((key) => {
      const rank = this.passiveRanks[key],
        evo = spellEvolution[key]
      return rank >= awakeningRank && !this.evolutions.has(evo)
        ? [evo]
        : rank < maxRank
          ? [passiveTraining + key]
          : []
    })
    const choices: number[] = weapon === undefined ? [] : [weapon]
    // Keep an available evolution visible even if three passives unlock together.
    const first = passives.findIndex(isEvolution)
    if (first >= 0) choices.push(passives.splice(first, 1)[0])
    const draw = (pool: number[]) => pool.splice(Math.floor(this.random() * pool.length), 1)[0]
    while (choices.length < (this.level % 3 === 0 ? 2 : 3) && passives.length)
      choices.push(draw(passives))
    const support = [0, 1, 2, 3, 4, 5]
    while (choices.length < 3) choices.push(draw(support))
    return choices
  }
  collect(dt: number) {
    const p = this.player
    this.drops = this.drops.filter((d) => {
      const dist = distance(d, p)
      if (dist < 19) {
        if (d.type === 0) {
          this.xp += d.value
          this.effect('gem', p, 0x55ffc2, 4)
        }
        if (d.type === 2) {
          p.hp = Math.min(p.max, p.hp + d.value)
          this.effect('text', p, 0x82ff7d, 1, undefined, '+' + d.value)
        }
        if (d.type === 3) {
          this.chests++
          this.coins += d.value
          this.spellPower += 0.12
          this.effect('text', p, 0xffdc68, 1, undefined, '遗物 · 法伤 +12%')
        }
        return false
      }
      if (dist < this.magnet) {
        const step = Math.min(dist, dt * (180 + 2 * (this.magnet - dist)))
        d.x += ((p.x - d.x) * step) / dist
        d.y += ((p.y - d.y) * step) / dist
      }
      return true
    })
    if (this.phase === 'play' && this.xp >= this.need) {
      this.xp -= this.need
      this.level++
      this.need = Math.min(74, Math.round(this.need * 1.15 + 1))
      this.choices = this.growthChoices()
      this.phase = 'upgrade'
    }
  }
  step(dt: number, input: Point) {
    if (this.phase !== 'play') return
    dt = limit(dt, 0, 0.06)
    this.age += dt
    this.fallen = this.fallen.filter((f) => this.age - f.at < 0.46)
    const p = this.player,
      c = contracts[this.contract]
    const wave = Math.min(waveNames.length, 1 + Math.floor(this.age / (c.seconds / waveNames.length)))
    if (wave !== this.wave) {
      this.wave = wave
      this.effect('wave', p, 0xffdf78, wave)
    }
    const length = Math.hypot(input.x, input.y)
    p.moving = length > 0.05
    if (p.moving) {
      const before = { x: p.x, y: p.y }
      p.x += (input.x / Math.max(1, length)) * dt * this.speed
      p.y += (input.y / Math.max(1, length)) * dt * this.speed
      if (Math.abs(input.x) > 0.1) p.face = Math.sign(input.x)
      separate(p, 13)
      const walked = distance(before, p)
      p.moving = walked > 0.02
      p.stride += walked / 14
    }
    p.fire -= dt
    p.shield -= dt
    p.invuln -= dt
    this.novaTimer = Math.max(0, this.novaTimer - dt)
    for (const key of this.deck) {
      this.passiveTimers[key] = Math.max(0, this.passiveTimers[key] - dt)
      if (this.passiveTimers[key] === 0) this.triggerPassive(key)
    }
    const pressure = Math.min(1, this.age / c.seconds)
    this.spawnClock -= dt
    const cap = 48 + 6 * this.contract + this.wave * 2
    if (this.spawnClock <= 0 && this.enemies.length < cap) {
      this.spawnClock = (this.bossId ? 0.78 : 1.03 - 0.58 * pressure) / c.factor
      const r = this.random()
      this.spawn(this.wave >= 3 && r > 0.79 - 0.04 * pressure ? 5 : r < 0.24 + 0.07 * pressure ? 4 : 3)
    }
    this.raidTimer -= dt
    if (this.raidTimer <= 0 && !this.bossId) {
      this.raidCount++
      this.raidTimer = (30 - 10 * pressure) / Math.sqrt(c.factor)
      const angle = this.random() * Math.PI * 2
      const count = 2 + Math.floor(this.wave * 0.8) + this.contract
      for (let i = 0; i < count && this.enemies.length < cap; i++) {
        const flank = this.wave >= 4 && i % 2 ? Math.PI : 0
        this.spawn(
          this.wave >= 3 && i % 3 === 0 ? 5 : 4,
          false,
          270 + this.random() * 45,
          angle + flank + (this.random() - 0.5) * 0.8,
        )
      }
      this.effect('text', p, 0xffcb74, 1, undefined, this.wave >= 4 ? '双翼夹击' : '蝠群突袭')
    }
    if (
      this.eliteCount < 3 + this.contract &&
      this.age >= c.seconds * ((this.eliteCount + 1) / (4 + this.contract))
    ) {
      this.eliteCount++
      this.spawn(5, true)
      this.effect('text', p, 0xffb346, 1, undefined, '矿甲精英出现')
    }
    if (!this.bossId && this.age >= c.seconds) {
      this.bossId = this.spawn(6, false, 218).id
      this.effect('wave', p, 0xff8748, waveNames.length + 1)
      this.bossTimer = 2
    }
    const reach = this.hero === 2 ? 98 : 281
    if (p.fire <= 0 && !p.strike) {
      const enemy = this.nearby(p, reach)[0]
      if (enemy) {
        const windup = Math.min([0.085, 0.15, 0.22][this.hero], this.rate * 0.38)
        p.strike = this.strike(p, enemy, enemy.id, windup, Math.min(0.16, this.rate * 0.3))
        p.fire = this.rate
      }
    }
    if (p.strike) {
      const a = p.strike,
        elapsed = this.age - a.start
      if (!a.fired) {
        const current = this.enemies.find((e) => e.id === a.target && e.hp > 0)
        if (current) a.angle = Math.atan2(current.y - p.y, current.x - p.x)
      }
      p.face = Math.cos(a.angle) < 0 ? -1 : 1
      if (!a.fired && elapsed >= a.windup) {
        a.fired = true
        if (this.hero === 2) {
          this.effect('hammer', p, 0xffcb61, 70)
          const targets = this.nearby(p, 104)
          this.area(p, 104, this.damage, 0xffc168)
          for (const e of targets) {
            const d = Math.max(1, distance(p, e))
            e.x += ((e.x - p.x) * 17) / d
            e.y += ((e.y - p.y) * 17) / d
          }
          if (this.evolutions.has(Evo.fault)) this.projectile(p, a.angle, 9, this.damage * 0.8)
        } else this.shoot(p, a.angle, this.hero, this.damage)
      }
      if (elapsed >= a.windup + a.recovery) p.strike = null
    }
    for (const t of this.turrets) {
      t.life -= dt
      t.timer -= dt
      if (t.life <= 0) {
        this.wilt(t)
        continue
      }
      if (!t.strike && t.timer <= 0) {
        const e = this.nearby(t, 305)[0]
        if (e) {
          t.strike = this.strike(t, e, e.id, 0.09, 0.15)
          t.timer = 0.58
          t.face = e.x < t.x ? -1 : 1
        }
      }
      if (t.strike) {
        const a = t.strike,
          elapsed = this.age - a.start
        if (!a.fired && elapsed >= a.windup) {
          a.fired = true
          this.shoot(t, a.angle, 7, 20 * this.passivePower(0))
        }
        if (elapsed >= a.windup + a.recovery) t.strike = null
      }
    }
    this.turrets = this.turrets.filter((t) => t.life > 0)
    const traveling = this.shots.length
    for (let i = 0; i < traveling; i++) {
      const s = this.shots[i]
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
      for (const e of this.enemies) {
        if (
          s.pierce <= 0 ||
          e.hp <= 0 ||
          s.hit.includes(e.id) ||
          distance(s, e) > e.radius + (s.style === 9 ? 25 : 9)
        )
          continue
        this.hurt(e, s.damage)
        s.hit.push(e.id)
        s.pierce--
        if (s.style === 0 && s.hit.length === 1 && this.evolutions.has(Evo.fork)) {
          const angle = Math.atan2(s.vy, s.vx)
          for (const delta of [-0.53, 0.53])
            this.projectile(e, angle + delta, 8, s.damage * 0.68, [e.id])
        }
        if (s.style === 1) {
          if (this.evolutions.has(Evo.beacon) && ++this.beaconHits % 3 === 0) {
            this.zones.push({
              x: e.x,
              y: e.y,
              id: ++this.serial,
              type: 'beacon',
              life: 4,
              tick: 0,
              radius: 128,
            })
          }
          const other = this.nearby(e, 115).find((t) => t !== e)
          if (other) {
            this.effect('bolt', e, 0xcc8aff, 3, other)
            this.hurt(other, s.damage * 0.7)
          }
        }
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0 && s.pierce > 0)
    let dives = this.enemies.reduce((n, e) => n + Number(!!e.dive), 0)
    for (const e of this.enemies) {
      if (e.hp <= 0) continue
      e.slow -= dt
      e.moving = false
      if (e.frozenUntil > this.age) continue
      const dx = p.x - e.x,
        dy = p.y - e.y,
        d = Math.max(1, Math.hypot(dx, dy))
      if (
        e.type === 4 &&
        this.wave >= 2 &&
        !e.strike &&
        !e.dive &&
        this.age >= e.diveAt &&
        d > 60 &&
        d < 180 &&
        dives < 1 + this.contract + Math.floor(this.wave / 3)
      ) {
        const lead = length > 0.05 ? (0.25 * this.speed) / Math.max(length, 1) : 0
        e.dive = {
          angle: Math.atan2(dy + input.y * lead, dx + input.x * lead),
          start: this.age,
          range: Math.min(d + 25, 185),
          hit: false,
        }
        e.diveAt = this.age + 5.4 - this.contract * 0.45
        dives++
      }
      if (e.dive) {
        const dive = e.dive,
          t = this.age - dive.start
        e.face = Math.cos(dive.angle) < 0 ? -1 : 1
        if (t >= 0.5) {
          const travel =
            (Math.min(dt, Math.max(0, t - 0.5), Math.max(0, 0.82 - (t - dt))) * dive.range) / 0.32
          e.x = limit(e.x + Math.cos(dive.angle) * travel, 85, WORLD.w - 85)
          e.y = limit(e.y + Math.sin(dive.angle) * travel, 80, WORLD.h - 80)
          if (!dive.hit && distance(e, p) < 25) {
            dive.hit = true
            this.takeHit(12 * c.factor)
          }
        }
        if (t >= 0.82) {
          e.dive = null
          e.readyAt = this.age + 0.44
        }
        continue
      }
      if (e.type === 6) this.bossTimer -= dt
      if (!e.strike && e.type === 6 && this.bossTimer <= 0) {
        this.bossTimer = (e.hp < e.max * 0.45 ? 2.35 : 3.65) / (1 + 0.12 * this.contract)
        e.strike = this.strike(e, p, 0, 1, 0.25, 'slam')
        this.zones.push({
          x: p.x,
          y: p.y,
          id: ++this.serial,
          type: 'slam',
          owner: e.id,
          life: 1 + dt,
          radius: 80 + this.contract * 8,
          tick: 0,
        })
      }
      if (!e.strike && this.age >= e.readyAt && d < e.radius + 24) {
        const windup = e.type === 4 ? 0.13 : e.type === 5 ? 0.24 : 0.19
        e.strike = this.strike(e, p, 0, windup, 0.2)
        e.readyAt = this.age + windup + 0.52
      }
      if (e.strike) {
        const a = e.strike,
          elapsed = this.age - a.start
        e.face = Math.cos(a.angle) < 0 ? -1 : 1
        if (!a.fired && elapsed >= a.windup) {
          a.fired = true
          if (a.kind === 'basic' && d < e.radius + 28)
            this.takeHit((e.type === 6 ? 21 : e.type === 5 ? 13 : 8) * c.factor)
        }
        if (elapsed >= a.windup + a.recovery) e.strike = null
      } else {
        const before = { x: e.x, y: e.y }
        const step = e.speed * dt * (e.slow > 0 ? 0.35 : 1)
        if (d > e.radius + 4) {
          e.x += (dx / d) * step
          e.y += (dy / d) * step
        }
        if (Math.abs(dx) > 5) e.face = dx < 0 ? -1 : 1
        if (e.type !== 4) separate(e, e.radius * 0.5)
        const walked = distance(before, e)
        e.moving = walked > 0.01
        e.stride += walked / (e.type === 6 ? 10 : e.type === 4 ? 5 : 7)
      }
    }
    // Keep neighboring silhouettes separated without moving units faster through a crowd.
    for (let i = 0; i < this.enemies.length; i++)
      for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i],
          b = this.enemies[j],
          dx = a.x - b.x,
          dy = a.y - b.y,
          r = (a.radius + b.radius) * 0.8
        if (a.hp <= 0 || b.hp <= 0 || Math.abs(dx) >= r || Math.abs(dy) >= r) continue
        const d = Math.hypot(dx, dy) || 0.1,
          f = ((r - d) * 0.15) / d
        if (f > 0) {
          if (a.frozenUntil <= this.age) {
            a.x += dx * f
            a.y += dy * f
          }
          if (b.frozenUntil <= this.age) {
            b.x -= dx * f
            b.y -= dy * f
          }
        }
      }
    if (this.wave >= (this.contract === 0 ? 4 : 2)) {
      this.hazardTimer -= dt
      if (this.hazardTimer <= 0) {
        this.hazardTimer = 14 - this.contract * 2 - pressure * 4
        this.zones.push({
          x: p.x,
          y: p.y,
          id: ++this.serial,
          type: 'slam',
          life: Math.max(0.76, 1.1 - this.contract * 0.07 - pressure * 0.12),
          radius: this.contract === 2 ? 69 : 53,
          tick: 0,
        })
        if (this.contract >= 1 && this.wave >= 4) {
          const lead = length > 0.05 ? { x: input.x / length, y: input.y / length } : { x: p.face, y: 0 }
          this.zones.push({
            id: ++this.serial,
            type: 'slam',
            x: limit(p.x + lead.x * this.speed * 0.94, 80, WORLD.w - 80),
            y: limit(p.y + lead.y * this.speed * 0.94, 80, WORLD.h - 80),
            life: 1,
            radius: 57 + 8 * this.contract,
            tick: 0,
          })
        }
      }
    }
    const fragments: Zone[] = []
    for (const z of this.zones) {
      z.life -= dt
      z.tick -= dt
      if (z.type === 'beacon' && z.tick <= 0) {
        z.tick = 0.78
        const e = this.nearby(z, z.radius)[0]
        if (e) {
          this.effect('bolt', z, 0xac85ff, 4, e)
          this.hurt(e, this.damage * 0.58)
        }
      }
      if (z.type === 'echo' && z.life <= 0) this.lightning(z, z, 39 * this.passivePower(1), z.radius)
      if (z.type === 'storm' && this.evolutions.has(Evo.vortex)) {
        for (const e of this.nearby(z, z.radius + 22)) {
          const d = distance(e, z),
            pull = Math.min(d, dt * (e.type === 6 ? 25 : 112))
          if (d > 1) {
            e.x += ((z.x - e.x) * pull) / d
            e.y += ((z.y - e.y) * pull) / d
          }
        }
      }
      if (z.type === 'storm' && z.tick <= 0) {
        z.tick = 0.5
        this.area(z, z.radius, 12 * this.passivePower(4), 0xa5ff4f)
      }
      if (z.life <= 0 && z.type === 'meteor') {
        this.area(z, z.radius, 97 * this.passivePower(2), 0xff8035)
        this.effect('impact', z, 0, z.radius * 1.5)
        if (this.evolutions.has(Evo.cluster)) {
          for (let n = 0; n < 3; n++) {
            const angle = (n * Math.PI * 2) / 3 + 0.28
            fragments.push({
              x: limit(z.x + Math.cos(angle) * 85, 75, WORLD.w - 75),
              y: limit(z.y + Math.sin(angle) * 85, 75, WORLD.h - 75),
              id: ++this.serial,
              type: 'fragment',
              life: 0.34 + 0.1 * n,
              radius: 67,
              tick: 0,
            })
          }
        }
      }
      if (z.life <= 0 && z.type === 'fragment') {
        this.area(z, z.radius, 44 * this.passivePower(2), 0xffae42)
        this.effect('impact', z, 0, 85)
      }
      if (z.life <= 0 && z.type === 'slam') {
        this.effect('stomp', z, 0xff4736, z.radius)
        this.effect('ring', z, 0xff4736, z.radius)
        this.effect('impact', z, this.contract === 1 ? 1 : 0, z.radius * 1.2)
        if (distance(z, p) <= z.radius + 8) this.takeHit(30 * c.factor)
      }
    }
    this.zones = this.zones.filter((z) => z.life > 0).concat(fragments)
    this.enemies = this.enemies.filter((e) => e.hp > 0)
    this.collect(dt)
  }
}
