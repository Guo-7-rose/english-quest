"""生成 PWA 图标：圆角底 + 「英」字，192/512/180/32。用 bundled Python + Pillow。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

GREEN = (88, 204, 2, 255)      # --green #58CC02
GREEN_DARK = (58, 133, 0, 255)  # 底部阴影色
WHITE = (255, 255, 255, 255)
YELLOW = (255, 200, 0, 255)

CJK_FONTS = [
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
]


def load_font(size: int):
    for p in CJK_FONTS:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def rounded(size: int, radius_ratio: float = 0.22) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * radius_ratio)
    # 主体绿色
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=GREEN)
    # 底部阴影条（卡通厚底风格）
    d.rounded_rectangle([0, int(size * 0.82), size - 1, size - 1], radius=int(size * 0.12), fill=GREEN_DARK)
    return img


def draw_glyph(img: Image.Image, text: str, size: int, maskable: bool = False):
    d = ImageDraw.Draw(img)
    # maskable 安全区：字形缩到 62%，避免被圆形裁切
    scale = 0.62 if maskable else 0.72
    font = load_font(int(size * scale))
    box = d.textbbox((0, 0), text, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    x = (size - w) / 2 - box[0]
    y = (size - h) / 2 - box[1] - size * 0.03
    # 白色描边增强可读性
    d.text((x, y), text, font=font, fill=WHITE)
    return img


def make(size: int, maskable: bool = False) -> Image.Image:
    img = rounded(size)
    draw_glyph(img, "英", size, maskable)
    return img


for s in (192, 512, 180, 32):
    p = OUT / f"icon-{s}.png"
    make(s).save(p)
    print("saved", p.name, f"{s}x{s}")

# maskable 版本（Android 自适应图标）
for s in (192, 512):
    p = OUT / f"maskable-{s}.png"
    img = Image.new("RGBA", (s, s), GREEN)   # maskable 需要铺满，不留透明
    draw_glyph(img, "英", s, maskable=True)
    img.save(p)
    print("saved", p.name, f"{s}x{s}")

# 小尺寸 favicon 用更简洁的「E」
fav = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
d = ImageDraw.Draw(fav)
d.rounded_rectangle([0, 0, 31, 31], radius=7, fill=GREEN)
f = load_font(22)
box = d.textbbox((0, 0), "E", font=f)
d.text(((32 - (box[2] - box[0])) / 2 - box[0], (32 - (box[3] - box[1])) / 2 - box[1] - 1), "E", font=f, fill=WHITE)
fav.save(OUT / "favicon-32.png")
print("saved favicon-32.png 32x32")
