# Field 4.7 — Inlay on render 4.5: a port plan

Planned 2 November 2026, from Edgar's choice of Inlay in the axes study.
Base: branch `field-4.7`, render revision 4.5 (Stage 3 of `docs/field-4.7-plan.md`).
Source: the axes study of 25 October, branch `study/axes-overnight`, `studies/axes-overnight/out/` (`REPORT.md`, `renderers/engine.py`, `renderers/A_inlay.py`, `grammar-ledger.md`).
Status: plan only. Nothing here is implemented yet.

## What Edgar decided (2 November 2026)

1. **Inlay is the next renderer, drawn on top of render 4.5,** not on 4.4. It keeps 4.5's rules: light carries colour, `definition` articulates every mark, marks are made of the field, and the reading order.
2. **Take the report's two borrowings from the Composite:** its cased core for counterpoint, and its earlier sheet, because Inlay's sheet was read as grounding.
3. **The parallax view gives way, not Inlay's tension.** Inlay keeps its stress fringes. The parallax plan drops fringes and the observers' ghost outline (`docs/field-4.7-parallax-plan.md`, amended the same day on branch `field-4.7-parallax-plan`).
4. **The echo is drawn inside the band,** never past the tip (the report's decision 4).
5. **Tension flattens only slightly, with no cavities** (decision 3).
6. **Inlay ships in 4.7.0,** as Stage 3b. The release becomes render 4.6.
7. **The surface per hue is in** (decision 5). Only its strength is open.
8. **The extra weight is accepted** (decision 7).
9. **Track B's first proposal goes in now** (decision 8): the field turns away from its resting angle only as far as `history` allows, so rotation becomes a second cue for history. It is part of v4.1 and is tested with the rest of 4.6.
10. **Edgar left the grammar wording to Claude's recommendations** (decision 2). The surface per hue adds no meaning of its own, and the grammar becomes v4.1. The wording is under "Grammar wording" below.

## Why it is a port, not a merge

The study was cut from `main` at `318ebc3`, so its engine is a superset of render 4.4 (`RENDERER_REVISION = "4.4"` in `engine.py`). `field-4.7` has render 4.5, which differs from 4.4 in colour and in how marks are made, never in geometry ("every outline is where 4.4 put it"). Three consequences:

- **Colour.** Every Inlay mark is lit with 4.4's `light()` and `pale()` (46 calls; no `tint` or `shade`). 4.5 replaced those because lightening to the old cap left blue at 36–56 % of its chroma, violet at 35–51 % and coral at 45–50 %. Drawn as they are, Inlay's marks would bring that greying back. Each mark has to be re-lit through `tint` and `shade`.
- **Detail.** Inlay adds fibres, a vein, fringe rings and the sheet. That is the kind of fine, competing detail 4.7 diagnosed in 4.6 and that `check_reading_order.mjs` now limits. Inlay has never been run against that check.
- **Evidence.** Neither the study's blind tests (Inlay on 4.4) nor Stage 3's counted run (4.5 alone) measured Inlay on 4.5. Stage 3's results certify 4.5, not what this plan would ship.

## The two borrowings, as they turn out

**The core is code that exists but has never been seen on this body.** `core_marks()` in `engine.py` draws a second current inside the material, and the strands part around it (`thread_course`). The vein keeps to the outer slope beside it (`vein_course`). The engine allows it on the 4.4 body, but the study only ever rendered it on silk and glass. It replaces 4.5's countercurrent, which just improved for taught readers: at 320 px, seen .69 with false alarms at .26, against 4.4's .61 and .31 (`results/grok-isolated-report.md`, on `field-4.7`, not yet pushed). Those numbers are its bar. The grammar keeps counterpoint's words ("an internal current that parts and rejoins"), which is the reason the report gave for borrowing it.

**The Composite's sheet is not separate code.** Both candidates draw the earlier sheet with the same code (`engine.py:651–677`), and its geometry (`sheet_lift`, `thickness`) does not depend on the body. The difference the words-only test found came from the body underneath: on silk, the withdrawn sheet read as history (5 of 5), and on 4.4's body it read as grounding's "outer depth" (4 of 5). So "take the Composite's sheet" becomes a requirement, not a lift: **on 4.5's body, the sheet must read as history, not grounding, from the grammar's words alone.** That needs design work. The first thing to try, as a hypothesis for the words-only test: the sheet is drawn paler (less chroma, less light), which is what makes it look like grounding's withdrawn matter, so draw it darker instead, keeping its chroma, as 4.5 draws its retained ridge. (4.5 drew the ridge darker for another reason: desaturating it paled the body's highlights where the ridge lies under them.) Its bar is 4.5's "held from earlier" at 320 px: seen .39, false alarms .07.

Track B gives a second thing to try (decision 9). The sheet lags behind the present surface's turn, so the angle between them is the change that still holds. It must still share the tips and rejoin, because SKILL.md says a retained trace "must remain visibly joined to the material, never become a separate object". So the sheet bends back to the tips rather than turning whole. Try darker first and this second, and test each in words only.

## The port, step by step

Cut the working branch, `field-4.7-inlay`, from `field-4.7`. The 2 November review's fixes have landed there (`6799c3b`, `6bf9911`), and none of them touched `render_field.py` or `renderer.mjs`, so 4.5 is the base as Stage 3 froze it.

1. **A switch per treatment, off by default.** As in the study's `ALLOC`, every Inlay treatment can be on or off. With all of them off, the renderer is byte-identical to 4.5 on every spec and every harness sweep. Check that after each step, as the study did against 4.4.
2. **Port the treatments into `scripts/render_field.py`,** one at a time, each re-lit through `tint` and `shade`, its edges following `definition`:

   | Treatment | Inlay's code | Replaces in 4.5 | Note |
   | --- | --- | --- | --- |
   | Surface per hue (`sheen`) | `engine.py:724–` | — | Adds a material to each hue family. |
   | Emitted light (`intensity`) | `engine.py:190–197`, `265` | intensity as opacity and width | Matter keeps its density, so a quiet field is dim but present. Keep 4.5's rule that glow is read first. |
   | Vein (`accent`) | `engine.py:878–` | the accent mark | The report's clearest win. It must still soften at low `definition`. |
   | Fibres (`complexity`) | `engine.py:839–` | threads | 4.5 lays threads under the surface's light. Keep that. |
   | Core (`counterpoint`) | `core_marks`, `core_centre`, `thread_course` | the parting countercurrent | From the Composite. The fibres part around it. |
   | Earlier sheet (`history`) | `engine.py:272–278`, `372`, `651–677` | the retained ridge | Must read as history (above). |
   | Fringes and a flattened seat (`tension`) | `engine.py:785–806`, `thickness` | the denser seat | Kept, by decision 3. |
   | Structural gestures | `engine.py:899–` | strand gestures | Braid as two strands, fold as a tucked lip. The echo stays 4.5's, inside the band (decision 4). |

3. **The report's fixes before anything ships:**
   - Taper the sheet's thin outer edge into both tips. Gemini saw it stop mid-curve as a loose wire.
   - The echo goes inside the band (Edgar's decision 4). Every critic shown Inlay's echo past the tip saw a second cusp. Trial C of the Zero Hour curl (axes clone, `out/trials/zero-hour-curl/`, committed `7fda385`) is exactly this: Inlay with its gesture allocation set back to 4.4's, and Zero Hour's gesture is the echo, which 4.4 drew inside the band. Here that means 4.5's echo, with Inlay's braid and fold.
   - Tension flattens only slightly, with no cavities (Edgar's decision 3). Inlay already does this: at full tension its seat narrows the band by at most 5 % (`thickness`), where 4.4 pinched it by 18 %. The outline is never dented. Fringes don't stop tension and folding being swapped, and no renderer did; Parallax counts them as one channel.
   - Grounding's ribs are **not** on this list. The critics saw 4.4's ribs, and 4.5's are already different. Redrawing low `grounding` is parked under the 4.7 plan's decision 9 until Edgar has lived with the companion's legend.
4. **Browser port** in `docs/site/renderer.mjs` (the report's estimate: about 250 lines for Inlay, more with the core). Then `check_browser_renderer.py`: its 26 cases, plus the 400 random ones once by hand.
5. **Motion.** Fibres, fringe rings and braid crossings change in number as their controls move, so each needs a stable `id` for `movement.mjs` to fade them in and out. The report suggests the earlier sheet in motion be the previous expression's real contour, which the companion already samples. That is a good later step, not part of this port.
6. **Grammar wording,** following `grammar-ledger.md`. With the core, counterpoint keeps its words. What changes:
   - `flow` turns the field only as far as `history` allows (Track B);
   - history gains "behind the present surface";
   - tension's "contour" becomes "surface", since the outline now only flattens slightly;
   - the colour table gains a sentence giving each hue family a surface;
   - the manual route's gesture limits ("at most four SVG paths…") are revised, since the braid uses about a dozen filled paths.

   Ranges and defaults are unchanged, and so is every meaning except `flow`'s. The wording is below, under "Grammar wording (v4.1)". It becomes grammar v4.1. Rebuild the template and the atlas, since taught readers are shown the atlas of the revision they read. **Freeze the wording before any counted run.** The parallax plan's handle tests also wait on it, because models choose their controls from these words.
7. **Track B, the turn.** Rotation becomes `turn = −18° + 38° · flow · history`, in `render_field.py` (the field at line 183, the atmosphere's ellipse at 362) and in `renderer.mjs` (101 and 234). A field with no retained change sits at its resting angle. The companion's legend (`reading.mjs`) stops calling `flow` "posture, with no fixed meaning". `movement.mjs` already eases rotation between expressions.
   - **What it costs:** any field re-rendered with `flow` set and `history` at 0 sits at rest. Among the reference studies, `strained` (flow −.35) and `playful` (.65) go back to rest, and `exploring` (.45, history .2) turns about 3° instead of 17°. So did two of the three real conversations in the axes study. Saved SVGs don't change.
8. **Name it render revision 4.6**, following the pattern so far: package 4.6 drew render 4.4, and 4.7 draws 4.5.

## Acceptance

**Machine checks: Stage 3's, unchanged.**
- `check_expression.mjs` floors.
- `check_reading_order.mjs`: fine detail rises with `definition`, stays under 4.3's at `definition` ≤ .2, and `tentative` never carries more line than `gathered`.
- Chroma at least 4.3's.
- The share of near-white crests.
- `check_browser_renderer.py`, `check_continuity.mjs`, `check_audio.mjs`, `check_companion_browser.mjs` and `check_public_site.mjs`.

**Two more, from the study:**
- comparable at zero: the frame difference from 4.5 with every quiet control at 0 and `flow` at 0, reported against one `intensity` sweep. The turn is reported on its own, since Track B moves every field that has `flow` set and `history` at 0;
- the loudness and similarity measures, against 4.5. Counterpoint and accent must stay apart, and intensity and grounding decoupled.

**Readers.** Pre-register in `scripts/xagent/PREREG.md` first. Pilot uncounted, then count:
- **Taught decoders, against 4.5, by Stage 3's rule** (a channel more than 15 points under on seen minus false alarms is a regression), with two passes of the probes. The second current and "held from earlier" are the channels at risk.
- **Words only**, as in the study's second condition: every channel Inlay redraws, and the sheet above all (history, not grounding).
- **Real fields.** On busy real fields, all five candidates scored below 4.4 (Inlay 42 of 48 pairs, 4.4 45). That is within noise for any one candidate, but it is the likeliest cost of the approach: marks made part of one material blend into a busy base. Run more pairs than 48, against 4.5.
- **Naive decoders and pairs:** no regression against 4.5, and side by side on "faster" and "keep looking".
- **Edgar's sheet 3:** Inlay beside 4.5, in both orders.

The harness needs the new revision added, as it was for 4.5 (`5707cc7`). Since the 2 November fixes, a trial counts only on the images its revision draws now, so a renderer re-pinned mid-run has its earlier answers asked again, and `report.py` leaves them out and counts them.

The bars above come from the report of record. Edgar ruled on 2 November that the October Claude and Codex rows count (`PREREG.md`), so the bars stand as written.

## Release: Inlay in 4.7.0 (Edgar, 2 November)

The package becomes 4.7.0 with render revision 4.6 and grammar v4.1. Before release it adds this port, the counted runs above and sheet 3. Stage 5's cross-agent study runs once, on what ships, and the parallax handle tests wait for 4.7.0. The release already waits on Stage 4a (Listening 1.2), which isn't built on `field-4.7`, and the port can run alongside it. Stage 6 in `docs/field-4.7-plan.md` says so as of the same day.

## Still open

- **Freeze the grammar wording** (below) before any counted run, after checking it against the port as drawn.
- **How strong the surface per hue is.** The study's stronger version, tried after the freeze, separated blue from violet more (4.9 against 4.3).
- **The sheet's design** on 4.5's body, so that it reads as history and not as grounding: darker first, then the lagging sheet.
- **Weight** is accepted, but measure the SVGs again on 4.5. The study's were about a third heavier than 4.4's (up to 660 KB against 428).

Grounding's ribs (decision 6) wait on the 4.7 plan's decision 9. Track B's other two proposals (the pull toward the seat of tension, and stretch from the form) stay out.

## Grammar wording (v4.1)

Edgar left this to Claude's recommendations (2 November). Every change is in `references/visual-grammar.md`. `SKILL.md` mentions "retained history", "a joined countercurrent" and "a retained trace or a countercurrent must remain visibly joined to the material" (steps 2 and 4). Those still fit the sheet and the core, so it doesn't change. `composition-score.md` doesn't describe the pictures.

**Colour table.** Add after the table:

> Each hue family also has a surface of its own, as Listening gives each a timbre: blue is crisp and clear, violet pearlescent, amber soft, coral satin, pearl luminous, and teal the plain surface. The surface belongs to the hue's meaning and adds none of its own; it gives neighbouring hues, blue and violet above all, a second way to be told apart.

Why "adds none": the colour table is a table of meanings, and a second meaning per hue would change how models choose colour, which this release doesn't intend. The surfaces were chosen to suit the meanings they sit under (blue's precision is crisp, amber's warmth is soft), so they add nothing that needs saying.

**Controls.** Three rows change:

| Control | Now | v4.1 |
| --- | --- | --- |
| `flow` | Rotates the field's orientation coherently around the fixed body. Direction has no fixed topic or emotional label. | Rotates the field's orientation coherently around the fixed body, **but only as far as `history` allows: a field with no retained change sits at its resting angle, and the turn shows how far an earlier change still holds it.** Direction has no fixed topic or emotional label. |
| `tension` | Supple contour to strong local compression and shear; unresolved pressure. | Supple **surface** to strong local compression and shear; unresolved pressure. |
| `history` | A restrained, displaced reflection that rejoins the surface. Retained influence of an earlier change, not a timeline. | A restrained, displaced reflection **behind the present surface** that rejoins it. Retained influence of an earlier change, not a timeline. |

`counterpoint` ("An internal current that parts and rejoins"), `complexity`, `accent`, `intensity`, `stretch`, `imbalance` and `gesture` keep their words.

**Distinctive gestures.** After "made from at most four SVG paths", add:

> These limits are for gestures added by hand; the renderer's own fold, echo and braid may use more.

**Rendering.** A new paragraph after revision 4.5's two:

> Rendering revision 4.6 keeps every control's range and default, and every meaning but one: a field now turns away from its resting angle only as far as `history` holds an earlier change, so a field with nothing retained sits at rest. It keeps the three rules of 4.5, and gives each quiet meaning a material phenomenon of its own within the one smoothly curved form, with no cuts, notches, or cavities. `intensity` is emitted light: a quiet field is dim but present, never thinned. `counterpoint` is a core running inside the material, in its own hue as in 4.5 (the accent, or the secondary when there is no accent); the fibres part around it and rejoin at both tips. `history` is an earlier sheet, older material in the same hues, standing just behind the present surface and sharing its tips. `tension` gathers light into fringes at its seat, where the surface flattens slightly; the outline is never dented. `complexity` sets how many fibres the material carries. An accent is a vein, a winding line through the material whose sharpness follows `definition`. A fold is a tucked lip and a braid two strands; an echo is a continuation drawn inside the band, never past the tip. Each hue family has its own surface (see the colour table).

**The paragraph after it** becomes: "The SVG root records `data-field-renderer="4.6"`; `field-spec` stores the v4 drawing controls. Fields drawn by 4.3, 4.4 or 4.5 remain comparable in meaning and their controls need no translation. Re-rendered under 4.6, one with `flow` set and `history` at 0 sits at its resting angle."

**The name.** v4.1, because the meanings table changes. Revisions 4.4 and 4.5 only added rendering text and kept v4. The control set, the ranges and the defaults don't change and old specs need no translation, so `data-field-version` stays 4.

The rendering paragraph is written to fit either design of the sheet ("older material in the same hues" holds whether it ends up darker or lags the turn). It is checked against the port as drawn before it is frozen.
