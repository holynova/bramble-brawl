import { build } from 'vite'
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
const destination = path.resolve(process.argv[2] ?? 'release/沙棘乱斗.html')
const built = await build({
  configFile: false,
  base: './',
  logLevel: 'error',
  publicDir: false,
  build: {
    write: false,
    lib: { entry: 'src/main.ts', name: 'BrambleBrawl', formats: ['iife'] },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
const outputs = (Array.isArray(built) ? built : [built]).flatMap((result) => result.output)
const js = outputs.find((o) => o.type === 'chunk').code
const css = outputs.find((o) => o.fileName.endsWith('.css')).source.toString()
const files = (await readdir('public/art')).filter((f) => f.endsWith('.webp') && f !== 'arena.webp' && !/^unit-\d+\.webp$/.test(f))
const encoded = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file.slice(0, -5),
      (await readFile('public/art/' + file)).toString('base64'),
    ]),
  ),
)
const init =
  'const raw=' +
  JSON.stringify(encoded) +
  ';window.brambleArt={};for(const [name,data] of Object.entries(raw)){const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));window.brambleArt[name]=URL.createObjectURL(new Blob([bytes],{type:"image/webp"}));} const css=' +
  JSON.stringify(css) +
  ';const style=document.createElement("style");style.textContent=css.replace(/url\\((["\x27]?)(?:[^)]*?\\/)?art\\/([\\w-]+)\\.webp\\1\\)/g,(_,q,n)=>"url("+window.brambleArt[n]+")");document.head.append(style);'
const html =
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#172133"><title>沙棘乱斗 · Bramble Brawl</title></head><body><main id="app"></main><div id="dialog-root"></div><div id="toast" role="status"></div><script>' +
  init.replace(/<\/script/gi, '<\\/script') +
  '</script><script>' +
  js.replace(/<\/script/gi, '<\\/script') +
  '</script></body></html>'
await mkdir(path.dirname(destination), { recursive: true })
await writeFile(destination, html)
console.log(destination, Math.round(Buffer.byteLength(html) / 1024) + ' KiB')
