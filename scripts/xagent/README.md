# Cross-agent tests

Tests of whether a field gets through to a reader, run across model families. What is measured, and the thresholds, were fixed in [`PREREG.md`](PREREG.md) before any counted trial. Read that first.

Python 3 standard library, the model CLIs, and a Chrome or Chromium binary. No packages.

## Run it

```bash
export CHROME_BIN=~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome   # chromium isn't on the PATH here

python3 scripts/xagent/items.py                          # build the images into .xagent/ (ignored by git)
python3 scripts/xagent/run.py --task all --dry           # count what is left to run
python3 scripts/xagent/run.py --task naive --decoders grok:4.7 --out grok-isolated.jsonl
python3 scripts/xagent/report.py                         # score results/stage2.jsonl, write results/stage2-report.md
```

Stage 3 adds renderer revision 4.5 and keeps its trials in their own file. Stage 2's trials are its baseline, so they count as done:

```bash
python3 scripts/xagent/run.py --task all --revs 4.5 --out stage3.jsonl --seen stage2.jsonl --dry
python3 scripts/xagent/run.py --task taught --revs 4.4,4.5 --probe-passes 2 --out stage3.jsonl --seen stage2.jsonl
python3 scripts/xagent/report.py stage2.jsonl stage3.jsonl   # both together, with the October Grok rows (for the record), as results/stage3-report.md
python3 scripts/xagent/report.py stage2.jsonl stage3.jsonl grok-isolated.jsonl --drop grok   # the report of record, results/grok-isolated-report.md
python3 scripts/xagent/sheet.py                              # the blind sheet a person fills in; paste the code back to score it
```

`run.py` appends one line per trial to the results file (`--out`, by default `results/stage2.jsonl`) and skips every trial already answered there or in a file named by `--seen`, so it can be stopped and restarted, and two agents can run different decoders at the same time. A trial counts as answered only on the images as they are built now: when a revision's stamp changes, its earlier answers are asked again, and `report.py` leaves them out and says how many. A call that fails is logged with `"ok": false` and tried again on the next run. Each line records its `calls`: two when an answer that couldn't be read was asked again. `--limit` counts those calls, not trials.

## To pick up a wave

Run `run.py --task all --dry` (with the same `--revs`, `--out` and `--seen` as above for Stage 3) to see what is missing, then run only your own model's cells: `--decoders codex:astra,codex:sol`, `--decoders grok:4.7` (with `--task all --out grok-isolated.jsonl` and no `--revs` or `--seen`, since it reruns every Grok trial of both stages), `--decoders gemini`, or `--decoders claude:haiku,claude:sonnet,claude:opus`. Work in your own worktree, commit `results/`, and say in the commit which cells you ran.

## What each file does

| File | Does |
| --- | --- |
| `items.py` | Renders each field from its controls under each renderer revision (read from the pinned commits in `REVISIONS`), strips the metadata, rasterises it and saves it under a random name. Adding a revision is one line. A revision can read `'WORKTREE'` while it is being built; pin it to a commit before any counted trial. Each revision's images carry a stamp of the renderer, atlas and grammar they came from (`built` on every trial), and are rebuilt when that changes. Until they are, `run.py` and `sheet.py` refuse to start. Stage 2's first trials predate stamps; `UNSTAMPED` holds the stamps of the 4.3 and 4.4 builds they were drawn from. |
| `decoders.py` | How each model is called, isolated from this project and from Edgar's own setup: no tools, skills, plugins, hooks, memory or instructions, a neutral one-line system prompt, low effort, and an empty working directory. Each call checks that nothing more came in (once per run for Codex). |
| `run.py` | The three tasks (naive, pairwise, taught), their prompts, and the resumable runner. |
| `report.py` | Scores the trials in one or more results files and writes the report. |
| `sheet.py` | Builds a blind sheet for a person, and scores the code they paste back. Each sheet has its own key in `results/`; a sheet that has a key is never rebuilt over it. |

## Things to know

- **Gemini** runs on the free tier: about 20 requests per model per day, shared with the garfield repo's listening tests. The key is `GEMINI_API_KEY`, from the environment or a local env file (`XAGENT_ENV_FILE`, or `.xagent-private/env`, which git ignores). The two revisions of one study always go to the same Gemini model, so a model that runs out of quota leaves its trials for the next day; it doesn't hand them to another model.
- **Grok** takes the whole prompt as one command-line argument, limited to 128 KB. It runs at 160 and 320 px (pairs at 160 only, since a pair at 320 is over that limit) and not in the taught task. The decoder is `grok:4.7`, isolated as described below; the October rows under `grok` were not.
- **Claude** cells stop by themselves when Edgar's usage passes 70 % of the 5-hour window or 75 % of the week (`CLAUDE_STOP` in `run.py`). The usage is read before any Claude call starts, then every 20 calls.
- **Codex** is told not to run commands; a trial where it did is marked `ran_commands` and counted in the report. Its first "usage limit" message stops its cells for the rest of the run, and they are left for a later run.
- `results/pilot-*.jsonl` are trials run while revision 4.5 was still being drawn, on candidates that were later changed. They are kept for the record and are not counted anywhere. `pilot-5.jsonl` is the check of the isolated Grok call (20 October): two naive trials at 320 px, both answered, with the image inline, no tool call, and nothing of Field in the session.
- The E3 readings are read from `~/claude/for-edgar/field-e3/` (set `XAGENT_E3_DIR` to move it). Their controls are not copied into this repository.

## Grok's October trials (found 20 October)

The `grok` rows in `stage2.jsonl` and `stage3.jsonl` (4–6 October) were not isolated the way this harness says every call is:

- **Tools.** Grok Build ignores `--tools ''`, so every session had its full tool set, the terminal included, and Edgar's config approves tool calls without asking.
- **Skills.** Grok reads Claude's skills and plugins from the home directory. Every session listed about 70 skills, among them `field`: "render a wordless SVG field around its fixed central drone, expressing the accumulated tone of the whole conversation". No grammar or atlas, and none of the seven words.
- **What happened.** Grok kept 304 decoder sessions. 22 made tool calls: 21 re-read the session's own image, and 1 wrote its answer to a file in its own empty directory. No command ran and nothing outside the session was read. For Codex, only its skills directory has been checked so far: it has no Field skill.

`grok:4.7` is the isolated call: an empty home directory (so nothing of Claude's, Cursor's or `~/.agents` is found), memory and subagents off, every optional tool removed, the terminal denied and the config's auto-approval overridden. Each call's session record is checked afterwards, and a call whose context names Field, or a path under `.claude/`, fails. What remains in its context is Grok's own bundled skills and Edgar's two Grok user rules (on plain wording and on testing web apps in a browser), which no local file holds and which the October calls had too. None of it is about Field. It reports its model as `grok-4.7-build`; the October calls said `grok-4.7`, from an older CLI.

Its trials go to `results/grok-isolated.jsonl`, every Grok trial again, under keys of their own. `report.py stage2.jsonl stage3.jsonl grok-isolated.jsonl --drop grok` writes `grok-isolated-report.md`, with these rows in the October rows' place; `stage3-report.md` still has the October rows. Edgar ruled on 21 October that the isolated trials are the ones that count for xAI, in Stage 2 and Stage 3 (recorded in `PREREG.md`). `grok-isolated-report.md` is the report of record; `stage2-report.md` and `stage3-report.md` keep the October rows, for the record only.

## Isolation of the Claude and Codex calls (found 2 November)

A review found that the Claude and Codex calls ran with Edgar's real home and user configuration. Only tools and skills were checked, and only for Claude. Checked on 2 November against the setup as it is now:

- **Claude.** `--system-prompt` and `--tools ''` left three things in place. A `CLAUDE.md` on the way up from the working directory was read: one placed in a probe's working directory changed its answer. There is no `CLAUDE.md` in `~/.claude`, `/tmp` or `/`, so the trials' empty directories had none. User settings loaded their plugins, the Field plugin among them, but only as skills, which `--disable-slash-commands` keeps out. It was installed on 14 October, after the Claude trials of 4–6 October. And the advisor tool came from `advisorModel` in user settings: a session can hand its question to a stronger model, and the init event doesn't list that tool. Whether `advisorModel` was set on 4–6 October can't be told from local files, and those rows don't record which models took part.
- **Codex.** `--ignore-user-config` skips only `config.toml`. The context still listed the 31 firecrawl skills in `~/.agents/skills` and about thirty skills from Codex's own plugins (Render, sites, pets). There was no `AGENTS.md`, and nothing about Field.

Now Claude runs with `--safe-mode --setting-sources=`. Its context holds Claude Code's own preamble, the model's name, the date and the account's email, and nothing more. A call fails if its init event shows any tool, skill, MCP server, command, non-built-in plugin, memory or output style, if a hook runs, or if another model takes part. Codex runs with an empty home, `CODEX_HOME` still pointing at the real one for its sign-in, and plugins, apps, memories, hooks and the optional tools off (`CODEX_OFF`). Once per run its context is rendered with `codex debug prompt-input` and checked. A skill from anywhere but Codex's own bundled set, an `AGENTS.md` or a trace of Field skips its cells. What remains is Codex's own bundled skills and its built-in tools, under the read-only sandbox.

The decoder names and the Claude and Codex rows of 4–6 October are unchanged. Edgar ruled on 2 November that those rows count (`PREREG.md`): Codex's because `config.toml` was ignored as written and nothing about Field reached it, and Claude's after a probe of the October command line found no second model taking part.

## Nightly

`nightly.py` runs from Edgar's crontab, one phase per decoder, and only Gemini and Grok:

| Phase | Starts | Runs until | Cap | Results |
| --- | --- | --- | --- | --- |
| `gemini` | 00:30 | 01:50 | 75 calls | Stage 3's missing cells, then Stage 2's (`--only-revs 4.3,4.4`) |
| `grok` | 02:15 | 05:00 | 50 calls | `grok:4.7`, every Grok trial (`grok-isolated.jsonl`) |

- **Gemini** runs before its quota resets at midnight Pacific (02:00 in Chicago, all year), so it spends only what the day left over and never the next day's.
- **Grok** has no usage meter, so the cap is the protection. The first "usage limit" message ends the phase.
- **A cap counts calls**, from the `calls` on each line: a trial asked again because its answer couldn't be read counts twice. `run.py` is given the window's closing time as a date and time, so a run that starts just after it closes starts nothing.
- **Before starting**, a phase checks that the worktree is on `field-4.7` with no merge or rebase under way, that `results/` has no uncommitted changes, that every results line parses (a broken line is left for a person), and that no other `run.py` is running. One phase runs at a time.
- **After**, it rewrites the three reports and commits `results/` alone to `field-4.7`. It never pushes, and never calls Claude or Codex.
- What each phase did, what is left and the reports' verdict lines go to `.xagent/nightly/<night>.md` (`latest.md` is the most recent), with each phase's full output in a `.log` beside it.
- `nightly.py <phase> --dry` shows what a phase would run. To stop the nights, remove the two `nightly.py` lines with `crontab -e`.
