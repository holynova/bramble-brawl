from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageChops
import hashlib
import json

DEST = Path(__file__).resolve().parent
RAW = Path('source-images')
SHEETS = {6: '28e3532c-989e-4676-adcc-35c8c0c608d6', 7: '6fffaef2-b6e5-41b4-a0c4-40922d40fec7'}
EVOLUTION = 'e56ddeff-bd71-4856-8bed-c51708ccbfb7'
results = {}

def prepare_sprite_sheet(unit, image_id):
    raw = Image.open(RAW / f'exec-{image_id}.png').convert('RGBA')
    assert raw.size == (1254, 1254)
    # Discard the generator's faint diffuse matte and retain antialiasing on the silhouette.
    clean_alpha = raw.getchannel('A').point(lambda a: round(255 * max(0, min(1, (a-105)/123))))
    raw.putalpha(clean_alpha)
    frame_size = 192
    frame_scale = 0.615 if unit == 6 else 0.585
    result = Image.new('RGBA',(768,768))
    stats = []
    frame_hashes = set()
    for i in range(16):
        row, col = divmod(i,4)
        xcuts = [0,314,627,940,1254]
        ycuts = [0,314,627,940,1254]
        if unit == 6 and row == 3:
            # The trailing fist in the stagger pose extends 5 pixels past the column midpoint.
            xcuts[2] = 640
        slot = raw.crop((xcuts[col], ycuts[row], xcuts[col+1], ycuts[row+1]))
        visible = slot.getchannel('A').getbbox()
        sprite = slot.crop(visible)
        # The pot is fixed to the ground. Its base is a better registration point than the
        # outer silhouette, which also includes leaves, head recoil and the fired seed.
        anchor_x = sprite.width / 2
        if unit == 7 and i < 15:
            base = sprite.getchannel('A').crop((0,sprite.height-12,sprite.width,sprite.height-3)).getbbox()
            anchor_x = (base[0]+base[2])/2
        width, height = (round(n*frame_scale) for n in sprite.size)
        sprite = sprite.resize((width,height),Image.Resampling.LANCZOS)
        x, y = round(96-anchor_x*frame_scale), 175-height
        assert 0 <= x and x+width <= frame_size and 0 <= y,(unit,i,x,width,y,height)
        frame = Image.new('RGBA',(frame_size,frame_size))
        frame.alpha_composite(sprite,(x,y))
        bounds = frame.getchannel('A').getbbox()
        assert bounds[1] > 0 and bounds[3] == 175 and bounds[2]<192
        fingerprint = hashlib.sha256(frame.tobytes()).hexdigest()
        assert fingerprint not in frame_hashes
        frame_hashes.add(fingerprint)
        result.alpha_composite(frame,(col*frame_size,row*frame_size))
        stats.append({'frame': i,'bounds': bounds,'size': [width,height]})
    out = DEST / f'anim-{unit}.webp'
    result.save(out,quality=91,method=6,alpha_quality=100)
    reopened=Image.open(out)
    assert reopened.mode=='RGBA' and reopened.size==(768,768)
    for i in range(16):
        r,c=divmod(i,4)
        region=(c*192,r*192,c*192+192,r*192+192)
        assert ImageChops.difference(reopened.crop(region).getchannel('A'),result.crop(region).getchannel('A')).getbbox() is None
    # A contrast board catches detached alpha and shows contact alignment at a glance.
    proof=Image.new('RGB',(768,768),(57,51,82))
    guide=ImageDraw.Draw(proof)
    for i in range(16):
        row,col=divmod(i,4)
        x,y=col*192,row*192
        if (col+row)%2: guide.rectangle((x,y,x+191,y+191),fill=(87,73,77))
        guide.line((x+8,y+175,x+184,y+175),fill=(133,115,115))
    proof.paste(result,(0,0),result)
    proof.thumbnail((576,576))
    proof.save(DEST/f'proof-{unit}.png')
    results[f'anim-{unit}']={'bytes':out.stat().st_size,'frames':stats}

for unit,image_id in SHEETS.items():
    prepare_sprite_sheet(unit,image_id)

cards = Image.open(RAW/f'exec-{EVOLUTION}.png').convert('RGB')
cols=(0,418,836,1254)
rows=(0,417,810,1254)
for i in range(9):
    row,col=divmod(i,3)
    icon = cards.crop((cols[col]+1,rows[row]+1,cols[col+1]-1,rows[row+1]-1)).resize((192,192),Image.Resampling.LANCZOS)
    path=DEST/f'evo-{i}.webp'
    icon.save(path,quality=91,method=6)
    assert Image.open(path).size==(192,192)
    results[f'evo-{i}']={'bytes':path.stat().st_size}
(DEST/'validation.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print({k:v['bytes'] for k,v in results.items()})
