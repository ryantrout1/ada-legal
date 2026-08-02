# AAA accessibility gate

The accessibility suite lives in `tests/a11y/` and runs via `npm run verify:a11y`
(the WCAG 2.2 AAA theme-matrix contrast sweep + report) and `npm run test:a11y`
(the full Playwright a11y config, which runs **every** spec in `tests/a11y/`).
It exists because the earlier audit ran the default theme only and never blocked
on contrast, so theme-specific defects shipped unseen.

## What the suite checks

| Spec | Checks | Notes |
|---|---|---|
| `aaa-audit.spec` | Text contrast (7:1 / 4.5:1 large) + non-text 3:1, every route × 5 display themes | writes `test-results/a11y-report.md`; SVG-text it can't resolve → **needs-review**, not fail |
| `target-size.spec` | 44px interactive targets (2.5.5) | honors the WCAG **inline-link exception** (links in a sentence are exempt) and skips label-paired file inputs |
| `focus-visible.spec` | A focus indicator exists on keyboard focus | proves existence, not that it's 3:1 |
| `semantics.spec` | Heading order + landmark structure + keyboard hygiene | the `best-practice` rules the WCAG tags DON'T run — how SR/keyboard users navigate |
| `font-switching.spec` | The accessibility font choice reaches every element | sets each accessible font, fails if any visible text still computes to a hardcoded family |

## Run it

```
npm run verify:a11y                                  # contrast sweep + report
npm run test:a11y -- tests/a11y/semantics.spec.ts    # a single spec
npm run test:a11y                                    # everything
```

Needs a browser (starts the vite dev server, drives Chromium). It is a
**separate** gate from `tsc && build && vitest` — it can't fold into
`npm run build`, or Vercel would run a browser sweep at deploy.

## Where it runs (CI)

`.github/workflows/a11y.yml` runs on every push to `main` and on demand. It is
split into two on purpose:

- **HARD GATE** — `font-switching`, `semantics`, `target-size`, `focus-visible`.
  These are green and must stay green; a regression reds the commit.
- **REPORT-ONLY** — the `verify:a11y` contrast sweep (`continue-on-error: true`).
  Kept soft because it still has a couple of known non-defect findings (an axe
  contrast quirk in one diagram toggle; a test-structure artifact). The report
  uploads as an artifact either way. **Once those are excluded, move
  `verify:a11y` into the hard gate.**

Because this repo pushes straight to main (no PR flow), the check reports
**after** the push — it flags a regression, it doesn't block it. True blocking
needs a PR flow + branch protection requiring this check.

## Patterns learned — READ THIS before touching a11y

Hard-won from the 786→~1 remediation. These recur constantly:

1. **The `--page-bg` trick.** White/`#fff` text on a themed fill (accent, ada,
   category color) that flips light in dark modes → set the text to
   `var(--page-bg)`. Page-bg is always the opposite lightness of a
   page-contrasting fill, so it clears AAA in every theme. This one pattern
   fixed dozens of findings (heroes, CTAs, Tailwind buttons, badges, diagram
   labels). Reach for it first. For Tailwind: `text-[color:var(--page-bg)]`.

2. **Hardcoded values defeat theming — silently.** A literal hex (`#C2410C`) or
   font (`'Manrope'`) can't respond to a token override, so it stays put while
   everything around it switches. Both the diagram colors and the fonts failed
   this exact way. Always use tokens: `--dx-*` for diagrams, `var(--font-body)`
   / `var(--font-display)` for type. Guards: `font-switching.spec`,
   `diagramDarkModes.test`. When adding a themed token, override it in EVERY
   place the family is overridden — `--font-chrome` was missed and left the
   header/footer un-switching.

3. **axe `incomplete` ≠ blocking.** axe can't compute contrast behind SVG shapes
   or gradients, so it returns `incomplete` (needs-review), not `violation`.
   These are NOT failures — don't chase them, don't let them inflate the count.
   `isBlocking` requires `kind === 'violation'`.

4. **The WCAG tags exclude `best-practice`.** Heading order and landmark
   structure — core SR/keyboard navigation — are best-practice rules, so the
   main WCAG-tagged sweep looks comprehensive but never checks them. That's why
   `semantics.spec` exists as a separate run.

5. **Sampled ≠ complete.** The audit samples a fixed route list
   (`gen-a11y-routes.mjs`), one guide page, one chapter, etc. A green blocking
   count means every *sampled* page is clean — NOT literally every page. 32
   diagrams on non-sampled guide pages stayed broken for a while behind a green
   number. Widen the route sample if you need true coverage.

6. **Figure/diagram titles are `<h2>`, not `<h3>`.** Diagrams sit as siblings of
   the `<h2>` guide sections (often directly under the page `<h1>`), so an
   `<h3>` title skips a level. They're section-level content → `<h2>`.

7. **Every page needs exactly one `<h1>` in every render state.** Chat and
   lawsuit-detail had an h1 only in some states (resume screen / loaded); the
   loading/default states had none. If a real h1 doesn't fit the design, a
   visually-hidden `<h1 className="sr-only">` is the right call (flag the copy
   for Gina — screen readers read it).

8. **False alarms not worth chasing** (proven decorative/compliant): `aria-hidden`
   icons, accent-500-as-text (computes AAA), `sg-card-link` target-size (whole
   card is the target via `::after{inset:0}`), sr-only file inputs (the label is
   the target), inline links in prose (WCAG exempt).

## What a green gate does NOT prove (the human pass)

- Whether a focus indicator is high-contrast *enough* (3:1) — only that one exists.
- Keyboard parity and drag-and-drop operability end-to-end.
- Colour-not-sole-signal (status by colour alone).
- **Screen-reader announcement quality and reading-order coherence** — structure
  is now automated (`semantics.spec`), but whether the spoken result makes sense
  is not. Test on real AT (VoiceOver/NVDA) — see the manual checklist.
- Voice control / switch / sip-puff operability (Josh's portal). Highest-value
  remaining human pass.

A green gate means the machine-checkable AAA floor holds. It does not mean AAA
is fully proven — that needs the manual assistive-tech pass.
