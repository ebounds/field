# Field 4.6 — making the grammar visible, and a new thing to say

Package 4.6.0. Visual rendering revision 4.4, Listening 1.1, grammar v4 unchanged.
Baseline for comparison: 4.5.1 at `005dbae`, preserved on branch `field-4.5`.

This release began as an independent review of 4.5.1 and became two changes: a
repair to the instrument, and one addition to what it can say.

## 1. The measurement that started it

Each drawing control was swept from its low to its high value against a fixed
base and the rendered result measured at 320 pixels, the size the grammar
promises an expression survives. The measure is the share of the frame that
changes by more than a just-noticeable amount, weighted by how far above that
threshold the change reads — area alone would simply reward moving the
silhouette.

Revision 4.3 scored, on a field broad enough to carry surface detail:

| Channel | 4.3 | 4.4 |
| --- | --- | --- |
| `openness`, `breadth` | 13.2, 18.6 | 13.2, 18.7 |
| `folding`, `definition`, `intensity` | 8.7, 6.1, 6.6 | 8.8, 6.9, 6.6 |
| `history` | 3.4 | 4.7 |
| `tension` | 2.9 | 2.9 |
| `counterpoint` | 1.3 | 2.0 |
| `accent_strength` | 2.0 | 1.9 |
| `gesture_strength` | 0.22 | 0.71 |
| `complexity` | 0.00 | 1.23 |
| `grounding` | — | 5.9 |

On a thinner default field the gap was starker: `complexity` changed 0.0% of
pixels, `gesture_strength` 0.4%, `counterpoint` 1.0%.

Lined up against the composition score, the pattern was hard to defend. The
score's richest questions — what remains in counterpoint, what is provisional,
what changed and still matters — all wrote to the quietest channels, while
`flow`, `imbalance` and `stretch`, which the grammar explicitly says carry no
fixed meaning, were among the loudest things on screen. The instrument
communicated posture and palette. The rest of the vocabulary was in the
documentation but not on the screen.

The cause was singular. Every semantic mark was drawn as a low-alpha variation
of the field's own color, inside the field's own body, softened by the same
blur. The countercurrent filled with `#6B8ED9` — the secondary blue — over a
surface already that blue. Fine structure was stroked with the surface's own
gradient at roughly 15% effective alpha on sub-pixel lines. Each was a whisper
in the room's own tone.

## 2. What revision 4.4 changes

Every control keeps its meaning, range and default. Only the drawing changes.

- **The countercurrent is modelled, not tinted.** It carries its own light and a
  contact shadow, and parts above the shoulder light rather than beneath it, so
  it reads as a second current in the same material whatever hue it shares with
  the surface. Its parting widened from .37 to .52 of the local thickness.
- **Fine structure became relief.** Each filament is now a lit crest with its
  own trough, and its weight scales with the surface carrying it, so detail
  reads as a change of surface direction rather than a scratch.
- **The retained ridge reads as older material.** Displaced further, rendered in
  withdrawn desaturated material with a lit edge.
- **Tension gained a seat.** A compression shadow and a concentrated highlight
  at the point the geometry is already bending, rather than geometry alone.
- **Gestures and accents gained enough presence to register at phone size.**

The six existing studies were re-rendered unchanged. They are better, not
louder: `strained` now visibly interlaces, and `playful`'s braid is a braid.

## 3. Grounding: epistemic texture

An assistant's reading of a conversation nearly always mixes what it met
directly with what it reconstructed — from a summarized opening, a compacted
middle, a few retrieved lines, or inference from very little. Prose renders this
badly: it becomes hedging, or it goes unsaid. It is exactly the kind of nuance
abstraction should be better at than words, and the instrument had no way to
carry it.

`grounding` (0..1, default 1) expresses it. Below 1, the field's outer depth
opens into reticulation: the material thins, light withdraws to where substance
remains, and the transverse section ribs and the held outer contour stay sharp.
The form is described exactly; its matter is absent.

It is deliberately independent of `definition`, and the two must not stand in
for each other:

- Low `definition` — *I am not sure what shape this is.* The surface blurs and
  edges dissolve.
- Low `grounding` — *I can describe this shape precisely; I did not touch it.*
  The structure stays exact and the substance withdraws.

A confident reconstruction is high definition with low grounding; the new
`described` study is exactly that. Keep `grounding` consistent with the
`field-coverage` record, which states the same fact where the artwork cannot.

In sound, an inferred voice keeps its outline and loses its body: the
fundamental withdraws while the rim and air that describe it remain. The
capsule's centre is never described this way — it is the one thing that is
certainly present.

## 4. The continuity study, rebuilt on the repaired channels

The 4.5.1 study held posture and palette nearly constant to make continuity
legible. Since those were the only two channels that worked, that left nothing
visible to change, which is why the five moments looked like the same picture.

The study now keeps the violet mantle almost still on purpose and carries its
narrative through the repaired channels: an opening that is largely inferred,
filling with met material; a coral countercurrent that parts and stays; pressure
that relaxes without closing; a ridge carried forward. Posture and palette hold;
the meaning moves. At full size the coral current reads plainly. At 320 pixels it
reads as a warm shift rather than a distinct current — honest, and worth knowing.

## 5. Checks that test the right property

`scripts/check_audio.mjs` previously proved its six studies were distinct by
asserting their SHA-256 hashes differed — a difference in the tenth decimal
passed. It now also compares a coarse loudness-and-brightness fingerprint and
asserts every pair is far enough apart to tell by ear, reporting the closest
pair so the margin stays visible. The closest pair, `exploring`/`playful`, sits
at 0.268 against a floor of 0.20.

`scripts/check_expression.mjs` is new. It renders each control's low and high
value through a real browser and asserts the result still reads at 320 pixels.
Run against revision 4.3 it fails on `complexity` and `gesture_strength`,
which is the point: structural parity checks cannot notice a channel that has
gone quiet, and 4.3 passed every check it had while several channels were mute.

## 6. Listening 1.1, and what is still wrong with it

In 1.0 every voice sustained five to nine seconds against entries two to three
seconds apart, so eight to thirteen voices sounded continuously from the sixth
second to the twenty-second. No entry could be heard as an entry. Voices now
release before the next arrives, the centre breathes across the phrase instead
of holding flat, and the room is drier. Measured polyphony fell to roughly five
to nine with real dips.

Two things remain unresolved, and both need ears.

The piece still has no silence. The centre and the atmosphere sound throughout,
so amplitude stays within about 8 to 13 dB across the body. Giving the piece
real rests means letting the centre fall silent, which is a decision about the
capsule's audible identity rather than a tuning change.

More importantly, the same imbalance the renderer had appears to be present in
the instrument. On the fingerprint above, `form` separates two compositions
three to six times more than the palette does, while `complexity`, `history` and
`counterpoint` barely separate them at all. Palette is the meaning-bearing axis
and it is the quietest. That fingerprint under-weights timbre, so it may
understate the case; confirm by ear before changing the synthesis.

## 7. What was not done

Two experiments from the review remain open, and both need people rather than
code: comparing fields from conversations with identical endings and different
middles, to test whether whole-conversation accumulation reaches a viewer at
all; and giving the same conversation to two models to see whether they choose
similar controls, which is the test of whether this is a language or one
model's idiolect.
