# Adding a conversation

Each entry is one page plus a folder holding its field.

1. **Copy the field the assistant actually drew.** Put it at `docs/conversations/<slug>/field.svg`, unchanged, with its `field-spec` and `field-coverage` metadata intact. Save the drawing controls next to it as `controls.json`. If the original file is gone, redraw it only from its recorded controls with the same renderer revision, check that the redraw is identical from run to run, and say on the page that it was redrawn. Never replace the field with a newer renderer's drawing. With the person's approval, the same controls on the current renderer can appear lower on the page as a labeled update (`figure.conv-update`, saved as `field-<version>.svg`), like the one on `zero-hour.html`.
2. **Copy `quiet-week.html` to `<slug>.html`** and replace the content:
   - The header: eyebrow number (`Conversations / 002`), title, one-sentence lead, and the meta line (date, participants and model, turn count, which turn the field was drawn after).
   - The figure: `alt` text describing what the field looks like (not what it means).
   - The versions panel (`dl.conv-versions`): the model and where it ran; the Field package, or for an installed skill, its grammar, rendering and synthesis versions (read them from the SVG's `data-field-version` and `data-field-renderer` attributes and its coverage record); any observers; and the date. If the installed renderer predates the numbered packages, name the matching commit.
   - The turns. Each `<li class="turn">` gets a short label and a summary for each speaker. Mark the turn where the field was drawn with `class="turn drawn"`, put the `<li class="boundary">` note right after it, and give every later turn `class="turn after"`. If a field was drawn at the very end, leave out the boundary and the after-turns.
   - "What the field could see", the drawing controls and the coverage record from the SVG, and any sources.
3. **Add a card** to the top of the list in `docs/conversations/index.html`, newest entry first, with the model and Field version in its meta line.
4. **Add the page** to `docs/sitemap.xml`.

## Writing the turn summaries

- Summarize each turn in a few sentences. Paraphrase; keep any direct quotes short.
- Say what each side actually did, including retractions and mistakes. The point of the archive is the relationship between the exchange and the field, and the uncomfortable turns are often the ones that matter.
- Leave out anything private or identifying that isn't needed. Everyone in the exchange should review the page before it's published.
- Keep the assistant's own reading of a field clearly labeled as its interpretation, written after the fact.
