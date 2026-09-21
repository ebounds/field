# Field

Field is a self-contained skill that renders a wordless SVG expression of a conversation's accumulated tone around a fixed central drone.

The skill instructions are in [`SKILL.md`](SKILL.md). Keep the `references/`, `scripts/`, and `assets/` directories together with it; the renderer uses only the Python standard library.

To render from drawing controls:

```bash
python3 scripts/render_field.py --spec controls.json --output field.svg
```

Run `python3 scripts/render_field.py --help` for the command options. The skill describes how to synthesize the conversation and choose the drawing controls before rendering.
