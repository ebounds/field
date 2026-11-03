# stage3b: results

1099 trials answered. Written by `scripts/xagent/report.py` from `results/stage3b.jsonl`; the measures and thresholds are in `PREREG.md`.

| Decoder | naive | pair | taught | words | models |
| --- | --- | --- | --- | --- | --- |
| claude:haiku | 93 | 52 | 96 | 96 | claude-haiku-4-5-20251001 |
| claude:opus | 93 | 52 | 96 | 96 | claude-opus-5-5 |
| claude:sonnet | 93 | 52 | 96 | 96 | claude-sonnet-5-5 |
| codex:astra | 0 | 0 | 18 | 26 | gpt-6-astra |
| codex:sol | 0 | 0 | 25 | 19 | gpt-5.6-sol |

0 answers could not be parsed (scored as wrong). 0 Codex trials ran a command despite being told not to. No failed calls are waiting.

## Naive readers: the right word, six shared studies

Chance is 0.14 (one of seven words). Each cell is the share correct, its 95 % Wilson interval and the number of trials.

| Decoder | 4.5 at 160 px | 4.6 at 160 px | 4.5 at 320 px | 4.6 at 320 px | 4.5 at 1000 px | 4.6 at 1000 px |
| --- | --- | --- | --- | --- | --- | --- |
| claude:haiku | 0.33 (0.14–0.61, n=12) | 0.33 (0.14–0.61, n=12) | 0.25 (0.09–0.53, n=12) | 0.42 (0.19–0.68, n=12) | 0.50 (0.25–0.75, n=12) | 0.17 (0.05–0.45, n=12) |
| claude:opus | 0.67 (0.39–0.86, n=12) | 0.50 (0.25–0.75, n=12) | 0.42 (0.19–0.68, n=12) | 0.58 (0.32–0.81, n=12) | 0.25 (0.09–0.53, n=12) | 0.17 (0.05–0.45, n=12) |
| claude:sonnet | 0.33 (0.14–0.61, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) | 0.42 (0.19–0.68, n=12) | 0.25 (0.09–0.53, n=12) | 0.25 (0.09–0.53, n=12) |
| **Anthropic** | 0.44 (0.30–0.60, n=36) | 0.39 (0.25–0.55, n=36) | 0.36 (0.22–0.52, n=36) | 0.47 (0.32–0.63, n=36) | 0.33 (0.20–0.50, n=36) | 0.19 (0.10–0.35, n=36) |
| **All trials** | 0.44 (0.30–0.60, n=36) | 0.39 (0.25–0.55, n=36) | 0.36 (0.22–0.52, n=36) | 0.47 (0.32–0.63, n=36) | 0.33 (0.20–0.50, n=36) | 0.19 (0.10–0.35, n=36) |

**The Stage 3 test: does 4.6 read worse?** A regression is the same size of gap, against it: 10 points on the family mean, with 3 of 4 families the same way. A family votes where it has six trials or more under each revision.

- Against 4.5 at 160 px: **undecided**, only 1 families can vote.
- Against 4.5 at 320 px: **undecided**, only 1 families can vote.
- Against 4.5 at 1000 px: **undecided**, only 1 families can vote.

### By study (all decoders together)

| Study | 4.5 at 160 px | 4.6 at 160 px | 4.5 at 320 px | 4.6 at 320 px | 4.5 at 1000 px | 4.6 at 1000 px |
| --- | --- | --- | --- | --- | --- | --- |
| gathered | 0.67 (0.30–0.90, n=6) | 0.67 (0.30–0.90, n=6) | 0.67 (0.30–0.90, n=6) | 0.50 (0.19–0.81, n=6) | 0.33 (0.10–0.70, n=6) | 0.33 (0.10–0.70, n=6) |
| exploring | 0.67 (0.30–0.90, n=6) | 0.50 (0.19–0.81, n=6) | 0.50 (0.19–0.81, n=6) | 0.67 (0.30–0.90, n=6) | 0.67 (0.30–0.90, n=6) | 0.17 (0.03–0.56, n=6) |
| strained | 0.17 (0.03–0.56, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.50 (0.19–0.81, n=6) | 0.50 (0.19–0.81, n=6) | 0.00 (0.00–0.39, n=6) |
| tentative | 0.83 (0.44–0.97, n=6) | 1.00 (0.61–1.00, n=6) | 0.83 (0.44–0.97, n=6) | 1.00 (0.61–1.00, n=6) | 0.50 (0.19–0.81, n=6) | 0.67 (0.30–0.90, n=6) |
| integrated | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) |
| playful | 0.33 (0.10–0.70, n=6) | 0.17 (0.03–0.56, n=6) | 0.17 (0.03–0.56, n=6) | 0.17 (0.03–0.56, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) |
| described | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) | 0.00 (0.00–0.39, n=6) |

### What each study was called instead (all sizes)

| Study | 4.5 | 4.6 |
| --- | --- | --- |
| gathered | gathered 10, tentative 4, integrated 4 | gathered 9, integrated 5, tentative 4 |
| exploring | exploring 11, integrated 4, tentative 3 | exploring 8, integrated 7, tentative 1, playful 1 |
| strained | tentative 10, strained 4, gathered 2, integrated 1 | tentative 9, exploring 5, strained 3, gathered 1 |
| tentative | tentative 13, gathered 4, integrated 1 | tentative 16, gathered 1, exploring 1 |
| integrated | gathered 11, tentative 5, playful 1, exploring 1 | gathered 11, tentative 4, exploring 3 |
| playful | integrated 7, exploring 4, playful 3, strained 2 | exploring 10, integrated 6, playful 2 |
| described | tentative 10, exploring 4, gathered 3, strained 1 | tentative 12, gathered 3, exploring 2, strained 1 |

## Side by side: 4.3 against 4.6

Each pair was shown in both orders. A decoder that chose the same side both times gave no signal.

**Which tells you faster what it is like?**

| Decoder | 160 px: 4.3 / 4.6 / no signal | 320 px: 4.3 / 4.6 / no signal |
| --- | --- | --- |
| claude:haiku | 1 / 3 / 2 | 1 / 0 / 5 |
| claude:opus | 1 / 2 / 3 | 2 / 3 / 1 |
| claude:sonnet | 0 / 1 / 5 | 2 / 0 / 4 |
| **All** | 2 / 6 / 10 | 5 / 3 / 10 |

Among the pairs with a signal: at 160 px, 4.3 2 and 4.6 6 (sign test p = 0.289); at 320 px, 4.3 5 and 4.6 3 (sign test p = 0.727).

**Which would you keep looking at?**

| Decoder | 160 px: 4.3 / 4.6 / no signal | 320 px: 4.3 / 4.6 / no signal |
| --- | --- | --- |
| claude:haiku | 2 / 2 / 2 | 0 / 1 / 5 |
| claude:opus | 1 / 5 / 0 | 0 / 4 / 2 |
| claude:sonnet | 0 / 1 / 5 | 0 / 2 / 4 |
| **All** | 3 / 8 / 7 | 0 / 7 / 11 |

Among the pairs with a signal: at 160 px, 4.3 3 and 4.6 8 (sign test p = 0.227); at 320 px, 4.3 0 and 4.6 7 (sign test p = 0.016).

## Side by side: 4.5 against 4.6

Each pair was shown in both orders. A decoder that chose the same side both times gave no signal.

**Which tells you faster what it is like?**

| Decoder | 160 px: 4.5 / 4.6 / no signal | 320 px: 4.5 / 4.6 / no signal |
| --- | --- | --- |
| claude:haiku | 1 / 1 / 4 | 0 / 1 / 5 |
| claude:opus | 1 / 3 / 2 | 1 / 5 / 0 |
| claude:sonnet | 0 / 1 / 5 | 0 / 1 / 5 |
| **All** | 2 / 5 / 11 | 1 / 7 / 10 |

Among the pairs with a signal: at 160 px, 4.5 2 and 4.6 5 (sign test p = 0.453); at 320 px, 4.5 1 and 4.6 7 (sign test p = 0.070). `described`, which only these two revisions draw: at 160 px, 0 / 1 / 2; at 320 px, 0 / 0 / 3.

**Which would you keep looking at?**

| Decoder | 160 px: 4.5 / 4.6 / no signal | 320 px: 4.5 / 4.6 / no signal |
| --- | --- | --- |
| claude:haiku | 1 / 2 / 3 | 0 / 1 / 5 |
| claude:opus | 0 / 2 / 4 | 1 / 2 / 3 |
| claude:sonnet | 0 / 1 / 5 | 0 / 0 / 6 |
| **All** | 1 / 5 / 12 | 1 / 3 / 14 |

Among the pairs with a signal: at 160 px, 4.5 1 and 4.6 5 (sign test p = 0.219); at 320 px, 4.5 1 and 4.6 3 (sign test p = 0.625). `described`, which only these two revisions draw: at 160 px, 0 / 0 / 3; at 320 px, 0 / 1 / 2.

## Taught readers: the three channels

Probe fields with one channel moved at a time. "Seen" is how often the decoder said yes when the channel was there; "false alarm" is how often it said yes when it wasn't.

| Channel | Revision | Size | Seen | False alarm | Mean strength, there / not |
| --- | --- | --- | --- | --- | --- |
| second current | 4.5 | 320 | 0.65 (0.43–0.82, n=20) | 0.19 (0.11–0.30, n=63) | 4.2 / 2.1 |
| second current | 4.5 | 1000 | 0.81 (0.60–0.92, n=21) | 0.24 (0.15–0.37, n=58) | 5.0 / 2.5 |
| second current | 4.6 | 320 | 0.36 (0.20–0.57, n=22) | 0.10 (0.04–0.19, n=63) | 3.2 / 1.7 |
| second current | 4.6 | 1000 | 0.62 (0.41–0.79, n=21) | 0.05 (0.02–0.13, n=63) | 4.1 / 1.7 |
| held from earlier | 4.5 | 320 | 0.35 (0.18–0.57, n=20) | 0.05 (0.02–0.13, n=63) | 2.6 / 1.4 |
| held from earlier | 4.5 | 1000 | 0.68 (0.46–0.85, n=19) | 0.10 (0.05–0.20, n=60) | 3.8 / 1.8 |
| held from earlier | 4.6 | 320 | 0.04 (0.01–0.20, n=24) | 0.03 (0.01–0.11, n=61) | 1.2 / 1.4 |
| held from earlier | 4.6 | 1000 | 0.35 (0.18–0.57, n=20) | 0.06 (0.02–0.15, n=64) | 3.0 / 1.5 |
| reconstructed | 4.5 | 320 | 0.82 (0.61–0.93, n=22) | 0.03 (0.01–0.11, n=61) | 6.7 / 1.4 |
| reconstructed | 4.5 | 1000 | 0.68 (0.46–0.85, n=19) | 0.02 (0.00–0.09, n=60) | 5.7 / 0.9 |
| reconstructed | 4.6 | 320 | 0.68 (0.46–0.85, n=19) | 0.06 (0.02–0.15, n=66) | 5.6 / 1.8 |
| reconstructed | 4.6 | 1000 | 0.91 (0.72–0.97, n=22) | 0.05 (0.02–0.13, n=62) | 6.7 / 1.4 |

**What remains, read as reconstructed.** How often a history probe drew "reconstructed: yes" (the field carries a retained change and is fully met).

| Revision | Reconstructed on history probes | Reconstructed on plain probes |
| --- | --- | --- |
| 4.5 | 0.00 (0.00–0.09, n=39) | 0.05 (0.01–0.16, n=41) |
| 4.6 | 0.05 (0.01–0.15, n=44) | 0.02 (0.00–0.13, n=41) |

**Held from earlier, by probe base** (seen on history probes / false alarm on the others).

| Revision | a | b | c |
| --- | --- | --- | --- |
| 4.5 | 6/13 · 1/39 | 6/14 · 2/41 | 8/12 · 6/43 |
| 4.6 | 1/13 · 1/42 | 3/16 · 3/40 | 4/15 · 2/43 |

**Seen minus false alarm, both sizes together.** Stage 3 calls it a regression when a later revision is more than 15 points under the one before it.

| Channel | 4.5 | 4.6 | Verdict |
| --- | --- | --- | --- |
| second current | +0.52 (n=41, 121) | +0.42 (n=43, 126) | no regression (4.6 minus 4.5: -0.10) |
| held from earlier | +0.44 (n=39, 123) | +0.13 (n=44, 125) | **a regression** (4.6 is 0.31 under 4.5) |
| reconstructed | +0.73 (n=41, 121) | +0.75 (n=41, 128) | no regression (4.6 minus 4.5: +0.02) |

## Words only: the grammar without its atlas

Probe fields with one channel moved at a time. "Seen" is how often the decoder said yes when the channel was there; "false alarm" is how often it said yes when it wasn't.

| Channel | Revision | Size | Seen | False alarm | Mean strength, there / not |
| --- | --- | --- | --- | --- | --- |
| second current | 4.5 | 320 | 0.72 (0.49–0.88, n=18) | 0.25 (0.16–0.37, n=61) | 4.5 / 2.7 |
| second current | 4.5 | 1000 | 0.87 (0.68–0.95, n=23) | 0.47 (0.35–0.59, n=66) | 5.6 / 3.4 |
| second current | 4.6 | 320 | 0.33 (0.17–0.55, n=21) | 0.17 (0.09–0.28, n=60) | 3.1 / 2.6 |
| second current | 4.6 | 1000 | 0.71 (0.50–0.86, n=21) | 0.13 (0.07–0.23, n=63) | 5.0 / 2.4 |
| held from earlier | 4.5 | 320 | 0.33 (0.17–0.55, n=21) | 0.03 (0.01–0.12, n=58) | 2.9 / 1.5 |
| held from earlier | 4.5 | 1000 | 0.78 (0.58–0.90, n=23) | 0.23 (0.14–0.34, n=66) | 4.0 / 2.5 |
| held from earlier | 4.6 | 320 | 0.21 (0.09–0.43, n=19) | 0.16 (0.09–0.27, n=62) | 2.1 / 2.1 |
| held from earlier | 4.6 | 1000 | 0.41 (0.23–0.61, n=22) | 0.23 (0.14–0.34, n=62) | 3.1 / 2.3 |
| reconstructed | 4.5 | 320 | 0.68 (0.46–0.85, n=19) | 0.00 (0.00–0.06, n=60) | 4.2 / 1.3 |
| reconstructed | 4.5 | 1000 | 0.58 (0.36–0.77, n=19) | 0.00 (0.00–0.05, n=70) | 4.7 / 1.1 |
| reconstructed | 4.6 | 320 | 0.64 (0.43–0.80, n=22) | 0.03 (0.01–0.12, n=59) | 4.7 / 1.6 |
| reconstructed | 4.6 | 1000 | 0.68 (0.46–0.85, n=19) | 0.00 (0.00–0.06, n=65) | 4.8 / 1.2 |

**What remains, read as reconstructed.** How often a history probe drew "reconstructed: yes" (the field carries a retained change and is fully met).

| Revision | Reconstructed on history probes | Reconstructed on plain probes |
| --- | --- | --- |
| 4.5 | 0.00 (0.00–0.08, n=44) | 0.00 (0.00–0.08, n=45) |
| 4.6 | 0.00 (0.00–0.09, n=41) | 0.05 (0.01–0.16, n=41) |

**Held from earlier, by probe base** (seen on history probes / false alarm on the others).

| Revision | a | b | c |
| --- | --- | --- | --- |
| 4.5 | 6/14 · 1/39 | 8/15 · 6/42 | 11/15 · 10/43 |
| 4.6 | 5/15 · 5/42 | 2/13 · 6/42 | 6/13 · 13/40 |

**Seen minus false alarm, both sizes together.** Stage 3 calls it a regression when a later revision is more than 15 points under the one before it.

| Channel | 4.5 | 4.6 | Verdict |
| --- | --- | --- | --- |
| second current | +0.44 (n=41, 127) | +0.38 (n=42, 123) | no regression (4.6 minus 4.5: -0.07) |
| held from earlier | +0.43 (n=44, 124) | +0.12 (n=41, 124) | **a regression** (4.6 is 0.31 under 4.5) |
| reconstructed | +0.63 (n=38, 130) | +0.64 (n=41, 124) | no regression (4.6 minus 4.5: +0.01) |

## Real-conversation fields (E3), 320 px

These have no right word. The table shows what naive readers called them.

| Revision | Words chosen |
| --- | --- |
| 4.5 | exploring 11, tentative 6, gathered 5, integrated 3, strained 2 |

