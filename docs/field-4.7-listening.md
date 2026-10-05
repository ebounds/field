# Listening 1.2: the moment's portrait, in the visual's reading order

Stage 4a of the 4.7 plan. **Base:** release 4.6.0 (`a244a80`), Listening 1.1. Written 5 October 2026.

Listening 1.2 is the same 24-second piece, given the visual's reading order: palette becomes the loudest axis in timbre, and the centre may fall silent, so the piece can have real rests and the capsule's audible identity becomes "returns to D" rather than "always D" (Edgar, 4 October).

## 1. The measure, fixed before 1.2 was written

The 4.6 handback measured `form` separating two compositions three to six times more than the palette, on a fingerprint of loudness and brightness over time, and warned that the fingerprint under-weights timbre. So the first step was a timbre term, shown to hear palette on 1.1, before anything in the instrument changed. The measure and the thresholds below were fixed and committed before Listening 1.2 existed.

**The fingerprint** (`scripts/audio_fingerprint.mjs`), from the mono mix:

- *Time course*, unchanged from 4.6: loudness and zero-crossing brightness in half-second frames. Distance per frame: decibels of loudness over 6, plus the difference in crossing rate times 90, averaged over frames.
- *Timbre*, new: the whole piece's long-term spectrum (Hann-windowed 2,048-point FFTs, half overlapping, summed), described by its spectral centroid and the share of energy in six bands (50–250, 250–500, 500–1,000, 1,000–2,000, 2,000–4,000 and 4,000–10,000 Hz; shares in decibels, floored at −40). Distance: the centroid difference in octaves times 3, plus the mean difference in band share over 6 dB.

The scales put roughly five just-noticeable differences in one unit: 6 dB of loudness or of a band's share, a third of an octave of centroid (about five times the few-per-cent centroid threshold). The listening distance is the sum of the time course and timbre.

**Does the timbre term hear palette?** Every reference study is rendered in all six primaries. (A secondary, accent or ambient that shared the primary's hue follows it, as it does in the picture.) Each rendering's palette is then named from its timbre features by the nearest hue mean of the other six studies, one study held out at a time. Two versions:

- *Compared:* each study's own mean over its six palettes is removed first. This asks whether a palette leaves the same mark on every piece, the way you hear it when you compare two palettes of one piece. **Threshold: at least half named correctly (chance is one in six), and more than the time-course features name.**
- *One listen:* without that, so the palette has to be named from a single rendering. This is the first look: can you tell the colour without hearing the alternatives? Reported, with a target of half, not a gate.

**The gate.** For each study, palette separation is the mean listening distance to its five other primaries, and form separation is the mean distance to its two other forms. **Gate: palette separation, averaged over the seven studies, is at least form separation, averaged the same way.** The check reports the margin (palette over form), each study's ratio, and the margin on the timbre term alone. **Guard:** a palette change may not move a study's overall level by more than 1.5 dB, so palette can't win by being louder.

If 1.2 could only pass by distorting the music, the gate would be Edgar's ears alone, and this note would say so.

## 2. What 1.1 measures

| | Listening 1.1 |
| --- | --- |
| Palette named from timbre, compared | **32 of 42** (chance 7) |
| Palette named from the time course, compared | 17 of 42 |
| Palette named from one listen | 14 of 42 |
| Palette separation / form separation | 1.026 / 3.702: **margin 0.28** |
| Margin on the timbre term alone | 0.27 |
| Largest level change from a palette change | 0.95 dB |

The timbre term passes its own test: it hears palette nearly twice as well as the time course does. Its confusions are the ones you'd expect, teal with amber (both wood) and blue with pearl (both clear). It does not rescue 1.1, though. With timbre measured, palette still separates compositions about 3.6 times less than form, so the handback's worry (that the fingerprint was hiding a louder palette) doesn't hold. The imbalance is in the music.

The reason is visible in the spectrum. In 1.1, between 40 and 98 per cent of a piece's energy sits below 250 Hz, almost nothing reaches above 1 kHz, and every material is a fundamental with partials at a third of its strength or less. The colours change the intervals more than the sound. Form, meanwhile, moves the whole register (the mantle is an octave up) and the timing of every entry.
