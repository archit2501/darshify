"""Writes src/styles/fonts/figtree-rupee-wght-normal.woff2: Figtree's rupee
sign (U+20B9) alone, with the weight axis kept.

Figtree's Latin subset has no rupee sign; it lives in the 10 KB latin-ext
file. The site shows rupee amounts but no other latin-ext text, so this
1 KB file replaces that face. Run it again if the Figtree package changes:

    python3 scripts/subset-rupee-font.py

Needs fontTools with brotli (pip install fonttools brotli).
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = (
    ROOT
    / "node_modules/@fontsource-variable/figtree/files"
    / "figtree-latin-ext-wght-normal.woff2"
)
TARGET = ROOT / "src/styles/fonts/figtree-rupee-wght-normal.woff2"

options = subset.Options()
options.flavor = "woff2"
options.layout_features = []
options.name_IDs = ["*"]
options.notdef_outline = False

font = TTFont(SOURCE)
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=[0x20B9])
subsetter.subset(font)
font.flavor = "woff2"
TARGET.parent.mkdir(parents=True, exist_ok=True)
font.save(TARGET)
print(f"Wrote {TARGET.relative_to(ROOT)} ({TARGET.stat().st_size} bytes)")
