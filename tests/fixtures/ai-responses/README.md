# AI response fixtures

Recorded AI responses used by Layer 3 persona tests. Each fixture is a
deterministic replay of what the real Anthropic API returned for a given
prompt + state, captured once and committed.

## Why fixtures

Persona tests exercise the full Ada flow — real browser, real HTTP, real
engine. Calling the real Anthropic API in every test run would be slow
(hundreds of ms per turn), expensive, and non-deterministic. Fixtures
decouple test stability from model behaviour.

## Naming convention

```
<scenario-slug>__<turn-number>.json
```

Examples:
- `title-iii-restaurant-barrier__01.json` — first turn of a Title III restaurant
- `title-iii-restaurant-barrier__02.json` — second turn of the same
- `title-ii-government-referral__01.json` — first turn of a Title II → gov referral

Keep slugs lowercase-hyphenated, match the persona file that uses them.

## File shape

Each fixture is a JSON file containing an array of the chunks Ada's
streaming would yield (matching the `AiStreamChunk[]` type from
`src/engine/clients/types.ts`).

```json
[
  { "type": "text_delta", "content": "Hi — I'm Ada. " },
  { "type": "text_delta", "content": "Tell me what happened." },
  { "type": "message_stop" }
]
```

Tool calls get captured as `tool_use_start` + `tool_use_delta` +
`tool_use_stop` blocks.

## How to record a new fixture

1. Temporarily swap the `AiClient` in your test from the fake to a
   "recording" wrapper around the real `AnthropicAiClient` (the wrapper
   forwards calls to the real client and writes chunks to a file).
2. Run the test once with `ANTHROPIC_API_KEY` set.
3. The recording is written to this directory; commit it.
4. In the test, point back at the replay fake which reads from this
   directory.

The recording wrapper itself is added in Step 9, when the real
`AnthropicAiClient` lands. Until then, persona tests use hand-written
fixtures or scripted `InMemoryAiClient` responses.

## When to re-record

- The prompt changes (any edit to `assemblePrompt` output)
- The tool set changes (new tool added, tool schema changed)
- Model version bumps
- Periodic refresh (quarterly) to catch model drift

Re-recording is a two-line PR: delete the fixture, re-run the test with
recording enabled, commit the new JSON.

## Do not

- Hand-edit fixtures to "fix" test failures — re-record instead
- Commit fixtures with real user PII — use synthetic data in test prompts
- Use fixtures for Layer 2 engine tests — those use scripted
  `InMemoryAiClient.enqueueResponse()` directly
