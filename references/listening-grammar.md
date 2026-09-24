# Field Listening 1.0

An optional musical companion to Field v4, introduced in package 4.4. The visual renderer remains revision 4.3. Ordinary Field invocations remain visual. Invoke listening only when the user asks for sound, music, listening, or an audio companion; an explicitly requested audio-only Field is also supported.

## One interpretation, two expressions

Follow `conversation-synthesis.md` and `composition-score.md` once for the whole available exchange. Use the resulting Field v4 controls for both renderers. Do not run a second mood classifier for audio, infer extra hidden information, select a genre from the conversation's topic, or turn separate people or turns into musical characters. The private composition score remains private; the output contains only public renderer controls.

The piece is a musical utterance with a beginning and an ending. Its internal sequence gives the accumulated stance time to unfold. It is not a replay of the conversation's chronology. The retained trace is a quieter recurrence of the current phrase, expressing lasting influence without inventing earlier sound or missing context.

## Stable identity

The fixed capsule has an audible counterpart: a softly held D2 at approximately 73.42 Hz, with restrained harmonics. It stays centered. Other voices use ratios around D3, making the palette a family of compatible sound materials. Keep that identity and the shared renderer across invocations. Do not improvise a soundtrack, substitute commercial music, or call a music generator in place of the instrument.

The phrase lasts 24 seconds and fades into silence. No lyrics, spoken explanation, alerts, automatic looping, or background playback. The host may offer a play control or downloadable file; generating an artifact is not permission to start playback. Do not start speakers or open a player automatically.

## Musical conventions

These mappings are authored conventions to explore and learn, not research-validated emotion measurements. Major and minor intervals are not moral judgments. Consonance is not agreement or truth; dissonance is not failure. Interpret mixed colors under Field's existing meanings.

| Visual quality | Musical expression |
| --- | --- |
| Teal / attention | Hollow wood harmonics, a little air, open second and fifth relationships. |
| Blue / analytical composure | Spare, clear partials and deliberately spaced fourths and fifths. |
| Violet / imagination | A damped glass rim and suspended, neighboring intervals. |
| Amber / care | Rounded felt and wood harmonics; gentle attacks, warm thirds. |
| Coral / consequential concern | A bowed harmonic texture and close intervals. |
| Pearl / integration | Clear open harmonics with the shared center audible. |
| Envelope | A contour that gathers, opens briefly, and returns. |
| Sweep | A phrase that reaches through register and stereo space. |
| Mantle | A sustained higher canopy around the center. |
| Openness | Wider placement and a more spacious room. |
| Breadth | Lower supporting voices and longer, fuller envelopes. |
| Definition | Attack articulation and the clarity of the room's reflections. |
| Intensity | Restrained changes in presence; never an alarm or loudness jump. |
| Tension | A quiet beating neighbor alongside the tone. |
| History | A softened delayed return of an existing voice. |
| Counterpoint | An answering phrase in the supporting color, sharing the tonal center. |
| Complexity / folding | Sparse upper filaments and irregular phrase spacing. |
| Ambient / strength | A quiet shared fifth with the ambient timbre; room decay. |
| Saturation / stretch | Harmonic brightness and spectral weight. |
| Flow / imbalance | Slow lateral movement and placement around the centered anchor. |
| Accent / gesture | Brief supporting material or a folded, echoed, or braided phrase. |

The mappings intentionally overlap: listening to the whole piece matters more than decoding every control separately. Controls do not become extra psychological scores. Stereo contributes space, but the voices remain audible when mixed to mono. The low center's harmonics help its presence survive small speakers.

## Render and deliver

Requires Node.js 18 or later, with no packages, network calls, accounts, samples, or API keys:

```bash
node <skill-root>/scripts/render_audio.mjs --spec <controls.json> --output <field.wav>
```

The audio renderer uses `docs/site/audio.mjs` and `docs/site/renderer.mjs`; keep those modules with the package. WAV output is 24 seconds, 44.1 kHz, stereo, 16-bit PCM. A standard INFO comment stores the audio revision and validated Field controls, with no transcript or private score. The same controls and audio revision produce the same samples in the same JavaScript engine; floating point math may vary slightly between engines.

When audio is requested alongside a visual, deliver the SVG and a playable or downloadable WAV as companions. For audio-only, deliver the sound. Preserve the ordinary invocation's wordless expression. If asked to explain, discuss high-level qualities grounded in the available exchange.

If Node execution is unavailable, supply the existing controls for the user to import into the Field playground and invoke **Listen**. State that limitation plainly. Do not claim to have rendered or heard a file if you have not. Apply the synthesis procedure's coverage disclosure to audio-only delivery as well.

## Care in listening

Keep clean attack and release envelopes, headroom, a moderate default playback volume, and a visible stop control. Replay should be a choice. The browser renders away from the UI thread and snapshots the chosen composition: changes sound on the next listen. Closing the panel, hiding the tab, or navigating away stops playback. Saving a WAV stays silent. A composition link never activates sound for its recipient.

Beauty should follow the actual stance. Do not inflate tension, complexity, brightness, or loudness to make a quiet exchange seem more dramatic. A faint, unfinished phrase can be the most faithful expression.
