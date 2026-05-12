# .implementation/ — per-phase append-only build logs

This directory holds artifacts written by the `/implementation` skill in the
[claude-skills](https://github.com/ryantrout1/claude-skills) stack.

## What lives here
- `<kebab-name>.md` — one file per feature. Written by `/implementation` (in Claude Code) at loop start and appended after every phase ships or halts.

## Lifecycle states
- `in-progress` — the loop is running. `/verify` REFUSES to run against this state.
- `complete` — every blueprint phase shipped, `/verify` returned `SHIPPED`. Terminal state.
- `halted-regression` — regression failed after 2 `/triage` → `/fixit` retries on the same phase.
- `halted-acceptance` — a phase's acceptance criteria failed; loop stopped without auto-retry (AC failure is usually a design problem).
- `halted-shared-list` — `/plan --auto` or `/shipit --auto` would touch a shared-list file; loop refuses autonomously.
- `halted-confidence` — sub-skill returned confidence below the 95% floor.
- `halted-contract-gap` — spec criterion has no blueprint phase covering it; `/design` revision needed.
- `halted-triage-ineligible` — `/triage --auto` parked the regression (ineligible for autofix); user takes over manually.
- `halted-deviations` / `halted-incomplete` — `/verify` returned `SHIPPED WITH DEVIATIONS` or `INCOMPLETE` at closeout (per Q7, both halt the autonomous loop).
- `halted-verify-failure` — `/verify` itself crashed; the loop stopped without a verdict.

## Naming convention
Kebab-case feature name matching `.features/<name>.md` and `.design/<name>.md`. Append-only: the log is never rewritten; each phase entry is a snapshot in time. One feature per Claude Code session — `/implementation` refuses if another `in-progress` log exists in this repo.

## Skill reference
- Canonical: [github.com/ryantrout1/claude-skills](https://github.com/ryantrout1/claude-skills)/implementation/SKILL.md
- Locally installed: `~/.claude/skills/implementation/SKILL.md`

## Project-specific note
For ADALL, per-phase regression is Playwright smoke + component tests (5/9 passing baseline as of the architecture lock; the number evolves). A WCAG 2.2 AAA axe-core check is mandatory for any UI-affecting phase. Commits push direct to main from `/home/claude/ada-legal` (or equivalent local clone).

See `FEATURE_LIFECYCLE.md` at the repo root for the full stack walkthrough.
