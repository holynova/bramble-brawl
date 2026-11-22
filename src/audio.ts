type Timbre = 'round' | 'reed' | 'brass' | 'metal' | 'spark' | 'noise'
type Layer = {
  timbre: Timbre
  from: number
  to: number
  length: number
  gain: number
  delay: number
  attack: number
}

// Times are in milliseconds. Each layer is a single instrument partial or a filtered noise strike.
const voice = (
  timbre: Timbre,
  from: number,
  to: number,
  length: number,
  gain: number,
  delay = 0,
  attack = 2,
): Layer => ({ timbre, from, to, length, gain, delay, attack })
const thump = (from: number, to: number, length: number, gain: number, delay = 0) =>
  voice('reed', from, to, length, gain, delay)
const snap = (from: number, to: number, length: number, gain: number, delay = 0) =>
  voice('noise', from, to, length, gain, delay, 0.8)
const bell = (note: number, length: number, gain: number, delay = 0) =>
  voice('metal', note, note * 0.995, length, gain, delay, 1.5)

const effects = {
  // Different pitches and spacing make both barrels audible on a mono phone speaker.
  needle: [
    snap(4600, 1400, 43, 0.8),
    thump(740, 245, 68, 0.61),
    snap(5350, 1800, 34, 0.61, 49),
    thump(890, 300, 59, 0.47, 49),
  ],
  arc: [
    voice('spark', 1150, 260, 195, 0.8),
    snap(6500, 2700, 72, 0.54),
    voice('spark', 660, 1550, 67, 0.35, 61),
  ],
  hammer: [
    snap(2880, 940, 33, 0.83),
    thump(335, 105, 185, 0.98),
    bell(414, 254, 0.52, 4),
    snap(2010, 540, 80, 0.38, 16),
  ],
  plant: [voice('round', 680, 125, 108, 0.93), voice('reed', 340, 740, 51, 0.33, 5), snap(1400, 500, 36, 0.39)],
  hit: [snap(2150, 530, 49, 0.84), thump(295, 124, 81, 0.67), bell(836, 51, 0.16, 9)],
  hurt: [
    voice('brass', 495, 172, 135, 0.82),
    voice('brass', 405, 128, 181, 0.63, 100),
    snap(1880, 590, 52, 0.39),
  ],
  guard: [
    snap(4900, 2600, 29, 0.5),
    bell(1080, 227, 0.68),
    bell(1575, 178, 0.36, 7),
    voice('round', 400, 730, 88, 0.32),
  ],
  nova: [
    voice('spark', 160, 630, 110, 0.45, 0, 35),
    thump(510, 83, 330, 1.0, 65),
    snap(5900, 720, 250, 0.88, 64),
    bell(933, 280, 0.37, 70),
  ],
  boss: [
    snap(1490, 440, 85, 0.84),
    thump(315, 68, 315, 1.0),
    voice('brass', 191, 84, 288, 0.42, 23),
    snap(2330, 555, 120, 0.5, 128),
  ],
  spell: [voice('spark', 350, 600, 122, 0.55), bell(700, 185, 0.55, 44), bell(1050, 246, 0.43, 90)],
  click: [voice('round', 630, 880, 54, 0.55), bell(1190, 30, 0.15)],
  gem: [bell(1090, 97, 0.54), voice('round', 1470, 1630, 77, 0.4, 26)],
  level: [
    bell(587, 150, 0.48),
    bell(740, 156, 0.53, 64),
    bell(880, 174, 0.57, 128),
    bell(1175, 320, 0.61, 200),
  ],
  wave: [voice('brass', 280, 294, 158, 0.69, 0, 12), voice('brass', 360, 392, 280, 0.63, 136, 15)],
  win: [
    bell(587, 190, 0.5),
    bell(740, 178, 0.48, 91),
    bell(880, 210, 0.52, 182),
    bell(1175, 440, 0.62, 290),
    bell(1479, 400, 0.29, 296),
  ],
  lose: [
    voice('reed', 294, 278, 235, 0.55, 0, 12),
    voice('reed', 233, 221, 242, 0.5, 167, 12),
    voice('reed', 196, 154, 377, 0.56, 340, 15),
  ],
} satisfies Record<string, Layer[]>
type Effect = keyof typeof effects
export type SoundKey = Effect | 'shot'
type SoundLimits = { gap: number; priority: number; level: number }
const limits: Record<Effect, SoundLimits> = {
  needle: { gap: 0.073, priority: 2, level: 0.58 },
  arc: { gap: 0.09, priority: 2, level: 0.7 },
  hammer: { gap: 0.1, priority: 2, level: 0.9 },
  plant: { gap: 0.09, priority: 1, level: 0.55 },
  hit: { gap: 0.063, priority: 1, level: 0.47 },
  hurt: { gap: 0.23, priority: 4, level: 0.82 },
  guard: { gap: 0.13, priority: 3, level: 0.79 },
  nova: { gap: 0.22, priority: 4, level: 0.94 },
  boss: { gap: 0.28, priority: 4, level: 0.96 },
  spell: { gap: 0.12, priority: 3, level: 0.74 },
  click: { gap: 0.035, priority: 2, level: 0.41 },
  gem: { gap: 0.085, priority: 1, level: 0.4 },
  level: { gap: 0.24, priority: 5, level: 0.77 },
  wave: { gap: 0.24, priority: 4, level: 0.75 },
  win: { gap: 0.4, priority: 5, level: 0.85 },
  lose: { gap: 0.4, priority: 5, level: 0.76 },
}
const sampleRate = 24000,
  tau = Math.PI * 2
function renderLayer(samples: Float32Array, layer: Layer, seed: number) {
  const { timbre, from, to, gain } = layer,
    length = Math.round((layer.length * sampleRate) / 1000)
  const offset = Math.round((layer.delay * sampleRate) / 1000),
    attack = Math.max(1, Math.round((layer.attack * sampleRate) / 1000))
  let phase = 0,
    frequency = from,
    low = 0,
    high = 0,
    lowCoefficient = 0,
    highCoefficient = 0
  const sweep = Math.pow(to / from, 1 / length)
  for (let i = 0; i < length; i++) {
    const progress = i / length,
      envelope = Math.min(1, i / attack) * Math.exp(-4.6 * progress) * (1 - progress)
    let value: number
    if (timbre === 'noise') {
      // Subtract two one-pole low-pass filters to shape a repeatable band of noise.
      if ((i & 31) === 0) {
        lowCoefficient = 1 - Math.exp((-tau * frequency * 0.5) / sampleRate)
        highCoefficient = 1 - Math.exp((-tau * Math.min(9500, frequency * 1.8)) / sampleRate)
      }
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const white = seed / 2147483648 - 1
      low += lowCoefficient * (white - low)
      high += highCoefficient * (white - high)
      value = 2 * (high - low)
    } else {
      phase += (tau * frequency) / sampleRate
      const base = Math.sin(phase)
      if (timbre === 'round') value = base
      else if (timbre === 'reed') value = 0.73 * base + 0.2 * Math.sin(2 * phase) + 0.14 * Math.sin(3 * phase)
      else if (timbre === 'brass')
        value =
          0.59 * base + 0.33 * Math.sin(2 * phase) + 0.21 * Math.sin(3 * phase) + 0.1 * Math.sin(5 * phase)
      else if (timbre === 'metal')
        value = 0.57 * base + 0.28 * Math.sin(2.72 * phase) + 0.16 * Math.sin(4.17 * phase)
      else
        value =
          Math.sin(phase + (2.6 - 2 * progress) * Math.sin(1.47 * phase)) * (0.8 + 0.2 * Math.cos(i * 0.016))
    }
    samples[offset + i] += value * gain * envelope
    frequency *= sweep
  }
}
function renderEffect(context: AudioContext, key: Effect) {
  const layers = effects[key],
    duration = Math.max(...layers.map((l) => l.delay + l.length))
  const buffer = context.createBuffer(1, Math.ceil((duration * sampleRate) / 1000) + 1, sampleRate)
  const samples = buffer.getChannelData(0)
  layers.forEach((layer, i) => renderLayer(samples, layer, 41 + i * 781 + key.charCodeAt(0) * 107))
  let peak = 0
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample))
  const gain = limits[key].level / Math.max(0.05, peak)
  for (let i = 0; i < samples.length; i++) samples[i] *= gain
  return buffer
}

let ctx: AudioContext | undefined,
  master: GainNode | undefined,
  effectsGain: GainNode | undefined,
  musicGain: GainNode | undefined
let enabled = true,
  musicOn = true,
  volume = 0.85,
  musicRequested = false,
  musicTimer = 0,
  musicStep = 0,
  nextBeat = 0
let unavailable = false,
  primed = false,
  gestureTime = -Infinity
let pending: { key: Effect; time: number } | undefined
const samples = new Map<Effect, AudioBuffer>(),
  lastSound = new Map<Effect, number>()
const voices = new Map<AudioBufferSourceNode, number>(),
  musicNotes = new Set<OscillatorNode>()
const maxVoices = 12
const now = () => performance.now()
const canPlay = () => !!ctx && enabled && volume > 0 && ctx.state === 'running'

function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer)
  musicTimer = 0
  for (const osc of musicNotes) osc.stop()
  musicNotes.clear()
}
function stopEffects() {
  for (const source of voices.keys()) source.stop()
  voices.clear()
  lastSound.clear()
  pending = undefined
}
function updateMix() {
  if (!ctx || !master || !musicGain) return
  const t = ctx.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setTargetAtTime(enabled ? volume : 0, t, 0.004)
  musicGain.gain.setTargetAtTime(enabled && musicOn && musicRequested ? 0.57 : 0, t, 0.006)
  if (!enabled || volume === 0) stopEffects()
  syncMusic()
}
function refreshState() {
  if (!ctx) return
  if (ctx.state !== 'running') {
    stopMusic()
    stopEffects()
    return
  }
  syncMusic()
  const fresh = pending
  pending = undefined
  if (fresh && now() - fresh.time < 350) playEffect(fresh.key)
}
function setupContext(context: AudioContext) {
  ctx = context
  primed = false
  samples.clear()
  master = context.createGain()
  master.gain.value = enabled ? volume : 0
  effectsGain = context.createGain()
  effectsGain.gain.value = 0.84
  musicGain = context.createGain()
  musicGain.gain.value = enabled && musicOn && musicRequested ? 0.57 : 0
  const compressor = context.createDynamicsCompressor()
  compressor.threshold.value = -10
  compressor.knee.value = 6
  compressor.ratio.value = 8
  compressor.attack.value = 0.003
  compressor.release.value = 0.09
  // Catch coincident attacks during the compressor's attack window while leaving soft samples linear.
  const ceiling = context.createWaveShaper()
  ceiling.curve = Float32Array.from({ length: 1025 }, (_, i) => {
    const x = i / 512 - 1
    const excess = Math.abs(x) - 0.68
    return excess <= 0 ? x : Math.sign(x) * (0.68 + 0.25 * Math.tanh(excess / 0.25))
  })
  effectsGain.connect(compressor)
  musicGain.connect(compressor)
  compressor.connect(ceiling)
  ceiling.connect(master)
  master.connect(context.destination)
  context.onstatechange = refreshState
}
export function unlockAudio() {
  if (!enabled) return
  gestureTime = now()
  try {
    if (!ctx || ctx.state === 'closed') {
      const legacy = window as Window & { webkitAudioContext?: typeof AudioContext }
      const Constructor = window.AudioContext ?? legacy.webkitAudioContext
      if (!Constructor) {
        unavailable = true
        return
      }
      setupContext(new Constructor())
      unavailable = false
    }
    const context = ctx!
    if (!primed || context.state !== 'running') {
      // Start a silent sample synchronously inside the touch/click on older iOS WebKit.
      const pulse = context.createBufferSource()
      pulse.buffer = context.createBuffer(1, 1, context.sampleRate)
      pulse.connect(context.destination)
      pulse.onended = () => pulse.disconnect()
      pulse.start()
      primed = true
    }
    if (context.state !== 'running')
      void context
        .resume()
        .then(refreshState)
        .catch(() => {})
    else syncMusic()
  } catch {
    unavailable = !ctx
  }
}
export function audioEnabled(value: boolean) {
  enabled = value
  updateMix()
}
export function musicEnabled(value: boolean) {
  musicOn = value
  updateMix()
}
export function audioVolume(value: number) {
  if (!Number.isFinite(value)) return
  volume = Math.max(0, Math.min(1, value))
  updateMix()
}
export function audioStatus() {
  const state: AudioContextState | 'interrupted' | 'locked' | 'unavailable' =
    ctx?.state ?? (unavailable ? 'unavailable' : 'locked')
  return {
    state,
    canPlay: canPlay(),
    enabled,
    musicEnabled: musicOn,
    volume,
    musicPlaying: !!musicTimer,
    activeVoices: voices.size,
  }
}
function playEffect(key: Effect) {
  if (!ctx || !effectsGain || !canPlay()) return
  const time = ctx.currentTime,
    { gap, priority } = limits[key]
  if (time - (lastSound.get(key) ?? -Infinity) < gap) return
  if (voices.size >= maxVoices) {
    let victim: AudioBufferSourceNode | undefined,
      lowest = priority
    for (const [node, rank] of voices) {
      if (rank < lowest) {
        victim = node
        lowest = rank
      }
    }
    if (!victim) return
    victim.stop()
    voices.delete(victim)
  }
  const clip = samples.get(key) ?? renderEffect(ctx, key)
  samples.set(key, clip)
  const node = ctx.createBufferSource()
  node.buffer = clip
  if (priority <= 3) node.playbackRate.value = 0.965 + Math.random() * 0.07
  node.connect(effectsGain)
  node.onended = () => {
    voices.delete(node)
    node.disconnect()
  }
  voices.set(node, priority)
  lastSound.set(key, time)
  node.start()
}
export function sound(key: SoundKey) {
  const effect = key === 'shot' ? 'needle' : key
  if (canPlay()) playEffect(effect)
  else if (ctx && enabled && volume > 0 && now() - gestureTime < 350) pending = { key: effect, time: now() }
}

const roots = [50, 50, 46, 48, 50, 53, 48, 45]
const tune = [
  74, 0, 77, 76, 74, 0, 69, 0, 72, 0, 74, 0, 69, 67, 65, 0, 70, 0, 74, 0, 77, 76, 74, 0, 72, 0, 67, 0, 69, 0,
  72, 0, 74, 0, 77, 81, 79, 0, 77, 0, 72, 0, 69, 72, 77, 0, 79, 0, 76, 72, 67, 0, 72, 0, 69, 0, 73, 0, 76, 0,
  69, 0, 0, 0,
]
function pluck(midi: number, time: number, length: number, level: number, bass = false) {
  if (!ctx || !musicGain) return
  const osc = ctx.createOscillator(),
    filter = ctx.createBiquadFilter(),
    gain = ctx.createGain()
  osc.type = bass ? 'triangle' : 'sawtooth'
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(bass ? 680 : 2300, time)
  filter.frequency.exponentialRampToValueAtTime(bass ? 180 : 450, time + length)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(level, time + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(musicGain)
  osc.onended = () => {
    musicNotes.delete(osc)
    osc.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
  musicNotes.add(osc)
  osc.start(time)
  osc.stop(time + length + 0.01)
}
function scheduleMusic() {
  if (!ctx || !canPlay()) return
  if (nextBeat < ctx.currentTime) nextBeat = ctx.currentTime + 0.02
  while (nextBeat < ctx.currentTime + 0.2) {
    const beat = musicStep % 8,
      root = roots[Math.floor(musicStep / 8) % 8],
      note = tune[musicStep % tune.length]
    if (beat === 0 || beat === 4) pluck(root - 12 + (beat === 4 ? 7 : 0), nextBeat, 0.32, 0.14, true)
    if (beat === 2 || beat === 6)
      for (const offset of [0, 7, 12]) pluck(root + offset, nextBeat + offset * 0.001, 0.13, 0.033)
    if (note) pluck(note, nextBeat, 0.24, 0.09)
    nextBeat += 0.225
    musicStep++
  }
}
function syncMusic() {
  if (!ctx || !canPlay() || !musicOn || !musicRequested) {
    stopMusic()
    return
  }
  if (musicTimer) return
  nextBeat = ctx.currentTime + 0.025
  scheduleMusic()
  musicTimer = window.setInterval(scheduleMusic, 90)
}
export function battleMusic(play: boolean) {
  musicRequested = play
  updateMix()
}
