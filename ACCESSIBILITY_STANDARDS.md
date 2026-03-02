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
- [ ] No `color: 'white'` — use `var(--dark-heading)` or `var(--btn-text)`
