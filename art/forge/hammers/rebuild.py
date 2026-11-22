"""Export the twelve 192-square cards from the two bundled 3×2 painted atlases.
Run: uv run --with pillow python rebuild.py
"""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parent
SPLITS = (
    ((0,512,1024,1536), (0,496,1024)),
    ((0,512,1024,1536), (0,512,1024)),
)

def main():
    preview = Image.new("RGB",(6*64,2*64))
    summary = []
    for batch in json.loads((ROOT/"sources.json").read_text()):
        index = batch["batch"]
        xs,ys = SPLITS[index]
        with Image.open(ROOT/batch["file"]) as atlas:
            assert atlas.size == (xs[-1],ys[-1])
            for i,name in enumerate(batch["names"]):
                row,col = divmod(i,3)
                # Two source pixels inset prevent dark seams or neighboring art.
                box = (xs[col]+2,ys[row]+2,xs[col+1]-2,ys[row+1]-2)
                card = atlas.crop(box).convert("RGB").resize((192,192),Image.Resampling.LANCZOS)
                slot = index*6+i
                file = ROOT/f"hammer-{slot}.webp"
                card.save(file,quality=94,method=6)
                with Image.open(file) as checked:
                    assert checked.size==(192,192) and checked.format=="WEBP"
                    preview.paste(checked.resize((64,64),Image.Resampling.LANCZOS), ((slot%6)*64,(slot//6)*64))
                summary.append({"file":file.name,"name":name,"bytes":file.stat().st_size,"crop":box})
    preview.save(ROOT/"preview-64.png")
    (ROOT/"cards.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")

if __name__=="__main__":
    main()
