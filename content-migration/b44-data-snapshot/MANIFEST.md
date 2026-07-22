# Base44 Data Snapshot — M0 (B44 Exit Plan)

**Exported:** 2026-07-22 ~23:30 UTC, via Base44 MCP `query_entities` (app `6994acc34810e36068eddec2`)
**Purpose:** Point-in-time preservation of all Base44 entity data before the content freeze and migration to Neon/Vercel. This snapshot is the recovery baseline; Neon remains the single source of truth going forward.

| Entity | Records | File | Notes |
|---|---|---|---|
| AnalyticsEvent | 1,647 | AnalyticsEvent.json | Complete through 2026-07-22T22:36 UTC. Still written daily by live `trackEvent` — records after export time are NOT captured here. Candidate for history import in M5 (plan decision o3). |
| Case | 25 | Case.json | Feb 2026 marketplace-era; seed/test data. DROP-classified. |
| ContactLog | 1 | ContactLog.json | Marketplace-era. |
| EmailTemplate | 10 (metadata) | EmailTemplate.metadata.json | **body_html deliberately excluded** to avoid hand-transcription corruption of ~40KB of HTML. Full bodies remain retrievable via Base44 MCP until M8 decommission; the branded layout shell is version-controlled at `ada-legal-link-B44/src/components/emails/brandedEmailTemplate.jsx`. All 10 are marketplace-era templates wired to dead automations (DROP). |
| Feedback | 2 | Feedback.json | 1 real (Liz Treston), 1 archived test. |
| LawyerNote | 1 | LawyerNote.json | Marketplace-era. |
| LawyerProfile | 1 | LawyerProfile.json | Kelley Brooks Simoneaux — canonical record lives in Neon (`attorneys` row 7f21fb79); this is the stale B44 copy. |
| Litigation | 38 | Litigation.json | All 37 fields incl. `ada_qualifying_questions`, `kind`, `slug`, reading-level variants. Reconciled against Neon `litigation_listings` (39) — see `litigation-reconciliation/`. |
| PhotoAnalysis | 0 | PhotoAnalysis.json | Empty entity. |
| SiteConfig | 1 | SiteConfig.json | Flags `ada_universal_cta=false`, `lawsuits_ada_cta_enabled=false` → migrate to Neon `system_settings` (M0 step 3, gated on Ryan approval). |
| TimelineEvent | 39 | TimelineEvent.json | Feb 2026 marketplace-era. |
| User | 9 | User.json | Base44 auth users; superseded by Clerk on Vercel. |
| WaitlistSignup | 1 | WaitlistSignup.json | chyward@live.com, report_violation. |

**CommunityVote:** referenced in B44 code (`useCommunityVotes`) but the entity schema was **never created** in the app — 0 records exist, nothing to export. The Neon `community_votes` table in M5 starts empty by design.

**Fidelity note:** Litigation and AnalyticsEvent batches ≥500 records were transferred losslessly from stored MCP tool results. Smaller entities and the final 147-record AnalyticsEvent tail were transcribed from inline MCP responses and validated for JSON integrity and unique IDs.
