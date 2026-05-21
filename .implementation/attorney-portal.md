# Implementation log — Attorney Portal

**Project:** ADA Legal Link
**Spec:** `.features/attorney-portal.md`
**Blueprint:** `.design/attorney-portal.md`
**Run started:** 2026-05-20T21:01:41Z
**Resumed:** 2026-05-20T21:29:34Z (after /design revision 6ceec5f resolved the Phase 1 contract gap, Path A)
**Resumed:** 2026-05-20T21:50:00Z (Phase 2; user cleared env conditions, typecheck 0 errors)
**Resumed:** 2026-05-20T22:30:00Z (Phase 2 remainder; migration 0019 applied + verified by human)
**Completed:** 2026-05-21T01:00:00Z — all 5 phases shipped; manual Niles v. Hilton check PASSED (session 6e2ea48a-a2a9-436d-9ab7-aff9385bed18; claimant_name="Ryan"; match_litigation fired; QQ#1 verbatim; no intake regression; Hard Rule preserved). /verify run at closeout.
**Status:** complete

> Run mode: user requested Phase 1 only, then HALT for human review before Phase 2.
> This is a user-directed pause, not a safety halt — the loop status stays `in-progress`.

## Phase queue
1. Phase 1: Test infrastructure + fixtures — shipped
2. Phase 2: Schema migration + Drizzle types — shipped (migration human-applied; code by loop)
3. Phase 3: Auth helper + portal/admin API endpoints — shipped
4. Phase 4: Portal UI + admin firm-assignment B44 endpoint — shipped (repo UI; B44 page flagged)
5. Phase 5: Prompt update — name-early / contact-late — shipped (code; manual Niles check pending before /verify)

## Phase 1: Test infrastructure + fixtures

**Status:** halted
**Started:** 2026-05-20T21:01:41Z
**Completed:** 2026-05-20T21:01:41Z (halted at /plan --auto, before /shipit)

### Commits
- none — no code authored. `/plan --auto` halted before `/shipit --auto` was invoked (Rail 1 / Rail 5).

### /plan --auto verdict
- verdict: `halt`
- confidence: 0.45
- blast_radius: `shared`
- eligible_for_shipit: `false`
- halt_reason: `contract_gap` (also trips `shared_blast` via package.json)

### Halt
- **Condition:** Contract gap (blueprint Phase 1 ⟷ code reality), with a downstream shared-list hit.
- **Evidence:**
  1. **Component-test infra absent.** No test in the suite renders React (`grep` for `testing-library`/`render(`/`jsdom`/`happy-dom`/`@vitest-environment` across `tests/` → none). The files `/design` cites as the "React testing pattern" (`tests/unit/adminFirmList.test.ts`) are data-logic tests against `makeInMemoryClients`, not component renders — so testability-validation rows 2 & 3 in the blueprint rest on a refuted assumption.
  2. **Runnable `.test.tsx` component shells require new infra:** `jsdom`/`happy-dom` + `@testing-library/react` (→ `package.json`, a shared-list file → Rail 5 halt) and a `vitest.config.ts` include-glob widening (current include is `tests/unit/**/*.test.ts`, which does not match `.test.tsx`; not in the phase's stated files_touched). `tsconfig` includes `tests/` with `strict` + `noUnusedLocals`, so the `typecheck` smoke gate compiles these shells — a half-wired shell fails the gate.
  3. **`portalSeed.ts` "working module" depends on Phase 2.** It seeds `litigation_firm_assignments`, `firm_session_handled`, and `attorneys.user_id/law_firm_id`, none of which exist until the Phase 2 migration. Contradicts the phase's `Depends on: none`. Can only be a typed stub pre-Phase-2.
- **What WOULD ship cleanly on its own:** the 2 Playwright persona shells, the a11y AAA shell, and the 2 `.test.ts` integration shells (all use already-installed infra).
- **Recommended next step:** Manual `/design` revision. Options:
  - Add a Phase 1a "component-test harness" sub-phase that explicitly owns the `package.json` (jsdom + testing-library) + `vitest.config.ts` edits under human review (keeps shared-list edits out of the autonomous loop); OR
  - Re-spec criteria 2 & 3 as data-logic tests against the existing `makeInMemoryClients` pattern (no React rendering, no new deps) — matches how every other "component" test in this repo actually works; AND
  - Reorder `portalSeed`'s working body to land after Phase 2 (or split: typed signatures now, live seed bodies post-migration).

## Halt 1 — superseded by resume

**Terminal state at the time:** halted mid-loop (Phase 1, at /plan --auto), contract gap.
**Superseded:** 2026-05-20T21:29:34Z — /design revision 6ceec5f resolved the gap (Path A: criteria 2/3 → data-logic tests, .test.tsx → .test.ts, portalSeed body deferred to Phase 2, no package.json edits). Loop resumed from Phase 1. See the fresh Phase 1 entry below.

## Resume — 2026-05-20T21:29:34Z

Re-running Phase 1 against revised blueprint (commit 6ceec5f).

## Phase 1: Test infrastructure + fixtures (resumed run)

**Status:** shipped
**Started:** 2026-05-20T21:29:34Z
**Completed:** 2026-05-20T21:38:00Z

### Commits
- `970d3ee` — `test(portal): add Phase 1 attorney-portal test infrastructure shells`

### /plan --auto verdict
- verdict: `ready`, confidence 0.96, blast_radius `local`, eligible_for_shipit `true`, halt_reason `null`.

### Files authored (8, all under tests/)
- `tests/personas/portal-attorney-login.spec.ts` — criterion 1 (test.fixme)
- `tests/personas/portal-litigation-match-name-collection.spec.ts` — criterion 5 (test.fixme)
- `tests/unit/portalQueueSelection.test.ts` — criterion 2 (it.todo data-logic, mirrors adminFirmList.test.ts)
- `tests/unit/portalCaseDetailSelection.test.ts` — criterion 3 (it.todo data-logic)
- `tests/integration/portalQueueQuery.test.ts` — criteria 2/4/6 (it.todo)
- `tests/integration/litigationMatchContactCapture.test.ts` — criterion 5 (it.todo)
- `tests/a11y/portal-aaa.spec.ts` — axe AAA (test.fixme)
- `tests/fixtures/portalSeed.ts` — typed signatures only; live body deferred to Phase 2

### Regression (smoke)
- Result: pass (for Phase 1's contribution)
- typecheck: **Phase 1 adds 0 errors** — verified by stash-diff (22 errors with the files == 22 errors without; all pre-existing). 25 vitest todos collect clean across the 4 vitest shells (exit 0).
- Code review: nothing flagged.

### Acceptance criteria
- Scaffolding for criteria 1-6 authored as pending shells: **met** — 8 files; 25 todos + 5 fixme specs; 0 new typecheck errors.
- portalSeed typed signatures only (body deferred to Phase 2): **met**.

### Runtime verification deferrals
- none (Phase 1 ends with red/pending tests by design).

### ⚠️ Pre-existing environment conditions flagged for the human (NOT Phase 1 regressions — they block Phase 2+)
1. **Broken `node_modules` install in this clone.** `npm run typecheck` reports 22 errors, ALL in untouched `src/`/`api/` files, all `TS2307 Cannot find module` for 4 declared-but-not-installed deps: `react-helmet-async`, `lucide-react`, `@react-pdf/renderer`, `@vercel/blob`. A clean `npm install` (or `npm ci`) is needed before Phase 2/3 can typecheck/build green. Not repaired here to avoid `package-lock.json` (shared-list) churn outside Phase 1 scope.
2. **`npm run lint` is non-functional repo-wide.** `eslint` is not installed and there is no eslint config; `npm run lint` exits 127 (command not found) on a clean tree, pre-Phase-1. The blueprint's smoke gate names lint, but it cannot run. Either install + configure eslint (a `package.json` change → needs human review, shared-list) or revise the smoke definition. Phase 1 used `typecheck` as the meaningful gate.

### HALT — user-directed pause (not a safety halt)
- User instructed: stop after Phase 1, report, do not auto-advance to Phase 2.
- Loop status stays `in-progress`; Phases 2-5 remain `pending`. /verify NOT run (closeout only fires after all phases ship).
- Resume: re-invoke /implementation to continue from Phase 2 (after the environment conditions above are addressed).

## Phase 2: Schema migration + Drizzle types + in-memory seed

**Status:** halted
**Started:** 2026-05-20T21:50:00Z
**Completed:** 2026-05-20T21:50:00Z (halted at /plan --auto gate, before /shipit)

### Commits
- none — no code authored. `/plan --auto` halted on a Rail 5 shared-list hit before `/shipit --auto` was invoked.

### /plan --auto verdict
- verdict: `halt`
- confidence: 0.97 (high confidence in the halt assessment)
- blast_radius: `shared`
- eligible_for_shipit: `false`
- halt_reason: `shared_blast`

### Halt
- **Condition:** Shared-list blast-radius hit (Rail 5). `files_touched` includes `src/db/migrations/0019_attorney_portal.sql`, which matches the `migrations/*.sql` shared-list entry. The rule is "always halt, no exceptions, no overrides."
- **Why it matters:** Migration 0019 applies DDL to the **production Neon branch** (`ancient-star-00703098`): `ALTER TABLE attorneys ADD COLUMN user_id/law_firm_id REFERENCES users/law_firms`, `CREATE TABLE litigation_firm_assignments`, `CREATE TABLE firm_session_handled`, plus a best-effort backfill of `attorneys.law_firm_id` from `firm_name`. The autonomous loop never authors or applies production migrations — this is the surface a wrong autonomous edit could damage production data.
- **Secondary:** also cross-cutting (`src/db/` + `src/engine/` + `tests/`). And applying the migration needs `DATABASE_URL`, which the design notes is blank in committed env (held in Vercel encrypted env).
- **Phase 2 also contains non-shared-list work** that is safe for autonomous build once the migration is applied + reviewed by a human: Drizzle table defs (`src/db/schema-core.ts`), row types (`src/engine/clients/types.ts`), reader methods (`src/engine/clients/neonDbClient.ts`), in-memory mirrors (`src/engine/clients/inMemoryClients.ts`), and the `portalSeed` live body (`tests/fixtures/portalSeed.ts`). These turn the Phase 1 shells green.
- **Recommended next step:** Human review + application of migration 0019. Options for the user:
  1. Human authors/reviews + applies 0019 against Neon, then re-invokes /implementation for the **remainder** of Phase 2 (types/mirrors/portalSeed body — non-shared-list); OR
  2. Explicitly waive Rail 5 for this migration and direct the loop to author it (still cannot apply without DATABASE_URL); OR
  3. Have the loop author the 0019 SQL file for human review, but NOT apply it.

### Human-directed follow-up (2026-05-20T21:55:00Z) — migration drafted, not applied
- User chose option "I draft the SQL, you apply" at the Rail 5 halt.
- `src/db/migrations/0019_attorney_portal.sql` authored + committed (`43f44a5`) as a **review-only artifact — NOT applied to Neon.** Header marks it NOT YET APPLIED.
  - attorneys.user_id + attorneys.law_firm_id (+ partial indexes)
  - guarded, **org-scoped** firm_name → law_firm_id backfill (org-scoping is a safety tightening over the design's plain name match; flagged in-file for review since law_firm_id gates portal access)
  - litigation_firm_assignments (routing fan-out)
  - firm_session_handled (sparse one-bit handled state)
- Loop remains halted on the rail. **Awaiting human application of 0019 against Neon (ancient-star-00703098 main).**
- **Next:** after Ryan applies 0019 + confirms, re-invoke /implementation to build the REST of Phase 2 (non-shared-list): Drizzle table defs (`src/db/schema-core.ts`), row types (`src/engine/clients/types.ts`), reader methods (`src/engine/clients/neonDbClient.ts`), in-memory mirrors (`src/engine/clients/inMemoryClients.ts`), portalSeed live body, fill the Phase 1 data-logic shells, add `tests/integration/portalSchemaApplied.test.ts` (information_schema verification).

## Phase 2 halt (Rail 5) — superseded; resolved via human-applied migration

**At the time:** halted mid-loop (Phase 2, /plan --auto — Rail 5 shared-list). Migration SQL drafted (43f44a5), not applied.
**Superseded:** 2026-05-20T22:30:00Z — Ryan applied migration 0019 to Neon `ancient-star-00703098` main and verified via information_schema (4 columns/tables, 5 indexes, 10 FKs, ON DELETE behavior; backfill linked Kelley Brooks Simoneaux → The Spinal Cord Injury Law Firm via the org-scoped match). Loop resumed for the non-shared-list remainder. See the Phase 2 shipped entry below.

## Phase 2: Schema migration + Drizzle types + in-memory seed (shipped)

**Status:** shipped
**Started (remainder):** 2026-05-20T22:30:00Z
**Completed:** 2026-05-20T22:45:00Z

### How Phase 2 split (Rail 5)
- **Migration (shared-list):** drafted by the loop (`43f44a5`, NOT applied), then **applied + verified by Ryan** out-of-loop. The autonomous loop never applied production DDL.
- **Non-shared-list code:** authored + shipped by the loop (below).

### Commits
- `43f44a5` — `feat(db): draft migration 0019 attorney portal schema (NOT YET APPLIED)` (drafted earlier; applied by human)
- `60810ff` — `feat(portal): attorney-portal data layer — Drizzle defs, types, reader methods`
- `a197d20` — `test(portal): fill Phase 1 data-logic shells green + portalSeed body + schema verification`

### Files
- schema-core.ts: attorneys.userId/lawFirmId (+ partial indexes); litigationFirmAssignments + firmSessionHandled table defs (law_firm_id plain uuid, FK in SQL)
- types.ts: optional userId/lawFirmId on AttorneyRow; LitigationFirmAssignment, PortalQueueRow/Result, PortalCaseDetail, PortalAttorneyResolution; 6 DbClient methods
- neonDbClient.ts + inMemoryClients.ts: both implement the 6 reader methods with identical firm-scoping + gray-out semantics (DO3 firm-scoped counts). No API handlers (Phase 3).
- tests/fixtures/portalSeed.ts: live body (in-memory)
- tests/unit/portalQueueSelection.test.ts + portalCaseDetailSelection.test.ts: Phase 1 shells filled GREEN
- tests/unit/litigationSchema.test.ts: extended for new tables
- tests/integration/portalSchemaApplied.test.ts: information_schema scan (skipIf no DATABASE_URL)

### Regression (targeted → ran full unit+integration)
- `npm run test` (vitest run): **775 passed, 4 skipped, 11 todo, 0 failures.** `clients-contract.test.ts` green → both clients satisfy the extended DbClient interface; no existing suite regressed.
- typecheck: clean (0 errors).
- Code review: nothing flagged.

### Acceptance criteria
- Migration applied; new columns/tables/FKs exist: **met** — human-verified via information_schema; automated `portalSchemaApplied.test.ts` covers it (runs when DATABASE_URL is set).
- Drizzle types + in-memory mirrors added; Phase 1 data-logic shells turn green: **met** — portalQueueSelection (8) + portalCaseDetailSelection (7) pass against the in-memory client.

### Runtime verification
- information_schema scan: **done by human** (manual) + automated test authored. The automated test SKIPS in this loop env (no DATABASE_URL); it will run in any env where DATABASE_URL is set.

### Notes / flags for the human
- **package-lock.json:** your `npm install` pruned 523 lines (0 insertions; package.json untouched). Left OUT of the Phase 2 commits (shared-list file, not a Phase 2 change). Review + commit separately if you want the normalization persisted, or `git checkout package-lock.json` to discard.
- QQ-answer extraction in getPortalCaseForFirm is pragmatic for v1: non-identity extracted_fields rendered as {question, answer}. Phase 3/4 can refine against the litigation row's ada_qualifying_questions shape if needed.

### HALT — user-directed pause (not a safety halt)
- User instructed: stop after Phase 2, report, do not auto-advance to Phase 3.
- Loop status `in-progress`; Phases 3-5 `pending`. /verify NOT run (closeout only after all phases ship).
- Resume: re-invoke /implementation to continue from Phase 3 (auth helper + portal/admin API endpoints).

## Phase 2 pause — superseded by Phase 3 resume

**At the time:** Phase 2 shipped; user-directed pause before Phase 3. Resumed 2026-05-20T23:00:00Z.

## Phase 3: Auth helper + portal/admin API endpoints (shipped)

**Status:** shipped
**Started:** 2026-05-20T23:00:00Z
**Completed:** 2026-05-20T23:20:00Z
**Pre-check:** no shared-list hit (api/_attorney.ts, api/portal/*, api/admin/litigation/[id]/firms.ts — none match `**/auth/**`, middleware, or lib/auth). Ran autonomously, no Rail 5 halt.

### Commits
- `c9cd8a8` — `feat(portal): requireAttorney auth helper + portal/admin API endpoints`
- `30fcb59` — `test(portal): requireAttorney resolution + portal queue endpoint data-plane`

### Files
- api/_attorney.ts: Clerk-direct `requireAttorney` (mirrors _admin Clerk path, no bridge) + testable `resolveAttorneyContext` core. Resolves Clerk user → users.clerk_user_id → attorneys.user_id → law_firm. Miss → 403; no session → 401; misconfig → 500.
- api/portal/queue.ts (GET): firm-scoped queue; snake_case contract; firm id resolved server-side (never client-supplied).
- api/portal/cases/[id].ts (GET): full case package; 404 on out-of-firm access (no existence leak — 404 not 403).
- api/portal/cases/[id]/handle.ts (POST): idempotent mark-handled (204), guarded by the same firm boundary.
- api/admin/litigation/[id]/firms.ts (GET+PUT): bridge-auth firm-assignment fan-out (criterion 4).
- tests/unit/requireAttorney.test.ts (4) + tests/integration/portalQueueQuery.test.ts (filled, 4).

### Regression (targeted → ran full unit+integration)
- `npm run test`: **783 passed, 4 skipped, 5 todo, 0 failures.** typecheck clean. Code review: nothing flagged.

### Acceptance criteria (Phase 3 covers 1, 2, 3, 4, 6 — backend layer)
- requireAttorney auth boundary: **met** — resolveAttorneyContext unit-tested (success shape, firm isolation, miss→null→403).
- queue endpoint firm-scoping + gray-out + criterion-4 surfacing: **met** — portalQueueQuery integration test (auth→scope→join, negative-path boundary, assign-firm-surfaces).
- case detail + handle endpoints: **met** — covered by Phase 2 reader/writer tests + the endpoint boundary logic.
- Note: criteria 1/2/3/6 are fully *closed* only with the Phase 4 UI; Phase 3 ships their backend.

### Runtime verification (deferred — needs deploy)
- Hit GET /api/portal/queue via `vercel dev`/deploy: 401 unauthenticated, 200 with payload after Clerk sign-in as a paired attorney. Deferred to a deployed env (recipe in design Phase 3).

### ⚠️ DEFERRED — DO1 auto-pair-by-email (scope decision needed)
- The design resolved DO1 to auto-pair attorneys to Clerk users by verified email on first sign-in. Implementing it needs **net-new user-provisioning DB infrastructure that does not exist anywhere yet**: a users upsert-by-clerk-id, an attorney-by-email lookup, and an atomic users↔attorney linkage write — none in Phase 3's file list (api/* only) or the Phase 2 method set. It's also a security boundary.
- **What shipped instead:** requireAttorney's explicit design contract (resolve via user_id; miss → 403 "not onboarded"). Paired attorneys (B44 admin sets user_id, or the 0019 firm_name backfill) work fully; unpaired attorneys get a clean 403 — which IS DO1's zero-match path.
- **Decision for the human:** (a) build auto-pair as a scoped follow-up (Phase 3.5: adds the user-provisioning DB methods + the email-pair flow + tests), or (b) accept manual/admin pairing for v1 and treat auto-pair as a later enhancement. Not a blocker for Phase 4 (UI) or for paired-attorney flows.

### HALT — user-directed pause (not a safety halt)
- User instructed: stop after Phase 3, report, do not auto-advance to Phase 4.
- Loop status `in-progress`; Phases 4-5 `pending`. /verify NOT run (closeout only after all phases ship).
- Resume: re-invoke /implementation for Phase 4 (portal UI + B44 admin firm-assignment page). Phase 4 also depends on a DO1 decision if auto-pair is wanted before launch.

## Phase 3 pause — superseded by Phase 4 resume

**At the time:** Phase 3 shipped; pause before Phase 4. DO1 resolved by user to **option (b): manual pairing for v1** (Kelly paired via the 0019 backfill; auto-pair deferred as a future scoped enhancement — do NOT build now). Resumed 2026-05-20T23:40:00Z.

## Phase 4: Portal UI + admin firm-assignment (shipped — repo UI)

**Status:** shipped
**Started:** 2026-05-20T23:40:00Z
**Completed:** 2026-05-21T00:05:00Z
**Pre-check:** no shared-list hit (all src/app/* — not middleware/auth/lib/auth). Ran autonomously.

### Commits
- `3a43093` — `feat(portal): attorney portal UI — routes, layout, guard, data client`
- `f8cd44f` — `test(portal): activate portal Playwright specs`

### Files (App.tsx + 7 new)
- App.tsx: /portal/* PortalShell, ClerkProvider scoped to the subtree (mirrors AdminShell — the Clerk-DNS constraint from the risk register; root-mount would break public routes).
- PortalLayout, RequireAttorney (client guard; server requireAttorney is the real boundary).
- portal SignIn/SignUp with Clerk AAA `appearance` theming (approval note 5; token-derived colors).
- PortalQueue (firm-scoped tiles + queue, criterion-6 gray-out treatment, 403→not-onboarded), PortalCaseDetail (contact + QQ + transcript + idempotent mark-handled, 404 out-of-firm).
- data/portalClient (same-origin fetch wrappers, typed PortalApiError).

### Tests
- tests/personas/portal-attorney-login.spec.ts: unauth-redirect + sign-in-card assertions LIVE; authed queue→case nav `test.fixme` (preview-only, seeded Clerk session).
- tests/a11y/portal-aaa.spec.ts: /portal/sign-in AAA audit LIVE; authed routes `test.fixme` (preview).

### Regression (wider) + code-level verification
- typecheck: clean. `npm run build` (vite): clean. `npm run test` (vitest): **783 passed, 4 skipped, 5 todo, 0 failures** (UI doesn't touch the data suites).
- `npm run test:a11y` / `npm run test:personas`: NOT run in this loop env (Playwright needs a served target + chromium + Clerk session). Runtime-deferred to preview.
- Code review: nothing flagged; design tokens throughout (only hex is the justified Clerk appearance).

### Acceptance criteria (Phase 4 closes the UI for 1, 2, 3, 6)
- Criterion 1 (login → portal): UI built (sign-in + guard + shell). End-to-end Clerk sign-in verified on preview (deferred).
- Criterion 2 (queue renders): PortalQueue built; Playwright render verification deferred to preview; data-plane already green (portalQueueSelection).
- Criterion 3 (case package): PortalCaseDetail built; same.
- Criterion 6 (gray-out): rendered treatment built; data-plane green; **manual cross-firm check pending** (open as Firm B, mark handled, open as Firm A, observe gray) — runtime.

### ⚠️ NOT BUILT — B44 admin firm-assignment page (outside this repo)
- Approval note 3 asked Phase 4 to "also build a B44 admin page" for firm↔litigation assignment. **B44 (Base44) is a separate platform, not the ada-legal repo** — it can't be built from here as a code change. The Vercel-side API it calls (`GET/PUT /api/admin/litigation/[id]/firms`) shipped + is tested in Phase 3, and the data-plane (criterion 4) is green. Only the Base44 admin UI (a multi-select firms picker calling the PUT endpoint, bridge-authed) remains.
- **Decision for the human:** build the B44 page in Base44 (via the Base44 app editor / MCP, as a separate task), or assign firms via direct API/PUT for v1. Criterion 4 is functionally complete server-side; this is the admin convenience UI.

### Runtime verification (deferred — needs deploy/preview)
- `npm run dev` (or preview) → sign in as the seeded paired attorney → queue renders → open a case. Criterion 6 manual cross-firm gray-out check. `npm run test:a11y:preview` for the AAA audit on /portal/sign-in (+ authed routes once a seeded session is wired).

### HALT — user-directed pause (not a safety halt)
- User instructed: stop after Phase 4, report, do not auto-advance to Phase 5.
- Loop status `in-progress`; Phase 5 `pending`. /verify NOT run (closeout only after all phases ship).
- Resume: re-invoke /implementation for Phase 5 (prompt update — name-early/contact-late, litigation_match flow only per DO4). NOTE: Phase 5 touches content-migration/prompts/* — not shared-list, but per approval note 4 the /shipit must include a manual "Niles v. Hilton" recipe check before declaring done.

## Phase 4 pause — superseded by Phase 5 resume

**At the time:** Phase 4 shipped (repo UI); pause before Phase 5. B44 admin page **deferred for v1** by user (manual PUT covers the one-firm-one-case scenario; B44 multi-select UI is a separate scoped task post-ship). Resumed 2026-05-21T00:20:00Z.

## Phase 5: Prompt update — name-early / contact-late (shipped — code)

**Status:** shipped (code); manual Niles v. Hilton recipe check pending before /verify (approval note 4)
**Started:** 2026-05-21T00:20:00Z
**Completed (code):** 2026-05-21T00:40:00Z
**Pre-check:** no shared-list hit (content-migration/prompts/* + tests). Ran autonomously.

### Commits
- `d3ca16a` — `feat(prompt): name-early / contact-late collection for litigation_match (DO4)`
- `cae619e` — `test(prompt): litigation_match contact-capture prompt anchor + persona refresh`

### Files
- content-migration/prompts/ada-identity.md: added "Identity collection (litigation-match flow only)" sub-block + edited Turn 3 (name before match_litigation) and Turn 5 (email required + phone optional after the last QQ). DO4-scoped; Title III intake unchanged.
- content-migration/prompts/ada-identity.ts: regenerated via `node scripts/generate-prompt-modules.mjs` (auto-gen artifact; not hand-edited).
- tests/integration/litigationMatchContactCapture.test.ts: deterministic ATDD anchor (prompt content + scoping + hard-rule preservation). **Verified red pre-edit, green post-edit.**
- tests/personas/portal-litigation-match-name-collection.spec.ts: bodies refreshed; stays test.fixme (LLM-behavior non-deterministic; manual Niles check is the gate).

### Design-tension handled
- The recent prompt-hardening commits (forbid prepending intake Qs to the QQ sequence; require verbatim QQ #1) constrained placement. Name collection is placed at **Turn 3, BEFORE `match_litigation` fires** — so the first question after the match is still QQ #1 verbatim. The block states this reconciliation explicitly. The test asserts the hard rule is not regressed.

### Regression (wider) + verification
- typecheck clean. `npm run test` (vitest): **787 passed, 4 skipped, 0 todo, 0 failures.**
- Persona suite (`pre-bound-deep-link-resume`, `discovery-qualified`, `multi-match-disambiguation`, `pivot-mid-conversation`): Playwright — NOT run in this loop env (needs served target + browser + LLM). Runtime-deferred to preview.
- **MANUAL Niles v. Hilton recipe check (approval note 4): PENDING — Ryan runs this before Phase 5 is declared done.** The prompt is regression-sensitive; persona tests catch structural breakage but a human conversation catches "Ada got chatty again."

### Acceptance criterion 5
- Name-early / email+phone-late collection on litigation_match, stored as claimant_name/email/phone: **code shipped + prompt-content verified**; behavioral confirmation = manual Niles check + runtime recipe (criterion-5 timestamp comparison, design line ~205).

### HALT — per approval note 4 + user instruction
- Phase 5 CODE is shipped. Loop halts here for the human-run manual Niles v. Hilton check.
- **Next:** after Ryan runs the manual recipe and it passes, run `/verify` on the full feature (the closing definition-of-done pass across all 5 phases). If the manual check fails, that's a prompt-tuning detour before /verify.
- All 5 phases now have code shipped. /verify is the only remaining loop step (gated on the manual check).

## Closing — Phase 5 code pause (pre-/verify)

**Terminal state:** Phase 5 code shipped; halted for the manual Niles v. Hilton check before /verify (approval note 4).
**/verify run:** no — pending the manual behavioral check.
**/verify verdict:** n/a (not yet run)

### Run ended: 2026-05-21T00:40:00Z
