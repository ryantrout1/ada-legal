# .design/ — committed technical blueprints

This directory holds artifacts written by the `/design` skill in the
[claude-skills](https://github.com/ryantrout1/claude-skills) stack.

## What lives here
- `<kebab-name>.md` — one file per feature. Written by `/design` (in Claude Code) after full code reconnaissance + schema scan + persona scan.

## Lifecycle states
- `committed; awaiting human review` — the state at write time. `/design` HALTS here. The user reviews the blueprint and decides whether to invoke `/implementation`.
- Approved blueprints are not given a new status string; the existence of a corresponding `.implementation/<name>.md` log is the implicit signal that the user approved.

## Naming convention
Kebab-case feature name matching `.features/<name>.md`. One blueprint per feature; revisions overwrite in place (git carries history).

## Skill reference
- Canonical: [github.com/ryantrout1/claude-skills](https://github.com/ryantrout1/claude-skills)/design/SKILL.md
- Locally installed: `~/.claude/skills/design/SKILL.md`

## Project-specific note
For ADALL, there is no runbook today — gap acknowledged in the architecture, not blocking. The blueprint's test architecture decomposes by component (not by persona), and a WCAG 2.2 AAA check is mandatory for any UI-affecting criterion. Phase outline still puts test infrastructure FIRST (new smoke flows, fixtures, axe-core wiring).

See `FEATURE_LIFECYCLE.md` at the repo root for the full stack walkthrough.
