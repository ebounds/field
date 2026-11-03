# Cross-agent tests: what was decided before any data

Written 4 October 2026, before the first counted trial. (Fourteen trials were run first to test the plumbing, two per decoder, and thrown away unscored.) Results that miss these thresholds are reported as they are. Changes after this date go at the bottom, dated, with the reason.

The harness is in this directory. `README.md` says how to run it. Every trial is one line in an append-only JSONL under `results/`, keyed by task, item, decoder and repeat, so a rerun skips what is done and any agent can pick up from this file and the JSONL alone.

## Stage 2: does a field read at a glance?

**The question.** 4.6 (render revision 4.4) added fine, pale detail. Did that cost the immediate read that 4.5.1 (revision 4.3) had, for a reader who was never taught the grammar?

**Items.** The reference studies, rendered from the same controls under each revision, with `field-spec` and `field-coverage` stripped, rasterised at 160, 320 and 1000 px under random file names. Six studies exist in both revisions (gathered, exploring, strained, tentative, integrated, playful). `described` uses `grounding`, which 4.3 doesn't have, so it exists only under 4.4.

**Naive task.** One image, no grammar, no atlas, a fresh session. The decoder answers two open questions (the main feeling; anything pulling against it) and picks one word from the seven study names. The word list is the same seven for every image and is shuffled for every trial.

- *A change from the plan, made before any data:* the plan gave 4.5.1 images a six-word list. Here every image gets the same seven words, so the two revisions are asked the identical question. For a 4.5.1 image, "described" is a wrong answer that is always on offer.
- The version comparison uses the **six shared studies only**. Chance is 1 in 7 (0.143). `described` under 4.4 is reported on its own.

**Primary measure.** Share of correct words on the six shared studies, per revision and size, with a 95 % Wilson interval: per decoder family, and pooled with each family weighted equally.

**Sizes.** 160 px is the glance. 320 px is the grammar's legibility floor. 1000 px is the full picture.

**What the plan's diagnosis predicts.** At 160 px, naive accuracy under 4.4 is lower than under 4.3, most of all for `tentative`. At 1000 px the two are level, or 4.4 is ahead.

**What counts as a gap.** At 160 px, pooled accuracy under 4.3 is at least 10 points above 4.4, and at least 3 of the 4 decoder families (Anthropic, OpenAI, xAI, Google) show the same direction. Anything less is **no decoder gap**.

**The fork.** If there is no decoder gap, that is a finding: the loss Edgar saw is in what people see, or in something models don't weigh. Stage 3's decoder test then becomes "no regression against 4.6", and Edgar's blind sheet becomes the main measure of the first look. The diagnosis is not adjusted to fit.

**Taught task.** The decoder is given the visual grammar and the atlas **of the same revision as the image**, then one image, and answers three questions, each yes or no with a strength from 0 to 10: is there a second current; is anything held from earlier; was this reading met directly or reconstructed. Items are controlled probes: three base fields, each drawn plain, with `counterpoint` .8, with `history` .7, and (4.4 only) with `grounding` .3, so the right answer is known by construction. Measure: share correct per channel and revision. This is the baseline for Stage 3's "taught decoders score 4.7 at least as well as 4.6".

**Pairwise task.** The 4.3 and 4.4 renders of one study side by side, at 160 and 320 px: "which tells you faster what it is like?" and "which would you keep looking at?" Every pair is asked in both orders. A decoder that picks the same side both times gave no signal for that pair. This is the models' version of Edgar's blind sheet.

**Real-conversation items.** The nine E3 readings, re-rendered from their controls under each revision (without `grounding` under 4.3), at 320 px, one pass. They have no right word. Their open answers are kept for reading, and their word choices are tabulated, not scored.

**Decoders.** Claude Opus 5.5, Sonnet 5.5 and Haiku 4.5 (`claude -p`, tools and skills off, a one-line system prompt, effort low); GPT-6 Astra and GPT-5.6 Sol (`codex exec`, ephemeral, user config ignored, read-only sandbox, reasoning effort low); Grok (`grok --prompt-json`, tools off, one turn, a one-line system prompt; 160 and 320 px only, because the prompt has to fit in one 128 KB argument; not run in the taught task); Gemini Flash models through the API, rotated across the free tier's daily quota, with the model recorded per trial. Two passes per decoder on the studies.

**Scored as wrong.** A word not on the list. An answer that can't be parsed is retried on the next run and, if it still can't be parsed, counted as wrong.

**Known limits, said now.** Seven items per revision is a small set, and the study names were chosen by the people who drew the studies. The open questions are asked in the same call as the word list, so the list can colour them. Decoders are models, not people. Edgar's sheet is the human measure.

## Stage 3: does rendering revision 4.5 keep what 4.4 added, without what it cost?

Written 5 October 2026, after Stage 2's results and before any counted trial on revision 4.5. The renderer under test is pinned to a commit in `items.py` (`REVISIONS['4.5']`); every counted trial records the build it saw (`built`).

**The fork was taken.** Stage 2 found no decoder gap. So, as fixed above, the decoder test for Stage 3 is "no regression against 4.6", and Edgar's blind sheet is the main measure of the first look. Nothing below changes that.

**Pilots, not counted.** While revision 4.5 was being drawn, four small runs were made on candidates and are kept in `results/pilot-*.jsonl`: side-by-side pairs at 320 px twice (Sonnet and Sol on an early candidate; Astra and Sol on a later one) and the taught probes three times (Sonnet and Sol twice, Astra and Sol once). They were used to decide whether a candidate kept the three taught channels and still read faster than 4.4 beside it. The countercurrent and the retained ridge were redrawn after them. The frozen renderer (`bf6b84d`) differs from the last piloted candidate in one thing, how the countercurrent's parting is drawn, and that last change was not piloted. The pilots used the same items the counted run uses. That is a limit: the renderer was chosen with a look at three decoders' answers on these items. The counted run asks all seven decoders afresh, and Edgar's sheet has no pilot.

**Items and trials.** As in Stage 2, with revision 4.5 added to every item. The questions, the word list, its shuffles and the decoders are unchanged, so a 4.5 image is asked exactly what its 4.3 and 4.4 counterparts were asked. Revision 4.5's trials go to `results/stage3.jsonl`. The 4.3 and 4.4 trials are Stage 2's, in `results/stage2.jsonl`, with one addition below.

**Naive readers: no regression.** The measure is Stage 2's: the share of right words on the six shared studies, each family weighted equally. A regression is the Stage 2 gap turned against the new revision: at any of the three sizes, 4.5's family mean is at least 10 points under 4.4's, and at least 3 of the 4 families are lower. A family votes at a size only if it has at least six answered trials there under each revision; if fewer than three families can vote at a size, that size is undecided, not passed. The same comparison with 4.3 is reported and is not a test.

**Taught readers: no regression.** For each of the three channels, the measure is how well it separates fields that have it from fields that do not: the share seen minus the share of false alarms, both sizes and all decoders together. A regression is a channel where 4.5 is more than 15 points under 4.4. To give this a fair chance, every probe is read **twice** under 4.5, and 4.4's probes are read a **second time now**, alongside (Stage 2 read them once); both of 4.4's passes count. With two passes that is about 70 fields with a channel and 210 without per revision, so 15 points is about 1.7 standard errors of the difference: the test can miss a real drop of ten points, and it can call a regression by chance about one time in twenty when nothing changed. The per-size table is reported as in Stage 2.

**Side by side.** Revision 4.5 beside 4.4, and beside 4.3, in both orders, at 160 and 320 px, with Stage 2's two questions. Two predictions, on "which tells you faster what it is like?" at 320 px, all decoders together, counting only pairs where a decoder chose the same picture in both orders:
- 4.5 is chosen over 4.4 (more pairs for 4.5, two-sided sign test p < .05);
- 4.5 does not lose to 4.3 (4.3 is not chosen over 4.5 at p < .05).

"Which would you keep looking at?" is reported without a prediction. In Stage 2 the models and Edgar disagreed on it.

**Edgar's sheet 2.** 26 pairs at 320 px: each of the six shared studies as 4.5 beside 4.4 and as 4.5 beside 4.3, in both orders, and `described` as 4.5 beside 4.4. A study counts for a revision only when both orders agree, as in Stage 2. On "faster", the sheet passes if (a) 4.5 is chosen over 4.4 in more of the six studies than 4.4 over 4.5, and (b) 4.3 is not chosen over 4.5 in more studies than 4.5 over 4.3. "Keep looking" and `described` are reported. The key is `results/blind-sheet-2-key.json`; `sheet.py` scores a pasted code.

**Known limits, said now.** Those of Stage 2. The 4.3 and 4.4 naive and side-by-side answers are from 4–5 October and 4.5's from 5 October on; the decoders are the same named models, but nothing guarantees they answer alike from one day to the next (the taught comparison has a concurrent pass for that reason). Grok and Gemini run on free tiers and may again leave cells empty; empty cells are reported as empty.

## Stage 5: thresholds (from the plan, unchanged)

- **Communicable:** 2AFC accuracy of at least .70, with the lower 95 % bound above .50, in at least 3 of 4 decoder families, and replicated on held-out items.
- **Repeatable:** test–retest κ of at least .6.
- **Language:** between-model distance in the controls no more than 1.25 times the within-model distance (E3 came out at about 1.4).
- **Direction of a change cue (Stage 4c):** a listener picks the right one of six words at ≥ .5 overall, with every cue above chance (about .17). The confusion matrix is reported.

A candidate "beyond text" item (T1 at chance while F is above chance) counts only after it replicates on new items of the same kind and across decoder families.

The diagonal (a model decoding its own encodings) is kept and reported apart from the cross-model cells.

## Changes after 4 October

- **5 October.** Nothing in the measures or thresholds changed. The first run stopped on usage limits (Claude, Codex, Grok) on 4 October and was finished the next day from the same file. Grok and Gemini have not had their two full passes (42 and 53 trials left at the end of 5 October): both are on free tiers, and their missing cells stay missing until someone runs them. One Grok trial was answered by `grok-4.6`; it is counted, with the model on its row.
- **21 October. Grok's October trials are replaced by isolated reruns.** The `grok` rows in `stage2.jsonl` and `stage3.jsonl` (4–6 October) were not run as the Decoders paragraph says. Grok Build ignores `--tools ''`, so every session had its full tool set, with tool calls approved automatically, and it read Claude's skills from the home directory, so the Field skill's one-line description was in its context (no grammar, atlas or study names). 22 of its 304 sessions made tool calls: 21 re-read their own image and one wrote its answer to a file. No command ran. The `grok:4.7` decoder reruns every Grok trial, isolated as written (an empty home directory, every optional tool removed, the terminal denied, each session record checked afterwards), into `results/grok-isolated.jsonl`. Edgar ruled on 21 October that these rows are the ones that count for xAI, in Stage 2 and in Stage 3. The October rows stay in their files, which are append-only, and are left out of the count: `report.py stage2.jsonl stage3.jsonl grok-isolated.jsonl --drop grok` writes the report of record, `results/grok-isolated-report.md`. The ruling was made after both reports had been seen, part way through the rerun. Its grounds are that the October calls broke the protocol, not what they scored; so far both reports reach the same verdicts. Limits: the reruns come about two weeks after the other decoders' trials and from a later CLI (it reports `grok-4.7-build`; the October calls said `grok-4.7`), and Grok's own bundled skills and Edgar's two Grok user rules are still in its context, as they were in October. Grok's cells are unchanged: 160 and 320 px, pairs at 160 only, not in the taught task.
- **2 November. The Claude and Codex calls were less isolated than the Decoders paragraph implies. Codex's October rows count; Claude's await Edgar's ruling.** A review found that both decoders ran with Edgar's real home and user configuration (README, "Isolation of the Claude and Codex calls").
  - **Codex.** `--ignore-user-config` skipped `config.toml`, as the paragraph says. Its context still listed 31 firecrawl skills from `~/.agents/skills` and about thirty skills from Codex's own plugins, all under the read-only sandbox. There was no `AGENTS.md` and nothing about Field. **Edgar ruled on 2 November that the October `codex:astra` and `codex:sol` rows count:** the paragraph's terms were met, and nothing about Field reached the context.
  - **Claude.** Tools and skills were off, as written. No `CLAUDE.md` lay on the path of the trials' empty directories. The Field plugin was installed on 14 October, after the trials. What's left is the advisor tool, which `advisorModel` in user settings makes available and the init event doesn't list. Whether it was set on 4–6 October can't be told: the settings file was last changed on 25 October, the local session transcripts start on 10 October, and the rows don't record which models took part.
    - **The 2 November probe** re-asked eight of Opus's October trials with the October command line (`42696cb:scripts/xagent/decoders.py`) and the advisor set: the six slowest, 21–41 s in October, and two fast ones. Every call used Opus alone, made no tool call and took one turn, in 2–4 s. The main answer matched October's in seven of the eight. The record is `results/probe-claude-advisor-2026-11-02.json`; these were not counted trials.
    - **Timing.** Opus's October times are bimodal, with about a third over three times its median and in every session; Sonnet's are not. The probe points to service latency, not a second model, but it can't show what happened on 4–6 October.
    - Whether the Claude rows count is for Edgar to rule on.

  Both rulings come after the reports were seen, as Grok's did. The calls are now isolated as the README describes, and no counted trial has run under the new flags. The review's other fixes count only answers about current builds; both reports regenerate unchanged.
