from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageStat, ImageChops

out = Path(__file__).resolve().parent
raw = out.parent / 'masters'
sources = [
    ('spell', 6, 'passives.png', (0,512,1024,1536), (0,512,1024), 384),
    ('evo', 9, 'evolutions.png', (0,418,836,1254), (0,417,794,1254), 192)
]
proof = Image.new('RGB',(7*64,3*72+6),(39,33,53))
draw = ImageDraw.Draw(proof)
for group, start, filename, cols, rows, size in sources:
    im = Image.open(raw / filename).convert('RGB')
    count = (len(cols)-1)*(len(rows)-1)
    for index in range(count):
        r,c = divmod(index,len(cols)-1)
        # Atlas paintings are not perfectly square cells. Preserve geometry in the final icon.
        tile = im.crop((cols[c]+2,rows[r]+2,cols[c+1]-2,rows[r+1]-2))
        tile = ImageOps.fit(tile,(size,size),Image.Resampling.LANCZOS)
        path = out / f'{group}-{start+index}.webp'
        tile.save(path,quality=93,method=6,sharp_yuv=True)
        actual = Image.open(path)
        assert (actual.size,actual.mode)==((size,size),'RGB')
        # Compare the exported colors to the normalized source, detecting damaged encodes.
        error=ImageStat.Stat(ImageChops.difference(actual,tile)).rms
        assert sum(error)/len(error)<12 and max(error)<20,(path,error)
        if group=='spell':
            gx,gy=index,0
        else:
            gx,gy=index%6,1+index//6
        x,y=gx*64+8,gy*72+4
        proof.paste(actual.resize((48,48),Image.Resampling.LANCZOS),(x,y))
        draw.text((x,y+49),f'{group} {start+index}',fill=(244,239,230))
        print(path.name, path.stat().st_size)
proof.save(out/'cards-48px.png')

