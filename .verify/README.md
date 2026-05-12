# .verify/ — closeout reports / Kanban definition-of-done

This directory holds artifacts written by the `/verify` skill in the
[claude-skills](https://github.com/ryantrout1/claude-skills) stack.

## What lives here
- `<kebab-name>.md` — one file per feature. Written by `/verify` (in Claude Code) after `/implementation` reaches a terminal state. Walks every success criterion individually against shipped reality.

## Lifecycle states
The terminal verdict in each report is one of:
- `SHIPPED` — every spec criterion met, no scope creep, no dropped scope, every deferred runtime recipe ran and confirmed. The only state `/implementation` treats as success.
- `SHIPPED WITH DEVIATIONS` — at least one criterion deviated (met by different mechanism than spec'd, or partial) but none are missing. Per Q7, this halts the autonomous loop for human review.
- `INCOMPLETE` — at least one criterion has no shipped evidence (or shipped evidence fails when re-run). Halts the autonomous loop; user decides on `/design` revision or `/feature` revision.

## Naming convention
Kebab-case feature name matching `.features/<name>.md`. One report per feature; `/verify` is one-shot per feature.

## Skill reference
- Canonical: [github.com/ryantrout1/claude-skills](https://github.com/ryantrout1/claude-skills)/verify/SKILL.md
- Locally installed: `~/.claude/skills/verify/SKILL.md`

## Project-specific note
For ADALL, `/verify` confirms the Playwright smoke baseline (≥5/9 passing as of architecture lock; ideally improved by the feature), re-runs axe-core (or equivalent) for any UI-affecting criterion (zero new WCAG 2.2 AAA violations is the gate), and confirms component tests still pass. There is no runbook to cross-check against — acknowledged gap.

See `FEATURE_LIFECYCLE.md` at the repo root for the full stack walkthrough.
