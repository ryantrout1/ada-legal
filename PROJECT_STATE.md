# Project State — ADA Legal Link

**Last updated:** 2026-05-21 (seed from RETROSPECTIVE-attorney-portal.md) — by manual scaffold (AOS-022)
**Maintained by:** /verify writes a fresh snapshot on every feature close (document-close, AOS-034); /design and /verify read this on entry (verify-open, AOS-033). Memory holds user preferences, not project state — state lives here and version-controls cleanly.

> ADA Legal Link is a **two-repo project**. This file (in the Engine repo) describes the whole project; the Admin repo carries its own copy.

## Active repos
| Repo | Role | Platform | Production? |
|---|---|---|---|
| ryantrout1/ada-legal | engine + portal | Vercel + Neon + Clerk + Claude | yes |
| ryantrout1/ada-legal-link-B44 | admin UI | Base44 (git-synced bidirectionally) | yes |

## Product lines
- Plan C (litigation matching → attorney portal): attorney-portal feature SHIPPED 2026-05-21 (per retrospective)

## Feature flags
| Flag | Value | Source / how to verify |
|---|---|---|
| ada_universal_cta | OFF | per RETROSPECTIVE-attorney-portal.md (final state); confirm in SiteConfig before relying on it |

## Recent migrations
| Migration | Applied | Notes |
|---|---|---|
| 0019 | 2026-05-21 (Neon prod) | attorney-portal schema; verify via `information_schema` scan against the prod branch |

## Dead / deferred code
- ~10 Ch1 marketplace admin pages flagged for sunset (AOS-024)
- 619 legacy tsc errors in ada-legal-link-B44 (AOS-020) — build gate only, typecheck not a gate there
- Auto-pair (DO1) deferred for v1

## In flight / pending
- attorney-portal: preview-deploy runtime checks pending to close /verify deviations
- ada_universal_cta flag flip pending Ryan's decision

## Recently shipped (newest first)
- 2026-05-21: attorney-portal — 5 phases on ada-legal (787 tests), Phase 6 admin panel on ada-legal-link-B44; verdict SHIPPED WITH DEVIATIONS (preview-deploy pending) per retrospective
