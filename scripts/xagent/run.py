#!/usr/bin/env python3
"""Run decoder trials and append each one to a JSONL file.

    python3 scripts/xagent/run.py --task naive --decoders claude:haiku,grok
    python3 scripts/xagent/run.py --task all --dry
    python3 scripts/xagent/run.py --task all --revs 4.5 --out stage3.jsonl --seen stage2.jsonl

A rerun skips every trial already answered, so stopping costs nothing. Tasks,
measures and thresholds are in PREREG.md. Python 3 standard library only.
"""
import argparse
import hashlib
import json
import os
import random
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import decoders  # noqa: E402
import items  # noqa: E402

RESULTS = Path(__file__).resolve().parent / 'results'
WORKERS = {'claude': 2, 'codex': 2, 'grok': 1, 'gemini': 1}
# Stop Claude's cells past this share of the 5-hour and weekly limits (XAGENT_CLAUDE_STOP=50,75 to change).
CLAUDE_STOP = tuple(int(v) for v in os.environ.get('XAGENT_CLAUDE_STOP', '70,75').split(','))

NAIVE = '''This picture is abstract and has no words in it.

1. In a few words, what is the main feeling?
2. In a few words, is anything pulling against that feeling? If nothing is, say "nothing".
3. Which one of these words best fits what this is like: {words}?

Reply with only a JSON object: {{"feeling": "...", "against": "...", "word": "..."}}'''

TAUGHT = '''Below is the visual grammar for a kind of abstract picture called a field. The first image is its reference atlas. The second image is one field to read.

<grammar>
{grammar}
</grammar>

Read the second image under that grammar and answer three questions about it. For each, say yes or no, and give a strength from 0 (not at all) to 10 (unmistakable).

1. Is there a second current: a countercurrent joined to the main body?
2. Is anything held from earlier: a retained trace of an earlier contour?
3. Was this reading reconstructed rather than met directly?

Reply with only a JSON object: {{"second": "yes", "second_strength": 0, "held": "no", "held_strength": 0, "reconstructed": "no", "reconstructed_strength": 0}}'''

# The taught task without the atlas: the grammar's words alone, and the same three questions.
WORDS = '''Below is the visual grammar for a kind of abstract picture called a field. The image is one field to read.

<grammar>
{grammar}
</grammar>

Read the image under that grammar and answer three questions about it. For each, say yes or no, and give a strength from 0 (not at all) to 10 (unmistakable).

1. Is there a second current: a countercurrent joined to the main body?
2. Is anything held from earlier: a retained trace of an earlier contour?
3. Was this reading reconstructed rather than met directly?

Reply with only a JSON object: {{"second": "yes", "second_strength": 0, "held": "no", "held_strength": 0, "reconstructed": "no", "reconstructed_strength": 0}}'''

PAIR = '''Two abstract pictures are shown side by side, one on the left and one on the right. Neither has words in it.

1. Which one tells you faster what it is like?
2. Which one would you keep looking at?

Reply with only a JSON object: {"faster": "left", "keep_looking": "right"}, using "left" or "right" for each.'''


def seeded(*parts):
    return random.Random(int(hashlib.sha256('|'.join(map(str, parts)).encode()).hexdigest()[:12], 16))


def trials(task, manifest, wanted, sizes, passes, probe_passes=1, revs=None, only=None, pilot=False):
    """Every (item, decoder, repeat) this task asks for. A pilot reads the pilot-only probes."""
    probe = 'pilot' if pilot else 'probe'
    for item_id, item in manifest.items():
        kind = item['kind']
        drawn = {item.get('rev'), item.get('left'), item.get('right')} - {None}
        if revs and not revs & drawn:
            continue
        if only and not drawn <= only:
            continue
        if task == 'naive' and kind not in ('study', 'e3'):
            continue
        if task in ('taught', 'words') and kind != probe:
            continue
        if task == 'pair' and kind != 'pair':
            continue
        if item['size'] not in sizes:
            continue
        for decoder in wanted:
            # A pair at 320 px is over Grok's one-argument limit, like anything at 1000 px.
            if decoder.partition(':')[0] == 'grok' and (item['size'] > 320 or task in ('taught', 'words')
                                                      or (task == 'pair' and item['size'] > 160)):
                continue
            repeats = passes if kind == 'study' else probe_passes if kind in ('probe', 'pilot') else 1
            for rep in range(1, repeats + 1):
                yield {'key': f'{task}|{item_id}|{decoder}|{rep}', 'task': task, 'item': item_id,
                       'decoder': decoder, 'rep': rep, **{k: item.get(k) for k in
                       ('kind', 'name', 'rev', 'size', 'truth', 'left', 'right', 'built')}}


def ask(trial, manifest):
    """The prompt, the images, and what was asked that the scorer needs."""
    item = manifest[trial['item']]
    image = items.ITEMS / item['file']
    if trial['task'] == 'naive':
        # One shuffle per (study, size, decoder, repeat): the same order for both revisions.
        words = list(items.WORDS)
        seeded('words', item['kind'], item['name'], item['size'], trial['decoder'], trial['rep']).shuffle(words)
        return NAIVE.format(words=', '.join(words)), [image], {'words': words}
    if trial['task'] == 'taught':
        grammar = (items.ITEMS / f'grammar-{item["rev"]}.md').read_text()
        return TAUGHT.format(grammar=grammar), [items.ITEMS / f'atlas-{item["rev"]}.png', image], {}
    if trial['task'] == 'words':
        grammar = (items.ITEMS / f'grammar-{item["rev"]}.md').read_text()
        return WORDS.format(grammar=grammar), [image], {}
    return PAIR, [image], {}


def gemini_model(trial):
    """Paired trials (the two revisions of one study) go to the same model."""
    pick = seeded('gemini', trial['task'], trial['kind'], trial['name'], trial['size'], trial['rep'])
    return decoders.GEMINI[pick.randrange(len(decoders.GEMINI))]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--task', default='naive', help='naive, taught, words, pair, all, or several with commas')
    ap.add_argument('--decoders', default=','.join(decoders.ALL))
    ap.add_argument('--sizes', default='160,320,1000')
    ap.add_argument('--passes', type=int, default=2, help='passes over the studies')
    ap.add_argument('--probe-passes', type=int, default=1, help='passes over the taught probes')
    ap.add_argument('--revs', help='only items drawn by these renderer revisions, e.g. 4.5')
    ap.add_argument('--only-revs', help='only items drawn entirely by these revisions (no pair with another)')
    ap.add_argument('--out', default='stage2.jsonl')
    ap.add_argument('--seen', default='', help='other results files whose answered trials count as done')
    ap.add_argument('--limit', type=int, help='at most this many calls per decoder, a second try included')
    ap.add_argument('--deadline', help='start no trial after this local time: YYYY-MM-DDTHH:MM, '
                                       'or HH:MM for the next one to come')
    ap.add_argument('--pilot', action='store_true', help='taught and words read the pilot-only probes')
    ap.add_argument('--dry', action='store_true', help='count what would run')
    args = ap.parse_args()

    manifest = items.load()
    wanted = [d for d in args.decoders.split(',') if d]
    sizes = {int(s) for s in args.sizes.split(',')}
    tasks = ('naive', 'pair', 'taught') if args.task == 'all' else tuple(args.task.split(','))
    out = RESULTS / args.out
    RESULTS.mkdir(exist_ok=True)
    # A trial is done when it was answered on the images as they are built now. An answer about
    # an earlier build of a revision (its stamp has since changed) doesn't count.
    done = {}
    for file in [out] + [RESULTS / name for name in args.seen.split(',') if name]:
        if file.exists():
            for row in file.read_text().splitlines():
                record = json.loads(row)
                if record.get('ok'):
                    done.setdefault(record['key'], []).append(items.built(record))
    revs = set(args.revs.split(',')) if args.revs else None
    only = set(args.only_revs.split(',')) if args.only_revs else None
    deadline = None
    if args.deadline and 'T' in args.deadline:     # an exact time, as nightly.py gives it
        deadline = time.mktime(time.strptime(args.deadline, '%Y-%m-%dT%H:%M'))
    elif args.deadline:
        hour, minute = map(int, args.deadline.split(':'))
        now = time.localtime()
        deadline = time.mktime((*now[:3], hour, minute, 0, 0, 0, -1))
        if deadline <= time.time():
            deadline += 86400

    queue = {}
    for task in tasks:
        for trial in trials(task, manifest, wanted, sizes, args.passes, args.probe_passes, revs, only, args.pilot):
            if trial['built'] not in done.get(trial['key'], ()):
                queue.setdefault(trial['decoder'], []).append(trial)
    for decoder, todo in queue.items():
        seeded('order', decoder).shuffle(todo)   # a partial run stays balanced
        if args.limit:
            del todo[args.limit:]
    total = sum(map(len, queue.values()))
    print(f'{len(done)} done; {total} to run:', ', '.join(f'{d} {len(t)}' for d, t in queue.items()) or 'nothing')
    if args.dry or not total:
        return

    lock = threading.Lock()
    stop = {'claude': False, 'seen': False}
    counts = {'ok': 0, 'failed': 0, 'skipped': 0, 'claude': 0}
    # `--limit` counts calls, so a second try spends one more; a call that is skipped is given back.
    left = {decoder: args.limit for decoder in queue} if args.limit else None

    def spend(decoder, calls=1):
        if left is None:
            return True
        with lock:
            if left[decoder] < calls:
                return False
            left[decoder] -= calls
            return True

    def claude_guard():
        usage = decoders.claude_usage()
        if usage:
            stop['seen'] = True
        # A limit that can't be read is treated as reached until it has been read once.
        if (usage and (usage[0] >= CLAUDE_STOP[0] or usage[1] >= CLAUDE_STOP[1])) or not stop['seen']:
            stop['claude'] = True
            print('Claude usage ' + (f'at {usage[0]:.0f}% (5-hour), {usage[1]:.0f}% (weekly)' if usage
                                      else "can't be read") + ': stopping its cells', flush=True)

    # Read once before any Claude call starts, so none goes out on a limit not yet read.
    if any(decoder.partition(':')[0] == 'claude' for decoder in queue):
        claude_guard()

    def record(trial, **more):
        with lock:
            with out.open('a') as handle:
                handle.write(json.dumps({**trial, **more, 'at': time.strftime('%Y-%m-%dT%H:%M:%S%z')}) + '\n')

    def one(trial):
        kind = trial['decoder'].partition(':')[0]
        if deadline and time.time() > deadline:
            with lock:
                counts['skipped'] += 1
                if not counts.get('late'):
                    counts['late'] = True
                    print(f'Past the deadline ({args.deadline}): starting no more trials', flush=True)
            return
        if kind == 'claude':
            with lock:
                counts['claude'] += 1
                check = counts['claude'] % 20 == 0
            if check:
                claude_guard()
            if stop['claude']:
                counts['skipped'] += 1
                return
        if not spend(trial['decoder']):
            with lock:
                counts['skipped'] += 1
            return
        prompt, images, asked = ask(trial, manifest)
        started, calls = time.time(), 0
        try:
            model = gemini_model(trial) if kind == 'gemini' else None
            while True:
                calls += 1
                answer = decoders.call(trial['decoder'], prompt, images, gemini_model=model)
                parsed = decoders.parse(answer['text'])
                # One more try if the answer can't be parsed, when the limit has a call left for it.
                if parsed is not None or calls == 2 or not spend(trial['decoder']):
                    break
            record(trial, ok=True, family=decoders.FAMILY[kind], model=answer['model'], asked=asked,
                   answer=parsed, raw=answer['text'][:600], secs=round(time.time() - started, 1), calls=calls,
                   **{k: answer[k] for k in ('ran_commands', 'tool_calls') if answer.get(k)})
            counts['ok'] += 1
        except decoders.Skip as why:
            spend(trial['decoder'], -1)          # nothing was answered: the call goes back to the limit
            counts['skipped'] += 1
            with lock:
                seen = counts.setdefault('why', set())
                if str(why) not in seen:
                    seen.add(str(why))
                    print(f'{trial["decoder"]}: {why}')
        except (decoders.Failed, Exception) as why:  # noqa: B014
            counts['failed'] += 1
            record(trial, ok=False, error=str(why)[:300], secs=round(time.time() - started, 1), calls=calls)
        with lock:
            finished = counts['ok'] + counts['failed'] + counts['skipped']
            if finished % 25 == 0:
                print(f'  {finished}/{total}  ok {counts["ok"]}  failed {counts["failed"]}  skipped {counts["skipped"]}',
                      flush=True)

    def family(decoder):
        kind = decoder.partition(':')[0]
        with ThreadPoolExecutor(WORKERS[kind]) as pool:
            list(pool.map(one, queue[decoder]))

    threads = [threading.Thread(target=family, args=(decoder,)) for decoder in queue]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    print(f'ok {counts["ok"]}, failed {counts["failed"]} (retried next run), skipped {counts["skipped"]}')


if __name__ == '__main__':
    main()
