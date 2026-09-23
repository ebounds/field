# Field

Field is a self-contained skill that renders a wordless SVG expression of how an assistant has engaged with a conversation, around a fixed central drone. It interprets the available exchange; it does not claim to reveal hidden model state or measure answer quality.

Rendering revision 4.3 adds three connected forms (envelope, sweep, mantle), a retained trace, and a joined countercurrent. A brief composition score helps turn the whole-conversation reading into visual choices. Colors blend in OKLab, and the SVG remains portable and wordless. The v4 palette, fixed central capsule, and synthesis protocol 3.2 remain the shared reference points.

The skill instructions are in [`SKILL.md`](SKILL.md). Keep the `references/`, `scripts/`, and `assets/` directories together with it; the renderer uses only the Python standard library.

To render from drawing controls:

```bash
python3 scripts/render_field.py --spec controls.json --output field.svg
```

Run `python3 scripts/render_field.py --help` for the command options. The skill describes how to synthesize the conversation and choose the drawing controls before rendering.

The [reference atlas](assets/reference-atlas.svg) shows the range of the shared grammar. After changing the renderer, run `python3 scripts/build_reference_assets.py` to keep the atlas and portable template in sync. The [composition score](references/composition-score.md) and [visual grammar](references/visual-grammar.md) explain how to choose controls; the [4.3 design note](docs/field-4.3-design.md) explains the experiment.

The [Field visual reading guide](docs/field-guide.pdf) explains the palette, forms, controls, and gestures with examples made by the current renderer. Its source is [docs/build_field_guide.py](docs/build_field_guide.py); rebuilding it requires ReportLab, Pillow, Cairo, librsvg, and Liberation fonts.
