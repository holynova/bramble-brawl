import { deviceArt } from './forging.ts'
import Phaser from 'phaser'
import { FRAME_SIZE, FOOTLINE, unitFrame, defeatFrame } from './poses.ts'
import { art, Evo } from './data.ts'
import { Battle, props, WORLD } from './simulation.ts'
import type { Point, Fx } from './simulation.ts'
import { actorTexture } from './builds.ts'
import { sound, weaponSounds } from './audio.ts'

type Hooks = {
  ready: () => void
  update: () => void
  wave: (n: number) => void
  hurt: () => void
  complete: () => void
  fault: () => void
}
type Ink = { fx: Fx; left: number; duration: number; angle: number }
export function mountBattle(root: HTMLElement, sim: Battle, hooks: Hooks, motion: boolean) {
  let paused = false,
    ready = false,
    scene: Arena | undefined,
    drag: number | null = null,
    origin: Point = { x: 0, y: 0 },
    stick: Point = { x: 0, y: 0 }
  const keys = new Set<string>(),
    controller = new AbortController(),
    opts = { signal: controller.signal }
  const pad = document.querySelector<HTMLElement>('#stick')!,
    nub = pad.firstElementChild as HTMLElement
  const resetStick = () => {
    drag = null
    stick = { x: 0, y: 0 }
    pad.hidden = true
    nub.style.transform = ''
  }
  const clearInput = () => {
    keys.clear()
    resetStick()
  }
  root.addEventListener(
    'pointerdown',
    (e) => {
      if (paused || !ready || sim.phase !== 'play' || drag !== null) return
      e.preventDefault()
      root.setPointerCapture(e.pointerId)
      drag = e.pointerId
      origin = { x: e.clientX, y: e.clientY }
      pad.style.left = origin.x + 'px'
      pad.style.top = origin.y + 'px'
      pad.hidden = false
    },
    opts,
  )
  root.addEventListener(
    'pointermove',
    (e) => {
      if (drag !== e.pointerId) return
      const dx = e.clientX - origin.x,
        dy = e.clientY - origin.y,
        d = Math.max(38, Math.hypot(dx, dy))
      stick = { x: dx / d, y: dy / d }
      nub.style.transform = 'translate(' + stick.x * 27 + 'px,' + stick.y * 27 + 'px)'
    },
    opts,
  )
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    root.addEventListener(
      event,
      (e) => {
        if ((e as PointerEvent).pointerId === drag) resetStick()
      },
      opts,
    )
  const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'KeyA', 'KeyD']
  window.addEventListener(
    'keydown',
    (e) => {
      if (!paused && sim.phase === 'play' && arrows.includes(e.code)) {
        e.preventDefault()
        keys.add(e.code)
      }
    },
    opts,
  )
  window.addEventListener('keyup', (e) => keys.delete(e.code), opts)
  window.addEventListener('blur', clearInput, opts)
  class Arena extends Phaser.Scene {
    items = new Map<string, Phaser.GameObjects.Image>()
    markers!: Phaser.GameObjects.Graphics
    effects!: Phaser.GameObjects.Graphics
    shadows!: Phaser.GameObjects.Graphics
    ink: Ink[] = []
    hudTick = 0
    ending = 0
    complete = false
    failed = false
    hitStop = 0
    nextNumber = 0
    nextRecoil = 0
    lastGem = 0
    preload() {
      this.load.on('loaderror', () => {
        this.failed = true
      })
      const terrain = ['quarry', 'crystal', 'foundry'][sim.contract]
      this.load.image('arena', art(terrain))
      const manifest = [
        'nova-wave',
        ...Array.from({length:6},(_,i)=>'relic-'+i),
        ...Array.from({ length: 6 }, (_, i) => 'kit-' + i),
        ...Array.from({ length: 6 }, (_, i) => 'fx-' + i),
        ...Array.from({ length: 6 }, (_, i) => 'evo-fx-' + i),
        ...Array.from({ length: 4 }, (_, i) => 'prop-' + i),
        ...Array.from({ length: 4 }, (_, i) => 'loot-' + i),
      ]
      for (const texture of [actorTexture(sim.hero), 'anim-3', 'anim-4', 'anim-5', 'anim-6', 'anim-7']) {
        this.load.spritesheet(texture, art(texture), {
          frameWidth: FRAME_SIZE,
          frameHeight: FRAME_SIZE,
        })
      }
      for (const k of manifest) this.load.image(k, art(k))
    }
    create() {
      if (this.failed) {
        hooks.fault()
        return
      }
      scene = this
      this.add.image(0, 0, 'arena').setOrigin(0).setDisplaySize(WORLD.w, WORLD.h).setDepth(-10000)
      this.cameras.main.setBounds(0, 0, WORLD.w, WORLD.h)
      this.shadows = this.add.graphics().setDepth(0)
      this.markers = this.add.graphics().setDepth(1800)
      this.effects = this.add.graphics().setDepth(2000)
      for (const p of props) {
        const obj = this.add
          .image(p.x, p.y + 5, 'prop-' + p.type)
          .setOrigin(0.5, 0.93)
          .setDepth(p.y)
        const height = [70, 69, 59, 49][p.type]
        obj.setScale(height / obj.height)
      }
      this.resizeWorld()
      this.scale.on('resize', this.resizeWorld, this)
      this.draw(0)
      ready = true
      hooks.ready()
    }
    resizeWorld() {
      const w = this.scale.width,
        h = this.scale.height
      this.cameras.main.setZoom(Math.max(w / WORLD.w, h / WORLD.h, Math.min(w / 440, h / 710), 0.68))
      this.cameras.main.centerOn(sim.player.x, sim.player.y)
    }
    actor(
      active: Set<string>,
      id: string,
      texture: string,
      x: number,
      y: number,
      h: number,
      face: number,
      lift: number,
      frame?: number,
    ) {
      let obj = this.items.get(id)
      if (!obj) {
        obj = this.add
          .image(x, y, texture, frame)
          .setOrigin(0.5, frame === undefined ? 1 : FOOTLINE / FRAME_SIZE)
        this.items.set(id, obj)
      }
      if (frame !== undefined && Number(obj.frame.name) !== frame) obj.setFrame(frame, false, false)
      const scale = frame === undefined ? Math.min(h / obj.height, (h * 1.65) / obj.width) : h / 148
      obj
        .setPosition(x, y - lift)
        .setScale(scale)
        .setFlipX(face === -1)
        .setDepth(y)
      obj.clearTint().setAlpha(1)
      active.add(id)
      const width = frame === undefined ? obj.displayWidth * 0.62 : h * 0.64
      this.shadows.fillStyle(0x663323, 0.24).fillEllipse(x, y + 1, width, Math.max(6, width * 0.25))
      return obj
    }
    overlay(
      active: Set<string>,
      id: string,
      tex: string,
      x: number,
      y: number,
      width: number,
      depth: number,
    ) {
      let obj = this.items.get(id)
      if (!obj) {
        obj = this.add.image(x, y, tex)
        this.items.set(id, obj)
      }
      active.add(id)
      return obj
        .setPosition(x, y)
        .setScale(width / obj.width)
        .setDepth(depth)
    }
    addFx(f: Fx) {
      if (f.type === 'wave') {
        hooks.wave(f.size)
        return
      }
      if (f.type === 'gem') {
        if (sim.age - this.lastGem > 0.075) {
          sound('gem')
          this.lastGem = sim.age
        }
        return
      }
      if (f.type === 'impact') {
        const obj = this.add.image(f.x, f.y - 9, 'fx-' + f.color).setDepth(1995)
        const size = f.size / obj.width
        obj.setScale(size * 0.45)
        this.tweens.add({
          targets: obj,
          scaleX: size,
          scaleY: size,
          alpha: 0,
          duration: 350,
          ease: 'Quad.Out',
          onComplete: () => obj.destroy(),
        })
        return
      }
      if (f.type === 'nova') {
        sound('nova')
        const ripple = this.add.image(f.x, f.y, 'nova-wave').setDepth(1993)
        const scale = (f.size * 2) / ripple.width
        ripple.setScale(scale * 0.22)
        this.tweens.add({
          targets: ripple,
          scaleX: scale,
          scaleY: scale * 0.89,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.Out',
          onComplete: () => ripple.destroy(),
        })
        if (motion) {
          this.hitStop = 0.035
          this.cameras.main.shake(115, 0.003)
        }
        return
      }
      if (f.type === 'slash' && f.to) {
        const to = f.to, angle = Math.atan2(to.y - f.y, to.x - f.x)
        const blade = this.add.image(to.x, to.y - 16, 'kit-2').setDepth(1994)
        blade.setDisplaySize(67,53).setRotation(angle)
        this.tweens.add({targets:blade,angle:blade.angle + 58,alpha:0,duration:220,onComplete:()=>blade.destroy()})
      }
      if (f.type === 'hammer') {
        sound('hammer')
        if (motion && sim.age >= this.nextRecoil) {
          this.hitStop = 0.025
          this.nextRecoil = sim.age + 0.3
          this.cameras.main.shake(55, 0.0016)
        }
        return
      }
      if (f.type === 'guard') {
        sound('guard')
      }
      if (f.type === 'stomp') {
        sound('boss')
        return
      }
      if (f.type === 'cast') {
        sound('spell')
        return
      }
      if (f.type === 'shot') sound(f.size === 7 || f.size === 12 ? 'plant' : weaponSounds[f.size] ?? 'needle')
      if (f.type === 'spark') sound('hit')
      if (f.type === 'hurt') {
        sound('hurt')
        hooks.hurt()
        if (motion) {
          this.hitStop = 0.048
          this.cameras.main.shake(120, 0.004)
        }
      }
      const showDamage =
        f.type === 'spark' &&
        sim.age >= this.nextNumber &&
        Phaser.Math.Distance.Between(f.x, f.y, sim.player.x, sim.player.y) < 270
      if (showDamage) this.nextNumber = sim.age + 0.14
      if (f.type === 'text' || f.type === 'hurt' || showDamage) {
        const label = this.add
          .text(f.x, f.y - 42, f.label ?? (f.type === 'hurt' ? '−' : '') + Math.round(f.size), {
            fontFamily: 'system-ui',
            fontSize: f.type === 'hurt' ? '24px' : showDamage ? '15px' : '17px',
            fontStyle: 'bold',
            color: f.type === 'hurt' ? '#ff796f' : showDamage ? '#fff8db' : '#fff3b6',
            stroke: '#48243b',
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(2003)
        this.tweens.add({
          targets: label,
          y: label.y - 24,
          alpha: 0,
          duration: showDamage ? 370 : 650,
          onComplete: () => label.destroy(),
        })
      }
      const duration = f.type === 'ring' ? 0.38 : f.type === 'burst' ? 0.32 : 0.17
      if (this.ink.length < 170)
        this.ink.push({ fx: f, left: duration, duration, angle: Math.random() * 6.28 })
    }
    draw(dt: number) {
      const active = new Set<string>(),
        p = sim.player,
        t = sim.age + this.ending,
        G = this.markers
      this.shadows.clear()
      G.clear()
      this.effects.clear()
      for (const o of props)
        this.shadows.fillStyle(0x563820, 0.21).fillEllipse(o.x, o.y + 3, o.r * 2.9, o.r * 0.86)
      this.shadows.lineStyle(2, 0x8cff9c, 0.95).strokeEllipse(p.x, p.y + 2, 48, 18)
      this.shadows.fillStyle(0x65ff8c, 0.22).fillEllipse(p.x, p.y + 2, 46, 17)
      const heroHeight = sim.hero === 2 ? 64 : 60
      const heroDown = sim.phase === 'lost'
      const heroPose = heroDown ? defeatFrame(this.ending) : unitFrame({ ...p, age: sim.age }, motion)
      const hero = this.actor(
        active,
        'hero',
        actorTexture(sim.hero),
        p.x,
        p.y,
        heroHeight,
        p.face,
        0,
        heroPose,
      )
      if (heroDown) hero.setAlpha(Math.max(0.3, 1 - this.ending))
      if (!heroDown && t - p.hitAt < 0.18) {
        const strength = 1 - (t - p.hitAt) / 0.18
        if (motion) hero.x -= p.face * strength * 4
        hero.setTint(0xff8b80)
        G.lineStyle(3, 0xff6d5b, strength).strokeEllipse(p.x, p.y + 1, 57, 23)
      }
      if (p.shield > 0)
        this.overlay(active, 'shield', 'fx-4', p.x, p.y - 27, 83, p.y + 0.5).setAlpha(0.8)
      if (!heroDown) {
        G.fillStyle(0x152839).fillRoundedRect(p.x - 21, p.y - heroHeight - 9, 42, 7, 2)
        G.fillStyle(0x74f87b).fillRect(p.x - 19, p.y - heroHeight - 7, (38 * p.hp) / p.max, 3)
      }
      const height = (type: number, elite: boolean) =>
        type === 6 ? 112 : elite ? 78 : type === 5 ? 58 : type === 4 ? 45 : type === 7 ? 42 : 45
      for (const e of sim.enemies) {
        if (e.hp <= 0) continue
        const h = height(e.type, e.elite),
          frozen = e.frozenUntil > sim.age
        const frame = e.dive
          ? t - e.dive.start < 0.26
            ? 8
            : t - e.dive.start < 0.5
              ? 9
              : 10
          : unitFrame({ ...e, age: sim.age, frozen, restingOffset: e.id }, motion)
        const o = this.actor(
          active,
          'e' + e.id,
          'anim-' + e.type,
          e.x,
          e.y,
          h,
          e.face,
          e.type === 4 ? 6 : 0,
          frame,
        )
        if (e.slow > 0) o.setTint(frozen ? 0x88e7ff : 0xc8f4ff)
        if (t - e.hitAt < 0.1 && !frozen) {
          const recoil = 1 - (t - e.hitAt) / 0.1
          if (motion) o.x -= e.face * 4 * recoil
          if (recoil > 0.62) o.setTintFill(0xffe7b0)
        }
        if (e.dive && t - e.dive.start < 0.5) {
          const x = e.x + Math.cos(e.dive.angle) * e.dive.range,
            y = e.y + Math.sin(e.dive.angle) * e.dive.range
          this.shadows.lineStyle(15, 0xe74b7a, 0.26).lineBetween(e.x, e.y, x, y)
          this.shadows.lineStyle(2, 0xffc0bb, 0.95).lineBetween(e.x, e.y, x, y)
        }
        if (sim.arsenal.marks.has(e.id)) {
          const y = e.y - h - 13
          G.lineStyle(2, 0xff8bdc, 0.96).strokePoints([
            {x:e.x - 10,y:y-3},{x:e.x - 4,y:y+5},{x:e.x,y},{x:e.x + 4,y:y+5},{x:e.x + 10,y:y-3}
          ])
          G.fillStyle(0xfcc3ef,1).fillCircle(e.x,y,2.4)
        }
        if (frozen) {
          G.fillStyle(0x93f6ff, 0.33).fillTriangle(e.x - 15, e.y, e.x - 12, e.y - 25, e.x + 3, e.y - 2)
          G.lineStyle(2, 0xc2faff, 0.85)
            .lineBetween(e.x + 6, e.y - 3, e.x + 16, e.y - 23)
            .lineBetween(e.x + 16, e.y - 23, e.x + 17, e.y - 7)
        }
        if (e.elite || e.hp < e.max) {
          const y = o.y - h - 5,
            w = e.type === 6 ? 65 : e.elite ? 38 : 24
          G.fillStyle(0x412534).fillRect(e.x - w / 2, y, w, 4)
          G.fillStyle(e.elite ? 0xffbf4c : 0xfe6b62).fillRect(
            e.x - w / 2 + 1,
            y + 1,
            (w - 2) * Math.max(0, e.hp / e.max),
            2,
          )
        }
      }
      for (const u of sim.turrets) {
        const age = sim.age - u.born
        const frame =
          age < 0.24
            ? 4 + Math.min(3, Math.floor(age / 0.06))
            : unitFrame(
                {
                  age: sim.age,
                  stride: 0,
                  moving: false,
                  strike: u.strike,
                  hitAt: -Infinity,
                  restingOffset: u.id,
                },
                motion,
              )
        this.actor(active, 't' + u.id, 'anim-7', u.x, u.y, 42, u.face, 0, frame)
      }
      for (const f of sim.fallen) {
        const elapsed = t - f.at
        if (elapsed < 0.46)
          this.actor(
            active,
            'fallen' + f.id,
            'anim-' + f.type,
            f.x,
            f.y,
            height(f.type, f.elite),
            f.face,
            0,
            defeatFrame(elapsed),
          ).setAlpha(Math.min(1, (0.46 - elapsed) / 0.19))
      }
      for (const d of sim.drops) {
        const h = [17, 15, 22, 30][d.type]
        this.actor(
          active,
          'd' + d.id,
          'loot-' + d.type,
          d.x,
          d.y,
          h,
          1,
          motion ? Math.sin(t * 4 + d.id) * 1.8 : 0,
        )
      }

      for (const s of sim.shots) {
        const x = s.x,
          y = s.y - (s.style === 0 || s.style === 1 ? 29 : 19)
        if (s.style === 1) {
          G.lineStyle(6, 0xab7cff, 0.62).lineBetween(x - s.vx * 0.04, y - s.vy * 0.04, x, y)
          this.overlay(active, 's' + s.id, 'fx-1', x, y, 22, 1850).setRotation(t * 5)
        } else if (s.style === 13 || s.style === 12) {
          const bee = s.style === 12
          const color = bee ? 0xffb133 : 0x68f5da
          G.lineStyle(bee ? 4 : 6,color,0.62).lineBetween(x-s.vx*0.045,y-s.vy*0.045,x,y)
          if (bee) G.fillStyle(0xffdf83,1).fillCircle(x,y,3.5)
          else this.overlay(active,'s'+s.id,'kit-0',x,y,23,1850).setRotation(t*11)
        } else if (s.style === 9) {
          const angle = Math.atan2(s.vy, s.vx),
            dx = Math.cos(angle),
            dy = Math.sin(angle)
          const crack = [
            { x: x - dx * 34, y: s.y - dy * 34 },
            { x: x - dx * 17 - dy * 7, y: s.y - dy * 17 + dx * 7 },
            { x: x - dx * 12 + dy * 4, y: s.y - dy * 12 - dx * 4 },
            { x, y: s.y },
          ]
          this.overlay(active, 's' + s.id, 'evo-fx-2', x, s.y - 3, 53, s.y).setRotation(angle)
          G.lineStyle(7, 0x6f361f, 0.65).strokePoints(crack)
          G.lineStyle(3, 0xffd47a, 1).strokePoints(crack)
          G.lineStyle(3, 0xffbe55, 0.95).lineBetween(
            crack[1].x,
            crack[1].y,
            crack[1].x - dy * 14,
            crack[1].y + dx * 14,
          )
        } else {
          const texture = s.style >= 18 ? 'relic-4' : s.style === 16 || s.style === 17 ? 'evo-fx-1' : s.style === 8 ? 'evo-fx-1' : s.style === 10 ? 'evo-fx-4' : 'fx-5'
          this.overlay(active, 's' + s.id, texture, x, y, s.style === 8 ? 21 : 27, 1850).setRotation(
            Math.atan2(s.vy, s.vx) + (s.style>=18 ? .75 : 0),
          )
          if (s.style === 8 || s.style === 10) {
            const color = s.style === 8 ? 0xb6ff51 : 0xffcf49
            G.lineStyle(3, color, 0.9).lineBetween(x - s.vx * 0.03, y - s.vy * 0.03, x, y)
          }
        }
      }
      for (const d of sim.foundry.constructs) {
        const id='forge'+d.id, kind=d.kind, palette=kind==='fire'||kind==='star'?0xffa14a:kind==='frost'||kind==='mine'?0x91eaff:0xbcb1ff
        if(kind==='trail')continue
        if(kind==='wire'){
          const x=Math.cos(d.angle)*82,y=Math.sin(d.angle)*82
          this.overlay(active,id+'a','kit-5',d.x-x,d.y-y-8,22,d.y-y+2)
          this.overlay(active,id+'b','kit-5',d.x+x,d.y+y-8,22,d.y+y+2)
          G.lineStyle(3,0xa49bff,.88).lineBetween(d.x-x,d.y-y-12,d.x+x,d.y+y-12);continue
        }
        if(kind==='fire'||kind==='frost'||kind==='star'){
          const r=kind==='frost'?63:kind==='star'?43:31
          this.shadows.fillStyle(palette,.19).fillEllipse(d.x,d.y,r*2,r*1.4)
          this.shadows.lineStyle(2,palette,.78).strokeEllipse(d.x,d.y,r*2,r*1.4)
        }
        if(kind==='tower'){
          this.actor(active,id,'anim-7',d.x,d.y,39,1,0,d.tick>.63?10:1);continue
        }
        const tex=deviceArt[kind]
        if(!tex)continue
        const airborne=kind==='star'?Math.max(0,1-d.age/d.life)*70:kind==='bee'||kind==='lamp'?22:kind==='plague'?45:8
        const width=kind==='sun'?85:kind==='decoy'?50:kind==='plague'?18:kind==='star'?31:33
        const obj=this.overlay(active,id,tex,d.x,d.y-airborne,width,kind==='plague'?1900:d.y+18)
        obj.setAlpha(kind==='decoy'?.8:1).setRotation(kind==='moon'||kind==='sun'?t*(motion?8:0):0)
      }
      for (const d of sim.arsenal.devices) {
        const id = 'kit' + d.id
        if (d.kind === 'pool' || d.kind === 'ember') {
          const opacity = Math.min(1,(d.duration-d.age)*3)
          this.shadows.fillStyle(0xc83f25,0.26*opacity).fillEllipse(d.x,d.y,d.radius*2,d.radius*1.48)
          this.shadows.lineStyle(2,0xffae44,0.86*opacity).strokeEllipse(d.x,d.y,d.radius*1.77,d.radius*1.32)
          for (let k=0;k<3;k++) {
            const a=k*2.094+d.id, x=d.x+Math.cos(a)*d.radius*0.45, y=d.y+Math.sin(a)*d.radius*0.37
            const flame=11+(motion ? Math.sin(t*10+k)*3 : 0)
            this.shadows.fillStyle(0xffb54b,0.76*opacity).fillTriangle(x-4,y,x+3,y,x+2,y-flame)
          }
        } else if (d.kind === 'fence') {
          const x = Math.cos(d.angle)*d.radius, y=Math.sin(d.angle)*d.radius
          this.overlay(active,id+'a','kit-5',d.x-x,d.y-y-8,25,d.y-y+1)
          this.overlay(active,id+'b','kit-5',d.x+x,d.y+y-8,25,d.y+y+1)
          const wire = Array.from({length:9},(_,j) => {
            const fraction=j/4-1, bend=j%2 ? (motion ? Math.sin(t*16+j)*5 : 3) : 0
            return {x:d.x+x*fraction - Math.sin(d.angle)*bend, y:d.y+y*fraction-11+Math.cos(d.angle)*bend}
          })
          G.lineStyle(6,0x7756ee,0.63).strokePoints(wire)
          G.lineStyle(2,0xbfefff,0.96).strokePoints(wire)
        } else if (d.kind === 'mine') {
          const w=d.variant ? 22 : 34
          this.overlay(active,id,'kit-4',d.x,d.y-6,w,d.y+1)
          this.shadows.lineStyle(1.6,0x89ebff,d.age<0.48 ? 0.24 : 0.7).strokeEllipse(d.x,d.y,w*1.36,w*0.77)
        } else if (d.kind === 'sentry') {
          this.actor(active,id,'anim-7',d.x,d.y,34,1,0,d.age<0.26 ? 4+Math.min(3,Math.floor(d.age/0.065)) : d.tick>0.56 ? 10 : 0)
        } else if (d.kind === 'flask') {
          const progress=Math.min(1,d.age/d.duration)
          const origin = d.origin ?? p
          const x = origin.x + (d.x - origin.x) * progress
          const y = origin.y + (d.y - origin.y) * progress - 22 * (1-progress) - 61 * Math.sin(progress*Math.PI)
          this.overlay(active,id,'kit-1',x,y,28,1860).setRotation(progress*4)
        } else if (d.kind === 'moon' || d.kind === 'orbit') {
          this.overlay(active,id,'kit-0',d.x,d.y-15,d.kind==='moon'?36:28,1850).setRotation(t*(d.variant?-13:13)+d.angle)
          if (d.kind==='orbit') {
            this.shadows.lineStyle(1,0x65f2c5,0.22).strokeCircle(p.x,p.y,d.radius)
          }
        } else if (d.kind === 'bee') {
          this.shadows.fillStyle(0x52293b,0.23).fillEllipse(d.x,d.y,15,5)
          this.overlay(active,id,'kit-3',d.x,d.y-25,32,d.y+30).setFlipX(Math.cos(d.age*2.25+d.angle)<0)
        }
      }
      for (const z of sim.zones) {
        const rune = z.type === 'beacon' || z.type === 'echo'
        const c = rune
          ? 0xb28cff
          : z.type === 'storm'
            ? 0x82e746
            : z.type === 'slam'
              ? 0xe03636
              : 0xff7335
        const radius = z.type === 'beacon' ? 20 : z.radius
        G.fillStyle(c, 0.14).fillCircle(z.x, z.y, radius)
        G.lineStyle(2, c, 0.85).strokeCircle(z.x, z.y, radius)
        if (z.type === 'beacon') {
          this.overlay(active, 'z' + z.id, 'evo-fx-0', z.x, z.y + 2, 37, z.y + 1).setOrigin(0.5, 1)
        } else if (z.type === 'echo') {
          this.overlay(active, 'z' + z.id, 'evo-fx-5', z.x, z.y, 65 + 12 * (1 - z.life), 2).setAlpha(0.9)
        }
        if (z.type === 'storm' && sim.evolutions.has(Evo.vortex)) {
          for (let n = 0; n < 3; n++) {
            const angle = t * 3 + (n * Math.PI * 2) / 3
            G.lineStyle(3, 0xdcff8d, 0.85)
              .beginPath()
              .arc(z.x, z.y, z.radius * 0.72, angle, angle + 0.96)
              .strokePath()
          }
        }
        if (z.type === 'slam') {
          G.fillStyle(c, 0.25).fillCircle(z.x, z.y, z.radius * Math.max(0, 1 - z.life))
          G.lineStyle(3, c, 0.9)
            .lineBetween(z.x - 8, z.y - 8, z.x + 8, z.y + 8)
            .lineBetween(z.x - 8, z.y + 8, z.x + 8, z.y - 8)
        }
        if (z.type === 'storm')
          this.overlay(active, 'z' + z.id, 'fx-3', z.x, z.y - 5, z.radius * 1.85, 2)
            .setRotation(motion ? t * 2 : 0)
            .setAlpha(0.78)
        if (z.type === 'meteor' || z.type === 'fragment') {
          const offset = z.life * 260
          G.lineStyle(10, 0xffc74f, 0.7).lineBetween(
            z.x + offset + 0.2 * offset,
            z.y - offset,
            z.x + offset,
            z.y - offset * 0.8,
          )
          this.overlay(
            active,
            'z' + z.id,
            'evo-fx-3',
            z.x + offset,
            z.y - offset * 0.8,
            z.type === 'fragment' ? 26 : 43,
            1850,
          ).setFlipX(true)
        }
      }
      for (const k of this.items.keys())
        if (!active.has(k)) {
          this.items.get(k)!.destroy()
          this.items.delete(k)
        }
      for (const k of this.ink) {
        const f = k.fx,
          g = this.effects,
          a = Math.max(0, k.left / k.duration),
          u = 1 - a
        if (f.type === 'bolt' && f.to) {
          const x2 = f.to.x,
            y2 = f.to.y - 20,
            y1 = f.y - 18
          const points = [
            f,
            { x: f.x * 0.64 + x2 * 0.36 + 8, y: y1 * 0.64 + y2 * 0.36 - 7 },
            { x: f.x * 0.4 + x2 * 0.6 - 7, y: y1 * 0.4 + y2 * 0.6 + 6 },
            { x: x2, y: y2 },
          ]
          for (const [width, color] of [
            [7, f.color],
            [2, 0xffffff],
          ]) {
            g.lineStyle(width, color, a).beginPath().moveTo(f.x, y1)
            for (const pt of points.slice(1)) g.lineTo(pt.x, pt.y)
            g.strokePath()
          }
        } else if (f.type === 'crest') {
          g.lineStyle(2.5,f.color,a).strokeEllipse(f.x,f.y-4,22+42*u,12+27*u)
          for(let j=0;j<4;j++){
            const angle=j*Math.PI/2+0.25
            g.fillStyle(f.color,a).fillCircle(f.x+Math.cos(angle)*(12+20*u),f.y-4+Math.sin(angle)*(9+11*u),2.5)
          }
        } else if (f.type === 'slash' && f.to) {
          g.lineStyle(5,f.color,a*0.72).lineBetween(f.x,f.y-18,f.to.x,f.to.y-20)
        } else if (f.type === 'spark' || f.type === 'guard') {
          const r = (f.type === 'guard' ? 26 : 9 + Math.min(10, f.size * 0.1)) * (0.6 + 0.7 * u)
          const cy = f.y - (f.type === 'guard' ? 24 : 21)
          for (let j = 0; j < 4; j++) {
            const angle = k.angle + (j * Math.PI) / 2,
              dx = Math.cos(angle),
              dy = Math.sin(angle)
            g.lineStyle(2.5, f.color, a).lineBetween(
              f.x + dx * r * 0.36,
              cy + dy * r * 0.36,
              f.x + dx * r,
              cy + dy * r,
            )
          }
          g.fillStyle(0xfff4da, a * 0.85).fillCircle(f.x, cy, 2 + 3 * a)
        } else if (f.type === 'ring') {
          g.lineStyle(4 * a + 1, f.color, a).strokeEllipse(
            f.x,
            f.y,
            f.size * 2 * (0.45 + 0.55 * u),
            f.size * 1.82 * (0.45 + 0.55 * u),
          )
        } else if (f.type === 'burst' || f.type === 'shot') {
          const n = f.type === 'burst' ? 8 : 4,
            r = (f.type === 'shot' ? 7 : f.size) * (0.6 + 1.6 * u)
          for (let j = 0; j < n; j++) {
            const ang = k.angle + (j * 6.28) / n
            g.fillStyle(j % 2 ? f.color : 0xfff6be, a).fillCircle(
              f.x + Math.cos(ang) * r,
              f.y - 15 + Math.sin(ang) * r,
              Math.max(0.6, 3 * a),
            )
          }
        }
        k.left -= dt
      }
      this.ink = this.ink.filter((i) => i.left > 0)
    }
    update(_time: number, ms: number) {
      if (!ready || paused || this.complete || sim.phase === 'upgrade') return
      const dt = Math.min(ms / 1000, 0.05)
      const dx =
        Number(keys.has('ArrowRight') || keys.has('KeyD')) -
        Number(keys.has('ArrowLeft') || keys.has('KeyA'))
      const dy =
        Number(keys.has('ArrowDown') || keys.has('KeyS')) -
        Number(keys.has('ArrowUp') || keys.has('KeyW'))
      if (sim.phase === 'won' || sim.phase === 'lost') this.ending += dt
      else if (this.hitStop > 0) this.hitStop = Math.max(0, this.hitStop - dt)
      else sim.step(dt, drag !== null ? stick : { x: dx, y: dy })
      for (const f of sim.events) this.addFx(f)
      sim.events.length = 0
      this.cameras.main.centerOn(sim.player.x, sim.player.y)
      this.draw(dt)
      if (this.ending >= 0.48) {
        this.complete = true
        hooks.complete()
        return
      }
      this.hudTick -= dt
      if (this.hudTick <= 0 || sim.phase !== 'play') {
        this.hudTick = 0.08
        hooks.update()
      }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: root,
    transparent: false,
    backgroundColor: '#c98546',
    scene: Arena,
    scale: { mode: Phaser.Scale.RESIZE, width: root.clientWidth, height: root.clientHeight },
    input: { mouse: false, touch: false, keyboard: false },
    audio: { noAudio: true },
    render: { antialias: true, roundPixels: false, powerPreference: 'low-power' },
    fps: { target: 60 },
    banner: false,
  })
  return {
    pause(v: boolean) {
      paused = v
      clearInput()
      if (scene) {
        scene.tweens.timeScale = v ? 0 : 1
      }
    },
    activate() {
      return ready && !paused && sim.releaseNova()
    },
    destroy() {
      ready = false
      controller.abort()
      clearInput()
      game.destroy(true)
    },
  }
}
