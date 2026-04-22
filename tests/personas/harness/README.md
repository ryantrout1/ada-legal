# Persona tests — Step 28 harness

Layer 3 testing: scripted Playwright conversations that exercise Ada
end-to-end against a real deployment. Each persona captures three
artifacts per run — `trace.json`, `transcript.md`, `assertions.log` —
under `test-results/personas/<run-id>/<persona-slug>/`.

## Running personas

```bash
# One-time setup (first time, or after a Playwright version bump)
npm run test:personas:install

# Against local dev server (spins up vite automatically)
#   Note: local requires all upstream API keys in .env.local to work,
#   since Ada's turn handler calls real Anthropic + Neon.
npm run test:personas

# Against the git-main Vercel preview URL
npm run test:personas:preview

# Against production (ada.adalegallink.com)
npm run test:personas:prod

# Run a specific persona only
npm run test:personas:prod -- listing-scoped-qualified-standard

# Run all personas tagged @harness-a (critical path)
npm run test:personas:prod -- --grep @harness-a

# Run everything EXCEPT @harness-a (rotating coverage pool)
npm run test:personas:prod -- --grep-invert @harness-a
```

## Reading the output

After each run, `test-results/personas/<run-id>/` contains a directory
per persona with three files:

- **`transcript.md`** — user/Ada turns in order, human-readable. Paste
  this to a collaborator for the fastest "what happened" conversation.
- **`trace.json`** — full structured data: tool calls, timing, session
  state at each step, assertion records. Useful for debugging.
- **`assertions.log`** — one line per assertion, pass/fail with detail.
  Scan this first to see what broke.

## Bundling for copy/paste

To grab everything for one persona in a single markdown blob:

```bash
# Most recent persona, piped to clipboard (WSL)
npm run personas:copy -- --latest | clip.exe

# Specific persona from most recent run
npm run personas:copy -- --persona listing-scoped-qualified-standard | clip.exe

# Specific persona, specific run
npm run personas:copy -- --persona listing-scoped-qualified-standard \
  --run 2026-04-22-080000 | clip.exe

# Include the full trace.json (default is transcript + assertions only)
npm run personas:copy -- --persona listing-scoped-qualified-standard \
  --trace | clip.exe

# List what runs and personas exist
npm run personas:copy -- --list
```

Prefix matching works on `--persona` — you can type `listing` if only
one persona starts with `listing-`.

On macOS use `pbcopy` instead of `clip.exe`. On Linux Wayland use
`wl-copy`. On X11 use `xclip -selection clipboard`.

## Grouping multiple runs under one timestamp

Set `PERSONA_RUN_ID` to a shared value before running several personas
separately; they'll all write under the same directory:

```bash
export PERSONA_RUN_ID="$(date +%Y-%m-%d-%H%M%S)"
npm run test:personas:prod -- listing-scoped-qualified-standard
npm run test:personas:prod -- discovery-qualified
# Both artifacts end up under test-results/personas/$PERSONA_RUN_ID/
```

## Tags

Each persona declares tags in its `test(...)` call. Current tags:

- `@harness-a` — critical-path green-must-stay-green set (6 personas)
- `@harness-b` — rotating coverage pool (~12 personas)
- `@qualified` — intake completes with qualified=true
- `@disqualified` — intake completes with qualified=false
- `@listing-scoped` — session started from /class-actions/:slug deep-link
- `@discovery` — session started at /chat, Ada surfaced the listing index
- `@a11y` — axe-core accessibility sweep
- `@regression` — guards a specific fix we've already made

## Preconditions

- **Real engine required for most personas.** Tests skip unless
  `PLAYWRIGHT_TARGET` is `preview` or `prod` — Ada needs real Anthropic,
  Neon, listing data seeded. Local-only works ONLY if your `.env.local`
  has all upstream credentials.
- **Pilot listing must exist** at the target for listing-scoped personas.
  The seed is `hotel-accessible-room-fraud` under "Desert Disability
  Rights Group."
- **Anon cookies are per-test-context.** Playwright mints a fresh
  browser context per test, so cookies don't leak across personas.

## What's deliberately NOT in scope

- No scheduler. No GitHub Actions workflow. No Slack alerts. Automation
  happens only after personas have been manually trusted for weeks.
- No AI analysis at record time. The harvester (opt-in LLM pass over
  transcripts) is a separate command in a later commit.
- No UI. Artifacts are plain files. An `/admin/personas` page can come
  later if the filesystem convention gets cumbersome.

## Adding a new persona

Borrow the shape of `listing-scoped-qualified-standard.spec.ts`. In
order:

1. Import `test, expect` from `./harness/personaHarness.js`
2. Call `test('<slug>', { tag: ['@harness-a', ...] }, async ({ page, recorder }) => { ... })`
3. Navigate pages, record user/assistant turns via `recorder.userTurn()`
   / `recorder.assistantTurn()`, make assertions via `recorder.assertion()`
4. Either throw on assertion failure (Playwright-level fail) or let the
   recorder log the failure and continue (softer, useful when you want
   the full transcript even after something broke)

The recorder writes artifacts on test teardown automatically — you
don't need to call `finalize()` yourself.
