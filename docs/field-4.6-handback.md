# Handback — Field 4.6.0 (expression experiment)

**Base:** `005dbae` (release 4.5.1), branch `field-4.5` — untouched, still the comparison baseline.
**This work:** branch `field-4.6-expression`. Nothing on `main` or `field-4.5` was changed.
**Date:** 25 September 2026.

Run `git diff field-4.5..field-4.6-expression` for the full change. The reasoning
behind each decision is in [the 4.6 design note](field-4.6-design.md).

## What changed and why

**1. Rendering revision 4.4 — the contrast budget.** In 4.3, measurement showed
that the controls carrying the composition score's richest questions drew almost
nothing: `complexity` changed 0.0% of pixels, `gesture_strength` 0.4%,
`counterpoint` 1.0%, while the silhouette controls changed 9–18%. The single
cause was that every semantic mark was drawn as a low-alpha variation of the
field's own color, inside the field's own body, blurred by the same filter.
Those marks are now modelled rather than tinted: the countercurrent carries its
own light and contact shadow and parts above the shoulder light, fine structure
is crest-and-trough relief scaled to the surface carrying it, the retained ridge
is displaced further into withdrawn desaturated material, and tension gains a
visible seat of compression. Every control keeps its meaning, range and default.
Fields drawn by 4.3 remain comparable and need no translation.

**2. `grounding` — a new control, 0..1, default 1.** How much of a reading rests
on material actually present rather than reconstructed or inferred. Below 1 the
outer depth opens into reticulation: the material thins, light withdraws to
where substance remains, and the section ribs and held contour stay sharp. Form
described exactly, matter absent. It is deliberately independent of
`definition` — *I did not touch this* versus *I am not sure what shape it is* —
and the check suite asserts the two do not look alike. In sound, an inferred
voice loses its fundamental and keeps the rim and air that describe it; the
capsule's centre is never described this way.

**3. The continuity study, rebuilt.** It now holds the violet mantle almost
still on purpose and carries its narrative through the repaired channels. The
demo copy on `companion.html` was rewritten to match what it actually does.

**4. Listening 1.1.** Voices release before the next entry (measured polyphony
fell from 8–13 continuous to roughly 5–9 with real dips), the centre breathes
across the phrase rather than holding flat, and the room is drier.

**5. Checks that test the right property.** `check_audio.mjs` proved its studies
distinct by asserting SHA-256 hashes differed — a difference in the tenth
decimal passed. It now also compares a loudness-and-brightness fingerprint and
asserts every pair is far enough apart to tell by ear. `check_expression.mjs`
is new: it renders each control's low and high value through a real browser and
asserts the result still reads at 320 pixels.

## What was verified

| Check | Result |
| --- | --- |
| `python3 scripts/check_browser_renderer.py` | 26 cases pass (4 new, incl. randomized `grounding`) |
| `node scripts/check_audio.mjs` | passes; closest study pair 0.268 against a floor of 0.20; grounding distance 0.784 |
| `node scripts/check_continuity.mjs` | passes, unchanged |
| `CHROME_BIN=… node scripts/check_expression.mjs` | passes; every channel reads at 320px |
| `python3 scripts/build_public_assets.py` | 7 studies, hero, social card, `field-4.6.0.zip` |
| By eye | six existing studies re-rendered and compared; grounding range; playground and companion in Chrome |

**`check_expression.mjs` fails on revision 4.3**, on `complexity` and
`gesture_strength`. That is the point of adding it: structural parity cannot
notice a channel that has gone silent, and 4.3 passed every check it had.

## What I could not do

- **I could not hear any of the audio.** Every audio claim here comes from
  numeric analysis of rendered PCM plus reading `compose()`. Listening 1.1 needs
  your ears before it is trusted; 4.5.1 audio is on `field-4.5` for A/B.
- **I could not run `check_companion_browser.mjs`.** It uses Chrome's
  `--remote-debugging-pipe`, which does not survive this WSL-to-Windows
  boundary. Not a regression, but it has not run against these changes — please
  run it on Linux before any release.
- **I could not watch a live transition.** I compared the five endpoint
  compositions rendered through the real `compositionSVG`, not the interpolation
  between them. `movement.mjs` tweens by matching element structure, and
  revision 4.4 adds elements (`#field-reticulation`, `#field-strain`, paired
  filaments) — they carry ids or stable positions and should tween or fade
  correctly, but **this is the one thing most worth watching first.**
- **I could not test native publishing** from a real conversation.

## Open questions

1. **Does Listening 1.1 sound better or merely thinner?** I opened the texture
   by measurement. Only you can say whether it kept what you found moving.
2. **Is palette too quiet in the music?** On the fingerprint, `form` separates
   two compositions three to six times more than the palette does, and
   `complexity`, `history` and `counterpoint` barely separate them at all — the
   same imbalance the renderer had, with the meaning-bearing axis the quietest.
   The fingerprint under-weights timbre, so confirm by ear before changing the
   synthesis.
3. **Should the piece have real silence?** It still has none: the centre and
   atmosphere sound throughout. Giving it rests means letting the centre fall
   silent, which is a decision about the capsule's audible identity.
4. **Is `grounding` the right shape for epistemic texture?** It currently
   reticulates from the outer depth inward. An alternative is to tie it to the
   field's own light rather than its depth. It also has no way to say *which*
   part of a reading is inferred, only how much — which may be correct, since
   spatializing it would edge toward the chronological diagrams the grammar
   forbids.
5. **Do the regression floors in `check_expression.mjs` hold across platforms?**
   They carry roughly 40% headroom against this machine's Chrome. A different
   version's antialiasing may move them.
6. **Two experiments from the review remain open**, and both need people rather
   than code: fields from conversations with identical endings and different
   middles, to test whether whole-conversation accumulation reaches a viewer at
   all; and the same conversation given to two models, to test whether this is a
   language or one model's idiolect.

## Housekeeping

- `PACKAGE_VERSION` is now `4.6.0`; `field-4.6.0.zip` is built and checksummed.
  `field-4.5.1.zip` is untouched. Version strings across the site were bumped.
- `references/reference-controls.json` gains a seventh study, `described`
  (high definition, low grounding — a precise reading of material not met).
  `presets.mjs` and the atlas are generated from it; both were rebuilt.
- No local service is left running, no `.field/` data was created, and no new
  dependency was added. Python and Node standard libraries only.
- The published 4.5.1 site is unaffected until this branch is merged.
