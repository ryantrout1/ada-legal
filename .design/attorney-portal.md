# Design — Attorney Portal

**Project:** ADA Legal Link
**Spec:** `.features/attorney-portal.md`
**Status:** committed; awaiting human review

## Re-validation of /feature assumptions

| Label | Assumption (from spec) | Verdict | Notes |
|---|---|---|---|
| a1 | Architecture A — portal on Vercel at `ada.adalegallink.com/portal`, Clerk on Vercel handles auth natively, no cross-domain bridge | **survives** | Clerk is already installed (`@clerk/clerk-react` ^5.61, `@clerk/backend` ^3.2 — `package.json:25-26`). `vercel.json:5` routes all non-`/api` paths to `/index.html` (SPA), so React Router can mount `/portal/*` without infra changes. Caveat surfaced in `src/app/App.tsx:8-17`: ClerkProvider is deliberately NOT root-mounted today because the Clerk production frontend-API domain (`clerk.adalegallink.com`) has no DNS. Portal must mirror admin's pattern — ClerkProvider scoped to `/portal/*` only. |
| a2 | B44 stays as admin only; engine + portal + Clerk all live on Vercel | **survives** | `api/_admin.ts:30-68` already implements the dual-mode admin auth (Clerk session OR `ADALL_BRIDGE_SECRET` bearer header). B44 admin pages reach the engine API via the bridge today. The new admin firm-litigation assignment page is a B44 surface that calls a new bridge-authenticated engine endpoint. |
| a3 | Fold portal code into existing `ada-legal` repo; no new repo | **survives** | Repo already houses engine + admin + public site + Ada chat. Portal is the fourth surface alongside `/admin`, `/`, `/chat`. |
| a4 | Iterative — Ryan + Gina see v1, request changes, iterate | **survives** | Captures intent. No re-validation needed against code. |

## Testability commitment validation

| # | Mechanism named in spec | Achievable? | Notes |
|---|---|---|---|
| 1 | Playwright smoke test against staging | **yes** | `playwright.config.ts` already has `local | preview | prod` targets and runs against `https://ada-legal-git-main-rttg123-6107s-projects.vercel.app` for preview. New spec lands under `tests/personas/portal-attorney-login.spec.ts`. Clerk sign-in flow can be exercised by seeding a test attorney + Clerk user in a pre-test step. |
| 2 | Data-logic test — portal queue selection | **yes** | Mirrors the existing repo pattern (`tests/unit/adminFirmList.test.ts`, `adminSubscriptionAndIntakeLists.test.ts`): seed `makeInMemoryClients`, exercise `listPortalQueueForFirm` against the in-memory data, assert summary counts + row shape match expectations. No React rendering; Playwright covers the rendered DOM at criterion 1's persona test. |
| 3 | Data-logic test — case detail shape | **yes** | Same in-memory-client pattern. Test asserts that `getPortalCaseForFirm` returns contact info, matched case, QQ answers (parsed from `extracted_fields` per the litigation row's `ada_qualifying_questions` shape), and transcript reference. Render-level coverage is handled by criterion 1's Playwright persona, which exercises the page end-to-end. |
| 4 | Playwright smoke — admin assigns → simulate match → portal shows it | **yes** | Hybrid: a Vitest integration test owns the data-plane part (insert litigation_firm_assignment + ada_session with litigation_listing_id, assert portal queue endpoint returns it). A separate Playwright spec drives the B44 admin assignment UI; since B44 is outside this repo, the test stub will POST directly to the new admin endpoint via the bridge secret. |
| 5 | Runtime Neon query on a test session | **yes** | Existing pattern: `tests/integration/finalizeIntakeHandoff.test.ts` already opens a DB client and inspects rows. New integration test asserts `claimant_name`, `claimant_email`, optional `claimant_phone` land in `ada_sessions.extracted_fields` after a scripted persona walks the litigation_match flow. |
| 6 | Manual UI check — handled state grays out across firms | **yes (manual, under cap)** | Spec already declares this as the 1 manual-verification criterion. Test plan: open portal as Firm A attorney, mark handled, open as Firm B attorney sharing the same case, observe gray. Two test attorneys + two test firms + one shared litigation row are required as seed data. |

## New files

### Engine (data + auth + API)
- `src/db/migrations/0019_attorney_portal.sql` — additive migration: `attorneys.user_id`, `attorneys.law_firm_id` (with backfill from `firm_name`), new tables `litigation_firm_assignments`, `firm_session_handled`.
- `api/_attorney.ts` — `requireAttorney(req, res)` helper. Verifies Clerk session, resolves to an `attorneys` row via `user_id`, returns `{ attorneyId, lawFirmId, email }` or 401.
- `api/portal/queue.ts` — `GET` — paginated cases for the requester's firm.
- `api/portal/cases/[id].ts` — `GET` — case detail (transcript + extracted fields + QQ answers + photos).
- `api/portal/cases/[id]/handle.ts` — `POST` — mark a case handled.
- `api/admin/litigation/[id]/firms.ts` — `GET` (list assigned firms) + `PUT` (replace assignment set). Bridge-authenticated.

### Frontend (portal)
- `src/app/layouts/PortalLayout.tsx` — shell with skip link, signed-in attorney email, sign-out, link to `/portal`.
- `src/app/components/RequireAttorney.tsx` — client-side guard mirroring `RequireAdmin`. Note: server-side `requireAttorney` is the real boundary.
- `src/app/routes/portal/SignIn.tsx`, `SignUp.tsx` — Clerk components, mirror of admin.
- `src/app/routes/portal/PortalQueue.tsx` — landing page: summary counts + queue list.
- `src/app/routes/portal/PortalCaseDetail.tsx` — single case view.
- `src/app/data/portalClient.ts` — fetch wrappers for the three portal endpoints, mirroring `src/app/data/adminClient.ts` style if one exists, otherwise an inline pattern.

### Tests (Phase 1, before any code)
- `tests/personas/portal-attorney-login.spec.ts` — Playwright smoke. Sign in as test attorney; expect `/portal` queue page.
- `tests/personas/portal-litigation-match-name-collection.spec.ts` — Playwright spec that drives a litigation_match conversation through to the contact-collection step.
- `tests/unit/portalQueueSelection.test.ts` — Vitest data-logic test against `makeInMemoryClients`. Asserts `listPortalQueueForFirm` returns expected rows + summary counts under varied seed (assigned firms, handled state, unassigned cases). Pattern matches `tests/unit/adminFirmList.test.ts`.
- `tests/unit/portalCaseDetailSelection.test.ts` — Vitest data-logic test against `makeInMemoryClients`. Asserts `getPortalCaseForFirm` returns full case package shape (contact info, matched case, QQ answers, transcript ref) and rejects access when firm doesn't have an assignment for the case's litigation row.
- `tests/integration/portalQueueQuery.test.ts` — assert the queue endpoint joins `litigation_firm_assignments` ⨝ `ada_sessions` correctly and respects `firm_session_handled` for gray-out.
- `tests/integration/litigationMatchContactCapture.test.ts` — runtime Neon query verifying `claimant_name` / `claimant_email` (+ optional `claimant_phone`) land in `extracted_fields` after a scripted litigation_match flow.
- `tests/a11y/portal-aaa.spec.ts` — axe-core AAA audit against `/portal/sign-in`, `/portal` (authed via mocked session), `/portal/cases/<id>`.
- `tests/fixtures/portalSeed.ts` — helper to seed: 2 test law firms, 2 test attorneys with Clerk user pairing, 1 active litigation row assigned to both firms, 2 ada_sessions bound to it.

## Modified files

- `src/db/schema-core.ts` — extend `attorneys` table with `userId` and `lawFirmId`; add `litigationFirmAssignments`, `firmSessionHandled` table definitions. No breaking changes.
- `src/db/schema.ts` — re-export new tables from `schema-core.js` (already barrel-exports).
- `src/db/client.ts` — no change expected (uses generic `drizzle()` over Neon serverless).
- `src/engine/clients/neonDbClient.ts` — add reader methods: `listPortalQueueForFirm(lawFirmId, { page, pageSize, filter })`, `getPortalCaseForFirm(sessionId, lawFirmId)`, `markFirmSessionHandled(sessionId, lawFirmId, userId)`, `listFirmAssignmentsForLitigation(litigationId)`, `replaceFirmAssignmentsForLitigation(litigationId, lawFirmIds)`. Also: `resolveAttorneyByClerkUserId(clerkUserId)`.
- `src/engine/clients/types.ts` — add `PortalQueueRow`, `PortalCaseDetail`, `LitigationFirmAssignment` row types.
- `src/app/App.tsx` — register `/portal/*` route alongside `/admin/*` with its own `<ClerkProvider>` shell (mirrors `AdminShell`). Public routes remain unchanged and stay Clerk-free.
- `content-migration/prompts/ada-identity.md` — add a universal "Identity collection" sub-block: name is collected EARLY (after the user's first substantive turn, before the qualifying questions begin); email + optional phone are collected AT THE END of the qualifying questions for the litigation_match flow. Reuses existing field names `claimant_name`, `claimant_email`, `claimant_phone`. Existing Title III bundle text is updated to point at the universal block.
- `content-migration/prompts/ada-identity.js` — regenerated from the markdown (the `.js` is the consumed artifact; verify regen script lives in scripts/ or content-migration/).
- `api/_admin.ts` — no change. Bridge-secret path stays for B44 firm-assignment admin calls.
- `vercel.json` — no change. Existing rewrite `"/((?!api/).*)" → "/index.html"` already serves `/portal/*` from the SPA.

## Data model changes

All additive. No destructive ALTERs. Migration is replayable.

### `attorneys` — extend
```
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES users(id);
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS law_firm_id uuid REFERENCES law_firms(id);

CREATE INDEX IF NOT EXISTS attorneys_user_id     ON attorneys (user_id)     WHERE user_id     IS NOT NULL;
CREATE INDEX IF NOT EXISTS attorneys_law_firm_id ON attorneys (law_firm_id) WHERE law_firm_id IS NOT NULL;
```
Backfill of `law_firm_id` from existing `firm_name` strings — best-effort case-insensitive match against `law_firms.name`. Unmatched rows stay NULL; admin reconciles in B44. `firm_name` text column stays in place (do not drop; reserved for back-compat reads).

### `litigation_firm_assignments` — new
```
CREATE TABLE IF NOT EXISTS litigation_firm_assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  litigation_listing_id uuid NOT NULL REFERENCES litigation_listings(id) ON DELETE CASCADE,
  law_firm_id           uuid NOT NULL REFERENCES law_firms(id)            ON DELETE CASCADE,
  assigned_by_user_id   uuid REFERENCES users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (litigation_listing_id, law_firm_id)
);
CREATE INDEX IF NOT EXISTS lfa_law_firm   ON litigation_firm_assignments (law_firm_id);
CREATE INDEX IF NOT EXISTS lfa_litigation ON litigation_firm_assignments (litigation_listing_id);
```
Many firms per litigation row (criterion 4). Distinct from `litigation_listings.lead_firm_id` — that field stays for the public detail-page "lead counsel" surface; `litigation_firm_assignments` is the routing fan-out for the portal.

### `firm_session_handled` — new
```
CREATE TABLE IF NOT EXISTS firm_session_handled (
  session_id          uuid NOT NULL REFERENCES ada_sessions(id) ON DELETE CASCADE,
  law_firm_id         uuid NOT NULL REFERENCES law_firms(id)    ON DELETE CASCADE,
  handled_by_user_id  uuid REFERENCES users(id),
  handled_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, law_firm_id)
);
CREATE INDEX IF NOT EXISTS fsh_session ON firm_session_handled (session_id);
```
A row exists ONLY when a firm has marked a case handled (one-bit state, criterion 6). The portal queue query joins this table; when *any* row exists for `(session, firm)` where the firm shares the case, the case is grayed for that firm.

### `ada_sessions` — no schema change
`extracted_fields` already accepts `claimant_name`, `claimant_email`, `claimant_phone` per `src/engine/handoff/attorneyPackage.ts:141-143`. The infrastructure exists; only the prompt needs updating.

### Schema-scan note (post-review update — 2026-05-20)
Live `information_schema.columns` scan against the Neon prod branch (`ancient-star-00703098`) was run during human review of this design and confirmed:

- `users` table EXISTS with `clerk_user_id text NOT NULL`, plus `email`, `display_name`, `role`. `REFERENCES users(id)` is valid.
- `attorneys` does NOT currently have `user_id` or `law_firm_id` columns — migration 0019 will add them as authored.
- `law_firms` exists with the expected shape (id, org_id, name, is_pilot, stripe_customer_id, etc.).
- `litigation_listings.lead_firm_id` exists — distinct from the new `litigation_firm_assignments.law_firm_id` fan-out. Both stay.
- `ada_sessions.user_id uuid REFERENCES users(id)` already exists (currently null for anon Ada sessions; remains unused by portal flow).
- All migrations 0001–0018 applied and reflected in schema; no drift between Drizzle source and live DB.

Ground truth confirmed. No design changes required from schema scan. /implementation Phase 2 still runs `information_schema` checks after the migration applies (defense in depth — re-verifies the migration applied as expected).

## New contracts

### `requireAttorney(req, res)` — auth helper
```ts
interface AttorneyAuthContext {
  attorneyId: string;
  userId: string;        // ada_legal users.id (NOT clerk user id)
  clerkUserId: string;
  lawFirmId: string;
  email: string | null;
}
async function requireAttorney(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AttorneyAuthContext | null>
```
Verifies the Clerk session, resolves to `attorneys` via `user_id`, then to `law_firms` via `law_firm_id`. On any miss writes 401 and returns null. No bridge-secret path — attorney identity is always Clerk-direct.

### `GET /api/portal/queue`
Request: `?page=N&page_size=M&handled=true|false|all` (default `handled=false`).
Response:
```ts
{
  summary: { open_count: number; handled_count: number };
  cases: Array<{
    session_id: string;
    case_name: string;           // from litigation_listings.case_name
    user_name: string | null;    // extracted_fields.claimant_name
    user_email: string | null;   // extracted_fields.claimant_email
    user_phone: string | null;   // extracted_fields.claimant_phone
    matched_at: string;          // session.updated_at when litigation_listing_id was set
    handled_by_other_firm: boolean;  // any firm_session_handled row by another assigned firm
    handled_by_this_firm: boolean;   // firm_session_handled row by this firm
  }>;
  total_count: number; page: number; page_size: number;
}
```

### `GET /api/portal/cases/[id]`
Returns the case detail used by `PortalCaseDetail`. Body shape pulls verbatim from existing `attorneyPackage` projection where possible (`src/engine/handoff/attorneyPackage.ts`), with QQ answers extracted from `extracted_fields` per the litigation row's `ada_qualifying_questions` JSON shape.

### `POST /api/portal/cases/[id]/handle`
Inserts a `firm_session_handled` row. Idempotent — second call is a no-op. No body. 204 on success.

### `GET /api/admin/litigation/[id]/firms` and `PUT /api/admin/litigation/[id]/firms`
Body for PUT: `{ law_firm_ids: string[] }` — replace set semantics. Returns the new set. Bridge-authenticated via `requireAdmin` (existing helper accepts the B44 bridge secret).

## New env vars / config

None required. Existing `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ADALL_BRIDGE_SECRET` cover the portal. The B44 admin firm-assignment page reuses the bridge secret it already holds.

## Alternatives considered

- **Storing attorney identity in Clerk publicMetadata instead of `attorneys.user_id`** — rejected. publicMetadata is editable from the Clerk dashboard with no Postgres audit trail; the law_firm_id binding is sensitive routing data and belongs in our DB with FK integrity. Clerk just supplies user-id at the boundary.
- **Auto-pair attorney↔Clerk user by email on first sign-in** — deferred (DO1 below). v1 takes the explicit-admin path: B44 admin sets `attorneys.user_id` after the attorney signs up. Cleaner audit, no race conditions, no surprise gray cases from email collisions. Email auto-pair can be added in iteration if onboarding friction shows up.
- **Many-to-many handled state via `firm_session_assignments` (one row per fan-out at match time)** — rejected. Fan-out at match-time requires backfill for existing sessions, requires an engine code path to fire on every match_litigation success, and pollutes the table with unhandled rows that are read-only. The on-the-fly JOIN read pattern with `firm_session_handled` (sparse) keeps writes minimal and the queue query stays a single JOIN.
- **Reuse `org_memberships` for attorney↔firm membership** — rejected. `org_memberships` is scoped to `organizations` (ADALL the platform), not to `law_firms`. Adding a parallel `firm_memberships` table inflates surface area; `attorneys.law_firm_id` is sufficient since v1 spec says one firm per attorney and no firm-level admin.
- **Server-rendered portal queue page** — rejected. Existing app is Vite SPA; no SSR framework wired. React Router client-render is the established pattern.
- **Push notification / email when a new case lands** — explicitly out of scope per spec.

## Test architecture

### Per-layer test levels
- **`requireAttorney` helper** — unit (tests/unit). Mock Clerk's `authenticateRequest`; mock DB lookup; assert 401 paths and the success context shape.
- **`listPortalQueueForFirm` / `getPortalCaseForFirm` (db client methods)** — data-logic unit tests (Vitest + `makeInMemoryClients`). Seed firms + litigation rows + sessions + handled rows in memory, exercise the methods, assert shape and filtering. Mirrors existing repo pattern (`adminFirmList.test.ts`, `adminSubscriptionAndIntakeLists.test.ts`).
- **`PortalQueue` + `PortalCaseDetail` components** — render-level coverage via the Playwright persona spec at criterion 1 (`portal-attorney-login.spec.ts` + an extension that drives queue and case-detail navigation post-login). No `@testing-library/react`, no jsdom — repo doesn't use those and this feature doesn't introduce them.
- **Portal API endpoints** — integration (Vitest + Neon test branch). Seed two firms, one shared litigation, two sessions; hit endpoints and assert filtering + handled-state semantics.
- **Litigation-match contact capture** — integration (Vitest + scripted `processAdaTurn`). Drives a conversation through the new prompt; runtime queries Neon for `extracted_fields` keys.
- **WCAG 2.2 AAA audit** — a11y suite. Three new routes added to the AxeBuilder list.
- **End-to-end sign-in + queue render** — persona (Playwright). Drives a real browser through Clerk sign-in → queue → case detail. Skipped on `local` target; runs on `preview` against a pre-seeded test attorney.

### Persona impact (ADALL)
- **Criterion 1 (login)** — new persona spec `portal-attorney-login.spec.ts` (Playwright).
- **Criterion 2 (queue renders)** — data-logic test in `tests/unit/portalQueueSelection.test.ts` covers the data shape; Playwright persona at criterion 1 covers the rendered DOM.
- **Criterion 3 (case detail)** — data-logic test in `tests/unit/portalCaseDetailSelection.test.ts` covers the data shape + cross-firm access denial; Playwright persona at criterion 1 covers the rendered DOM (extended to navigate into a case after login).
- **Criterion 4 (admin assigns → queue shows)** — new integration test (Vitest, hits the admin endpoint via bridge then the portal endpoint via Clerk-mocked context).
- **Criterion 5 (name early, contact late)** — new integration test (`litigationMatchContactCapture.test.ts`) plus a persona-shaped Playwright spec for end-to-end verification.
- **Criterion 6 (handled grays out)** — manual UI check. Test plan documented in `.implementation/` log when the phase ships.

### Runtime verification recipes
- **Criterion 5 verification recipe** — after scripted persona run, query: `SELECT id, extracted_fields->'claimant_name', extracted_fields->'claimant_email', extracted_fields->'claimant_phone', updated_at FROM ada_sessions WHERE id = $sessionId`. Assert `claimant_name.value` is non-null and `extracted_fields.claimant_name.extracted_at` is earlier than the timestamp at which `match_litigation`'s tool result lands in `conversation_history`. (Validates "name was collected early.")
- **Criterion 4 verification recipe** — after admin POST, query: `SELECT 1 FROM litigation_firm_assignments WHERE litigation_listing_id = $L AND law_firm_id = $F`. Then hit `GET /api/portal/queue` as Firm F's attorney and assert the case appears.
- **Criterion 6 verification recipe** — manual; no Neon recipe.

### ATDD posture per phase
- **Phase 1 (test infra)** — n/a. This phase IS the tests.
- **Phase 2 (schema + Drizzle)** — test-first. The migration is verified by reading information_schema in an integration test before /shipit ships the Drizzle update.
- **Phase 3 (auth + API)** — test-first. `requireAttorney` unit test and portal-endpoint integration tests are written against the fixtures from Phase 1 before handlers are authored.
- **Phase 4 (UI)** — test-after for component shells (TDD is friction for pure layout work), test-first for the queue's gray-out logic (criterion 6 risk hotspot).
- **Phase 5 (prompt update)** — test-first. The runtime contact-capture test is the ATDD anchor for the prompt change.

### Regression scope per phase
- **Phase 1** — smoke (typecheck + new tests pass).
- **Phase 2** — targeted: rerun `tests/unit/litigationSchema.test.ts`, `tests/unit/sessionRepo.test.ts`, and the new Phase 1 integration tests after migration applies.
- **Phase 3** — targeted: full `npm run test:unit` and `npm run test:integration` plus the new portal API integration tests.
- **Phase 4** — wider: full `npm run test` (data-logic + integration green from Phase 2/3 forward), `npm run test:a11y`, Playwright persona `portal-attorney-login.spec.ts` (queue + case-detail nav).
- **Phase 5** — wider: full `npm run test`, plus the litigation_match persona suite (`pre-bound-deep-link-resume.spec.ts`, `discovery-qualified.spec.ts`, `multi-match-disambiguation.spec.ts`, `pivot-mid-conversation.spec.ts`) to confirm the prompt change doesn't regress existing flows.

## Phase outline

> Test infrastructure ships first per the /design contract. Engine code never lands before the tests that exercise it.

### Phase 1: Test infrastructure + fixtures (test infra)
- Acceptance criteria covered: scaffolding for 1, 2, 3, 4, 5, 6.
- Files touched: `tests/personas/portal-attorney-login.spec.ts`, `tests/personas/portal-litigation-match-name-collection.spec.ts`, `tests/unit/portalQueueSelection.test.ts`, `tests/unit/portalCaseDetailSelection.test.ts`, `tests/integration/portalQueueQuery.test.ts`, `tests/integration/litigationMatchContactCapture.test.ts`, `tests/a11y/portal-aaa.spec.ts`, `tests/fixtures/portalSeed.ts`.
- Tests authored: all of the above as failing/pending shells with TODO bodies. `portalSeed.ts` lands in Phase 1 as **typed signatures only** (function declarations + parameter types + return types) — the live seed body that inserts rows into `litigation_firm_assignments`, `firm_session_handled`, and `attorneys.user_id/law_firm_id` cannot be authored until Phase 2's migration applies and the columns/tables exist. Phase 2 fills the seed body in as part of its own commit.
- ATDD: n/a (test infra IS the tests).
- Regression scope: smoke — `npm run typecheck`, `npm run lint`. No runtime tests pass yet.
- Runtime verification: n/a — Phase 1 ends with red tests, intentionally.
- Depends on: none.
- **No new test infrastructure** — uses already-installed Vitest config, Playwright, axe-core. No jsdom, no `@testing-library/react`, no `package.json` edits. The data-logic test pattern matches existing tests under `tests/unit/`.

### Phase 2: Schema migration + Drizzle types + in-memory seed (data infra)
- Acceptance criteria covered: prerequisite for 1, 2, 3, 4, 5, 6.
- Files touched: `src/db/migrations/0019_attorney_portal.sql`, `src/db/schema-core.ts`, `src/engine/clients/types.ts`, `src/engine/clients/neonDbClient.ts` (new reader methods only — handlers don't exist yet), `src/engine/clients/inMemoryClients.ts` (mirror the new reader methods in-memory for unit tests), `tests/fixtures/portalSeed.ts` (live seed body — fills in the typed stubs Phase 1 committed).
- Tests authored / modified: `tests/unit/litigationSchema.test.ts` extended to cover new tables; new `tests/integration/portalSchemaApplied.test.ts` runs information_schema scan post-migration. The Phase-1 data-logic tests (`portalQueueSelection.test.ts`, `portalCaseDetailSelection.test.ts`) now turn green for the methods they exercise via the in-memory client.
- ATDD: test-first.
- Regression scope: targeted — `npm run test:unit -- litigationSchema sessionRepo ch1Db portalQueueSelection portalCaseDetailSelection` + new Phase 1 integration tests turn green for data-plane bits.
- Runtime verification: query `information_schema.columns` for the four affected tables; assert new columns/tables exist; assert FK constraints exist.
- Depends on: Phase 1.

### Phase 3: Auth helper + portal/admin API endpoints (backend)
- Acceptance criteria covered: 1, 2, 3, 4, 6.
- Files touched: `api/_attorney.ts`, `api/portal/queue.ts`, `api/portal/cases/[id].ts`, `api/portal/cases/[id]/handle.ts`, `api/admin/litigation/[id]/firms.ts`.
- Tests authored / modified: new `tests/unit/requireAttorney.test.ts` (Clerk auth path mocked), `tests/integration/portalQueueQuery.test.ts` body filled in.
- ATDD: test-first.
- Regression scope: targeted — full `npm run test:unit && npm run test:integration`.
- Runtime verification: hit `GET /api/portal/queue` via `npx vercel dev` or local function harness; assert 401 unauthenticated, 200 with a payload after seed.
- Depends on: Phase 2.

### Phase 4: Portal UI + admin firm-assignment B44 endpoint live (frontend)
- Acceptance criteria covered: 1, 2, 3, 6.
- Files touched: `src/app/App.tsx`, `src/app/layouts/PortalLayout.tsx`, `src/app/components/RequireAttorney.tsx`, `src/app/routes/portal/SignIn.tsx`, `src/app/routes/portal/SignUp.tsx`, `src/app/routes/portal/PortalQueue.tsx`, `src/app/routes/portal/PortalCaseDetail.tsx`, `src/app/data/portalClient.ts`.
- Tests authored / modified: `tests/a11y/portal-aaa.spec.ts` activated; `tests/personas/portal-attorney-login.spec.ts` activated and extended to navigate from queue → case detail (covers render-level criteria 2 + 3 end-to-end).
- ATDD: test-after for component layout; test-first for the gray-out behavior on `PortalQueue` (criterion 6 risk hotspot) — gray-out logic lives in `listPortalQueueForFirm` (Phase 2/3 data-plane) and is asserted in `portalQueueSelection.test.ts`; the rendered gray-out treatment in the React component is verified by Playwright + manual check.
- Regression scope: wider — `npm run test` + `npm run test:a11y`.
- Runtime verification: spin `npm run dev`, sign in as a seeded test attorney, see the queue render; criterion 6 manual check (open as Firm B, mark handled, open as Firm A, observe gray).
- Depends on: Phase 3.

### Phase 5: Prompt update — name-early / contact-late (engine)
- Acceptance criteria covered: 5.
- Files touched: `content-migration/prompts/ada-identity.md`, `content-migration/prompts/ada-identity.js` (regenerated).
- Tests authored / modified: `tests/integration/litigationMatchContactCapture.test.ts` body filled in; `tests/personas/portal-litigation-match-name-collection.spec.ts` activated.
- ATDD: test-first. The runtime contact-capture test is the anchor.
- Regression scope: wider — `npm run test` + persona suite `pre-bound-deep-link-resume.spec.ts`, `discovery-qualified.spec.ts`, `multi-match-disambiguation.spec.ts`, `pivot-mid-conversation.spec.ts`. Prompt edits are global; the discovery / pivot / deep-link personas are the highest-blast-radius regressions to guard.
- Runtime verification: criterion 5 recipe documented above.
- Depends on: Phase 2 (so `extracted_fields` shape is stable); independent of Phases 3 & 4 conceptually but ordered last so engine-only changes don't gate UI work.

## Technical risk register

- **Prompt regression on litigation_match flow** — blast radius: wide (Ada's conversational behavior across the discovery surface). Reversible by reverting the prompt commit. Mitigation: Phase 5 runs the named persona suite before declaring done; the regression scope explicitly lists `discovery-qualified.spec.ts`, `multi-match-disambiguation.spec.ts`, `pivot-mid-conversation.spec.ts`, `pre-bound-deep-link-resume.spec.ts`.
- **`attorneys.firm_name` ↔ `law_firms.name` backfill gap** — blast radius: portal access for attorneys whose `firm_name` doesn't match any `law_firms.name`. Their portal queue is empty until B44 admin sets `law_firm_id` directly. Reversible. Mitigation: backfill SQL emits a row count log; B44 admin gets a triage list of unmatched attorneys.
- **Clerk DNS gap recurring** — App.tsx already scopes ClerkProvider to admin specifically to avoid Clerk JS bundle failures breaking public routes. Portal must mirror that scoping. If a future change root-mounts Clerk, both surfaces regress simultaneously. Mitigation: code review checklist + a comment block on `AdminShell`/`PortalShell` calling out the constraint.
- **`firm_session_handled` race on dual-firm shared cases** — two attorneys at two different firms mark the same case handled within seconds. No collision (composite PK on `(session_id, law_firm_id)`), but the gray-out evaluation reads `WHERE law_firm_id != $self`, so eventual consistency is fine here. Reversible by deleting handled rows (admin-only).
- **Portal API auth boundary regression** — `requireAttorney` is a NEW security boundary. If an attorney's `law_firm_id` is set wrong, they see another firm's queue. Mitigation: integration test asserts that an attorney at Firm A cannot retrieve a session whose litigation row is assigned only to Firm B (negative-path coverage in `portalQueueQuery.test.ts`).
- **Migration 0019 replay on preview/local Neon clones** — All ALTERs use `IF NOT EXISTS`; new tables use `CREATE TABLE IF NOT EXISTS`. Safe to replay. Backfill SQL is wrapped in a guard (`UPDATE ... WHERE law_firm_id IS NULL`) so it's idempotent.

## Resolved technical decisions

> Resolved during human review (2026-05-20). Each was flagged by /design as needing Ryan's input before /implementation.

### DO1: Attorney ↔ Clerk user pairing UX → **auto-pair by verified email**

On first Clerk sign-in, look up `attorneys` by case-insensitive `email` match against the Clerk session's `primaryEmailAddress.emailAddress` (only `verified: true`). If exactly one match and `attorneys.user_id IS NULL`, atomically set both `users.clerk_user_id` + `attorneys.user_id` linkage. If zero matches → 403 with a "not yet onboarded" page. If multiple matches → 500 and log (race; shouldn't happen at v1 scale, but defend against it). Manual admin override path stays as a fallback for edge cases.

**Rationale:** Lower onboarding friction. v1 attorney onboarding is manual ("Gina sends a Clerk invite link to Kelly out-of-band"), so the email auto-pair just-works without a second admin step. The race condition concern (two attorneys with same verified email) is non-existent at ADALL's v1 scale (one onboarded attorney expected).

**Migration impact:** `users.clerk_user_id` is already `NOT NULL`. Clerk-signed-in user → existing or new `users` row. `attorneys.user_id` set on first match. Idempotent on re-login.

### DO2: Reversibility of "handled" → **permanent in v1; admin-unmark deferred**

Once a `firm_session_handled` row exists, the case stays grayed for that firm forever. No attorney-facing "unmark" UI. No admin-facing unmark UI either in v1 (a `DELETE FROM firm_session_handled` against Neon is the manual escape hatch if Gina ever needs it). When light case management ships, the unmark mechanic gets a real UI.

**Rationale:** Spec criterion 6 says "one-bit state" — one-way is the simplest read. Adding reversibility now would force a state machine UI that the spec explicitly defers. v1 ships the simpler path; if attorneys hit a real "I marked the wrong one" situation, that's a v2 feature.

### DO3: Summary counts on portal landing → **scoped to this firm only**

The two counts on the landing page tiles:
- **Open cases:** sessions assigned to this firm via `litigation_firm_assignments` where no `firm_session_handled` row exists for `(session_id, this_firm_id)`.
- **Handled (by this firm):** sessions where this firm has a `firm_session_handled` row.

"Handled by other firm but assigned to this firm" cases show in the open queue with a "handled by another firm" badge (grayed), not in either count.

**Rationale:** Firms only care about their own funnel. Global counts ("how many cases system-wide") are an admin-side concern, not an attorney-portal concern. Keeps the portal cleanly firm-scoped.

### DO4: Name-early prompt scope → **litigation_match flow ONLY**

The new "Identity collection" prompt block in `ada-identity.md` applies *only* to the `litigation_match` flow (when Ada has called `match_litigation` and bound a session to a litigation row). Title III generic intake retains its existing bundled-collection behavior.

**Rationale:** The litigation_match flow is the one feeding the attorney portal — that's where collected identity is load-bearing. Title III flows have their own established collection behavior that's working; changing it would risk regressing personas (`disqualified-immediate`, `out-of-scope-routing`, `dave-barrier-removal`) that aren't blocked on this feature.

**Implementation note for Phase 5:** The prompt block goes inside the litigation_match flow section of `ada-identity.md`. Locate via the section that mentions `match_litigation` tool calls; add the name-early instruction immediately after the tool-call documentation but before the qualifying-questions walkthrough script.

## Approval notes

Reviewed and approved 2026-05-20 with the following changes from the original /design output:

1. **Schema-scan note updated** — live `information_schema` query performed; design's data-model assumptions confirmed against Neon prod. (Was previously caveated "not run; ground truth from source files.")
2. **Four open technical decisions resolved** — DO1 auto-pair, DO2 permanent handled, DO3 firm-scoped counts, DO4 litigation_match-only prompt scope. All resolutions documented above.
3. **B44 admin firm-assignment page scope** — the design correctly defines the Vercel-side API endpoint (`/api/admin/litigation/[id]/firms`) but leaves the B44 admin UI undefined. To unblock criterion 4 testability end-to-end, Phase 4 of /implementation should also build a B44 admin page (`AdminLitigationFirmAssignments` or inline section on `AdminLitigationEdit`). The exact placement is a B44-side product decision; /implementation should pick the lowest-friction option (likely inline section on `AdminLitigationEdit` with a multi-select firms picker, reusing existing B44 admin patterns).
4. **Phase 5 regression watch** — beyond the persona suite named in the design (`pre-bound-deep-link-resume`, `discovery-qualified`, `multi-match-disambiguation`, `pivot-mid-conversation`), Phase 5 /shipit must include a **manual Niles v. Hilton recipe check** before declaring done. Today's Plan C work showed the litigation_match prompt is sensitive; persona tests catch structural breakage but a human conversation catches "Ada got chatty again."
5. **WCAG 2.2 AAA on Clerk sign-in** — out-of-the-box Clerk components are AA. The `tests/a11y/portal-aaa.spec.ts` audit on `/portal/sign-in` will likely fail without customization. Phase 4 must include Clerk `appearance` prop theming to bring sign-in to AAA contrast and focus indicators.

6. **Component-test pattern revised (Path A, 2026-05-20 after /implementation Phase 1 halt)** — initial design cited `adminFirmList.test.ts` and `adminSubscriptionAndIntakeLists.test.ts` as "React testing patterns." `/implementation /plan --auto` correctly halted at Phase 1 because those files are data-logic tests, not component renders; the repo has zero React-rendering test infrastructure (no jsdom, no `@testing-library/react`, vitest config doesn't even glob `.test.tsx`). Resolution: re-spec criteria 2 + 3 as data-logic tests against `makeInMemoryClients` matching the actual repo pattern. Files renamed `portalQueueComponent.test.tsx` → `portalQueueSelection.test.ts` and `portalCaseDetailComponent.test.tsx` → `portalCaseDetailSelection.test.ts`. Render-level coverage moves to the Playwright persona at criterion 1, extended to navigate queue → case detail. `portalSeed.ts` Phase-1 deliverable narrowed to typed signatures only; live body fills in during Phase 2 after the migration applies. No new dependencies, no `package.json` edits, no shared-list churn.

Ready for /implementation Phase 1.
