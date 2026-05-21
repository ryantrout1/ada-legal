# Verify — Attorney Portal

**Project:** ADA Legal Link
**Spec:** `.features/attorney-portal.md`
**Blueprint:** `.design/attorney-portal.md`
**Implementation log:** `.implementation/attorney-portal.md` (status: `complete`)
**Verdict:** SHIPPED WITH DEVIATIONS

## Per-criterion verification

| # | Success criterion | Mechanism (from spec) | Sub-verdict | Evidence |
|---|---|---|---|---|
| 1 | Attorney logs in via Clerk and reaches the portal at `ada.adalegallink.com/portal` | Playwright smoke against staging | **deviated** | Code shipped + auth boundary unit-verified: `api/_attorney.ts` `requireAttorney` (Clerk-direct) + `resolveAttorneyContext`; `requireAttorney.test.ts` 4 green (success ctx shape, firm isolation, email fallback, miss→null→403). `App.tsx` `PortalShell` mounts `/portal/*` with subtree-scoped `ClerkProvider`; `RequireAttorney` + `SignIn` shipped. `portal-attorney-login.spec.ts` unauth-redirect + Clerk-card assertions are LIVE but run on the **preview** target (Playwright needs a served app + chromium); full Clerk sign-in stays `test.fixme` (repo limitation, mirrors `admin-auth.spec.ts`). The spec's "Playwright smoke against staging" is **deferred to a Vercel preview deploy** — not run at verify-time. |
| 2 | Portal landing renders a summary (counts) + queue of matched sessions | Component test | **deviated** | Mechanism revised by approved `/design` (6ceec5f) from "component test" → **data-logic test**: `portalQueueSelection.test.ts` 8 green (firm-scoping, firm-scoped open/handled counts per DO3, cross-firm boundary, gray-out, handled filter, pagination). `PortalQueue.tsx` shipped (summary tiles + queue list). React render-level coverage is the Playwright persona — **deferred to preview** (authed route). |
| 3 | Queue items show full case package (contact, matched case, QQ answers, transcript) | Component test | **deviated** | Revised to data-logic: `portalCaseDetailSelection.test.ts` 7 green (full package shape, contact, QQ answers from extracted_fields, transcript, firm access boundary). `PortalCaseDetail.tsx` shipped (contact + qualifying answers + transcript + mark-handled). Render-level via Playwright — **deferred to preview**. |
| 4 | Admin firm-litigation assignment surfaces the session in the firm's queue | Playwright smoke (admin assigns → simulate match → portal shows) | **deviated** | Now **code-complete end-to-end** (Phase 6). Data-plane verified green: `portalQueueQuery.test.ts` — "assigning a firm to a litigation row surfaces its sessions in that firm queue" + the negative boundary (Firm A cannot read a Firm-B-only session). Admin endpoint `GET/PUT /api/admin/litigation/[id]/firms` shipped + bridge-authed (Phase 3). **B44 admin UI shipped** (Phase 6): `LitigationFirmAssignmentPanel` on `AdminLitigationEdit` in repo `ada-legal-link-B44` (commit `2bdfd90`) — GET firms?page_size=100 + GET/PUT assignments via `adminApi`/adallProxy; gate: eslint clean, `vite build` green, 0 new tsc errors. The full GET/PUT round-trip + Playwright-through-B44 is **deferred to a preview deploy** — same runtime-pending state as criteria 1/2/3/6 (no longer a v1 descope). |
| 5 | Ada collects name early + email/optional phone late, stores them on the session | Runtime Neon query on a test session | **met** | The spec's named mechanism RAN and confirmed: **manual Niles v. Hilton check** on session `6e2ea48a-a2a9-436d-9ab7-aff9385bed18` — `claimant_name="Ryan"` in `extracted_fields`, `match_litigation` fired, QQ#1 verbatim, no state/city/date intake regression, Hard Rule preserved. Deterministic anchor `litigationMatchContactCapture.test.ts` 4 green (red→green verified): the name-early/contact-late block shipped into `ada-identity.ts`, DO4-scoped (litigation-match only), hard-rule preserved. Note: name-early is behaviorally confirmed; email/phone-late is prompt-instructed + plumbing-ready (`extracted_fields` accepts `claimant_email`/`claimant_phone`; `attorneyPackage.ts` reads them) — see Deferred for the light full-session confirmation. |
| 6 | Mark-as-handled grays out the case in other firms' queues that share it | Manual UI check (the spec's 1 declared manual criterion) | **deviated** | Data-plane verified green: `portalQueueSelection.test.ts` "grays out a shared case for the OTHER firm when one firm handles it" + `portalQueueQuery.test.ts` gray-out test. `firm_session_handled` table + `listPortalQueueForFirm` gray-out flags + `PortalQueue.tsx` rendered gray treatment shipped. The spec-acknowledged **manual cross-firm UI check** (Firm B marks handled → Firm A observes gray) is **deferred to preview**, exactly as the spec planned (manual-verification count 1/2). |

## Scope creep
- `migration 0019` backfill is **org-scoped** (`a.org_id = lf.org_id`) — a deliberate safety tightening over the design's plain case-insensitive name match, because `law_firm_id` gates portal data access (a security boundary). Flagged in-file with a `[REVIEW NOTE]`; human applied + verified it. Legitimate adjacent hardening, not feature creep.
- Otherwise `n/a` — every shipped commit maps to a spec criterion or its approved blueprint/test architecture (data-logic tests, `portalSchemaApplied`, in-memory mirrors are all per the approved `/design`).

## Dropped scope
- `n/a — no silent drops.` Every spec criterion has shipped code evidence. The B44 admin firm-assignment UI (criterion 4) — previously a v1 descope — was **built and shipped in Phase 6** (`ada-legal-link-B44` commit `2bdfd90`), so it is no longer dropped. One sub-feature remains an **explicitly accepted descope** (user decision, not silent):
  - **DO1 auto-pair-by-email** — user chose manual pairing for v1 (Kelly paired via the 0019 backfill); auto-pair is a future scoped enhancement.

## Deferred runtime verifications
All require a Vercel **preview deploy** (the verify-time loop env has no served app / browser / Clerk session):
- **Criterion 1** — deploy preview, sign in as the paired test attorney, confirm landing on `/portal`. Or `npm run test:personas:preview` (portal-attorney-login).
- **Criteria 2 & 3** — Playwright render of `/portal` (queue) and `/portal/cases/:id` (detail) authed (`test.fixme` until a seeded Clerk session is wired on preview).
- **Criterion 4** — in the deployed B44 admin app, open a litigation row, check a firm in the "Assigned firms" panel, Save (PUT via adallProxy), then confirm a matched session appears in that firm's `/portal` queue. (Data-plane already green; B44 panel shipped at `2bdfd90`.)
- **Criterion 5** — light follow-up: confirm `claimant_email`/`claimant_phone` are captured at the END of a *completed* litigation_match session (name-early already confirmed via Niles).
- **Criterion 6** — manual: open as Firm B, mark a shared case handled, open as Firm A, observe the case grayed.
- **WCAG 2.2 AAA** — `npm run test:a11y:preview` for `portal-aaa.spec.ts` (`/portal/sign-in` live; authed routes `test.fixme`). Clerk `appearance` themed to AAA (token-derived); audit confirms at runtime.

## Test coverage summary
- Tests added this feature: `portalQueueSelection` (8), `portalCaseDetailSelection` (7), `requireAttorney` (4), `portalQueueQuery` (4), `litigationMatchContactCapture` (4), `litigationSchema` portal block (3), `portalSchemaApplied` (4, skips without DATABASE_URL); Playwright `portal-attorney-login` + `portal-aaa` (sign-in/AAA live, authed `test.fixme`), `portal-litigation-match-name-collection` (`test.fixme`, manual gate).
- Tests passing: **787 / 787** (vitest run) + 4 skipped (DB/preview-gated), 0 todo, 0 failures. Portal-specific re-run at verify time: 26 green across 5 files.
- typecheck clean; `vite build` clean.
- Regression scope per phase (impl log): P1 smoke, P2 targeted, P3 targeted, P4 wider, P5 wider — all met at code level; Playwright/persona suites preview-deferred.
- ADALL: WCAG axe — deferred to preview (0 new expected; not run at verify-time). Playwright smoke — sign-in assertions live on preview.

## Open issues
- `vite build` emits a >500 kB chunk-size warning — **pre-existing**, not introduced by this feature (the main bundle was already large). Not a regression.
- `package-lock.json` (ada-legal) had local working-tree drift (523-line prune from the user's `npm install`); the loop left it uncommitted — user discarding separately.
- **`ada-legal-link-B44` TypeScript hygiene debt (backlog candidate):** the B44 repo has **619 pre-existing `tsc` errors** in unrelated pages (`LawyerRegister`, `Marketplace`, `MyCases`, `RightsPathway`) — NOT from Phase 6 (verified 619 with == 619 without the Phase 6 change) and NOT blocking (`build` is `vite build`, no `tsc` gate). Flagged for the agentic-OS backlog as "ada-legal-link-B44 has TypeScript hygiene debt unrelated to this work."

## Recommendations
- **Deploy to preview (both apps) and run the deferred checks** (criteria 1, 2, 3, 4, 6 + WCAG). These are the spec's own named mechanisms (Playwright staging smoke, the B44 admin-assign click-through, the declared manual UI check) — they need deployed environments to run. Passing them converts every deviation to `met` → clean SHIPPED.
- **Criterion 5**: optionally confirm email/phone capture in a full completed session (name-early already confirmed).
- **DO1 auto-pair**: user-accepted v1 descope — schedule as a separate scoped task if/when onboarding friction shows up. No spec revision required.
- **`ada-legal-link-B44` typecheck debt**: file the 619-error cleanup as a separate backlog item (see Open issues) — independent of this feature.
- No `/triage` candidates surfaced; no failing mechanisms; no silent drops.

## Verdict summary
All six criteria are now **code-complete end-to-end** across the two repos: Phases 1–5 in ada-legal (data/auth/UI/prompt, 787 tests green) and Phase 6 in `ada-legal-link-B44` (the B44 admin firm-assignment panel, `2bdfd90`). The regression-sensitive behavioral criterion (criterion 5, name-early/contact-late) is **behaviorally confirmed** via the manual Niles v. Hilton recipe. The verdict remains **SHIPPED WITH DEVIATIONS** — not because anything is missing, but because the five non-behavioral criteria are verified via a different-than-spec'd mechanism (2 & 3 revised to data-logic tests by the approved `/design`) or have their spec-named UI / staging / admin-click-through verification **deferred to a preview deploy** (1, 2, 3, 4, 6). No criterion is `not met`; no silent dropped scope; the prior criterion-4 descope was closed by Phase 6. Next step to reach clean SHIPPED: deploy both apps to preview and run the deferred Playwright + B44 click-through + manual UI + WCAG checks.
