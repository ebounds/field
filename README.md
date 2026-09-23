# Field

**The shape of thinking together.**

A visual language for the accumulated tone of an AI conversation: attention, imagination, care, uncertainty, and tension, held in a wordless work of art.

[**Try the live playground →**](https://ebounds.github.io/field/) · [Download the skill](https://ebounds.github.io/field/downloads/field-4.3.zip) · [Illustrated reading guide](https://ebounds.github.io/field/field-guide.pdf)

[![Field: a luminous membrane around a titanium capsule. The shape of thinking together.](docs/site/social-card.png)](https://ebounds.github.io/field/)

Field asks an assistant: **“What has it been like to think with me through this whole conversation, as expressed now?”**

The assistant reads the available exchange, forms a brief composition score, and chooses drawing controls under a shared visual grammar. A fixed titanium capsule anchors the image. Around it, a translucent field gathers, sweeps, folds, and rejoins.

Field offers an interpretation of the conversation and the assistant's way of engaging with it. It makes no claim to read hidden model state or measure answer quality. Its usefulness is open to experimentation.

## Try it now

The [browser playground](https://ebounds.github.io/field/) has six starting studies, live controls, SVG and PNG downloads, and links that recreate a composition. It runs in your browser with no account or API key. You can also paste Field v4 JSON controls chosen by an assistant.

## Use Field in a conversation

1. [Download Field 4.3](https://ebounds.github.io/field/downloads/field-4.3.zip) and unzip it, or clone this repository.
2. Give the package to an assistant that can read files and run Python.
3. In an existing conversation, ask:

> Read the Field skill in the attached package, including its references. Use the supplied renderer to express the accumulated tone of our whole available conversation as one wordless Field visual.

Keep `SKILL.md`, `references/`, `scripts/`, and `assets/` together. The renderer uses Python's standard library. See the [quick start](docs/quickstart.md) for other ways to use the package.

```bash
python3 scripts/render_field.py --spec controls.json --output field.svg
```

Omit `--spec` to draw the default field. Open the SVG in a browser or any SVG viewer.

## The visual language

Revision 4.3 offers three connected forms: an **envelope** gathers around the center, a **sweep** carries an open direction, and a **mantle** holds tall space. A retained trace can carry an earlier influence; a joined countercurrent can hold a second quality alongside the first.

Color has a shared convention. Teal suggests attention; blue, analytical composure; violet, imagination; amber, care; coral, live tension; pearl, integration. Geometry expresses how those qualities are held. A private composition score connects the whole-conversation reading to the drawing choices.

[![Six Field studies](assets/reference-atlas.svg)](https://ebounds.github.io/field/#playground)

Read the [visual grammar](references/visual-grammar.md), [composition score](references/composition-score.md), [whole-conversation synthesis](references/conversation-synthesis.md), or [4.3 design note and research](docs/field-4.3-design.md).

## Develop or contribute

The Python renderer is the reference implementation. The browser renderer mirrors it and is checked against it:

```bash
python3 scripts/check_browser_renderer.py
```

That check requires Node.js. To rebuild reference art and public downloads:

```bash
python3 scripts/build_reference_assets.py
python3 scripts/build_public_assets.py
```

Serve the demo locally with `python3 -m http.server 8080 --directory docs`. The site is static HTML, CSS, and JavaScript. GitHub Pages publishes `docs/` from `main`.

The [guide builder](docs/build_field_guide.py) requires ReportLab, Pillow, Cairo, librsvg, and Liberation fonts. The social card source is `docs/site/social-card.svg`; rasterize it at 1200 × 630 after changing the artwork.

Share an artwork, an interpretation, a rendering issue, or a proposed improvement in [Issues](https://github.com/ebounds/field/issues). Particularly useful comparisons keep the same ending while changing earlier phases of a conversation, or distinguish warm agreement from warm disagreement.

Created by [Edgar Bounds](https://github.com/ebounds). Released under the [MIT license](LICENSE).
