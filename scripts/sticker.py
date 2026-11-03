"""Photo -> black-and-white cut-out with a white sticker outline (transparent PNG)."""
import sys

from PIL import Image, ImageFilter, ImageOps, ImageEnhance


def main(src: str, dst: str, cutout: bool) -> None:
    img = Image.open(src).convert("RGBA")
    if cutout:
        from rembg import new_session, remove

        # ~170 MB model, downloaded once to ~/.u2net. Good on people and objects.
        img = remove(img, session=new_session("isnet-general-use"))
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        img = img.crop(bbox)

    gray = ImageOps.grayscale(img.convert("RGB"))
    gray = ImageOps.autocontrast(gray, cutoff=2)
    gray = ImageEnhance.Contrast(gray).enhance(1.6)
    subject = Image.merge("RGBA", (gray, gray, gray, img.getchannel("A")))

    r = max(6, round(max(subject.size) * 0.018))
    pad = r * 2
    canvas = Image.new("RGBA", (subject.width + pad * 2, subject.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(subject, (pad, pad), subject)
    grown = canvas.getchannel("A").point(lambda a: 255 if a > 40 else 0)
    grown = grown.filter(ImageFilter.MaxFilter(r * 2 + 1)).filter(ImageFilter.GaussianBlur(1))
    sticker = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    sticker.putalpha(grown)
    sticker.alpha_composite(canvas)
    sticker.save(dst)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0], args[1], "--no-cutout" not in sys.argv)
