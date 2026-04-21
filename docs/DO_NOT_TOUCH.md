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

## Rule 13 — Server-side ESM imports: relative paths WITH `.js` extensions

Our `package.json` has `"type": "module"`, which means Vercel's Node lambda runtime loads our code as ESM. Node's ESM resolver is strict in two ways our client bundlers are not:

1. **No path aliases.** `@/foo/bar` is a TypeScript/Vite convention — the Vercel Node bundler keeps the literal string in the shipped code, and Node ESM throws `ERR_MODULE_NOT_FOUND`. All `api/**` and `src/**` code must use relative paths.

2. **Explicit `.js` extensions required.** Extensionless relative imports (`from './foo'`) fail at runtime because Node ESM refuses to guess extensions. You MUST write `from './foo.js'` even in TypeScript source. TS resolves the `.js` specifier back to the `.ts` file during compilation (with `moduleResolution: "bundler"` or `"nodenext"`), and at runtime Node finds the compiled `.js` output.

   For directory imports, spell out `from './foo/index.js'` rather than relying on implicit index resolution.

This caught us twice on 2026-04-20:
- Attempt 1 (commit `54e2272`) converted `@/` → relative but kept extensionless specifiers → still 500
- Attempt 2 (commit pending) added `.js` to all 84 relative specifiers → fixed

Tests under `tests/` may keep `@/` and extensionless imports because vitest uses Vite's resolver, not Node ESM.

Before restoring either shortcut for server code, curl `/api/ada/session` on the deployed URL and prove the lambda returns 200 first. Don't trust local `npm test` — it runs in Vite, not Node ESM.

---

*Rules are added as we make decisions we know we'll be tempted to regret. When you add one, date it and cite the decision context.*
