# Field

Field is a self-contained skill that renders a wordless SVG expression of a conversation's accumulated tone around a fixed central drone.

Rendering revision 4.2 adds grazing light, soft depth, and selective shadow to the curved, translucent surface while preserving the v4 visual grammar and synthesis protocol 3.2. Its artistic standard is to refine the expression without exaggerating the stance.

The skill instructions are in [`SKILL.md`](SKILL.md). Keep the `references/`, `scripts/`, and `assets/` directories together with it; the renderer uses only the Python standard library.

To render from drawing controls:

```bash
python3 scripts/render_field.py --spec controls.json --output field.svg
```

Run `python3 scripts/render_field.py --help` for the command options. The skill describes how to synthesize the conversation and choose the drawing controls before rendering.

The [reference atlas](assets/reference-atlas.svg) shows the range of the shared grammar. After changing the renderer, run `python3 scripts/build_reference_assets.py` to keep the atlas and portable template in sync.

The [Field visual reading guide](docs/field-guide.pdf) explains the palette, shape controls, gestures, and rendering revision 4.2 with examples made by the current renderer. Its source is [docs/build_field_guide.py](docs/build_field_guide.py); rebuilding it requires ReportLab, Pillow, Cairo, librsvg, and Liberation fonts.
