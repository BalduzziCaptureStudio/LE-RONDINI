#!/usr/bin/env python3
"""
Prepare web-ready photos for the Le Rondini site.

Every photo is exported as WebP + JPG, in the sizes the page expects, converted
to sRGB and stripped of EXIF metadata (including GPS position).

Usage (run from the site folder):

    python3 tools/prepare_images.py hero  ~/Desktop/terrazza.jpg
    python3 tools/prepare_images.py og    ~/Desktop/terrazza.jpg  [--focus-y 0.3]
    python3 tools/prepare_images.py 05    ~/Desktop/cucina.jpg

  hero  -> images/hero-terrazza(.jpg/.webp)          2400 px wide (shown uncropped)
           images/hero-terrazza-1200(.jpg/.webp)     1200 px wide
           images/hero-terrazza-800(.jpg/.webp)      800 px wide (phones)
  og    -> images/og-terrazza.jpg                    1200 x 630 (Facebook/WhatsApp preview)
           --focus-y = vertical centre of the crop (0 = top, 1 = bottom)
  01-12 -> images/NN(.jpg/.webp)                     1600 px on the long side (lightbox)
           images/NN-800(.jpg/.webp)                 800 px on the long side (grid)

Requires Python 3 with Pillow (pip3 install Pillow).
"""
import argparse
import io
import os
import sys

from PIL import Image, ImageCms, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "images"))
JPG_Q, WEBP_Q = 80, 78
SRGB = ImageCms.createProfile("sRGB")
SRGB_BYTES = ImageCms.ImageCmsProfile(SRGB).tobytes()


def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    icc = im.info.get("icc_profile")
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGB")
    if icc:
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        if "srgb" not in ImageCms.getProfileDescription(src).lower().replace(" ", ""):
            im = ImageCms.profileToProfile(im, src, SRGB, outputMode="RGB")
    return im.convert("RGB")


def resize(im, width=None, long_edge=None):
    w, h = im.size
    if long_edge:
        scale = min(1.0, long_edge / max(w, h))
    else:
        scale = min(1.0, width / w)
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=3))
    return im


def crop_ratio(im, ratio, fx=0.5, fy=0.5):
    """Largest crop with the given width/height ratio, centred on (fx, fy)."""
    w, h = im.size
    if w / h > ratio:
        cw, ch = round(h * ratio), h
    else:
        cw, ch = w, round(w / ratio)
    x0 = min(max(round(fx * w - cw / 2), 0), w - cw)
    y0 = min(max(round(fy * h - ch / 2), 0), h - ch)
    return im.crop((x0, y0, x0 + cw, y0 + ch))


def save(im, name, webp=True):
    jpg = os.path.join(OUT, name + ".jpg")
    im.save(jpg, "JPEG", quality=JPG_Q, optimize=True, progressive=True, icc_profile=SRGB_BYTES)
    out = [jpg]
    if webp:
        wp = os.path.join(OUT, name + ".webp")
        im.save(wp, "WEBP", quality=WEBP_Q, method=6, icc_profile=SRGB_BYTES)
        out.append(wp)
    for p in out:
        print(f"  {os.path.relpath(p, os.path.dirname(OUT)):32s} {im.width}x{im.height}  {os.path.getsize(p) // 1024} KB")
    return im.size


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slot", help="hero, og, or a gallery number 01-12")
    ap.add_argument("source", help="path to the original photo")
    ap.add_argument("--focus-y", type=float, default=0.5, help="og: vertical centre of the crop (0-1)")
    a = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    im = load(os.path.expanduser(a.source))
    slot = a.slot.lower()

    if slot == "hero":
        # The hero is always shown uncropped, so only the size changes.
        w, h = save(resize(im, width=2400), "hero-terrazza")
        save(resize(im, width=1200), "hero-terrazza-1200")
        save(resize(im, width=800), "hero-terrazza-800")
        print(f"\n  In index.html, hero <img>: width=\"{w}\" height=\"{h}\"")
    elif slot == "og":
        save(crop_ratio(im, 1200 / 630, fy=a.focus_y).resize((1200, 630), Image.LANCZOS), "og-terrazza", webp=False)
    elif slot.isdigit() and 1 <= int(slot) <= 99:
        nn = f"{int(slot):02d}"
        w, h = save(resize(im, long_edge=1600), nn)
        tw, th = save(resize(im, long_edge=800), nn + "-800")
        print(f"\n  In index.html, gallery item {nn}: width=\"{w}\" height=\"{h}\", "
              f"srcset widths {tw}w / {w}w, data-w=\"{w}\" data-h=\"{h}\"")
    else:
        sys.exit("slot must be hero, og or a number like 05")


if __name__ == "__main__":
    main()
