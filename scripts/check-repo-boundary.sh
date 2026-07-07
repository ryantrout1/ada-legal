#!/usr/bin/env bash
# check-repo-boundary.sh — ada-legal (Vercel platform)
#
# Mechanical backstop for the #1 failure: code landing in the wrong repo.
# Fails the push if a Base44-only tell appears in this repo. Run as a gate
# before every push (see CLAUDE.md). Cheap, greps source only.
#
# Exit 0 = clean. Exit 1 = a wrong-repo tell was found; DO NOT PUSH.

set -euo pipefail
cd "$(dirname "$0")/.."

fail=0

# --- Tell 1: Base44 entities must NEVER appear here. Neon is the source of truth. ---
# base44.entities.* is the consumer/admin data-access pattern; it belongs in B44 only.
hits=$(grep -rln "base44\.entities" src api 2>/dev/null || true)
if [ -n "$hits" ]; then
  echo "✗ BOUNDARY VIOLATION: 'base44.entities' found in ada-legal (Neon is the source of truth):"
  echo "$hits" | sed 's/^/    /'
  echo "  → This is a B44 pattern. Data access here goes through Drizzle/Neon, not Base44 entities."
  fail=1
fi

# --- Tell 2: the Base44 client SDK must not be imported here ---
hits=$(grep -rln "from '@base44\|base44Client\|functions\.invoke(" src api 2>/dev/null || true)
if [ -n "$hits" ]; then
  echo "✗ BOUNDARY VIOLATION: Base44 SDK / adallProxy invoke found in ada-legal:"
  echo "$hits" | sed 's/^/    /'
  echo "  → The bridge is called FROM B44 INTO this repo's /api/admin/*, not the other way."
  fail=1
fi

# --- Tell 3: pages.config.js is a Base44 routing file; it should not exist here ---
if [ -f "src/pages.config.js" ]; then
  echo "✗ BOUNDARY VIOLATION: src/pages.config.js exists — that is a Base44 routing file."
  echo "  → New pages here use the React Router routes in src/app/App.tsx, not pages.config.js."
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "✓ repo-boundary: clean (no Base44 tells in ada-legal)"
fi
exit "$fail"
