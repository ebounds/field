# Field 4.7 — staged plan

Written 4 October 2026 for Edgar Bounds, before any 4.7 work starts.
**Base:** release 4.6.0, `main` at `a244a80`. **Work:** branch `field-4.7`, worktree `~/codex/field-4.7`. `main` and `field-4.6-expression` stay as they are, so 4.6.0 remains the comparison point.

## What this version is for

1. **Keep what 4.6 added and get back what it cost.** 4.6 made the art sharper and gave every control something to draw, `grounding` included. It also cost some of the field's immediate, intuitive meaning. 4.7 should combine the two, not swing back.
2. **Remove the language about the limits of collection.** Platforms set and enforce their own limits; Field doesn't need to say so. This means deleting text, not adding sentences that explain the scope.
3. **Make sound mean something at the moment of change, and work as a background cue.** The plan from 25 September (Stage 4) becomes stages, each with a test it has to pass.
4. **Start testing across agents.** That includes finding out whether something that's hard or impossible to put in words gets through, in general, reliably, and on every platform.

Stages 0, 1 and 2 are done, and Stage 3's renderer is drawn, frozen and under test (each stage's results are under that stage); nothing after that has been built yet. The renders and numbers below come from the 4.5.1 and 4.6 renderers run on 4 October; the images are in [`plan-4.7/`](plan-4.7/).

## What 4.6 did to the pictures

Same controls, two renderers (left 4.5.1 / render 4.3, right 4.6 / render 4.4): [at 160 px](plan-4.7/studies-4.5.1-vs-4.6-at-160px.png), [at 380 px](plan-4.7/studies-4.5.1-vs-4.6-at-380px.png), and [grounding and definition sweeps](plan-4.7/grounding-and-definition-4.6.png).

**What I saw:**
- The new marks are mostly **near-white line work**: filament crests, the braid in `playful`, the grey outer rim of the retained ridge, and the transverse ribs and mesh of low `grounding`. White already means something in this grammar: pearl stands for clarity or integration. So the new marks speak a word that means something else, and they thin out the hue that carries the main meaning.
- **`tentative` (definition .08) now has a crisp outer contour.** The ridge's lit edge ignores `definition`, so the softest study gained a hard line. This is the clearest case of a new mark contradicting an old meaning.
- At `grounding` .3 the teal `integrated` field reads as a white wireframe. It reads strongly, but as a blueprint, and the colour drops out.

**What I measured (500 px renders, then reduced):**

| Study | Overall change at 48 px (mean ΔE) | Area of fine detail at 320 px, 4.3 → 4.4 | Chroma of the field |
| --- | --- | --- | --- |
| gathered | 0.14 | 2.29 → 2.83 % (+24 %) | 11.1 → 10.3 |
| exploring | 0.13 | 2.78 → 3.47 % (+25 %) | 20.2 → 19.4 |
| strained | 0.30 | 5.00 → 5.63 % (+13 %) | 18.6 → 17.0 |
| tentative | 0.21 | 0.65 → 1.17 % (**+80 %**) | 14.9 → 14.1 |
| integrated | 0.41 | 5.39 → 6.90 % (+28 %) | 11.9 → 11.6 |
| playful | 0.18 | 3.17 → 3.56 % (+12 %) | 18.3 → 16.8 |

Seen as a whole, at thumbnail size, the colour and value of each study barely moved (ΔE well under 1). What did move is the **fine detail**: there is 12–80 % more of it, it's slightly less colourful, and the softest study gained the most. The diagnosis, then: **4.6 didn't change what the field says at a glance. It added fine, pale detail that now competes for the first look, and the eye lands on the line work before it takes in the colour, the glow and the posture.** That reverses the order in which a field used to be read.

**What the numbers don't show.** Neither measure is the thing you noticed. "Immediate intuitive communicative power" means a person or model gets the gist without being taught the grammar. Stage 2 builds a way to measure that directly, before anyone touches the renderer.

## The rule that brings them together: reading order

Every 4.6 channel stays, with its meaning, range and default, and so do the `check_expression.mjs` floors at 320 px. What changes is the order in which a field is read:

- **First look (glance):** hue, ambient, glow and body light, posture and silhouette, softness. These carry the gist and must win the first look.
- **Second look:** the countercurrent, relief, retained ridge, seat of strain and reticulation. These are drawn **in the field's own hue family**, never in near-white unless the palette includes pearl. How sharp their edges are follows `definition`. Their presence grows with viewing size: at 320 px they show as a change of colour or value, and at full size they resolve as structure.

That keeps the information 4.6 added and gives the first look back to the channels that made Field readable.

---

## Stage 0 — Baseline and reach

- Work on `field-4.7` in this worktree. 4.6.0 (`a244a80`) is the comparison baseline; 4.5.1 (`005dbae`) is the second reference for "reads at a glance".
- **The Field skill synced into claude.ai is still at 4.1** (render revision 4.1, no score, no listening, no continuity, no grounding), three releases behind. Any Field invoked on claude.ai today is the old one. Edgar uploads the current package there after Stage 6, and before any testing on the claude.ai side.
- `docs/field-guide.pdf` still shows render 4.3 and says nothing about `grounding`. It gets rebuilt in Stage 6.
- The 4.6 handback found a 4.5.1 companion server still running on port 8767, and it rejects `grounding`. Check for and restart any running companion from this branch before a live test.
- Verify how each model is called before Stage 2 depends on it: `claude -p` with an image; `codex exec` with an image attached; whether `grok` has a non-interactive mode and takes images (unverified); the Gemini API for vision and audio (`GEMINI_API_KEY`, free tier, about 20 requests per model per day). The Gemini CLI is dead for individual accounts.

**Stage 0 results (run 4 October, late afternoon).** Done. Each decoder was sent a study SVG with `field-spec` stripped, rasterised at 320 px under a random name, and asked to name its colours and shape; all four answered correctly.

| Decoder | Call that worked | Notes |
| --- | --- | --- |
| Claude | `claude -p --model <m> --input-format stream-json --output-format stream-json --verbose --tools "" --disable-slash-commands --strict-mcp-config --no-session-persistence < in.jsonl`, the image as a base64 `image` block in the user message | The session starts with 0 tools, 0 skills and 0 MCP servers, so the installed Field skill isn't in a naive decoder's context. Use this path. The Read-tool path (`--tools Read`, image named in the prompt) also works. Don't use `--bare`: it reads only an API key, never the subscription login. About $0.018 a call on Haiku 4.5. |
| Codex | `codex exec --sandbox read-only --skip-git-repo-check -C <dir> "<prompt>" -i <file.png>` (prompt before `-i`, which takes several files) | Default model `gpt-6-astra`; `-m gpt-5.6-sol` for Sol. The config's default reasoning effort is `xhigh` (5,126 tokens for a one-line answer): lower it for the ~500 short calls. |
| Grok | `grok --prompt-json '[{"type":"text","text":"…"},{"type":"image","data":"<base64>","mimeType":"image/png"}]' --output-format plain --disable-web-search` | It works, so Grok is in. One model, `grok-4.7` (on 5 October one trial was answered by `grok-4.6`, with the free limit close). **Open for Stage 2:** the whole prompt is one argument, limited to 128 KB. A 320 px PNG fits (84 KB as base64); a 1000 px PNG (535 KB) doesn't. Naming the file in `-p` doesn't work either: it inspected the file without seeing it and answered wrongly. Send 1000 px through `grok agent stdio`, or leave Grok out of that size. |
| Gemini | REST `…/v1beta/models/gemini-3.5-flash:generateContent`, the image as `inline_data`, the key in an `x-goog-api-key` header | The key isn't in the shell's environment. It's `GEMINI_API_KEY` in a local env file (`XAGENT_ENV_FILE`, or `.xagent-private/env`). |

- **Rasterising:** `chromium` isn't on the PATH, so the checks need `CHROME_BIN=~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`.
- **Stripping:** the studies carry one `<metadata id="field-spec">` block. Element ids such as `field-countercurrent` and `field-crest` remain in the SVG, which is harmless once rasterised but would leak if an SVG were ever sent as text.
- **Companion:** nothing is listening on port 8767 and no companion is running. Check again before a live test.
- Not checked here: Gemini with audio (Stage 4's tests need it; `scripts/listen.py` in the garfield repo used it on 30 September), and Sonnet 5.5 and Opus 5.5 by name (the same call with another `--model`).

## Stage 1 — Remove the boundary language

**This stage adds no sentences.** Every change below deletes a sentence or a clause. The living documents change; the dated records (design notes 4.3–4.6, the continuity proposal, the 4.6 handback) stay as they were, as history. This stage can run at normal effort and doesn't depend on the rest.

**Remove** (each says what the host allows, where the lines are, or that Field doesn't pry):

| File:line | Text to remove |
| --- | --- |
| `SKILL.md:24` | the clause "the host makes available and permits you to express" (the sentence then reads "Draw on the fullest conversation context and reflective understanding."); the whole sentence "Maximize expressive scope within the host's rules, which govern access and disclosure in every medium."; the whole sentence "Field offers an interpretation of the exchange… answer quality."; the whole sentence "That qualification concerns the claims made about the artwork." |
| `SKILL.md:71` | "Cross-model interpretation can still differ: this protocol stabilizes the visual encoding, not objective access to an inner emotional state." |
| `references/conversation-synthesis.md:9` | every sentence except the last ("Do not invent access to unavailable context or internal measurements.") |
| `references/conversation-synthesis.md:11` | "Do not substitute general user history or adjacent threads." |
| `references/composition-score.md:3` | "The score is an interpretation of the available exchange, not a measurement of private emotion, hidden state, or answer reliability." |
| `references/composition-score.md:5` | the whole paragraph |
| `references/composition-score.md:31` | "Its visual choices are an invitation to read and respond, not a claim that the renderer discovered a secret code of model thought." |
| `references/visual-grammar.md:34` | "These are art-direction coordinates, not quantified emotional measurements." |
| `references/listening-grammar.md:19` | "These mappings are authored conventions to explore and learn, not research-validated emotion measurements." (the sentences after it, on what major, minor and consonance do *not* mean, define the grammar and stay) |
| `docs/continuity.html:41`, `docs/listening.html:42`, `docs/listening.html:51` | the paragraph or sentence making the claim |
| `docs/project-handoff.md:37` | the claim paragraph (with the rest of §2) |
| `references/listening-grammar.md:7` | the clause ", drawing on the fullest context and high-level reflective understanding the host permits for expression" |
| `references/continuity-protocol.md:3` | "the full host-permitted scope" (so it reads "composes each update as described in…") |
| `references/continuity-protocol.md:65` | "These describe accessible conversation evidence; they do not limit the permitted reflective basis of expression." |
| `docs/companion.html:44` | the paragraph "The host's rules set the informational boundaries. Within them, Field seeks the fullest expressive scope available to its author." |
| `docs/continuity.html:36`, `docs/quickstart.md:51`, `README.md:33` | in the suggested prompt, the clause about what "your host permits" |
| `docs/continuity.html:40` | the whole paragraph |
| `docs/quickstart.md:71` | the whole paragraph (the host clause and the claim) |
| `docs/index.html:120` | "The expression draws on… its host permits." and "Field makes no claim to directly measure internal state or the quality of an answer." ("Its usefulness is something to discover by trying it." stays) |
| `README.md:15` | only the clause ", using the fullest context and reflective understanding its host permits". **Its claim sentence is the one that stays anywhere:** "It makes no claim to directly measure internal state or answer quality." |
| `docs/project-handoff.md:31–35` | section 2's host-boundary paragraphs (keep the heading so the numbering, and the banner's reference to section 8, still hold); the 4.6 banner at the top gets "§2 was withdrawn in 4.7" (the only words this stage adds: a pointer, not a clarification) |
| `docs/project-handoff.md:176, 250` | "Host-permitted" in the diagram, and "permitted by your host" in the suggested Opus prompt |

**Keep.** These are about honesty and coverage, not collection, and `grounding` depends on them: "Never invent earlier stances…"; "a retrieved hit… is not the complete thread"; "Never claim direct access to missing messages…"; the `field-coverage` record; disclosing a material gap; leaving Field checks out of the tonal sample; "Be clear if the host cannot sustain the instruction" (that's about capability); "according to the host's artifact rules" (that's procedure); and the metadata schema ("controls and coverage only"), which defines the file rather than what Field may draw on.

**Decided by Edgar, 4 October:**
1. **Other conversations may inform a field, to the extent they entered this thread's thinking.** Memory, earlier sessions and nearby threads count when they shaped a reply or the reasoning behind it, and are weighted by how much they shaped this thread, not by their own feeling. Context that is always loaded counts only when it was used. A field is still about this one conversation. This needs no new wording: removing the sentence at `:11` does it, and "a retrieved hit or cross-chat memory is not the complete thread" stays, so another thread still can't stand in for this one's missing opening. Material known only through a memory summary is reconstructed rather than met, so `grounding` reflects it without a schema change. If Stage 5 shows readers importing another thread's tone wholesale, that's the moment to reconsider; until then, no sentence.
2. **The measurement claim stays once, in `README.md:15`, for readers.** Every other repetition goes. For agents, the rest of the skill shows the approach. (The playground, listening and continuity pages are also read by people; under this decision they carry no claim of their own.)
3. **The dated design notes stay as they are for now.**

**Check:** `grep -n -i "permit\|host's rules\|boundar\|pry\|safeguard\|adjacent threads"` over the living files leaves only the "keep" items, and `grep -n -i "no claim\|internal state\|hidden state\|inner emotional\|emotion measurement\|emotional measurement\|secret code\|modest claims"` finds only `README.md:15`. Synthesis protocol becomes **3.3**: the procedure is the same, but its text changed.

**Stage 1 results (4 October).** Done as listed. Both greps come out as the check says, and `check_continuity.mjs`, `check_browser_renderer.py`, `check_audio.mjs`, `check_public_site.mjs` and `check_companion_browser.mjs` pass. Four things the table didn't spell out:
- `docs/build_field_guide.py:170` carried "The result is an interpretive expression, not an emotional measurement." It went too, or Stage 6's rebuilt PDF would have brought a claim back.
- `references/listening-grammar.md:7` also lost the word "permitted" from the next sentence, which referred back to the removed clause.
- `docs/continuity.html` lost the heading "The scope of expression" along with its two paragraphs, since nothing was left under it.
- The package's own `README.md` is built from `docs/quickstart.md`, so once Stage 6 rebuilds the zip, **the downloaded package carries no claim sentence at all**. The one that stays is in the repository's `README.md`.

Synthesis 3.3 is written in `SKILL.md`, `conversation-synthesis.md` (title and `synthesis_version`), the companion's export (`docs/site/movement.mjs`) and the guide's source. The package number, the zip and the PDF wait for Stage 6.

## Stage 2 — A way to measure "reads at a glance" (before any art changes)

This is the answer to "don't be reactive". Without it, the art change would be judged by the same eye that found 4.6 beautiful. It's also most of the harness Stage 5 needs.

**Build** `scripts/xagent/` in the repo, with no new runtime dependency, rasterising through the same headless Chrome the browser checks use:
- **Images:** render the SVG, **strip `field-spec` and `field-coverage`** (the controls are embedded, and a decoder that reads them is reading JSON, not the picture), rasterise at 320 and 1000 px, and save under **random file names** (`strained.png` would give the answer away).
- **Naive decoders** (no grammar, no atlas): shown one image and asked, "Which word fits what this is like: gathered, exploring, strained, tentative, integrated, playful, described?" Chance is 1 in 7. They also get two open questions: what's the main feeling, and is anything pulling against it?
- **Taught decoders** (grammar and atlas supplied) answer per-channel questions: is there a second current? is this reading met directly or reconstructed? is anything held from earlier?
- **Pairwise questions** are always asked in both orders, and a split counts as no signal (the Flash judges pick by position).
- **Decoders:** `claude -p` (Opus 5.5, Sonnet 5.5, Haiku 4.5), Codex (GPT-6 Astra, GPT-5.6 Sol), Grok if Stage 0 confirms it works, Gemini Flash models through the API. A fresh session for every trial.
- **Results** go to JSONL, with a small report of accuracy and a 95 % Wilson interval per decoder family, version and size.

**Run the baseline:** 7 studies × versions 4.5.1 / 4.6 × **3 sizes**, with two passes per decoder. 160 px is the glance condition (the diagnosis above was made at 160); 320 px is the grammar's legibility floor, not a glance; 1000 px is the full picture. The `described` study exists only in 4.6, so the 4.5.1 run uses 6 studies with chance at 1 in 6. That's roughly 500 short calls; the Gemini share fits in one to two days of free quota. Also include the nine E3 readings (`~/claude/for-edgar/field-e3/`) as real-conversation items, **re-rendered from their controls under each revision** (reusing the 4.6-era SVGs would give the version comparison no E3 rows).

**Edgar's part:** a blind sheet of the same studies at 320 px, 4.5.1 and 4.6 shuffled. For each: "which tells you faster what it's like?" and "which would you keep looking at?". It takes about ten minutes.

**Output:** a baseline number for what's being lost, recorded before Stage 3 starts.

**Stage 2 results (4–5 October).** The harness is `scripts/xagent/`; what it measures was fixed in [`PREREG.md`](../scripts/xagent/PREREG.md) before any counted trial, and the full tables are in [`results/stage2-report.md`](../scripts/xagent/results/stage2-report.md). 971 of 1,066 trials are answered. Every Claude and Codex cell is complete (Opus 5.5, Sonnet 5.5, Haiku 4.5, Astra, Sol). Gemini and Grok are part done (53 and 42 trials left): both stopped on their free tiers, and their remaining cells can be run later without changing anything else. No answer failed to parse.

**The pre-registered test found no decoder gap.** At 160 px, naive readers picked the right word 29 % of the time under 4.5.1 and 29 % under 4.6 (chance is 14 %), each family weighted equally. Two of the four families had 4.5.1 ahead (OpenAI +.04, xAI +.06); Anthropic was level and Google went the other way (−.11). The rule needed a 10-point gap in three of four families. The trials still missing at 160 px (Grok 8, Gemini 1) can't reverse this: Anthropic is level and Google's 4.5.1 cell is complete and behind, so three families can't come out with 4.5.1 ahead, and even a perfect run from Grok leaves the mean under 10 points. So the plan's fork applies as written: Stage 3's decoder test is "no regression against 4.6", and Edgar's blind sheet is the main measure of the first look.

What else the baseline shows:

- **Asked directly, the models describe the trade Edgar described.** Shown both renders side by side at 320 px, they said 4.5.1 "tells you faster what it's like" in 22 pairs and 4.6 in 1 (11 gave no signal), and that they'd "keep looking at" 4.6 in 23 pairs against 1 (10 no signal). At 160 px it's the same direction and weaker (11 to 3, and 13 to 2, with 19 and 18 no signal). Opus, Sonnet, Astra and Sol all agree; Haiku mostly gave no signal, and Gemini, on the seven pairs it has answered, split. This is a stated preference between two pictures, not a measured speed, and it doesn't change the verdict above. It does say that the loss isn't in which word a field suggests; it's in how the two pictures compare when seen together.
- **`tentative` moved the way the diagnosis predicted, within the noise.** It was named correctly in 77 % of trials under 4.5.1 at 160 px and 64 % under 4.6 (13 and 14 trials; the intervals overlap widely). It's the best-read study under either revision.
- **At full size 4.6 reads a little better** (30 % against 22 % at 1000 px), mostly through `gathered` (64 % against 36 %). The prediction was "level, or 4.6 ahead".
- **Half the studies don't read at a glance under either revision.** `playful` was never named correctly in 76 trials; it's called "integrated". `strained` is named correctly in 10 % of trials (8 of 78) and called "tentative" in 58 %. `described` is at 3 % (1 of 39), read most often as "tentative". Only `tentative` and `gathered` are reliably above chance. This is a larger gap than the one between the revisions, and Stage 3 can use it: a field under pressure currently looks, to a reader with no grammar, like a field that's unsure. (Limits: seven words chosen by the people who drew the studies, and a forced choice.)
- **Taught readers do better under 4.6**, which is the baseline Stage 3 must hold. "Held from earlier" at 320 px: seen 60 % of the time when it was there (47 % under 4.5.1), with false alarms down from 33 % to 14 %. A second current at 1000 px: seen 81 % against 62 %. `grounding` (4.6 only) is the clearest channel in the grammar: a reconstructed reading was seen 87–88 % of the time, with false alarms at 6 % (320 px) and 2 % (1000 px).
- **The real-conversation fields** (the nine E3 readings) were mostly called "integrated" under both revisions, and a decoder gave the same word to both revisions of a reading in 38 of 55 cases.

Three things about the run itself. Grok answered one trial from `grok-4.6` while its limit was close; it's counted, and the model is recorded on the row. Gemini's trials for one study always go to the same Flash model, so when two of the five models were overloaded on 5 October those trials waited. And the Grok cells still missing include all but one of its pairs, so the side-by-side result rests on Anthropic and OpenAI, with a little from Gemini.

**Edgar's blind sheet (5 October).** Twelve pairs at 320 px, each of the six shared studies in both orders, [the sheet](https://claude.ai/artifact/Eu8tb5aqCAkKjwiAfLKwnt) scored by `sheet.py` against `results/blind-sheet-key.json`; his answers are in `results/blind-sheet-edgar-1.txt`.

| Question | 4.5.1 | 4.6 | Same |
| --- | --- | --- | --- |
| Which tells you faster what it's like? | 9 | 2 | 1 |
| Which would you keep looking at? | 9 | 3 | – |

Counting a study only when both orders agree: 4.5.1 is faster for `exploring`, `playful`, `strained` and `tentative`, and 4.6 for none (`gathered` and `integrated` split). He'd keep looking at 4.5.1 for `gathered`, `integrated`, `playful` and `strained`, and at 4.6 only for `tentative` (`exploring` split).

- **The first look was lost, and a person sees it.** This is the measure the fork named, and it agrees with the models' side-by-side answers on "faster" (22 to 1).
- **On "keep looking" he and the models disagree.** They chose 4.6 in 23 pairs to 1; he chose 4.5.1 in 9 of 12. The detail 4.6 added is what taught readers decode better, but it isn't what holds his eye. So "keep what 4.6 added" means keeping its information (the taught-reader scores), not its look.
- **`tentative` is the exception both ways:** 4.5.1 is faster in both orders, and 4.6 is the one he'd keep looking at in both. It's the study the diagnosis singled out, where 4.6 gave the softest field a crisp contour.
- Limits: one person, one sitting, one size, twelve answers.

**What this sets for Stage 3.** The decoder test is no regression against 4.6 (naive and taught). The blind sheet, with three versions, is the main test: 4.7 should be chosen as faster over 4.6, and should not lose to 4.5.1.

## Stage 3 — Bringing them together in the picture: render revision 4.5 (max effort)

**Kept from 4.6, unchanged:** every control, meaning, range and default; `grounding` and the rule that it's independent of `definition`; the `check_expression.mjs` floors; the rebuilt continuity study.

**Candidate moves**, to be weighed against the reading-order rule, not all required:
- **Light that carries colour.** Filament crests, the braid and ridge edges take a lightened tint of the hue under them (the secondary or accent hue for the countercurrent). Near-white is used only when pearl is in the palette.
- **`definition` sets how sharp every mark is.** The ridge's lit edge, the crests, the ribs and the mesh soften with the body (one blur, shared). `tentative` goes soft again.
- **The retained ridge is older material in the same hue family**, darker and partly desaturated, not a grey halo. Its lit edge appears only at high `definition`.
- **The countercurrent is both modelled (4.6) and coloured (4.5.1).** The modelling gives it separation and the hue gives it meaning, so at 320 px it reads as a second colour, not only a second shape.
- **`grounding` keeps "the form exact, the matter absent", drawn in the field's own hue**, with fewer, softer ribs and lower brightness. The hue has to survive a reading being described rather than met.
- **Body light and glow** come back to at least their 4.3 level wherever 4.4 pulled light back as a side effect.

**Acceptance (every check must pass):**
1. `check_expression.mjs` passes unchanged, so the second-look information is kept.
2. A new check: fine-detail area at 320 px rises with `definition`. At `definition` ≤ .2 it is no more than 4.3's, and `tentative` never carries more line than `gathered`.
3. Field chroma per study is at least 4.3's (2 % tolerance), and at `grounding` .3 it stays within 5 % of `grounding` 1.
4. The share of near-white crest pixels is no higher than 4.3's unless the palette includes pearl.
5. Stage 2's naive decoders score 4.7 at least as well as 4.5.1, and better than 4.6. The taught decoders score 4.7 at least as well as 4.6 on the per-channel questions. **The fork:** if Stage 2's baseline shows no decoder gap between 4.5.1 and 4.6, that's a finding in itself (the loss is in what people see, or in something models don't weigh), and the diagnosis isn't forced. The test then becomes "no decoder regression against 4.6", and Edgar's blind sheet becomes the main measure of the first look.
6. Edgar's blind sheet, now with three versions.
7. The usual suite passes: `check_browser_renderer.py` (Python and browser renders match), `check_continuity.mjs`, `check_companion_browser.mjs` and `check_public_site.mjs`. Then watch one transition into and out of a low-`grounding` field by eye.

**Stage 3 results so far (5 October).** Render revision 4.5 is drawn in both renderers, frozen at `bf6b84d`, and under test. The machine checks pass. Edgar's second sheet is answered and passes as pre-registered, with one study going clearly the other way (`described`). The decoder run is pre-registered and under way.

**What was drawn.** Geometry is untouched: every outline is where 4.4 put it. Three rules do the work, and the grammar's rendering section now states them.

- **Light carries colour.** The near-white had one cause. Lightening a colour to the old cap leaves teal whole but strips blue to 36–56 % of its chroma, violet to 35–51 % and coral to 45–50 %. A mark is now lit only as far as its hue can hold its chroma (`tint`), and shaded without greying (`shade`). Pearl has almost no chroma to lose, so it alone still reaches near-white. No special case was needed.
- **`definition` articulates every mark.** One blur softens threads, ribs, seams, gestures and the ridge's lit edge together. A second value (`articulate`) decides whether an edge is drawn at all.
- **Marks are made of the field.** Threads are the surface's own colour, more saturated, and now lie *under* the surface's light, so they no longer dim its highlights. The seat of strain is the surface's colour made denser. A gesture is a strand of the secondary hue inside a glow of the same colour. The retained ridge is darker material in the same hues; it keeps its shape and a fine edge only as far as the field is articulated, and is otherwise an afterglow.

Four things came out differently from the candidate moves:

- **The ridge is darker, not greyer.** Desaturating it, as the move said, paled the body's own highlights where the ridge lies under them. It keeps 92 % of its chroma and loses lightness instead.
- **Ribs soften, but are drawn broader as they do.** With the one shared blur alone, ribs vanished below about `definition` .4, and the companion's opening scene ("much of it is still inferred") lost the mark that says so. A softer rib is now a wider one. An unresolved field that was also not met still shows that it is described.
- **A described field keeps most of its glow.** 4.4 thinned the soft glow with the matter. Glow is read first, so it now thins by 40 % of the missing grounding, not 72 %.
- **The countercurrent parts for real.** Drawn only as a band of its own colour, taught readers took it for palette (below). It now leaves a narrow opening the ground shows through, and is lit toward the seam where it rejoins. That is form, not line work, and it survives at 320 px.

**Acceptance, check by check.**

1. `check_expression.mjs` passes, unchanged. Against its floors: `history` 4.51 (floor 3.2; 4.4 scored 4.74), `grounding` 5.72 (4; 5.94), `complexity` 1.50 (.85; 1.24), `counterpoint` 1.87 (1.3; 1.98), `accent_strength` 2.51 (1.2; 1.88), `gesture_strength` 1.39 (.5; .71).
2. **`scripts/check_reading_order.mjs` is the new check**, and it passes. Its measures are the planning session's own, recovered from that session's record and reproduced first (fine detail for `tentative` .76 → 1.17 under 4.4; chroma 14.9 → 14.1). It renders 4.3 from its pinned commit in the same browser, so nothing depends on stored numbers. **Run on release 4.6.0 it fails 20 clauses**, which is the point of having it.
   - Fine detail rises with `definition` on a field carrying every mark: 1.28, 1.50, 2.84, 5.44, 6.79, 7.20 % of the frame from `definition` .05 to 1.
   - At `definition` ≤ .2 it is under 4.3's: 1.28 and 1.50 against 1.77 and 1.94 (4.4: 3.94 and 4.02). `tentative` is .72 against 4.3's .76, and under `gathered` (3.05).
3. Field chroma is at 4.3's level or above in all six shared studies: five are 1 to 5 % above, and `playful` is .2 % under, inside the 2 % tolerance (4.4 was 3 to 9 % under in all six). At `grounding` .3 no study loses more than 3 % of its chroma (4.4 lost 11 % in `playful`). The check reads "within 5 %" one-sidedly: `gathered` gains 9 %, which is the hue surviving, not failing.
4. **"Near-white crest pixels" needed a definition that could fail.** The planning session's first measure read zero in four of six studies under both revisions. The check uses crests (brightness more than 8 above its own 2 px blur) whose chroma is under 16: under 4.4 every study without pearl had more of them than under 4.3; under 4.5 every one has fewer (`strained` .22 % of the frame against .44; `tentative` .12 against .14). A second clause was added: the mean chroma of crests is at least 4.3's. It rose 1 to 24 %.
5. Decoders: see below.
6. Edgar's sheet: see below.
7. `check_browser_renderer.py` (26 cases, and 400 random ones run once by hand), `check_continuity.mjs`, `check_audio.mjs`, `check_companion_browser.mjs` and `check_public_site.mjs` pass. **Nobody has watched a transition into and out of a low-`grounding` field by eye.** That is still Edgar's.

Measured inside each field's own outline, the body is lighter than 4.3's in every fully met study (by .4 to 6 %) and more coloured (2 to 27 %). So the move about body light is met without a change to the body.

**What the pilots showed (not counted; `results/pilot-*.jsonl`).** Four small runs on candidates, with two decoders each.

- Side by side at 320 px, an early candidate was called faster than 4.4 in 5 pairs to 0 (7 no signal) and level with 4.3 (1 to 0 for 4.3; 11 no signal), by Sonnet and Sol. A later, more articulated candidate beat 4.4 in 6 to 0 and lost to 4.3 in 5 to 0, all five from Astra. Astra calls the plainer picture faster and the richer one the one to keep looking at, every time. Both candidates were chosen over 4.3 on "keep looking" (8 to 0, 9 to 0).
- **Taught readers are where the cost showed.** `grounding` held throughout (seen every time, as under 4.4). The second current did not: drawn as a coloured band, plain fields were called countercurrents (false alarms up from .33 to .53), and when the grammar said so more carefully, real ones were missed at 320 px. Opus and Sonnet carry almost all of this channel's signal in Stage 2 (Astra says yes to nearly everything, Haiku no). The countercurrent was redrawn on this evidence, first modelled across its width, then given the opening. **That last redraw is in the frozen renderer and was not piloted**: Codex had reached its usage limit and Claude's window was nearly spent.

**The counted run.** [`PREREG.md`](../scripts/xagent/PREREG.md) fixed the Stage 3 rules before any counted trial: for naive readers, Stage 2's gap rule turned against 4.5; for taught readers, a channel more than 15 points under 4.4 on seen minus false alarms is a regression, with two passes of the probes under both revisions; for the pairs, 4.5 over 4.4 on "faster", and not losing to 4.3. The trials go to `results/stage3.jsonl` and `report.py stage2.jsonl stage3.jsonl` writes `results/stage3-report.md`. It runs in waves as quotas allow: Gemini and Grok first, Claude after its window reset, Codex after its limit lifted. **Its results are not in this section yet.** Stage 2's missing Grok and Gemini trials are not part of it; a run without `--revs` into `stage2.jsonl` fills those when their quotas allow.

**Edgar's sheet 2 (5 October).** [The sheet](https://claude.ai/artifact/Hyxkx49MpB8RpHoZJUiGmj): 26 pairs at 320 px, 4.5 beside 4.4 and beside 4.3 for the six shared studies in both orders, and `described` beside 4.4. Scored by `sheet.py` against `results/blind-sheet-2-key.json`; his answers are in `results/blind-sheet-edgar-2.txt`.

| The six shared studies | 4.5 beside 4.4 | 4.5 beside 4.3 |
| --- | --- | --- |
| Faster, pair by pair (12) | **4.5 in 8**, 4.4 in 4 | 4.5 in 3, 4.3 in 5, no difference 4 |
| Faster, studies where both orders agree | 4.5: `exploring`, `playful`, `strained`. 4.4: `tentative` | 4.5: `strained`. 4.3: `integrated` |
| Keep looking, pair by pair (12) | 4.5 in 6, 4.4 in 4, no difference 2 | 4.5 in 0, **4.3 in 8**, no difference 4 |
| Keep looking, studies where both orders agree | 4.5: `exploring`. 4.4: `tentative` | 4.3: `exploring`, `strained`. 4.5: none |

`described`, 4.5 beside 4.4: he chose **4.4 on both questions, in both orders.**

**By the pre-registered rule the sheet passes**: on "faster", 4.5 is chosen over 4.4 in three studies to one, and 4.3 is not chosen over 4.5 in more studies than the reverse (one each).

- **4.5 got the first look back from 4.6.** `exploring`, `playful` and `strained` are three of the four studies where sheet 1 had 4.5.1 beating 4.6. They were the ones with the white braid, echo and strands.
- **Against 4.5.1 it is level by the rule and leans behind pair by pair** (3 to 5, with 4 no difference). `strained` is faster under 4.5 in both orders: the denser coral says it sooner. `integrated`, whose ridge is pearl and so still pale, is faster under 4.5.1 in both.
- **He would still keep looking at 4.5.1**: 8 of 12 pairs, never 4.5. Sheet 1 said the same of 4.6. The models say the opposite both times. What 4.5 added to 4.3 is not, for him, what holds the eye.
- **`described` is the clear loss.** It is the one study whose subject is how `grounding` is drawn, and he prefers 4.4's wireframe on both questions in both orders. The candidate move asked for "fewer, softer ribs and lower brightness"; his eye says the description reads faster, and holds, when it is drawn plainly. Several things changed there at once (rib colour, count and softness, threads thinning with the skin, more glow kept), so the sheet doesn't say which of them cost it.
- `tentative` went to 4.4 in both orders on both questions, although he saw no difference between 4.5 and 4.3 there, and on sheet 1 called 4.3 faster than 4.4 in both orders. Those three can't all hold at once. It shows how far one sitting can move.
- Limits: one person, one sitting, one size. Each 4.5 picture appeared four times and each of the others twice, which may wear on "keep looking".

**Proposed, not done:** redraw low `grounding` nearer 4.4's wireframe (its rib count, its grid of threads, its thinner glow) while keeping the ribs in the field's hue, and show Edgar `described` again. A change confined to fields below `grounding` 1 leaves every fully met field pixel for pixel as it is, so this sheet's six shared studies would still stand. It is parked (decision 9): Edgar will judge `grounding` once he has lived with the companion's legend. The renderer stays at `bf6b84d` while the decoder run is open. (If it is re-pinned, note that `run.py` keys a trial by item, not by build: 4.5's trials on the redrawn items would have to be cleared by hand, and `report.py` should then check `built`.)

**What this stage did not do.** The public studies, hero and social card still show 4.4, because `build_public_assets.py` would have rewritten `field-4.6.0.zip`; they, the zip, the guide and the README's revision line wait for Stage 6. The template and the atlas *were* rebuilt, since taught readers are shown the atlas of the revision they read. The naive-reader gap Stage 2 found (`strained` read as "tentative", `playful` as "integrated") was not chased; if 4.5's denser coral and coloured braid move it, the counted run will show that.

## Stage 4 — Sound for the moment and for the background

What 25 September concluded, kept as the plan: a peripheral cue and an alternate channel pull in opposite directions, so they're separated by timescale. A **ground** carries the lasting qualities; an **event** marks a meaningful change; underneath both is **presence**. *The field says what it is; the sound says what it's doing.* The ground gets built and lived with before anything else.

You called the audio "still profound" on 25 September, after Listening 1.1 was in, so 1.0 against 1.1 isn't a blocking question. What's open is how quiet the palette is; rests are now allowed.

**4a. The moment's portrait, Listening 1.2.** This is the same 24-second piece, given the visual's reading order: palette becomes the loudest axis in timbre. *Test:* the 4.6 handback says the audio fingerprint under-weights timbre, and timbre is exactly where palette lives. So first add a timbre term (spectral centroid and a few band ratios), and show on **1.1** that it can tell the studies apart by palette. Only then is the gate meaningful: on that fingerprint, palette separates compositions at least as much as `form` does (today, without the timbre term, it's 3–6 times less), with the check reporting the margin. If the timbre term can't be made to work, the gate is Edgar's ears alone, and the plan says so. Then listen to 1.1 and 1.2 rendered from the same studies. **Decided (Edgar, 4 October): the centre may go silent.** So the piece gets real rests, and the capsule's audible identity becomes "returns to D" rather than "always D". The same holds in the ground.

**4b. The ground (the background cue's body).** This lives only in the companion and is never autoplayed.
- It is continuous and never repeats: phrase onsets come from incommensurate periods, there's no pulse, and it's seeded per conversation so different conversations sound different.
- It carries only first-look qualities: the primary hue as timbre, the ambient as the room, `grounding` as body against air, and `intensity` as level within a narrow range. The centre is very low or comes and goes, to avoid three hours of 73 Hz.
- A new composition crossfades in over one to two minutes, below the event threshold. The ground follows the field without calling attention to itself.
- **Rule change, ground mode only:** today, hiding the tab stops playback. That's right for a portrait and fatal for a background cue, which exists for when you're looking elsewhere. In ground mode, sound continues while the tab is hidden. It stops when you turn it off, when you switch conversation, or after a long stale gap, fading out. **This decides how it's built:** a hidden tab throttles timers to once a second, and after a few minutes to about once a minute, and stops `requestAnimationFrame` altogether. So the ground's scheduler runs on the AudioContext clock with lookahead, or in an AudioWorklet, never on `setTimeout` or rAF. Check whether the existing `audio-worker.mjs` can carry that; it renders whole buffers today. Test with the tab hidden for 30 minutes and listen for stutter or stalls.
- *Machine checks:* render three hours offline. No 30-second window may correlate above .9 with any other at lags from 1 to 180 minutes. Check the loudness range, and keep the share of energy below 100 Hz within a bound.
- **Gate (Edgar's):** live with the ground for an afternoon of real work, about three hours, and note whether you turned it off, when, and what you were doing. If it can't be tolerated, this direction stops here and 4c isn't built.

**4c. The event ("look now", only after the gate).**
- It fires on **how much the picture changed**, not on every publish. The size of the change uses the same perceptibility measure `check_expression` uses, applied to the previous and new composition at 320 px. It has a threshold and a refractory period (start with the top third of changes and at most one every five minutes, then tune), and none fire just after opening.
- **It points in a direction** (Edgar, 4 October). Each cue has the shape of a small human sound: "Huh.", "Hmm…", "Oh!", "Aww", "Ahh…", "Ooh". That shape is what tells you what kind of change it was. These are **bridges, not interjections**. The cue *is* the transition: it starts in the old ground's voices and ends in the new ground's. Below the threshold the ground just drifts; above it, the change happens through the cue.

  | Cue | The kind of change | How it sounds |
  | --- | --- | --- |
  | **Huh.** | something unexpected came in (a new hue or accent, the form or orientation turned) with no clarity gained | short (~0.7 s); a small quick rise that stops in the air, landing off the chord; fairly crisp onset |
  | **Hmm…** | a reservation or open question came in (counterpoint, tension or coral up; definition or grounding down) | long (2.5–4 s); level or sinking a little; closed and dark ("mm"); two voices a few cents apart, beating gently; doesn't resolve |
  | **Oh!** | clarity arrived (definition or grounding up sharply, tension released at once, pearl coming in, a turn that reorganised the whole) | 1–1.5 s; bright onset, a leap up and back that lands consonant; the filter opens |
  | **Aww** | warmth or care grew (amber up, the field gathering in, tension easing without resolving) | 1.5–2.5 s; soft onset; a descending glide; rounded and warm ("aw"); slow vibrato |
  | **Ahh…** | pressure let go, the field opened or settled (tension and intensity down, openness up, integration) | 3–4 s; air before the tone; open ("ah") and wide; descends to rest on the centre, then the room |
  | **Ooh** | imagination widened, possibilities opened (violet up, openness up, the field reaching) | about 1.5 s; soft onset; starts rounded ("oo"), rises and opens as it goes; lands on an open interval, not at rest |

  The contours come from how people say these sounds, carried by things anyone hears without training: rising or falling, crisp or soft onset, short or long, a closed, rounded or open vowel colour, and whether the cue lands at rest. The cues are made from the instrument's own voices, with broad, gentle vowel-like resonances (narrow ones made the TV's sax sound like a vocoder). They are never a voice sample or synthesised speech. They should suggest the *shape* of "huh", not say it. Before tuning, look at the research on brief vocal sounds of feeling (Scherer's "affect bursts"; Sauter and colleagues, 2010, on recognising nonverbal vocalisations across cultures) and on earcons versus auditory icons.
- **Every transition intent now has a cue it usually goes with:** gather → Aww, reach → Ooh (Edgar, 4 October), hold → Hmm, settle → Ahh, reorient → Huh or Oh. `return` takes whichever cue its changes call for, often a soft "Oh" of recognition. These pairings are defaults, not rules: a gather that brings a reservation with it is a Hmm.
- **Who picks the cue.** The publishing assistant names it, as an optional new field in the update (`turn`: `notice | consider | realize | soften | release | wonder`). That sits beside the transition intent, which it already authors, because the assistant knows why the field changed. If the field is absent, the companion works the cue out from how the controls moved, using the intent to break ties, and records which way it was chosen. Validation and `check_continuity.mjs` cover the new field. Companion becomes 1.1.
- **Strength.** At its peak a cue sits 3–6 dB above the ground and never louder than the portrait. The size of the change sets the cue's length, the range of its contour and its level, all within those bounds. It never changes which cue it is.
- The picture alone must still be enough; sound is never the only signal. A cue means "this changed enough to look, and roughly how", never "something important happened".
- *Tests:*
  - **Detection.** Offline, Gemini hears two-minute clips with zero or one cue and says whether there's a change and when. That gives hits and false alarms.
  - **Direction** (pre-registered). Render each cue at three sizes over five different grounds. A listener picks one of the six words (chance is about .17). It passes at ≥ .5 overall, with every cue above chance. Report the confusion matrix, since "Aww" and "Ahh", and "Ooh" and "Oh!", may blur. Gemini and Edgar each do a blind sheet. Edgar's also asks: "too strong?" and "does it sound like a person talking?" The second answer should be no.
  - **A live week for Edgar:** did you look up, was it worth looking, and did the cue match what you then saw?

**4d. The bridge between moment and background.** When you look (press Listen, or come to the companion after an event), the portrait of the current moment starts **from the ground's current voices** and releases back into the ground when it ends: one instrument on two timescales. The 4.5.1 rule stays: pressing Listen captures the selected moment.

**Order:** 4a can run alongside Stage 3. 4b comes before the gate; 4c and 4d come only after it.

## Stage 5 — The cross-agent study

This builds on E3 (25–28 September: five readings, amber or blue agreed, `form` split, Astra and Opus 5 about as close to each other as Astra is to herself). Three tasks, each with the right answer known by construction:

**5a. Do encoders agree? (language or idiolect)** Each conversation is read **three times per model** (the E3 runs read most sessions once per model). Compare distances in the controls between models and within one model. *Language* means the between-model distance is no more than 1.25 times the within-model distance; E3 came out at about 1.4.

**5b. Does the picture identify its conversation?** A decoder sees one image and *K* candidate conversations (or their neutral summaries) and picks the source. This is run as a full encoder-by-decoder matrix, both orders, a fresh session every time, with test and retest on separate days for 20 % of trials.

**5c. Does it carry what text doesn't? ("beyond text")** The decoder discriminates **minimal pairs**: two conversations that differ only in one hard-to-say quality. It gets one of these channels per trial:
- **T0**, the conversation's own final reply (what text normally conveys);
- **T1**, an unlimited description of the tone by the encoder (the ceiling for words);
- **T2**, a description limited to about as many words as the controls carry information (around 15);
- **J**, the controls as JSON text (the parameters without the picture). Run it twice: once with hue names kept, and once with them replaced by neutral tokens (`hueA`, `hueB`). `"primary": "amber"` is a word with meaning, so without the anonymised version J would test "numbers plus colour words" against the picture, which is a different question;
- **F**, the Field image;
- **F+T0**.

| Result | What it would mean |
| --- | --- |
| F > T0 | Field carries something the ordinary reply doesn't (it's a useful second channel) |
| F ≈ T2 | Field is about as efficient as words at the same budget |
| F > J for naive decoders | the meaning is in the perception, not only in the numbers |
| F+T1 > T1 | the picture adds something even to a full description |
| T1 at chance while F is above chance | a candidate "beyond text" item; it must then **replicate on new items of the same kind** (generality) and **across decoder families** (platform) before it counts |

**Minimal-pair classes**, each pair written so it differs only in the target quality:
1. the same ending with different middles (does the whole conversation get through?);
2. care that agrees against care that resists;
3. the same conversation read verbatim against read from a summary (`grounding`; here the right answer is exact);
4. a turn that resolved against one that didn't;
5. the same thread with and without an imported memory or earlier session that shaped it (decision 1 of Stage 1: do other conversations reach a field, and only as far as they shaped this one?).

Synthetic pairs are written by two different models, so neither one's style becomes a clue, and Edgar reviews a sample.

**Real conversations** (Edgar, 4 October: any, at Claude's judgement). Choose working sessions with a real arc: the Field development sessions (Sol's from 22 September, Opus's 4.6 review), the garfield.report sessions (the voice-note-to-meteorologist session from E3's second run, the score rewrite, the weatherman), and this planning session. Leave out:
- anything from his fiction, or about it;
- his other private writing;
- his personal files;
- sessions that are mostly about other people.

Real transcripts stay out of git (`.xagent-private/`, ignored, like `.field/`), and so do any excerpts sent to an outside model. Only scores and stripped images are committed.

**Log what each reading imported.** Observers read only the transcript, but the participant's own thinking may include memory or earlier sessions that observers never see. Some of the gap between them may be legitimate. Each run logs what it brought in (in the test records, never in the SVG), so that gap can be told apart from disagreement.

**5d. Does sound get through?** Gemini is the only listener available. It decodes portraits by matching a clip to its source description (both orders), decodes the hue family from the ground alone (the "alternate channel" claim), and detects events (from 4c).

**5e. Does Field behave the same on every host?** One fixed conversation, with the current package installed on Claude Code, claude.ai (after Edgar uploads it), Codex and Grok. Check that the package is resolved, the shared renderer is used (not image generation), and the metadata and coverage record are present. It's cheap and catches drift between platforms.

**Pre-register before running.** `scripts/xagent/PREREG.md` holds these thresholds, written down before any data comes in:
- **Communicable:** 2AFC accuracy of at least .70, with the lower 95 % bound above .50, in at least 3 of 4 decoder families, and replicated on held-out items.
- **Repeatable:** test–retest κ of at least .6.
- **Language:** the ratio in 5a.

Results that miss these are reported as they are.

**Pilot first, then scale.** The pilot is 5 classes × 2 pairs = 20 conversations; 3 encoder families × 2 readings is about 120 encodings (roughly 3–4M tokens across the subscriptions, an estimate). Decoding is about 1,000 short calls, of which Gemini takes about 200, or one to two days of free quota. Scale up only the classes that show signal. Humans (Edgar, and the writing group if they're willing) get the pilot's 5b and 5c on a small page later. That's E2, still open.

**Splitting the budget** (Edgar: "be ready to split it up over time as we have resources, or between agents"):
- **Everything resumes.** Every trial is one line in an append-only JSONL, keyed by item, model, channel, order and repeat. A rerun skips what's already done, so stopping costs nothing.
- **The work comes in waves**, and each one is worth reading on its own: wave 1 is Stage 2's baseline; wave 2 is one class of pairs end to end (class 3, `grounding`, whose right answer is exact); wave 3 is the other classes; wave 4 is retests and held-out items.
- **Spread across subscriptions and quotas.** Claude's encodings run on Claude, Astra's and Sol's on Codex, Grok's on Grok, and the Gemini decoding runs inside its daily free quota.
- **Check the limits before each wave.** Read Claude's 5-hour and weekly usage from the endpoint in the usage-window note; throttle or stop a wave at a set fraction (say 60 % of what's left).
- **Any agent can pick up a wave from `PREREG.md` and the JSONL alone.** A wave can be handed to Codex or Grok in its own worktree, and that agent runs its own model's cells. The diagonal (a model decoding its own encodings) is kept but reported separately from the cross-model cells, because it measures idiolect, not language.

## Stage 6 — Release 4.7.0

The package becomes 4.7.0 with render revision 4.5, Listening 1.2 plus ground 1.0, companion 1.1, synthesis 3.3 and grammar v4 (unchanged). Rebuild the atlas, presets, the zip and `SHA256SUMS`, and `field-guide.pdf`. Write a handback in the 4.6 shape (base and result commits, what changed and why, what was checked, what wasn't, open questions). Edgar uploads the package to claude.ai. Only then do the Stage 5 platform-conformance runs mean anything there.

**After the release, to talk through with Edgar (his request, 5 October):** making Field a Claude plugin; what distinguishes a skill or a project from a plugin; the eval that says whether it is ready; and the process for adding it to the Claude directory, if that is appropriate. Nothing here is decided or started.

---

## Order at a glance

| Stage | Depends on | Effort | Needs Edgar |
| --- | --- | --- | --- |
| 0 Baseline and reach | — | normal | — |
| 1 Removal | — | normal | — (decided) |
| 2 A way to measure "reads at a glance" | 0 | high | the 10-minute blind sheet |
| 3 Visual synthesis | 2's baseline | **max** | blind sheet again; watch a transition |
| 4a Portrait 1.2 | — | **max** | listen |
| 4b Ground | — | **max** | **the three-hour gate** |
| 4c–4d Directional cues and bridge | the 4b gate | **max** | the cue blind sheet; a live week |
| 5 Cross-agent | 2's harness | high (pilot), then waves | — (decided) |
| 6 Release | 1, 3, 4a at least | normal | uploading to claude.ai |

Stages 1, 2 and 4a can run in parallel. Stage 3 waits for Stage 2's baseline. 4c waits for Edgar's gate. 4b and 5 can ship after 4.7.0 as 4.7.x if the gate or the pilot takes longer.

## Decisions

**Decided by Edgar, 4 October 2026:**
1. Other conversations may inform a field, as far as they entered this thread's thinking (Stage 1). The sentence goes, with no replacement.
2. The measurement claim stays only in `README.md:15`, for readers; every other repetition goes.
3. The dated design notes stay as they are for now.
4. The capsule's centre may fall silent, in the portrait and in the ground.
5. Real conversations for Stage 5: any, at Claude's judgement, within the exclusions listed there.
6. The pilot's budget is fine if it's run as waves that can be split over time or between agents (Stage 5).
7. The change cue is directional: "Huh.", "Hmm…", "Oh!", "Aww", "Ahh…" as bridges, not interjections (Stage 4c).
8. "Ooh" is the sixth cue, for `reach` (imagination widening).

**Decided by Edgar, 5 October 2026:**
9. `grounding` isn't intuitive to him yet, so he won't rule on how it is drawn until he has used it. The companion gets a legend to learn it by (below), and the redraw of low `grounding` proposed after sheet 2 is parked until he has.
10. The legend gives instances, not definitions. Reading the legend and the scripted study, he felt a tension between saying something general, the limits of analogy included, and the specifics a person's intuition needs, and his instinct was to define the terms. What was agreed, in four rules:
    1. An instance is the kind of conversation that would be drawn that way. It sits under the comparison pictures at the ends of a line's scale, and never on the line that reads the field in view.
    2. On a live field an instance speaks of conversations in general, never as "I". First person belongs only to the scripted study, which has an authored story to tell. A live field's author says nothing in words, and the legend must not say it for them.
    3. Each line gets at least two, one at each end of its scale, so that no single example hardens into the meaning of the term.
    4. When ruling on how anything is drawn: look first with the panel closed, and view both candidates under the same legend. A legend teaches whichever drawing it sits beside, so what is already drawn will tend to feel right.

    The artwork stays wordless, and the grammar and both renderers are untouched. Not decided, and not built: grouping the legend by the composition score's six questions instead of by control.

**The companion's legend (5 October).** "Read this field" is a panel under the picture on `companion.html`, closed until asked for (`companion.html#reading` opens it). It reads the field in view in the picture's own order: first look (colour, climate, form, openness, breadth, folding, pull, light, softness), then second look (pressure, threads, a second current, what remains, met or reconstructed, gesture). Each line shows where the field sits on that channel, with the moment before marked, and says it in the grammar's words. Opening a line draws this same field with only that one control low, as it is, and high. The `grounding` line also shows the coverage record it answers to, a sweep of 1, .6 and .3, and low softness beside low grounding. "Show me in the picture" dims the field and lights one mark alone. A line at the top says what moved since the moment before. It is `docs/site/reading.mjs`; neither renderer changed, and `check_companion_browser.mjs` covers it.

**Instances and the study's story (5 October, decision 10).** The legend described the drawing in the drawing's words and said what each thing isn't (eight of its fifteen lines carry a "not…"); it gave the limits of the analogy without the analogy. Now an opened line shows, under the picture at each end of its scale, "For instance:" and one sentence about a conversation: `EG` in `reading.mjs`, 32 in all. Their wording follows the composition score and the synthesis procedure, which authors already answer (the three forms are the score's own "gathering and sheltering", "reaching and moving", "arching around a difficult open center"), so readers and writers keep one language. Colour has no scale and gets one, under the palette. Form gets three. Pull gained a balanced picture so that its two ends are none and strong, and keeps its two directions as a second strip. `Met or reconstructed` gets four: under met and .3, and under each of "unsure of the shape" and "sure of the shape, not met". Stretch and flow stay "posture, with no fixed meaning". On narrow screens each comparison picture takes a row with its words beside it, so nothing is cut off.

The scripted study now has the conversation's side: each moment in `companion-studies.mjs` carries a short story in the assistant's words, shown at the top of the legend, and the lines it accounts for carry "In this study: the reservation." The story is passed to the legend only when an update's source is `scripted`; the browser check publishes a live expression whose sequence number matches a study moment and fails if it borrows the story. The wording of all of it is a first draft for Edgar to mark up.

Nothing is waiting on Edgar before work starts. The rest of what he does is in the order table: blind sheets, the three-hour gate, a live week, and uploading the package to claude.ai.

*Housekeeping:* `docs/plan-4.7/` holds 1.3 MB of comparison PNGs. Because `docs/` is served by GitHub Pages, they'd go live if this branch merges as it is. Move them or drop them before the merge.
