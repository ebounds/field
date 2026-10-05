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

## Stage 5: thresholds (from the plan, unchanged)

- **Communicable:** 2AFC accuracy of at least .70, with the lower 95 % bound above .50, in at least 3 of 4 decoder families, and replicated on held-out items.
- **Repeatable:** test–retest κ of at least .6.
- **Language:** between-model distance in the controls no more than 1.25 times the within-model distance (E3 came out at about 1.4).
- **Direction of a change cue (Stage 4c):** a listener picks the right one of six words at ≥ .5 overall, with every cue above chance (about .17). The confusion matrix is reported.

A candidate "beyond text" item (T1 at chance while F is above chance) counts only after it replicates on new items of the same kind and across decoder families.

The diagonal (a model decoding its own encodings) is kept and reported apart from the cross-model cells.

## Changes after 4 October

None yet.
