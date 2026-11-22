"""Rebuild v1.3 hero lobby cutouts and selection portraits from ImageGen masters.
uv run --no-project --with pillow --with numpy --with scipy python rebuild.py
"""
from pathlib import Path
import json
import numpy as np
from scipy import ndimage
from PIL import Image

OUTPUT = Path(__file__).resolve().parent
MASTER_DIR = OUTPUT.parent / 'masters'
# Crop coordinates refer to the final standee. Each crop is (left, top, size).
SOURCE = {
    3: ('hero-3.png', (329,132,660)),
    4: ('hero-4.png', (356,0,610)),
    5: ('hero-5.png', (394,85,598)),
}
def prepare(source):
    raw=np.array(Image.open(source).convert('RGBA'))
    alpha=np.clip((raw[:,:,3].astype(float)-7)*255/246,0,255)
    labels,_=ndimage.label(alpha>0)
    component_sizes=np.bincount(labels.ravel())
    alpha[component_sizes[labels]<35]=0
    raw[:,:,3]=alpha.astype('uint8')
    cutout=Image.fromarray(raw)
    # Keep the approved camera scale. Anchor the foot sole within 4 px of the original
    # 1254 px template bottom; silhouettes retain the original aspect and horizontal pose.
    bottom=np.where(np.amax(raw[:,:,3],axis=1)>90)[0][-1]+1
    offset=1250-int(bottom)
    frame=Image.new('RGBA',(1254,1254))
    frame.alpha_composite(cutout,(0,offset))
    return frame
def main():
    report={}
    contact=Image.new('RGB',(900,560),'#234651')
    for i,(filename,crop) in SOURCE.items():
        frame=prepare(MASTER_DIR/filename)
        x,y,size=crop
        face=frame.crop((x,y,x+size,y+size)).resize((200,200),Image.Resampling.LANCZOS)
        for kind,im,q in [('hero',frame,90),('face',face,91)]:
            dest=OUTPUT/f'{kind}-{i}.webp'
            im.save(dest,'WEBP',quality=q,method=6,exact=True)
            decoded=Image.open(dest)
            assert decoded.mode=='RGBA' and decoded.size==im.size
            report[dest.name]={'size':im.size,'bytes':dest.stat().st_size,'alpha_extrema':decoded.getchannel('A').getextrema()}
        thumb=frame.copy()
        thumb.thumbnail((295,350),Image.Resampling.LANCZOS)
        contact.paste(thumb,((i-3)*300+(300-thumb.width)//2,330-thumb.height),thumb)
        contact.paste(face,((i-3)*300+50,350),face)
    contact.save(OUTPUT/'preview.jpg',quality=92)
    (OUTPUT/'quality.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':
    main()

