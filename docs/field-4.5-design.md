# Field 4.5 — Continuity

24 September 2026. Visual rendering 4.3, Listening 1.0, Companion 1.0.

## A conversation, held

A Field now has somewhere to stay between invocations. A participating assistant can keep a selected conversation's expression current, publishing after substantive responses or meaningful developments. Its composition rests between updates and returns after a pause.

The artistic question is what a change in understanding can look like while retaining its history. A surface opens, gathers, or settles around the same titanium center. Light changes through perceptual color interpolation. A thin joined ridge can retain the actual contour of a prior expression, transformed into the present surface. Replaying recent compositions lets the viewer experience the path into the current one.

This implements the first milestone of the [continuity proposal](field-continuity-proposal.md). Availability persists; interpretations are authored at meaningful boundaries. There is no inference during silence.

## The instrument

- A local Node.js service holds separate conversation records, serves the companion, and sends validated updates to the selected display.
- The participating assistant reads the available context, revisits its whole-conversation synthesis, and publishes Field v4 controls with source and coverage through `scripts/field.mjs`.
- An optional phase ledger helps the assistant reorient without treating earlier artwork as evidence of tone. It contains high-level notes and source references. It stays separate from the browser stream and exports.
- Recent artistic history retains up to 80 expressions per conversation. The viewer shows the last 12 in its moment list and can replay the retained history.
- The browser restores the selected conversation and last valid expression. Connection and publication freshness remain visible. Inspection shows authorship, source boundary, coverage, and retained-contour provenance.
- Still view and the system's reduced-motion preference preserve the completed expression. Transitions finish when the page is hidden; replay and sound stop.
- SVG exports carry the complete target artwork and public metadata, including the earlier controls used for a retained contour. History JSON carries compositions, without the separate ledger.

The public companion is an authored, clearly labeled study. It needs no server or model. To use a real conversation, the user runs the local companion and gives a capable host the continuous-use instruction. The package does not install a hook into chat applications or silently monitor them.

## Movement and memory

The shared renderer exposes its geometry to the companion. Matching SVG curves, light, and material attributes interpolate over roughly three to six seconds; entering and departing material fade within the same composition. The capsule remains fixed. An interrupted transition resumes from the displayed geometry, and every settled endpoint uses a complete target rendering. Animation stops at rest.

Six transition choices set timing and easing: gather, reach, hold, settle, return, and reorient. Most of the meaningful motion comes from the difference between the authored forms. This first implementation does not simulate material physics or independently choreograph every fold. A gesture should be chosen for the conversation's development, with intensity and complexity remaining grounded in the shared score.

With a prior expression and nonzero history, the renderer samples its surface and blends that contour into a ridge joined to the current surface. The earlier primary and secondary colors enter its light. An isolated field still uses the canonical retained-history treatment; the companion identifies when it has an actual prior contour. Neither treatment claims to reconstruct absent conversation evidence.

## Sound

The optional 24-second Listening portrait remains available for whichever expression is being viewed. Updates, restore, and replay never begin playback. Changing a composition affects the next listen; switching conversations stops existing sound. The center, timbres, synthesis, and WAV export remain Listening 1.0.

Persistent ambient composition, musical motif memory across turns, and coordinated continuous audiovisual performance remain future work. The next experiment should test how much repetition or change feels informative, companionable, or tiring over a real working session.

## Scope and claims

Field seeks the fullest expressive scope its host permits: available conversation, accumulated context, reflective understanding, and nuances not already verbalized. The hosting model determines informational boundaries in every medium. Modest claims about measurement do not add a Field-specific restriction to visible transcript wording.

Freshness and coverage are explicit facts. Color, shape, motion, and sound are authored interpretations. The project leaves their usefulness open to experience and comparison.

## Verification

The renderer parity suite checks 21 browser/Python compositions. Audio checks cover deterministic output, palette differences, the shared center, numerical bounds, and WAV metadata. Companion tests exercise strict validation, stale and concurrent publication, atomic persistence, restart, bounded history, source separation, origin restrictions, and conversation-specific streams.

Real Chromium checks exercise motion and its fixed center, retained-contour provenance, still/reduced motion, replay, exported SVG/history, narrow layouts, publication, conversation switching, browser restore, reconnect, and audio opt-in. Those tests establish behavior; judging expressiveness and beauty still requires time with the work.
