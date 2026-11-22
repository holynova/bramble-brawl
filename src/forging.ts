import { pathsFor, triggerMode } from './forge.ts'
import type { Battle, Enemy, Point } from './simulation.ts'

type Kind =
  | 'moon'
  | 'trail'
  | 'fire'
  | 'star'
  | 'plague'
  | 'bee'
  | 'tower'
  | 'mine'
  | 'frost'
  | 'beacon'
  | 'wire'
  | 'decoy'
  | 'sun'
  | 'lamp'
  | 'anchor'
  | 'drum'
export type Construct = Point & {
  id: number
  kind: Kind
  track: number
  rank: number
  age: number
  life: number
  tick: number
  power: number
  angle: number
  owner?: number
  child: boolean
  touched: Set<number>
  returning: boolean
}
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const heading = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x)
const offset = (a: Point, angle: number, r: number) => ({
  x: a.x + Math.cos(angle) * r,
  y: a.y + Math.sin(angle) * r,
})
const bound = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
export const deviceArt: Record<Kind, string> = {
  moon: 'kit-0',
  trail: '',
  fire: '',
  star: 'fx-2',
  plague: 'kit-2',
  bee: 'kit-3',
  tower: '',
  mine: 'kit-4',
  frost: '',
  beacon: 'evo-fx-0',
  wire: 'kit-5',
  decoy: 'relic-0',
  sun: 'relic-1',
  lamp: 'relic-2',
  anchor: 'relic-3',
  drum: 'relic-5',
}
export class Foundry {
  readonly battle: Battle
  paths = new Map<number, number>()
  constructs: Construct[] = []
  private charges = new Map<number, number>()
  private nextWeapon = 0
  private nextGuard = 0
  constructor(battle: Battle) {
    this.battle = battle
  }
  private put(
    kind: Kind,
    at: Point,
    track: number,
    rank: number,
    power: number,
    life: number,
    angle = 0,
    child = false,
  ) {
    const d: Construct = {
      id: ++this.battle.serial,
      kind,
      x: at.x,
      y: at.y,
      track,
      rank,
      power,
      life,
      angle,
      age: 0,
      tick: 0,
      returning: false,
      child,
      touched: new Set(),
    }
    this.constructs.push(d)
    return d
  }
  side(track: number) {
    const path = this.paths.get(track)
    return path === undefined ? -1 : pathsFor(this.battle.hero, track).indexOf(path)
  }
  chargePassives(walked: number, dt: number, killed = false) {
    const b = this.battle
    for (const key of b.deck) {
      const track = key + 1,
        path = this.paths.get(track)
      if (path === undefined) continue
      const cd = b.passiveTimers[key]
      if (cd <= 0 || cd > b.passiveCooldown(key) * 0.5) {
        this.charges.delete(track)
        continue
      }
      const mode = triggerMode(path)
      if (killed && mode !== 'kill') continue
      let charge = this.charges.get(track) ?? 0
      if (mode === 'step') charge += walked / 145
      if (mode === 'still') charge = walked > 0.04 ? 0 : charge + dt / 1.3
      if (mode === 'kill' && killed) charge += 0.5
      if (charge >= 1) {
        b.passiveTimers[key] = 0
        this.charges.delete(track)
      } else this.charges.set(track, charge)
    }
  }
  remove(track: number) {
    this.charges.delete(track)
    this.paths.delete(track)
    this.constructs = this.constructs.filter((d) => d.track !== track)
  }
  private freeze(e: Enemy, seconds: number) {
    const b = this.battle
    e.slow = Math.max(2, e.slow)
    e.frozenUntil = Math.max(e.frozenUntil, b.age + seconds * (e.type === 6 ? 0.24 : 1))
    e.dive = null
    if (e.strike?.kind === 'slam') b.zones = b.zones.filter((z) => z.owner !== e.id)
    e.strike = null
  }
  private moveEnemy(e: Enemy, at: Point, amount: number) {
    const r = Math.max(1, dist(e, at))
    const step = amount < 0 ? -Math.min(-amount, r) : amount
    e.x = bound(e.x + ((e.x - at.x) / r) * step, 86, 1274)
    e.y = bound(e.y + ((e.y - at.y) / r) * step, 80, 1000)
    if (e.type !== 6) e.dive = null
  }
  private charge(track: number, seconds: number) {
    const b = this.battle,
      keys = b.deck.filter((k) => k + 1 !== track)
    const key = keys.sort((a, c) => b.passiveTimers[c] - b.passiveTimers[a])[0]
    if (key !== undefined) b.passiveTimers[key] = Math.max(0, b.passiveTimers[key] - seconds)
  }
  private infect(e: Enemy, track: number, rank: number, power: number) {
    if (
      this.constructs.some(
        (d) => d.kind === 'plague' && d.track === track && d.owner === e.id && d.life > 0,
      )
    )
      return
    const mark = this.put('plague', e, track, rank, power, 4.4)
    mark.owner = e.id
    mark.tick = 0.55
  }
  onDeath(e: Enemy) {
    const b = this.battle
    this.chargePassives(0, 0, true)
    for (const d of this.constructs.filter((v) => v.kind === 'plague' && v.owner === e.id && v.life > 0)) {
      d.life = 0
      if (d.rank < 4) continue
      const targets = b
        .nearby(e, 130)
        .filter(
          (v) =>
            !this.constructs.some(
              (n) => n.kind === 'plague' && n.track === d.track && n.owner === v.id && n.life > 0,
            ),
        )
      for (const next of targets.slice(0, d.rank === 5 ? 2 : 1)) {
        this.infect(next, d.track, d.rank, d.power)
        b.effect('bolt', e, 0xea81df, 2, next)
      }
      if (d.rank === 5) b.area(e, 48, d.power * 0.88, 0xe290db)
    }
  }
  selectTarget(track: number, near: Enemy[]) {
    const path = this.paths.get(track)
    if (track === 0 && this.battle.hero === 1 && this.side(0) === 0) return near.at(-1)
    if (path === 5) return near.slice().sort((a, b) => a.hp / a.max - b.hp / b.max)[0]
    if (path === 3 || path === 11)
      return near
        .slice(0, 8)
        .sort(
          (a, b) => near.filter((e) => dist(e, b) < 76).length - near.filter((e) => dist(e, a) < 76).length,
        )[0]
    if (path === 4)
      return (
        near.find(
          (e) => !this.constructs.some((d) => d.kind === 'plague' && d.owner === e.id && d.track === track),
        ) ?? near[0]
      )
    return near[0]
  }
  onUse(track: number, aim: Point, angle: number) {
    const path = this.paths.get(track),
      b = this.battle,
      p = b.player
    if (path === undefined || (!track && b.age < this.nextWeapon)) return
    if (!track) this.nextWeapon = b.age + 2.8
    const rank = track ? b.passiveRanks[track - 1] : b.weaponRank
    const power = track ? 18 * b.passivePower(track - 1) : b.damage * 0.51
    const make = (kind: Kind, at: Point, time: number, a = angle, child = false) =>
      this.put(kind, at, track, rank, power, time, a, child)
    const shoot = (at: Point, a: number) => {
      for (const delta of [-0.34, 0, 0.34]) b.projectile(at, a + delta, 13, power * 0.72)
    }
    switch (path) {
      case 0: {
        shoot(p, angle)
        if (rank >= 4) {
          const flank = offset(aim, angle + Math.PI / 2, 79)
          shoot(flank, heading(flank, aim))
        }
        if (rank === 5) {
          const flank = offset(aim, angle - Math.PI / 2, 79)
          shoot(flank, heading(flank, aim))
        }
        break
      }
      case 1:
        for (const side of rank === 5 ? [-0.34, 0.34] : [0]) make('moon', p, 2.1, angle + side)
        break
      case 2:
        make('trail', p, 2.8)
        break
      case 3:
        make('star', aim, 0.65)
        break
      case 4: {
        const e = this.selectTarget(track, b.nearby(aim, 180))
        if (e) this.infect(e, track, rank, power * 0.48)
        break
      }
      case 5: {
        const enemies = b
          .nearby(aim, 220)
          .sort((a, c) => a.hp / a.max - c.hp / c.max)
          .slice(0, rank === 5 ? 2 : 1)
        for (const e of enemies) {
          b.effect('bolt', p, 0xf76eab, 3, e)
          if (rank >= 4) this.freeze(e, 0.5)
          b.hurt(e, power * 1.18)
          if (rank === 5 && p.hp >= p.max) p.shield = Math.max(p.shield, 0.85)
          p.hp = Math.min(p.max, p.hp + 3)
        }
        break
      }
      case 6:
        for (const a of rank === 5 ? [angle, angle + Math.PI] : [angle]) make('bee', p, 3.4, a)
        break
      case 7:
        make('tower', p, 3.7)
        break
      case 8:
        make('mine', aim, 5.8)
        break
      case 9: {
        const victims = this.frostRing(p, power, rank)
        if (rank === 5 && victims[0]) make('frost', victims[0], 0.65)
        break
      }
      case 10: {
        const hit = new Set<number>()
        let at: Point = aim,
          from: Point = p
        for (let n = 0; n < 3; n++) {
          const e = b.nearby(at, n ? 135 : 190).find((v) => !hit.has(v.id))
          if (!e) break
          hit.add(e.id)
          b.effect('bolt', from, 0xb995ff, 3, e)
          b.hurt(e, power)
          from = at = e
        }
        if (rank >= 4 && hit.size === 3) this.charge(track, 1.4)
        if (rank === 5 && hit.size) make('beacon', at, 3.0)
        break
      }
      case 11:
        make('wire', aim, 3.3, angle + Math.PI / 2)
        if (rank === 5) make('wire', aim, 3.3, angle)
        break
    }
  }
  private frostRing(at: Point, power: number, rank: number) {
    const b = this.battle,
      victims = b.nearby(at, 105)
    for (const e of victims) {
      if (rank >= 4 && e.slow > 0) this.freeze(e, 1)
      e.slow = Math.max(e.slow, 2.6)
    }
    b.area(at, 105, power, 0x91e7ff)
    return victims
  }
  relic(key: number, aim: Point, power: number) {
    const b = this.battle,
      p = b.player,
      track = key + 1,
      rank = b.passiveRanks[key],
      evolved = rank >= 2
    const make = (kind: Kind, at: Point, life: number, a = 0) =>
      this.put(kind, at, track, rank, power, life, a)
    const a = heading(p, aim)
    switch (key) {
      case 12:
        for (const side of evolved ? [-32, 32] : [0]) make('decoy', offset(p, a + Math.PI / 2, side), 5.2)
        break
      case 13:
        make('sun', p, 3.6)
        break
      case 14:
        make('lamp', aim, 3.4)
        break
      case 15:
        make('anchor', aim, 2.2)
        break
      case 16:
        for (const delta of [-0.33, 0, 0.33]) b.projectile(p, a + delta, evolved ? 19 : 18, power * 39)
        break
      case 17:
        make('drum', p, evolved ? 1.25 : 0.3)
        break
    }
  }
  onShot(style: number, e: Enemy, angle: number, first: boolean, power: number) {
    const b = this.battle
    if (style === 18 || style === 19 || style === 20) {
      e.slow = Math.max(2.7, e.slow)
      if (style === 19 && first) b.projectile(e, angle + Math.PI, 20, power * 0.7, [e.id])
    }
    if (style === 16 && first)
      for (const off of [-0.85, 0.85]) b.projectile(e, angle + off, 17, power * 0.65, [e.id])
  }
  private advance(d: Construct, dt: number) {
    const b = this.battle,
      p = b.player
    const pulse = d.tick <= 0,
      expiring = d.age >= d.life
    const child = (kind: Kind, at: Point, life: number, a = d.angle) =>
      this.put(kind, at, d.track, d.rank, d.power, life, a, true)
    switch (d.kind) {
      case 'moon': {
        const hold = d.rank >= 4 ? 0.52 : 0
        if (d.age < 0.37) {
          const q = offset(d, d.angle, 460 * dt)
          Object.assign(d, q)
        } else if (d.age >= 0.37 + hold) {
          if (!d.returning) {
            d.returning = true
            d.touched.clear()
          }
          if (dist(d, p) < 18) {
            d.life = 0
            break
          }
          Object.assign(d, offset(d, heading(d, p), 485 * dt))
        } else if (pulse) {
          d.tick = 0.22
          d.touched.clear()
        }
        for (const e of b.nearby(d, 29))
          if (!d.touched.has(e.id)) {
            d.touched.add(e.id)
            b.hurt(e, d.power)
          }
        break
      }
      case 'trail':
        if (dist(d, p) >= 36) {
          const a = heading(d, p) + Math.PI / 2
          for (const side of d.rank === 5 ? [-35, 0, 35] : [0]) child('fire', offset(p, a, side), 2.3)
          d.x = p.x
          d.y = p.y
        }
        break
      case 'fire':
      case 'sun': {
        const sun = d.kind === 'sun'
        if (sun) {
          d.x = p.x
          d.y = p.y
        }
        if (pulse) {
          d.tick = 0.55
          const r = sun ? 79 : 43
          for (const e of b.nearby(d, r)) {
            b.arsenal.scorched(e)
            b.hurt(e, d.power * (sun ? 18 : 0.54))
          }
          b.effect('ring', d, 0xffa752, r)
        }
        if (expiring && sun && d.rank >= 2) {
          const fire = child('fire', d, 2.5)
          fire.power = d.power * 22
        }
        if (expiring && !sun && d.rank >= 4) {
          b.area(d, 64, d.power * 0.9, 0xff953e)
        }
        break
      }
      case 'star': {
        if (d.rank >= 4 && !d.child)
          for (const e of b.nearby(d, 94)) this.moveEnemy(e, d, -dt * (e.type === 6 ? 15 : 76))
        if (expiring) {
          b.area(d, 69, d.power * 1.7, 0xffa553)
          b.effect('impact', d, 0, 77)
          if (d.rank === 5 && !d.child) for (const e of b.nearby(d, 190).slice(0, 2)) child('star', e, 0.42)
        }
        break
      }
      case 'plague': {
        const host = b.enemies.find((e) => e.id === d.owner && e.hp > 0)
        if (!host) {
          d.life = 0
          break
        }
        d.x = host.x
        d.y = host.y
        if (pulse) {
          d.tick = 0.74
          b.hurt(host, d.power)
        }
        break
      }
      case 'decoy':
      case 'bee':
      case 'tower':
      case 'beacon': {
        const bee = d.kind === 'bee',
          tower = d.kind === 'tower'
        if (bee) {
          Object.assign(d, offset(p, d.angle + d.age * 2.25, 56))
        }
        if (tower && d.rank === 5 && dist(d, p) > 49) Object.assign(d, offset(d, heading(d, p), 82 * dt))
        if (tower && d.rank >= 4 && dist(d, p) < 82 && b.age >= this.nextGuard) {
          this.nextGuard = b.age + 4.5
          p.shield = Math.max(p.shield, 0.9)
          b.effect('guard', p, 0xffd558, 30)
        }
        if (pulse) {
          const e = b.nearby(d, d.kind === 'beacon' ? 138 : 265)[0]
          if (e) {
            d.tick = bee ? 0.73 : 0.82
            if (d.kind === 'beacon') {
              b.effect('bolt', d, 0xbfa1ff, 3, e)
              b.hurt(e, d.power * 0.7)
            } else
              b.shoot(
                d,
                heading(d, e),
                bee && d.rank >= 4 ? 16 : 12,
                d.kind === 'decoy' ? d.power * 20 : d.power * 0.66,
              )
          }
        }
        if (expiring && d.rank === 5) {
          if (bee) {
            const e = b.nearby(d, 190)[0]
            if (e) {
              b.effect('slash', d, 0xffd444, 1, e)
              b.area(e, 49, d.power * 1.5, 0xffd444)
            }
          }
          if (tower) {
            b.effect('ring', d, 0xffcf65, 90)
            for (const e of b.nearby(d, 90)) this.moveEnemy(e, d, 39)
          }
        }
        break
      }
      case 'mine':
        if (d.age > 0.36 && b.nearby(d, d.child ? 40 : 50).length) {
          for (const e of b.nearby(d, 72)) {
            if (d.rank >= 4) this.freeze(e, 0.85)
            else e.slow = Math.max(e.slow, 2)
          }
          b.area(d, 72, d.power * 1.8, 0x8fe6ff)
          d.life = 0
          if (d.rank === 5 && !d.child)
            for (const side of [-50, 50]) child('mine', offset(d, d.angle + Math.PI / 2, side), 4)
        }
        break
      case 'frost':
        if (expiring) this.frostRing(d, d.power, 4)
        break
      case 'wire':
        if (pulse) {
          d.tick = 0.48
          const dx = Math.cos(d.angle),
            dy = Math.sin(d.angle)
          for (const e of b.nearby(d, 105)) {
            const proj = bound((e.x - d.x) * dx + (e.y - d.y) * dy, -82, 82)
            if (dist(e, { x: d.x + dx * proj, y: d.y + dy * proj }) > e.radius + 12) continue
            b.effect('bolt', d, 0xb3b5ff, 2, e)
            b.hurt(e, d.power * 0.63)
            if (d.rank >= 4) this.moveEnemy(e, d, -22)
          }
        }
        break
      case 'lamp':
        if (pulse) {
          d.tick = 0.75
          const e = b.nearby(d, 152)[0]
          if (e) {
            b.effect('bolt', d, 0xed83da, 2, e)
            b.hurt(e, 24 * d.power)
            if (d.rank >= 2) p.hp = Math.min(p.max, p.hp + 3)
          }
          for (const drop of b.drops)
            if (drop.type === 0 && dist(d, drop) < 150) {
              Object.assign(drop, offset(p, heading(p, drop), Math.min(18, dist(p, drop))))
            }
        }
        break
      case 'anchor':
        for (const e of b.nearby(d, 110)) {
          this.moveEnemy(e, d, expiring && d.rank >= 2 ? 58 : -dt * (e.type === 6 ? 18 : 92))
          if (expiring) b.hurt(e, d.power * 43)
        }
        break
      case 'drum':
        if (pulse) {
          d.tick = 0.86
          b.effect('ring', d, 0xc9a3ff, 103)
          for (const e of b.nearby(d, 103)) {
            this.moveEnemy(e, d, 43)
            b.hurt(e, d.power * 19)
          }
          this.charge(d.track, 1.35)
        }
        break
    }
  }
  step(dt: number) {
    const length = this.constructs.length
    for (let i = 0; i < length; i++) {
      const d = this.constructs[i]
      if (d.life <= 0) continue
      d.age += dt
      d.tick -= dt
      this.advance(d, dt)
    }
    this.constructs = this.constructs.filter((d) => d.life > d.age)
  }
}
