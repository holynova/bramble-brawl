from pathlib import Path
from PIL import Image, ImageDraw

out=Path(__file__).resolve().parent
raw=Path('source-images/exec-a27a79b0-ee0c-41f8-b498-60bf9d2eb59a.png')
atlas=Image.open(raw).convert('RGBA')
assert atlas.size==(1536,1024)
# Upper jagged rock ridge starts left of the geometrical 2/3 split.
columns=(0,496,992,1536)
rows=(0,513,1024)
proof=Image.new('RGB',(6*92,160),'#a98360')
for i in range(6):
    row,col=divmod(i,3)
    tile=atlas.crop((columns[col],rows[row],columns[col+1],rows[row+1]))
    alpha=tile.getchannel('A').point(lambda a: round(255*max(0,min(1,(a-18)/215))))
    tile.putalpha(alpha)
    tile=tile.crop(alpha.getbbox())
    tile.thumbnail((192,192),Image.Resampling.LANCZOS)
    target=out/f'evo-fx-{i}.webp'
    tile.save(target,quality=92,method=6,alpha_quality=100)
    actual=Image.open(target)
    assert actual.mode=='RGBA' and actual.getchannel('A').getextrema()==(0,255)
    for edge,cy in [(55,40),(24,97),(16,135)]:
        small=actual.copy()
        small.thumbnail((edge,edge),Image.Resampling.LANCZOS)
        proof.paste(small,(i*92+(92-small.width)//2,cy-small.height//2),small)
    print(target.name,actual.size,target.stat().st_size)
proof.save(out/'size-check.png')
