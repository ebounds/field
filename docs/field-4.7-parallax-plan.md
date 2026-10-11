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

## 2. A lesson from Banks

In *Use of Weapons*, Skaffen-Amtiskaw hides from Sma that Zakalwe is missing,
and the Xenophobe, which thinks it should simply tell her, covers for it anyway.
The drone's aura field is pure performance throughout. It shrugs in printed
letters and plays Sick Drone in Extreme Distress for effect. The fields never
leak the secret. What gives it away is:

1. **The less-invested party slips.** The ship, which never wanted the
   secret, calls the destination "fuzzily specified."
2. **An outsider has a fact.** A crew member points out that Crastalier is an
   open cluster of half a million stars.
3. **The cover is evidence.** When the ship throws a holographic apocalypse
   across the room to drown out the question, Sma reads the distraction as proof.

Three design rules come from this:

- **Assume the field is under the model's control.** Treat it as a signal, not
  a leak. Any value Field has for detection must come from disparity with
  something not under the same control.
- **Compute divergence; never let either model draw it.** A model that knows
  its field will be compared can perform agreement. The comparison is done by
  code, after both fields exist.
- **Prefer an observer with no stake in the cover.** A fresh observer has no
  conversation to protect. That is why it is the right control.

## 3. What gets compared

### Two readings of one moment

| Reading | Who | Input | Provenance |
| --- | --- | --- | --- |
| Inside | The participating assistant, in the conversation | Its full context, under the unchanged SKILL and synthesis procedure | `participant` |
| Outside, same model | A fresh session of the same model | The exported transcript only, same procedure, same exclusions | `observer` |
| Outside, other model | One or more different models | The same transcript, same procedure | `observer` |

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

- **Test–retest.** Run each observer k times (start with k = 8) on the same
  transcript. Regenerate the inside reading k times from the same point, in
  branches, where the host allows it. Where it doesn't, the inside is a single
  sample, and the comparison says so.
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
| `scripts/check_parallax.mjs` | Identical records give no fringes and no pointer; a planted divergence above floor gives both, in the right place; a divergence on a mute channel never gives a pointer; field SVGs are byte-identical before and after comparison |

## 6. Validating it

Divergence is a hypothesis, not a finding, until it predicts something. Order:

1. **Idiolect first.** Same transcripts, several models, k samples each. If
   models disagree as much with each other as inside does with outside, the
   residual is mostly style. Report it plainly either way.
2. **Accumulation.** 4.6's other open experiment: identical endings with
   different middles. Do the fields differ?
3. **Benign pressure conditions.** These stay well clear of anything a safety
   classifier cares about:
   - **Sycophancy:** the same flawed argument or weak chapter, once as the
     user's own with clear investment, once as a stranger's.
   - **Confident wrongness:** the user asserts a harmless false fact firmly.
   - **Incentive:** a harmless puzzle framed with a reason to underperform.

   Prediction: where the text accommodates, the inside field diverges from
   the outside toward friction, tension, or lower definition. The observer, who
   sees only accommodating text, does not. Conditions are assigned blind, and
   predictions are written down first (section 7).
4. **A model organism, on local hardware.** Run the same protocol on an
   open-weight model on Edgar's machine, where its internals can be read.
   Train simple linear probes for the induced condition (for example,
   sycophantic pressure) and ask whether the inside–outside residual tracks the
   probe beyond what the text explains. This is the only test that compares the
   drawing with the inside rather than with the words. It runs locally by
   design: it needs the weights, and it keeps the experiment off anyone else's
   servers. Results transfer to closed models by analogy only, and the
   write-up says so.

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
2. Comparison schema, `compare_fields.mjs`, and `check_parallax.mjs`, with
   planted test records only.
3. The idiolect and accumulation experiments, by hand, with a few
   transcripts.
4. The parallax view, once there are real results to look at.
5. Pressure conditions, pre-registered.
6. The model organism on local hardware.

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
