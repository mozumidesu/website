#!/usr/bin/env python3
"""Copies the web fonts the site needs and writes assets/css/fonts.css.
Japanese is subset to the characters the site actually uses."""
import pathlib, re, shutil, subprocess
from fontTools import subset as ftsubset
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

X = pathlib.Path('/tmp/claude-0/fonts/x')
P = pathlib.Path('/home/claude/website/public')
OUT = P / 'assets/fonts'
OUT.mkdir(parents=True, exist_ok=True)
for f in OUT.glob('*.woff2'):
    f.unlink()

def pkg(name):
    return next(X.glob(f'fontsource-{name}-*/package/files'))

RANGES = {}
def ranges_of(css_path):
    css = pathlib.Path(css_path).read_text()
    for m in re.finditer(r'/\* ([\w-]+?)-(?:\d{3}|wght|standard)-normal \*/\s*@font-face\s*\{[^}]*?unicode-range:\s*([^;]+);', css):
        RANGES.setdefault(m.group(1), m.group(2).strip())
for css in X.glob('fontsource-*/package/*.css'):
    ranges_of(css)

def rng(family_prefix, subset):
    key = f'{family_prefix}-{subset}'
    return RANGES[key]

faces = []
def face(family, file, weight, urange, extra=''):
    faces.append(f"@font-face{{font-family:\"{family}\";src:url(../fonts/{file}) format(\"woff2\");font-weight:{weight};font-style:normal;font-display:swap;unicode-range:{urange};{extra}}}")

def copy(src_dir, fname, dst):
    shutil.copy(src_dir / fname, OUT / dst)
    return dst

# characters used across the site (pages, dictionaries, scripts)
text = ''
for f in list(P.rglob('*.html')) + list((P / 'assets/i18n').glob('*.js')) + list((P / 'assets/js').glob('*.js')):
    text += f.read_text()
cjk = lambda c: 0x3000 <= ord(c) <= 0x30FF or 0x3400 <= ord(c) <= 0x9FFF or 0xFF00 <= ord(c) <= 0xFFEF
used = {c for c in text if cjk(c)}
hangul = lambda c: 0xAC00 <= ord(c) <= 0xD7A3 or 0x3130 <= ord(c) <= 0x318F
korean_chars = {c for c in text if hangul(c)}
kana = {chr(c) for c in list(range(0x3000, 0x3040)) + list(range(0x3041, 0x3097)) + list(range(0x309B, 0x30FF))}
decor_chars = set('茂住翻訳自己紹介連絡本音機能鍵導入質問助歳') | set('イヴァン伊万こんにちは你好') \
    | set('アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン') \
    | set('言語文字翻訳話中心大小山川水火木金土日月人口手目耳')
full_chars = (used | kana) - decor_chars

def urange_of(chars):
    cps = sorted(ord(c) for c in chars)
    out, start, prev = [], None, None
    for cp in cps:
        if start is None: start = prev = cp
        elif cp == prev + 1: prev = cp
        else:
            out.append((start, prev)); start = prev = cp
    if start is not None: out.append((start, prev))
    return ','.join(f'U+{a:04X}' if a == b else f'U+{a:04X}-{b:04X}' for a, b in out)

def subset(src, chars, dst):
    (OUT / 'chars.txt').write_text(''.join(sorted(chars)))
    subprocess.run(['pyftsubset', str(src), f'--text-file={OUT / "chars.txt"}', '--flavor=woff2',
                    f'--output-file={OUT / dst}', '--layout-features=*', '--no-hinting', '--desubroutinize'], check=True)
    (OUT / 'chars.txt').unlink()
    have = set(chr(c) for c in TTFont(OUT / dst).getBestCmap())
    return have & chars

dela, zen, plexar, plexth, mono, onest = pkg('dela-gothic-one'), pkg('zen-kaku-gothic-new'), pkg('ibm-plex-sans-arabic'), pkg('ibm-plex-sans-thai'), pkg('variable-martian-mono'), pkg('variable-onest')
plexkr = pkg('ibm-plex-sans-kr')

# display: Dela Gothic One + bold Arabic and Thai for their scripts
latin_sets = ['cyrillic', 'vietnamese', 'latin-ext', 'latin']  # latin last: it wins the codepoints latin-ext also claims
for fam in ['ZL Display', 'ZL Display Latin']:
    for s in latin_sets:
        fn = copy(dela, f'dela-gothic-one-{s}-400-normal.woff2', f'dela-{s}.woff2')
        face(fam, fn, 400, rng('dela-gothic-one', s))
    fn = copy(plexar, 'ibm-plex-sans-arabic-arabic-700-normal.woff2', 'plexar-arabic-700.woff2')
    face(fam, fn, 400, rng('ibm-plex-sans-arabic', 'arabic'))
    fn = copy(plexth, 'ibm-plex-sans-thai-thai-700-normal.woff2', 'plexth-thai-700.woff2')
    face(fam, fn, 400, rng('ibm-plex-sans-thai', 'thai'))
    got = subset(plexkr / 'ibm-plex-sans-kr-korean-700-normal.woff2', korean_chars, 'plexkr-korean-700.woff2')
    face(fam, 'plexkr-korean-700.woff2', 400, urange_of(got))
dsrc = dela / 'dela-gothic-one-japanese-400-normal.woff2'
got = subset(dsrc, decor_chars, 'dela-ja-decor.woff2')
face('ZL Display', 'dela-ja-decor.woff2', 400, urange_of(got))
got = subset(dsrc, full_chars, 'dela-ja.woff2')
face('ZL Display', 'dela-ja.woff2', 400, urange_of(got))

# text: Zen Kaku Gothic New + IBM Plex Sans Arabic / Thai
for fam in ['ZL Text', 'ZL Text Latin']:
    for w in (400, 500, 700):
        for s in ['cyrillic', 'latin-ext', 'latin']:
            fn = copy(zen, f'zen-kaku-gothic-new-{s}-{w}-normal.woff2', f'zen-{s}-{w}.woff2')
            face(fam, fn, w, rng('zen-kaku-gothic-new', s))
        fn = copy(plexar, f'ibm-plex-sans-arabic-arabic-{w}-normal.woff2', f'plexar-arabic-{w}.woff2')
        face(fam, fn, w, rng('ibm-plex-sans-arabic', 'arabic'))
        fn = copy(plexth, f'ibm-plex-sans-thai-thai-{w}-normal.woff2', f'plexth-thai-{w}.woff2')
        face(fam, fn, w, rng('ibm-plex-sans-thai', 'thai'))
        if fam == 'ZL Text':
            got = subset(plexkr / f'ibm-plex-sans-kr-korean-{w}-normal.woff2', korean_chars, f'plexkr-korean-{w}.woff2')
            face(fam, f'plexkr-korean-{w}.woff2', w, urange_of(got))
zen_decor = set('翻訳自己紹介連絡本音機能鍵導入質問助')
got = subset(zen / 'zen-kaku-gothic-new-japanese-700-normal.woff2', zen_decor, 'zen-ja-decor-700.woff2')
face('ZL Text', 'zen-ja-decor-700.woff2', 700, urange_of(got))
for w in (400, 700):
    chars = (used | kana) - (zen_decor if w == 700 else set())
    got = subset(zen / f'zen-kaku-gothic-new-japanese-{w}-normal.woff2', chars, f'zen-ja-{w}.woff2')
    face('ZL Text', f'zen-ja-{w}.woff2', w, urange_of(got))

# text, missing letters: Zen Kaku Gothic New has no ă ș ț, no Ukrainian і ї є and no
# Vietnamese vowels, so the browser used to drop to a system font for exactly those
# letters and they stood out. They come from Onest instead, scaled to Zen's x-height
# and cap-height and set to the Onest weight whose stems match Zen's.
def shape(font):
    cm, gs, k = font.getBestCmap(), font.getGlyphSet(), 1000 / font['head'].unitsPerEm
    def box(ch):
        bp = BoundsPen(gs); gs[cm[ord(ch)]].draw(bp); return bp.bounds
    return {'lo': box('x')[3] * k, 'up': box('H')[3] * k,
            'stem-lo': (box('l')[2] - box('l')[0]) * k, 'stem-up': (box('I')[2] - box('I')[0]) * k}

onest_file = {s: onest / f'onest-{s}-wght-normal.woff2' for s in ('latin-ext', 'cyrillic', 'vietnamese', 'latin')}
def onest_at(weight, part='latin'):
    return instantiateVariableFont(TTFont(onest_file[part]), {'wght': weight}, inplace=False)

zen_shape = {w: shape(TTFont(zen / f'zen-kaku-gothic-new-latin-{w}-normal.woff2')) for w in (400, 500, 700)}
onest_shape = shape(onest_at(400))
curve = [(w, shape(onest_at(w))) for w in range(100, 901, 25)]

def onest_weight(stem, key):
    prev = curve[0]
    for pt in curve[1:]:
        if pt[1][key] >= stem:
            a, b = prev[1][key], pt[1][key]
            return round(prev[0] + (pt[0] - prev[0]) * (stem - a) / (b - a)) if b > a else pt[0]
        prev = pt
    return curve[-1][0]

zen_has = set()
for s in ('latin', 'latin-ext', 'cyrillic'):
    zen_has |= set(TTFont(zen / f'zen-kaku-gothic-new-{s}-400-normal.woff2').getBestCmap())
onest_has = {s: set(TTFont(f).getBestCmap()) for s, f in onest_file.items()}
alphabets = set('ăĂâÂîÎșȘțȚ') | set('çÇğĞıİöÖşŞüÜ') | set('ґҐєЄіІїЇ')  # Romanian, Turkish, Ukrainian in full
groups = {}
for c in sorted(set(text) | alphabets):
    if not c.isalpha() or ord(c) in zen_has:
        continue
    part = next((s for s in ('latin-ext', 'cyrillic', 'vietnamese', 'latin') if ord(c) in onest_has[s]), None)
    if part:
        groups.setdefault((part, 'lo' if c.islower() else 'up'), set()).add(c)

for (part, grp), chars in sorted(groups.items()):
    adjust = zen_shape[400][grp] / onest_shape[grp]
    for w in (400, 500, 700):
        f = onest_at(onest_weight(zen_shape[w]['stem-' + grp] / adjust, 'stem-' + grp), part)
        opt = ftsubset.Options(); opt.layout_features = []; opt.hinting = False; opt.desubroutinize = True
        cut = ftsubset.Subsetter(options=opt); cut.populate(text=''.join(sorted(chars))); cut.subset(f)
        fn = f'onest-fill-{part}-{grp}-{w}.woff2'
        f.flavor = 'woff2'; f.save(OUT / fn)
        got = {chr(c) for c in f.getBestCmap()} & chars
        for fam in ('ZL Text', 'ZL Text Latin'):
            face(fam, fn, w, urange_of(got), f'size-adjust:{adjust * 100:.2f}%;')
    print('fill', part, grp, ''.join(sorted(chars)))


# mono: Martian Mono, variable weight and width
for s in ['cyrillic', 'latin-ext', 'latin']:
    fn = copy(mono, f'martian-mono-{s}-standard-normal.woff2', f'martian-{s}.woff2')
    face('ZL Mono', fn, '100 800', rng('martian-mono', s), 'font-stretch:75% 112.5%;')

# Vietnamese body text: Onest
for s in ['cyrillic', 'vietnamese', 'latin-ext', 'latin']:
    fn = copy(onest, f'onest-{s}-wght-normal.woff2', f'onest-{s}.woff2')
    face('ZL Onest', fn, '100 900', rng('onest', s))

(P / 'assets/css/fonts.css').write_text('/* fonts: Dela Gothic One, Zen Kaku Gothic New, Martian Mono, Onest (SIL OFL 1.1); IBM Plex Sans Arabic, Thai and KR (SIL OFL 1.1) */\n' + '\n'.join(faces) + '\n')
total = sum(f.stat().st_size for f in OUT.glob('*.woff2'))
print(len(faces), 'faces;', len(list(OUT.glob('*.woff2'))), 'files;', total // 1024, 'KB total')
for f in sorted(OUT.glob('*ja*')): print(' ', f.name, f.stat().st_size // 1024, 'KB')
