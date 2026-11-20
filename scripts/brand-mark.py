"""Membangun logo Worksell ID secara geometris dan menulis semua asetnya.

Monogram W = empat goresan tebal (ujung bulat) yang dipotong celah tipis menjadi
empat keping yang saling mengunci, seperti sistem-sistem yang disambungkan.

Keluaran:
  src/components/LogoMark.astro       monogram inline (fill: currentColor) untuk navbar
  public/favicon.svg                  monogram di kotak gelap, celah dipertebal untuk ukuran kecil
  public/brand/worksell-mark.svg      monogram saja, warna aksen
  public/brand/worksell-logo.svg      monogram + wordmark mendatar (untuk latar gelap)
  public/brand/worksell-logo-stacked.svg  monogram di atas wordmark (untuk latar gelap)

Butuh: pip install shapely fonttools brotli
Jalankan dari root repo: python3 scripts/brand-mark.py
"""
from shapely.geometry import LineString, box
from shapely.ops import unary_union
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os

ACCENT = '#f0a690'   # --color-accent
INK = '#ece8e3'      # --color-ink / cotton
DESK = '#1d1916'     # latar favicon

T = 40               # tebal goresan
R = T / 2
TOP, BOT = 20, 88
P = [(20, TOP), (55, BOT), (90, TOP), (125, BOT), (160, TOP)]
CUT_SIDE = 63        # potongan horizontal goresan luar (kiri & kanan)
CUT_MID = 45         # potongan horizontal goresan naik di tengah
MW, MH = 180, 108    # ukuran monogram


def mark_path(gap: float) -> str:
    L = [LineString([P[i], P[i + 1]]).buffer(R, quad_segs=16) for i in range(4)]
    above = lambda y: box(-50, -50, MW + 50, y)
    below = lambda y: box(-50, y, MW + 50, MH + 50)
    h = gap / 2
    pieces = [
        L[0].intersection(above(CUT_SIDE - h)).difference(L[1].buffer(gap)),
        unary_union([L[1].intersection(above(CUT_MID - h)), L[2], L[3].intersection(below(CUT_SIDE + h))]),
        unary_union([L[0].intersection(below(CUT_SIDE + h)), L[1].intersection(below(CUT_MID + h))]).difference(L[2].buffer(gap)),
        L[3].intersection(above(CUT_SIDE - h)).difference(L[2].buffer(gap)),
    ]
    out = []
    for g in pieces:
        g = g.buffer(-1.2, quad_segs=4).buffer(1.2, quad_segs=4).simplify(0.06)  # sudut potongan sedikit lembut
        for p in getattr(g, 'geoms', [g]):
            pts = list(p.exterior.coords)[:-1]
            out.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z')
    return ''.join(out).replace('.0 ', ' ').replace('.0L', 'L').replace('.0Z', 'Z')


def ttf(name: str) -> TTFont:
    f = TTFont(f'public/fonts/{name}.woff2')
    f.flavor = None
    return f


def text_path(font: TTFont, text: str, size: float, x: float, baseline: float, tracking: float = 0) -> tuple[str, float]:
    """Mengubah teks jadi path SVG. Mengembalikan (d, lebar)."""
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
    s = size / font['head'].unitsPerEm
    pen = SVGPathPen(gs)
    cx = 0.0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x + cx, baseline)))
        cx += hmtx[g][0] * s + tracking * size
    return pen.getCommands(), cx - tracking * size


def svg(w: float, h: float, body: str, label: str) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{label}">'
            f'{body}</svg>\n')


def main() -> None:
    os.makedirs('public/brand', exist_ok=True)
    d = mark_path(4.5)

    # Komponen navbar: monogram mengikuti warna teks (currentColor)
    with open('src/components/LogoMark.astro', 'w') as f:
        f.write('---\n// Dibuat oleh scripts/brand-mark.py. Jangan disunting manual.\n'
                'interface Props { class?: string }\nconst { class: cls } = Astro.props;\n---\n'
                f'<svg class={{cls}} viewBox="0 0 {MW} {MH}" aria-hidden="true" focusable="false"><path fill="currentColor" d="{d}"/></svg>\n')

    # Favicon: celah dipertebal supaya tetap terbaca di 16px
    fd = mark_path(9)
    pad, s = 14, 1
    fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {MW + 2 * pad} {MW + 2 * pad}">'
           f'<rect width="{MW + 2 * pad}" height="{MW + 2 * pad}" rx="44" fill="{DESK}"/>'
           f'<path transform="translate({pad} {pad + (MW - MH) / 2})" fill="{ACCENT}" d="{fd}"/></svg>\n')
    open('public/favicon.svg', 'w').write(fav)

    open('public/brand/worksell-mark.svg', 'w').write(svg(MW, MH, f'<path fill="{ACCENT}" d="{d}"/>', 'Worksell ID'))

    sans, mono = ttf('GeneralSans-Semibold'), ttf('GeistMono-Regular-latin')
    cap = sans['OS/2'].sCapHeight / sans['head'].unitsPerEm

    # Mendatar: tinggi monogram = tinggi huruf kapital wordmark x 1.25
    size = 120
    mh = cap * size * 1.25
    ms = mh / MH
    gap = size * 0.32
    tx = MW * ms + gap
    base = mh - (mh - cap * size) / 2
    word, ww = text_path(sans, 'worksell', size, tx, base, -0.02)
    tag, tw = text_path(mono, 'ID', size * 0.36, tx + ww + size * 0.1, base - cap * size + size * 0.36 * 0.72)
    W = tx + ww + size * 0.1 + tw
    body = (f'<path transform="scale({ms:.4f})" fill="{ACCENT}" d="{d}"/>'
            f'<path fill="{INK}" d="{word}"/><path fill="{INK}" d="{tag}"/>')
    open('public/brand/worksell-logo.svg', 'w').write(svg(W, mh, body, 'Worksell ID'))

    # Bertumpuk: seperti lembar presentasi yang dipilih
    size = 120
    word, ww = text_path(sans, 'worksell', size, 0, 0, -0.02)
    tagsize = size * 0.36
    tag, tw = text_path(mono, 'ID', tagsize, 0, 0)
    total = ww + size * 0.1 + tw
    mw = total * 0.62
    ms = mw / MW
    mh = MH * ms
    sp = size * 0.3
    W = total
    base = mh + sp + cap * size
    word, _ = text_path(sans, 'worksell', size, 0, base, -0.02)
    tag, _ = text_path(mono, 'ID', tagsize, ww + size * 0.1, base - cap * size + tagsize * 0.72)
    body = (f'<path transform="translate({(W - mw) / 2:.2f} 0) scale({ms:.4f})" fill="{ACCENT}" d="{d}"/>'
            f'<path fill="{INK}" d="{word}"/><path fill="{INK}" d="{tag}"/>')
    desc = -sans['OS/2'].sTypoDescender / sans['head'].unitsPerEm * size * 0.2
    open('public/brand/worksell-logo-stacked.svg', 'w').write(svg(W, base + desc, body, 'Worksell ID'))
    print('ok')


if __name__ == '__main__':
    main()
