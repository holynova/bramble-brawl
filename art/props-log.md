# 战场摆设与拾取物

场景装饰最长边为 320 像素，拾取物最长边为 192 像素。八张 WebP 保留透明通道，使用图像底部中心作为落地锚点。

| 文件 | 内容 |
| --- | --- |
| prop-0.webp | 红花仙人掌与砂岩 |
| prop-1.webp | 载金矿车 |
| prop-2.webp | 紫晶矿脉 |
| prop-3.webp | 木箱与桶 |
| loot-0.webp | 青绿经验水晶 |
| loot-1.webp | 星纹金币 |
| loot-2.webp | 红心回血果 |
| loot-3.webp | 紫金装备宝箱 |

## 原画和提示词

内置 ImageGen 原画为 `source-images/exec-3b164191-93b2-4be9-b473-2185355a1688.png`。

Use case: stylized-concept. Single production-ready game sprite atlas, landscape 2:1 ratio, eight isolated 3D props perfectly separated in a logical 4-column 2-row grid of equal square cells. TRUE transparent alpha background with no backdrop, no floor tile, no text, no frames or linework around cells. Within each item keep natural ambient occlusion but no cast shadow on the background. Zoom out enough to leave clear transparent padding of at least 12% of each cell on all sides and ample space between neighboring sprites. Every sprite fully visible, no overlapping. Perspective identical across items: 3/4 top-down approximately 45-degree elevated camera for a cheerful desert canyon arena, facing viewer and very slightly left, colorful Supercell Brawl Stars-inspired mobile brawler props, not flat icons. Render chunky bevelled toy-like proportions, round and angular cartoon forms, high quality cinematic lighting with warm top-left illumination and dark colored outlines, very strong silhouettes, restrained surface detail, high readability at small size. 8 objects in exact left-to-right reading order. FIRST ROW with larger scenery props: (1) cluster of bulky emerald saguaro cacti with short thick arms and a scarlet red flower, pink sandstone boulders at the base; (2) small old rustic wooden minecart with square iron-reinforced rim and four iron wheels, full of yellow gold ore nuggets, no tracks; (3) a chunky outcrop of three sharp luminous violet quartz crystals rooted in one flat gray rock, sparkling; (4) one short square wood crate reinforced by brass corners beside one small oak barrel, bound as a single compact group. SECOND ROW, with four pickups, each a simple dramatic silhouette, no surrounding textured terrain: (1) a single small vertical faceted tapered aqua-green experience gem, vivid jade body and mint highlights, cut emerald many faces; (2) a single fat gold coin leaning 75 degrees up, its gold raised five-point star facing camera, readable bright yellow edges; (3) a single glossy red heart-shaped healing cactus fruit with visible green leaves, pink highlight, saturated red love-heart outline, short stem; (4) a closed opulent dark purple and gold treasure chest with gold latch and bright cyan jewel, bold brass bands, magical highlights. No loose drifting particles, floating props, lettering, or typesetting. Each entire item remains an indivisible single island.

## 重建

使用安装 Pillow 且支持 WebP 的 Python 3 执行以下脚本。

```python
from pathlib import Path
from PIL import Image
project=Path('.')
raw=Path('source-images/exec-3b164191-93b2-4be9-b473-2185355a1688.png')
atlas=Image.open(raw).convert('RGBA')
w,h=atlas.size
for i in range(8):
    row,col=divmod(i,4)
    box=round(w*col/4),round(h*row/2),round(w*(col+1)/4),round(h*(row+1)/2)
    tile=atlas.crop(box)
    alpha=tile.getchannel('A')
    visible=alpha.point(lambda a: 255 if a>=25 else 0).getbbox()
    l,t,r,b=visible
    tile=tile.crop((max(0,l-2),max(0,t-2),min(tile.width,r+2),min(tile.height,b+2)))
    edge=320 if row==0 else 192
    tile.thumbnail((edge,edge), Image.Resampling.LANCZOS)
    name=f'prop-{col}.webp' if row==0 else f'loot-{col}.webp'
    path=project/'public'/'art'/name
    tile.save(path,quality=90,method=6,alpha_quality=100)
    result=Image.open(path)
    assert result.mode=='RGBA' and result.getchannel('A').getextrema()==(0,255)
    print(name,result.size,path.stat().st_size)
```
