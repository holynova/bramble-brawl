import './style.css'
import {
  heroes,
  spells,
  gears,
  contracts,
  upgrades,
  isEvolution,
  waveNames,
  nova,
  heroEvolution,
  spellEvolution,
  gearCost,
  clock,
  art,
  readProfile,
  saveProfile,
} from './data.ts'
import { traditions, activeTraditions, weaponSchools, passiveSchools, masteries, isMastery, masteryStart } from './builds.ts'
import type { School } from './builds.ts'
import { Battle } from './simulation.ts'
import { ico } from './icons.ts'
import { sound, audioEnabled, unlockAudio, battleMusic, musicEnabled, audioStatus, weaponSounds } from './audio.ts'
import type { mountBattle } from './battle.ts'

const app = document.querySelector<HTMLElement>('#app')!,
  dialogs = document.querySelector<HTMLElement>('#dialog-root')!,
  toast = document.querySelector<HTMLElement>('#toast')!
const p = readProfile()
let sim: Battle | null = null,
  field: ReturnType<typeof mountBattle> | null = null,
  screen: 'camp' | 'loading' | 'battle' = 'camp'
let panel = '',
  previewSpell = -1,
  previewBuild = 0,
  lastFocus: HTMLElement | null = null,
  session = 0,
  settled = false,
  timer = 0,
  tipTimer = 0
const img = (key: string, cls = '', alt = '') =>
  '<img class="' + cls + '" draggable="false" src="' + art(key) + '" alt="' + alt + '">'
const coin = () => img('loot-1', 'coin-icon')
function notify(msg: string) {
  toast.textContent = msg
  toast.classList.add('show')
  clearTimeout(timer)
  timer = window.setTimeout(() => toast.classList.remove('show'), 1900)
}
function persist() {
  if (!saveProfile(p)) notify('浏览器未能保存本次进度')
}
function options() {
  audioEnabled(p.audio)
  musicEnabled(p.music)
  document.documentElement.classList.toggle('calm', !p.motion)
}
options()
for (const event of ['pointerdown', 'pointerup', 'touchend', 'keydown']) {
  document.addEventListener(event, unlockAudio, { capture: true, passive: true })
}
function cardFace(i: number, evolved = false) {
  const upgrade = evolved ? upgrades[spellEvolution[i]] : undefined
  const s = spells[i]
  return (
    '<span class="card-face" style="--card:' +
    (upgrade?.color ?? s.color) +
    '">' +
    img(upgrade?.art ?? 'spell-' + i) +
    '<i class="drop-cost">' +
    s.cooldown +
    's</i><b>' +
    (upgrade?.name ?? s.short) +
    '</b></span>'
  )
}
function camp() {
  screen = 'camp'
  const h = heroes[p.hero],
    c = contracts[p.contract]
  app.innerHTML =
    '<section class="camp" style="--hero-color:' +
    h.color +
    '">' +
    '<div class="landscape"></div><div class="vignette"></div><div class="dust" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<header class="mast"><h1><img src="' +
    art('logo') +
    '" alt="沙棘乱斗 · Bramble Brawl"></h1><div class="wallet"><button class="counter" data-do="records" aria-label="查看战绩，奖杯 ' +
    p.trophies +
    '">' +
    ico('trophy') +
    '<b>' +
    p.trophies +
    '</b></button><button class="counter" data-do="forge" aria-label="进入装备工坊，金币 ' +
    p.coins +
    '">' +
    coin() +
    '<b>' +
    p.coins +
    '</b></button><button class="square" data-do="settings" aria-label="游戏设置">' +
    ico('gear') +
    '</button></div></header>' +
    '<div class="character"><div class="hero-shadow"></div>' +
    img('hero-' + p.hero, 'standee', h.name + '全身立绘') +
    '</div>' +
    '<section class="identity" aria-label="出战英雄"><span class="role">' +
    ico('aim') +
    h.role +
    '</span><h2>' +
    h.name +
    '</h2><strong class="callsign">' +
    h.en +
    '</strong><p>' +
    h.desc +
    '</p></section>' +
    '<section class="roster"><div class="roster-head"><h3>出战英雄 <small>' +
    String(p.hero + 1).padStart(2, '0') +
    ' / ' + String(heroes.length).padStart(2,'0') +
    '</small></h3><button class="guide-entry" data-do="builds">流派手册</button></div><div class="portraits">' +
    heroes
      .map(
        (v, i) =>
          '<button data-do="hero" data-i="' +
          i +
          '" class="portrait ' +
          (p.hero === i ? 'chosen' : '') +
          '" style="--accent:' +
          v.color +
          '" aria-label="选择' +
          v.name +
          '，' +
          v.role +
          '" aria-pressed="' +
          (p.hero === i) +
          '">' +
          img('face-' + i) +
          '<span>' +
          v.name +
          '</span>' +
          (p.hero === i ? '<i>' + ico('check') + '</i>' : '') +
          '</button>',
      )
      .join('') +
    '</div></section>' +
    '<aside class="equipment"><button class="deck-cover" data-do="deck" aria-label="编辑出战被动"><span class="fan">' +
    p.deck.map((i) => cardFace(i)).join('') +
    '</span><span class="metal-label">' +
    ico('cards') +
    '出战被动 ' +
    ico('next') +
    '</span></button><button class="forge-entry" data-do="forge">' +
    img('gear-0') +
    '装备工坊 ' +
    ico('next') +
    '</button></aside>' +
    '<footer class="camp-dock"><button class="contract" data-do="contracts"><span class="contract-art"></span><span class="contract-txt"><small><i></i>荒野生存 · ' +
    c.rank +
    '</small><b>' +
    c.name +
    '</b></span>' +
    ico('next') +
    '</button><button class="battle-cta" data-do="play">' +
    ico('play') +
    '开始乱斗</button></footer></section>'
  const thumbnail = app.querySelector<HTMLElement>('.contract-art')!
  thumbnail.style.backgroundImage = 'url("' + art(['quarry', 'crystal', 'foundry'][p.contract]) + '")'
}
function dialog(title: string, body: string, cls = '', dismiss = true) {
  if (!panel) lastFocus = document.activeElement as HTMLElement
  toast.classList.remove('show')
  dialogs.innerHTML =
    '<div class="scrim"><section class="sheet ' +
    cls +
    '" role="dialog" aria-modal="true" aria-label="' +
    title +
    '"><header><h2>' +
    title +
    '</h2>' +
    (dismiss
      ? '<button class="square close" data-do="close" aria-label="关闭">' + ico('cross') + '</button>'
      : '') +
    '</header><div class="sheet-body">' +
    body +
    '</div></section></div>'
  app.inert = true
  const focus = dialogs.querySelector<HTMLElement>('button:not(:disabled)')
  focus?.focus({ preventScroll: true })
}
function closeDialog() {
  dialogs.innerHTML = ''
  panel = ''
  app.inert = false
  lastFocus?.isConnected && lastFocus.focus({ preventScroll: true })
  lastFocus = null
}
function badges(keys: School[]) {
  return keys.map(key => {
    const t = traditions.find(t => t.key === key)!
    return '<span class="school-chip" style="--tone:'+t.color+'">'+t.name+'</span>'
  }).join('')
}
function schoolSummary(hero: number, deck: number[]) {
  const active = activeTraditions(hero, deck)
  return active.length ? badges(active.map(t => t.key)) : '<span class="no-school">凑齐两个同系来源可激活联动</span>'
}
function showBuilds() {
  const t = traditions[previewBuild], h = heroes[t.hero], mastery = masteries[t.key]
  const equipped = p.hero === t.hero && p.deck.join() === t.deck.join()
  const tabs = traditions.map((v,i) =>
    '<button class="tradition-tab" style="--tone:'+v.color+'" data-do="inspectBuild" data-i="'+i+'" aria-pressed="'+(i===previewBuild)+'">'+
    img(masteries[v.key].art)+'<b>'+v.name+'</b></button>').join('')
  const slots = t.deck.map(k => '<span>'+img('spell-'+k)+'<b>'+spells[k].short+'</b></span>').join('')
  const body = '<div class="tradition-tabs">'+tabs+'</div><article class="tradition-feature" style="--tone:'+t.color+'">'+
    '<div class="tradition-art">'+img('hero-'+t.hero,'',h.name)+'</div><div class="tradition-heading"><small>'+h.name+' · '+h.role+
    '</small><h3>'+t.name+'</h3><p>'+t.tactics+'</p></div></article><div class="build-slots">'+slots+'</div>'+
    '<dl class="build-rules"><dt>同系 ×2</dt><dd>'+t.effect+'</dd><dt>升级</dt><dd>'+t.priority+
    '</dd><dt>六级专精</dt><dd><b>'+mastery.name+'</b> · '+mastery.desc+'</dd></dl>'+
    '<button class="mini gold apply-build" data-do="equipBuild">'+(equipped?'已装备 · 返回营地':'采用这套出战')+'</button>'+
    '<div class="guide-links"><button class="custom-build" data-do="deck">自配被动</button><button class="custom-build" data-do="loadouts">我的搭配</button></div>'
  dialog('流派手册', body, 'guide-sheet')
  panel = 'builds'
}
function showLoadouts() {
  const saved = p.loadouts.some(v => v.hero === p.hero && v.deck.join() === p.deck.join())
  const strip = (keys: number[]) => keys.map(k=>img('spell-'+k,'',spells[k].name)).join('')
  const rows = p.loadouts.map((v,i) => '<div class="saved-row">'+img('face-'+v.hero)+
    '<div><b>'+heroes[v.hero].name+'</b><small>'+v.deck.map(k=>spells[k].short).join(' · ')+'</small></div>'+
    '<button class="mini" data-do="useSaved" data-i="'+i+'">装备</button>'+
    '<button class="custom-build" data-do="removeSaved" data-i="'+i+'" aria-label="移除这套搭配">移除</button></div>').join('')
  const body = '<div class="library-title"><b>当前出战 · '+heroes[p.hero].name+'</b><span>'+p.loadouts.length+' / 4</span></div>'+
    '<div class="saved-strip">'+strip(p.deck)+'</div><button class="mini gold apply-build" data-do="saveLoadout" '+
    (saved || p.loadouts.length>=4 ? 'disabled' : '')+'>'+(saved ? '这套搭配已收藏' : p.loadouts.length>=4 ? '收藏已满' : '收藏当前搭配')+'</button>'+rows+
    '<div class="guide-links"><button class="custom-build" data-do="deck">自配被动</button><button class="custom-build" data-do="builds">流派手册</button></div>'
  dialog('我的搭配',body)
  panel = 'loadouts'
}
function showDeck() {
  if (panel !== 'deck') previewSpell = -1
  const index = previewSpell
  const summary = '<div class="deck-summary"><div><b>'+heroes[p.hero].name+' · 当前联动</b>'+
    '<button class="custom-build" data-do="builds">流派手册</button></div>'+schoolSummary(p.hero,p.deck)+'<p>武器所属 · '+weaponSchools[p.hero].map(key=>traditions.find(t=>t.key===key)!.name).join('、')+'</p></div>'
  let detail = ''
  if (index >= 0) {
    const spell = spells[index], evo=upgrades[spellEvolution[index]], current = activeTraditions(p.hero,p.deck)
    const swaps = p.deck.includes(index) ? '' : '<div class="swap-list">'+p.deck.map((key,slot) => {
      const proposed = p.deck.map((v,n)=> n === slot ? index : v)
      const next = activeTraditions(p.hero,proposed)
      const changes = [...next.filter(t=>!current.includes(t)).map(t=>'激活 '+t.name),
        ...current.filter(t=>!next.includes(t)).map(t=>'失去 '+t.name)]
      return '<button data-do="replace" data-i="'+slot+'"><b>换下'+spells[key].short+'</b><small>'+
        (changes.join(' · ') || '联动不变')+'</small></button>'
    }).join('')+'</div>'
    detail = '<section class="card-detail"><div class="detail-name">'+img('spell-'+index)+'<div><b>'+spell.name+
      ' · '+spell.cooldown+' 秒</b><div>'+badges(passiveSchools[index])+'</div></div></div><p>'+spell.desc+'</p>'+
      '<p class="evo-preview"><strong>'+evo.name+'</strong> · '+evo.desc+'</p>'+swaps+'</section>'
  }
  const grid = spells.map((skill,i) => '<button class="collect-card '+(p.deck.includes(i)?'equipped ':'')+
    (i===index?'viewing':'')+'" style="--card:'+skill.color+'" data-do="inspect" data-i="'+i+'" aria-label="'+skill.name+'">'+
    cardFace(i)+'<strong>'+skill.name+'</strong><small>'+(p.deck.includes(i)?'已携带':skill.type)+'</small></button>').join('')
  dialog('出战被动',summary+detail+'<div class="library-title"><b>被动库</b><span>携带 3 / '+spells.length+'</span></div><div class="card-grid">'+grid+'</div>','deck-sheet')
  panel='deck'
}
function showForge() {
  dialog(
    '装备工坊',
    '<div class="forge-balance">' +
      coin() +
      '<b>' +
      p.coins +
      '</b><span>乱斗所得金币可永久强化装备。</span></div><div class="forge-list">' +
      gears
        .map(
          (g, i) =>
            '<article>' +
            img('gear-' + i) +
            '<div><h3>' +
            g.name +
            '</h3><small>等级 ' +
            p.gear[i] +
            ' / 5</small><p>' +
            g.desc +
            '</p></div><button class="mini gold" data-do="upgradeGear" data-i="' +
            i +
            '" ' +
            (p.gear[i] >= 5 || p.coins < gearCost(p.gear[i]) ? 'disabled' : '') +
            '>' +
            (p.gear[i] >= 5 ? '已满级' : coin() + gearCost(p.gear[i]) + ' 强化') +
            '</button></article>',
        )
        .join('') +
      '</div>',
  )
  panel = 'forge'
}
function showContracts() {
  dialog(
    '选择通缉令',
    '<div class="bounties">' +
      contracts
        .map(
          (c, i) =>
            '<button class="bounty ' +
            (p.contract === i ? 'active' : '') +
            '" data-do="contract" data-i="' +
            i +
            '" ' +
            (i > p.unlocked ? 'disabled' : '') +
            '><span class="bounty-icon">' +
            img(['quarry', 'crystal', 'foundry'][i]) +
            ico(i > p.unlocked ? 'lock' : i === p.contract ? 'check' : 'skull') +
            '</span><span><small>通缉令 ' +
            String(i + 1).padStart(2, '0') +
            ' · ' +
            c.rank +
            '</small><b>' +
            c.name +
            '</b><em>' +
            (i > p.unlocked
              ? '击败上一份通缉令的首领解锁'
              : clock(c.seconds) + ' 首领登场 · 赏金 ' + c.bounty) +
            '</em></span>' +
            ico('next') +
            '</button>',
        )
        .join('') +
      '</div>',
  )
  panel = 'contracts'
}
function showRecords() {
  dialog(
    '荒野战绩',
    '<div class="record-emblem">' +
      ico('trophy') +
      '<b>' +
      p.trophies +
      '</b><small>总奖杯</small></div><div class="stats">' +
      [
        ['出战场次', p.plays],
        ['讨伐成功', p.wins],
        ['单局最佳击败', p.best],
      ]
        .map(([k, v]) => '<div><b>' + v + '</b><small>' + k + '</small></div>')
        .join('') +
      '</div>',
  )
  panel = 'records'
}
function howTo() {
  return '<div class="how"><p><b>走位</b> 拖动战场移动，武器自动瞄准。桌面可用 WASD 或方向键。</p><p><b>震荡爆发</b> 轻点右下按钮或按空格，击退近敌，短暂护身。冷却 18 秒。</p><p><b>成长</b> 三个被动自动触发，武器和被动三阶可选进化。武器和被动中凑齐两个同系来源即激活联动。从六级起，每三个等级有一次选择本局唯一专精的机会。</p></div>'
}
function showSettings() {
  dialog(
    '营地设置',
    '<div class="toggles">' +
      [
        ['audio', '游戏声音', p.audio],
        ['music', '战斗音乐', p.music],
        ['motion', '动态特效', p.motion],
      ]
        .map(
          ([key, label, on]) =>
            '<button class="toggle" data-do="' +
            key +
            '" role="switch" aria-checked="' +
            on +
            '"><b>' +
            label +
            '</b><span>' +
            (on ? '开启' : '关闭') +
            '</span></button>',
        )
        .join('') +
      '</div><button class="mini sound-check" data-do="audition">' +
      (p.audio ? '试听武器音效' : '开启声音并试听') +
      '</button><h3 class="subhead">荒野手册</h3><a href="https://github.com/holynova/bramble-brawl" target="_blank" rel="noopener" style="display:block;color:inherit;text-align:center;padding:8px">GitHub · v1.3.0</a>' +
      howTo(),
  )
  panel = 'settings'
}
function buildList(s: Battle) {
  const weapon = s.evolutions.has(heroEvolution[s.hero])
    ? upgrades[heroEvolution[s.hero]].name
    : heroes[s.hero].passive
  const tracks = [
    { art: 'face-' + s.hero, name: weapon, rank: s.weaponRank },
    ...s.deck.map((k) => {
      const u = s.evolutions.has(spellEvolution[k]) ? upgrades[spellEvolution[k]] : undefined
      return { art: u?.art ?? 'spell-' + k, name: u?.name ?? spells[k].short, rank: s.passiveRanks[k] }
    }),
  ]
  return (
    '<section class="build-list"><h3>本场武器与被动</h3><div>' +
    tracks
      .map((t) => '<span>' + img(t.art) + '<b>' + t.name + ' · ' + t.rank + '阶</b></span>')
      .join('') +
    '</div>' + [...s.arsenal.schools].map(key => {
      const t = traditions.find(t => t.key === key)!
      return '<p class="battle-school"><b style="color:'+t.color+'">'+t.name+'</b> · 触发 '+s.arsenal.triggers[key]+
        ' 次'+(s.arsenal.mastery === key ? ' · '+masteries[key].name : '')+'</p>'
    }).join('') + '</section>'
  )
}
function updateBuild(s: Battle, id: number) {
  if (isMastery(id)) banner('流派专精 · ' + masteries[traditions[id-masteryStart].key].name)
  if (isEvolution(id)) banner('已觉醒 · ' + upgrades[id].name)
  const hero = s.evolutions.has(heroEvolution[s.hero]) ? upgrades[heroEvolution[s.hero]].name : '武器'
  const label = document.getElementById('hero-evo')!
  label.textContent = hero + ' ' + s.weaponRank + '阶'
  label.hidden = false
  for (const k of s.deck) {
    const el = document.querySelector<HTMLElement>('[data-passive="' + k + '"]')!
    const evo = s.evolutions.has(spellEvolution[k]) ? upgrades[spellEvolution[k]] : undefined
    el.classList.toggle('awakened', !!evo)
    const name = evo?.name ?? spells[k].short
    el.querySelector('img')!.src = art(evo?.art ?? 'spell-' + k)
    el.querySelector('.rank')!.textContent = String(s.passiveRanks[k])
    el.title = name + ' · ' + s.passiveRanks[k] + '阶'
    el.setAttribute('aria-label', el.title + '，自动触发')
  }
}
function showPause() {
  if (!sim || screen !== 'battle' || sim.phase !== 'play') return
  field?.pause(true)
  battleMusic(false)
  dialog(
    '战斗暂停',
    '<div class="pause-note">' +
      contracts[p.contract].name +
      ' · 第 ' +
      sim.wave +
      ' 波 · ' +
      clock(sim.age) +
      '</div>' +
      buildList(sim) +
      howTo() +
      '<div class="actions"><button class="mini" data-do="retreat">撤回营地</button><button class="mini gold" data-do="resume">继续战斗</button></div>',
    '',
    false,
  )
  panel = 'pause'
}
function showPick() {
  const s = sim!
  field?.pause(true)
  battleMusic(false)
  sound('level')
  dialog(
    '升级 · 选择成长',
    '<p class="intro center">等级 ' +
      s.level +
      ' · 选一项带入本场战斗</p><div class="pick-list">' +
      s.choices
        .map((i) => {
          const u = s.upgradeInfo(i)
          return (
            '<button class="pick ' +
            (isEvolution(i) || isMastery(i) ? 'evolution-choice' : 'support-choice') +
            '" data-do="pick" data-i="' +
            i +
            '" style="--card:' +
            u.color +
            '">' +
            img(u.art) +
            '<span><em>' +
            u.source +
            '</em><b>' +
            u.name +
            '</b><small>' +
            u.desc +
            '</small></span>' +
            ico('next') +
            '</button>'
          )
        })
        .join('') +
      '</div>',
    '',
    false,
  )
  panel = 'pick'
}
function leaveField() {
  session++
  battleMusic(false)
  clearTimeout(tipTimer)
  field?.destroy()
  field = null
  sim = null
  closeDialog()
  camp()
}
function finish(retreat = false) {
  if (!sim || settled) return
  const s = sim,
    win = s.phase === 'won'
  settled = true
  field?.pause(true)
  battleMusic(false)
  const reward = s.coins,
    trophy = win ? 10 + p.contract * 5 : Math.floor(s.kills / 20)
  p.plays++
  p.coins += reward
  p.best = Math.max(p.best, s.kills)
  p.trophies += trophy
  if (win) {
    p.wins++
    p.unlocked = Math.max(p.unlocked, Math.min(2, p.contract + 1))
  }
  const nextContract = win && p.contract + 1 < contracts.length ? contracts[p.contract + 1] : null
  persist()
  sound(win ? 'win' : 'lose')
  dialog(
    win ? '通缉完成！' : retreat ? '已返回营地' : '本场战报',
    '<div class="result-hero">' +
      img('hero-' + p.hero) +
      '<div><small>' +
      contracts[p.contract].name +
      '</small><h3>' +
      (win ? '晶核巨像已击败' : retreat ? '整备后再出发' : '英雄倒下了') +
      '</h3><p>' +
      heroes[p.hero].name +
      ' · 等级 ' +
      s.level +
      '</p></div></div><div class="stats"><div><b>' +
      clock(s.age) +
      '</b><small>存活时间</small></div><div><b>' +
      s.kills +
      '</b><small>击败敌人</small></div><div><b>' +
      s.chests +
      '</b><small>遗物宝箱</small></div></div><div class="payout">' +
      coin() +
      ' +' +
      reward +
      ' ' +
      ico('trophy') +
      ' +' +
      trophy +
      '</div>' +
      buildList(s) +
      (nextContract ? '<p class="next-bounty">下一份通缉令 · ' + nextContract.name + '</p>' : '') +
      '<div class="actions"><button class="mini" data-do="camp">回到营地</button>' +
      (nextContract
        ? '<button class="mini gold" data-do="advance">挑战下一关</button>'
        : '<button class="mini gold" data-do="again">再来一局</button>') +
      '</div>',
    'result',
    false,
  )
  panel = 'result'
}
function banner(msg: string, timeout = 1800) {
  const el = document.getElementById('banner')
  if (!el) return
  clearTimeout(tipTimer)
  el.textContent = msg
  el.classList.add('on')
  tipTimer = window.setTimeout(() => el.classList.remove('on'), timeout)
}
async function start() {
  if (screen !== 'camp') return
  closeDialog()
  screen = 'loading'
  settled = false
  const id = ++session,
    s = new Battle(p)
  sim = s
  app.innerHTML =
    '<section class="battle-screen"><div id="field" aria-label="战场，拖动移动"></div><div id="stick" hidden><i></i></div><header class="hud"><div class="vitals"><div class="mini-face">' +
    img('face-' + p.hero) +
    '</div><div><b>' +
    heroes[p.hero].name +
    ' <small id="lv"></small><small id="hero-evo" hidden></small></b><div class="hp"><i id="hpbar"></i><span id="hptext"></span></div></div></div><div class="wave-time"><span id="wave"></span><b id="clock"></b></div><button class="square" data-do="pause" aria-label="暂停战斗">' +
    ico('pause') +
    '</button></header><div class="xp"><i id="xpbar"></i></div><div id="boss" hidden><strong>晶核巨像</strong><i><b></b></i></div><div id="banner"></div><div class="kills">' +
    ico('skull') +
    '<b id="kills">0</b></div><div id="hurt-frame" aria-hidden="true"></div><aside class="passive-tray" aria-label="自动被动"><small>自动被动</small><div>' +
    s.deck
      .map(
        (k) =>
          '<span class="passive-tile" data-passive="' +
          k +
          '">' +
          img('spell-' + k) +
          '<i class="rank">1</i><b class="cd"></b></span>',
      )
      .join('') +
    '</div></aside><button class="nova-button" data-do="nova" aria-label="释放震荡爆发"><span class="nova-disc">' +
    img('nova') +
    '<strong id="nova-cd"></strong></span><b>震荡爆发</b></button><div id="loading"><div class="loader"></div><b>正在进入矿谷…</b></div></section>'
  try {
    const { mountBattle } = await import('./battle.ts')
    if (id !== session) return
    field = mountBattle(
      document.getElementById('field')!,
      s,
      {
        ready() {
          if (id !== session) return
          screen = 'battle'
          battleMusic(true)
          document.getElementById('loading')?.remove()
          hud()
          updateBuild(s, -1)
          banner('拖动走位 · 被围时点震荡爆发', 3400)
          if (document.hidden) showPause()
        },
        update: hud,
        hurt() {
          const el = document.getElementById('hurt-frame')
          if (el) el.animate([{ opacity: 0.87 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' })
        },
        complete() {
          if (id === session) {
            hud()
            finish()
          }
        },
        wave(n) {
          sound('wave')
          banner(n > waveNames.length ? '首领现身 · 晶核巨像' : '第 ' + n + ' 波 · ' + waveNames[n - 1])
        },
        fault() {
          if (id !== session) return
          dialog(
            '战场资源加载失败',
            '<p>请检查连接后重试。</p><div class="actions"><button class="mini gold" data-do="camp">回到营地</button></div>',
            '',
            false,
          )
          panel = 'error'
        },
      },
      p.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
  } catch {
    if (id !== session) return
    dialog(
      '战场未能启动',
      '<p>请重新进入矿谷。</p><button class="mini gold" data-do="camp">回到营地</button>',
      '',
      false,
    )
    panel = 'error'
  }
}
function hud() {
  const s = sim
  if (!s || screen !== 'battle') return
  const put = (id: string, value: string | number) => {
    const e = document.getElementById(id)!
    if (e.textContent !== String(value)) e.textContent = String(value)
  }
  put('lv', 'Lv.' + s.level)
  put('hptext', Math.ceil(s.player.hp) + ' / ' + s.player.max)
  put('wave', s.bossId ? '首领战 · 已用时' : waveNames[s.wave - 1] + ' ' + s.wave + '/6 · 首领倒计时')
  put('clock', clock(s.bossId ? s.age : Math.ceil(Math.max(0, contracts[s.contract].seconds - s.age))))
  put('kills', s.kills)
  for (const [id, ratio] of [
    ['hpbar', s.player.hp / s.player.max],
    ['xpbar', s.xp / s.need],
  ] as const)
    document.getElementById(id)!.style.transform = 'scaleX(' + Math.max(0, Math.min(1, ratio)) + ')'
  const boss = s.enemies.find((e) => e.id === s.bossId),
    box = document.getElementById('boss')!
  box.hidden = !boss
  if (boss) box.querySelector('i>b')!.setAttribute('style', 'width:' + (100 * boss.hp) / boss.max + '%')
  const active = document.querySelector<HTMLButtonElement>('.nova-button')!
  const cd = Math.ceil(s.novaTimer)
  put('nova-cd', cd ? cd + 's' : '')
  const label = cd ? '震荡爆发，冷却 ' + cd + ' 秒' : '释放震荡爆发'
  if (active.getAttribute('aria-label') !== label) active.setAttribute('aria-label', label)
  active.disabled = cd > 0
  active.style.setProperty('--charge', 100 * (1 - s.novaTimer / nova.cooldown) + '%')
  for (const k of s.deck) {
    const el = document.querySelector<HTMLElement>('[data-passive="' + k + '"]')!
    const seconds = Math.ceil(s.passiveTimers[k])
    const count = el.querySelector('.cd')!
    const text = seconds ? seconds + 's' : '就绪'
    if (count.textContent !== text) count.textContent = text
    el.classList.toggle('fired', s.passiveUses[k] > 0 && s.passiveCooldown(k) - s.passiveTimers[k] < 0.5)
  }
  if (panel) return
  if (s.phase === 'upgrade') showPick()
}
function activate() {
  if (screen === 'battle' && !panel && field?.activate()) hud()
}
function dismiss() {
  if (panel === 'pause') {
    closeDialog()
    field?.pause(false)
    battleMusic(true)
    return
  }
  if (['pick', 'result', 'error', 'retreat'].includes(panel)) return
  closeDialog()
}
document.addEventListener('click', (e) => {
  const button = (e.target as Element).closest<HTMLButtonElement>('button[data-do]')
  if (!button) {
    if ((e.target as Element).classList.contains('scrim')) dismiss()
    return
  }
  unlockAudio()
  sound('click')
  const action = button.dataset.do,
    i = Number(button.dataset.i)
  switch (action) {
    case 'hero':
      p.hero = i
      persist()
      camp()
      if (innerWidth < 801 && getComputedStyle(app.querySelector('.identity p')!).display === 'none')
        notify(heroes[i].desc)
      break
    case 'nova':
      activate()
      break
    case 'audition':
      if (!p.audio) {
        p.audio = true
        options()
        persist()
        showSettings()
      }
      unlockAudio()
      sound(weaponSounds[p.hero])
      if (audioStatus().state === 'unavailable') notify('当前浏览器无法播放游戏音效')
      break
    case 'play':
      void start()
      break
    case 'builds':
      previewBuild = Math.max(0,traditions.findIndex(t => t.hero === p.hero))
      showBuilds()
      break
    case 'inspectBuild':
      previewBuild = i
      showBuilds()
      break
    case 'equipBuild': {
      const selected = traditions[previewBuild]
      p.hero = selected.hero
      p.deck = [...selected.deck]
      persist()
      closeDialog()
      camp()
      notify('已装备 · ' + selected.name)
      break
    }
    case 'loadouts':
      showLoadouts()
      break
    case 'saveLoadout':
      if (p.loadouts.length < 4 && !p.loadouts.some(v=>v.hero===p.hero && v.deck.join()===p.deck.join())) {
        p.loadouts.push({hero:p.hero, deck:[...p.deck]})
        persist()
      }
      showLoadouts()
      break
    case 'useSaved': {
      const saved = p.loadouts[i]
      if (!saved) break
      p.hero = saved.hero
      p.deck = [...saved.deck]
      persist()
      closeDialog()
      camp()
      notify('已装备收藏搭配')
      break
    }
    case 'removeSaved':
      p.loadouts.splice(i,1)
      persist()
      showLoadouts()
      break
    case 'deck':
      showDeck()
      break
    case 'inspect':
      previewSpell = i
      showDeck()
      break
    case 'replace':
      if (previewSpell >= 0 && !p.deck.includes(previewSpell)) {
        p.deck[i] = previewSpell
        persist()
        camp()
        showDeck()
        notify('出战被动已保存')
      }
      break
    case 'forge':
      showForge()
      break
    case 'upgradeGear': {
      const cost = gearCost(p.gear[i])
      if (p.gear[i] < 5 && p.coins >= cost) {
        p.coins -= cost
        p.gear[i]++
        persist()
        camp()
        showForge()
        sound('level')
      }
      break
    }
    case 'records':
      showRecords()
      break
    case 'contracts':
      showContracts()
      break
    case 'contract':
      if (i <= p.unlocked) {
        p.contract = i
        persist()
        closeDialog()
        camp()
      }
      break
    case 'settings':
      showSettings()
      break
    case 'audio':
    case 'music':
    case 'motion':
      p[action] = !p[action]
      options()
      if (action === 'audio' && p.audio) {
        unlockAudio()
        sound('hit')
      }
      persist()
      showSettings()
      break
    case 'close':
    case 'resume':
      dismiss()
      break
    case 'pause':
      showPause()
      break
    case 'pick':
      if (sim?.phase === 'upgrade' && sim.choices.includes(i)) {
        sim.choose(i)
        closeDialog()
        field?.pause(false)
        battleMusic(true)
        hud()
        updateBuild(sim, i)
      }
      break
    case 'retreat':
      dialog(
        '结束本场乱斗？',
        '<p>已获得的金币会带回营地，本局强化随战斗结束。</p><div class="actions"><button class="mini" data-do="cancelRetreat">继续作战</button><button class="mini gold" data-do="confirmRetreat">带回金币</button></div>',
        '',
        false,
      )
      panel = 'retreat'
      break
    case 'cancelRetreat':
      closeDialog()
      field?.pause(false)
      battleMusic(true)
      break
    case 'confirmRetreat':
      finish(true)
      break
    case 'camp':
      leaveField()
      break
    case 'advance':
      if (sim?.phase === 'won' && p.contract < p.unlocked) {
        p.contract++
        persist()
        leaveField()
        void start()
      }
      break
    case 'again':
      leaveField()
      void start()
      break
  }
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && panel) {
    const focusable = Array.from(dialogs.querySelectorAll<HTMLElement>('button:not(:disabled)'))
    const at = focusable.indexOf(document.activeElement as HTMLElement)
    if (focusable.length && ((e.shiftKey && at === 0) || (!e.shiftKey && at === focusable.length - 1))) {
      e.preventDefault()
      focusable[e.shiftKey ? focusable.length - 1 : 0].focus()
    }
    return
  }
  if (e.repeat) return
  if (e.key === 'Escape') {
    if (panel) dismiss()
    else if (screen === 'battle') showPause()
  }
  if (e.code === 'Space' && screen === 'battle' && !panel) {
    e.preventDefault()
    activate()
  }
})
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'battle' && !panel) showPause()
})
camp()
