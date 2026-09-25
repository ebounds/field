# Field Companion 1.0.1 / package 4.6.0

Field can remain present across a conversation when the user asks for continuous use. The participating assistant composes each update using the full host-permitted scope described in `SKILL.md` and `conversation-synthesis.md`. The local companion stores and displays those expressions. It does not read conversations or call a model independently.

## Enable for a selected conversation

1. Read the installed Field skill, synthesis procedure, composition score, and visual grammar. Read the listening grammar when sound is requested.
2. Start the local companion, or use the user's already running instance:

   ```bash
   node <skill-root>/scripts/field.mjs serve --port 8767 --data <local-state-directory>
   ```

   Node.js 18+ is required, without extra packages. The default state directory is `.field` in the command's working directory. Keep that local directory out of source control. The service listens only on `127.0.0.1`; the local browser address is printed. Start it using the host's ordinary long-running process facilities. Opening a page or starting the service does not start sound.
3. Select a stable conversation ID. Prefer a host-provided thread ID when available; otherwise choose a distinct local ID and keep using it for this conversation. Use a new ID for a fork or separate exchange. Give it a human-readable title. Record the chosen ID and server address in ordinary session context.
4. After a substantive response or meaningful work milestone, synthesize the accumulated conversation and publish one update. A continuous-use instruction governs this selected conversation until the user disables it. Do not require another standalone Field invocation each time.

The participating assistant or a host lifecycle integration must actually perform step 4. Installing the skill, leaving the page open, or starting the server alone does not create automatic interpretation. Hosts without a reliable per-turn instruction/hook may miss updates; their update time stays visible. This release supplies a local publishing command, not transparent monitoring of every chat application.

## Compose and publish

Read the current record before selecting the next sequence:

```bash
node <skill-root>/scripts/field.mjs read --conversation <conversation-id>
```

A missing record means this is the first update. Use sequence 1. Otherwise increment the latest sequence. Do not overwrite an existing sequence or publish a stale result from an earlier parallel operation. A conflict requires reading the current record and deciding whether a new interpretation is still appropriate.

Write a JSON file containing:

```json
{
  "version": 1,
  "conversation": "our-inquiry",
  "sequence": 1,
  "title": "Our continuing inquiry",
  "source": {
    "kind": "participant",
    "producer": "Participating assistant",
    "turn": "turn-001"
  },
  "coverage": {
    "early": "available",
    "middle": "available",
    "late": "available",
    "basis": ["verbatim"],
    "gaps": "none identified"
  },
  "transition": "reach",
  "spec": {
    "version": 4,
    "primary": "violet",
    "secondary": "teal",
    "form": "sweep",
    "openness": 0.8,
    "breadth": 0.65,
    "history": 0.45
  }
}
```

The values above demonstrate syntax; choose the actual controls and coverage from the conversation. `source.turn` identifies the source boundary. Use a real turn reference if exposed by the host, or an honest local boundary label. `producer` names the actual author. Use `observer` when a separate model interprets supplied material. `scripted` is reserved for the public demonstration and is rejected by the live publisher.

Coverage values are `available`, `summarized`, `partial`, or `missing`. The basis lists `verbatim`, `summary`, and/or `retrieved_excerpts`. Explain material gaps briefly. These describe accessible conversation evidence; they do not limit the permitted reflective basis of expression. Never claim direct access to missing messages or measurements the host does not supply.

Choose a transition by how the change should unfold: `gather`, `reach`, `hold`, `settle`, `return`, or `reorient`. These set restrained timing and easing. The target remains ordinary Field v4 controls. On first publication the artwork appears as a still; subsequent updates can move into it. The capsule stays fixed. With nonzero `history`, the companion joins an actual earlier contour to the current surface when a prior expression is available.

```bash
node <skill-root>/scripts/field.mjs validate --file <update.json>
node <skill-root>/scripts/field.mjs publish --file <update.json>
```

Use `--url http://127.0.0.1:PORT` for a different local port. The result supplies the selected conversation's browser URL. The server assigns the publication timestamp and stores the update before sending it to viewers. Keep timestamps about freshness separate from interpretive qualities.

## Continuity notes for the agent

Optionally keep a small, revisable index to substantive phases in a separate JSON file:

```json
{
  "phases": [
    {
      "name": "Opening",
      "references": ["turn-001", "turn-003"],
      "note": "An exploratory exchange with a sustained concern about clarity."
    }
  ],
  "open_questions": ["How much movement serves the expression?"],
  "direction": "Explore a continuous companion while preserving the shared grammar."
}
```

Publish it with `--ledger <context.json>`. The ledger is replaced as a whole when supplied; omitting it preserves the existing ledger. Preserve opening, middle, and later phases and revisit actual source material as available. These notes are high-level, revisable interpretation and an index to evidence. Do not place protected reasoning, secret information, raw transcripts, or the private composition score in them. The host's disclosure rules govern every output medium.

`read` returns these notes with the composition history so the agent can reorient after a pause. The browser stream and exported artworks/history omit the ledger. The service keeps up to 80 recent compositions for replay, while retaining the separate phase index. Earlier artwork remains artistic calibration, not evidence from which to infer the conversation's tone. Repeated Field checks remain excluded from tonal evidence under the synthesis procedure.

## Receiving and presenting updates

- One display follows one selected conversation. Switching conversations clears the previous presentation and stops its audio.
- Movement connects the shared renderer's corresponding paths and colors. New updates can continue from the currently displayed geometry; settled endpoints use the complete target artwork.
- Still mode and the operating system's reduced-motion preference show the target directly. Hidden tabs stop transitions at their target and stop replay and sound.
- History is labeled. A new live expression does not interrupt someone inspecting an earlier one; **Return to current** makes the new expression available.
- The last valid expression persists across a disconnect, with an offline indication. Freshness reflects the last publication, even when the transport is connected.
- The current 24-second listening portrait remains optional. Ordinary updates, replay, restore, and shared URLs never begin audio playback. Ongoing ambient music is outside this release.

## Local HTTP interface

The command is the recommended agent entry point. For integrations on the same machine:

- `GET /api/status`: local conversation list and last publication times.
- `GET /api/state?conversation=ID`: selected public composition history.
- `GET /api/context?conversation=ID`: the same history with the local phase ledger.
- `GET /api/events?conversation=ID`: server-sent `field` events containing the selected public state. Reconnection sends current history.
- `POST /api/publish`: `{ "update": <record>, "ledger": <optional notes> }`, with `Content-Type: application/json` and `X-Field-Client: 4.5`.

Requests are restricted to the local origin, updates to 64 KiB, and sequence numbers to strictly increasing integers per conversation. The server rejects unknown controls, invalid coverage, duplicate or stale updates, and scripted sources. State writes are serialized and use atomic rename. It does not accept remote servers, collect unrelated conversations, or provide a model credential store.

When the user disables continuous Field, cease publishing. Keep their saved expressions unless they request deletion. The viewer's still mode changes presentation only; it does not disable the agent's publishing instruction. A host without persistent execution can still publish to an instance the user runs, or return ordinary Field artifacts.
