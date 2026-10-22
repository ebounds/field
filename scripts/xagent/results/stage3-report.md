# stage3: results

2036 trials answered. Written by `scripts/xagent/report.py` from `results/stage2.jsonl` and `results/stage3.jsonl`; the measures and thresholds are in `PREREG.md`.

| Decoder | naive | pair | taught | models |
| --- | --- | --- | --- | --- |
| claude:haiku | 147 | 76 | 114 | claude-haiku-4-5-20251001 |
| claude:opus | 147 | 76 | 114 | claude-opus-5-5 |
| claude:sonnet | 147 | 76 | 114 | claude-sonnet-5-5 |
| codex:astra | 147 | 76 | 114 | gpt-6-astra |
| codex:sol | 147 | 76 | 114 | gpt-5.6-sol |
| gemini | 128 | 59 | 67 | gemini-3-flash-preview, gemini-3.5-flash, gemini-3.6-flash, gemini-3.7-flash, gemini-3.8-flash |
| grok | 87 | 10 | 0 | grok-4.6, grok-4.7 |

4 answers could not be parsed (scored as wrong). 0 Codex trials ran a command despite being told not to. Calls that failed and await a rerun: grok 48, gemini 12.

## Naive readers: the right word, six shared studies

Chance is 0.14 (one of seven words). Each cell is the share correct, its 95 % Wilson interval and the number of trials.

| Decoder | 4.3 at 160 px | 4.4 at 160 px | 4.5 at 160 px | 4.3 at 320 px | 4.4 at 320 px | 4.5 at 320 px | 4.3 at 1000 px | 4.4 at 1000 px | 4.5 at 1000 px |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| claude:haiku | 0.25 (0.09–0.53, n=12) | 0.33 (0.14–0.61, n=12) | 0.17 (0.05–0.45, n=12) | 0.42 (0.19–0.68, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) | 0.25 (0.09–0.53, n=12) | 0.17 (0.05–0.45, n=12) | 0.17 (0.05–0.45, n=12) |
| claude:opus | 0.25 (0.09–0.53, n=12) | 0.17 (0.05–0.45, n=12) | 0.17 (0.05–0.45, n=12) | 0.17 (0.05–0.45, n=12) | 0.42 (0.19–0.68, n=12) | 0.17 (0.05–0.45, n=12) | 0.17 (0.05–0.45, n=12) | 0.25 (0.09–0.53, n=12) | 0.17 (0.05–0.45, n=12) |
| claude:sonnet | 0.33 (0.14–0.61, n=12) | 0.33 (0.14–0.61, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) | 0.33 (0.14–0.61, n=12) | 0.25 (0.09–0.53, n=12) | 0.17 (0.05–0.45, n=12) | 0.33 (0.14–0.61, n=12) | 0.25 (0.09–0.53, n=12) |
| codex:astra | 0.25 (0.09–0.53, n=12) | 0.25 (0.09–0.53, n=12) | 0.42 (0.19–0.68, n=12) | 0.17 (0.05–0.45, n=12) | 0.17 (0.05–0.45, n=12) | 0.25 (0.09–0.53, n=12) | 0.25 (0.09–0.53, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) |
| codex:sol | 0.58 (0.32–0.81, n=12) | 0.50 (0.25–0.75, n=12) | 0.50 (0.25–0.75, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) | 0.42 (0.19–0.68, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) | 0.42 (0.19–0.68, n=12) |
| gemini | 0.17 (0.05–0.45, n=12) | 0.27 (0.10–0.57, n=11) | 0.45 (0.21–0.72, n=11) | 0.09 (0.02–0.38, n=11) | 0.10 (0.02–0.40, n=10) | 0.25 (0.09–0.53, n=12) | 0.14 (0.03–0.51, n=7) | 0.33 (0.12–0.65, n=9) | 0.36 (0.15–0.65, n=11) |
| grok | 0.29 (0.08–0.64, n=7) | 0.22 (0.06–0.55, n=9) | 0.18 (0.05–0.48, n=11) | 0.10 (0.02–0.40, n=10) | 0.00 (0.00–0.30, n=9) | 0.25 (0.09–0.53, n=12) | – | – | – |
| **Anthropic** | 0.28 (0.16–0.44, n=36) | 0.28 (0.16–0.44, n=36) | 0.22 (0.12–0.38, n=36) | 0.33 (0.20–0.50, n=36) | 0.36 (0.22–0.52, n=36) | 0.28 (0.16–0.44, n=36) | 0.19 (0.10–0.35, n=36) | 0.25 (0.14–0.41, n=36) | 0.19 (0.10–0.35, n=36) |
| **OpenAI** | 0.42 (0.24–0.61, n=24) | 0.38 (0.21–0.57, n=24) | 0.46 (0.28–0.65, n=24) | 0.25 (0.12–0.45, n=24) | 0.29 (0.15–0.49, n=24) | 0.33 (0.18–0.53, n=24) | 0.29 (0.15–0.49, n=24) | 0.38 (0.21–0.57, n=24) | 0.42 (0.24–0.61, n=24) |
| **xAI** | 0.29 (0.08–0.64, n=7) | 0.22 (0.06–0.55, n=9) | 0.18 (0.05–0.48, n=11) | 0.10 (0.02–0.40, n=10) | 0.00 (0.00–0.30, n=9) | 0.25 (0.09–0.53, n=12) | – | – | – |
| **Google** | 0.17 (0.05–0.45, n=12) | 0.27 (0.10–0.57, n=11) | 0.45 (0.21–0.72, n=11) | 0.09 (0.02–0.38, n=11) | 0.10 (0.02–0.40, n=10) | 0.25 (0.09–0.53, n=12) | 0.14 (0.03–0.51, n=7) | 0.33 (0.12–0.65, n=9) | 0.36 (0.15–0.65, n=11) |
| **All trials** | 0.30 (0.21–0.41, n=79) | 0.30 (0.21–0.41, n=80) | 0.32 (0.23–0.42, n=82) | 0.25 (0.17–0.35, n=81) | 0.27 (0.18–0.37, n=79) | 0.29 (0.20–0.39, n=84) | 0.22 (0.14–0.34, n=67) | 0.30 (0.21–0.42, n=69) | 0.30 (0.20–0.41, n=71) |

**The pre-registered gap test** (160 px, each family weighted equally):

- Family mean: 4.3 0.29, 4.4 0.29; difference -0.00 (4.3 minus 4.4).
- By family: Anthropic +0.00, OpenAI +0.04, xAI +0.06, Google -0.11.
- 2 of 4 families have 4.3 ahead. **No decoder gap, as pre-registered.**

**The Stage 3 test: does 4.5 read worse?** A regression is the same size of gap, against it: 10 points on the family mean, with 3 of 4 families the same way. A family votes where it has six trials or more under each revision.

- Against 4.4 at 160 px: 4.4 0.29, 4.5 0.33 (-0.04, 4.4 minus 4.5); 2 of 4 families have 4.4 ahead (Anthropic +0.06, OpenAI -0.08, xAI +0.04, Google -0.18). No regression.
- Against 4.4 at 320 px: 4.4 0.19, 4.5 0.28 (-0.09, 4.4 minus 4.5); 1 of 4 families have 4.4 ahead (Anthropic +0.08, OpenAI -0.04, xAI -0.25, Google -0.15). No regression.
- Against 4.4 at 1000 px: 4.4 0.32, 4.5 0.32 (-0.01, 4.4 minus 4.5); 1 of 3 families have 4.4 ahead (Anthropic +0.06, OpenAI -0.04, Google -0.03). No regression.
- Against 4.3 at 160 px: 4.3 0.29, 4.5 0.33 (-0.04, 4.3 minus 4.5); 2 of 4 families have 4.3 ahead (Anthropic +0.06, OpenAI -0.04, xAI +0.10, Google -0.29). No regression.
- Against 4.3 at 320 px: 4.3 0.19, 4.5 0.28 (-0.08, 4.3 minus 4.5); 1 of 4 families have 4.3 ahead (Anthropic +0.06, OpenAI -0.08, xAI -0.15, Google -0.16). No regression.
- Against 4.3 at 1000 px: 4.3 0.21, 4.5 0.32 (-0.12, 4.3 minus 4.5); 0 of 3 families have 4.3 ahead (Anthropic +0.00, OpenAI -0.12, Google -0.22). No regression.

### By study (all decoders together)

| Study | 4.3 at 160 px | 4.4 at 160 px | 4.5 at 160 px | 4.3 at 320 px | 4.4 at 320 px | 4.5 at 320 px | 4.3 at 1000 px | 4.4 at 1000 px | 4.5 at 1000 px |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| gathered | 0.54 (0.29–0.77, n=13) | 0.69 (0.42–0.87, n=13) | 0.57 (0.33–0.79, n=14) | 0.38 (0.18–0.64, n=13) | 0.46 (0.23–0.71, n=13) | 0.50 (0.27–0.73, n=14) | 0.36 (0.15–0.65, n=11) | 0.64 (0.35–0.85, n=11) | 0.67 (0.39–0.86, n=12) |
| exploring | 0.21 (0.08–0.48, n=14) | 0.25 (0.09–0.53, n=12) | 0.43 (0.21–0.67, n=14) | 0.23 (0.08–0.50, n=13) | 0.15 (0.04–0.42, n=13) | 0.29 (0.12–0.55, n=14) | 0.09 (0.02–0.38, n=11) | 0.18 (0.05–0.48, n=11) | 0.08 (0.01–0.35, n=12) |
| strained | 0.08 (0.01–0.33, n=13) | 0.00 (0.00–0.22, n=14) | 0.00 (0.00–0.22, n=14) | 0.08 (0.01–0.33, n=13) | 0.14 (0.04–0.40, n=14) | 0.14 (0.04–0.40, n=14) | 0.00 (0.00–0.24, n=12) | 0.33 (0.14–0.61, n=12) | 0.25 (0.09–0.53, n=12) |
| tentative | 0.77 (0.50–0.92, n=13) | 0.64 (0.39–0.84, n=14) | 0.62 (0.36–0.82, n=13) | 0.64 (0.39–0.84, n=14) | 0.62 (0.36–0.82, n=13) | 0.57 (0.33–0.79, n=14) | 0.58 (0.32–0.81, n=12) | 0.42 (0.19–0.68, n=12) | 0.45 (0.21–0.72, n=11) |
| integrated | 0.23 (0.08–0.50, n=13) | 0.23 (0.08–0.50, n=13) | 0.31 (0.13–0.58, n=13) | 0.14 (0.04–0.40, n=14) | 0.25 (0.09–0.53, n=12) | 0.21 (0.08–0.48, n=14) | 0.27 (0.10–0.57, n=11) | 0.25 (0.09–0.53, n=12) | 0.33 (0.14–0.61, n=12) |
| playful | 0.00 (0.00–0.23, n=13) | 0.00 (0.00–0.22, n=14) | 0.00 (0.00–0.22, n=14) | 0.00 (0.00–0.22, n=14) | 0.00 (0.00–0.22, n=14) | 0.00 (0.00–0.22, n=14) | 0.00 (0.00–0.28, n=10) | 0.00 (0.00–0.26, n=11) | 0.00 (0.00–0.24, n=12) |
| described | – | 0.00 (0.00–0.23, n=13) | 0.00 (0.00–0.22, n=14) | – | 0.00 (0.00–0.22, n=14) | 0.00 (0.00–0.22, n=14) | – | 0.08 (0.01–0.35, n=12) | 0.00 (0.00–0.24, n=12) |

### What each study was called instead (all sizes)

| Study | 4.3 | 4.4 | 4.5 |
| --- | --- | --- | --- |
| gathered | gathered 16, integrated 11, tentative 7, exploring 3 | gathered 22, tentative 6, integrated 5, exploring 3 | gathered 23, tentative 8, integrated 8, exploring 1 |
| exploring | integrated 23, tentative 8, exploring 7 | integrated 19, tentative 7, exploring 7, gathered 2 | integrated 25, exploring 11, tentative 4 |
| strained | tentative 25, gathered 6, integrated 3, exploring 2 | tentative 20, gathered 10, strained 6, exploring 2 | tentative 18, exploring 6, integrated 6, gathered 5 |
| tentative | tentative 26, gathered 11, integrated 1, exploring 1 | tentative 22, gathered 11, exploring 3, integrated 3 | tentative 21, gathered 13, exploring 2, strained 1 |
| integrated | gathered 16, tentative 11, integrated 8, exploring 3 | gathered 21, integrated 9, tentative 6, exploring 1 | gathered 19, integrated 11, exploring 5, tentative 4 |
| playful | integrated 23, exploring 7, tentative 6, strained 1 | integrated 31, tentative 4, strained 2, exploring 2 | integrated 31, exploring 5, tentative 4 |
| described | – | tentative 17, gathered 12, exploring 5, integrated 4 | tentative 18, gathered 10, integrated 8, exploring 4 |

## Side by side: 4.3 against 4.4

Each pair was shown in both orders. A decoder that chose the same side both times gave no signal.

**Which tells you faster what it is like?**

| Decoder | 160 px: 4.3 / 4.4 / no signal | 320 px: 4.3 / 4.4 / no signal |
| --- | --- | --- |
| claude:haiku | 2 / 1 / 3 | 1 / 0 / 5 |
| claude:opus | 3 / 0 / 3 | 6 / 0 / 0 |
| claude:sonnet | 1 / 0 / 5 | 5 / 0 / 1 |
| codex:astra | 3 / 0 / 3 | 5 / 0 / 1 |
| codex:sol | 1 / 1 / 4 | 4 / 0 / 2 |
| gemini | 1 / 1 / 1 | 1 / 1 / 2 |
| grok | – | – |
| **All** | 11 / 3 / 19 | 22 / 1 / 11 |

Among the pairs with a signal: at 160 px, 4.3 11 and 4.4 3 (sign test p = 0.057); at 320 px, 4.3 22 and 4.4 1 (sign test p = 0.000).

**Which would you keep looking at?**

| Decoder | 160 px: 4.3 / 4.4 / no signal | 320 px: 4.3 / 4.4 / no signal |
| --- | --- | --- |
| claude:haiku | 1 / 2 / 3 | 1 / 1 / 4 |
| claude:opus | 0 / 3 / 3 | 0 / 6 / 0 |
| claude:sonnet | 0 / 1 / 5 | 0 / 4 / 2 |
| codex:astra | 0 / 3 / 3 | 0 / 5 / 1 |
| codex:sol | 0 / 2 / 4 | 0 / 6 / 0 |
| gemini | 1 / 2 / 0 | 0 / 1 / 3 |
| grok | – | – |
| **All** | 2 / 13 / 18 | 1 / 23 / 10 |

Among the pairs with a signal: at 160 px, 4.3 2 and 4.4 13 (sign test p = 0.007); at 320 px, 4.3 1 and 4.4 23 (sign test p = 0.000).

## Side by side: 4.3 against 4.5

Each pair was shown in both orders. A decoder that chose the same side both times gave no signal.

**Which tells you faster what it is like?**

| Decoder | 160 px: 4.3 / 4.5 / no signal | 320 px: 4.3 / 4.5 / no signal |
| --- | --- | --- |
| claude:haiku | 0 / 2 / 4 | 0 / 0 / 6 |
| claude:opus | 2 / 1 / 3 | 2 / 0 / 4 |
| claude:sonnet | 3 / 1 / 2 | 0 / 0 / 6 |
| codex:astra | 3 / 0 / 3 | 5 / 0 / 1 |
| codex:sol | 1 / 2 / 3 | 2 / 0 / 4 |
| gemini | 2 / 0 / 2 | 1 / 0 / 4 |
| grok | – | – |
| **All** | 11 / 6 / 17 | 10 / 0 / 25 |

Among the pairs with a signal: at 160 px, 4.3 11 and 4.5 6 (sign test p = 0.332); at 320 px, 4.3 10 and 4.5 0 (sign test p = 0.002).

**Which would you keep looking at?**

| Decoder | 160 px: 4.3 / 4.5 / no signal | 320 px: 4.3 / 4.5 / no signal |
| --- | --- | --- |
| claude:haiku | 1 / 1 / 4 | 0 / 3 / 3 |
| claude:opus | 1 / 3 / 2 | 0 / 4 / 2 |
| claude:sonnet | 0 / 3 / 3 | 0 / 2 / 4 |
| codex:astra | 0 / 3 / 3 | 0 / 5 / 1 |
| codex:sol | 2 / 3 / 1 | 0 / 5 / 1 |
| gemini | 1 / 2 / 1 | 0 / 1 / 4 |
| grok | – | – |
| **All** | 5 / 15 / 14 | 0 / 20 / 15 |

Among the pairs with a signal: at 160 px, 4.3 5 and 4.5 15 (sign test p = 0.041); at 320 px, 4.3 0 and 4.5 20 (sign test p = 0.000).

## Side by side: 4.4 against 4.5

Each pair was shown in both orders. A decoder that chose the same side both times gave no signal.

**Which tells you faster what it is like?**

| Decoder | 160 px: 4.4 / 4.5 / no signal | 320 px: 4.4 / 4.5 / no signal |
| --- | --- | --- |
| claude:haiku | 0 / 3 / 3 | 0 / 1 / 5 |
| claude:opus | 1 / 3 / 2 | 0 / 5 / 1 |
| claude:sonnet | 0 / 2 / 4 | 0 / 4 / 2 |
| codex:astra | 1 / 2 / 3 | 0 / 4 / 2 |
| codex:sol | 0 / 2 / 4 | 0 / 1 / 5 |
| gemini | 0 / 1 / 3 | 1 / 0 / 3 |
| grok | 0 / 1 / 0 | – |
| **All** | 2 / 14 / 19 | 1 / 15 / 18 |

Among the pairs with a signal: at 160 px, 4.4 2 and 4.5 14 (sign test p = 0.004); at 320 px, 4.4 1 and 4.5 15 (sign test p = 0.001). `described`, which only these two revisions draw: at 160 px, 0 / 1 / 5; at 320 px, 1 / 1 / 4.

**Which would you keep looking at?**

| Decoder | 160 px: 4.4 / 4.5 / no signal | 320 px: 4.4 / 4.5 / no signal |
| --- | --- | --- |
| claude:haiku | 2 / 0 / 4 | 0 / 0 / 6 |
| claude:opus | 2 / 2 / 2 | 3 / 0 / 3 |
| claude:sonnet | 2 / 2 / 2 | 4 / 0 / 2 |
| codex:astra | 2 / 1 / 3 | 4 / 0 / 2 |
| codex:sol | 1 / 2 / 3 | 0 / 3 / 3 |
| gemini | 1 / 2 / 1 | 0 / 0 / 4 |
| grok | 0 / 0 / 1 | – |
| **All** | 10 / 9 / 16 | 11 / 3 / 20 |

Among the pairs with a signal: at 160 px, 4.4 10 and 4.5 9 (sign test p = 1.000); at 320 px, 4.4 11 and 4.5 3 (sign test p = 0.057). `described`, which only these two revisions draw: at 160 px, 1 / 2 / 3; at 320 px, 1 / 1 / 4.

## Taught readers: the three channels

Probe fields with one channel moved at a time. "Seen" is how often the decoder said yes when the channel was there; "false alarm" is how often it said yes when it wasn't.

| Channel | Revision | Size | Seen | False alarm | Mean strength, there / not |
| --- | --- | --- | --- | --- | --- |
| second current | 4.3 | 320 | 0.59 (0.36–0.78, n=17) | 0.34 (0.20–0.52, n=32) | 3.9 / 3.2 |
| second current | 4.3 | 1000 | 0.62 (0.39–0.82, n=16) | 0.42 (0.27–0.59, n=33) | 4.7 / 3.2 |
| second current | 4.4 | 320 | 0.61 (0.44–0.75, n=33) | 0.34 (0.25–0.44, n=100) | 3.9 / 2.8 |
| second current | 4.4 | 1000 | 0.75 (0.58–0.87, n=32) | 0.38 (0.29–0.48, n=103) | 4.9 / 3.0 |
| second current | 4.5 | 320 | 0.68 (0.51–0.81, n=34) | 0.28 (0.20–0.37, n=100) | 4.7 / 2.4 |
| second current | 4.5 | 1000 | 0.74 (0.58–0.86, n=35) | 0.26 (0.19–0.36, n=102) | 5.1 / 2.6 |
| held from earlier | 4.3 | 320 | 0.44 (0.23–0.67, n=16) | 0.33 (0.20–0.50, n=33) | 2.8 / 2.7 |
| held from earlier | 4.3 | 1000 | 0.75 (0.51–0.90, n=16) | 0.52 (0.35–0.67, n=33) | 3.9 / 3.0 |
| held from earlier | 4.4 | 320 | 0.47 (0.31–0.63, n=34) | 0.14 (0.09–0.22, n=99) | 3.4 / 1.6 |
| held from earlier | 4.4 | 1000 | 0.76 (0.60–0.88, n=34) | 0.29 (0.21–0.38, n=101) | 5.0 / 2.4 |
| held from earlier | 4.5 | 320 | 0.36 (0.22–0.53, n=33) | 0.08 (0.04–0.15, n=101) | 2.8 / 1.4 |
| held from earlier | 4.5 | 1000 | 0.71 (0.54–0.83, n=34) | 0.26 (0.19–0.35, n=103) | 4.3 / 2.2 |
| reconstructed | 4.4 | 320 | 0.91 (0.76–0.97, n=33) | 0.07 (0.03–0.14, n=100) | 7.4 / 1.2 |
| reconstructed | 4.4 | 1000 | 0.88 (0.73–0.95, n=34) | 0.02 (0.01–0.07, n=101) | 7.6 / 0.6 |
| reconstructed | 4.5 | 320 | 0.82 (0.66–0.91, n=33) | 0.06 (0.03–0.12, n=101) | 7.2 / 1.0 |
| reconstructed | 4.5 | 1000 | 0.82 (0.66–0.92, n=34) | 0.02 (0.01–0.07, n=103) | 7.0 / 0.7 |

**Seen minus false alarm, both sizes together.** Stage 3 calls it a regression when a later revision is more than 15 points under the one before it.

| Channel | 4.3 | 4.4 | 4.5 | Verdict |
| --- | --- | --- | --- | --- |
| second current | +0.22 (n=33, 65) | +0.32 (n=65, 203) | +0.44 (n=69, 202) | no regression (4.5 minus 4.4: +0.12) |
| held from earlier | +0.17 (n=32, 66) | +0.40 (n=68, 200) | +0.37 (n=67, 204) | no regression (4.5 minus 4.4: -0.04) |
| reconstructed | – | +0.85 (n=67, 201) | +0.78 (n=67, 204) | no regression (4.5 minus 4.4: -0.07) |

## Real-conversation fields (E3), 320 px

These have no right word. The table shows what naive readers called them.

| Revision | Words chosen |
| --- | --- |
| 4.3 | integrated 27, tentative 11, exploring 11, gathered 10, strained 1 |
| 4.4 | integrated 29, gathered 9, exploring 8, tentative 7, strained 4 |
| 4.5 | integrated 25, exploring 13, tentative 11, gathered 11, strained 1, described 1 |

The same decoder gave the same word to 4.3 and 4.4 of a reading in 38 of 55 cases.

The same decoder gave the same word to 4.3 and 4.5 of a reading in 38 of 60 cases.

The same decoder gave the same word to 4.4 and 4.5 of a reading in 33 of 56 cases.

