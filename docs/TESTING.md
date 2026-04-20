# Testing strategy

Three layers, each with a clear scope. Every feature should have
coverage at the right layer — no more, no less.

## Layer 1 — Unit

**What:** Pure-function tests for individual modules.
**Where:** `tests/unit/`
**Runner:** Vitest
**Run:** `npm run test:unit`

Targets:
- Prompt assembler input → output mappings
- State-machine transition rules
- Tool-arg validators
- Schema + type guards
- Anything that takes plain values in and returns plain values out

Tests should not touch any clients. No `AdaClients`, no DB, no network.
If a test needs a client, it belongs in Layer 2.

## Layer 2 — Integration

**What:** Engine behaviour tests that exercise `processAdaTurn` or
lower-level engine modules through `InMemoryAdaClients`.
**Where:** `tests/integration/`
**Runner:** Vitest
**Run:** `npm run test:integration`

Targets:
- Full turn flows: user message → state change → assistant message
- Tool-call dispatch and result handling
- Session persistence round-trips
- Audit entries produced for specific actions
- Error paths that surface as assistant messages

Tests use `makeInMemoryClients()` from `@/engine/clients/inMemoryClients`.
They script AI responses via `enqueueText()` or `enqueueResponse()`, they
pre-seed DB state via `db.writeSession()`, and they assert on both
returned values and side effects (email sent, audit logged, etc.).

No real network calls. No real Anthropic. No real Postgres.

## Layer 3 — Persona

**What:** End-to-end tests against a running server, driven by a real
browser.
**Where:** `tests/personas/`
**Runner:** Playwright
**Run:** `npm run test:personas` (local) or `npm run test:personas:preview`
(Vercel preview URL)

Targets:
- Key user journeys end-to-end
- UI accessibility checks (keyboard navigation, screen-reader landmarks,
  contrast)
- Cross-page flows (landing → Ada → directory)
- Real rendering, real HTTP, real engine

Tests use recorded AI fixtures (see
`tests/fixtures/ai-responses/README.md`) so they're deterministic. The
real `AnthropicAiClient` is only exercised when recording new fixtures.

### First-time setup

```bash
npm install
npm run test:personas:install    # downloads the Chromium binary (~150 MB)
```

The Chromium download hits `storage.googleapis.com`, which is blocked
in some sandboxed environments. Run this on your dev machine or in CI,
not in restricted containers.

## Matrix

| Concern | Layer 1 | Layer 2 | Layer 3 |
|---|---|---|---|
| "Does this function return the right value?" | ✓ | | |
| "Does the engine take the right turn?" | | ✓ | |
| "Does tool X fire under condition Y?" | | ✓ | |
| "Does the user see the right thing?" | | | ✓ |
| "Does keyboard navigation work?" | | | ✓ |
| "Does routing hop cross-subdomain correctly?" | | | ✓ |

When picking a layer: start at the lowest layer that can meaningfully
fail for the thing you're testing. A prompt-assembly bug is a Layer 1
test, not Layer 3. A cross-subdomain redirect is Layer 3, not Layer 2.

## What to avoid

- Layer 1 tests that import `AdaClients` — the import itself is a smell.
- Layer 2 tests that call the real Anthropic API — they belong as
  fixture recordings or be rewritten with `enqueueText()`.
- Layer 3 tests that stub the engine — at that point, what are you
  actually testing?
- Shared "helper" classes across layers that hide what a test is doing.
  Each fake should be small, inspectable, and owned by its layer.
