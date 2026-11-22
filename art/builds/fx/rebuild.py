from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parent
raw = out/'kit-master.png'
im = Image.open(raw).convert('RGBA')
assert im.size==(1536,1024)
proof = Image.new('RGB',(6*72,150),(176,142,102))
draw = ImageDraw.Draw(proof)
for i in range(6):
    row,col = divmod(i,3)
    tile = im.crop((col*512,row*512,(col+1)*512,(row+1)*512))
    # Remove only subvisible diffusion from the generated transparent cells.
    alpha = tile.getchannel('A').point(lambda a: round(255*max(0,min(1,(a-18)/220))))
    tile.putalpha(alpha)
    tile=tile.crop(alpha.getbbox())
    tile.thumbnail((174,174),Image.Resampling.LANCZOS)
    square=Image.new('RGBA',(192,192))
    square.alpha_composite(tile,((192-tile.width)//2,(192-tile.height)//2))
    dest=out/f'kit-{i}.webp'
    square.save(dest,quality=92,method=6,alpha_quality=100)
    actual=Image.open(dest)
    assert actual.mode=='RGBA' and actual.size==(192,192)
    a=actual.getchannel('A')
    assert a.getextrema()==(0,255)
    bounds=a.getbbox()
    assert max(abs((bounds[axis]+bounds[axis+2])/2-96) for axis in (0,1))<=1
    for size,y in ((48,5),(28,68),(16,109)):
        small=actual.resize((size,size),Image.Resampling.LANCZOS)
        proof.paste(small,(i*72+(72-size)//2,y),small)
    draw.text((i*72+22,131),f'kit-{i}',fill=(44,31,25))
    print(dest.name,bounds,dest.stat().st_size)
proof.save(out/'kit-size-check.png')

