# Cross-agent tests

Tests of whether a field gets through to a reader, run across model families. What is measured, and the thresholds, were fixed in [`PREREG.md`](PREREG.md) before any counted trial. Read that first.

Python 3 standard library, the model CLIs, and a Chrome or Chromium binary. No packages.

## Run it

```bash
export CHROME_BIN=~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome   # chromium isn't on the PATH here

python3 scripts/xagent/items.py                          # build the images into .xagent/ (ignored by git)
python3 scripts/xagent/run.py --task all --dry           # count what is left to run
python3 scripts/xagent/run.py --task naive --decoders grok
python3 scripts/xagent/report.py                         # score results/stage2.jsonl, write results/stage2-report.md
```

Stage 3 adds renderer revision 4.5 and keeps its trials in their own file. Stage 2's trials are its baseline, so they count as done:

```bash
python3 scripts/xagent/run.py --task all --revs 4.5 --out stage3.jsonl --seen stage2.jsonl --dry
python3 scripts/xagent/run.py --task taught --revs 4.4,4.5 --probe-passes 2 --out stage3.jsonl --seen stage2.jsonl
python3 scripts/xagent/report.py stage2.jsonl stage3.jsonl   # both together, written as results/stage3-report.md
python3 scripts/xagent/sheet.py                              # the blind sheet a person fills in; paste the code back to score it
```

`run.py` appends one line per trial to the results file (`--out`, by default `results/stage2.jsonl`) and skips every trial already answered there or in a file named by `--seen`, so it can be stopped and restarted, and two agents can run different decoders at the same time. A call that fails is logged with `"ok": false` and tried again on the next run.

## To pick up a wave

Run `run.py --task all --dry` (with the same `--revs`, `--out` and `--seen` as above for Stage 3) to see what is missing, then run only your own model's cells: `--decoders codex:astra,codex:sol`, `--decoders grok`, `--decoders gemini`, or `--decoders claude:haiku,claude:sonnet,claude:opus`. Work in your own worktree, commit `results/`, and say in the commit which cells you ran.

## What each file does

| File | Does |
| --- | --- |
| `items.py` | Renders each field from its controls under each renderer revision (read from the pinned commits in `REVISIONS`), strips the metadata, rasterises it and saves it under a random name. Adding a revision is one line. A revision can read `'WORKTREE'` while it is being built; pin it to a commit before any counted trial. Each revision's images carry a stamp of the renderer, atlas and grammar they came from (`built` on every trial), and are rebuilt when that changes. |
| `decoders.py` | How each model is called, isolated from this project: no tools, skills or memory, a neutral one-line system prompt, low effort, and an empty working directory. |
| `run.py` | The three tasks (naive, pairwise, taught), their prompts, and the resumable runner. |
| `report.py` | Scores the trials in one or more results files and writes the report. |
| `sheet.py` | Builds a blind sheet for a person, and scores the code they paste back. Each sheet has its own key in `results/`; a sheet that has a key is never rebuilt over it. |

## Things to know

- **Gemini** runs on the free tier: about 20 requests per model per day, shared with the garfield repo's listening tests. The key is `GEMINI_API_KEY`, from the environment or a local env file (`XAGENT_ENV_FILE`, or `.xagent-private/env`, which git ignores). The two revisions of one study always go to the same Gemini model, so a model that runs out of quota leaves its trials for the next day; it doesn't hand them to another model.
- **Grok** takes the whole prompt as one command-line argument, limited to 128 KB. It runs at 160 and 320 px and not in the taught task.
- **Claude** cells stop by themselves when Edgar's usage passes 70 % of the 5-hour window or 75 % of the week (`CLAUDE_STOP` in `run.py`).
- **Codex** is told not to run commands; a trial where it did is marked `ran_commands` and counted in the report.
- `results/pilot-*.jsonl` are trials run while revision 4.5 was still being drawn, on candidates that were later changed. They are kept for the record and are not counted anywhere.
- The E3 readings are read from `~/claude/for-edgar/field-e3/` (set `XAGENT_E3_DIR` to move it). Their controls are not copied into this repository.
