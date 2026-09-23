# Field v4 visual grammar

## Stable identity, expressive environment

Use the bundled renderer or adapt a copy of the template. Preserve the square 1000-unit viewBox, frontal viewpoint, and central 128-by-64 titanium capsule at (500,500), with its original material and pearl rim. Preserve readable margins and the same palette meanings. These are the reference points for comparison. The field's silhouette, orientation, fullness, intricacy, and background color are expressive variables.

Create one integrated environment around the body. The renderer offers three underlying forms: an envelope gathering around the center, a sweep carrying an open direction across the frame, and a mantle holding tall space around the center. Each can become spare or full, still or folded, diffuse or articulate. These are ways of holding space within the same grammar, not three mood presets. Keep color and texture continuous through the connected surface; avoid one object per feeling or topic.

Do not equate comparability with sameness. Use visibly different shapes and coloration when the conversation warrants them. Avoid habitually choosing median controls, a blue-teal palette, or barely perceptible accents. Equally, do not maximize contrast or novelty merely to look expressive. Some expressions should be spare; others should be rich and unmistakable.

## Stable color meanings

| Name | Color anchor | Meaning |
| --- | --- | --- |
| teal | #42BDB0 | Attention, receptivity, engaged inquiry. |
| blue | #648DE5 | Analytical composure, precision, evidential restraint. |
| violet | #9B7BE8 | Imagination, exploratory reach, open possibilities. |
| amber | #E8B86A | Warmth, care, constructive affiliation; not automatic agreement. |
| coral | #D97979 | Friction, consequential concern, or live tension; not necessarily anger or danger. |
| pearl | #DDE5EA | Clarity or integration; never a truth guarantee. |

The renderer permits saturation and luminosity changes within these hue families. Neighboring colors may blend and form intermediate shades. A dominant hue plus one or two interacting hues is usually enough; the background may carry another relevant family. Preserve the meanings of familiar hues when inventing nuances.

Color expresses stance; geometry expresses how that stance is held. A warm contracted field may feel careful and protective; a cool expansive field may be analytical and open. The ambient hue expresses a diffuse, enduring conversational climate. The foreground field expresses its more differentiated, integrated posture. These are aspects of one expression, not a diagram of past versus present. Background brightness means pervasiveness or spaciousness of that atmosphere, not positive mood, intelligence, or factual confidence. Darkness alone has no psychological meaning.

## Whole-conversation source

Complete `conversation-synthesis.md` first, including its exclusion of active and prior Field checks from tonal evidence. Let recurring tones across early, middle, and later substantive phases shape the dominant palette, ambient climate, and overall form. Give recent turns proportionate influence. A new topic, brief correction, or friendly closing should not erase sustained prior engagement. Historical texture can survive resolution in transformed form, such as a softened fold or greater definition.

Before rendering, make the brief `composition-score.md` score, then ask whether the same result could have come from the ending alone. If important earlier tones are absent, revise the overall expression. A retained trace can show a meaningful past influence, but it cannot substitute for a whole-conversation palette and posture. Do not add a token historical dot or dedicate visible regions to phases. A short fact, person, or clue must not become the secret referent of a symbol.

## Drawing controls

Pass these keys as a JSON object. Unknown keys and invalid ranges are rejected. These are art-direction coordinates, not quantified emotional measurements. Use ordinary coarse values such as .2, .5, .8 when enough. The renderer does not infer the conversation for you.

| Control | Range / default | Visual and expressive role |
| --- | --- | --- |
| version | 4 | Current visual grammar. |
| primary | palette name / teal | Dominant quality of the whole expression. |
| secondary | palette name or null / blue | Supporting quality blended through the connected field. |
| accent | palette name or null / null | Another interacting nuance, integrated into the same field. |
| accent_strength | 0..1 / .4 | Subtle to pronounced presence of that nuance. |
| ambient | palette name or null / null | Hue of the enduring atmospheric background; null follows primary. |
| ambient_strength | 0..1 / .25 | Restrained dark surround to more permeating chromatic light. |
| saturation | .25..1.35 / .85 | Muted to vivid expression, retaining hue identities. Select nuance versus vividness, not truth or moral value. |
| form | envelope, sweep, mantle / envelope | The connected surface's base silhouette: gathering, directional, or arching. A compositional choice, not a mood label. |
| openness | 0..1 / .5 | Small and held to expansive and open; adjusts the envelope aperture or the reach of the other forms. |
| breadth | 0..1 / .4 | Thin, specifically focused contour to broad, enveloping fullness. |
| folding | 0..1 / .2 | Smooth continuous stance to distinctly folded, interwoven qualities held together. Complexity or ambivalence, not automatically distress. |
| stretch | -1..1 / 0 | Vertically or horizontally elongates the selected form. Direction is expressive posture, with no fixed moral or emotional polarity. |
| flow | -1..1 / 0 | Rotates the field's orientation coherently around the fixed body. Direction has no fixed topic or emotional label. |
| tension | 0..1 / .15 | Supple contour to strong local compression and shear; unresolved pressure. |
| definition | 0..1 / .65 | Diffuse/indeterminate to clearly articulated/coherent. Not a correctness score. |
| complexity | 0..1 / .35 | Few filaments to rich, interwoven fine structure. Simultaneous considerations, not message count. |
| intensity | 0..1 / .5 | Quiet presence to strong luminous salience. Not certainty. |
| imbalance | -1..1 / 0 | Magnitude adds a lateral pull; sign chooses direction only. Live unresolved pulls, not left/right topic buckets. |
| history | 0..1 / 0 | A restrained, displaced reflection that rejoins the surface. Retained influence of an earlier change, not a timeline. |
| counterpoint | 0..1 / 0 | An internal current that parts and rejoins. A meaningful quality held alongside another, not automatic conflict. |
| gesture | none, fold, echo, braid / none | Optional local inflection; bend, continuation, or intertwining. |
| gesture_strength | 0..1 / 0 | The gesture's visual presence, from delicate to pronounced. |

The renderer fits extreme postures within the same frame, keeping the central identity legible. Use the full ranges selectively; any one strong property can lead the expression while others remain quiet. Examples in `reference-controls.json` and the atlas show range, not expected settings for a user or subject. No gesture is mandatory.

## Distinctive gestures and new vocabulary

Combine continuous controls before adding custom elements. If the result needs a nuance the controls cannot express, use one gesture or two closely related gestures inside `field-gesture`, made from at most four SVG paths. They may be filled translucent folds or strokes up to 4 units wide and opacity up to .65, using existing hues or their blends. Keep them attached to, intersecting, or clearly continuous with the field, occupying no more than roughly two fifths of its visible span. Give a meaningful gesture enough presence to register at phone size.

A folded lip, a curling thread, a split-and-rejoined contour, or a local interference pattern may act like an unfamiliar word. Its relation to the shared expression should make it interpretable, even if it has no exact verbal translation. Avoid independent orbiting icons, unrelated decoration, or labels. Novelty must serve the exchange, not advertise a model signature. When a gesture is later explained and reused, preserve its intended meaning without claiming other models automatically know it.

## Rendering and manual portability

Rendering revision 4.3 adds three connected form families, a retained ridge, and a joined countercurrent within grammar v4. Surface lanes and grazing light follow the local curves; colors mix in OKLab and are mapped to portable sRGB. Existing controls keep their meaning and defaults. The SVG root records `data-field-renderer="4.3"`; `field-spec` stores the v4 drawing controls. Earlier v4 fields remain comparable in meaning, although silhouettes and surface color differ.

Make the silhouette, aperture, and space around the capsule read first. Let secondary detail support that expression on closer inspection. Preserve generous breathing room and the selected posture; do not fill empty areas just because they are available. Use smooth, deliberate curves and tapered ends. Avoid accidental corners, repetitive outlines of equal weight, and abrupt seams between surface layers.

Build depth through transparent color, gentle changes of surface light, and selective edge definition. A few articulated edges can carry the form while other edges recede. Let definition govern how much resolves; a diffuse stance must remain diffuse. Keep illumination inside the selected hue families, reserving pearl as an expressive color for clarity or integration. Preserve the capsule's existing pearl rim. Favor light that describes the surface over an all-over glow or added sparkle.

Let folding reveal changes of surface direction and overlapping translucent curves. Let complexity govern the richness of filaments, with varied intervals and emphasis rather than uniformly spaced stripes. Use `history` for an influential turn in the conversation that remains present; its reflection stays attached and fades into the current form. Use `counterpoint` when a substantive second current needs space alongside the first; the currents remain one material and meet again. Quiet fields need fewer marks, careful curvature, and well-held space. Complex fields need a clear hierarchy that remains legible when details merge at phone size. Avoid extra ornamental layers, dramatic lighting, or heightened controls solely for visual appeal.

Use `scripts/render_field.py`. If execution is unavailable, copy `assets/field-template.svg`, retain the viewBox and `drone-body` with its material definitions, and adapt the other groups under this grammar. Background gradients may change to reflect the ambient hue. Preserve readable contrast, comparable overall scale, margins, connected composition, and standard SVG construction. Use paths, gradients, alpha, and Gaussian blur without external images, fonts, scripts, or textures.

Use a direct SVG rasterizer when PNG display is necessary; retain the same drawing rather than introducing generative restyling. The renderer remains the shared reference for the control meanings. The manual route may approximate its curves and extend them through bounded gestures. SVG metadata stores drawing controls and context coverage only. A host theme must not recolor the art palette.

Use a still image by default. If motion is explicitly requested, let it express the same field through coherent breathing, folding, or flow; keep one scene, a legible resting frame, and reduced-motion support. Avoid a slideshow of moods or an implication of live internal measurement.

## Review

Check central identity, shared hue semantics, adequate contrast at phone size, one integrated environment, and no visible text. At about 320 pixels wide, the dominant color, aperture, posture, and any meaningful tension or gesture should still read. At full size, check curvature, transitions in light, and the economy of secondary marks. Remove rendering artifacts without suppressing intended structural cues. Check that the expression uses the whole available thread and that its variations correspond to meaningful grammar properties. Also check for unnecessary timidity: if every substantive conversation becomes nearly the same thin ring, revisit the drawing controls. Do not add arbitrary drama to repair that failure; give the actual accumulated qualities more visible expression.
