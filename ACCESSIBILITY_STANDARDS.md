# ADA Legal Link — Accessibility Standards & Fix Log
## WCAG 2.2 AAA — Homepage Audit Findings & Remediation

This document tracks every accessibility issue found and fixed on the homepage.
When migrating new pages, use this as a pre-flight checklist — these patterns
must be applied to every public-facing page we touch.

---

## FIXED ISSUES (apply to all future pages)

### FIX-01: blockquote attribution must live inside the element
**SC:** 1.3.1 Info and Relationships
**Problem:** Attribution (name, role) was outside `<blockquote>` in a sibling div.
Screen reader users heard the quote then unrelated content — no link between them.
**Fix:** Wrap attribution in `<footer>` inside `<blockquote>`.
```jsx
<blockquote>
  <p>Quote text...</p>
  <footer>
    <cite>Name — Role</cite>
  </footer>
</blockquote>
```

### FIX-02: Never use aria-hidden on visible eyebrow/section labels
**SC:** 1.3.1 Info and Relationships
**Problem:** Eyebrow labels ("How It Works", "What We Built", "For Attorneys") had
`aria-hidden="true"`, hiding useful orientation context from screen reader users.
**Fix:** Remove aria-hidden from eyebrow labels entirely. They provide context.

### FIX-03: Stats/data grids need accessible list markup and aria-labels
**SC:** 1.3.1 Info and Relationships
**Problem:** Stat tiles rendered as plain divs — screen readers read "42" and
"Diagrams" as disconnected text nodes.
**Fix:** Use `<ul>` / `<li>` with combined `aria-label` per item:
```jsx
<ul style={{listStyle:'none', ...}}>
  <li aria-label="42 diagrams">
    <span aria-hidden="true">42</span>
    <span>Diagrams</span>
  </li>
</ul>
```

### FIX-04: Never use var(--slate-*) in public components — use design tokens only
**SC:** 1.4.3 Contrast (Minimum)
**Problem:** `var(--slate-900)` used in KYR card headings — old design system variable
not controlled by DisplaySettings. Renders dark-on-dark in dark mode.
**Fix:** Always use `var(--heading)`, `var(--body)`, etc. Never `var(--slate-*)`.

### FIX-05: No hardcoded border colors in public components
**SC:** 1.4.11 Non-text Contrast
**Problem:** `border: '1px solid #E2E8F0'` hardcoded in card separators — doesn't
update in dark/warm/HC mode.
**Fix:** Always use `var(--border)` or `var(--border-lighter)` for borders.

### FIX-06: No var(--slate-*) in border declarations
**SC:** 1.4.11 Non-text Contrast
**Problem:** `border: '1px solid var(--slate-200)'` — same as FIX-04, old variable.
**Fix:** Use `var(--border)` or `var(--card-border)`.

### FIX-07: Footer buttons need explicit focus-visible styles
**SC:** 2.4.11 Focus Appearance (AAA)
**Problem:** Footer `<button>` "Report a Violation" had no focus-visible style beyond
browser default. CTA buttons had focus rules; footer button did not.
**Fix:** Add `.landing-footer-link:focus-visible` to LandingStyles with visible
outline using `var(--accent-light)`.

### FIX-08: No hardcoded accent colors in borders or SVG strokes
**SC:** 1.4.11 Non-text Contrast
**Problem:** `border: '2px solid #C2410C'` in ForAttorneys button — doesn't adapt
to high-contrast or warm mode.
**Fix:** Always use `var(--accent)` for accent-colored borders.

### FIX-09: SVG strokes must use tokens, not hardcoded color names
**SC:** 1.4.3 Contrast
**Problem:** `stroke="white"` on scroll indicator SVG — hardcoded, won't adapt.
**Fix:** Use `stroke="var(--dark-heading)"` or `currentColor` with inherited color.

### FIX-10: Stats grids need 1-column reflow at 360px (WCAG reflow minimum)
**SC:** 1.4.10 Reflow
**Problem:** 2-column stats grid at 480px breakpoint can still force horizontal
scroll on 320-360px devices. WCAG 2.2 requires no horizontal scroll at 320px.
**Fix:** Add `grid-template-columns: 1fr` breakpoint at 360px or below.

### FIX-11: Time/metadata indicators need accessible context association
**SC:** 1.3.1 Info and Relationships
**Problem:** Step time estimates ("About 5 minutes") rendered as floating `<span>`
with no programmatic association to their parent step.
**Fix:** Add visually hidden prefix text or use `aria-label` on the containing
element to associate the time with the step.

### FIX-12: role="img" containers hide visible child text from screen readers
**SC:** 1.3.1 Info and Relationships
**Problem:** `role="img"` on a container with both an image and visible overlay text
("Video Coming Soon") causes the text to be inaccessible — `role="img"` overrides
all child semantics. *(OurStorySection)*
**Fix:** Remove `role="img"` from the container. Give the `<img>` a descriptive `alt`
attribute instead. Overlay text is then naturally accessible.

### FIX-13: Placeholder anchor links need accessible status indication
**SC:** 2.4.4 Link Purpose
**Problem:** Footer links pointing to `#accessibility`, `#privacy`, `#terms` navigate
nowhere — the fragment targets don't exist. Screen reader users have no way to know
these are non-functional placeholders. *(LandingFooterNew)*
**Fix:** Add `<span className="sr-only"> (coming soon)</span>` inside each link so
assistive technology users know the destination is not yet available.

### FIX-14: Card-level hardcoded hex colors don't adapt across display modes
**SC:** 1.4.3 Contrast (Minimum)
**Problem:** KYR Title cards used hardcoded hex for accent strips (`#B14A2E`, `#2563EB`,
`#B45309`), subtitle colors, and badge colors. These don't update in dark/warm/HC modes.
*(KnowYourRightsSection)*
**Fix:** Replace with design tokens: `var(--accent)`, `var(--link)`, `var(--accent-light)`
for accent strips; `var(--section-label)`, `var(--link)` for subtitles; `var(--card-bg)`,
`var(--body-secondary)`, `var(--border)` for badges.

---

## PRE-FLIGHT CHECKLIST FOR EVERY NEW PAGE

Before committing any public-facing component, verify:

- [ ] All `<blockquote>` attributions are inside the element as `<footer><cite>`
- [ ] No eyebrow/section labels use `aria-hidden="true"`
- [ ] All stat/data grids use `<ul>`/`<li>` with combined `aria-label` per item
- [ ] Zero uses of `var(--slate-*)` — design tokens only
- [ ] Zero hardcoded hex colors in borders (`var(--border)` / `var(--card-border)`)
- [ ] Zero hardcoded hex colors in SVG strokes (use `currentColor` or tokens)
- [ ] All interactive elements have `focus-visible` styles defined
- [ ] All accent borders use `var(--accent)` not `#C2410C`
- [ ] Grids have 1-column reflow breakpoint at ≤360px
- [ ] Step/list metadata is programmatically associated with its parent item
- [ ] All interactive elements have `minHeight: 44px` touch targets
- [ ] All decorative images have `aria-hidden="true"` AND `alt=""`
- [ ] All `<section>` elements have `aria-labelledby` pointing to a valid heading
- [ ] External links have `rel="noopener noreferrer"`
- [ ] Every interactive element has a CSS class with an explicit `focus-visible` rule
- [ ] Nested container padding does not stack beyond 48px total horizontal on mobile
- [ ] All body text has `lineHeight` of at least 1.5 (headings exempt)
- [ ] No `color: 'white'` — use `var(--dark-heading)` or `var(--btn-text)`
- [ ] No `role="img"` on containers that contain visible text children
- [ ] Placeholder/non-functional links have sr-only status text (e.g., "coming soon")
- [ ] Per-card accent colors use design tokens, not hardcoded hex

### FIX-15: All interactive elements need explicit focus-visible styles
**SC:** 2.4.11 Focus Appearance (AAA)
**Problem:** StoriesSection "Explore →" links and KYR CTA link had no CSS class
with a focus-visible rule — fell back to browser default which does not meet AAA
minimum contrast/area requirements.
**Fix:** Add a class (`landing-link-accent` or `landing-btn-primary`) with a
`focus-visible` rule using `outline: 3px solid var(--accent-light)`.

### FIX-16: Nested padding must not stack on mobile viewports
**SC:** 1.4.10 Reflow
**Problem:** Hero inner grid had `padding: 0 2.5rem` (40px/side) that stacked with
the section-level `24px` override at ≤900px, leaving only ~192px for content at 320px.
**Fix:** Zero out inner grid padding at the 900px breakpoint where the section
already provides horizontal padding.

### FIX-17: Body text line-height must be at least 1.5
**SC:** 1.4.8 Visual Presentation (AAA)
**Problem:** ForAttorneys stat label text had `lineHeight: 1.4` — below the AAA
minimum of 1.5 for paragraph/body text (headings are exempt).
**Fix:** Change to `lineHeight: 1.5`.

---

## Standards Guide Page Audit

Completed: 2026-03-02

### Phase 1: Token Migration (12 files)
All hardcoded hex, `var(--slate-*)`, and `var(--terra-*)` values migrated to
DisplaySettings design tokens across: StandardsStyles, StandardsHero, QuickFilters,
BreadcrumbAndInfo, StandardsSidebar, ResourceSection, ResourceCard, ChapterNavigator,
ShareCardButton, GuideReportCTA, ADAAssistant, StandardsGuide page.

Exceptions retained:
- `dotColor` hex in ResourceSections data (decorative 6px dots, aria-hidden)
- `iconBg` hex in ResourceSections data (icon background squares with white aria-hidden icons)
- `CAT_COLORS` rgba backgrounds/borders in ADAAssistant (decorative tints)

### Phase 2: WCAG 2.2 AAA + Mobile Audit

**Findings fixed:**
- ADAAssistant clear button 28px → 44px touch target
- ADAAssistant starter chips missing minHeight: 44px
- ADAAssistant all hex colors → tokens
- ADAAssistant CAT_COLORS text → semantic tokens for AAA contrast
- BreadcrumbAndInfo Home link + attorney link missing focus-visible class
- Resource type label text color changed from per-section hex (some fail AAA)
  to var(--section-label) which passes 7:1

**Audit checks passed:**
- [x] Zero hardcoded hex in display properties (except decorative data dots/icons)
- [x] Zero var(--slate-*) or var(--terra-*) references
- [x] 10 focus-visible rules covering all interactive element classes
- [x] All interactive elements ≥ 44px touch targets
- [x] All grids reflow: hero 1fr@900px, body 1fr@960px, cards 1fr@600px, chapters auto-fit
- [x] Heading hierarchy h1→h2(×6)→h3 — no skipped levels
- [x] All body text lineHeight ≥ 1.5
- [x] All aria-hidden only on decorative elements
- [x] Search input has label, role="search", role="combobox", aria-expanded, live region
- [x] Breadcrumb has nav[aria-label="Breadcrumb"] with aria-current="page"
- [x] Resource sections have section[aria-labelledby] with matching h2 IDs
- [x] prefers-reduced-motion disables all transitions/transforms
- [x] prefers-contrast increases border widths
- [x] No horizontal overflow at 320px viewport (filter row uses intentional overflow-x:auto)
- [x] Padding at 320px: 16px each side = 288px available content width

---

## Guide System Complete Migration

Completed: 2026-03-02

### Scope: 97 files across 5 tiers

**Tier 1 — Shared components (44 pages):** GuideSection, GuideLegalCallout, GuideStyles
**Tier 2 — Chapter system (10 pages):** ChapterPageLayout
**Tier 3 — Support components:** CiteLink, AutoCiteLinks, ShareBar, AskADAHelper, GuideHeroBanner
**Tier 4 — Individual pages:** 44 guide page files
**Tier 5 — Diagrams:** 43 diagram component files

### Token Migration Results
- var(--slate-*): 0 remaining (was 400+)
- var(--terra-*): 0 remaining
- Hardcoded hex: 0 in shared components, ~16 decorative callout tints in pages,
  SVG drawing colors in diagrams (intentionally retained)

### WCAG Fixes Applied
- Reading level buttons: 32px → 44px touch targets
- Report Violation button: 36px → 44px
- Focus-visible rules added for: guide links, accordion headers, share buttons,
  details/summary, diagram controls, unit toggles
- prefers-reduced-motion: disables transitions in guide content
- prefers-contrast: increases border width on legal callouts

### Decorative Colors Intentionally Retained
- Diagram SVG fills/strokes (technical illustration colors)
- Callout category tints: #DCFCE7 (green), #FEF3C7 (yellow), #FEE2E2 (red),
  #EDE9FE (purple), #DBEAFE (blue) — always inside card-bg containers,
  text over them uses proper tokens
