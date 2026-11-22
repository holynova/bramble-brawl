# 技能牌与装备图标

九宫格原画由内置 ImageGen 生成，每格对应一件游戏资产。每张交付图均为 384 × 384 的 WebP，位于 `public/art/`。

| 文件 | 图标 |
| --- | --- |
| spell-0.webp | 芽炮 |
| spell-1.webp | 雷击 |
| spell-2.webp | 火球 |
| spell-3.webp | 冰晶 |
| spell-4.webp | 种子旋风 |
| spell-5.webp | 金棘盾 |
| gear-0.webp | 矿工护手 |
| gear-1.webp | 翠石长靴 |
| gear-2.webp | 金棘徽章 |

## 原画和提示词

原画路径为 `source-images/exec-d1bd866a-60f3-44dc-944a-3fa6e172b546.png`。

Use case: stylized-concept. Asset type: a single square 3-by-3 perfectly regular all-over battle-card and gear icon atlas for a premium mobile arena brawler, ready to slice into nine small squares. Every panel is edge-to-edge, exactly square and of identical size with zero border, frame, margin, gutter, caption, numeral, typography, or divider. Background color abruptly switches at precise thirds. Make hyper-polished original Supercell Clash Royale / Brawl Stars inspired collectible equipment and spell splash art, expressive stylized sculpted 3D with chunky beveled edges, highlights, tactile hard forms, strong dark separation, hard graphic lighting with vignette and abstract radiant shapes, high contrast warm spectral metallic highlights in Brawl Stars animated cinematics. Readable bold single central subject per tile; any supporting effects must be subordinate. Distinct key color per square; art bleeds to each tile's four edges; no artwork crosses a tile edge. In exact reading order: Top left a charismatic living chubby jade cactus sprout cannon, circular open barrel muzzle on face firing a glowing gold seed, lime and dark forest green background. Top middle spectacular thick white-hot cyan angular fork of magical lightning gouging a violet-purple thundercloud backed by deep violet comic rays. Top right a single white hot orange comet fireball with flames on a powerful diagonal and red smoky background. Middle left monumental faceted cyan snowflake-shaped ice crystal bursting in icicles and intense cold aqua rays against Prussian blue. Middle center whirling bright spring-green seed tornado, small golden seeds suspended along a clear lime spiral on iridescent grassy green. Middle right legendary heavy spiked shield in burnished gold iron with protective crown boss, theatrical amber glow against dark violet background. Bottom left a single massive chunky brass and burnt leather miner's fist gauntlet with copper plate knuckles floating diagonally against red clay gradient. Bottom middle a single ornate turquoise desert-running boot with cyan leather, gold trim, embossed sole and visible ankle against nocturnal blue teal speed streaks. Bottom right embossed five-pointed gold western thorn badge with a polished emerald cactus medallion center, dark inlaid engraved lines, violet and gold glint backdrop. Every subject stays inside its tile. Design each tightly centered, similar visual weight with the central foreground object covering about 75% of its tile. Sharp readable silhouettes, collectible loot appeal. Zero text or logos anywhere.

## 从原画重建

须安装 Python 3 和 WebP 的 `cwebp` 命令，按以下脚本处理。裁切边界根据原画上的实际分区逐行校准，四周各收 1 像素。

```python
from pathlib import Path
import subprocess

project=Path('.')
raw=Path('source-images/exec-d1bd866a-60f3-44dc-944a-3fa6e172b546.png')
columns=(0,418,836,1254)
rows=(0,417,817,1254)
for i in range(9):
    r,c=divmod(i,3)
    name=f'spell-{i}.webp' if i<6 else f'gear-{i-6}.webp'
    l,t=columns[c]+1,rows[r]+1
    w,h=columns[c+1]-l-1,rows[r+1]-t-1
    path=project/'public'/'art'/name
    subprocess.run(['cwebp','-quiet','-m','6','-q','91','-crop',str(l),str(t),str(w),str(h),'-resize','384','384',str(raw),'-o',str(path)],check=True)
    print(name,path.stat().st_size)
```
