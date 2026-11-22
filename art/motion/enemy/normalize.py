"""Rebuild three transparent 4x4 animation sheets from the generated source PNGs.

uv run --no-project --with pillow --with numpy --with scipy python normalize.py
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

OUTPUT = Path(__file__).resolve().parent
RAW_DIR = Path("source-images")
SOURCES = {
    3: "exec-e38cda2c-f6ea-48a0-9a6f-a8854fd08363.png",
    4: "exec-1c3809c4-8221-4363-a86c-e0aaa7e25f23.png",
    5: "exec-8d19b827-fc0b-4117-94fc-006a2db4ccd7.png",
}
CELL = 192
BASELINE = 175
NOMINAL_HEIGHT = 149
MAX_SPRITE_WIDTH = 180


def extract_frames(source):
    pixels = np.array(source.convert("RGBA"))
    # The generated images include near-transparent, lightly tinted pixels outside the models.
    alpha = np.clip((pixels[:, :, 3].astype(float) - 28) * 255 / 223, 0, 255)
    labels, _ = ndimage.label(alpha > 0)
    components = ndimage.find_objects(labels)
    weights = np.bincount(labels.ravel())
    frames = {}
    for component_id in np.flatnonzero(weights[1:] > 9000) + 1:
        vertical, horizontal = components[component_id - 1]
        cy = (vertical.start + vertical.stop) / 2
        cx = (horizontal.start + horizontal.stop) / 2
        index = int(cy * 4 / source.height) * 4 + int(cx * 4 / source.width)
        assert index not in frames
        crop = pixels[vertical, horizontal].copy()
        local_id = labels[vertical, horizontal]
        crop[:, :, 3] = np.where(local_id == component_id, alpha[vertical, horizontal], 0)
        frames[index] = (Image.fromarray(crop), (horizontal.start, vertical.start))
    assert sorted(frames) == list(range(16))
    return frames


def create_sheet(key, frames):
    scale = min(
        NOMINAL_HEIGHT / np.median([frames[i][0].height for i in range(4)]),
        MAX_SPRITE_WIDTH / max(im.width for im, _ in frames.values()),
    )
    result = Image.new("RGBA", (CELL*4, CELL*4))
    metadata = []
    cells = []
    for index in range(16):
        im, (_, raw_top) = frames[index]
        width, height = round(im.width * scale), round(im.height * scale)
        sprite = im.resize((width, height), Image.Resampling.LANCZOS)
        x = round((CELL-width)/2)
        y = BASELINE - height
        if key == 4 and 4 <= index <= 7:
            # In the bat flight row the toe line is fixed in source space even if wing tips pass it.
            y = BASELINE + round((raw_top - 572) * scale)
        assert min(x, y, CELL-x-width, CELL-y-height) >= 2
        cell = Image.new("RGBA", (CELL, CELL))
        cell.alpha_composite(sprite, (x,y))
        result.alpha_composite(cell, ((index%4)*CELL, (index//4)*CELL))
        cells.append(np.array(cell))
        metadata.append({"index": index, "rect": [x, y, width, height]})
    motion = {}
    for name, indices in {"idle": [0,1,2,3], "move": [4,5,6,7], "attack": [8,9,10,11], "hurt": [12,13], "fall": [14,15]}.items():
        changes = []
        for i, j in zip(indices, indices[1:]):
            a = cells[i].astype(float); b = cells[j].astype(float)
            visible = (a[:,:,3] > 160) | (b[:,:,3] > 160)
            a = a[:,:,:3] * a[:,:,3:]/255
            b = b[:,:,:3] * b[:,:,3:]/255
            changes.append(round(float(np.mean(np.max(abs(a-b),axis=2)[visible] > 28)), 3))
        motion[name] = changes
    return result, {"scale": round(scale, 4), "frames": metadata, "fraction_of_visible_pixels_changed": motion}


def main():
    report = {}
    for key, basename in SOURCES.items():
        source = Image.open(RAW_DIR / basename)
        sheet, details = create_sheet(key, extract_frames(source))
        out = OUTPUT / f"anim-{key}.webp"
        sheet.save(out, "WEBP", quality=93, method=6, exact=True)
        reread = Image.open(out).convert("RGBA")
        alpha = np.asarray(reread)[:,:,3]
        assert reread.size == (768,768)
        assert all(np.max(alpha[i*192]) == np.max(alpha[:,i*192]) == 0 for i in range(4))
        assert np.max(alpha[-1]) == np.max(alpha[:,-1]) == 0
        preview = Image.new("RGB",sheet.size,"#34495b")
        preview.paste(reread,mask=reread.getchannel("A"))
        preview.save(OUTPUT / f"preview-{key}.jpg",quality=91)
        report[key] = {"filename": out.name, "bytes": out.stat().st_size, **details}
    (OUTPUT/"quality.json").write_text(json.dumps(report,indent=2)+"\n")


if __name__ == "__main__":
    main()
