"""Build the static brand exports from one geometry and palette definition.

Run from any directory: python3 tools/build_logos.py
"""
from math import cos, radians, sin
from pathlib import Path
import json
from xml.sax.saxutils import escape

OUTPUT = Path(__file__).resolve().parents[1] / 'mock'
PALETTES = {
    'galicia-tech-logo': ('Verde y menta', '#DDF3EA', '#175B4C', '#12483D', '#DDF3EA'),
    'galicia-tech-logo-vieira-atlantica': ('Uva y lavanda', '#E8DDF8', '#7051A2', '#493773', '#E8DDF8'),
    'galicia-tech-logo-vieira-piedra': ('Atlántico', '#DDEEF0', '#176D7B', '#104E59', '#B6E1DF'),
    'galicia-tech-logo-vieira-pizarra': ('Terracota y arena', '#F7E8CB', '#B75E43', '#86432F', '#FFE9D5'),
}

DARK_PRIMARY = ('Verde y menta · fondo oscuro', '#193C34', '#A7DCC0', '#C5EBD6', '#214D40')


def to_right(x, y):
    """Design a natural upright scallop, then turn its opening to the right."""
    return y, 60 - x


def vertical_rim(angle, lift=0):
    theta = radians(angle)
    return 30 + (24 + lift) * sin(theta), 13 + (37 + lift) * cos(theta)


def point(xy):
    x, y = to_right(*xy)
    return f'{x:.3f} {y:.3f}'


def outline():
    """Narrow hinge with two ears; nine broad scallops on the outer rim.

    Each lobe is one smooth quadratic curve aligned to a major rib. The
    shoulders stay smooth: scalloping belongs to the free rim, not the hinge.
    """
    d = [f'M{point((26, 11))}',
         f'L{point((22, 9.5))}',
         f'Q{point((19, 8.5))} {point((20, 12))}',
         f'L{point((21.5, 18))}',
         f'C{point((18.5, 20))} {point((10, 21.5))} {point(vertical_rim(-72))}']
    for angle in range(-72, 72, 16):
        start, end = vertical_rim(angle), vertical_rim(angle + 16)
        crest = vertical_rim(angle + 8, lift=1.15)
        control = tuple(2 * crest[k] - (start[k] + end[k]) / 2 for k in (0, 1))
        d.append(f'Q{point(control)} {point(end)}')
    d.extend([f'C{point((50, 21.5))} {point((41.5, 20))} {point((38.5, 18))}',
              f'L{point((40, 12))}',
              f'Q{point((41, 8.5))} {point((38, 9.5))}',
              f'L{point((34, 11))}',
              f'Q{point((30, 9))} {point((26, 11))} Z'])
    return ' '.join(d)


SHELL = outline()


def symbol(palette, compact=False):
    _, tile, fill, edge, rib = palette
    # Ridges terminate in the centres of the perimeter lobes.
    angles = (-64, -32, 0, 32, 64) if compact else range(-64, 65, 16)
    paths = []
    root = (30, 14)
    for angle in angles:
        x, y = vertical_rim(angle, lift=.25)
        end = (30 + (x - 30) * .97, 14 + (y - 14) * .97)
        control = (30 + (end[0] - 30) * .46, 14 + (end[1] - 14) * .60)
        paths.append(f'<path class="component-rib" pathLength="1" d="M{point(root)} Q{point(control)} {point(end)}"/>')
    width = 1.35 if compact else 1.0
    return f'''<defs><clipPath id="shell-clip"><path d="{SHELL}"/></clipPath></defs>
<rect class="component-tile" x="2" y="2" width="56" height="56" rx="17" fill="{tile}"/>
<g class="component-shell">
  <path class="shell-outline component-outline" pathLength="1" d="{SHELL}" fill="{fill}" stroke="{edge}" stroke-width="1.25" stroke-linejoin="round"/>
  <g class="component-ribs" clip-path="url(#shell-clip)" fill="none" stroke="{rib}" stroke-width="{width}" stroke-linecap="round">{''.join(paths)}</g>
</g>'''


def export(palette, icon=False, compact=False, dark=False):
    width = 60 if icon else 286
    text, muted = ('#E4F1EA', '#B3CDBE') if dark else ('#20332F', '#65756F')
    wordmark = '' if icon else f'''<text class="component-wordmark" x="70" y="29" fill="{text}" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="21" font-weight="750" letter-spacing="-.8">Galicia Tech</text>
<text class="component-tagline" x="71" y="46" fill="{muted}" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="10.5" font-weight="600" letter-spacing=".25">COMUNIDADES Y ENCUENTROS</text>'''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="60" viewBox="0 0 {width} 60" role="img" aria-labelledby="title desc">
<title id="title">Galicia Tech · {escape(palette[0])}</title>
<desc id="desc">Vieira abierta hacia la derecha, con bisagra a la izquierda, borde ondulado y nervaduras curvas.</desc>
{symbol(DARK_PRIMARY if dark else palette, compact)}
{wordmark}
</svg>
'''


def main():
    for name, palette in PALETTES.items():
        (OUTPUT / f'{name}.svg').write_text(export(palette), encoding='utf-8')
    primary = PALETTES['galicia-tech-logo']
    (OUTPUT / 'galicia-tech-logo-dark.svg').write_text(export(primary, dark=True), encoding='utf-8')
    (OUTPUT / 'galicia-tech-symbol.svg').write_text(export(primary, icon=True), encoding='utf-8')
    (OUTPUT / 'galicia-tech-symbol-compact.svg').write_text(export(primary, icon=True, compact=True), encoding='utf-8')
    (OUTPUT / 'galicia-tech-symbol-dark.svg').write_text(export(primary, icon=True, dark=True), encoding='utf-8')
    (OUTPUT / 'galicia-tech-symbol-compact-dark.svg').write_text(export(primary, icon=True, compact=True, dark=True), encoding='utf-8')
    (OUTPUT / 'favicon.svg').write_text(export(primary, icon=True, compact=True), encoding='utf-8')
    brand_assets = OUTPUT / 'assets' / 'brand'
    brand_assets.mkdir(parents=True, exist_ok=True)
    maskable = f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 60 60" role="img" aria-labelledby="title desc">
<title id="title">Galicia Tech</title><desc id="desc">Icono de aplicación con la vieira verde y menta.</desc>
<rect width="60" height="60" fill="{primary[1]}"/>
<g transform="translate(6 6) scale(.8)">{symbol(primary)}</g>
</svg>
'''
    (brand_assets / 'app-icon-maskable.svg').write_text(maskable, encoding='utf-8')
    manifest = {
        'id': './', 'name': 'Galicia Tech', 'short_name': 'Galicia Tech',
        'description': 'Agenda de eventos tecnológicos en Galicia.', 'lang': 'es',
        'start_url': './agenda.html', 'scope': './', 'display': 'standalone',
        'background_color': '#edf4f2', 'theme_color': '#175B4C',
        'icons': [
            {'src': 'assets/brand/app-icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'assets/brand/app-icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'assets/brand/app-icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }
    (OUTPUT / 'site.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # Shared inline-header tokens use the same values as the standalone exports.
    color_rules = []
    for selector, palette, text, muted in [
        ('.app-brand', primary, '#20332F', '#65756F'),
        (':root[data-theme="dark"] .app-brand, .app-brand[data-brand-theme="dark"]', DARK_PRIMARY, '#E4F1EA', '#B3CDBE'),
    ]:
        names = ('tile', 'shell', 'edge', 'rib')
        values = ';'.join(f'--brand-{name}:{value}' for name, value in zip(names, palette[1:]))
        color_rules.append(f'{selector}{{{values};--brand-text:{text};--brand-muted:{muted}}}')
    (OUTPUT / 'brand-colors.css').write_text('/* Generated by tools/build_logos.py. */\n' + '\n'.join(color_rules) + '\n', encoding='utf-8')

    print('11 SVG exports, header palette and app manifest generated from one source.')


if __name__ == '__main__':
    main()
