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

## Rule 13 — No `@/` path aliases in `api/**` or `src/**`

Vercel's Node lambda bundler does NOT resolve TypeScript path aliases at runtime. It keeps `@/foo/bar` as a literal import string, and the lambda throws `ERR_MODULE_NOT_FOUND` on first request. This killed `/api/ada/session` in production on 2026-04-20 and cost a round trip of debugging.

- `api/**/*.ts` and anything they transitively import (nearly all of `src/`) MUST use relative imports (`../src/engine/...`, `./types`, etc.).
- Test files under `tests/` may keep `@/` since vitest reads `vite.config.ts` and resolves aliases via the same plugin the client build uses.
- If you ever want to restore `@/` for server code, you must first verify that whatever bundler Vercel is using actually reads `tsconfig.json` `paths` at that time — and add a smoke test that curls `/api/ada/session` post-deploy before declaring victory.

---

*Rules are added as we make decisions we know we'll be tempted to regret. When you add one, date it and cite the decision context.*
