# ADA standards catalog — versioning & update process

The structured catalog at `src/lib/adaCatalog.ts` is the single source of
truth for the **section → rule → role → guide-page** mapping. The photo
analyzer reads it as a system block (Phase 3) and resolves finding links
through it (Phase 4); `standardsIndex.ts` is a separate keyword/topic layer
that is reconciled with it (never allowed to disagree).

This doc is how you change the catalog — e.g. to fold in a future amendment
— without reintroducing the kind of hole that motivated the whole effort
(a missing §608 shower family, and `guide_slug`s that pointed at pages that
didn't exist).

## Canonical source (v1)

- **2010 ADA Standards for Accessible Design**, chapters 1–10
  (U.S. Access Board: `https://www.access-board.gov/ada/`), federal only.
- State amendments (e.g. California 11B) are **deferred** — not in v1.
- This catalog is **physical** standards only. WCAG 2.2 AAA (the digital
  track) lives elsewhere and is out of scope here.
- Rule text is a **working draft**: interim sign-off from Gina, with deeper
  legal review to follow. Treat the text as paraphrase, not legal advice.

## What CI guarantees (`tests/unit/adaCatalog.test.ts`, runs via `npm test`)

1. **Completeness** — every 3-digit section in the TOC has a catalog row.
   The oracle is `EXPECTED_SECTION_RANGES` in that test (118 sections). A
   removed/renumbered section fails the build.
2. **Slug integrity** — every `guide_slug` is either `''` (chapter-URL
   fallback) or a page that actually exists. The real-page set is imported
   live from `GUIDE_LOADERS` (`standardsGuideIndex.ts`), so the check stays
   in sync with the guide automatically.
3. **Drift guard** — the catalog and `standardsIndex` may never point the
   same section at two *different* guide pages.
4. **Curb gating-first regression** — the rendered checklist marks §608.7
   `[GATING]`, leads the shower group with a gating rule, keeps the
   transient-lodging scoping caveat, and the analyzer prompt keeps the
   "Disqualifying barriers come first" instruction. This pins the
   deterministic scaffolding. The *live* behavior (a curb photo actually
   producing a critical finding) is verified by hand in the photo-review
   admin — a test can't run it because it needs the deployed Anthropic
   endpoint.

## Updating the catalog (amendment checklist)

1. **Edit the rows** in `src/lib/adaCatalog.ts`. One row per section; add
   subsection rows (`§604.3`) where detail matters. Keep the field set:
   `section, chapter, title, fixture, rule, access_role, photo_assessable,
   guide_slug, source_ref`.
   - `access_role`: `gating` (blocks access entirely) | `component`
     (a deficiency within an otherwise usable element) | `scoping`
     (Chapter-2 applicability) | `reference` (admin / general / definitional).
   - `photo_assessable`: `true` only if a camera can establish it.
2. **If sections were added or renumbered**, update
   `EXPECTED_SECTION_RANGES` in `tests/unit/adaCatalog.test.ts` to match the
   new TOC. This is the deliberate two-step that keeps completeness honest.
3. **Set `guide_slug` to a page that exists** (a key of `GUIDE_LOADERS`) or
   `''`. Do not invent slugs. If a topic deserves a dedicated page, build
   the guide page first, then point at it.
4. **If a section maps to a topic `standardsIndex` also covers**, make sure
   they resolve to the same page (the drift guard enforces this).
5. **Run `npm test`.** Completeness, slug integrity, drift, and the curb
   regression must all be green.
6. **If you changed prompt content**, regenerate the compiled modules:
   `node scripts/generate-prompt-modules.mjs`, and confirm the generated
   `.ts` reflects the change.
7. **Legal review** of any new/changed rule text (Gina) before relying on
   it for citation-grade output.

## Why two steps for completeness

The completeness oracle is intentionally hand-maintained, not derived from
the catalog itself — otherwise the test would always pass (the catalog
would be checked against itself). Encoding the authoritative TOC separately
is what lets a *missing* section be caught. When the standard changes, both
the catalog and the oracle change together, and the diff makes the change
reviewable.
