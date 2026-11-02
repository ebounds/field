# Field 4.7 — Inlay on render 4.5: a port plan

Planned 2 November 2026, from Edgar's choice of Inlay in the axes study.
Base: branch `field-4.7`, render revision 4.5 (Stage 3 of `docs/field-4.7-plan.md`).
Source: the axes study of 25 October, branch `study/axes-overnight`, `studies/axes-overnight/out/` (`REPORT.md`, `renderers/engine.py`, `renderers/A_inlay.py`, `grammar-ledger.md`).
Status: plan only. Nothing here is implemented yet.

## What Edgar decided (2 November 2026)

1. **Inlay is the next renderer, drawn on top of render 4.5,** not on 4.4. It keeps 4.5's rules: light carries colour, `definition` articulates every mark, marks are made of the field, and the reading order.
2. **Take the report's two borrowings from the Composite:** its cased core for counterpoint, and its earlier sheet, because Inlay's sheet was read as grounding.
3. **The parallax view gives way, not Inlay's tension.** Inlay keeps its stress fringes. The parallax plan drops fringes and the observers' ghost outline (`docs/field-4.7-parallax-plan.md`, amended the same day on branch `field-4.7-parallax-plan`).

## Why it is a port, not a merge

The study was cut from `main` at `318ebc3`, so its engine is a superset of render 4.4 (`RENDERER_REVISION = "4.4"` in `engine.py`). `field-4.7` has render 4.5, which differs from 4.4 in colour and in how marks are made, never in geometry ("every outline is where 4.4 put it"). Three consequences:

- **Colour.** Every Inlay mark is lit with 4.4's `light()` and `pale()` (46 calls; no `tint` or `shade`). 4.5 replaced those because lightening to the old cap left blue at 36–56 % of its chroma, violet at 35–51 % and coral at 45–50 %. Drawn as they are, Inlay's marks would bring that greying back. Each mark has to be re-lit through `tint` and `shade`.
- **Detail.** Inlay adds fibres, a vein, fringe rings and the sheet. That is the kind of fine, competing detail 4.7 diagnosed in 4.6 and that `check_reading_order.mjs` now limits. Inlay has never been run against that check.
- **Evidence.** Neither the study's blind tests (Inlay on 4.4) nor Stage 3's counted run (4.5 alone) measured Inlay on 4.5. Stage 3's results certify 4.5, not what this plan would ship.

## The two borrowings, as they turn out

**The core is code that exists but has never been seen on this body.** `core_marks()` in `engine.py` draws a second current inside the material, and the strands part around it (`thread_course`). The vein keeps to the outer slope beside it (`vein_course`). The engine allows it on the 4.4 body, but the study only ever rendered it on silk and glass. It replaces 4.5's countercurrent, which just improved for taught readers: at 320 px, seen .69 with false alarms at .26, against 4.4's .61 and .31 (`results/grok-isolated-report.md`, on `field-4.7`, not yet pushed). Those numbers are its bar. The grammar keeps counterpoint's words ("an internal current that parts and rejoins"), which is the reason the report gave for borrowing it.

**The Composite's sheet is not separate code.** Both candidates draw the earlier sheet with the same code (`engine.py:651–677`), and its geometry (`sheet_lift`, `thickness`) does not depend on the body. The difference the words-only test found came from the body underneath: on silk, the withdrawn sheet read as history (5 of 5), and on 4.4's body it read as grounding's "outer depth" (4 of 5). So "take the Composite's sheet" becomes a requirement, not a lift: **on 4.5's body, the sheet must read as history, not grounding, from the grammar's words alone.** That needs design work. The first thing to try, as a hypothesis for the words-only test: the sheet is drawn paler (less chroma, less light), which is what makes it look like grounding's withdrawn matter, so draw it darker instead, keeping its chroma, as 4.5 draws its retained ridge. (4.5 drew the ridge darker for another reason: desaturating it paled the body's highlights where the ridge lies under them.) Its bar is 4.5's "held from earlier" at 320 px: seen .39, false alarms .07.

## The port, step by step

Cut the working branch, `field-4.7-inlay`, from `field-4.7` **after** the fixes from the 2 November review have landed there. That review covers `render_field.py` and `renderer.mjs`, which are what this port builds on.

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
   | Structural gestures | `engine.py:899–` | strand gestures | Braid as two strands, fold as a tucked lip. |

3. **The report's fixes before anything ships:**
   - Taper the sheet's thin outer edge into both tips. Gemini saw it stop mid-curve as a loose wire.
   - The echo past the tip, which every critic shown it saw as a second cusp (open: keep, move inside the band, or drop).
   - How far tension may flatten (open). Fringes don't stop tension and folding being swapped; no renderer did.
   - Grounding's ribs are **not** on this list. The critics saw 4.4's ribs, and 4.5's are already different. Redrawing low `grounding` is parked under the 4.7 plan's decision 9 until Edgar has lived with the companion's legend.
4. **Browser port** in `docs/site/renderer.mjs` (the report's estimate: about 250 lines for Inlay, more with the core). Then `check_browser_renderer.py`: its 26 cases, plus the 400 random ones once by hand.
5. **Motion.** Fibres, fringe rings and braid crossings change in number as their controls move, so each needs a stable `id` for `movement.mjs` to fade them in and out. The report suggests the earlier sheet in motion be the previous expression's real contour, which the companion already samples. That is a good later step, not part of this port.
6. **Grammar wording,** following `grammar-ledger.md`. With the core, counterpoint keeps its words. What changes:
   - history gains "behind the present surface";
   - tension's "contour" becomes "surface", since the outline now only flattens slightly;
   - the colour table gains a sentence giving each hue family a surface;
   - the manual route's gesture limits ("at most four SVG paths…") are revised, since the braid uses about a dozen filled paths.

   Meanings, ranges and defaults are unchanged. Suggested name: grammar v4.1. Rebuild the template and the atlas, since taught readers are shown the atlas of the revision they read. **Freeze the wording before any counted run.** The parallax plan's handle tests also wait on it, because models choose their controls from these words.
7. **Name it render revision 4.6**, following the pattern so far: package 4.6 drew render 4.4, and 4.7 draws 4.5.

## Acceptance

**Machine checks: Stage 3's, unchanged.**
- `check_expression.mjs` floors.
- `check_reading_order.mjs`: fine detail rises with `definition`, stays under 4.3's at `definition` ≤ .2, and `tentative` never carries more line than `gathered`.
- Chroma at least 4.3's.
- The share of near-white crests.
- `check_browser_renderer.py`, `check_continuity.mjs`, `check_audio.mjs`, `check_companion_browser.mjs` and `check_public_site.mjs`.

**Two more, from the study:**
- comparable at zero: the frame difference from 4.5 with every quiet control at 0, reported against one `intensity` sweep;
- the loudness and similarity measures, against 4.5. Counterpoint and accent must stay apart, and intensity and grounding decoupled.

**Readers.** Pre-register in `scripts/xagent/PREREG.md` first. Pilot uncounted, then count:
- **Taught decoders, against 4.5, by Stage 3's rule** (a channel more than 15 points under on seen minus false alarms is a regression), with two passes of the probes. The second current and "held from earlier" are the channels at risk.
- **Words only**, as in the study's second condition: every channel Inlay redraws, and the sheet above all (history, not grounding).
- **Real fields.** On busy real fields, all five candidates scored below 4.4 (Inlay 42 of 48 pairs, 4.4 45). That is within noise for any one candidate, but it is the likeliest cost of the approach: marks made part of one material blend into a busy base. Run more pairs than 48, against 4.5.
- **Naive decoders and pairs:** no regression against 4.5, and side by side on "faster" and "keep looking".
- **Edgar's sheet 3:** Inlay beside 4.5, in both orders.

The harness needs the new revision added, as it was for 4.5 (`5707cc7`). Its trials key by item, not by build, so a renderer re-pinned mid-run needs its trials cleared by hand (the Stage 3 note).

## Release: Edgar's call

| | Inlay in 4.7.0 (Stage 3b) | 4.7.0 as planned, Inlay in 4.8.0 |
| --- | --- | --- |
| What ships | render 4.6, grammar v4.1 | render 4.5, grammar v4 |
| What it adds before release | this port, the counted runs above, sheet 3 | nothing |
| Stage 5 (cross-agent) | runs once, on what ships | its image conditions would need rerunning on 4.8 |
| Parallax handle tests | wait for 4.7.0 | wait for 4.8.0 |

**Leaning:** Inlay in 4.7.0. The release already waits on Stage 4a (Listening 1.2), which isn't built on `field-4.7`, and the port can run alongside it. Shipping 4.5 first would mean Stage 5 and Parallax measuring a renderer that is about to be replaced. If Edgar takes this, Stage 6's line "render revision 4.5 … grammar v4 (unchanged)" in `docs/field-4.7-plan.md` changes. That file isn't edited here, because another session has it open.

## Still open

These are from the report's eight decisions for Edgar, after today:
- **The echo** (decision 4) and **how far tension flattens** (decision 3). Both are needed before the port's renderer freezes.
- **How strong the surface per hue is** (decision 5). Inlay was tested with it, so it is in; only its strength is open. The study's stronger version, tried after the freeze, separated blue from violet more (4.9 against 4.3).
- **Weight** (decision 7). The study's SVGs were about a third heavier than 4.4's (up to 660 KB against 428). Measure them again on 4.5.
- **Track B** (decision 8) stays out of this port.

Settled today: the body (decision 1, Inlay's, as 4.5 draws it). The grammar's pictures (decision 2) shrink to the small rewording above, now that the core keeps counterpoint's words. Grounding's ribs (decision 6) wait on the 4.7 plan's decision 9.
