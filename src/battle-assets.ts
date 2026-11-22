import { actorTexture, traditionFor } from './builds.ts'
import { art } from './data.ts'

export const terrains = ['quarry', 'crystal', 'foundry']
type TextureKind = 'image' | 'sheet' | 'hud'
type Asset = { key: string; file: string; kind: TextureKind }
export type BattleTexture = Asset & { image: HTMLImageElement }

const shared: Asset[] = []
function group(prefix: string, start: number, count: number, kind: TextureKind) {
  for (let i = start; i < start + count; i++) {
    const key = prefix + i
    shared.push({ key, file: key, kind })
  }
}
group('anim-', 3, 5, 'sheet')
group('prop-', 0, 4, 'image')
group('loot-', 0, 4, 'image')
for (const prefix of ['relic-', 'kit-', 'fx-', 'evo-fx-']) group(prefix, 0, 6, 'image')
shared.push({ key: 'nova-wave', file: 'nova-wave', kind: 'image' }, { key: 'nova', file: 'nova', kind: 'hud' })

export function battleManifest(hero: number, contract: number): Asset[] {
  const actor = actorTexture(hero)
  const hud = ['face-' + hero, ...traditionFor(hero).deck.map(k => 'spell-' + k)]
  return [
    { key: 'arena', file: terrains[contract], kind: 'image' },
    { key: actor, file: actor, kind: 'sheet' },
    ...shared,
    ...hud.map(key => ({ key, file: key, kind: 'hud' as const })),
  ]
}

function decodeArt(file: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.decoding = 'async'
  const ready = typeof image.decode === 'function' ? undefined : new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('图片加载失败 ' + file))
  })
  image.src = art(file)
  return (ready ?? image.decode()).then(() => image)
}

type Engine = typeof import('./battle.ts')
type Pack = { engine: Engine; textures: BattleTexture[] }
type Job = { hero: number; contract: number; files: Set<string>; done: number; total: number; ready: Promise<Pack> }

// The camp and the start button share one job. Only the current selection is kept decoded.
export function createBattlePreloader(
  report: (done: number, total: number) => void,
  loadImage = decodeArt,
  loadEngine = () => import('./battle.ts'),
) {
  const cache = new Map<string, Promise<HTMLImageElement>>()
  const pending = new Set<string>()
  let active: Job | undefined

  function read(file: string) {
    const cached = cache.get(file)
    if (cached) return cached
    pending.add(file)
    const result = loadImage(file).catch(error => {
      cache.delete(file)
      throw error
    }).finally(() => {
      pending.delete(file)
      if (!active?.files.has(file)) cache.delete(file)
    })
    cache.set(file, result)
    return result
  }

  return function prepare(hero: number, contract: number): Promise<Pack> {
    if (active?.hero === hero && active.contract === contract) {
      report(active.done, active.total)
      return active.ready
    }
    const manifest = battleManifest(hero, contract)
    const files = new Set(manifest.map(asset => asset.file))
    for (const file of cache.keys()) {
      if (!files.has(file) && !pending.has(file)) cache.delete(file)
    }
    let cursor = 0
    const textures: BattleTexture[] = []
    function completed() {
      if (active === job) report(++job.done, job.total)
    }
    async function worker() {
      while (active === job && cursor < manifest.length) {
        const asset = manifest[cursor++]
        const image = await read(asset.file)
        textures.push({ ...asset, image })
        completed()
      }
    }
    // Start on the next microtask, after the job is installed and handlers can attach.
    const ready = Promise.resolve().then(async () => {
      const engine = loadEngine().then(module => { completed(); return module })
      const [runtime] = await Promise.all([engine, ...Array.from({ length: 4 }, worker)])
      if (active !== job) throw new Error('出战配置已切换')
      return { engine: runtime, textures }
    }).catch(error => {
      if (active === job) {
        active = undefined
        report(-1, job.total)
      }
      throw error
    })
    const job: Job = { hero, contract, files, done: 0, total: manifest.length + 1, ready }
    active = job
    report(0, job.total)
    return ready
  }
}
