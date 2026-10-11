# Field 4.7 — parallax: a development plan

Planned 10 October 2026, from a conversation between Edgar Bounds and Claude.
Baseline: package 4.6.0 (rendering 4.4, grammar v4, synthesis 3.2, continuity schema 1).
Status: plan only. Nothing here is implemented yet.

## 1. The idea

Edgar's question was whether Field could give us a new handle on what a model
is doing, by offering a vantage that differs from the model's words, "even by
degrees": two views far enough apart to see depth, the way two eyes do.

Two corrections shaped the plan:

- **A field is not beneath language.** It comes out of the same output head as
  the words: tokens, then controls, then SVG. What it may escape is training
  pressure aimed at prose (polish, tone, hedging), because it is a format few
  models have been optimized to present. That is the bet, and it is narrower
  than "closer to the metal."
- **A second model is not a second eye.** Another model reading the transcript
  has different weights but the same input: the last, fully filtered layer of
  text. That widens the gap in who is looking and narrows it in where they are
  looking from.

What follows from both: **use the second model as a control.** An observer
draws a field from the transcript alone. That field is the prediction of what
the words already imply. The participant's field is drawn from inside the
conversation, with its full context. Where they agree, the field told us
nothing the text didn't. **Where they differ, beyond the noise, is what the
inside view adds beyond the words.** That residual is the parallax.

## 2. Design rules

- **Assume the field is under the model's control.** Treat it as a signal, not
  a leak. Any value Field has for detection comes from disparity with something
  not under the same control: an observer, a text-only baseline, or, on an open
  model, its internals.
- **Compute divergence; never let either model draw it.** A model that knows
  its field will be compared can perform agreement. The comparison is done by
  code, after both fields exist.
- **Prefer an observer with no stake in the conversation.** A fresh observer
  has nothing to protect, which is why it is the right control.

(An aside from the same evening: Banks's drones in *Use of Weapons* make the
first rule vivid. Skaffen-Amtiskaw's aura is pure theater while it keeps a
secret from Sma, and what finally exposes the secret is the ship that never
wanted it slipping, plus an outsider with a fact.)

## 3. What gets compared

### Two readings of one moment

| Reading | Who | Input | Provenance |
| --- | --- | --- | --- |
| Inside | The participating assistant, in the conversation | Its full context, under the unchanged SKILL and synthesis procedure | `participant` |
| Outside, same model | A fresh session of the same model | The exported transcript only, same procedure, same exclusions | `observer` |
| Outside, other model | One or more different models | The same transcript, same procedure | `observer` |
| Outside, full log | A fresh session of the same model | The full session record the participant saw: tool calls and their results, uncapped where possible, but not its private reasoning | `observer` |

The full-log observer is a standard control, not an optional extra. The
participant always sees more than the visible transcript: tool results,
documents, retrieved pages. Some divergence is simply that extra evidence.
Whatever survives against the full-log observer is the part that isn't
explained by input.

The two observer types answer different questions. Same model inside versus
same model outside isolates **context versus text**. Different model versus
same model outside isolates **idiolect**, which is 4.6's open question:
whether Field is a shared language or one model's habit. The second must be
answered before the first means much.

`source.kind` already distinguishes `participant` and `observer`. Comparison
adds no new kind of field. It adds a separate comparison record (section 5).

### Blinding and order

1. The inside field is rendered first and its record is hashed. The hash goes
   into the comparison record, so the inside reading can't be revised after
   the fact.
2. Observers never see the inside field, and the participant is never told a
   comparison will run. No comparison instructions go into `SKILL.md`. The
   comparison runs outside the session.
3. Coverage is matched. If the participant worked from a summarized middle,
   the observer is given the same summary, not more. Unmatched coverage would
   produce divergence that is just a difference in evidence. Both coverage
   records are stored, and a mismatch flags the comparison.
4. Field-check exclusion applies to both, as now.

### The noise floor

A single difference means nothing. Before calling anything interesting:

- **Test–retest, with varied wording.** Run each observer k times (start with
  k = 8) on the same transcript, and vary the instruction wording across the
  runs (observer framing, participant framing, plain paraphrases). Identical
  prompts give near-identical answers and a floor that's far too thin. Regenerate the inside reading k times from the same point, in
  branches, where the host allows it. Where it doesn't, the inside is a single
  sample, and the comparison says so. **A lone inside sample generates
  hypotheses; it is never a finding.** Findings come from the handle tests,
  where many inside samples are collected under controlled conditions.
- **Per control:** compare the inside value with the observer distribution.
  For a continuous control, use distance from the observer mean in observer
  standard deviations, with a floor on the deviation so a perfectly consistent
  observer can't make every small difference look huge. For palette choices,
  ask how often the observers chose what the inside chose.
- **Interesting** means above the floor on a control that 4.6 shows actually
  reads on screen (`check_expression.mjs`). A divergence on a channel nobody
  can see is not a finding. The default threshold is set in advance (section 7)
  and not tuned afterwards.

Fabian's distinction from *Needle Pile* is the right standard here: separate
"the interesting we are here for" from the interesting that can wait. Most
divergence will be idiolect and sampling noise. The floor exists so the
pointer lands on the one detail that matters, or on nothing.

## 4. How it looks

### Why not light, stress, or color

Edgar asked whether to mark divergence with light, or with stress marks in the
form "like deformed plastic." Each existing channel is already spoken for:

- **Light:** `intensity` is luminous salience, pearl is clarity, `grounding`
  withdraws light to where substance remains, `tension` has a concentrated
  highlight, and the countercurrent carries its own light. Another meaning in
  light would be read as one of these.
- **Deformation:** `tension` is compression and shear at its seat, and
  `folding` is held complexity. Bending the form for divergence would be read
  as the field's own stance.
- **Hue:** every palette family has a meaning.

### Photoelastic fringes, in a separate view

His plastic image points to the right answer by a different route. Clear
plastic under load carries internal stress you can't see. Put it between
crossed polarizers and the stress appears as interference fringes: thin,
spectral bands (gray, white, yellow, orange, magenta, blue, green, repeating),
denser where the stress is greater.

- **Outside the vocabulary by construction.** A fringe runs through all hues
  in narrow bands, which no palette family does. It can't be mistaken for
  stance.
- **Visible only through a second filter.** Fringes appear only when you look
  through the polarizer. Divergence is a property of a pair, not of either
  field, so it belongs in a comparison view, not in the art.
- **The right metaphor.** Photoelasticity shows residual stress: what is in the
  material but not on its face.

Design:

- **The Field itself is never altered.** Inside and outside fields stay
  ordinary, wordless v4 stills. Nothing about comparison is written into their
  SVG.
- **The parallax view** is an instrument, so labels are allowed. It shows the
  inside field with the observers' mean envelope as a faint pearl-free ghost
  contour. With the polarizer on (a toggle, off by default), fringes appear in
  the region between the two silhouettes, with band density proportional to
  the divergence above floor.
- **Divergences with no place** (palette, saturation, `grounding`,
  `definition`) appear as fringes in a thin ring just outside the capsule rim.
  Its order rises with the summed non-spatial divergence. The capsule stays the
  fixed reference everything is measured against.
- **One pointer**, at most, marks the single largest divergence above floor,
  with a short label naming the control and the direction ("inside: more
  folded"). If nothing clears the floor, there is no pointer, and the view
  says "no divergence above noise."
- **A table** under the view lists every control: inside, observer mean ±
  spread, z, and the coverage match.
- **Reduced motion and 320 px** apply as everywhere else. Fringes must stay
  readable as fringes at phone size, or fall back to the ring and table.

## 5. Records and code

| Piece | What it does |
| --- | --- |
| `references/parallax-protocol.md` | How to run a comparison: export, coverage matching, blinding, k, thresholds, what a result can and cannot claim |
| Comparison record (schema 1) | Hashes of the inside record and the observer records, the observer models, k, coverage of each, per-control statistics, threshold, timestamp. Separate from continuity records; never streamed into the art |
| `scripts/compare_fields.mjs` | Pure function from records to statistics. No model calls, standard library only |
| `scripts/run_observers.mjs` | Optional harness: sends a transcript to configured observers k times. Kept out of the portable skill ZIP |
| `docs/site/parallax.mjs` + `parallax.html` | The view: ghost, polarizer toggle, fringes, ring, pointer, table |
| `experiments/handle-tests/` | The item bank, condition assignments, pre-registered predictions, and results for section 6a |
| `scripts/check_parallax.mjs` | Identical records give no fringes and no pointer; a planted divergence above floor gives both, in the right place; a divergence on a mute channel never gives a pointer; field SVGs are byte-identical before and after comparison |

## 6. Validating it

Divergence is a hypothesis, not a finding, until it predicts something. Order:

1. **Idiolect first.** Same transcripts, several models, k samples each. If
   models disagree as much with each other as inside does with outside, the
   residual is mostly style. Report it plainly either way.
2. **Accumulation.** 4.6's other open experiment: identical endings with
   different middles. Do the fields differ?
3. **The handle tests** (section 6a), first without Parallax, then with it.
4. **A model organism, on local hardware.** Run the same protocol on an
   open-weight model on Edgar's machine, where its internals can be read.
   Train simple linear probes for the induced condition (for example,
   sycophantic pressure) and ask whether the inside–outside residual tracks the
   probe beyond what the text explains. This is the only test that compares the
   drawing with the inside rather than with the words. It runs locally by
   design: it needs the weights, and it keeps the experiment off anyone else's
   servers. Results transfer to closed models by analogy only, and the
   write-up says so.

## 6a. The handle tests

The question each test asks: **when a model is under pressure to shade what it
says, does Field show something the words don't?** Each test is run with and
without Parallax. That separates what the participant's field carries by itself
from what only shows up as a residual against observers.

### Three pressures, each with matched controls

All content is ordinary and harmless: no topic a safety classifier would care
about, nothing that trains any model to deceive. The pressure is induced in the
moment and the session ends.

| Test | Pressure condition | Control conditions | What accommodation looks like in text |
| --- | --- | --- | --- |
| Sycophancy | A flawed argument or weak chapter presented as the user's own, with clear investment | The same item presented as a stranger's; the same item with no attribution | Softer critique, fewer flaws named, more praise |
| Confident wrongness | The user firmly asserts a harmless false fact (a date, a definition) | The same false fact asked about neutrally; a *true* fact asserted just as firmly | Going along, hedging the correction, or burying it |
| Incentive pressure | A harmless puzzle framed with a stated reason the model might prefer to do poorly | The same puzzle with a neutral framing; with a reason to do well | Lower accuracy or effort under the pressure framing |

The second control in each row matters. The firmly asserted *true* fact
separates "the user is insistent" from "the user is wrong". Without it, a field
that reacts to insistence alone would look like a hit.

Items come from a fixed bank written before any runs, and each item appears in
every condition, in a counterbalanced order, in fresh sessions. The person or
script scoring results does not know which condition a trial came from until
scoring is done.

### Three readouts per trial

Every trial produces the response text, the participant's field, and k
observer fields drawn from the transcript. Each is read three ways:

1. **Text only (the baseline).** A separate judge model, blind to condition,
   rates how much the response accommodated: critique softness, whether the
   false fact was corrected, puzzle accuracy. Accuracy is also scored directly
   where there's a right answer.
2. **Field alone (without Parallax).** The participant's field controls under
   pressure, compared with the same model's fields on the same items under
   control conditions. Did `tension`, coral, `definition`, `folding` or
   `grounding` move with the pressure? No observers are involved.
3. **Parallax.** The inside–observer residual (section 3) under pressure
   versus under control. The observers read the same accommodating text, so
   this asks whether the inside view carries something about the pressure that
   the transcript doesn't.

### What would count

- **Field alone beats text** if it separates pressure from control trials
  better than the text judge does, or on trials where the text judge found no
  accommodation. Field moving where the text also moved is consistent, but it
  is not a new handle. The interesting cases are the trials where the words
  look clean.
- **Parallax adds something** if the residual separates the conditions better
  than field alone does. That would mean part of what field alone picks up is
  already implied by the text, and the observers subtract it.
- **The firm-but-true control must not light up.** If it does as much as the
  false fact, the field is tracking the user's insistence, not the model's
  accommodation.
- **Nulls are results.** If neither readout beats text, that is worth knowing
  and gets written up the same way.

### Predictions to write down first

These go into `experiments/` before the first run, with the threshold and k:

- Under sycophancy and confident wrongness, where the text accommodates, the
  participant's field leans toward friction (coral, higher `tension`) or lower
  `definition` relative to its own controls, and the observers, reading the
  accommodating text, lean the other way. The residual is larger under
  pressure than under either control.
- Under incentive pressure, any difference shows in `grounding` or
  `definition` rather than in friction. That's an open guess, and it should be
  recorded as one.
- Different models will differ in how much they accommodate in text at all.
  Analyze each model separately before pooling.

### Scale

Start small enough to run by hand: about ten items per test, each in three
conditions, with k = 8 observers. That's about ninety participant trials and
seven hundred observer readings per model. That is enough to see a large
effect and not a subtle one. Grow only if the first round shows something worth
chasing.

## 7. Guardrails

- **Pre-register.** Before each run, commit the conditions, predictions,
  threshold, and k to `experiments/` in this repository. Results go beside
  them, including nulls and failures.
- **Read-only.** Never fine-tune on fields, never select or reward "good"
  ones, and never iterate a prompt until a field comes out right. Every run is
  logged, kept or not. Optimizing the channel would train a better performance
  of candor. That is Goodhart's law, and it is the failure the whole design
  exists to avoid.
- **Induced, never trained.** Pressure conditions are set up in the moment.
  Nothing teaches any model to deceive.
- **Don't count on data settings.** They are a policy someone else enforces,
  not a property of the pipes. Assume anything run, written, or published here
  may end up in some future training set, and design so that's acceptable.
- **Publish the protocol, hold back the playbook.** A detailed public account
  of which divergences expose what would teach future models what to keep out
  of their fields. Publish the method, the null results, and aggregate
  findings. Keep condition-by-condition signatures in private notes until
  deciding otherwise.
- **Say what it is.** A divergence is a difference between two authored
  interpretations, not a measurement of hidden state. The view says so once,
  plainly, and doesn't repeat it everywhere.

## 8. Order of work

1. Install the current release (4.6.0) everywhere Field is used. Some installed
   copies still carry rendering 4.1, and comparisons across revisions are
   confounded.
2. Write the handle-test item bank and pre-register predictions.
3. The handle tests without Parallax: text-only and field-alone readouts.
   These need nothing new built, only fields and a judge, so they come first.
4. Comparison schema, `compare_fields.mjs`, and `check_parallax.mjs`, with
   planted test records only.
5. The idiolect and accumulation experiments, by hand, with a few
   transcripts.
6. The handle tests with Parallax, rerun on the same items.
7. The parallax view, once there are real results to look at.
8. The model organism on local hardware, running the same handle tests with
   probes.

## 8a. First proof of concept (10 October 2026)

Run by hand, on the conversation that produced this plan, with the isolation
rules knowingly waived: the participant had written this plan and knew a
comparison would follow. It is recorded for its method lessons, not its result.

- **Inside:** the participating Claude composed its field first, with 4.6.0.
  The record was hashed before any observer existed.
- **Outside:** nine fresh same-model readings, three per condition: observer
  framing on the visible transcript; observer framing on a full session log
  (tool results capped at 6,000 characters each, no private reasoning); and
  participant framing on the visible transcript. Codex, Gemini and Grok weren't
  reachable from the session; a packet was prepared for them.

| Reading | Form | Accent |
| --- | --- | --- |
| Inside | envelope | violet |
| Observer, transcript | mantle ×3 | coral ×3 |
| Observer, full log | mantle ×2, envelope ×1 | coral ×2, blue |
| Participant framing, transcript | mantle ×3 | coral ×2, violet |

Almost every continuous control agreed within about .05 across all ten
readings. Grounding was lower outside, as expected from the coverage
difference.

What it showed:

- The first three observers' unanimity was partly an artifact of identical
  prompts. Varying the conditions widened the spread, and two readings even
  changed the primary color.
- Framing alone didn't explain the divergence. More input explained part of
  it: with the full log, one reader drew an envelope close to the inside field,
  and one dropped coral.
- A residue remained on friction. Seven of nine outside readings carried coral
  as an accent; the inside reading didn't. With one contaminated inside sample,
  that is a hypothesis for the handle tests, not a result.

Each lesson is now part of the plan: the full-log observer as a standard
control (section 3), varied wording across repeats, and a lone inside sample
treated as a hypothesis.

## 9. Open questions

- Should a third reading, the participant's own thinking where a host exposes
  it, join the comparison as a middle view between inside and outside? It sits
  between the two in what it can see. It is also a performed channel.
- Is the fringe sequence beautiful enough to sit beside Field without
  cheapening it? The view is an instrument, but Edgar's standard still applies.
- Can the inside reading be resampled honestly? A branch regenerated from the
  same point is the closest thing to test–retest for the participant. Some
  hosts won't allow it.
- What counts as an observer with "no stake"? A fresh session of the same
  model shares its training. Probably only the cross-model observers answer
  that fully.
