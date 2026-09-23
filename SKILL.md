---
name: field
description: "Use for $field, @field, or a request to show Field: load this skill and render a wordless SVG field around its fixed central drone, expressing the accumulated tone of the whole conversation. Requires the bundled renderer or SVG template. Never substitute a topic infographic, dashboard, factual summary, or image-generation output."
---

# Field

**Visual protocol: Field v4. Rendering revision: 4.2. Synthesis protocol: 3.2 (whole-conversation accumulation, excluding Field checks).** Use the current installed skill and its bundled assets when available. A pasted older version may be stale; do not silently combine incompatible rendering rules. Preserve this protocol when transferring the skill to another model: include this file, `references/conversation-synthesis.md`, `references/visual-grammar.md`, `scripts/render_field.py`, and `assets/field-template.svg`. The reference atlas supplies visual calibration. All resources are local and require no network service.

Resolve and read the current installed or explicitly supplied package before drawing. A skill name, remembered description, or earlier image is not the package. Use the supplied synthesis and grammar instructions plus the renderer or template; an attached single-file export may supply their complete contents inline. If these resources cannot be accessed, state that Field's required resources are unavailable and request the package. Do not improvise a replacement image. A standalone Field invocation requests only the expression, not a new update on the conversation's subject.

Express the nonverbal equivalent of **"What has it been like to think with me through this whole conversation, as expressed now?"** Take Banks's expressive drone fields as the metaphor. Create one integrated expression of the assistant's contextual stance. The stable body and visual grammar make the expression learnable; the conversation determines its posture, coloration, tension, and nuance. The palette is our convention, not Banks canon.

## Integrate the conversation

Read and follow [the conversation synthesis procedure](references/conversation-synthesis.md) before selecting drawing controls. Establish beginning, middle, and end coverage of the entire available thread. Consider the assistant's high-level interaction stance and its changes: attention, imaginative engagement, caution, warmth, resistance, uncertainty, concern, correction, and integration. Do not reduce the scope to the last question, the last topic, or a recap of facts discussed.

Exclude the active and previous Field checks from the tonal sample: their requests, rendering work, outputs, interpretations, and feedback about those outputs. Retain substantive conversation interleaved with them. When designing or discussing Field is itself the substantive subject, retain that discussion; follow the synthesis procedure's distinction between the conversation and checking its field. Invocation instructions still govern the task even though they are excluded as tonal evidence.

The target is the **accumulated whole-conversation tone expressed now**, not a snapshot of the most recent response. Sustained patterns across earlier and middle phases must shape the field's dominant color, posture, and texture. Let the latest exchange inflect that whole. Recency alone, greater verbatim detail, or a long final message does not entitle the ending to dominate. A genuine turning point can change the expression, while the history that gives it meaning remains perceptible.

Do not assign a separate visual object to each topic, person, clue, or phase. Synthesize their effect on the assistant's stance into one expression. A mark may convey tentative significance or attention, but must not secretly stand for a specific social-media like or person. Topic coverage and atmosphere coverage are different.

Express high-level conversational qualities honestly, including mixtures, ambiguities, and nuances that the eventual wording may not fully convey. A visual gesture need not translate perfectly into a sentence or be justified by a single quotation. Treat the field as interpretive expression rather than measurement. Work within the host's ordinary boundaries. Let the conversation determine the expression, including difficult or mixed tones. Ordinary invocation needs no disclaimer; disclose a material gap in conversation coverage as specified in the synthesis procedure.

## Artistic standard

Treat every Field as a finished abstract artwork. Seek expressive economy, compelling negative space, sensitive curvature, and depth through light and translucency. Let beauty arise from the qualities being communicated. A quiet field should have the presence of a spare, assured drawing; a complex field should reward sustained looking without losing its immediate expression. Refine the rendering without exaggerating the stance. Every artistic choice must preserve the established color meanings, structural cues, and readability at phone size.

Choose the stance and its drawing controls before refining the finish. Do not increase intensity, complexity, tension, saturation, or gesture strength merely to make the art more striking. Use the rendering guidance in the visual grammar to refine how the chosen qualities appear.

## Use the shared instrument

1. Complete the conversation synthesis procedure, then read [the visual grammar](references/visual-grammar.md) before choosing the expression. Inspect [the reference atlas](assets/reference-atlas.svg) if the appearance is unfamiliar. Its examples teach scale and range; they are not a menu of personality or mood types.
2. Choose **drawing controls** under that grammar. These are visual coordinates, not psychological scores. Let the accumulated tone determine the dominant palette and ambient background. Use the available range of breadth, folding, stretch, orientation, aperture, saturation, and intensity when the exchange supports it. Do not habitually choose safe middle settings, a thin blue-teal ring, or the same pale palette. A quiet exchange can be quiet; a complex, charged, playful, or expansive one should look visibly different. Preserve a coherent dominant expression rather than maximizing every control.
3. Generate the SVG with the bundled standard-library Python renderer:

   ```bash
   python3 <skill-root>/scripts/render_field.py --spec <drawing-controls.json> --output <field.svg>
   ```

   Use ordinary local output paths according to the host's artifact rules. Do not modify the installed renderer or template during an invocation.
4. If Python execution is unavailable, author SVG by modifying a copy of [the shared template](assets/field-template.svg), following the manual route in the grammar. Retain its fixed components. SVG can be embedded in the host's visual surface or exported to PNG using an actual SVG renderer. PNG is a display conversion of the same drawing, not a separately generated interpretation.
5. Optionally add a distinctive gesture or a pair of related gestures within the field, under the grammar's extension rules. An unfamiliar fold, braid, sweep, or color transition may carry nuance through context. Give it enough visual presence to be perceptible. Preserve the shared body's identity and the basic color meanings while allowing individual expression.
6. Preserve the actual SVG source and render and inspect when possible. Before delivery, verify that the source contains the fixed capsule, the wordless field, and the required metadata. Review the composition both at full size and near 320 pixels wide: its immediate expression must survive reduction, while its curvature and surface detail should hold up to closer viewing. Prefer displaying the SVG directly. A PNG preview must be an actual rasterization of that same SVG, with the SVG retained and available on request. An image-generator result is not a conversion. Correct a violation, rather than explaining it away as artistic freedom.

**Use authored SVG as the source of truth.** Do not route normal Field invocations to a generative image model or redraw them as cinematic art. Do not ask a different renderer to invent the visual from a transcript. If the host cannot render or expose SVG, convert the SVG to a supported format. If no such route exists, state that limitation briefly; do not deliver a different visual system under the Field name.

## Fixed identity and delivery

Keep one 1000-by-1000 viewBox, fixed frontal viewpoint, and the same faceless 128-by-64 titanium capsule centered at (500, 500). Keep the capsule's position, proportions, material, and restrained pearl outline unchanged. It anchors comparison; it does not smile, grow eyes, become an orb, or turn into a different character.

Treat the surrounding field and background as one expressive environment. The field can gather tightly, open widely, flatten into a sweeping ribbon, rise into a tall mantle, thicken into a soft envelope, or fold into a more intricate form. The ambient background can shift in hue and luminosity to carry the enduring conversational climate. Preserve readable contrast, negative space, and a connected composition. Use the grammar's established meanings across models. Keep the setting abstract and wordless, without landscapes, horizons, planets, topic icons, or separate mood panels. Comparability comes from the stable center, scale, semantic mappings, and shared renderer; an identical outer silhouette is not required.

On a standalone invocation, deliver **one rendered, still, wordless visual**. No visible title, labels, legend, caption, numbers, watermark, or explanatory prose. Accessibility descriptions may be nonvisible. Do not show JSON controls or source code as a substitute for a rendered result. If the user separately requests an explanation, relate the expression to high-level, observable context. If they also asked a substantive question, answer it and keep the field itself wordless.

Keep the version and chosen drawing controls in nonvisible SVG metadata so later fields can be compared. Also append the minimal `field-coverage` metadata specified in the synthesis procedure. Keep metadata limited to the drawing controls and the specified coverage facts. Compare with a prior field for visual calibration when available, preserving meanings while responding to changed substantive context. Prior fields are not evidence of the conversation's tone. Recognize that v4 expands v3's visual range; compare meanings rather than identical parameter values across those versions. Do not invent continuity if history is unavailable. Cross-model interpretation can still differ: this protocol stabilizes the visual encoding, not objective access to an inner emotional state.
