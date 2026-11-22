"""Insert the art-directed four-beat running cycle into the uncompressed base atlas."""
import numpy as np
from PIL import Image
from scipy import ndimage

# Derived by matching the head/torso size to the standing sheet; this single
# factor per hero is shared across every stride and contact pose.
RUN_HEIGHT=(149,148,148)
def place_run(sheet, src, hero):
    photo=Image.open(src).convert('RGBA')
    alpha=np.array(photo.getchannel('A'))
    labs,_=ndimage.label(alpha>100)
    boxes={}
    for tag,box in enumerate(ndimage.find_objects(labs),1):
        if not box or (labs[box]==tag).sum()<20000:continue
        y,x=box
        row=int((y.start+y.stop)/(photo.height))
        col=int((x.start+x.stop)/(photo.width))
        boxes[row*2+col]=(tag,box)
    assert len(boxes)==4
    heights=[b[0].stop-b[0].start for _,b in boxes.values()]
    widths=[b[1].stop-b[1].start for _,b in boxes.values()]
    factor=min(RUN_HEIGHT[hero]/np.median(heights),182 / max(widths))
    for k in range(4):
        tag,(ys,xs)=boxes[k]
        left=max(xs.start-10,0);right=min(xs.stop+10,photo.width)
        top=max(ys.start-10,0);bottom=min(ys.stop+10,photo.height)
        b=np.s_[top:bottom,left:right]
        dist=ndimage.distance_transform_edt(labs[b]!=tag)
        v=np.clip((alpha[b].astype(float)-12)*255/235,0,255)*np.clip((8-dist)/4,0,1)
        sprite=photo.crop((left,top,right,bottom))
        sprite.putalpha(Image.fromarray(v.round().astype('uint8')))
        sprite=sprite.resize(tuple(round(d*factor) for d in sprite.size),Image.Resampling.LANCZOS)
        a=np.array(sprite.getchannel('A'))
        a[a<9]=0
        sprite.putalpha(Image.fromarray(a))
        l,t,r,bt=sprite.getchannel('A').getbbox()
        # Whole keyframes use the same horizontal axis, offset only by root
        # balance in the source and clipped to keep the outer gutter clear.
        x=round(96-(l+r)/2)
        floor=172 if k in (0,2) else 175
        y=floor-round((ys.stop-top)*factor)
        sheet.paste((0,0,0,0),(192*k,192,192*(k+1),384))
        sheet.alpha_composite(sprite,(192*k+x,192+y))
