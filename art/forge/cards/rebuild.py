from pathlib import Path
from PIL import Image, ImageDraw
out=Path(__file__).resolve().parent
master=Image.open(out/'cards-master.png').convert('RGB')
assert master.size==(1536,1024)
proof=Image.new('RGB',(6*64,68),'#272432')
draw=ImageDraw.Draw(proof)
for i in range(6):
    row,col=divmod(i,3)
    # Native atlas cells are exact 512-pixel squares. Inset two pixels per side.
    x,y=col*512,row*512
    raw=master.crop((x+2,y+2,x+510,y+510))
    tile=raw.resize((384,384),Image.Resampling.LANCZOS)
    path=out/f'spell-{i+12}.webp'
    tile.save(path,quality=92,method=6)
    actual=Image.open(path)
    assert (actual.size,actual.mode)==((384,384),'RGB')
    proof.paste(actual.resize((48,48),Image.Resampling.LANCZOS),(i*64+8,2))
    draw.text((i*64+8,51),f'spell-{i+12}',fill='#f2ecdf')
    print(path.name,path.stat().st_size)
proof.save(out/'proof-48px.png')
