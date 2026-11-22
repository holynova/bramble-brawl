"""Rebuild the six battlefield relics and their 32px proof.
Run: uv run --no-project --with pillow --with numpy --with scipy python rebuild.py
The only input is master.png beside this script.
"""
from pathlib import Path
import json
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw

HERE=Path(__file__).resolve().parent
SIZE=192
def main():
    atlas=Image.open(HERE/'master.png').convert('RGBA')
    assert atlas.size == (1536,1024)
    proof=Image.new('RGB',(576,448),'#243950')
    for y in range(224,448):
        ImageDraw.Draw(proof).line((0,y,575,y),fill='#c29158')
    report={}
    for i in range(6):
        x,y=(i%3)*512,(i//3)*512
        raw=np.array(atlas.crop((x,y,x+512,y+512)))
        alpha=np.clip((raw[:,:,3].astype(float)-12)*255/240,0,255)
        labels,_=ndimage.label(alpha>0)
        sizes=np.bincount(labels.ravel())
        alpha[sizes[labels]<35]=0
        if i==0:
            # Preserve brilliant eyes and thin bright contours while making the spectral crystal body translucent.
            brightness=raw[:,:,:3].max(axis=2).astype(float)/255
            alpha*=0.72+0.24*brightness**4
        raw[:,:,3]=alpha.astype('uint8')
        image=Image.fromarray(raw)
        image=image.crop(image.getbbox())
        image.thumbnail((182,182),Image.Resampling.LANCZOS)
        output=Image.new('RGBA',(SIZE,SIZE))
        output.alpha_composite(image,((SIZE-image.width)//2,(SIZE-image.height)//2))
        dest=HERE/f'relic-{i}.webp'
        output.save(dest,'WEBP',quality=94,method=6,exact=True)
        final=Image.open(dest).convert('RGBA')
        a=np.array(final.getchannel('A'))
        assert not a[0].any() and not a[-1].any() and not a[:,0].any() and not a[:,-1].any()
        x,y=(i%3)*192,(i//3)*224
        proof.paste(final,(x,y),mask=final.getchannel('A'))
        tiny=final.resize((32,32),Image.Resampling.LANCZOS)
        proof.paste(tiny,(x+80,y+190),mask=tiny.getchannel('A'))
        report[str(i)]={'file':dest.name,'width':final.width,'height':final.height,'bytes':dest.stat().st_size,'alpha':final.getchannel('A').getextrema()}
    proof.save(HERE/'preview.jpg',quality=95)
    (HERE/'quality.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':
    main()
