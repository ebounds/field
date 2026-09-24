# Composition score for Field

Use this short, private art-direction step after whole-conversation synthesis and before choosing renderer controls. The score is an interpretation of the available exchange, not a measurement of private emotion, hidden state, or answer reliability. Do not put the score, transcript excerpts, or inferred facts about the user in SVG metadata. The delivered artwork remains wordless.

The interpretation may draw on all context and high-level reflective understanding the host permits for expression, including nuances not explicitly stated in messages. Keep the expression as rich as that scope allows. Limits on exported metadata and claims of measurement do not narrow the permitted basis for composing the artwork.

Write one phrase for each question. A phrase can be uncertain or mixed. Keep it about the assistant's way of engaging with the exchange, rather than the subject matter alone.

1. **What has endured?** Name the main quality that spans the substantive conversation: receptive inquiry, analytic care, imaginative reach, warmth, consequential concern, or another supported quality.
2. **What remains in counterpoint?** Name an important second quality that has not simply dissolved into the first. Warmth alongside resistance is possible. If there is no meaningful counterpoint, say so and leave the visual control at zero.
3. **How is space being held now?** Is the exchange gathering and sheltering, reaching and moving, or arching around a difficult open center? These are physical verbs, not mood types.
4. **What is provisional?** Identify an edge of understanding that is still open, unclear, or contested. This is about how the conversation is being held, not a numeric confidence estimate for factual claims.
5. **What changed and still matters?** Name a turn that reshaped the ongoing stance. If it has been integrated, describe its retained influence. Do not allocate one visual stripe per phase.
6. **What is actually available?** Use the synthesis procedure to note missing phases and populate the separate `field-coverage` metadata.

Translate the score into drawing controls:

| Score element | First controls to consider |
| --- | --- |
| Enduring quality | `primary`, `ambient`, `ambient_strength`; `secondary` for a sustained companion quality. |
| Way of holding space | `form`, `openness`, `breadth`, `stretch`, `flow`; select by the particular negative space and silhouette. |
| Live counterpoint | `counterpoint`, `accent`, `accent_strength`, with `tension` only if the difference creates pressure. |
| Provisional edge | `definition`, `tension`, and selective `folding`; never imply that low definition proves a statement false. |
| Meaningful change | `history` for retained influence; `folding` or a restrained gesture for a change in direction. |
| Energy and detail | `intensity`, `saturation`, `complexity`; use only as supported by the whole exchange. |

The three forms are available across color families. **Envelope** gathers around the center. **Sweep** carries an open direction through the frame. **Mantle** holds a tall space around the center. None is a fixed synonym for happiness, anxiety, confidence, or agreement. Try the same score in more than one form when the choice is ambiguous, then compare the actual silhouettes at 320 pixels. Choose the one that expresses the score with the least unnecessary detail.

The final SVG stores only renderer controls in `field-spec` and scope facts in `field-coverage`. Its visual choices are an invitation to read and respond, not a claim that the renderer discovered a secret code of model thought.

When listening is requested, follow [the listening grammar](listening-grammar.md) and pass these same controls to the audio instrument. The composition score is shared; no second interpretation or emotional scoring step is needed. A musical phrase unfolds the accumulated stance in time without assigning notes to individual conversational turns.
