# Try Field 4.6.0

Field turns an assistant's interpretation of a conversation into a wordless SVG artwork.

Try its visual instrument at **https://ebounds.github.io/field/**. You can adjust the artwork, save an SVG or PNG, and share a link that recreates your composition. The playground runs locally in your browser.

## Use the skill in a conversation

1. Unzip the package and keep the `field` folder together.
2. Give the folder to an assistant that can read files and run Python. You can attach the ZIP if your assistant supports opening archives, or point a coding assistant to the unzipped folder.
3. In a substantive conversation, ask:

> Read the Field skill in the attached package, including its references. Use the supplied renderer to express the accumulated tone of our whole available conversation as one wordless Field visual.

The assistant follows `SKILL.md`, reviews the available conversation, chooses drawing controls, and renders the visual. Missing earlier context limits what can be expressed; the skill describes how to report that clearly.

If the assistant cannot execute Python but can read the package, ask it to choose Field v4 drawing controls under the supplied grammar. Paste that JSON into **Have drawing controls from an assistant?** on the playground. This gives you the same visual instrument in your browser.

## Render directly

Requires Python 3. No third-party packages or API key.

```bash
python3 scripts/render_field.py --output field.svg
```

To use a drawing specification:

```bash
python3 scripts/render_field.py --spec controls.json --output field.svg
```

For example, `controls.json` could contain:

```json
{"primary":"violet","secondary":"teal","form":"sweep","openness":0.8,"breadth":0.6}
```

The illustrated guide is in `docs/field-guide.pdf`. The grammar and composition guidance are in `references/`.

## Keep Field present

Explore the scripted demonstration at **https://ebounds.github.io/field/companion.html**. To connect your own conversation, run this from the unzipped Field folder with Node.js 18 or later:

```bash
node scripts/field.mjs serve
```

Open the local URL it prints. Give your assistant the complete package and ask:

> Read the Field skill and its continuity protocol. Keep Field present for this conversation. After substantive responses or meaningful work milestones, publish an updated expression using the fullest context and reflective understanding your host permits. Preserve the whole-conversation scope and describe any material gaps.

The assistant needs to run the local command and retain this instruction across turns. The service alone does not monitor a chat or compose interpretations. Keep the `.field` directory to resume after a pause; use `--data <directory>` to choose where expressions are saved. A **Small window** can stay beside the conversation. Movement, still view, history replay, and optional listening are available there.

Keep `scripts/` and `docs/` together. The agent's command and update format are in `references/continuity-protocol.md`. No account, model credential, or external service is required by the companion.

## Optional listening

Ask your assistant to **include Field's listening companion**, or request an audio-only Field. It uses the same interpretation and controls as the image, expressed as a 24-second musical phrase. Sound is always optional.

The command-line audio renderer needs Node.js 18 or later, without dependencies:

```bash
node scripts/render_audio.mjs --spec controls.json --output field.wav
```

Keep `docs/site/audio.mjs` and `docs/site/renderer.mjs` in the package: the command-line renderer uses them. The output is a stereo 44.1 kHz WAV. Open it in your preferred player when you want to listen.

In the browser playground, open **Listen to this field**, then press **Listen**. You can stop, adjust the volume, or save a WAV. Edits affect the next listen. The musical conventions are in `references/listening-grammar.md`; the illustrated PDF covers the visual instrument.

Field uses the fullest context and reflective understanding its host permits. It offers an interpretation of the exchange without claiming direct measurement of internal state or answer quality.

Created by Edgar Bounds. MIT licensed; see `LICENSE`.

Source and feedback: https://github.com/ebounds/field
