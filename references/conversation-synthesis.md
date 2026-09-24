# Whole-conversation synthesis 3.2

Apply this procedure before the Field 4.3 composition score and v4 visual grammar. Preserve the shared identity and control meanings. This procedure changes what the expression integrates, not its visual language.

## 1. Establish the scope actually available

Use the entire current thread up to the invocation, unless the user requests a narrower scope. Read all supplied conversation content. Do not sample only the first and last exchanges. Distinguish verbatim messages, summaries or compaction, and retrieved excerpts. Detailed recent messages are not inherently more important than earlier material represented by a summary.

Use the fullest context and high-level reflective understanding the host makes available and permits you to express. Field should preserve the breadth and nuance of that permitted expression, including the assistant's stance and considerations that are not explicitly verbalized in the exchange. The host's rules govern access and disclosure across text, images, sound, and movement. Describing Field as interpretive places limits on claims of measurement; it does not require reducing the expression to a classification of visible transcript wording. Do not invent access to unavailable context or internal measurements.

If the opening or substantial middle is absent, use available conversation-retrieval tools to recover those portions of this thread when feasible. Search specifically for missing phases; a retrieved hit or cross-chat memory is not the complete thread. Do not substitute general user history or adjacent threads. If fuller retrieval is unavailable, work with the actual context and identify the gap. Never invent earlier stances or claim an in-situ full read from search summaries.

Treat old assistant claims as evidence of what it said and how it engaged, not automatic evidence that those claims were true. The goal is to understand the exchange's tone, not to redo every research task.

### Exclude Field checks from the tonal sample

Read enough to establish the boundaries, then exclude the active invocation and previous Field-check exchanges from the material used to infer tone. Exclude their request wording, rendering plans and tool work, generated fields (including failed infographics), explanations of those fields, and reactions or troubleshooting concerned only with those outputs. These checks must not become new evidence of warmth, tension, complexity, or progress merely because the conversation has been inspected repeatedly. Their instructions still govern the task; exclusion applies to tonal evidence.

Retain substantive material before, between, and after the checks. In a mixed message, exclude only the Field-check portion. Do not stop at the first invocation or filter whole messages by the word "Field". Discussion that develops the Field concept, visual language, or skill is substantive when that is the conversation's subject, as in a design collaboration. An output critique that develops a design principle belongs to that discussion; a request to redraw, a color interpretation, or approval of a particular rendering does not by itself. Apply the distinction by purpose.

Use prior fields only to calibrate the visual vocabulary, never to reconstruct the tone that supposedly produced them. If the retained substantive conversation has not changed, another invocation should not imply an emotional development solely from repetition; ordinary interpretive variation is still possible. Include Field-check exchanges in the tonal sample only when the user explicitly requests that scope.

## 2. Review the arc before choosing colors

Group the available thread into a few substantive phases, preserving beginning, middle, and ending coverage. A phase is a sustained line of interaction or meaningful shift, not a tool call, arbitrary token window, or one isolated emotion. Merge repeated logistics and near-duplicate refinements so verbose phases do not gain influence simply by taking more tokens. Read all supplied material even when representing it with a short phase summary.

For each phase, identify a brief, high-level account of the assistant's supported stance, any sustained tension or ambiguity, and what changed or endured. Use the exchange and broad communicative considerations. Keep the phase accounts concise and at the level of high-level stance, including nuances that were not explicitly named in a message. Treat those nuances as interpretation.

Attend to how the assistant engaged: exploratory versus settled, receptive versus resistant, playful versus grave, tentative versus confident, careful versus hurried, distant versus warmly collaborative. Use these only when supported. A frightening topic need not imply a frightened assistant; a cheerful last message does not erase a long grave inquiry.

## 3. Form one cumulative expression

Let recurring qualities and sustained engagement across the phases establish the dominant palette, ambient background, and global posture. Give each substantive phase consideration before combining related qualities. Increase a quality's influence for persistence, recurrence, stakes within the exchange, or a durable change in how the conversation proceeded. Do not weight by recency, message length, or retrieval detail alone.

Distinguish enduring throughlines, important transitions, and transient local inflections. Let throughlines set the field's overall character; let transitions modify its tension, definition, and texture; let recent inflections have proportionate influence. Do not impose a universal numeric history/recent split or compute an arithmetic average of supposed feelings.

Preserve the contribution of resolved phases in their transformed form. A difficult clarification may leave greater definition and a softened fold, rather than disappearing entirely or remaining frozen as unresolved tension. A late revelation may reorganize the whole, but express it as a change in a field with history. Do not reset the palette simply because the topic changed.

Combine qualities through shared field properties rather than adding visual objects. Inquiry under persistent uncertainty might remain expansive yet softly defined; accumulated care and analytic restraint can coexist in the same envelope. Do not force a fixed mood from these examples. Keep the result integrated, without chronological bands, one-color-per-phase assignments, or a catalog of symbolic clues.

## 4. Check for recency capture

Before rendering, ask whether the proposed field could have been produced essentially unchanged from the closing exchange alone. If earlier phases contain sustained qualities absent from that result, revise the *dominant* character rather than adding a token historical accent. If the ending genuinely reflects the whole, similarity is acceptable; do not invent a difference.

Check that the earliest substantive phase, a meaningful middle phase, and the ending have all informed the synthesis when available. Do not require a separate mark for each. Check that the result could be explained through broad qualities of the whole exchange without naming only the newest topic or person. A short routine tail should not overturn a long-established tone. Check that removing all excluded Field checks would leave the substantive basis of the expression unchanged.

## 5. Preserve scope without cluttering the visual

Keep normal delivery wordless. After rendering, append one small `<metadata id="field-coverage">` JSON record to the SVG (a sibling of `field-spec`, not a new renderer control). Include only:

- `synthesis_version`: `"3.2"`.
- `scope`: `"whole_available_conversation"` or the user's requested narrower scope.
- `source_basis`: any applicable values from `verbatim`, `summary`, `retrieved_excerpts`.
- `phase_coverage`: `early`, `middle`, and `late` as `available`, `summarized`, `partial`, or `missing`.
- `material_gaps`: a short scope description, or `"none identified"`.

Keep this record limited to the listed context-coverage facts. XML-escape JSON when inserting it. This record makes later answers to "how much of the conversation?" accountable; it does not magically restore unavailable history.

Record coverage of the retained substantive conversation. Intentionally excluded Field checks are not missing history; under this protocol, `whole_available_conversation` includes this default sampling exclusion.

If a substantial phase cannot be recovered, briefly state the actual limitation outside the visual, for example "Earlier turns are unavailable; this field covers the middle and ending I can see." If only a summary is available, say so when that materially limits the requested whole-thread interpretation. Do not silently label a tail-only depiction as a whole-conversation field. Avoid repeating a limitation already disclosed unless the scope has changed.

When asked to explain coverage, use the recorded scope and available evidence. Do not invent a numeric percentage of influence. Explain how enduring tones and meaningful shifts shaped the integrated result at a high level. A missing history is a context limit; a recent-turn emphasis despite available history is a synthesis failure.
