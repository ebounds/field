#!/usr/bin/env python3
"""Build the blind comparison sheet a person fills in.

    CHROME_BIN=/path/to/chromium python3 scripts/xagent/sheet.py [--sheet 2]
    python3 scripts/xagent/sheet.py 'FIELD-SHEET-2 1:AB 2:B= ...'      # score a pasted code

Each study is shown as a pair, one renderer revision beside another, in both
orders, shuffled. The page never says which is which: it gives a code to paste
back, and the key that decodes it is written to results/, not to the page.
The page goes to .xagent/sheet/ (ignored by git). Standard library only.
"""
import base64
import json
import random
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import items  # noqa: E402

SHEET = items.WORK / 'sheet'
RESULTS = Path(__file__).resolve().parent / 'results'
SIZE = 320
# Each sheet: its key file, the revisions it draws, which of them it sets side by side,
# and studies shown only for some of those pairs. A sheet already filled in is never rebuilt
# over its key, so its answers stay scoreable.
SHEETS = {
    '1': {'key': 'blind-sheet-key.json', 'revs': ('4.3', '4.4'), 'versus': (('4.3', '4.4'),), 'extra': ()},
    # Stage 3: the new revision beside each of the two before it; `described` only where both draw it.
    '2': {'key': 'blind-sheet-2-key.json', 'revs': ('4.3', '4.4', '4.5'),
          'versus': (('4.4', '4.5'), ('4.3', '4.5')), 'extra': (('described', '4.4', '4.5'),)},
}
LATEST = '2'

PAGE = '''<title>Field Blind Sheet</title>
<style>
/* One pair at a time on the fields' own dark ground: the pictures are judged against it. */
:root {
  --bg: #0b111b; --panel: #101823; --text: #e6e5df; --muted: #99a6b5; --line: #26323e;
  --warm: #d9cbb3; --teal: #75cabe;
  --font: Inter, "Segoe UI", Arial, sans-serif;
  --serif: Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
body { background: var(--bg); color: var(--text); font: 16px/1.5 var(--font); padding-inline: 16px; padding-block: 28px 56px; }
main { max-width: 720px; margin-inline: auto; display: flex; flex-direction: column; gap: 22px; }
h1 { font: 400 30px/1.15 var(--serif); margin: 0; text-wrap: balance; }
.lede { color: var(--muted); margin: 0; max-width: 60ch; }
.count { color: var(--warm); font-size: 13px; letter-spacing: .08em; text-transform: uppercase; font-variant-numeric: tabular-nums; }
.pair { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
figure { margin: 0; display: flex; flex-direction: column; gap: 8px; align-items: center; }
figure img { display: block; width: SIZEpx; max-width: 100%; height: auto; aspect-ratio: 1; background: #000; }
figcaption { font: 400 20px/1 var(--serif); color: var(--warm); }
section { display: flex; flex-direction: column; gap: 22px; }
.q { border-top: 1px solid var(--line); padding-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.q p { margin: 0; }
.choices { display: flex; flex-wrap: wrap; gap: 8px; }
.choices label { cursor: pointer; }
.choices input { position: absolute; opacity: 0; }
.choices span { display: inline-block; min-width: 56px; text-align: center; padding: 9px 16px; border: 1px solid var(--line); border-radius: 3px; background: var(--panel); color: var(--text); }
.choices input:checked + span { border-color: var(--teal); color: var(--bg); background: var(--teal); }
.choices input:focus-visible + span { outline: 2px solid var(--warm); outline-offset: 2px; }
.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
button { font: inherit; padding: 10px 20px; border-radius: 3px; border: 1px solid var(--teal); background: transparent; color: var(--teal); cursor: pointer; }
button:disabled { border-color: var(--line); color: var(--muted); cursor: default; }
button:focus-visible { outline: 2px solid var(--warm); outline-offset: 2px; }
.quiet { border-color: var(--line); color: var(--muted); }
#code { width: 100%; font: 14px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; background: var(--panel); color: var(--text); border: 1px solid var(--line); border-radius: 3px; padding: 12px; overflow-wrap: anywhere; user-select: all; }
#said { color: var(--muted); min-height: 1.5em; margin: 0; }
</style>
<main>
  <h1>Which field reads faster?</h1>
  <p class="lede">COUNT pairs. Glance at each, answer two questions, and go on. There is no right answer. Trust the first look.</p>
  <section id="trial">
    <div class="row"><span class="count" id="count">Pair 1 of COUNT</span></div>
    <div class="pair">
      <figure><img id="img-a" alt="Field A" width="SIZE" height="SIZE"><figcaption>A</figcaption></figure>
      <figure><img id="img-b" alt="Field B" width="SIZE" height="SIZE"><figcaption>B</figcaption></figure>
    </div>
    <div class="q" role="radiogroup" aria-labelledby="l-faster">
      <p id="l-faster">Which tells you faster what it's like?</p>
      <div class="choices">
        <label><input type="radio" name="faster" id="faster-a" value="A"><span>A</span></label>
        <label><input type="radio" name="faster" id="faster-b" value="B"><span>B</span></label>
        <label><input type="radio" name="faster" id="faster-same" value="="><span>No difference</span></label>
      </div>
    </div>
    <div class="q" role="radiogroup" aria-labelledby="l-keep">
      <p id="l-keep">Which would you keep looking at?</p>
      <div class="choices">
        <label><input type="radio" name="keep" id="keep-a" value="A"><span>A</span></label>
        <label><input type="radio" name="keep" id="keep-b" value="B"><span>B</span></label>
        <label><input type="radio" name="keep" id="keep-same" value="="><span>No difference</span></label>
      </div>
    </div>
    <div class="row">
      <button id="back" class="quiet" type="button">Back</button>
      <button id="next" type="button" disabled>Next pair</button>
    </div>
  </section>
  <section id="done" hidden>
    <p class="lede">Done. Copy this code and paste it to Claude. It records your choices, not which picture was which.</p>
    <div id="code"></div>
    <div class="row"><button id="copy" type="button">Copy the code</button><button id="review" class="quiet" type="button">Go back through them</button></div>
    <p id="said" role="status"></p>
  </section>
</main>
<script>
const IMAGES = IMAGES_JSON;
const TRIALS = TRIALS_JSON;   // [image for A, image for B] per pair; nothing here says which is which
const STORE = 'field-sheet-SHEET_ID';
let answers = TRIALS.map(() => ({faster: '', keep: ''})), at = 0;
try { const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
  if (saved && saved.answers && saved.answers.length === TRIALS.length) { answers = saved.answers; at = Math.min(saved.at || 0, TRIALS.length); } } catch (e) {}
const $ = id => document.getElementById(id);
function save() { try { localStorage.setItem(STORE, JSON.stringify({answers, at})); } catch (e) {} }
function code() { return 'FIELD-SHEET-SHEET_ID ' + answers.map((a, i) => (i + 1) + ':' + (a.faster || '?') + (a.keep || '?')).join(' '); }
function show() {
  const finished = at >= TRIALS.length;
  $('trial').hidden = finished; $('done').hidden = !finished;
  if (finished) { $('code').textContent = code(); save(); return; }
  $('count').textContent = 'Pair ' + (at + 1) + ' of ' + TRIALS.length;
  $('img-a').src = IMAGES[TRIALS[at][0]]; $('img-b').src = IMAGES[TRIALS[at][1]];
  for (const q of ['faster', 'keep']) for (const input of document.getElementsByName(q)) input.checked = input.value === answers[at][q];
  $('back').disabled = at === 0;
  $('next').disabled = !(answers[at].faster && answers[at].keep);
  $('next').textContent = at === TRIALS.length - 1 ? 'Finish' : 'Next pair';
  save();
}
for (const q of ['faster', 'keep']) for (const input of document.getElementsByName(q))
  input.addEventListener('change', () => { answers[at][q] = input.value; show(); });
$('next').addEventListener('click', () => { at++; show(); window.scrollTo(0, 0); });
$('back').addEventListener('click', () => { if (at > 0) at--; show(); });
$('review').addEventListener('click', () => { at = 0; show(); });
$('copy').addEventListener('click', () => {
  const text = code(), say = words => { $('said').textContent = words; };
  const select = () => { const range = document.createRange(); range.selectNodeContents($('code'));
    const picked = getSelection(); picked.removeAllRanges(); picked.addRange(range); say('Selected. Copy it with your keyboard or the menu.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => say('Copied.'), select);
  else select();
});
show();
</script>
'''


def main(sheet_id):
    items.load()
    sheet = SHEETS[sheet_id]
    revs, key = list(sheet['revs']), RESULTS / sheet['key']
    if key.exists() and '--again' not in sys.argv:
        sys.exit(f'Sheet {sheet_id} already has a key ({key.name}). A new sheet needs a new entry in SHEETS; '
                 'pass --again only to rebuild the same page.')
    SHEET.mkdir(parents=True, exist_ok=True)
    shuffle = random.Random(f'field-4.7 sheet {sheet_id}')
    built = {rev: items.stamp(rev) for rev in revs}
    images, ids = {}, {}
    names = list(items.SHARED) + [name for name, *_ in sheet['extra'] if name not in items.SHARED]
    for name in names:
        for rev in revs:
            if name not in items.SHARED and not any(rev in extra[1:] for extra in sheet['extra'] if extra[0] == name):
                continue
            # Twice the pixels, shown at SIZE: how a field looks on a phone or a sharp screen.
            png = SHEET / f'{name}-{rev}-{built[rev]}.png'
            if not png.exists():
                svg = items.WORK / 'svg' / f'study-{name}-{rev}.svg'
                html = png.with_suffix('.html')
                html.write_text('<style>html,body{margin:0;background:#000}img{display:block;width:%dpx;height:%dpx}'
                                '</style><img src="../svg/%s">' % (SIZE, SIZE, svg.name))
                subprocess.run([items.chrome(), '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
                                '--force-device-scale-factor=2', f'--window-size={SIZE},{SIZE}',
                                '--virtual-time-budget=4000', f'--screenshot={png}', str(html)],
                               check=True, capture_output=True, timeout=120)
                html.unlink()
            ids[(name, rev)] = 'i' + format(shuffle.getrandbits(32), '08x')
            images[ids[(name, rev)]] = 'data:image/png;base64,' + base64.b64encode(png.read_bytes()).decode()
    trials = []
    for name in items.SHARED:
        for first, second in sheet['versus']:
            trials += [(name, first, second), (name, second, first)]
    for name, first, second in sheet['extra']:
        trials += [(name, first, second), (name, second, first)]
    shuffle.shuffle(trials)
    # No study twice in a row, so the second look at a pair isn't a memory of the first.
    for _ in range(200):
        if all(trials[i][0] != trials[i + 1][0] for i in range(len(trials) - 1)):
            break
        shuffle.shuffle(trials)
    # The images go in last: base64 can contain any of the other placeholders by chance.
    page = (PAGE.replace('SHEET_ID', sheet_id).replace('COUNT', str(len(trials))).replace('SIZE', str(SIZE))
            .replace('TRIALS_JSON', json.dumps([[ids[(n, a)], ids[(n, b)]] for n, a, b in trials]))
            .replace('IMAGES_JSON', json.dumps(dict(sorted(images.items())))))
    key.parent.mkdir(exist_ok=True)
    record = {'sheet': sheet_id, 'size': SIZE, 'packages': {r: items.REVISIONS[r][0] for r in revs},
              'trials': [{'pair': i + 1, 'study': n, 'A': a, 'B': b} for i, (n, a, b) in enumerate(trials)]}
    if sheet_id != '1':
        record['built'] = built       # which build of each renderer the pictures came from
    key.write_text(json.dumps(record, indent=1) + '\n')
    page_file = SHEET / ('blind-sheet.html' if sheet_id == '1' else f'blind-sheet-{sheet_id}.html')
    page_file.write_text(page)
    print(f'{len(trials)} pairs -> {page_file} ({len(page)//1024} KB); key -> {key.name}')


def decode(text):
    """Score a pasted code against its sheet's key: python3 sheet.py 'FIELD-SHEET-1 1:AB 2:B= ...'"""
    sheet_id = text.split()[0].rpartition('-')[2]
    key = json.loads((RESULTS / SHEETS[sheet_id]['key']).read_text())
    tally = {'faster': {}, 'keep': {}}
    rows, by_study = [], {}
    for part in text.split()[1:]:
        number, _, marks = part.partition(':')
        trial = key['trials'][int(number) - 1]
        picked = {}
        for question, mark in zip(('faster', 'keep'), marks):
            picked[question] = trial.get(mark, 'same' if mark == '=' else 'unanswered')
            tally[question][picked[question]] = tally[question].get(picked[question], 0) + 1
            by_study.setdefault((tuple(sorted((trial['A'], trial['B']))), question, trial['study']), []).append(picked[question])
        rows.append((trial['study'], f'A={trial["A"]} B={trial["B"]}', picked['faster'], picked['keep']))
    for row in sorted(rows):
        print('  %-11s %-14s faster: %-10s keep looking: %s' % row)
    for question, counts in tally.items():
        print(question + ':', ', '.join(f'{k} {v}' for k, v in sorted(counts.items())))
    if sheet_id == '1':
        return
    # A study counts for a revision only when both orders agree (PREREG.md, Stage 3).
    print()
    for versus in sorted({pair for pair, _, _ in by_study}):
        for question in ('faster', 'keep'):
            wins = {rev: [] for rev in versus}
            for (pair, asked, study), picks in sorted(by_study.items()):
                if pair == versus and asked == question and len(picks) == 2 and picks[0] == picks[1] and picks[0] in wins:
                    wins[picks[0]].append(study)
            print(f'{versus[0]} beside {versus[1]}, {question}: ' + '; '.join(
                f'{rev} in {len(found)} ({", ".join(found) or "none"})' for rev, found in wins.items()))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--again']
    if args and args[0].startswith('FIELD-SHEET-'):
        decode(args[0])
    else:
        main(args[args.index('--sheet') + 1] if '--sheet' in args else LATEST)
