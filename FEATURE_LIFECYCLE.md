# Feature lifecycle — ADA Legal Link

This repo participates in the agentic skill stack at
[github.com/ryantrout1/claude-skills](https://github.com/ryantrout1/claude-skills).
Every feature flows through four committed artifacts in this repo.

## The stack
1. **/feature** (chat) → locks `.features/<name>.md`, emits a Claude Code kickoff prompt the user copies into a fresh CC session
2. **/design** (Claude Code) → reads the spec, performs full code recon, produces `.design/<name>.md`, HALTS for human review
3. **/implementation** (Claude Code) → autonomous loop after blueprint approval; decomposes into phases (test infra first), drives `/plan --auto` + `/shipit --auto` per phase, detours through `/triage --auto` + `/fixit --auto` on regression failure, writes `.implementation/<name>.md`
4. **/verify** (Claude Code) → closeout pass after `/implementation` reaches a terminal state; walks every success criterion individually; writes `.verify/<name>.md` with verdict `SHIPPED | SHIPPED WITH DEVIATIONS | INCOMPLETE`

Two debug skills run alongside whenever something breaks:
- **/triage** (Claude Code) — diagnose a problem to root cause; produces a fix plan
- **/fixit** (Claude Code) — execute a `/triage` plan; one fix per commit; runs regression

Two pairs underneath:
- `/plan` → `/shipit` — build pair (used by `/implementation` in `--auto` mode, or by the user manually)
- `/triage` → `/fixit` — debug pair (used by `/implementation` on regression failure, or by the user manually)

## The four directories
- `.features/` — locked product specs. Testability gate enforced (every success criterion has a named verification mechanism). Manual-verification criteria capped at 2 per spec. See `.features/README.md`.
- `.design/` — committed technical blueprints. Full code recon + schema scan + persona scan. Phase outline puts test infrastructure FIRST. See `.design/README.md`.
- `.implementation/` — per-phase append-only build logs. Terminal status required before `/verify` runs. See `.implementation/README.md`.
- `.verify/` — Kanban definition-of-done reports. Per-criterion table; scope-creep + dropped-scope cross-checks. See `.verify/README.md`.

## Chat ↔ Claude Code boundary
`/feature` is the only skill that runs in chat (product-side iteration). Everything else runs in Claude Code (build-side, code-aware). The handoff happens exactly once per feature: at `/feature` lock, chat emits a CC kickoff prompt the user copies into a fresh CC session.

After CC takes over, the repo is the single source of truth. Chat and CC both read the same four files; neither has hidden state. To resume any feature, read the four files — no thread reconstruction needed.

## Commit-as-completion-signal
No skill produces meaningful output without committing it. If `/design` halts before committing, the next session has nothing to read. **The commit IS the completion signal.** Chat and CC interchange via git, not via memory.

This is the load-bearing discipline of the architecture. If you find yourself with skill output that wasn't committed, that output is essentially lost — re-run the skill.

## Project-specific posture (ADA Legal Link)
- **Stack**: Vercel + Neon + Clerk + Claude
- **Architecture**: Ada universal conversational front door, tool-augmented single agent across 5 channels (Channel 0 foundation → Channel 4 B2B)
- **Test posture**: Playwright smoke + component tests (5/9 passing baseline as of architecture lock; the number evolves with the suite)
- **Accessibility**: WCAG 2.2 AAA — MANDATORY check on any UI-affecting feature (axe-core or equivalent during `/shipit`; re-verified at `/verify`)
- **Runbook**: none today — acknowledged gap, not blocking. When ADALL earns a runbook, it becomes a feature in its own right and the `/design` skill's runbook step lights up automatically.
- **Push policy**: direct to main from the local working tree (no PR review gate); the four agentic directories are first-class committed artifacts

## Non-negotiable constraints
- **Ada-as-front-door** — no traditional forms; conversational entry is the product. `/design` and `/verify` enforce this.
- **WCAG 2.2 AAA compliance maintained** — zero new violations introduced per feature. `/shipit` runs axe-core for UI changes; `/verify` re-confirms at closeout.
- **Design token system** — no hardcoded colors. Picked up by code review pass during `/shipit`.
- **Clerk auth boundary** — auth changes are shared-list-blast-radius hits per `/triage --auto` and `/plan --auto`; the autonomous loop halts on any such change.

## Safety rails
The autonomous loop runs without human prompts. Five rails stand between an unattended loop and a corrupt repo:
1. **95% confidence floor** on every sub-skill invocation (`/plan --auto`, `/shipit --auto`, `/triage --auto`, `/fixit --auto`)
2. **No auto-rollback** — failed commits stay on main; the loop halts and reports
3. **No self-fix on regression failure** — `/implementation` detours through `/triage --auto` + `/fixit --auto`; never bypasses
4. **Retry budget of 2** on the regression detour per phase; then halt
5. **Shared-list blast-radius rule** — any phase touching auth files, `package.json`, `package-lock.json`, `vercel.json`, or other shared-list paths halts for human review (see `/triage --auto`'s shared-list for the full enumeration)

Plus the Q7 amendment: `/verify` reports honestly with three possible verdicts, but `/implementation` treats `SHIPPED WITH DEVIATIONS` and `INCOMPLETE` both as halts — only a clean `SHIPPED` is success.

## Skill source
All eight skills (`/feature`, `/design`, `/implementation`, `/verify`, `/plan`, `/shipit`, `/triage`, `/fixit`) live at:
- Canonical source of truth: [github.com/ryantrout1/claude-skills](https://github.com/ryantrout1/claude-skills) — `<skill>/SKILL.md`
- Locally installed (runtime mirror): `~/.claude/skills/<skill>/SKILL.md`

The canonical repo is the source of truth; the local install is a runtime mirror so Claude Code's skill loader can pick them up.

## Where to start
- To spec a new feature: invoke `/feature` in a Claude chat (not Claude Code).
- To resume an existing feature: read the four artifact files (`.features/<name>.md`, `.design/<name>.md`, `.implementation/<name>.md`, `.verify/<name>.md`) in that order to reconstruct state.
- To debug a problem: invoke `/triage` in Claude Code; do NOT invoke `/feature` (that's for new product work, not for fixing what's already shipped).
