# .features/ — locked product specs

This directory holds artifacts written by the `/feature` skill in the
[claude-skills](https://github.com/ryantrout1/claude-skills) stack.

## What lives here
- `<kebab-name>.md` — one file per feature. Written by `/feature` (in chat) at the moment the user says "lock it".

## Lifecycle states
- `locked` — the only published state. Revisions overwrite in place; git carries history. There is no draft state in this directory — drafts live in chat until lock.

## Naming convention
Kebab-case feature name (e.g. `channel-2-government.md`). The same name flows through `.design/`, `.implementation/`, `.verify/`. Open any `<name>` in any of the four dot-directories to see what state the feature is in.

## Skill reference
- Canonical: [github.com/ryantrout1/claude-skills](https://github.com/ryantrout1/claude-skills)/feature/SKILL.md
- Locally installed: `~/.claude/skills/feature/SKILL.md`

## Project-specific note
For ADALL features, the testability commitment defaults to Playwright smoke tests, plus a mandatory WCAG 2.2 AAA accessibility check for any UI-affecting criterion. Manual-verification criteria are capped at 2 per spec.

See `FEATURE_LIFECYCLE.md` at the repo root for the full stack walkthrough.
