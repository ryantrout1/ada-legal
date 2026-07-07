# Regression Ledger — ADA Legal Link (ada-legal)

Append-only backlog of bugs that were diagnosed to root cause, fixed,
and pinned with a permanent test. Never edit or delete rows; corrections
get a new note row. Newest at the bottom. Per /regress.

| Date | Bug | Origin | Test | Commit |
|---|---|---|---|---|
| 2026-07-01 | Admin litigation POST/PATCH uppercased affected_states without stripping the `__nationwide__` sentinel — one admin save away from storing `__NATIONWIDE__`, which the case-sensitive read filter passes through to the public page and Ada's prompt (17 live sentinel rows at diagnosis, 0 corrupted) | /triage "__nationwide__ renders as code" → /fixit ada-legal `b4aa0ac` + B44 `6d018cc` | tests/unit/normalizeAffectedStates.test.ts (sanitizeIncomingStates block) | _pending_ |
| 2026-07-07 | Public `/api/attorneys` was the only public GET endpoint that never called `applyCors`; the directory page on adalegallink.com fetched it cross-origin, the browser blocked the 200 response ("No Access-Control-Allow-Origin header"), and the page rendered "couldn't load" with the full roster (Kelley + firm) present in the body. Latent since Phase B; not the domain lockdown | /triage "Kelley's firm not listed" → /fixit `de802aa` | tests/integration/attorneysCors.test.ts | `de802aa` |
