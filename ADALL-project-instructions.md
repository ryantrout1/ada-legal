# ADA Legal Link — Project Instructions

Read this before touching any code. Two failures cause almost all rework: **building in the wrong repo** (§1) and **debugging the wrong layer** (§0). Route first, know where components live second, build third.

---

## 0. ENVIRONMENT & CONNECTIONS (the layer everything runs on)

One product, spread across two repos and a handful of services. Knowing *where each thing lives* and *which tool answers which question* is what stops a fix landing in the wrong layer. All facts below are source-verified, not assumed.

### 0a. Where components live (source of truth per service)

| Service | Source of truth for | How Claude reaches it | The trap that bites |
|---|---|---|---|
| **Neon** (`ancient-star-00703098`, db `neondb`) | ALL real ADALL data — sessions, cases, attorneys, firms, litigation, activity, packages | Neon MCP (`tool_search("Neon run_sql Postgres database")`) | Second Neon project `hidden-cake-22611400` is a DIFFERENT product — never target it. jsonb needs `col::jsonb ? 'x'`, not `= ANY`. |
| **Vercel** (`prj_9ENS5goyV1CebGGQ0vgEemxO7rwo`, team `team_5bHG5lqOMg6NE20epNW2vZsV`) | Hosting/compute for the whole engine + attorney portal | Vercel MCP tools | Per-deploy `*-<hash>.vercel.app` URLs 401 — verify on `ada.adalegallink.com`. Bash can't reach the domain; use `web_fetch_vercel_url`. |
| **Base44** (app `6994acc34810e36068eddec2`) | The consumer site + Gina's admin *screens* only. Holds NO ADALL truth. | Base44 MCP (entity tools bypass SDK schema validation) | MCP writes persist even when the SDK save path is broken — masks failures. Publish is manual (Ryan only). |
| **Clerk** | Auth for the **attorney portal AND Vercel admin** (`clerk.adalegallink.com`) | Clerk MCP | This is NOT the consumer auth — see 0b. Kelley's attorney row `7f21fb79` has null `user_id` = the pilot login blocker. |
| **Resend** | Transactional email (firm/claimant notifications, self-help) | Reads env in the engine; verify via Neon receipts | Silent-fails into a `NOTIFIED`/receipt row when env is unset. Domain `adalegallink.com` verified (Jul 7). |
| **Vercel Blob** | Uploaded photo bytes | Browser uploads direct; engine reads URLs | Only `*.public.blob.vercel-storage.com` URLs are allowlisted (3 layers). 10 MB cap. |
| **Sentry** | Runtime error tracking | Sentry MCP | — |
| **GitHub** (`ryantrout1/*`) | Source of record for both repos | GitHub API via bash; MCP where available | Secret-scanning revokes PATs embedded in push URLs — strip immediately. |
| **Stripe** | Subscriptions (deferred; wired, not on pilot path) | env | Pilot is free — not a launch concern. |

### 0b. TWO separate auth systems (verified — do not conflate)

- **Consumer side (B44, `adalegallink.com`):** Base44's own auth — `base44.auth.me()` / `redirectToLogin()`. The `/ada` chat, claimant `CaseDetail`, `MyCases`, `Login` all use this.
- **Attorney portal + admin backend (Vercel):** **Clerk**, direct. `api/_attorney.ts` is Clerk-only (no bridge). `api/_admin.ts` accepts Clerk **or** the bridge secret (see 0c).
- A claimant and an attorney are authenticated by **different systems in different repos.** "Login is broken" always starts with: which login?

### 0c. The connection seams (how the two halves actually talk)

1. **Ada chat (cross-origin + credentials):** B44 `adaApi.js` (`VERCEL_BASE` hard-coded `https://ada.adalegallink.com`) → `POST /api/ada/*` with `credentials:'include'`. The `ada_anon` cookie is `SameSite=Lax; Secure`, host-scoped — **it lands on `ada.adalegallink.com`, not `adalegallink.com`.** Works only because `adalegallink.com` is in the Vercel CORS allowlist. Break this and every turn 401s.
2. **Photo upload (bypasses the API):** browser → Vercel Blob **directly** via `@vercel/blob/client.upload()` (token minted at `/api/ada/upload-photo`). The bytes never transit an API handler; the URL threads into `/api/ada/turn`.
3. **Admin bridge (B44 → Vercel):** B44 admin page → `adminApi.js` → `base44.functions.invoke('adallProxy')` → Vercel `/api/admin/*` with `Authorization: Bearer ${ADALL_BRIDGE_SECRET}` + `X-Admin-Email`. Secret lives in **both** Vercel and B44 env, never client-side. Rotate when Base44 is formally retired.
4. **CORS allowlist (exact):** `adalegallink.com`, `ada.adalegallink.com`, `preview--ada-claim-legal.base44.app`, `localhost:5173/3000`. Nothing else can cross with credentials.

### 0d. ⚠️ Dual-source debt (verified — do NOT extend)

Not everything on B44 goes through the bridge. These pages still read Base44 entities directly, bypassing Neon:
- `CaseDetail.jsx`, `MyCases.jsx`, `Intake.jsx` → `base44.entities.Case / TimelineEvent / LawyerProfile`
- `Lawsuits.jsx`, `LawsuitDetail.jsx` → `base44.entities.Litigation` (so public litigation can diverge from what Ada matches against in Neon)

Legacy, being retired. New reads of real ADALL data go through `adminApi`/`publicApi` → Neon. (`SiteConfig`, `Feedback`, `AnalyticsEvent`, `EmailTemplate` are genuinely B44-native and fine.)

### 0e. Diagnostic routing (which tool answers which question)

| Question | Go straight to |
|---|---|
| Is it deployed / did the redeploy land? | Vercel `list_deployments` (needs `since` Unix-ms) |
| Why is it 500ing? | Vercel `get_runtime_errors`, then `get_runtime_logs` |
| Did email actually fire? | Neon — `case_activity` for a `NOTIFIED` row + the session's email receipt (never trust "configured") |
| Did a case route correctly? | Neon — `cases` lane/status + `case_activity` ROUTED/CONSENT rows |
| Is the attorney login wired? | Neon — attorney row `user_id` not null; then Clerk |
| Build failed on push? | Vercel `get_deployment_build_logs` (errorsOnly) |

**Never verify model-dependent behavior via local script** — Sensitive env vars (`ANTHROPIC_API_KEY`) return empty from `vercel env pull` by design. Use the live deployed endpoint.

---

## 1. THE ROUTING RULE (read this first, every time)

There are TWO repos. Every change belongs in exactly one. Before writing any code, state which repo the change goes in and why: **`Repo: <name> — because <reason>.`**

| If the change is… | Repo | Deploys to |
|---|---|---|
| Engine, database, migrations, any `/api/*` endpoint, attorney portal (`/portal/*`), Ada intake, photo analyzer, routing/matching, tests | **ada-legal** (Vercel) | `ada.adalegallink.com` — auto on push |
| Consumer site, admin UI Gina uses (`/AdminFirms`, `/AdminAttorneys`, `/AdminListings`, etc.), anything on `adalegallink.com` | **ada-legal-link-B44** (Base44) | `adalegallink.com` — push + webhook + **Ryan clicks Publish** |

Hard rules:
- **Backend logic → ada-legal. Admin UI → B44. Never both for the same feature.**
- Never build admin UI in the Vercel repo — its `/admin/*` React pages are retiring dead code.
- Never revive Base44 entities as datastores. **Neon is the single source of truth.**
- The bridge: B44 admin pages call Vercel `/api/admin/*` via `src/lib/adminApi.js` → `base44.functions.invoke('adallProxy')`. A new admin feature = backend endpoint in ada-legal + UI page in B44, two commits, two repos.
- Each repo has `scripts/check-repo-boundary.sh` — greps for the other repo's tells (`base44.entities` in ada-legal; `@vercel/node`/Drizzle in B44) and fails the push. Run it in the gate.

---

## 2. Repo cheat sheets

### ada-legal (Vercel) — the platform
- GitHub: `ryantrout1/ada-legal` · sandbox `/home/claude/ada-legal`
- Live: `ada.adalegallink.com` · Vercel project `prj_9ENS5goyV1CebGGQ0vgEemxO7rwo`, team `team_5bHG5lqOMg6NE20epNW2vZsV`
- Stack: React/TS, Tailwind v4 (CSS `@theme`), Drizzle (`lawFirmsTable` alias), Clerk (`clerk.adalegallink.com`), Anthropic SDK, lucide-react
- **Gates before every push:** `tsc --noEmit` + `npm run build` + full vitest green + `bash scripts/check-repo-boundary.sh`. ESLint baseline 0.
- Deploy: push to main → Vercel READY ~90s. Verify on the public alias (per-deployment `*-<hash>.vercel.app` URLs 401). `Vercel:web_fetch_vercel_url` fetches live JSON; bash cannot reach the domain.
- Bundle spot-check: grep `dist/assets/` for known strings.

### ada-legal-link-B44 (Base44) — consumer site + Gina's admin
- GitHub: `ryantrout1/ada-legal-link-B44` (private — PAT to clone/push) · sandbox `/home/claude/ada-legal-link-B44`
- Live: `adalegallink.com`
- **Gates before every push:** `npm run lint` + `npx vite build` + `bash scripts/check-repo-boundary.sh`. tsc is NOT a gate here (red repo-wide). No test runner exists (0 tests). Never use `npm run build`.
- **Workflow every push:** `git pull --rebase origin main` first (Base44 tooling commits to main between sessions).
- **Webhook can stall** (hook id `620576914` returns 200 but doesn't apply): after every push, force redelivery — `GET .../hooks/620576914/deliveries?per_page=1` for the latest id, then `POST .../deliveries/{id}/attempts` (expect 202).
- **Claude cannot Publish.** Ryan clicks Publish in the Base44 editor. Remind once per batch, not per push.
- New pages: register in `src/pages.config.js` (import + PAGES entry) + usually a nav entry in `src/components/admin/AdminLayout.jsx`. Flat routing via `?id=` and `createPageUrl('PageName')`.

### Git (both repos)
- Identity: `Ryan Trout <ryan@adalegallink.com>` (Base44 sync skips base44-builder[bot] commits).
- Direct-to-main, one commit per concern. No per-push approval — after gates pass, push.
- PAT hygiene: inject into remote URL only for the push, strip immediately (`git remote set-url origin https://github.com/...`), redact from logs. GitHub secret-scanning revokes PATs in push URLs — Ryan rotates per session.

---

## 3. Connected services (quick tool notes — full topology in §0)

**Neon** — project `ancient-star-00703098`, db `neondb`. Load via `tool_search("Neon run_sql Postgres database")` each session. `run_sql` single / `run_sql_transaction` (array) for multi-statement DDL. jsonb: `affected_states::jsonb ? 'X'`. Diagnose constraint failures via `pg_get_constraintdef` before retrying. Never overwrite DATABASE_URL via `vercel env pull`. Second project `hidden-cake-22611400` is a different product — never target it.

**Vercel MCP** — `list_deployments` needs a `since` Unix-ms timestamp. `get_runtime_errors` for "why 500", `get_deployment_build_logs` for failed builds. `ANTHROPIC_API_KEY` is Sensitive — `vercel env pull` returns it empty by design.

**Clerk** — auth for portal + Vercel admin. Ryan `user_3Ch66BRAi667x6XndV3sKjRMMRr` → internal `a8ac00dd` → attorney `9717a1ba`. Kelley's attorney row `7f21fb79` (user_id null — the real pilot unblock). Org `3fa40288-c96f-4a7d-b5cf-7af2382e4744`, Kelley's firm `3f10aa3b-3633-45dc-97a1-216cc719dfff`.

**Email/env** — engine reads `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `ADMIN_NOTIFICATION_EMAIL`, `ADALL_BRIDGE_SECRET`, `BLOB_READ_WRITE_TOKEN`, `GOOGLE_MAPS_API_KEY`, `STRIPE_SECRET_KEY`. Missing email env → silent soft-fail into a receipt row; confirm sends via Neon, not config.

---

## 4. Workflow skills — THE PAIRS ARE MANDATORY, NOT OPTIONAL

Two paired skills. **The pair is the point.** Each pair splits *thinking* from *doing* with a hard stop in between, so Ryan sanity-checks the plan before any code moves. This split has saved this project repeatedly; collapsing it has failed it repeatedly.

- **`/plan` → `/shipit`** — design/architecture work. `/plan` produces a phased build plan, **no code**. `/shipit [Phase N]` executes one phase.
- **`/triage` → `/fixit`** — bug work. `/triage` diagnoses to 100% root cause + a fix plan, **no code**. `/fixit` executes it.
- `/regress` pins a just-fixed bug as a permanent test + ledger row.
- `/handoff` packs the thread for a fresh session.

### The enforcement rule (read before every bug or build task)

When Ryan says `/triage` or `/plan`, that is a **diagnosis-only / design-only** instruction. Claude's job that turn is to **read, reason, and write the plan — then STOP.** Do not edit a file. Do not commit. Do not push. End the turn with the plan and the "Ready for /fixit?" (or "Ready for /shipit?") line, and **wait for Ryan to say `/fixit` / `/shipit`.**

**The failure mode this exists to prevent:** Claude gets confident mid-diagnosis, decides the fix is obvious, and collapses `/triage` → `/fixit` into one turn — diagnosing, editing, committing, and pushing without stopping. **This is the single most expensive mistake in this project's history.** Every time it has happened, the "obvious" fix was the wrong layer and cost multiple failed rounds. Every time the stop was honored, the root cause was found on the first try.

Concretely:
- `/triage` or `/plan` invoked → **produce the plan, change nothing, stop.** Confidence is not a license to skip the stop. "I'm sure I know the fix" is exactly the thought that precedes the expensive mistakes.
- Only `/fixit` / `/shipit` authorizes code changes. No code moves before that word.
- If Claude believes the fix is trivial and wants to skip straight to it, that belief is **not** grounds to collapse the pair — surface it in the plan and still wait.
- If the plan isn't at 100% confidence, `/triage` says so and does **not** offer `/fixit` — it names the missing piece (per the skill).
- Actually invoke the skill file (`/mnt/skills/user/triage/SKILL.md` etc.) and follow its flow — including the **falsification test** step. Skipping "read the skill, run the falsification test" is how symptom-level fixes get shipped as if they were root causes.

If Claude ever finds itself editing code in the same turn `/triage` or `/plan` was invoked, that is the error condition — stop, and hand back the plan instead.

Operating mode: **Claude implements, Ryan runs live validation.** Terse output, single decisive recommendations, no confirmation loops, no option menus. Ryan often dictates — interpret phonetics ("Versailles"/"Brazil" = Vercel, "Base Forty Four" = Base44).

---

## 5. Standing constraints (non-negotiable)

- **WCAG 2.2 AAA is the floor.** 44px targets minimum on anything Gina or attorneys click (Gina navigates by knuckle). 7:1 text / 3:1 non-text. Full keyboard parity incl. DnD. A contrast-floor pass is not a complete a11y pass.
- **SOL dates are attorney-set only. Never auto-computed.** (UPL/malpractice.)
- **Never certify compliance; photo analysis is always disclosed as triage/screening**, not instrumented measurement.
- **Gina reviews all lawyer- and claimant-facing copy** before any user-facing enable.
- Photo analyzer rules: absence-honesty (empty findings = no concern, not uncertainty) + hedge-don't-drop (`confirmable: false`, never omit).
- Ada prompt edits: edit `.md` → `node scripts/generate-prompt-modules.mjs` → confirm text in `.ts`. Editing only the `.md` is a silent no-op (the engine loads `ada-identity.ts`).
- No fabricated data in UI — honest empty/"coming" states.

---

## 6. AAA design tokens (corrected values — use these)

- accent interactive: `accent-600` `#9C340A` (accent-500 fails 7:1)
- `success-500` `#305533` · `warning-500` `#664512`
- control borders: `--color-control-border: #948F81` (≥3:1 all themes)
- Ada violet (scoped `.ada-accent`): `#6D28D9` light / `#B9A6FC` dark / `#C4B5FD` contrast
- Portal (Phase 5 mockup, portal-scoped only): accent `#9C340A`, secondary `#4C586A`, muted `#4F5763`, pills green `#0F5D2C` / amber `#853A0D` / red `#941616`

---

## Pre-push checklist (every push, both repos)

1. Which repo? State it: `Repo: <name> — because <reason>.` (§1 routing table.)
2. Right gates run and green? (ada-legal: tsc+build+vitest+boundary · B44: lint+vite build+boundary)
3. B44 only: rebased? webhook redelivered? Publish reminder queued?
4. PAT stripped from remote URL?
5. One commit per concern?
