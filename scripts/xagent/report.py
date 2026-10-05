#!/usr/bin/env python3
"""Score the trials in a results file and write a short report beside it.

    python3 scripts/xagent/report.py [stage2.jsonl]

What is scored, and against what, is fixed in PREREG.md. Standard library only.
"""
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import items  # noqa: E402

RESULTS = Path(__file__).resolve().parent / 'results'
FAMILIES = ('Anthropic', 'OpenAI', 'xAI', 'Google')
CHANCE = 1/len(items.WORDS)


def wilson(hits, n, z=1.96):
    if not n:
        return (0, 0)
    p, d = hits/n, 1 + z*z/n
    centre, half = (p + z*z/(2*n))/d, z*math.sqrt(p*(1 - p)/n + z*z/(4*n*n))/d
    return (max(0, centre - half), min(1, centre + half))


def cell(hits, n):
    if not n:
        return '–'
    low, high = wilson(hits, n)
    return f'{hits/n:.2f} ({low:.2f}–{high:.2f}, n={n})'


def load(path):
    rows, waiting = {}, {}
    for line in path.read_text().splitlines():
        row = json.loads(line)
        if row.get('ok'):
            rows[row['key']] = row
        else:
            waiting[row['key']] = row['decoder']
    failed = Counter(decoder for key, decoder in waiting.items() if key not in rows)
    return list(rows.values()), failed


def word_of(row):
    answer = row.get('answer') or {}
    return str(answer.get('word', '')).strip().lower()


def naive(rows, out):
    studies = [r for r in rows if r['task'] == 'naive' and r['kind'] == 'study']
    shared = [r for r in studies if r['name'] in items.SHARED]
    revs, sizes = sorted({r['rev'] for r in studies}), sorted({r['size'] for r in studies})
    if not shared:
        return
    out.append('## Naive readers: the right word, six shared studies\n')
    out.append(f'Chance is {CHANCE:.2f} (one of seven words). Each cell is the share correct, '
               'its 95 % Wilson interval and the number of trials.\n')
    head = ['Decoder'] + [f'{rev} at {size} px' for size in sizes for rev in revs]
    out.append('| ' + ' | '.join(head) + ' |')
    out.append('|' + ' --- |'*len(head))

    def line(label, chosen):
        cells = []
        for size in sizes:
            for rev in revs:
                these = [r for r in chosen if r['rev'] == rev and r['size'] == size]
                cells.append(cell(sum(word_of(r) == r['truth']['word'] for r in these), len(these)))
        out.append(f'| {label} | ' + ' | '.join(cells) + ' |')

    for decoder in sorted({r['decoder'] for r in shared}):
        line(decoder, [r for r in shared if r['decoder'] == decoder])
    for family in FAMILIES:
        chosen = [r for r in shared if r['family'] == family]
        if chosen:
            line(f'**{family}**', chosen)
    line('**All trials**', shared)

    out.append('\n**The pre-registered gap test** (160 px, each family weighted equally):\n')
    means, directions = {}, []
    for rev in revs:
        rates = []
        for family in FAMILIES:
            these = [r for r in shared if r['family'] == family and r['rev'] == rev and r['size'] == 160]
            if these:
                rates.append(sum(word_of(r) == r['truth']['word'] for r in these)/len(these))
        means[rev] = sum(rates)/len(rates) if rates else float('nan')
    for family in FAMILIES:
        rate = {}
        for rev in revs:
            these = [r for r in shared if r['family'] == family and r['rev'] == rev and r['size'] == 160]
            if these:
                rate[rev] = sum(word_of(r) == r['truth']['word'] for r in these)/len(these)
        if len(rate) == len(revs) == 2:
            diff = rate[revs[0]] - rate[revs[1]]
            directions.append((family, diff))
    if len(revs) == 2 and directions:
        gap = means[revs[0]] - means[revs[1]]
        agree = sum(d > 0 for _, d in directions)
        out.append(f'- Family mean: {revs[0]} {means[revs[0]]:.2f}, {revs[1]} {means[revs[1]]:.2f}; '
                   f'difference {gap:+.2f} ({revs[0]} minus {revs[1]}).')
        out.append('- By family: ' + ', '.join(f'{f} {d:+.2f}' for f, d in directions) + '.')
        verdict = gap >= .10 and agree >= 3
        out.append(f'- {agree} of {len(directions)} families have {revs[0]} ahead. '
                   + ('**A gap, as pre-registered.**' if verdict else '**No decoder gap, as pre-registered.**'))

    out.append('\n### By study (all decoders together)\n')
    out.append('| Study | ' + ' | '.join(f'{rev} at {size} px' for size in sizes for rev in revs) + ' |')
    out.append('|' + ' --- |'*(1 + len(sizes)*len(revs)))
    for name in items.WORDS:
        cells = []
        for size in sizes:
            for rev in revs:
                these = [r for r in studies if r['name'] == name and r['rev'] == rev and r['size'] == size]
                cells.append(cell(sum(word_of(r) == name for r in these), len(these)))
        out.append(f'| {name} | ' + ' | '.join(cells) + ' |')

    out.append('\n### What each study was called instead (all sizes)\n')
    out.append('| Study | ' + ' | '.join(revs) + ' |')
    out.append('|' + ' --- |'*(1 + len(revs)))
    for name in items.WORDS:
        cells = []
        for rev in revs:
            said = Counter(word_of(r) or '(no answer)' for r in studies if r['name'] == name and r['rev'] == rev)
            cells.append(', '.join(f'{w} {n}' for w, n in said.most_common(4)) or '–')
        out.append(f'| {name} | ' + ' | '.join(cells) + ' |')
    out.append('')


def pair(rows, out):
    pairs = [r for r in rows if r['task'] == 'pair']
    if not pairs:
        return
    out.append('## Side by side: 4.3 against 4.4\n')
    out.append('Each pair was shown in both orders. A decoder that chose the same side both times gave no signal.\n')
    for question, label in (('faster', 'Which tells you faster what it is like?'),
                            ('keep_looking', 'Which would you keep looking at?')):
        out.append(f'**{label}**\n')
        sizes = sorted({r['size'] for r in pairs})
        out.append('| Decoder | ' + ' | '.join(f'{s} px: 4.3 / 4.4 / no signal' for s in sizes) + ' |')
        out.append('|' + ' --- |'*(1 + len(sizes)))
        totals = defaultdict(Counter)
        for decoder in sorted({r['decoder'] for r in pairs}):
            cells = []
            for size in sizes:
                tally = Counter()
                for name in items.SHARED:
                    picks = []
                    for r in pairs:
                        if r['decoder'] == decoder and r['size'] == size and r['name'] == name:
                            side = str((r.get('answer') or {}).get(question, '')).strip().lower()
                            if side in ('left', 'right'):
                                picks.append(r[side])
                    if len(picks) == 2:
                        tally[picks[0] if picks[0] == picks[1] else 'none'] += 1
                totals[size].update(tally)
                cells.append(f'{tally["4.3"]} / {tally["4.4"]} / {tally["none"]}' if tally else '–')
            out.append(f'| {decoder} | ' + ' | '.join(cells) + ' |')
        out.append('| **All** | ' + ' | '.join(
            f'{totals[s]["4.3"]} / {totals[s]["4.4"]} / {totals[s]["none"]}' for s in sizes) + ' |\n')


def taught(rows, out):
    probes = [r for r in rows if r['task'] == 'taught']
    if not probes:
        return
    out.append('## Taught readers: the three channels\n')
    out.append('Probe fields with one channel moved at a time. "Seen" is how often the decoder said yes when the '
               'channel was there; "false alarm" is how often it said yes when it wasn\'t.\n')
    out.append('| Channel | Revision | Size | Seen | False alarm | Mean strength, there / not |')
    out.append('| --- | --- | --- | --- | --- | --- |')
    for channel, label in (('second', 'second current'), ('held', 'held from earlier'),
                           ('reconstructed', 'reconstructed')):
        for rev in sorted({r['rev'] for r in probes}):
            for size in sorted({r['size'] for r in probes}):
                these = [r for r in probes if r['rev'] == rev and r['size'] == size and r.get('answer')]
                there = [r for r in these if r['truth'][channel]]
                absent = [r for r in these if not r['truth'][channel]]
                if not there:
                    continue

                def yes(r):
                    return str(r['answer'].get(channel, '')).strip().lower().startswith('y')

                def strength(group):
                    values = [r['answer'].get(channel + '_strength') for r in group]
                    values = [v for v in values if isinstance(v, (int, float))]
                    return f'{sum(values)/len(values):.1f}' if values else '–'

                out.append(f'| {label} | {rev} | {size} | {cell(sum(map(yes, there)), len(there))} | '
                           f'{cell(sum(map(yes, absent)), len(absent))} | {strength(there)} / {strength(absent)} |')
    out.append('')


def e3(rows, out):
    real = [r for r in rows if r['task'] == 'naive' and r['kind'] == 'e3']
    if not real:
        return
    out.append('## Real-conversation fields (E3), 320 px\n')
    out.append('These have no right word. The table shows what naive readers called them.\n')
    revs = sorted({r['rev'] for r in real})
    out.append('| Revision | Words chosen |')
    out.append('| --- | --- |')
    for rev in revs:
        said = Counter(word_of(r) or '(no answer)' for r in real if r['rev'] == rev)
        out.append(f'| {rev} | ' + ', '.join(f'{w} {n}' for w, n in said.most_common()) + ' |')
    same = total = 0
    by = defaultdict(dict)
    for r in real:
        by[(r['name'], r['decoder'])][r['rev']] = word_of(r)
    for words in by.values():
        if len(words) == 2:
            total += 1
            same += len(set(words.values())) == 1
    if total:
        out.append(f'\nThe same decoder gave the same word to both revisions of a reading in {same} of {total} cases.\n')


def main():
    path = RESULTS / (sys.argv[1] if len(sys.argv) > 1 else 'stage2.jsonl')
    rows, failed = load(path)
    out = [f'# {path.stem}: results\n',
           f'{len(rows)} trials answered. Written by `scripts/xagent/report.py` from `results/{path.name}`; '
           'the measures and thresholds are in `PREREG.md`.\n']
    done = Counter((r['decoder'], r['task']) for r in rows)
    tasks = sorted({r['task'] for r in rows})
    out.append('| Decoder | ' + ' | '.join(tasks) + ' | models |')
    out.append('|' + ' --- |'*(2 + len(tasks)))
    for decoder in sorted({r['decoder'] for r in rows}):
        models = sorted({r['model'] for r in rows if r['decoder'] == decoder})
        out.append(f'| {decoder} | ' + ' | '.join(str(done[(decoder, t)]) for t in tasks)
                   + ' | ' + ', '.join(models) + ' |')
    unparsed = sum(r.get('answer') is None for r in rows)
    ran = sum(bool(r.get('ran_commands')) for r in rows)
    out.append(f'\n{unparsed} answers could not be parsed (scored as wrong). '
               f'{ran} Codex trials ran a command despite being told not to. '
               + ('Calls that failed and await a rerun: ' + ', '.join(f'{d} {n}' for d, n in failed.items()) + '.'
                  if failed else 'No failed calls are waiting.') + '\n')
    naive(rows, out)
    pair(rows, out)
    taught(rows, out)
    e3(rows, out)
    report = path.with_name(path.stem + '-report.md')
    report.write_text('\n'.join(out) + '\n')
    print('\n'.join(out))
    print(f'\nWritten to {report.relative_to(Path.cwd()) if report.is_relative_to(Path.cwd()) else report}')


if __name__ == '__main__':
    main()
