#!/usr/bin/env python3
"""The night's decoder trials, run by cron on Edgar's machine.

    python3 scripts/xagent/nightly.py gemini      # 00:30, before Gemini's day ends (midnight Pacific is 02:00 here)
    python3 scripts/xagent/nightly.py grok        # 02:15
    python3 scripts/xagent/nightly.py grok --dry  # what a phase would run, and nothing else

A phase runs one decoder within a cap on calls and a window of time, rewrites the reports, and
commits `results/` to this branch. It never pushes, never calls Claude or Codex, and starts
nothing if the branch, the worktree or the results files aren't as expected. What it did goes to
`.xagent/nightly/<night>.md`, with `latest.md` beside it. Python 3 standard library only.
"""
import fcntl
import json
import re
import subprocess
import sys
import time
from pathlib import Path

XAGENT = Path(__file__).resolve().parent
RESULTS = XAGENT / 'results'
ROOT = XAGENT.parents[1]
NIGHTLY = ROOT / '.xagent/nightly'
BRANCH = 'field-4.7'

# Gemini runs on what is left of its free daily quota before it resets, so the day's own use is
# untouched; Grok has no meter, so its cap is the protection, and its first limit message ends the
# phase. Neither cap is reached by the trials alone in one night. A cap counts calls: a trial asked
# again because its answer couldn't be read counts twice.
PHASES = {
    'gemini': {'decoder': 'gemini', 'cap': 75, 'window': ('00:00', '01:50'), 'runs': [
        ['--task', 'all', '--revs', '4.5', '--out', 'stage3.jsonl', '--seen', 'stage2.jsonl'],
        ['--task', 'taught', '--revs', '4.4,4.5', '--probe-passes', '2', '--out', 'stage3.jsonl', '--seen', 'stage2.jsonl'],
        ['--task', 'all', '--only-revs', '4.3,4.4', '--out', 'stage2.jsonl', '--seen', 'stage3.jsonl'],
    ]},
    'grok': {'decoder': 'grok:4.7', 'cap': 50, 'window': ('02:00', '05:00'), 'runs': [
        ['--task', 'all', '--out', 'grok-isolated.jsonl'],
    ]},
}
REPORTS = [['stage2.jsonl'], ['stage2.jsonl', 'stage3.jsonl'],
           ['stage2.jsonl', 'stage3.jsonl', 'grok-isolated.jsonl', '--drop', 'grok']]
TRAILER = ('Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n'
           'Claude-Session: https://claude.ai/code/session_01GNcg7uiHUpSxuCrNVXBcgU')


def sh(*command, **more):
    return subprocess.run(command, cwd=ROOT, capture_output=True, text=True, **more)


def minutes(hhmm):
    hour, minute = map(int, hhmm.split(':'))
    return hour*60 + minute


def night():
    """The evening a night belongs to: before noon counts as the night before."""
    return time.strftime('%Y-%m-%d', time.localtime(time.time() - 12*3600))


def rows(name):
    path = RESULTS / name
    return path.read_text().splitlines() if path.exists() else []


def unfit():
    """Why the worktree isn't fit for an unattended run, or None."""
    if sh('git', 'rev-parse', '--abbrev-ref', 'HEAD').stdout.strip() != BRANCH:
        return f'the worktree is not on {BRANCH}'
    for name in ('MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD'):
        if (ROOT / sh('git', 'rev-parse', '--git-path', name).stdout.strip()).exists():
            return f'a git operation is in progress ({name})'
    if sh('git', 'status', '--porcelain', '--', str(RESULTS)).stdout.strip():
        return 'results/ has uncommitted changes, which this job would commit as its own'
    for path in RESULTS.glob('*.jsonl'):
        for number, line in enumerate(path.read_text().splitlines(), 1):
            try:
                json.loads(line)
            except ValueError:
                return f'{path.name} line {number} does not parse (left as it is, for a person to look at)'
    if sh('pgrep', '-f', 'scripts/xagent/run.py').stdout.strip():
        return 'another run.py is running'
    return None


def made(decoder, start):
    """This decoder's trials since the phase began, answered or failed."""
    return [row for name, count in start.items() for row in map(json.loads, rows(name)[count:])
            if row['decoder'] == decoder]


def calls(decoder, start):
    """This decoder's calls since the phase began: a trial tried twice made two."""
    return sum(row.get('calls', 1) for row in made(decoder, start))


def main():
    name = sys.argv[1] if len(sys.argv) > 1 else ''
    if name not in PHASES:
        sys.exit(f'usage: nightly.py {"|".join(PHASES)} [--dry]')
    phase, dry = PHASES[name], '--dry' in sys.argv
    NIGHTLY.mkdir(parents=True, exist_ok=True)
    lock = (NIGHTLY / 'lock').open('w')
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        sys.exit('another phase is running')

    tonight = night()
    log = (NIGHTLY / f'{tonight}-{name}.log').open('a') if not dry else open('/dev/null', 'w')
    notes = [f'\n## {name}, {time.strftime("%H:%M")}\n']
    decoder = phase['decoder']
    now = time.localtime().tm_hour*60 + time.localtime().tm_min
    opens, closes = map(minutes, phase['window'])
    # The window closes today. run.py is given that exact time: an HH:MM that has just gone by
    # would be taken as tomorrow's.
    closing = time.strftime('%Y-%m-%dT') + phase['window'][1]
    why = unfit() or (None if opens <= now < closes else f'it is outside its window, {"–".join(phase["window"])}')

    if why and not dry:
        notes.append(f'Stopped before running anything: {why}.')
    else:
        start = {path.name: len(rows(path.name)) for path in RESULTS.glob('*.jsonl')}
        for run in phase['runs']:
            if start.get(run[run.index('--out') + 1]) is None:
                start[run[run.index('--out') + 1]] = 0
        for run in phase['runs']:
            left = phase['cap'] - calls(decoder, start)
            now = time.localtime().tm_hour*60 + time.localtime().tm_min
            if not dry and (left <= 0 or now >= closes):
                notes.append(f'- `{" ".join(run)}`: not started ({"cap reached" if left <= 0 else "window closed"}).')
                continue
            command = [sys.executable, str(XAGENT / 'run.py'), *run, '--decoders', decoder,
                       '--limit', str(left), '--deadline', closing] + (['--dry'] if dry else [])
            done = sh(*command)
            log.write(f'$ {" ".join(command[1:])}\n{done.stdout}{done.stderr}\n')
            log.flush()
            last = (done.stdout.strip().splitlines() or [done.stderr.strip()[-200:]])[-1]
            notes.append(f'- `{" ".join(run)}`: {last}')
            if 'usage limit' in done.stdout:
                notes.append(f'  {decoder} reached its usage limit; the phase stops here.')
                break
        notes.append(f'\n{calls(decoder, start)} calls tonight, of a cap of {phase["cap"]}.')

        if not dry and not why:
            for args in REPORTS:
                if all((RESULTS / a).exists() for a in args if a.endswith('.jsonl')):
                    done = sh(sys.executable, str(XAGENT / 'report.py'), *args)
                    log.write(f'$ report.py {" ".join(args)}: exit {done.returncode}\n{done.stderr}')
            changed = [line[3:] for line in sh('git', 'status', '--porcelain', '--', str(RESULTS)).stdout.splitlines()]
            if changed:
                trials = made(decoder, start)
                answered = sum(bool(row.get('ok')) for row in trials)
                message = (f'Nightly decoder run, night of {tonight}: {decoder} {answered} answered, '
                           f'{len(trials) - answered} failed\n\n'
                           f'Run by scripts/xagent/nightly.py {name}; the reports are rewritten from the results.\n\n'
                           + TRAILER)
                sh('git', 'add', '--', *changed)
                done = sh('git', 'commit', '-m', message, '--', *changed)
                head = sh('git', 'rev-parse', '--short', 'HEAD').stdout.strip()
                notes.append(f'Committed `{head}` to {BRANCH} (not pushed).' if done.returncode == 0
                             else f'The commit failed: {(done.stderr or done.stdout).strip()[-300:]}')

        remaining = []
        for run in phase['runs']:
            done = sh(sys.executable, str(XAGENT / 'run.py'), *run, '--decoders', decoder, '--dry')
            remaining.append(re.sub(r'^\d+ done; ', '', (done.stdout.strip().splitlines() or ['?'])[-1]))
        notes.append('Still to run: ' + '; '.join(remaining) + '.')

        for report in ('stage3-report.md', 'grok-isolated-report.md'):
            path = RESULTS / report
            if path.exists():
                text = path.read_text()
                verdicts = [line for line in text.splitlines() if line.startswith('- ')]
                verdicts += re.findall(r'(?:Calls that failed|No failed calls)[^\n]*', text)
                notes.append(f'\n`{report}`:\n' + '\n'.join(verdicts or ['(no verdict lines)']))

    if not dry:
        summary = NIGHTLY / f'{tonight}.md'
        if not summary.exists():
            summary.write_text(f'# Night of {tonight}\n')
        with summary.open('a') as handle:
            handle.write('\n'.join(notes) + '\n')
        latest = NIGHTLY / 'latest.md'
        latest.unlink(missing_ok=True)
        latest.symlink_to(summary.name)
    print('\n'.join(notes))


if __name__ == '__main__':
    main()
