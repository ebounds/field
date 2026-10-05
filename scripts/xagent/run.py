#!/usr/bin/env python3
"""Run decoder trials and append each one to a JSONL file.

    python3 scripts/xagent/run.py --task naive --decoders claude:haiku,grok
    python3 scripts/xagent/run.py --task all --dry

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

PAIR = '''Two abstract pictures are shown side by side, one on the left and one on the right. Neither has words in it.

1. Which one tells you faster what it is like?
2. Which one would you keep looking at?

Reply with only a JSON object: {"faster": "left", "keep_looking": "right"}, using "left" or "right" for each.'''


def seeded(*parts):
    return random.Random(int(hashlib.sha256('|'.join(map(str, parts)).encode()).hexdigest()[:12], 16))


def trials(task, manifest, wanted, sizes, passes):
    """Every (item, decoder, repeat) this task asks for."""
    for item_id, item in manifest.items():
        kind = item['kind']
        if task == 'naive' and kind not in ('study', 'e3'):
            continue
        if task == 'taught' and kind != 'probe':
            continue
        if task == 'pair' and kind != 'pair':
            continue
        if item['size'] not in sizes:
            continue
        for decoder in wanted:
            if decoder == 'grok' and (item['size'] > 320 or task == 'taught'):
                continue
            repeats = passes if kind == 'study' else 1
            for rep in range(1, repeats + 1):
                yield {'key': f'{task}|{item_id}|{decoder}|{rep}', 'task': task, 'item': item_id,
                       'decoder': decoder, 'rep': rep, **{k: item.get(k) for k in
                       ('kind', 'name', 'rev', 'size', 'truth', 'left', 'right')}}


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
    return PAIR, [image], {}


def gemini_model(trial):
    """Paired trials (the two revisions of one study) go to the same model."""
    pick = seeded('gemini', trial['task'], trial['kind'], trial['name'], trial['size'], trial['rep'])
    return decoders.GEMINI[pick.randrange(len(decoders.GEMINI))]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--task', default='naive', help='naive, taught, pair, or all')
    ap.add_argument('--decoders', default=','.join(decoders.ALL))
    ap.add_argument('--sizes', default='160,320,1000')
    ap.add_argument('--passes', type=int, default=2)
    ap.add_argument('--out', default='stage2.jsonl')
    ap.add_argument('--limit', type=int, help='at most this many trials per decoder')
    ap.add_argument('--dry', action='store_true', help='count what would run')
    args = ap.parse_args()

    manifest = items.load()
    wanted = [d for d in args.decoders.split(',') if d]
    sizes = {int(s) for s in args.sizes.split(',')}
    tasks = ('naive', 'pair', 'taught') if args.task == 'all' else (args.task,)
    out = RESULTS / args.out
    RESULTS.mkdir(exist_ok=True)
    done = set()
    if out.exists():
        for row in out.read_text().splitlines():
            record = json.loads(row)
            if record.get('ok'):
                done.add(record['key'])

    queue = {}
    for task in tasks:
        for trial in trials(task, manifest, wanted, sizes, args.passes):
            if trial['key'] not in done:
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
    stop = {'claude': False}
    counts = {'ok': 0, 'failed': 0, 'skipped': 0, 'claude': 0}

    def record(trial, **more):
        with lock:
            with out.open('a') as handle:
                handle.write(json.dumps({**trial, **more, 'at': time.strftime('%Y-%m-%dT%H:%M:%S%z')}) + '\n')

    def one(trial):
        kind = trial['decoder'].partition(':')[0]
        if kind == 'claude':
            with lock:
                counts['claude'] += 1
                check = counts['claude'] % 20 == 1
            if check:
                usage = decoders.claude_usage()
                if usage:
                    stop['seen'] = True
                # A limit that can't be read is treated as reached until it has been read once.
                if (usage and (usage[0] >= CLAUDE_STOP[0] or usage[1] >= CLAUDE_STOP[1])) or not stop.get('seen'):
                    stop['claude'] = True
                    print('Claude usage ' + (f'at {usage[0]:.0f}% (5-hour), {usage[1]:.0f}% (weekly)' if usage
                                              else "can't be read") + ': stopping its cells', flush=True)
            if stop['claude']:
                counts['skipped'] += 1
                return
        prompt, images, asked = ask(trial, manifest)
        started = time.time()
        try:
            model = gemini_model(trial) if kind == 'gemini' else None
            answer = parsed = None
            for _ in range(2):                   # one more try if the answer can't be parsed
                answer = decoders.call(trial['decoder'], prompt, images, gemini_model=model)
                parsed = decoders.parse(answer['text'])
                if parsed is not None:
                    break
            record(trial, ok=True, family=decoders.FAMILY[kind], model=answer['model'], asked=asked,
                   answer=parsed, raw=answer['text'][:600], secs=round(time.time() - started, 1),
                   **({'ran_commands': True} if answer.get('ran_commands') else {}))
            counts['ok'] += 1
        except decoders.Skip as why:
            counts['skipped'] += 1
            with lock:
                seen = counts.setdefault('why', set())
                if str(why) not in seen:
                    seen.add(str(why))
                    print(f'{trial["decoder"]}: {why}')
        except (decoders.Failed, Exception) as why:  # noqa: B014
            counts['failed'] += 1
            record(trial, ok=False, error=str(why)[:300], secs=round(time.time() - started, 1))
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
