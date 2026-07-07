# ADALL Routing Card

**The #1 recurring failure is building in the wrong repo. Route first, build second.**

## The contract (do this every build task, no exceptions)

Before writing or editing any code, emit one line:

> **Repo: `<ada-legal | ada-legal-link-B44>` — because `<one concrete reason>`.**

No routing line = not allowed to start. Ryan can stop any task that skips it.

## The decision table

| The change is… | Repo | Lives at |
|---|---|---|
| `/api/*` endpoint, engine, DB, migration, Drizzle | **ada-legal** | `ada.adalegallink.com` |
| Attorney portal (`/portal/*` pages + `/api/portal/*`) | **ada-legal** | `ada.adalegallink.com` |
| Ada intake engine, prompt, tools, routing/matching | **ada-legal** | `ada.adalegallink.com` |
| Photo analyzer (Opus) + review queue | **ada-legal** | `ada.adalegallink.com` |
| Admin **backend** endpoints (`/api/admin/*`) | **ada-legal** | `ada.adalegallink.com` |
| Tests (vitest, Playwright) | **ada-legal** | — |
| Consumer site (Home, guides, Lawsuits, `/ada` chat **UI**) | **B44** | `adalegallink.com` |
| Admin **UI** Gina uses (AdminFirms/Attorneys/Listings screens) | **B44** | `adalegallink.com` |
| A new admin **page** (register in `pages.config.js`) | **B44** | `adalegallink.com` |

## Three traps that cause wrong-repo builds

1. **"Admin" is ambiguous — it's split.** Admin **UI** → B44. Admin **backend endpoint** → ada-legal. A new admin feature is almost always **BOTH**: endpoint in ada-legal + page in B44, two commits, two repos. If you're touching only one, confirm that's intended.
2. **ada-legal has a retiring admin twin.** Its `/admin/*` React pages look like the admin UI but are **dead code being retired**. Gina's real admin is in B44. Never build admin UI in ada-legal.
3. **B44 is a front-end only.** It holds no engine logic. If a B44 task needs data that no endpoint serves yet, the endpoint is an **ada-legal task first**.

## The bridge (one system, two repos)

B44 admin page → `src/lib/adminApi.js` → `base44.functions.invoke('adallProxy')` → ada-legal `/api/admin/*` (Bearer `ADALL_BRIDGE_SECRET`). **Neon is the single source of truth.** B44 draws the screen; ada-legal + Neon hold the truth.

## Verified data-flow map (source-checked, not comments)

- Ada chat: B44 `Ada.jsx`/`adaApi.js` → cross-origin → ada-legal `/api/ada/*` → Neon. ✅ clean
- Photo: browser → Vercel Blob → ada-legal `/api/ada/turn`. ✅ clean
- Admin: B44 → adallProxy bridge → ada-legal `/api/admin/*` → Neon. ✅ clean
- Public attorneys: B44 `Attorneys.jsx` → `publicApi` → ada-legal `/api/attorneys` → Neon. ✅ clean
- ⚠️ **Dual-source debt (do NOT extend):** B44 `CaseDetail/MyCases/Intake` read `base44.entities.Case/TimelineEvent/LawyerProfile`; `Lawsuits/LawsuitDetail` read `base44.entities.Litigation`. Legacy, being retired — new real-data reads go through Neon.

## Gates (repo-specific — using the wrong gate is itself a routing error)

- **ada-legal:** `tsc --noEmit && npm run build && npx vitest run` + `bash scripts/check-repo-boundary.sh`
- **B44:** `npm run lint && npx vite build` + `bash scripts/check-repo-boundary.sh` — **NO tsc, NO test runner, never `npm run build`**
- **B44 push ritual:** rebase → push → force webhook redelivery (hook `620576914`) → remind Ryan to Publish (Claude cannot Publish).

## Mechanical backstop

Each repo has `scripts/check-repo-boundary.sh` — greps for the other repo's tells (`base44.entities` in ada-legal; `@vercel/node`/Drizzle in B44) and fails the push. It's the safety net for when the routing line gets skipped. Run it as part of every push.
