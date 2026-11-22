"""Pack normalized 4×4, full-color mobile game actor sheets.
Usage: uv run --with pillow --with numpy --with scipy process.py
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage
HERE = Path(__file__).resolve().parent
F = 192
# Projected center of the figure's stance and ground references measured in the
# original sheets. The weapon can affect a figure's outline without moving its hips.
STANCE={
 8:[158,474,786,1099,150,475,773,1090,145,471,745,1103,153,476,769,1090],
 9:[155,471,785,1097,155,471,774,1099,150,466,744,1097,149,476,768,1090],
 10:[155,474,784,1098,150,471,772,1098,152,478,755,1099,148,478,781,1096],
}
GROUND={8:[288,597,909,1223],9:[290,605,918,1221],10:[292,603,901,1218]}

def clusters(alpha):
    labels,_=ndimage.label(alpha>105)
    slots=[[] for _ in range(16)]
    for idx,box in enumerate(ndimage.find_objects(labels),1):
        if not box or (labels[box]==idx).sum()<240:
            continue
        row,col=[int((s.start+s.stop)*2/n) for s,n in zip(box,alpha.shape)]
        slots[4*row+col].append((idx,box))
    assert all(slots)
    return labels,slots

def subject(raw,alpha,labels,item):
    idx,(ys,xs)=item
    rect=(max(0,xs.start-9),max(0,ys.start-9),
          min(raw.width,xs.stop+9),min(raw.height,ys.stop+9))
    left,top,right,bottom=rect
    plane=np.s_[top:bottom,left:right]
    distance=ndimage.distance_transform_edt(labels[plane]!=idx)
    values=np.clip((alpha[plane].astype(float)-12)*255/235,0,255)
    values*=np.clip((8-distance)/4,0,1)
    frame=raw.crop(rect)
    frame.putalpha(Image.fromarray(values.round().astype('uint8')))
    return frame,(left,top)

def actor(entry):
    actor=int(entry['id'])
    raw=Image.open(HERE / entry['source']).convert('RGBA')
    alpha=np.array(raw.getchannel('A'))
    labels,slots=clusters(alpha)
    heights=[s[0][1][0].stop-s[0][1][0].start for s in slots[:4]]
    scale=148/np.median(heights)
    sheet=Image.new('RGBA',(768,768))
    for i,items in enumerate(slots):
        canvas=Image.new('RGBA',raw.size)
        for item in items:
            sprite,(x,y)=subject(raw,alpha,labels,item)
            if actor==9 and i==10 and x>855:
                # Pull the airborne bottle into the source slot, preserving its
                # silhouette and the character scale while maintaining clearance.
                x-=27
                y-=17
            canvas.alpha_composite(sprite,(x,y))
        left,top,right,bottom=canvas.getchannel('A').getbbox()
        sprite=canvas.crop((left,top,right,bottom))
        sprite=sprite.resize(tuple(round(s*scale) for s in sprite.size),Image.Resampling.LANCZOS)
        values=np.array(sprite.getchannel('A'))
        values[values<9]=0
        sprite.putalpha(Image.fromarray(values))
        l,t,r,b=sprite.getchannel('A').getbbox()
        if r-l>188:raise ValueError(f'Too wide {actor}/{i} {r-l}')
        x=round(96-(STANCE[actor][i]-left)*scale)
        x=max(2-l,min(x,190-r))
        y=round(175-(GROUND[actor][i//4]-top)*scale)
        y=max(2-t,min(y,190-b))
        sheet.alpha_composite(sprite,((i%4)*F+x,(i//4)*F+y))
    return sheet

if __name__=='__main__':
    sources=json.loads((HERE/'sources.json').read_text())
    grid=Image.new('RGB',(3*256,256),'#655145')
    report=[]
    for panel,entry in enumerate(sources):
        number=entry['id']
        result=HERE/f'anim-{number}.webp'
        sheet=actor(entry)
        sheet.save(result,quality=92,method=6,exact=True)
        checked=Image.open(result)
        assert checked.mode=='RGBA' and checked.size==(768,768)
        dims=[]
        for i in range(16):
            x,y=i%4*F,i//4*F
            frame=checked.crop((x,y,x+F,y+F))
            l,t,r,b=frame.getchannel('A').getbbox()
            assert min(l,t,F-r,F-b)>=2
            a=frame.getchannel('A').point(lambda v:255 if v>=96 else 0)
            lc,tc,rc,bc=a.getbbox()
            dims.append((lc,tc,rc,bc))
            small=frame.resize((64,64),Image.Resampling.LANCZOS)
            grid.paste(small,(panel*256+(i%4)*64,(i//4)*64),small)
        report.append({'file':result.name,'bytes':result.stat().st_size,'frame_bounds_alpha96':dims})
    grid.save(HERE/'preview-64.png')
    (HERE/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
