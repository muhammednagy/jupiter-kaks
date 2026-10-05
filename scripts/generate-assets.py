"""Generate original Jupiter Kaks icons and promotional art (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
NAVY = "#172a3b"
GOLD = "#ffe289"


def icon(size):
    canvas = Image.new("RGBA", (512, 512))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((64, 64, 448, 448), radius=88, fill=NAVY, outline="#42596d", width=3)
    draw.rounded_rectangle((132, 146, 380, 232), radius=24, fill="#ffffff")
    draw.polygon(((152, 220), (152, 252), (188, 226)), fill="#ffffff")
    draw.rounded_rectangle((132, 278, 380, 364), radius=24, fill=GOLD)
    draw.polygon(((324, 358), (360, 384), (360, 352)), fill=GOLD)
    for y in (178, 310):
        draw.rounded_rectangle((168, y, 344, y + 12), radius=6, fill=NAVY)
        draw.rounded_rectangle((168, y + 24, 290, y + 36), radius=6, fill=NAVY)
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def font(size):
    for path in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def main():
    (ROOT / "icons").mkdir(exist_ok=True)
    for size in (16, 32, 48, 128):
        icon(size).save(ROOT / f"icons/icon-{size}.png")
    (ROOT / "store-assets").mkdir(exist_ok=True)
    tile = Image.new("RGB", (440, 280), NAVY)
    draw = ImageDraw.Draw(tile)
    draw.ellipse((270, -125, 570, 175), fill="#203c52")
    draw.ellipse((-125, 175, 150, 450), fill="#203c52")
    tile.paste(icon(128), (156, 16), icon(128))
    draw.text((220, 160), "Jupiter Kaks", font=font(30), fill="white", anchor="mm")
    draw.text((220, 203), "Two languages. One show.", font=font(17), fill=GOLD, anchor="mm")
    draw.text((220, 244), "ESTONIAN + ENGLISH", font=font(12), fill="#b7c8d7", anchor="mm")
    tile.save(ROOT / "store-assets/promo-440x280.png")


if __name__ == "__main__":
    main()
