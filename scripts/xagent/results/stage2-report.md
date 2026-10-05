# stage2: results

713 trials answered. Written by `scripts/xagent/report.py` from `results/stage2.jsonl`; the measures and thresholds are in `PREREG.md`.

| Decoder | naive | pair | taught | models |
| --- | --- | --- | --- | --- |
| claude:haiku | 35 | 24 | 13 | claude-haiku-4-5-20251001 |
| claude:opus | 40 | 24 | 19 | claude-opus-5-5 |
| claude:sonnet | 85 | 24 | 42 | claude-sonnet-5-5 |
| codex:astra | 95 | 24 | 22 | gpt-6-astra |
| codex:sol | 94 | 24 | 25 | gpt-5.6-sol |
| gemini | 69 | 1 | 2 | gemini-3-flash-preview, gemini-3.5-flash, gemini-3.6-flash, gemini-3.7-flash, gemini-3.8-flash |
| grok | 50 | 1 | 0 | grok-4.7 |

0 answers could not be parsed (scored as wrong). 0 Codex trials ran a command despite being told not to. Calls that failed and await a rerun: grok 31, claude:haiku 6, codex:sol 19, codex:astra 21, gemini 2.

## Naive readers: the right word, six shared studies

Chance is 0.14 (one of seven words). Each cell is the share correct, its 95 % Wilson interval and the number of trials.

| Decoder | 4.3 at 160 px | 4.4 at 160 px | 4.3 at 320 px | 4.4 at 320 px | 4.3 at 1000 px | 4.4 at 1000 px |
| --- | --- | --- | --- | --- | --- | --- |
| claude:haiku | 0.00 (0.00–0.56, n=3) | 0.25 (0.05–0.70, n=4) | 0.33 (0.06–0.79, n=3) | 0.50 (0.15–0.85, n=4) | 0.33 (0.10–0.70, n=6) | 0.33 (0.06–0.79, n=3) |
| claude:opus | 0.25 (0.05–0.70, n=4) | 0.25 (0.05–0.70, n=4) | 0.40 (0.12–0.77, n=5) | 0.50 (0.15–0.85, n=4) | 0.33 (0.10–0.70, n=6) | 0.40 (0.12–0.77, n=5) |
| claude:sonnet | 0.33 (0.14–0.61, n=12) | 0.30 (0.11–0.60, n=10) | 0.40 (0.17–0.69, n=10) | 0.40 (0.17–0.69, n=10) | 0.20 (0.06–0.51, n=10) | 0.40 (0.17–0.69, n=10) |
| codex:astra | 0.25 (0.09–0.53, n=12) | 0.25 (0.09–0.53, n=12) | 0.18 (0.05–0.48, n=11) | 0.17 (0.05–0.45, n=12) | 0.25 (0.09–0.53, n=12) | 0.33 (0.14–0.61, n=12) |
| codex:sol | 0.58 (0.32–0.81, n=12) | 0.50 (0.25–0.75, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) | 0.33 (0.14–0.61, n=12) | 0.42 (0.19–0.68, n=12) |
| gemini | 0.20 (0.06–0.51, n=10) | 0.22 (0.06–0.55, n=9) | 0.11 (0.02–0.44, n=9) | 0.11 (0.02–0.44, n=9) | 0.14 (0.03–0.51, n=7) | 0.29 (0.08–0.64, n=7) |
| grok | 0.33 (0.10–0.70, n=6) | 0.22 (0.06–0.55, n=9) | 0.10 (0.02–0.40, n=10) | 0.00 (0.00–0.30, n=9) | – | – |
| **Anthropic** | 0.26 (0.12–0.49, n=19) | 0.28 (0.12–0.51, n=18) | 0.39 (0.20–0.61, n=18) | 0.44 (0.25–0.66, n=18) | 0.27 (0.13–0.48, n=22) | 0.39 (0.20–0.61, n=18) |
| **OpenAI** | 0.42 (0.24–0.61, n=24) | 0.38 (0.21–0.57, n=24) | 0.26 (0.13–0.46, n=23) | 0.29 (0.15–0.49, n=24) | 0.29 (0.15–0.49, n=24) | 0.38 (0.21–0.57, n=24) |
| **xAI** | 0.33 (0.10–0.70, n=6) | 0.22 (0.06–0.55, n=9) | 0.10 (0.02–0.40, n=10) | 0.00 (0.00–0.30, n=9) | – | – |
| **Google** | 0.20 (0.06–0.51, n=10) | 0.22 (0.06–0.55, n=9) | 0.11 (0.02–0.44, n=9) | 0.11 (0.02–0.44, n=9) | 0.14 (0.03–0.51, n=7) | 0.29 (0.08–0.64, n=7) |
| **All trials** | 0.32 (0.22–0.45, n=59) | 0.30 (0.20–0.43, n=60) | 0.25 (0.16–0.37, n=60) | 0.27 (0.17–0.39, n=60) | 0.26 (0.16–0.40, n=53) | 0.37 (0.25–0.51, n=49) |

**The pre-registered gap test** (160 px, each family weighted equally):

- Family mean: 4.3 0.30, 4.4 0.27; difference +0.03 (4.3 minus 4.4).
- By family: Anthropic -0.01, OpenAI +0.04, xAI +0.11, Google -0.02.
- 2 of 4 families have 4.3 ahead. **No decoder gap, as pre-registered.**

### By study (all decoders together)

| Study | 4.3 at 160 px | 4.4 at 160 px | 4.3 at 320 px | 4.4 at 320 px | 4.3 at 1000 px | 4.4 at 1000 px |
| --- | --- | --- | --- | --- | --- | --- |
| gathered | 0.60 (0.31–0.83, n=10) | 0.67 (0.35–0.88, n=9) | 0.36 (0.15–0.65, n=11) | 0.50 (0.25–0.75, n=12) | 0.50 (0.22–0.78, n=8) | 0.88 (0.53–0.98, n=8) |
| exploring | 0.20 (0.06–0.51, n=10) | 0.18 (0.05–0.48, n=11) | 0.10 (0.02–0.40, n=10) | 0.11 (0.02–0.44, n=9) | 0.11 (0.02–0.44, n=9) | 0.11 (0.02–0.44, n=9) |
| strained | 0.00 (0.00–0.28, n=10) | 0.00 (0.00–0.28, n=10) | 0.00 (0.00–0.28, n=10) | 0.09 (0.02–0.38, n=11) | 0.00 (0.00–0.30, n=9) | 0.25 (0.07–0.59, n=8) |
| tentative | 0.80 (0.49–0.94, n=10) | 0.70 (0.40–0.89, n=10) | 0.80 (0.49–0.94, n=10) | 0.67 (0.35–0.88, n=9) | 0.60 (0.31–0.83, n=10) | 0.56 (0.27–0.81, n=9) |
| integrated | 0.30 (0.11–0.60, n=10) | 0.30 (0.11–0.60, n=10) | 0.20 (0.06–0.51, n=10) | 0.20 (0.06–0.51, n=10) | 0.38 (0.14–0.69, n=8) | 0.38 (0.14–0.69, n=8) |
| playful | 0.00 (0.00–0.30, n=9) | 0.00 (0.00–0.28, n=10) | 0.00 (0.00–0.30, n=9) | 0.00 (0.00–0.30, n=9) | 0.00 (0.00–0.30, n=9) | 0.00 (0.00–0.35, n=7) |
| described | – | 0.00 (0.00–0.30, n=9) | – | 0.00 (0.00–0.26, n=11) | – | 0.11 (0.02–0.44, n=9) |

### What each study was called instead (all sizes)

| Study | 4.3 | 4.4 |
| --- | --- | --- |
| gathered | gathered 14, integrated 9, tentative 5, exploring 1 | gathered 19, tentative 4, integrated 3, exploring 2 |
| exploring | integrated 19, tentative 6, exploring 4 | integrated 16, tentative 7, exploring 4, gathered 1 |
| strained | tentative 22, integrated 3, exploring 2, gathered 2 | tentative 17, gathered 6, strained 3, integrated 2 |
| tentative | tentative 22, gathered 7, integrated 1 | tentative 18, gathered 6, integrated 3, exploring 1 |
| integrated | gathered 10, tentative 8, integrated 8, exploring 2 | gathered 16, integrated 8, tentative 4 |
| playful | integrated 18, exploring 5, tentative 4 | integrated 23, tentative 3 |
| described | – | tentative 14, gathered 7, integrated 4, exploring 3 |

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
| gemini | – | – |
| grok | – | – |
| **All** | 10 / 2 / 18 | 21 / 0 / 9 |

**Which would you keep looking at?**

| Decoder | 160 px: 4.3 / 4.4 / no signal | 320 px: 4.3 / 4.4 / no signal |
| --- | --- | --- |
| claude:haiku | 1 / 2 / 3 | 1 / 1 / 4 |
| claude:opus | 0 / 3 / 3 | 0 / 6 / 0 |
| claude:sonnet | 0 / 1 / 5 | 0 / 4 / 2 |
| codex:astra | 0 / 3 / 3 | 0 / 5 / 1 |
| codex:sol | 0 / 2 / 4 | 0 / 6 / 0 |
| gemini | – | – |
| grok | – | – |
| **All** | 1 / 11 / 18 | 1 / 22 / 7 |

## Taught readers: the three channels

Probe fields with one channel moved at a time. "Seen" is how often the decoder said yes when the channel was there; "false alarm" is how often it said yes when it wasn't.

| Channel | Revision | Size | Seen | False alarm | Mean strength, there / not |
| --- | --- | --- | --- | --- | --- |
| second current | 4.3 | 320 | 0.67 (0.35–0.88, n=9) | 0.43 (0.21–0.67, n=14) | 4.2 / 3.5 |
| second current | 4.3 | 1000 | 0.73 (0.43–0.90, n=11) | 0.47 (0.26–0.69, n=17) | 5.0 / 3.4 |
| second current | 4.4 | 320 | 0.60 (0.31–0.83, n=10) | 0.36 (0.20–0.55, n=25) | 3.9 / 2.9 |
| second current | 4.4 | 1000 | 0.82 (0.52–0.95, n=11) | 0.46 (0.29–0.65, n=26) | 5.0 / 3.5 |
| held from earlier | 4.3 | 320 | 0.50 (0.19–0.81, n=6) | 0.41 (0.22–0.64, n=17) | 2.8 / 3.1 |
| held from earlier | 4.3 | 1000 | 1.00 (0.65–1.00, n=7) | 0.52 (0.32–0.72, n=21) | 4.7 / 3.2 |
| held from earlier | 4.4 | 320 | 0.67 (0.35–0.88, n=9) | 0.12 (0.04–0.29, n=26) | 3.6 / 1.7 |
| held from earlier | 4.4 | 1000 | 1.00 (0.70–1.00, n=9) | 0.36 (0.21–0.54, n=28) | 6.4 / 2.8 |
| reconstructed | 4.4 | 320 | 0.88 (0.53–0.98, n=8) | 0.07 (0.02–0.23, n=27) | 6.9 / 1.4 |
| reconstructed | 4.4 | 1000 | 0.86 (0.49–0.97, n=7) | 0.00 (0.00–0.11, n=30) | 6.7 / 0.7 |

## Real-conversation fields (E3), 320 px

These have no right word. The table shows what naive readers called them.

| Revision | Words chosen |
| --- | --- |
| 4.3 | integrated 25, tentative 10, gathered 8, exploring 7, strained 1 |
| 4.4 | integrated 25, gathered 7, exploring 7, tentative 7, strained 1 |

The same decoder gave the same word to both revisions of a reading in 26 of 40 cases.

