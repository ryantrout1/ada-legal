# Do Not Touch

Invariants that IDE agents and future contributors will be tempted to "simplify" — don't. Each rule here encodes a decision that was deliberate and expensive to revisit.

When a rule conflicts with something you want to do, **ask first**. Don't remove the rule.

---

## Rule 1 — Client singletons never called from inside the engine

Every side-effecting call (Anthropic, DB, email, blob, Stripe) goes through `clients.*` on `AdaClients`. If tempted to `import` a module-scoped instance from inside `/src/engine/`, the seam is broken and Layer 2 tests become useless.

## Rule 2 — `ada_sessions.status` only mutated in the state machine

Never write to `ada_sessions.status` outside `/src/engine/session/stateMachine.ts`. If you need a new transition, add it to the state machine.

## Rule 3 — `org_id` never gets removed from a table

Every org-scoped table carries `org_id` from day one, even when "there's only one org." Removing it later means retrofitting every related table and every query that joins across orgs.

## Rule 4 — Anon cookie: hash only

Never store the raw anon cookie token. Store `token_hash` only. The cookie value is the token; the DB has only the hash.

## Rule 5 — Session identity: exactly one of anon or user

Never allow a session to have both `anon_session_id` AND `user_id`, or neither. Exactly one. Enforced by CHECK constraint — don't drop the constraint.

## Rule 6 — Ada cannot act outside the tool layer

Ada never writes to `audit_log` directly or produces "actions" outside the tool layer. Ada emits `tool_use` blocks; the executor decides what happens. No tools, no action.

## Rule 7 — No production traffic before cutover

Never serve the new stack on production domains before Ch0 + Ch1 cutover bar is met. Base44 serves `adalegallink.com` until the cutover. Vercel preview URLs are the only place the new stack answers requests.

## Rule 8 — No conversation content in logs

Never log conversation content (user messages or Ada responses) to Vercel logs or `audit_log`. Log `session_id` + `org_id` + error type + stack trace hash only. Conversations are sensitive data; error tracking doesn't need them.

## Rule 9 — Migrations are append-only

Never skip, rename, or edit an existing migration. Schema changes are append-only, numbered, and committed with the feature that needs them. No "just edit migration 001" even before launch — the file is the contract.

## Rule 10 — Ch1-shaped tables may be empty, but they're not fake

Ch0 code reads zero rows from Ch1-shaped tables (`listings`, `routing_rules`, `subscriptions`, etc.). Ch0 tests assert zero rows. When Ch1 starts populating, Ch0 code keeps passing because it never read from them.

## Rule 11 — Neon Auth stays off

We use Clerk for authentication. Neon Auth would write users + sessions directly to Postgres and conflict with both Clerk and our `anon_sessions` table. The `Provision Neon Auth` MCP tool is blocked. Do not enable Neon Auth under any circumstance.

## Rule 12 — Reading levels: simple, standard, professional

Three reading levels, named exactly `simple | standard | professional`. Do not rename. Do not add a fourth. This taxonomy carries through the DB enum, the prompt builder, the user-facing selector, and the `ada_sessions.reading_level` column.

## Rule 13 — Server-side code must be runtime-agnostic

Our engine runs in two environments: Vite (dev, client build, vitest) and raw Node ESM (Vercel lambdas). Code that compiles cleanly in Vite but breaks in Node has killed `/api/ada/session` in production four times on 2026-04-20.

Things Vite silently handles that raw Node does NOT:

1. **Path aliases** like `@/foo/bar`. Vite resolves them via `vite.config.ts` `resolve.alias`. Node does not. Lambda throws `ERR_MODULE_NOT_FOUND`.
2. **Extensionless relative specifiers** like `from './foo'`. Vite resolves them. Node ESM refuses (since `package.json` has `"type": "module"`). Must be `from './foo.js'`.
3. **Query-string loaders** like `import foo from './bar.md?raw'`. Vite inlines the file content. Node has no idea what `?raw` means; even without the query, it can't import a `.md` file as JS.
4. **Non-JS file imports** in general (CSS, SVG, images, markdown). Vite handles them via plugins. Node does not.

Rules for `api/**/*.ts` and anything it transitively imports (nearly all of `src/`):

- Use relative paths (`../src/engine/...`). No `@/*` or other aliases.
- Include explicit `.js` extensions even in TS source. TypeScript with `moduleResolution: "bundler"` accepts `.js` specifiers and resolves them to `.ts` at compile time; Node finds the compiled `.js` at runtime.
- No Vite-specific import features: no `?raw`, no `?url`, no direct `.md`/`.css`/`.svg` imports. If you need raw content at runtime, pre-bake it into a `.ts` module via `scripts/generate-prompt-modules.mjs` (or a similar generator).
- For directories, spell out `./foo/index.js`.

Tests under `tests/` may use any Vite conveniences — vitest runs them in the Vite resolver, not Node ESM.

Before declaring an API-layer fix done: the ONLY acceptable test is hitting the deployed lambda endpoint and getting a 200. `npm test` passing is necessary but not sufficient. Production runs in a different module resolver than your tests do.

Debug tip: if you hit an opaque `FUNCTION_INVOCATION_FAILED`, ship a diagnostic endpoint that does dynamic `import()` of each layer in turn and reports which specifier fails. Vercel's truncated runtime logs rarely name the missing module.

---

*Rules are added as we make decisions we know we'll be tempted to regret. When you add one, date it and cite the decision context.*
