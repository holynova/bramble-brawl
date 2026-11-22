import { activeTraditions, traditions } from './builds.ts'
import type { School } from './builds.ts'
import { Evo } from './data.ts'
import type { Battle, Enemy, Point } from './simulation.ts'

type DeviceKind =
  | 'moon'
  | 'flask'
  | 'pool'
  | 'trail'
  | 'ember'
  | 'orbit'
  | 'bee'
  | 'mine'
  | 'fence'
  | 'sentry'
export type Device = Point & {
  id: number
  kind: DeviceKind
  age: number
  duration: number
  power: number
  radius: number
  angle: number
  origin?: Point
  tick: number
  variant: boolean
}
type Moon = Device & { contacts: Set<number>; returning: boolean }
type Mark = { until: number; tick: number; power: number }
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const angleTo = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x)
const palettes: Record<School, number> = {
  wind: 0x69ead2,
  fire: 0xff9a46,
  hex: 0xf18ad9,
  fort: 0xffda63,
  frost: 0x88e4ff,
  arc: 0xbb99ff,
}

export class Arsenal {
  mastery?: School
  readonly battle: Battle
  readonly schools: Set<School>
  readonly triggers: Record<School, number> = { wind: 0, fire: 0, hex: 0, fort: 0, frost: 0, arc: 0 }
  devices: Device[] = []
  marks = new Map<number, Mark>()
  private burned = new Map<number, number>()
  private windTravel = 0
  private stillTime = 0
  private nextFort = 0
  private nextHex = 0
  private nextFire = 0
  private nextFrost = 0
  private casts = 0
  constructor(battle: Battle) {
    this.battle = battle
    this.schools = new Set(activeTraditions(battle.hero, battle.deck).map((t) => t.key))
  }
  private signal(key: School, at: Point) {
    this.triggers[key]++
    this.battle.effect('crest', at, palettes[key], 23)
    if (this.triggers[key] === 1) {
      const name = traditions.find((t) => t.key === key)?.name
      this.battle.effect('text', this.battle.player, palettes[key], 1, undefined, name)
    }
  }
  private device(
    kind: DeviceKind,
    at: Point,
    duration: number,
    power: number,
    radius: number,
    angle = 0,
    variant = false,
  ) {
    const device: Device = {
      id: ++this.battle.serial,
      kind,
      x: at.x,
      y: at.y,
      age: 0,
      duration,
      power,
      radius,
      angle,
      tick: 0,
      variant,
    }
    this.devices.push(device)
    return device
  }
  moved(walked: number, dt: number) {
    if (this.schools.has('wind')) this.windTravel = Math.min(180, this.windTravel + walked)
    if (this.schools.has('fort')) {
      this.stillTime = walked > 0.02 ? 0 : this.stillTime + dt
      if (this.stillTime >= 1.2 && this.battle.age >= this.nextFort) {
        this.nextFort = this.battle.age + 8
        this.device('sentry', this.battle.player, 4.5, 12 * this.battle.spellPower, 250)
        if (this.mastery === 'fort') this.battle.player.shield = Math.max(1.5, this.battle.player.shield)
        this.signal('fort', this.battle.player)
      }
    }
  }
  onWeaponFired(angle: number) {
    if (this.windTravel < 180) return
    this.windTravel = 0
    const b = this.battle
    this.signal('wind', b.player)
    for (const offset of this.mastery === 'wind' ? [-0.38, 0, 0.38] : [0])
      b.projectile(b.player, angle + offset, 13, b.damage * 0.56)
  }
  onWeaponHit(e: Enemy) {
    const b = this.battle
    if (this.schools.has('frost') && b.age >= this.nextFrost && (e.slow > 0 || e.frozenUntil > b.age)) {
      this.nextFrost = b.age + 1.5
      this.signal('frost', e)
      if (this.mastery === 'frost') {
        for (const target of b.nearby(e, 68)) this.freezeTarget(target, target.type === 6 ? 0.23 : 0.78)
      }
      b.area(e, 68, b.damage * 0.53, palettes.frost)
    }
  }
  scorched(e: Enemy) {
    if (this.schools.has('fire')) this.burned.set(e.id, this.battle.age + 1.25)
  }
  onDeath(e: Enemy) {
    const b = this.battle,
      mark = this.marks.get(e.id)
    this.marks.delete(e.id)
    if ((this.burned.get(e.id) ?? -1) >= b.age && b.age >= this.nextFire) {
      this.nextFire = b.age + 2
      this.signal('fire', e)
      this.device('ember', e, 2.25, 9 * b.spellPower, 45)
      const next = this.mastery === 'fire' && b.nearby(e, 165)[0]
      if (next) {
        b.effect('bolt', e, palettes.fire, 2, next)
        this.device('ember', next, 2.25, 9 * b.spellPower, 45)
      }
    }
    this.burned.delete(e.id)
    if (!mark || mark.until < b.age) return
    const next = b.nearby(e, 170)
    if (b.evolutions.has(Evo.plague)) {
      const victim = next.find((t) => !this.marks.has(t.id))
      if (victim) {
        this.mark(victim, mark.power)
        b.effect('bolt', e, palettes.hex, 1, victim)
      }
    }
    if (this.schools.has('hex') && b.age >= this.nextHex) {
      this.nextHex = b.age + 2
      this.signal('hex', e)
      b.player.hp = Math.min(b.player.max, b.player.hp + 5)
      b.effect('bolt', e, palettes.hex, 1, b.player)
      for (const enemy of next.slice(0, this.mastery === 'hex' ? 2 : 1)) {
        b.effect('bolt', e, palettes.hex, 1, enemy)
        b.hurt(enemy, 20 * b.spellPower)
      }
    }
  }
  onPassive() {
    if (!this.schools.has('arc') || ++this.casts % 3) return
    const b = this.battle,
      hit = new Set<number>()
    let from: Point = b.player
    for (let n = 0; n < 3; n++) {
      const target = b.nearby(from, n ? 150 : 310).find((e) => !hit.has(e.id))
      if (!target) break
      if (!n) this.signal('arc', from)
      hit.add(target.id)
      b.effect('bolt', from, palettes.arc, 4, target)
      b.hurt(target, (30 - n * 4) * b.spellPower)
      from = target
    }
    if (hit.size === 3 && this.mastery === 'arc') {
      const key = b.deck.reduce((best, k) => (b.passiveTimers[k] > b.passiveTimers[best] ? k : best))
      b.passiveTimers[key] = Math.max(0, b.passiveTimers[key] - 2)
    }
  }
  weaponTarget(reach: number) {
    const targets = this.battle.nearby(this.battle.player, reach)
    if (this.battle.hero !== 5) return targets[0]
    return targets.reduce<Enemy | undefined>(
      (best, e) => (!best || e.hp / e.max < best.hp / best.max ? e : best),
      undefined,
    )
  }
  private mark(e: Enemy, power: number) {
    const previous = this.marks.get(e.id)
    this.marks.set(e.id, {
      until: this.battle.age + 6,
      tick: previous?.tick ?? 0.65,
      power: Math.max(power, previous?.power ?? 0),
    })
  }
  newWeapon(target: Enemy | undefined, angle: number) {
    const b = this.battle,
      p = b.player
    b.effect('shot', p, [palettes.wind, palettes.fire, palettes.hex][b.hero - 3], b.hero)
    if (b.hero === 3) {
      for (const offset of b.evolutions.has(Evo.moon) ? [-0.29, 0.29] : [0]) {
        const d = this.device('moon', p, 1.65, b.damage, 12, angle + offset)
        Object.assign(d, { contacts: new Set<number>(), returning: false })
      }
    } else if (target && b.hero === 4) {
      this.device('flask', target, 0.36, b.damage, 59, angle).origin = { x: p.x, y: p.y }
    } else if (target && b.hero === 5) {
      this.mark(target, b.damage * 0.16)
      b.effect('slash', p, palettes.hex, 1, target)
      b.hurt(target, b.damage * (target.hp / target.max <= 0.3 ? 1.75 : 1))
      this.onWeaponHit(target)
      if (target.hp <= 0 && b.evolutions.has(Evo.reaper)) {
        const next = b.nearby(target, 190).sort((a, c) => a.hp / a.max - c.hp / c.max)[0]
        if (next) {
          b.effect('slash', target, 0xffbfdc, 1, next)
          this.mark(next, b.damage * 0.16)
          b.hurt(next, b.damage * 0.9)
        }
      }
    }
  }
  newPassive(key: number, aim: Point, power: number) {
    const b = this.battle,
      p = b.player
    switch (key) {
      case 6:
        for (const angle of [0, Math.PI]) this.device('orbit', p, 4.2, 28 * power, 66, angle)
        if (b.evolutions.has(Evo.orbit))
          for (const angle of [0, Math.PI]) this.device('orbit', p, 4.2, 23 * power, 107, angle, true)
        break
      case 7:
        this.device('trail', p, 4.4, 13 * power, 31, 0, b.evolutions.has(Evo.rekindle))
        break
      case 8:
        for (const e of b.nearby(aim, 170).slice(0, 3)) {
          this.mark(e, 14 * power)
          b.effect('bolt', p, palettes.hex, 2, e)
        }
        break
      case 9:
        this.device('bee', p, 8, 18 * power, 56)
        if (b.evolutions.has(Evo.flight))
          this.device('bee', p, 8, 18 * power, 62, Math.PI, true).tick = 0.31
        break
      case 10:
        this.device('mine', p, 11, 71 * power, 82)
        break
      case 11:
        const angle = angleTo(p, aim)
        this.device(
          'fence',
          { x: p.x + 69 * Math.cos(angle), y: p.y + 69 * Math.sin(angle) },
          5.3,
          23 * power,
          92,
          angle + Math.PI / 2,
        )
        break
    }
  }
  private burnCircle(d: Device, power: number, radius: number, weapon = false) {
    const b = this.battle
    b.effect('ring', d, palettes.fire, radius)
    for (const e of b.nearby(d, radius)) {
      this.scorched(e)
      b.hurt(e, power)
      if (weapon) this.onWeaponHit(e)
    }
  }
  private freezeTarget(e: Enemy, duration: number) {
    const b = this.battle
    e.frozenUntil = Math.max(e.frozenUntil, b.age + duration)
    e.dive = null
    if (e.strike?.kind === 'slam') b.zones = b.zones.filter((z) => z.owner !== e.id)
    e.strike = null
  }
  private freeze(d: Device) {
    const b = this.battle
    b.effect('impact', d, 2, d.radius * 1.4)
    for (const e of b.nearby(d, d.radius)) {
      e.slow = Math.max(e.slow, 2)
      this.freezeTarget(e, e.type === 6 ? 0.35 : 1.25)
      b.hurt(e, d.power)
    }
    if (!d.variant && b.evolutions.has(Evo.ridge)) {
      for (const dx of [-57, 57])
        this.device('mine', { x: d.x + dx, y: d.y }, 5.5, d.power * 0.64, 57, 0, true)
    }
    d.duration = 0
  }
  private advance(d: Device, dt: number) {
    const b = this.battle,
      p = b.player
    d.age += dt
    d.tick -= dt
    switch (d.kind) {
      case 'moon': {
        const moon = d as Moon
        if (!moon.returning && d.age >= 0.56) {
          moon.returning = true
          moon.contacts.clear()
        }
        if (moon.returning) {
          d.angle = angleTo(d, p)
          if (dist(d, p) <= 19) {
            d.duration = 0
            break
          }
        }
        const speed = moon.returning ? 540 : 490
        d.x += Math.cos(d.angle) * speed * dt
        d.y += Math.sin(d.angle) * speed * dt
        for (const e of b.enemies) {
          if (e.hp <= 0 || moon.contacts.has(e.id) || dist(d, e) > d.radius + e.radius) continue
          moon.contacts.add(e.id)
          b.hurt(e, d.power)
          this.onWeaponHit(e)
        }
        break
      }
      case 'flask':
        if (d.age >= d.duration) {
          this.burnCircle(d, d.power, d.radius, true)
          b.effect('impact', d, 0, 72)
          this.device('pool', d, 2.4, d.power * 0.29, 53, 0, b.evolutions.has(Evo.crucible))
        }
        break
      case 'pool':
      case 'ember':
        if (d.tick <= 0) {
          d.tick = 0.58
          this.burnCircle(d, d.power, d.radius)
        }
        if (d.age >= d.duration && d.variant) {
          this.burnCircle(d, d.power * 3, d.radius * 1.85)
          b.effect('impact', d, 0, d.radius * 1.8)
        }
        break
      case 'trail':
        if (dist(d, p) >= 32) {
          this.device('ember', p, 2.6, d.power, d.radius, 0, d.variant)
          d.x = p.x
          d.y = p.y
        }
        break
      case 'orbit':
      case 'bee': {
        const angle = d.angle + d.age * (d.kind === 'bee' ? 2.25 : d.variant ? -3.8 : 4.8)
        d.x = p.x + Math.cos(angle) * d.radius
        d.y = p.y + Math.sin(angle) * d.radius
        if (d.tick > 0) break
        if (d.kind === 'orbit') {
          d.tick = 0.19
          for (const e of b.nearby(d, 27)) b.hurt(e, d.power)
        } else {
          const enemy = b.nearby(d, 285)[0]
          if (enemy) {
            d.tick = 0.7
            b.shoot(d, angleTo(d, enemy), 12, d.power)
          }
        }
        break
      }
      case 'mine':
        if (d.age > 0.48 && b.nearby(d, d.variant ? 38 : 47).length) this.freeze(d)
        break
      case 'fence': {
        if (d.tick > 0) break
        d.tick = 0.48
        const dx = Math.cos(d.angle),
          dy = Math.sin(d.angle)
        const crossing = b.nearby(d, d.radius + 28).filter((e) => {
          const along = Math.max(-d.radius, Math.min(d.radius, (e.x - d.x) * dx + (e.y - d.y) * dy))
          return Math.hypot(e.x - d.x - along * dx, e.y - d.y - along * dy) < 14 + e.radius
        })
        for (const e of crossing) {
          b.effect('bolt', d, palettes.arc, 2, e)
          b.hurt(e, d.power)
        }
        if (crossing.length && b.evolutions.has(Evo.overload)) {
          const from = crossing[0],
            next = b.nearby(from, 140).find((e) => !crossing.includes(e))
          if (next) {
            b.effect('bolt', from, 0x87e8ff, 3, next)
            b.hurt(next, d.power * 1.2)
          }
        }
        break
      }
      case 'sentry':
        if (d.tick <= 0) {
          const e = b.nearby(d, d.radius)[0]
          if (e) {
            d.tick = 0.78
            b.shoot(d, angleTo(d, e), 7, d.power)
          }
        }
        break
    }
  }
  step(dt: number) {
    const b = this.battle
    for (const [id, mark] of this.marks) {
      if (mark.until < b.age) {
        this.marks.delete(id)
        continue
      }
      mark.tick -= dt
      if (mark.tick > 0) continue
      const target = b.enemies.find((e) => e.id === id && e.hp > 0)
      if (target) {
        mark.tick = 0.9
        b.hurt(target, mark.power)
      } else this.marks.delete(id)
    }
    // New effects begin on the next combat step, including descendants created by deaths.
    const count = this.devices.length
    for (let n = 0; n < count; n++) this.advance(this.devices[n], dt)
    this.devices = this.devices.filter((d) => d.age < d.duration)
  }
}
