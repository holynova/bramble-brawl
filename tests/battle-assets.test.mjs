import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { battleManifest, createBattlePreloader, terrains } from '../src/battle-assets.ts'
import { heroes, contracts } from '../src/data.ts'
import { actorTexture, traditionFor } from '../src/builds.ts'

test('六英雄在三地图的战场清单包含自己的动作图、当前地图、敌人和起手界面', () => {
  for (const hero of heroes.keys()) for (const contract of contracts.keys()) {
    const assets = battleManifest(hero, contract)
    const byKey = new Map(assets.map(a => [a.key,a]))
    assert.equal(byKey.size, assets.length)
    assert.equal(byKey.get('arena').file, terrains[contract])
    assert.deepEqual(assets.filter(a=>a.kind==='sheet').map(a=>a.key).sort(),
      [actorTexture(hero),'anim-3','anim-4','anim-5','anim-6','anim-7'].sort())
    for (const k of traditionFor(hero).deck) assert.equal(byKey.get('spell-'+k).kind, 'hud')
    for (const a of assets) assert.ok(existsSync(new URL('../public/art/'+a.file+'.webp',import.meta.url)),a.file)
  }
})

test('营地和立即出战共用同一批准备；切换后按文件复用公共素材并报告当前配置进度', async () => {
  const reads = new Map(), progress = []
  const prepare = createBattlePreloader((done,total)=>progress.push([done,total]),
    async file => { reads.set(file,(reads.get(file)??0)+1); return { src:file } }, async()=>({}))
  const first = prepare(0,0)
  assert.equal(prepare(0,0), first)
  await first
  progress.length=0
  const next = await prepare(5,2)
  assert.equal(next.textures.find(a=>a.key==='arena').image.src,'foundry')
  assert.ok(next.textures.some(a=>a.key===actorTexture(5)))
  assert.ok(!next.textures.some(a=>a.key===actorTexture(0)))
  assert.ok([...reads.values()].every(n=>n===1))
  assert.equal(progress.at(-1)[0],progress.at(-1)[1])
  assert.ok(progress.every(([d],i)=>d===i))
})

test('快速切英雄可以接手在途资源；旧任务结束不会覆盖新进度', async () => {
  const calls=[],states=[]
  let release
  const gate = new Promise(resolve=>{release=resolve})
  const prepare = createBattlePreloader((d,t)=>states.push([d,t]), async file=>{
    calls.push(file)
    await gate
    return {src:file}
  },async()=>({}))
  const stale = prepare(0,0)
  await Promise.resolve()
  const current = prepare(4,0)
  const rejected = assert.rejects(stale)
  release()
  const {textures} = await current
  await rejected
  assert.equal(calls.filter(f=>f==='anim-3').length,1)
  assert.equal(calls.filter(f=>f==='quarry').length,1)
  assert.ok(textures.some(t=>t.key===actorTexture(4)))
  assert.equal(states.at(-1)[0],states.at(-1)[1])
  assert.ok(states.every(([d])=>d>=0))
})

test('失败的资源可重试，已经备好的素材可以复用', async () => {
  let fail=true
  const calls=[],states=[]
  const prepare=createBattlePreloader((d,t)=>states.push([d,t]), async file=>{
    calls.push(file)
    if(file==='nova' && fail) throw new Error('模拟断网')
    return {src:file}
  },async()=>({}))
  await assert.rejects(prepare(1,1),/模拟断网/)
  fail=false
  assert.equal(states.at(-1)[0],-1)
  await prepare(1,1)
  assert.equal(calls.filter(file=>file==='nova').length,2)
  assert.equal(calls.filter(file=>file==='crystal').length,1)
  assert.equal(states.at(-1)[0],states.at(-1)[1])
})
