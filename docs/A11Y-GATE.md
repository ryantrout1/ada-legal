# AAA accessibility gate

The `verify:a11y` gate runs the WCAG 2.2 AAA **theme-matrix** audit: every
public route × all 5 display themes (Default, Dark, Warm, Contrast, Low
Vision), plus 44px target-size and visible-focus checks. It exists because
the earlier audit ran the default theme only and never blocked on contrast,
so theme-specific defects shipped unseen.

## Run it

```
npm run verify:a11y
```

Needs a browser (it starts the vite dev server and drives Chromium). It
runs the sweep, always writes **`test-results/a11y-report.md`** (report v1),
and exits non-zero if there's a blocking finding. Screenshots for hero
backgrounds axe can't resolve land in `test-results/a11y-findings/`.

It is a **separate** gate from `tsc && build && vitest` — it can't fold into
`npm run build`, because Vercel would then run a browser sweep at deploy.

## Where it runs

`.github/workflows/a11y.yml` runs it on every push to `main` and on demand,
and uploads the report as an artifact. Because this repo pushes straight to
main with no PR flow, the check reports **after** the push — it flags a
regression as a red check, it does not physically block the push. To make it
truly blocking, adopt a PR flow with branch protection requiring this check.

**Report-only right now.** The workflow's sweep step has
`continue-on-error: true` so it doesn't sit red while the known report-v1
defects are being fixed. Once the sweep passes clean, delete that line to
flip the gate to hard-fail so real regressions surface as red.

## What it guarantees

- **Text contrast** at AAA (7:1 / 4.5:1 large) across all 5 themes —
  `color-contrast-enhanced` blocks at any axe impact.
- **Non-text/UI contrast** at 3:1 where axe can resolve the background.
- **Target size** ≥ 44px for interactive elements (2.5.5).

## What it does NOT guarantee (still a human pass)

- Whether a focus indicator meets 3:1 — the focus check proves an indicator
  *exists* (a computed-style delta), not that it's high-contrast enough.
- Keyboard parity and drag-and-drop operability.
- Colour-not-sole-signal (status conveyed by colour alone).
- Contrast over gradient/image backgrounds axe couldn't resolve — captured
  as **needs-review** with a screenshot, not auto-passed.
- Screen-reader announcement, reading order, plain-language quality.

These are the Step 5 human passes in the remediation plan. A green gate
means the machine-checkable AAA floor holds; it does not mean AAA is
fully proven.
