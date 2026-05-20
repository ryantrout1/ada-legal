# Attorney Portal

**Project:** ADA Legal Link
**Status:** locked

## Elevator pitch

Vetted attorneys log in via Clerk and see a queue of user sessions matched to cases their firm handles. Closes the loop on Plan C — Ada matches users, the portal delivers them to the right firm.

## The problem

Today Ada matches users to litigation rows (Plan C, shipped 2026-05-20) but the matched sessions have nowhere to go. No firm gets notified. No attorney sees a queue. Cases evaporate.

## The user

Vetted attorneys representing firms ADALL routes cases to (e.g., Kelly Tilman at Spinal Cord Injury Law Firm). They log in, see new matches for their firm, and contact users via their own existing channels (phone, email, intake forms they already run).

## Success criteria

1. An attorney can log in via Clerk and reach the portal at `ada.adalegallink.com/portal`.
2. The portal landing page shows a summary (counts) plus a queue of matched sessions routed to the attorney's firm.
3. Each queue item shows the user's contact info (name, email, optional phone), the matched case, the qualifying-question answers, and the conversation transcript.
4. Admin can assign firms to litigation rows via a new admin page in B44, and a session matched to a litigation row appears in every assigned firm's queue.
5. Ada collects the user's name early in the conversation and email + optional phone at the end of qualifying-questions, then stores them on the session.
6. Attorneys can mark a case as handled (one-bit state); handled cases gray out in other firms' queues that share the case.

## Out of scope

- Light case management (notes, status pipeline, claim/unclaim — deferred to a future feature)
- Firm-level admin within the firm (Kelly cannot invite other attorneys; only ADALL admin can)
- Attorney profile / settings page
- Notifications or email digests when new cases land
- Auto-routing logic beyond admin-set firm-litigation assignments
- The specific wording of Ada's handoff message at end of conversation (deferred to a separate product decision)

## Assumptions

- **a1:** Architecture A — portal on Vercel at `ada.adalegallink.com/portal`, alongside the existing Ada engine. Clerk on Vercel handles auth natively. No cross-domain bridge needed.
- **a2:** B44 stays as admin only. Engine + portal + Clerk all live on Vercel.
- **a3:** Fold portal code into the existing `ada-legal` repo; no new repo.
- **a4:** Iterative build — Ryan and Gina see v1, request changes, iterate. This spec is not the final word; it locks scope for the first build only.

## Constraints & non-negotiables

- WCAG 2.2 AAA on all UI (ADALL standard)
- No new subdomain — use the existing `ada.adalegallink.com` Vercel deployment
- Database schema additions must be additive — nothing destructive
- Schema migration to add `attorneys.law_firm_id` FK and backfill from existing `firm_name` strings is required before portal queue queries are meaningful

## Product risk register

- **What if attorneys don't use it?** Discoverable at next conversation with Kelly Tilman. Nobody is using it during build, so the cost of unused functionality is low. Fix-forward via iteration based on real attorney feedback.
- **Rollback strategy:** Fix-forward. Code is in git; can revert any commit. No feature flag. Nobody is using this during build.
- **Decision owner:** Ryan.

## Testability commitment

| # | Success criterion | Verification mechanism |
|---|---|---|
| 1 | Attorney logs in via Clerk and reaches portal | Playwright smoke test against staging |
| 2 | Portal landing page renders summary + queue | Component test |
| 3 | Queue items show full case package (contact info, matched case, QQ answers, transcript) | Component test |
| 4 | Admin firm-litigation assignment surfaces session in firm's queue | Playwright smoke (admin assigns → simulate session match → portal shows it) |
| 5 | Ada collects name early, contact info late, stores on session | Runtime Neon query on a test session |
| 6 | Mark-as-handled grays out the case in other firms' queues that share it | Manual UI check |

**Manual-verification count:** 1 / 2 (under cap)

## Rollout strategy

Full — no feature flag, no gradual rollout. Build, deploy, iterate. Nobody is using this during build; fix-forward when something breaks.
