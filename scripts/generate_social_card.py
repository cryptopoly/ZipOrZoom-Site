from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "social-card.png"

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"

WIDTH = 1200
HEIGHT = 630

BG = (246, 248, 253)
INK = (11, 11, 18)
MUTED = (79, 86, 98)
SOFT = (102, 112, 133)
BORDER = (228, 233, 243)
PURPLE = (139, 92, 246)
BLUE = (59, 130, 246)
CYAN = (6, 182, 212)


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def lerp_color(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(lerp(x, y, t) for x, y in zip(a, b))


def multi_gradient(width: int, height: int, colors: list[str]) -> Image.Image:
    gradient = Image.new("RGBA", (width, height))
    pixels = gradient.load()
    color_points = [hex_to_rgb(color) for color in colors]
    span = len(color_points) - 1
    for x in range(width):
        t = x / max(width - 1, 1)
        idx = min(int(t * span), span - 1)
        local_t = (t - (idx / span)) * span
        color = lerp_color(color_points[idx], color_points[idx + 1], local_t)
        for y in range(height):
            pixels[x, y] = (*color, 255)
    return gradient


def draw_glow(base: Image.Image, box: tuple[int, int, int, int], color: tuple[int, int, int], alpha: int, blur: int) -> None:
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(box, fill=(*color, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(glow)


def draw_gradient_text(base: Image.Image, position: tuple[int, int], text: str, font: ImageFont.FreeTypeFont, colors: list[str]) -> None:
    temp = Image.new("L", base.size, 0)
    ImageDraw.Draw(temp).text(position, text, font=font, fill=255)
    bbox = temp.getbbox()
    if not bbox:
        return
    x0, y0, x1, y1 = bbox
    gradient = multi_gradient(x1 - x0, y1 - y0, colors)
    mask = temp.crop(bbox)
    base.paste(gradient, (x0, y0), mask)


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, int, int] | tuple[int, int, int, int],
    outline: tuple[int, int, int] | None = None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def render_window() -> Image.Image:
    window = Image.new("RGBA", (430, 380), (0, 0, 0, 0))
    shadow = Image.new("RGBA", window.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((20, 24, 408, 356), radius=30, fill=(15, 23, 42, 46))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    window.alpha_composite(shadow)

    draw = ImageDraw.Draw(window)
    rounded_rect(draw, (24, 18, 406, 350), 28, (255, 255, 255, 255), BORDER, 1)
    rounded_rect(draw, (24, 18, 406, 66), 28, (249, 250, 253, 255), BORDER, 1)
    draw.rectangle((24, 44, 406, 66), fill=(249, 250, 253, 255))
    for x, color in zip((52, 74, 96), ((251, 113, 133), (251, 191, 36), (52, 211, 153))):
        draw.ellipse((x - 6, 42 - 6, x + 6, 42 + 6), fill=color)

    regular_13 = load_font(FONT_BOLD, 13)
    regular_12 = load_font(FONT_BOLD, 12)
    draw.text((148, 37), "project-release.zip", font=regular_13, fill=(82, 88, 102))

    rounded_rect(draw, (44, 86, 126, 300), 18, (243, 245, 251, 255))
    draw.text((60, 108), "LIBRARY", font=load_font(FONT_BOLD, 11), fill=(138, 147, 164))
    rounded_rect(draw, (54, 130, 116, 164), 12, (255, 255, 255, 255))
    draw.text((69, 141), "Recent", font=regular_12, fill=INK)
    draw.text((60, 188), "Archives", font=load_font(FONT_BOLD, 12), fill=(82, 88, 102))
    draw.text((60, 218), "Watch folders", font=load_font(FONT_BOLD, 12), fill=(82, 88, 102))
    draw.text((60, 248), "Checksums", font=load_font(FONT_BOLD, 12), fill=(82, 88, 102))
    draw.text((60, 278), "Recipes", font=load_font(FONT_BOLD, 12), fill=(82, 88, 102))

    rounded_rect(draw, (148, 86, 384, 114), 14, (255, 255, 255, 255), BORDER, 1)
    draw.text((166, 95), "project-release.zip / src / components", font=load_font(FONT_BOLD, 11), fill=(91, 100, 116))

    rounded_rect(draw, (148, 130, 384, 286), 18, (255, 255, 255, 255), BORDER, 1)
    rounded_rect(draw, (164, 146, 300, 156), 5, (216, 222, 236, 255))
    rounded_rect(draw, (324, 146, 366, 156), 5, (231, 234, 242, 255))

    rows = (
        (164, 176, 354, 191, (238, 242, 255)),
        (164, 207, 344, 222, (238, 242, 255)),
        (164, 238, 374, 253, (224, 231, 255)),
        (164, 269, 332, 284, (238, 242, 255)),
    )
    for x0, y0, x1, y1, color in rows:
        rounded_rect(draw, (x0, y0, x1, y1), 7, (*color, 255))
    rounded_rect(draw, (164, 238, 252, 253), 7, (*PURPLE, 255))
    overlay = Image.new("RGBA", (88, 15), (0, 0, 0, 0))
    overlay_gradient = multi_gradient(88, 15, ["#8B5CF6", "#3B82F6", "#06B6D4"])
    overlay_mask = Image.new("L", (88, 15), 0)
    ImageDraw.Draw(overlay_mask).rounded_rectangle((0, 0, 88, 15), radius=7, fill=255)
    overlay.paste(overlay_gradient, (0, 0), overlay_mask)
    window.alpha_composite(overlay, (164, 238))

    draw.text((164, 312), "Compressing • 7-Zip • Ultra", font=regular_12, fill=(90, 100, 116))
    rounded_rect(draw, (164, 328, 358, 340), 6, (231, 234, 242, 255))
    progress = Image.new("RGBA", (160, 12), (0, 0, 0, 0))
    progress_gradient = multi_gradient(160, 12, ["#8B5CF6", "#3B82F6", "#06B6D4"])
    progress_mask = Image.new("L", (160, 12), 0)
    ImageDraw.Draw(progress_mask).rounded_rectangle((0, 0, 160, 12), radius=6, fill=255)
    progress.paste(progress_gradient, (0, 0), progress_mask)
    window.alpha_composite(progress, (164, 328))
    draw.text((360, 312), "82%", font=load_font(FONT_BLACK, 12), fill=INK)

    return window.rotate(-6, resample=Image.Resampling.BICUBIC, expand=True)


def main() -> None:
    image = Image.new("RGBA", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)

    draw_glow(image, (-80, -160, 560, 360), PURPLE, 84, 55)
    draw_glow(image, (735, -120, 1210, 260), BLUE, 72, 52)
    draw_glow(image, (430, 360, 1090, 620), CYAN, 58, 60)

    rounded_rect(draw, (48, 48, 1152, 582), 36, (255, 255, 255, 166), BORDER, 1)

    brand_gradient = multi_gradient(56, 56, ["#8B5CF6", "#3B82F6", "#06B6D4"])
    brand_mask = Image.new("L", (56, 56), 0)
    ImageDraw.Draw(brand_mask).rounded_rectangle((0, 0, 56, 56), radius=17, fill=255)
    image.paste(brand_gradient, (88, 88), brand_mask)

    z_mask = Image.new("L", (56, 56), 0)
    z_draw = ImageDraw.Draw(z_mask)
    z_draw.polygon([(104 - 88, 104 - 88), (129 - 88, 104 - 88), (112 - 88, 123 - 88), (129 - 88, 123 - 88), (129 - 88, 135 - 88), (104 - 88, 135 - 88), (121 - 88, 116 - 88), (104 - 88, 116 - 88)], fill=255)
    image.paste((255, 255, 255, 255), (88, 88), z_mask)

    headline_font = load_font(FONT_BLACK, 60)
    title_font = load_font(FONT_BLACK, 29)
    subtitle_font = load_font(FONT_BOLD, 17)
    body_font = load_font(FONT_REGULAR, 23)
    pill_font = load_font(FONT_BOLD, 14)
    chip_font = load_font(FONT_BLACK, 18)

    draw.text((160, 90), "ZipOrZoom", font=title_font, fill=INK)
    draw.text((160, 124), "The modern archive manager", font=subtitle_font, fill=SOFT)

    rounded_rect(draw, (88, 176, 288, 210), 17, (255, 255, 255, 255), BORDER, 1)
    draw.ellipse((108, 188, 118, 198), fill=(16, 185, 129))
    draw.text((128, 184), "v0.1.0 • public beta", font=pill_font, fill=(90, 100, 116))

    draw.text((88, 238), "Archive anything.", font=headline_font, fill=INK)
    draw_gradient_text(image, (88, 315), "Zoom through it.", headline_font, ["#8B5CF6", "#3B82F6", "#06B6D4"])

    draw.text((88, 404), "Fast, native archive management for every desktop.", font=body_font, fill=MUTED)
    draw.text((88, 440), "ZIP, RAR, 7-Zip, TAR, batch ops, watch folders,", font=body_font, fill=MUTED)
    draw.text((88, 476), "split volumes, and checksums built in.", font=body_font, fill=MUTED)

    chips = [("ZIP", True), ("RAR", False), ("7Z", False), ("TAR", False)]
    x = 88
    for label, active in chips:
        fill = INK if active else (255, 255, 255)
        outline = None if active else (221, 227, 239)
        text_fill = (255, 255, 255) if active else INK
        rounded_rect(draw, (x, 504, x + 154, 548), 22, fill, outline, 1)
        bbox = draw.textbbox((0, 0), label, font=chip_font)
        text_x = x + (154 - (bbox[2] - bbox[0])) / 2
        draw.text((text_x, 516), label, font=chip_font, fill=text_fill)
        x += 166

    window = render_window()
    image.alpha_composite(window, (684, 78))

    # Floating callouts to match the homepage hero.
    callout = Image.new("RGBA", image.size, (0, 0, 0, 0))
    callout_draw = ImageDraw.Draw(callout)
    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)

    for box in ((936, 94, 1118, 156), (898, 482, 1098, 544)):
        shadow_draw.rounded_rectangle(box, radius=20, fill=(67, 56, 202, 52))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    image.alpha_composite(shadow)

    rounded_rect(callout_draw, (936, 94, 1118, 156), 20, (255, 255, 255, 255))
    callout_draw.ellipse((955, 116, 969, 130), fill=(34, 197, 94))
    callout_draw.text((982, 111), "Watch folder active", font=load_font(FONT_BOLD, 15), fill=INK)
    callout_draw.text((982, 131), "~/Downloads -> auto-zip", font=load_font(FONT_BOLD, 13), fill=SOFT)

    rounded_rect(callout_draw, (898, 482, 1098, 544), 20, (255, 255, 255, 255))
    callout_draw.ellipse((917, 504, 931, 518), fill=BLUE)
    callout_draw.text((944, 499), "Checksum verified", font=load_font(FONT_BOLD, 15), fill=INK)
    callout_draw.text((944, 519), "SHA-256 • 9f3b2e...", font=load_font(FONT_MONO, 13), fill=SOFT)
    image.alpha_composite(callout)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(OUTPUT, format="PNG", optimize=True)


if __name__ == "__main__":
    main()
