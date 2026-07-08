# CLAUDE.md — ada-legal (Vercel platform)

**You are in `ada-legal`. This is the Vercel platform repo: the engine, database, every `/api/*` endpoint, the attorney portal, Ada intake, the photo analyzer, routing.**

## STOP — route before you build

Before editing anything, answer this out loud in your reply:

> **Repo: ada-legal — because <one concrete reason>.**

If you cannot finish that sentence with something on the ✅ list below, you are in the **wrong repo**. Stop and switch to `ada-legal-link-B44`.

### ✅ Belongs here
- Any `/api/*` endpoint (handler files importing `@vercel/node`)
- Database, Drizzle schema, migrations (`src/db`, `src/engine`)
- Ada intake engine, prompt assembly, tools, routing/matching
- Photo analyzer (the Opus structured analyzer + review queue)
- The **attorney portal** — `/portal/*` React pages + `/api/portal/*` (this is a real live app served from Vercel)
- Public read APIs (`/api/public/*`) and `/s/:slug` summary pages
- Admin **backend endpoints** (`/api/admin/*`) — the logic, not the UI
- Tests (vitest, Playwright)

### ⛔ Does NOT belong here — switch repos
- **Admin UI Gina uses** (`AdminFirms`, `AdminAttorneys`, `AdminListings` screens) → **B44**. The `/admin/*` React pages in THIS repo are **retiring dead code**. Do not add to them, do not "fix" them, do not treat them as the admin surface.
- **Consumer site** — anything a claimant sees on `adalegallink.com` (`/ada` chat UI, Lawsuits, Home, guides, claimant case portal) → **B44**.

### The bridge (how the two connect)
Gina's B44 admin page → `base44.functions.invoke('adallProxy')` → **this repo's** `/api/admin/*` with `Authorization: Bearer ${ADALL_BRIDGE_SECRET}`. So a new admin feature is **two commits in two repos**: the endpoint here, the page in B44. If you're only touching one, double-check that's correct.

## Hard invariants (verified against source, not comments)
- **Neon is the single source of truth.** `base44.entities.*` must **never** appear in this repo. The boundary check enforces this.
- SOL dates are attorney-set, never auto-computed (UPL/malpractice).
- Photo analysis is triage/screening, never certification. Empty findings = no concern (not uncertainty); hedge with `confirmable: false`, never drop.
- Ada prompt edits: edit `.md` → `node scripts/generate-prompt-modules.mjs` → **confirm the new text landed in the `.ts`**. Editing only the `.md` is a silent no-op — the engine loads `ada-identity.ts`.
- WCAG 2.2 AAA floor. 44px targets. 7:1 text / 3:1 non-text. Full keyboard parity incl. DnD.
- No fabricated data in UI — honest empty / "coming" states.

## STOP — the skill pairs are mandatory

`/triage` → `/fixit` (bugs) and `/plan` → `/shipit` (builds) are **pairs with a hard stop between them.**

- `/triage` and `/plan` are **diagnosis/design ONLY.** Read, reason, write the plan, **STOP.** No edit, no commit, no push. End with "Ready for /fixit?" and wait.
- Only `/fixit` / `/shipit` authorizes code changes.
- **The failure mode:** getting confident mid-diagnosis and collapsing the pair into one turn — fixing before the plan is confirmed. This has been the most expensive mistake in this project. Confidence is NOT a license to skip the stop; "the fix is obvious" is the exact thought that precedes the wrong-layer fix.
- Actually open the skill file (`/mnt/skills/user/*/SKILL.md`) and follow it — including the **falsification test**. Skipping it ships symptom fixes disguised as root causes.
- Editing code in the same turn `/triage` or `/plan` was invoked = error condition. Stop, hand back the plan.

## Gates before every push (all must pass)
```
tsc --noEmit && npm run build && npx vitest run
bash scripts/check-repo-boundary.sh     # wrong-repo tell check
```
ESLint baseline is 0. Direct-to-main, one commit per concern, no per-push approval.

## Deploy & verify
Push to main → Vercel auto-deploys → READY ~90s. Verify on the **public alias** `ada.adalegallink.com` (per-deployment `*-<hash>.vercel.app` URLs return 401). Bash cannot reach the domain from the sandbox; use the Vercel MCP `web_fetch_vercel_url` for live JSON, or the Neon MCP for data.

## Key facts
- GitHub `ryantrout1/ada-legal` · Vercel project `prj_9ENS5goyV1CebGGQ0vgEemxO7rwo`, team `team_5bHG5lqOMg6NE20epNW2vZsV`
- Neon project `ancient-star-00703098`, db `neondb`
- Stack: React/TS, Tailwind v4 (`@theme`), Drizzle, Clerk, Anthropic SDK
- Git identity: `Ryan Trout <ryan@adalegallink.com>`. Strip PAT from remote URL immediately after push.

See `docs/ROUTING-CARD.md` for the shared decision table.
