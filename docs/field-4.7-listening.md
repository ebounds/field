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
- *One listen:* without that, so the palette has to be named from a single rendering. This is the first look: can you tell the color without hearing the alternatives? Reported, with a target of half, not a gate.

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

The reason is visible in the spectrum. In 1.1, between 40 and 98 per cent of a piece's energy sits below 250 Hz, almost nothing reaches above 1 kHz, and every material is a fundamental with partials at a third of its strength or less. The colors change the intervals more than the sound. Form, meanwhile, moves the whole register (the mantle is an octave up) and the timing of every entry.

## 3. What Listening 1.2 changes

**Palette is the material.** Each color now has its own way of sounding, not a slightly different mix of partials over the same near-pure tone. The descriptions are the grammar's own; 1.2 makes them audible.

| Color | 1.2 material |
| --- | --- |
| Teal | Hollow wood: odd harmonics, a little breath, a soft chiff as each note starts. |
| Blue | Clear, spare tones: a nearly pure tone with a faint octave, a precise onset, held steady. |
| Violet | Suspended glass: inharmonic partials (the 2.756 and 5.404 modes of a free bar) that bloom slowly and shimmer, from a fundamental beating gently against its twin. |
| Amber | Soft felt and wood: a soft struck tone whose rounded harmonics ring and darken; a felt touch at the start. |
| Coral | Bowed: a full harmonic tone that swells, with bow grain and a slow vibrato that arrives after the onset. |
| Pearl | Open harmonic light: only octaves and fifths among the overtones, the upper ones drifting slowly. |

The materials are balanced in level: changing palette moves a study's overall level by at most 1.25 dB, against a guard of 1.5. Grounding works as it did in 1.1: an inferred voice loses its fundamental and keeps its partials, a glassy rim and a little quiet air. The ambient color also tints the room, brighter and longer for glass and open light, warmer and closer for wood and felt. It is heard mostly in the rests.

**The visual's reading order, given time.** The picture is read color, glow and posture first, then the finer marks. The piece now has the same order:

1. **A statement** (0 to 8.6 s) in the field's own material. The primary's first entry is heard alone before the centre enters; four entries in all trace the form's contour, with the body (breadth) and the atmosphere (ambient). The second color, counterpoint, filaments and accent appear only near its end, as a first glimpse.
2. **A real rest**, 0.8 to 1.7 s (longer when the field is more open). Nothing sounds, the centre included, and the room empties. Measured, every study's rests fall at least 30 dB below the piece's loud level, and in practice by 45 dB or more.
3. **An answer** in which the second-look voices arrive: the supporting color, counterpoint, filaments, accent, gesture, and the retained trace recalling the statement's entries.
4. **A breath** of 0.5 to 1.1 s.
5. **The return to D:** the centre comes back under an open fifth in the primary material, with a last trace and a last answering voice.

The 24 seconds, the tonal centre, the intervals, every control's meaning and the forms' contours stay as they were. Voices are a little shorter, in proportion to entries that now sit closer together: at its fullest the piece sounds six to nine voices at once (1.1: eight or nine), and fewer on average.

## 4. What Listening 1.2 measures

| | Listening 1.1 | Listening 1.2 |
| --- | --- | --- |
| Palette named from timbre, compared | 32 of 42 | 35 of 42 |
| Palette named from one listen (target 21) | 14 of 42 | **24 of 42** |
| Palette separation | 1.026 | **2.693** |
| Form separation | 3.702 | 3.769 |
| **Margin (gate: 1.00)** | 0.28 | **0.71, not met** |
| Margin on timbre alone | 0.27 | 0.56 |
| Form separation where the register is the same (envelope against sweep) | 1.537 | 1.639 |
| Largest level change from a palette change (guard 1.5 dB) | 0.95 dB | 1.25 dB |
| Real rests | none | two in every study |

Palette now moves a piece 2.6 times as far as it did, and further than any form change that keeps the register: changing envelope to sweep moves a piece 1.64, changing its palette 2.69. **The gate is not met** because of one thing: the mantle sounds an octave higher throughout, and the timbre term hears that as the largest single change in the instrument. Changing any form to or from the mantle moves a piece about 4.7. Every study has the mantle on one side of a form comparison, so it dominates form's average.

**Decision for Edgar: may the mantle arch?** The mantle's identity in sound is a decision about form, as the centre's silence was about the capsule, so it isn't taken here. The grammar's own word for the mantle is *arching*. Instead of transposing every entry, it could rise into its canopy and come down:

| Mantle | Margin | Palette named, compared / one listen |
| --- | --- | --- |
| An octave up throughout (1.1, and 1.2 as committed) | 0.71 | 35 / 24 |
| Gentle arch: first and last entry in the middle, five in the canopy | 0.81 | 38 / 20 |
| Strong arch: rises to three canopy entries and comes down | 0.98 | 38 / 25 |

Even the strong arch stops just short of the gate. Both are one line in `compose()`, the `register` of each entry.

**For listening:** seventeen renders, made with `renderAudio` and encoded as MP3: the seven studies in 1.1 (`a244a80`) and in 1.2 (this branch), and the three mantle studies with the strong arch (register `[1,1,2,2,2,1,1]`). They are heard as ten blind A/B pairs, 1.1 against 1.2 and then the octave against the arch, each with two questions (which tells you its color sooner, or holds a tall space better; which you would keep listening to) and room for notes. What was what is shown only at the end.

What the check holds now (`scripts/check_audio.mjs`): the timbre term names palettes; the level guard; two real rests in every study, with the centre silent in the first and returning after the last; and a floor of 0.6 on the margin, so palette cannot quietly fall back toward 1.1. It reports whether the gate is met. When it is, the floor becomes the gate.

## 5. Checked across the controls

- **Random controls.** 240 random sets of controls over their full ranges, and 96 extremes of the noisiest settings (every primary at grounding 0 and .2, definition 0 and 1, saturation and stretch at both ends): every rendering is finite, inside the headroom, free of steps that would click, silent at both ends, rests twice with each rest at least 36 dB down, and returns to D.
- **One fix came from this.** At low grounding, teal's onset chiff was multiplied by the extra air of an inferred reading and became a burst, and that air was about 17 dB louder and brighter than 1.1's. The chiff is now added to the air rather than scaling it, and an inferred voice's air is back near 1.1's level. The largest sample step over the extremes fell from 0.193 to 0.147 (the click limit is 0.2).
- **Sample rates.** The seven studies render at 8, 22.05, 32, 48 and 96 kHz with the same level within 0.1 dB and the same peaks.
- **Browser and command line.** Headless Chromium renders all seven studies bit for bit the same as Node, so a WAV from `render_audio.mjs` is what the playground plays.

## 6. A finer cross-check, after the fact

This is not the gate, and it was added after the gate was fixed. Its job is to look where the fingerprint is blind. `scripts/listening_crosscheck.mjs` describes timbre with a mel-cepstrum, which resolves single pitches at the low end and so hears a palette's intervals as well as its material. With `--material-only` every hue gets the same scale, so a palette change is a change of material alone.

| | 1.1 | 1.2 |
| --- | --- | --- |
| Fingerprint, palettes as they are: palette / form | 0.28 | 0.71 |
| Fingerprint, material only: palette separation | 0.79 | 2.87 |
| Fingerprint, material only: named from one listen | 13 of 42 | 22 of 42 |
| Fingerprint, material only: closest pair | blue/pearl 0.20 | blue/amber 1.19 |
| Mel-cepstrum, palettes as they are: palette / form | 1.04 | 1.23 |
| Mel-cepstrum, palettes as they are: named from one listen | 38 of 42 | 33 of 42 |
| Mel-cepstrum, material only: palette / form | 0.82 | 1.16 |
| Mel-cepstrum, material only: named from one listen | 22 of 42 | 35 of 42 |

Three things come out of it:

1. **1.1's colors were told apart by their intervals, not their materials.** On the finer measure, 1.1's palettes are already as far apart as its forms and can be named from one listen, because each color has its own scale. Hold the scale fixed and 1.1's six materials nearly merge: on the fingerprint its closest pair sits at the 0.20 floor below which two pieces can't be heard apart. This is the imbalance 4a was asked to fix, seen more precisely.
2. **1.2's materials do the work.** With the scale fixed, they separate pieces three and a half times as far as 1.1's on the fingerprint, and on the finer measure they separate them further than form does.
3. **The pairs to listen for.** Blue against amber is the closest pair on both measures (a held, nearly pure tone against struck felt, both dark). Teal against coral is close on the finer one (both breathe, both sustain). Coral against pearl, close on the fingerprint, is not close on the finer measure, which supports the caution that the fingerprint under-reports some differences. The finer measure has a blind spot of its own: a palette's intervals can stand in for its material.

## 7. What I could not do

- **I could not hear any of it.** Every claim about 1.2 comes from rendered samples, spectra and the score. There was no listening model available in this session either. Listening is the 4a gate that remains, and it's yours.
- **The fingerprint is coarse.** Six bands and a centroid can't hear vibrato, bow grain, inharmonicity, or which overtones are missing. The cross-check in section 6 bears that out for coral against pearl, but not for blue against amber, which both measures place closest.
- **The arch is untested by ear,** and so is whether a real rest after eight seconds feels like breath or like a dropout. Both are for listening.
- **Stage 1's lines are untouched.** It changes `references/listening-grammar.md` lines 7 and 19 and `docs/listening.html` lines 42 and 51; this work edits neither, so the two branches should merge cleanly.

For Stage 6: `SKILL.md` and `README.md` still say Listening 1.1 next to package 4.6.0, and the package list in `scripts/build_public_assets.py` doesn't yet include this note.
