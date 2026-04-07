import math
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from models import RoastResponse

WIDTH = 1200
HEIGHT = 630

BG_COLOR = (10, 10, 15)
GREEN = (0, 255, 136)
GREEN_DIM = (0, 255, 136, 40)
AMBER = (255, 170, 0)
CRIMSON = (255, 51, 85)
WHITE = (232, 232, 240)
MUTED = (107, 107, 138)
SURFACE = (18, 18, 26)

CATEGORY_LABELS: dict[str, str] = {
    "code_quality": "CODE QUALITY",
    "naming_conventions": "NAMING",
    "error_handling": "ERROR HDLNG",
    "architecture": "ARCHITECTURE",
    "documentation": "DOCS",
}


def _score_color(score: int) -> tuple[int, int, int]:
    if score >= 70:
        return GREEN
    if score >= 40:
        return AMBER
    return CRIMSON


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates: list[str] = []
    if bold:
        candidates = [
            "C:/Windows/Fonts/consolab.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/consola.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _draw_grid(draw: ImageDraw.ImageDraw) -> None:
    grid_color = (0, 255, 136, 12)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(overlay)
    for x in range(0, WIDTH, 40):
        grid_draw.line([(x, 0), (x, HEIGHT)], fill=grid_color, width=1)
    for y in range(0, HEIGHT, 40):
        grid_draw.line([(0, y), (WIDTH, y)], fill=grid_color, width=1)
    base = draw._image
    base.paste(Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB"))


def _draw_score_ring(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    radius: int,
    score: int,
    font: ImageFont.FreeTypeFont,
) -> None:
    color = _score_color(score)
    bbox = [cx - radius, cy - radius, cx + radius, cy + radius]
    draw.ellipse(bbox, outline=SURFACE, width=8)
    angle = int(360 * score / 100)
    draw.arc(bbox, start=-90, end=-90 + angle, fill=color, width=8)

    text = str(score)
    text_bbox = font.getbbox(text)
    tw = text_bbox[2] - text_bbox[0]
    th = text_bbox[3] - text_bbox[1]
    draw.text((cx - tw // 2, cy - th // 2 - 2), text, fill=color, font=font)


def _draw_grade_badge(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    grade: str,
    score: int,
    font: ImageFont.FreeTypeFont,
) -> None:
    color = _score_color(score)
    badge_w, badge_h = 90, 56
    draw.rounded_rectangle(
        [x, y, x + badge_w, y + badge_h],
        radius=8,
        outline=color,
        width=3,
    )
    text_bbox = font.getbbox(grade)
    tw = text_bbox[2] - text_bbox[0]
    th = text_bbox[3] - text_bbox[1]
    draw.text(
        (x + (badge_w - tw) // 2, y + (badge_h - th) // 2 - 2),
        grade,
        fill=color,
        font=font,
    )


def _draw_category_bars(
    draw: ImageDraw.ImageDraw,
    categories: dict,
    start_x: int,
    start_y: int,
    font: ImageFont.FreeTypeFont,
) -> None:
    bar_max_w = 180
    bar_h = 14
    row_h = 38
    col_w = 520

    keys = list(CATEGORY_LABELS.keys())
    for i, key in enumerate(keys):
        col = i % 2
        row = i // 2
        x = start_x + col * col_w
        y = start_y + row * row_h

        label = CATEGORY_LABELS[key]
        cat = categories.get(key)
        score = cat.score if cat else 0
        color = _score_color(score)

        draw.text((x, y), label, fill=MUTED, font=font)

        bar_x = x + 160
        bar_y = y + 2
        draw.rounded_rectangle(
            [bar_x, bar_y, bar_x + bar_max_w, bar_y + bar_h],
            radius=3,
            fill=SURFACE,
        )
        fill_w = int(bar_max_w * score / 100)
        if fill_w > 0:
            draw.rounded_rectangle(
                [bar_x, bar_y, bar_x + fill_w, bar_y + bar_h],
                radius=3,
                fill=color,
            )

        score_text = str(score)
        draw.text((bar_x + bar_max_w + 10, y), score_text, fill=color, font=font)


def _wrap_text(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = font.getbbox(test)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def generate_card(roast: RoastResponse) -> bytes:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    _draw_grid(draw)

    font_sm = _load_font(16)
    font_md = _load_font(20)
    font_lg = _load_font(28, bold=True)
    font_xl = _load_font(36, bold=True)
    font_score = _load_font(32, bold=True)
    font_grade = _load_font(34, bold=True)
    font_title = _load_font(22, bold=True)

    # --- Header row: title + score circle + grade ---
    draw.text((40, 30), "\U0001f525 AI ROAST MY CODE", fill=GREEN, font=font_title)

    _draw_score_ring(draw, cx=1020, cy=55, radius=35, score=roast.overall_score, font=font_score)
    _draw_grade_badge(draw, x=1080, y=27, grade=roast.grade, score=roast.overall_score, font=font_grade)

    # --- Headline ---
    headline_lines = _wrap_text(roast.headline, font_xl, WIDTH - 80)
    y = 100
    for line in headline_lines:
        draw.text((40, y), line, fill=WHITE, font=font_xl)
        y += 44

    # --- Separator ---
    sep_y = y + 10
    draw.line([(40, sep_y), (WIDTH - 40, sep_y)], fill=MUTED, width=1)

    # --- Savage quote ---
    quote_y = sep_y + 16
    quote_text = f'"{roast.savage_quote}"'
    quote_lines = _wrap_text(quote_text, font_md, WIDTH - 100)
    for line in quote_lines:
        draw.text((50, quote_y), line, fill=GREEN, font=font_md)
        quote_y += 28

    # --- Separator ---
    sep2_y = quote_y + 10
    draw.line([(40, sep2_y), (WIDTH - 40, sep2_y)], fill=MUTED, width=1)

    # --- Category bars ---
    bars_y = sep2_y + 20
    _draw_category_bars(draw, roast.categories, start_x=40, start_y=bars_y, font=font_sm)

    # --- Footer ---
    footer_y = HEIGHT - 40
    draw.text((40, footer_y), "roastmycode.vercel.app", fill=MUTED, font=font_sm)

    handle_text = "@AIRoastMyCode"
    handle_bbox = font_sm.getbbox(handle_text)
    handle_w = handle_bbox[2] - handle_bbox[0]
    draw.text((WIDTH - 40 - handle_w, footer_y), handle_text, fill=MUTED, font=font_sm)

    # --- Export PNG ---
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()
