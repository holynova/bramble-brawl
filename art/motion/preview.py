from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps,ImageFilter
import argparse
parser=argparse.ArgumentParser(description='将游戏使用的十一套动作图集输出为 GIF。')
parser.add_argument('output',type=Path)
parser.add_argument('--font',default='/System/Library/Fonts/STHeiti Medium.ttc')
args=parser.parse_args()
art=Path(__file__).resolve().parents[2]/'public'/'art'
target=args.output
target.parent.mkdir(parents=True,exist_ok=True)
bg=ImageOps.fit(Image.open(art/'quarry.webp').convert('RGB'),(920,772)).filter(ImageFilter.GaussianBlur(6)).convert('RGBA')
bg=Image.alpha_composite(bg,Image.new('RGBA',bg.size,(17,29,48,214)))
font=args.font
def txt(size): return ImageFont.truetype(font,size)
def labels(d,x,y,t,size,color,anchor='la'): d.text((x,y),t,font=txt(size),fill=color,anchor=anchor)
names=['刺头','霹雳','铁墩','回砂','烬铃','缝影','短刀地精','紫翼蝠','矿甲斗士','晶核巨像','炮芽哨兵']
sheets=[Image.open(art/f'anim-{i}.webp').convert('RGBA') for i in [0, 1, 2, 8, 9, 10, 3, 4, 5, 6, 7]]
# Some cells are deliberately held. Playback changes stage only at an action boundary.
stages=[('待机',list(range(4))*2,190),('移动 · 振翅 · 破土',list(range(4,8))*3,115),('蓄力 · 命中 · 收招',list(range(8,12))*2,180),('受击',[12,13],225),('倒地 · 枯萎',[14,15,15],275)]
frames=[]; durations=[]
for state,indices,delay in stages:
 for fi in indices:
  im=bg.copy();d=ImageDraw.Draw(im)
  labels(d,26,18,'沙棘乱斗',29,'#ffdb8c')
  labels(d,165,25,'全员动作',19,'#edf4ff')
  labels(d,892,28,state,20,'#b7e0f2','ra')
  for n,name in enumerate(names):
   col=n%4; row=n//4; x=22+col*221; y=67+row*232
   d.rounded_rectangle((x,y,x+208,y+220),radius=12,fill=(39,51,65),outline=(79,87,96),width=2)
   d.ellipse((x+62,y+162,x+145,y+176),fill=(27,35,45))
   bbox=(fi%4*192,fi//4*192,(fi%4+1)*192,(fi//4+1)*192)
   im.alpha_composite(sheets[n].crop(bbox),(x+8,y-3))
   labels(d,x+104,y+191,name,20,'#fff0c7','ma')
  frames.append(im.convert('RGB')); durations.append(delay)
frames[0].save(target,save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=True,disposal=1)
print(target,target.stat().st_size)
