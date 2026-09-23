#!/usr/bin/env python3
"""Build the illustrated Field reading guide with the current SVG renderer.

Requires reportlab and the system Cairo/librsvg libraries. All processing is local.
"""
import argparse
import ctypes as C
import json
import sys
import tempfile
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from render_field import PALETTE, RENDERER_REVISION, render  # noqa: E402

FONT_DIR = Path('/usr/share/fonts/truetype/liberation')
INK = colors.HexColor('#0D1521')
PANEL = colors.HexColor('#14202D')
TEXT = colors.HexColor('#E2EAF0')
MUTED = colors.HexColor('#9AAEBC')
HAIRLINE = colors.HexColor('#334454')
W, H = A4
MARGIN = 38


def setup_fonts():
    pdfmetrics.registerFont(TTFont('FieldSans', str(FONT_DIR / 'LiberationSans-Regular.ttf')))
    pdfmetrics.registerFont(TTFont('FieldSansBold', str(FONT_DIR / 'LiberationSans-Bold.ttf')))
    pdfmetrics.registerFont(TTFont('FieldSerif', str(FONT_DIR / 'LiberationSerif-Regular.ttf')))
    pdfmetrics.registerFont(TTFont('FieldSerifItalic', str(FONT_DIR / 'LiberationSerif-Italic.ttf')))


def rasterize(svg, output, size=640):
    rsvg = C.CDLL('librsvg-2.so.2')
    cairo = C.CDLL('libcairo.so.2')
    gobject = C.CDLL('libgobject-2.0.so.0')
    rsvg.rsvg_handle_new_from_file.argtypes = [C.c_char_p, C.POINTER(C.c_void_p)]
    rsvg.rsvg_handle_new_from_file.restype = C.c_void_p
    rsvg.rsvg_handle_render_cairo.argtypes = [C.c_void_p, C.c_void_p]
    rsvg.rsvg_handle_render_cairo.restype = C.c_int
    cairo.cairo_image_surface_create.argtypes = [C.c_int, C.c_int, C.c_int]
    cairo.cairo_image_surface_create.restype = C.c_void_p
    cairo.cairo_create.argtypes = [C.c_void_p]
    cairo.cairo_create.restype = C.c_void_p
    cairo.cairo_scale.argtypes = [C.c_void_p, C.c_double, C.c_double]
    cairo.cairo_surface_write_to_png.argtypes = [C.c_void_p, C.c_char_p]
    cairo.cairo_destroy.argtypes = [C.c_void_p]
    cairo.cairo_surface_destroy.argtypes = [C.c_void_p]
    gobject.g_object_unref.argtypes = [C.c_void_p]
    svg_path = output.with_suffix('.svg')
    svg_path.write_text(svg, encoding='utf-8')
    error = C.c_void_p()
    handle = rsvg.rsvg_handle_new_from_file(str(svg_path).encode(), C.byref(error))
    if not handle:
        raise RuntimeError(f'Could not load {svg_path}')
    surface = cairo.cairo_image_surface_create(0, size, size)
    context = cairo.cairo_create(surface)
    cairo.cairo_scale(context, size / 1000, size / 1000)
    if not rsvg.rsvg_handle_render_cairo(handle, context):
        raise RuntimeError(f'Could not render {svg_path}')
    if cairo.cairo_surface_write_to_png(surface, str(output).encode()):
        raise RuntimeError(f'Could not write {output}')
    cairo.cairo_destroy(context)
    cairo.cairo_surface_destroy(surface)
    gobject.g_object_unref(handle)
    svg_path.unlink()


class Guide:
    def __init__(self, output, temp):
        self.pdf = canvas.Canvas(str(output), pagesize=A4, pageCompression=1)
        self.pdf.setTitle('Field — A Visual Reading Guide')
        self.pdf.setAuthor('Edgar Bounds')
        self.temp = temp
        self.cache = {}
        self.page = 0

    def text(self, x, y, value, size=10, color=TEXT, font='FieldSans'):
        self.pdf.setFillColor(color)
        self.pdf.setFont(font, size)
        self.pdf.drawString(x, y, value)

    def paragraph(self, x, top, width, value, size=10, leading=14, color=TEXT, font='FieldSans'):
        style = ParagraphStyle('body', fontName=font, fontSize=size, leading=leading,
                               textColor=color, spaceAfter=0)
        p = Paragraph(value, style)
        _, height = p.wrap(width, 500)
        p.drawOn(self.pdf, x, top - height)
        return top - height

    def rule(self, x1, x2, y):
        self.pdf.setStrokeColor(HAIRLINE)
        self.pdf.setLineWidth(.6)
        self.pdf.line(x1, y, x2, y)

    def begin(self, section):
        self.page += 1
        self.pdf.setFillColor(INK)
        self.pdf.rect(0, 0, W, H, fill=1, stroke=0)
        self.text(MARGIN, H-36, 'FIELD  /  VISUAL READING GUIDE', 8, MUTED, 'FieldSansBold')
        self.text(W-112, H-36, f'V4  ·  R{RENDERER_REVISION}', 8, MUTED, 'FieldSansBold')
        self.rule(MARGIN, W-MARGIN, H-46)
        self.text(MARGIN, 31, section.upper(), 8, MUTED)
        self.pdf.setFont('FieldSans', 8)
        self.pdf.setFillColor(MUTED)
        self.pdf.drawRightString(W-MARGIN, 31, f'{self.page} / 5')

    def end(self):
        self.pdf.showPage()

    def image_path(self, spec):
        key = json.dumps(spec, sort_keys=True)
        if key not in self.cache:
            output = self.temp / f'sample-{len(self.cache):02d}.png'
            rasterize(render(spec), output)
            self.cache[key] = output
        return self.cache[key]

    def image(self, spec, x, y, side):
        self.pdf.drawImage(str(self.image_path(spec)), x, y, width=side, height=side, mask='auto')

    def detail_image(self, spec, x, y, side):
        from PIL import Image
        source = self.image_path(spec)
        crop = source.with_name(source.stem + '-detail.png')
        if not crop.exists():
            with Image.open(source) as art:
                art.crop((110, 190, 430, 510)).save(crop)
        self.pdf.drawImage(str(crop), x, y, width=side, height=side, mask='auto')

    def card(self, x, y, width, height):
        self.pdf.setFillColor(PANEL)
        self.pdf.roundRect(x, y, width, height, 9, stroke=0, fill=1)

    def title(self, title, subtitle):
        self.text(MARGIN, 747, title, 36, TEXT, 'FieldSerif')
        self.paragraph(MARGIN, 719, W-2*MARGIN, subtitle, 10.5, 15, MUTED)


def cover(g):
    g.begin('The whole expression')
    g.text(MARGIN, 740, 'Read the whole', 39, TEXT, 'FieldSerif')
    g.text(MARGIN, 699, 'expression.', 39, TEXT, 'FieldSerifItalic')
    g.paragraph(MARGIN, 672, 505,
                'Color suggests the stance. Form shows how it is held. The background supplies the climate.',
                11, 16, MUTED)
    g.image(dict(primary='teal', secondary='pearl', ambient='teal',
                 ambient_strength=.75, openness=.75, breadth=.85, folding=.05,
                 intensity=.7, definition=.85, stretch=-.2, complexity=.3), 115, 257, 365)
    g.rule(MARGIN, W-MARGIN, 253)
    cells = [
        ('The center', 'The same faceless titanium capsule represents the assistant in every Field. Its position, size, and material stay fixed.'),
        ('The envelope', 'Dominant color carries the throughline. Supporting hues and an accent blend through one connected form.'),
        ('The background', 'A diffuse, enduring conversational climate. Its colors carry the same meanings as the foreground.'),
    ]
    for i, (heading, body) in enumerate(cells):
        x = MARGIN + i*177
        g.text(x, 230, heading, 13, TEXT, 'FieldSerif')
        g.paragraph(x, 211, 158, body, 9.2, 13, MUTED)
    g.paragraph(MARGIN, 82, 510,
                'Field integrates the whole substantive conversation. Repeated Field checks are excluded from the tonal sample. The result is an interpretive expression, not an emotional measurement.',
                8.5, 12, MUTED)
    g.end()


def colors_page(g):
    g.begin('Color families')
    g.title('Six color families',
            'Each swatch holds shape and light steady while the foreground hue changes. Read color and form together.')
    meanings = [
        ('teal', 'Attention · receptivity<br/>engaged inquiry'),
        ('blue', 'Precision · analytical calm<br/>evidential restraint'),
        ('violet', 'Imagination · exploration<br/>open possibilities'),
        ('amber', 'Warmth and care<br/>constructive affiliation'),
        ('coral', 'Friction · consequential concern<br/>live tension'),
        ('pearl', 'Clarity · integration'),
    ]
    for i, (name, meaning) in enumerate(meanings):
        col, row = i % 2, i // 2
        x, y = MARGIN + col*264, 542 - row*176
        g.card(x, y, 252, 162)
        g.image(dict(primary=name, secondary=None, accent=None,
                     ambient='blue', ambient_strength=.12, openness=.52,
                     breadth=.46, folding=.08, intensity=.64,
                     definition=.78, complexity=.15), x+8, y+13, 133)
        g.pdf.setFillColor(colors.HexColor(PALETTE[name]))
        g.pdf.circle(x+155, y+120, 4.5, fill=1, stroke=0)
        g.text(x+166, y+115, name.capitalize(), 14, TEXT, 'FieldSerif')
        g.paragraph(x+153, y+97, 89, meaning, 8.5, 11.5, MUTED)
    g.paragraph(MARGIN, 153, 510,
                'Amber does not promise agreement. Coral need not mean anger. Pearl does not certify truth. Neighboring colors may blend; accent strength changes how prominently a nuance appears, not a percentage of emotion.',
                9.2, 13, TEXT)
    g.text(MARGIN, 96, 'The palette is our convention, not Banks canon.', 9, MUTED, 'FieldSerifItalic')
    g.end()


def pair(g, x, y, name, left, right, meaning, low, high):
    g.card(x, y, 252, 171)
    g.text(x+12, y+148, name, 15, TEXT, 'FieldSerif')
    g.image(low, x+4, y+49, 93)
    g.image(high, x+155, y+49, 93)
    g.text(x+10, y+42, left, 8.4, MUTED)
    g.pdf.setFont('FieldSans', 8.4)
    g.pdf.setFillColor(MUTED)
    g.pdf.drawRightString(x+242, y+42, right)
    g.paragraph(x+12, y+29, 228, meaning, 8.5, 11, TEXT)


def posture_page(g):
    g.begin('Posture and pressure')
    g.title('How the stance is held',
            'In each pair, only the named control changes. Read the whole contour before its details.')
    base = dict(primary='teal', secondary='violet', ambient='teal', openness=.5,
                breadth=.5, folding=.15, tension=.15, definition=.7, complexity=.3,
                intensity=.65)
    entries = [
        ('Openness','Gathered','Expansive','Reserve or concentration opens into receptivity or exploration.', 'openness',.08,.93),
        ('Breadth','Thin contour','Full envelope','A focused contour grows into an encompassing expression.', 'breadth',.05,.95),
        ('Folding','Smooth','Interwoven','Several qualities held together; folds do not imply distress.', 'folding',.02,.88),
        ('Tension','Supple','Compressed','Local pinching and shear suggest unresolved pressure.', 'tension',0,.95),
        ('Definition','Diffuse','Articulated','Soft, uncertain contours become clearer; not more correct.', 'definition',.05,.95),
        ('Complexity','Few filaments','Many filaments','Fine lines suggest simultaneous considerations. Zoom in; not a message count.', 'complexity',.02,.95),
    ]
    for i, (name, left, right, meaning, key, low, high) in enumerate(entries):
        x = MARGIN + (i%2)*264
        y = 528 - (i//2)*181
        pair(g, x, y, name, left, right, meaning,
             dict(base, **{key:low}), dict(base, **{key:high}))
    g.paragraph(MARGIN, 103, 510,
                'The central body, scale, and color meanings stay stable as the Field changes. Controls are visual coordinates, not psychological scores.',
                9, 13, MUTED)
    g.end()


def nuance_page(g):
    g.begin('Light and direction')
    g.title('Nuance and inflection',
            'These controls modify presence and posture. Direction has no universal emotional meaning.')
    base = dict(primary='violet', secondary='teal', ambient='violet', openness=.65,
                breadth=.55, folding=.2, tension=.1, definition=.7, complexity=.35,
                intensity=.6)
    entries = [
        ('Intensity','Quiet','Luminous','Brightness conveys salience, not certainty.', 'intensity',.12,.94),
        ('Saturation','Muted','Vivid','Color changes in vividness while keeping its meaning.', 'saturation',.32,1.25),
        ('Ambient light','Restrained','Permeating','The climate fills more space; darkness alone has no mood.', 'ambient_strength',.05,.9),
        ('Stretch','Tall mantle','Wide sweep','A change of posture, without a fixed mood.', 'stretch',-.9,.9),
        ('Flow','One angle','Another','The envelope turns around the fixed body.', 'flow',-.85,.85),
        ('Imbalance','Balanced','Pulled','An unresolved pull; its side has no topic label.', 'imbalance',0,.85),
    ]
    for i, (name, left, right, meaning, key, low, high) in enumerate(entries):
        x = MARGIN + (i%2)*264
        y = 528 - (i//2)*181
        pair(g, x, y, name, left, right, meaning,
             dict(base, **{key:low}), dict(base, **{key:high}))
    g.paragraph(MARGIN, 103, 510,
                'No universal code assigns left, right, a particular person, a topic, or a timeline to a mark.',
                9, 13, MUTED)
    g.end()


def finish_page(g):
    g.begin('Art and gestures')
    g.title('An artwork, still legible',
            f'Revision {RENDERER_REVISION} gathers light along the curved surface and deepens its folds while preserving Field v4 and synthesis protocol 3.2. The gesture details below are enlarged from real fields.')
    gestures = [('none','No added inflection'),('fold','A local bend'),
                ('echo','A continuation'),('braid','Intertwining')]
    base = dict(primary='amber', secondary='violet', ambient='amber', openness=.75,
                breadth=.55, folding=.5, tension=.12, definition=.85,
                complexity=.42, intensity=.68)
    for i, (name, meaning) in enumerate(gestures):
        x = MARGIN+i*132
        g.card(x, 474, 124, 198)
        g.detail_image(dict(base, gesture=name, gesture_strength=1), x+2, 542, 120)
        g.text(x+11, 521, name.capitalize(), 12.5, TEXT, 'FieldSerif')
        g.paragraph(x+11, 506, 105, meaning, 8.8, 11.5, MUTED)
    g.text(MARGIN, 444, 'The artistic standard', 19, TEXT, 'FieldSerif')
    g.rule(MARGIN, W-MARGIN, 431)
    standard = ('Treat every Field as a finished abstract artwork. Seek expressive economy, compelling negative space, sensitive curvature, and depth through light and translucency. Let beauty arise from the qualities being communicated. A quiet field should have the presence of a spare, assured drawing; a complex field should reward sustained looking without losing its immediate expression. Refine the rendering without exaggerating the stance. Every artistic choice must preserve the established color meanings, structural cues, and readability at phone size.')
    bottom = g.paragraph(MARGIN, 413, 510, standard, 12, 18, TEXT, 'FieldSerif')
    g.rule(MARGIN, W-MARGIN, bottom-20)
    g.paragraph(MARGIN, bottom-40, 510,
                'Curvature, translucent color, and selective light describe the chosen stance. Quiet fields retain space; complex fields keep a clear silhouette. Beauty is incidental to the communicative work, never an excuse to increase tension, intensity, or ornament.',
                9.5, 14, MUTED)
    g.paragraph(MARGIN, 107, 510,
                'All illustrations in this guide were rendered from the current Field SVG renderer. The PDF uses rasterized copies of those SVGs for portability; the skill and its SVG source remain the reference.',
                8.5, 12, MUTED)
    g.end()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT/'docs/field-guide.pdf')
    args = parser.parse_args()
    setup_fonts()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='field-guide-') as folder:
        g = Guide(args.output, Path(folder))
        cover(g)
        colors_page(g)
        posture_page(g)
        nuance_page(g)
        finish_page(g)
        g.pdf.save()
    print(args.output)


if __name__ == '__main__':
    main()
