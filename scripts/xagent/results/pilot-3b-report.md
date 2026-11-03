# pilot-3b: results

128 trials answered. Written by `scripts/xagent/report.py` from `results/pilot-3b.jsonl`; the measures and thresholds are in `PREREG.md`.

| Decoder | taught | words | models |
| --- | --- | --- | --- |
| claude:sonnet | 32 | 32 | claude-sonnet-5-5 |
| codex:sol | 32 | 32 | gpt-5.6-sol |

0 answers could not be parsed (scored as wrong). 0 Codex trials ran a command despite being told not to. No failed calls are waiting.

## Taught readers: the three channels

Probe fields with one channel moved at a time. "Seen" is how often the decoder said yes when the channel was there; "false alarm" is how often it said yes when it wasn't.

| Channel | Revision | Size | Seen | False alarm | Mean strength, there / not |
| --- | --- | --- | --- | --- | --- |
| second current | 4.5 | 320 | 1.00 (0.51–1.00, n=4) | 0.25 (0.09–0.53, n=12) | 5.2 / 2.0 |
| second current | 4.5 | 1000 | 0.50 (0.15–0.85, n=4) | 0.08 (0.01–0.35, n=12) | 4.5 / 2.2 |
| second current | 4.6 | 320 | 0.75 (0.30–0.95, n=4) | 0.17 (0.05–0.45, n=12) | 4.2 / 1.9 |
| second current | 4.6 | 1000 | 0.00 (0.00–0.49, n=4) | 0.33 (0.14–0.61, n=12) | 1.5 / 3.2 |
| held from earlier | 4.5 | 320 | 0.00 (0.00–0.49, n=4) | 0.08 (0.01–0.35, n=12) | 1.5 / 1.3 |
| held from earlier | 4.5 | 1000 | 1.00 (0.51–1.00, n=4) | 0.25 (0.09–0.53, n=12) | 4.8 / 2.5 |
| held from earlier | 4.6 | 320 | 0.25 (0.05–0.70, n=4) | 0.25 (0.09–0.53, n=12) | 2.2 / 2.5 |
| held from earlier | 4.6 | 1000 | 0.00 (0.00–0.49, n=4) | 0.42 (0.19–0.68, n=12) | 1.8 / 3.1 |
| reconstructed | 4.5 | 320 | 1.00 (0.51–1.00, n=4) | 0.00 (0.00–0.24, n=12) | 8.0 / 0.5 |
| reconstructed | 4.5 | 1000 | 1.00 (0.51–1.00, n=4) | 0.00 (0.00–0.24, n=12) | 8.2 / 0.5 |
| reconstructed | 4.6 | 320 | 1.00 (0.51–1.00, n=4) | 0.25 (0.09–0.53, n=12) | 7.8 / 2.1 |
| reconstructed | 4.6 | 1000 | 1.00 (0.51–1.00, n=4) | 0.00 (0.00–0.24, n=12) | 7.5 / 0.6 |

**What remains, read as reconstructed.** How often a history probe drew "reconstructed: yes" (the field carries a retained change and is fully met).

| Revision | Reconstructed on history probes | Reconstructed on plain probes |
| --- | --- | --- |
| 4.5 | 0.00 (0.00–0.32, n=8) | 0.00 (0.00–0.32, n=8) |
| 4.6 | 0.25 (0.07–0.59, n=8) | 0.12 (0.02–0.47, n=8) |

**Held from earlier, by probe base** (seen on history probes / false alarm on the others).

| Revision | p |
| --- | --- |
| 4.5 | 4/8 · 4/24 |
| 4.6 | 1/8 · 8/24 |

## Words only: the grammar without its atlas

Probe fields with one channel moved at a time. "Seen" is how often the decoder said yes when the channel was there; "false alarm" is how often it said yes when it wasn't.

| Channel | Revision | Size | Seen | False alarm | Mean strength, there / not |
| --- | --- | --- | --- | --- | --- |
| second current | 4.5 | 320 | 0.75 (0.30–0.95, n=4) | 0.42 (0.19–0.68, n=12) | 5.0 / 3.2 |
| second current | 4.5 | 1000 | 1.00 (0.51–1.00, n=4) | 0.42 (0.19–0.68, n=12) | 5.2 / 2.9 |
| second current | 4.6 | 320 | 1.00 (0.51–1.00, n=4) | 0.33 (0.14–0.61, n=12) | 5.2 / 3.4 |
| second current | 4.6 | 1000 | 0.25 (0.05–0.70, n=4) | 0.25 (0.09–0.53, n=12) | 2.8 / 3.1 |
| held from earlier | 4.5 | 320 | 0.50 (0.15–0.85, n=4) | 0.50 (0.25–0.75, n=12) | 4.5 / 4.2 |
| held from earlier | 4.5 | 1000 | 1.00 (0.51–1.00, n=4) | 0.50 (0.25–0.75, n=12) | 5.0 / 4.0 |
| held from earlier | 4.6 | 320 | 0.50 (0.15–0.85, n=4) | 0.58 (0.32–0.81, n=12) | 4.5 / 4.5 |
| held from earlier | 4.6 | 1000 | 0.50 (0.15–0.85, n=4) | 0.58 (0.32–0.81, n=12) | 4.2 / 5.2 |
| reconstructed | 4.5 | 320 | 0.75 (0.30–0.95, n=4) | 0.00 (0.00–0.24, n=12) | 5.5 / 0.9 |
| reconstructed | 4.5 | 1000 | 1.00 (0.51–1.00, n=4) | 0.00 (0.00–0.24, n=12) | 6.8 / 1.0 |
| reconstructed | 4.6 | 320 | 1.00 (0.51–1.00, n=4) | 0.00 (0.00–0.24, n=12) | 6.2 / 1.2 |
| reconstructed | 4.6 | 1000 | 1.00 (0.51–1.00, n=4) | 0.00 (0.00–0.24, n=12) | 6.8 / 0.7 |

**What remains, read as reconstructed.** How often a history probe drew "reconstructed: yes" (the field carries a retained change and is fully met).

| Revision | Reconstructed on history probes | Reconstructed on plain probes |
| --- | --- | --- |
| 4.5 | 0.00 (0.00–0.32, n=8) | 0.00 (0.00–0.32, n=8) |
| 4.6 | 0.00 (0.00–0.32, n=8) | 0.00 (0.00–0.32, n=8) |

**Held from earlier, by probe base** (seen on history probes / false alarm on the others).

| Revision | p |
| --- | --- |
| 4.5 | 6/8 · 12/24 |
| 4.6 | 4/8 · 14/24 |

