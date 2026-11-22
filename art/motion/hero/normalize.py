"""Rebuild hero animation atlases from the original full-sheet renders."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = Path(__file__).resolve().parent
FR = 192
SLOP = 4
# Manually measured projected center of the hips/standing stance in each raw drawing.
CENTERS = [
    [166,477,788,1100,152,467,783,1094,150,465,777,1098,157,477,778,1099],
    [158,473,786,1099,154,472,781,1095,156,465,756,1097,155,479,781,1095],
    [163,478,791,1104,172,483,785,1104,163,477,769,1104,158,478,780,1098],
]
# The absolute, common ground line in each row. In airborne running keys this
# preserves the small natural clearance. The slammed hammer can cross the baseline.
GROUND = [[283,599,911,1225], [295,608,923,1233], [289,602,919,1223]]

def find_figures(alpha):
    labels,_ = ndimage.label(alpha > 100)
    figures = {}
    for label,box in enumerate(ndimage.find_objects(labels),1):
        if box is None or (labels[box]==label).sum() < 3000:
            continue
        row,col = [int((sl.start+sl.stop)/2*4/n) for sl,n in zip(box,alpha.shape)]
        index = 4*row+col
        if index in figures:
            raise ValueError(f'Duplicate character at frame {index}')
        figures[index] = (label,box)
    if set(figures)!=set(range(16)):
        raise ValueError(f'Incorrect frame count: {len(figures)}')
    return labels,figures

def rebuild(index,entry):
    raw = Image.open(entry['source']).convert('RGBA')
    alpha = np.array(raw.getchannel('A'))
    labels,figures = find_figures(alpha)
    heights = [figures[i][1][0].stop-figures[i][1][0].start for i in range(4)]
    widest = max(box[1].stop-box[1].start for _,box in figures.values())
    scale = min(148 / np.median(heights), 183 / widest)
    sheet = Image.new('RGBA', (4*FR,4*FR))
    for i in range(16):
        tag,(ys,xs) = figures[i]
        left = max(0,xs.start-10)
        right = min(raw.width,xs.stop+10)
        top = max(0,ys.start-10)
        bottom = min(raw.height,ys.stop+10)
        plane = np.s_[top:bottom,left:right]
        core = labels[plane]==tag
        distance = ndimage.distance_transform_edt(~core)
        values = np.array(alpha[plane],dtype=np.float32)
        # Remove low-opacity backdrop residue, retaining a soft antialiased edge
        # and connected luminous sparks. Fill the small alpha variation in the
        # modeled body so the battlefield does not show through the hero.
        values = np.clip((values-12) * 255 / (247-12),0,255)
        values *= np.clip((8-distance)/4,0,1)
        figure = raw.crop((left,top,right,bottom))
        figure.putalpha(Image.fromarray(np.rint(values).astype('uint8')))
        w,h = [int(round(n*scale)) for n in figure.size]
        figure = figure.resize((w,h),Image.Resampling.LANCZOS)
        a = np.array(figure.getchannel('A'))
        a[a < 9] = 0
        figure.putalpha(Image.fromarray(a))
        bounds=figure.getchannel('A').getbbox()
        x=round(96-(CENTERS[index][i]-left)*scale)
        x=max(SLOP-bounds[0],min(x,FR-SLOP-bounds[2]))
        y=round(175-(GROUND[index][i//4]-top)*scale)
        y=max(2-bounds[1],min(y,FR-2-bounds[3]))
        sheet.alpha_composite(figure,((i%4)*FR+x,(i//4)*FR+y))
    from run_cycle import place_run
    run_sources = json.loads((HERE/'run-source.json').read_text())
    if run_sources[index]['source']:
        place_run(sheet,run_sources[index]['source'],index)
    out=HERE/f'anim-{index}.webp'
    sheet.save(out,quality=92,method=6,exact=True)
    test=Image.open(out)
    assert test.size==(768,768) and test.mode=='RGBA'
    snap=Image.new('RGB',sheet.size,'#63514b')
    snap.paste(test,mask=test.getchannel('A'))
    snap.resize((540,540),Image.Resampling.LANCZOS).save(HERE/f'preview-{index}.jpg',quality=90)
    for i in range(16):
        box=((i%4)*FR,(i//4)*FR)
        (l,t,r,b)=test.crop((*box,box[0]+FR,box[1]+FR)).getchannel('A').getbbox()
        if min(l,t,FR-r,FR-b)<2:
            raise ValueError(f'Clipping at {index}/{i}')
        print(index,i,(l,t,r,b), 'height',b-t)
if __name__ == '__main__':
    for i, entry in enumerate(json.loads((HERE/'source.json').read_text())):
        rebuild(i,entry)
