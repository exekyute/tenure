"""Stitch the captured frames into an animated demo GIF.

Reads docs/demo/frames/*.png and holds.txt (per-frame linger counts) and writes
docs/demo/tenure-demo.gif, downscaled and palette-quantized for a small file.
"""
from pathlib import Path
from PIL import Image

DEMO = Path(__file__).resolve().parent.parent / "docs" / "demo"
FRAMES = DEMO / "frames"
OUT = DEMO / "tenure-demo.gif"

TARGET_W = 900          # downscale width for a lean GIF
UNIT_MS = 550           # per hold-unit duration

holds = {}
for line in (FRAMES / "holds.txt").read_text(encoding="utf-8").splitlines():
    name, h = line.split("\t")
    holds[name] = int(h)

paths = sorted(FRAMES.glob("*.png"))
imgs, durations = [], []
for p in paths:
    im = Image.open(p).convert("RGB")
    w, h = im.size
    im = im.resize((TARGET_W, round(h * TARGET_W / w)), Image.LANCZOS)
    # Quantize to a stable adaptive palette for crisp GIF text.
    im = im.quantize(colors=200, method=Image.FASTOCTREE, dither=Image.Dither.NONE)
    imgs.append(im)
    durations.append(UNIT_MS * holds.get(p.name, 2))

imgs[0].save(
    OUT,
    save_all=True,
    append_images=imgs[1:],
    duration=durations,
    loop=0,
    optimize=True,
    disposal=2,
)

size_kb = OUT.stat().st_size / 1024
print(f"Wrote {OUT.name}: {len(imgs)} frames, {size_kb:.0f} KB, {TARGET_W}px wide")
