# Litigation Reconciliation — B44 `Litigation` (38) vs Neon `litigation_listings` (39)

**Compared:** 2026-07-22 · B44 export in `../b44-data-snapshot/Litigation.json` vs live Neon (`ancient-star-00703098` / `neondb`).
**Method:** record-by-record on `slug`; scalars compared exactly; prose compared by md5 + length; jsonb inspected per-field.

## Slug-level result
- **38 shared slugs** — every B44 record exists in Neon. **Zero B44-only records → zero ADDs.**
- **1 Neon-only record:** `demo-national-retail-ada-title-iii` (status `draft`, is a demo). Untouched by this merge.

## Field-level findings

| Field group | Result | Authority |
|---|---|---|
| `kind`, `case_name`, `status`, `docket_number`, `filing_date`, `court` | **Identical on all 38** | — (no change) |
| `legal_theory` | Identical on all 38 | — |
| `short_description` | Identical except **coen**, **williams** (minor B44 edits) | B44 |
| `full_description`, `eligibility` (standard reading level) | **Differ on 35/38.** B44 consistently shorter (typ. −100 to −1000 chars): a June 5, 2026 editorial trim pass in B44 (verified on `a4a`: removed a "Fifth Circuit has been skeptical…" court characterization, tightened wording; complete sentences, not truncation). Neon last updated May 19/21 — B44 copy is ~2.5 weeks newer. | **B44** |
| 14 reading-level variants (`*_simple` / `*_professional`) | Same content; Neon lengths +1 to +6 chars from **doubled-apostrophe corruption** (`DOT''s` instead of `DOT's`) — present in **33/38** Neon rows' prose and **26/38** rows' `ada_qualifying_questions`. B44 copies are clean. | **B44** (fixes corruption) |
| `key_dates`, `ada_qualifying_questions`, `defendants`, `affected_states` | Semantically aligned; Neon carries the apostrophe corruption inside jsonb text values | **B44** (only where values differ after normalization) |
| `lead_firm_id`, `lead_attorney_id` | B44: **null on all records.** Neon: Kelley wired on `niles-v-hilton-bed-heights` (attorney `7f21fb79`) | **Neon** (preserve) |
| `related_listing_ids` | B44: **empty on all records.** Neon: real uuid cross-references on 8 listings | **Neon** (preserve) |
| `id`, `org_id`, `created_at` | Neon-native | **Neon** (preserve) |

## Schema migration required: NONE
Every B44 field maps to an existing `litigation_listings` column. The plan anticipated possible new columns — not needed. B44 bookkeeping fields (`created_by`, `is_sample`, B44 `id`) are intentionally dropped; the snapshot preserves them.

## Proposed merge (pending Ryan approval — NO Neon writes yet)
For each of the 38 shared slugs, UPDATE only these columns, and only where the normalized B44 value differs from Neon:
`short_description`, `full_description`, `eligibility`, all 14 reading-level variant columns, `key_dates`, `ada_qualifying_questions`, `defendants`, `affected_states` — set from the B44 snapshot; `updated_at = now()`.
Preserve untouched: `id`, `org_id`, `created_at`, `slug`, `kind`, `case_name`, `status`, `docket_number`, `filing_date`, `court`, `legal_theory`, `lead_firm_id`, `lead_attorney_id`, `related_listing_ids`. `demo-national-retail-ada-title-iii` untouched.

**Reversibility:** before any UPDATE, dump the current Neon values of every to-be-changed column for all 38 rows to `neon-pre-merge-backup.json`, committed to git alongside this doc. Rollback = re-apply backup values.

**Blast radius (why this stops for review):** `litigation_listings` feeds Ada's case matching + qualifying questions and Gina's admin immediately. Net effect of the merge: newest human-edited copy + apostrophe corruption fixed; Kelley's attorney wiring and listing cross-refs preserved.

---

## Merge applied — 2026-07-23 (completed across two sessions)

The first merge attempt (2026-07-22 ~23:47 UTC) crashed mid-application. State found at recovery: corruption fix fully applied (zero doubled apostrophes anywhere, prose + jsonb), jsonb fields aligned, but the B44 editorial prose diffs largely unapplied.

**Recovery session completed the merge:**
1. `bryant` + `niles`: `full_description` + `eligibility` applied from B44.
2. 31 further rows: exactly the differing fields applied from B44 — `full_description` (31 rows), `eligibility` (26), `full_description_professional` (2: anoka, higher-ed).

**One correction to the original proposal:** the 8 guidance fields (`documentation_required_*`, `evidence_guidance_*`, `no_documentation_path_*`, `what_this_is_not_*`) are **empty in the entire B44 export** — Neon holds the only content. Authority for these flips to **Neon (preserve)**; they were correctly never overwritten.

**Final verification (2026-07-23):**
- Global md5 digest over the 9 B44-authority prose fields × 38 shared slugs: **identical** on both sides (`4d8e639907d5b9b1639015d86a2bf6b7`).
- Zero doubled-apostrophe corruption across all prose + jsonb columns.
- Preserved: Kelley's attorney wiring on niles (`7f21fb79…`), listing cross-references (9 rows), Neon ids/timestamps, demo listing untouched (`draft`).

**SiteConfig flags migrated** into `system_settings.admin` (full-blob read-modify-write): `ada_universal_cta: false`, `lawsuits_ada_cta_enabled: false`. Existing keys (`spot_enabled`, `ada_chat_enabled`, `ada_photo_enabled`, `spot_test_payment`) untouched.

Rollback remains available via `neon-pre-merge-backup.json`.
