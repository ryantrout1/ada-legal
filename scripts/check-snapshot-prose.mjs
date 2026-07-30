#!/usr/bin/env node
/**
 * Did regenerating a snapshot file change any words?
 *
 * The email snapshots in tests/unit/__snapshots__/emailCopyLock.test.ts.snap
 * are a byte-for-byte lock, deliberately: that file's header says Gina reviews
 * all claimant- and attorney-facing copy, and until an admin screen exists the
 * lock is the thing between an accidental edit and somebody's inbox.
 *
 * A styling change has to break that lock — the snapshot holds the whole
 * rendered output, colours included. So the lock stops being useful exactly
 * when you need it most: a fourteen-snapshot diff of inline styles is where a
 * changed sentence hides in plain sight.
 *
 * This strips every tag and attribute and compares only the words. Run it
 * across a copy of the file taken before regeneration and the file after.
 * Zero drift means the styling moved and the copy did not.
 *
 *   cp tests/unit/__snapshots__/emailCopyLock.test.ts.snap /tmp/before.snap
 *   # ... regenerate ...
 *   node scripts/check-snapshot-prose.mjs /tmp/before.snap \
 *     tests/unit/__snapshots__/emailCopyLock.test.ts.snap
 *
 * Exits non-zero on any drift, so it can gate a commit.
 *
 * Not a vitest test: it compares two states of one file, and only one of them
 * exists at any moment the suite runs.
 *
 * Ref: /plan contrast across the remaining email renderers.
 */

import { readFileSync } from 'node:fs';

const [, , beforePath, afterPath] = process.argv;

if (!beforePath || !afterPath) {
  console.error('usage: check-snapshot-prose.mjs <before.snap> <after.snap>');
  process.exit(2);
}

/** Snapshot entries, keyed by their export name. */
function entries(path) {
  const src = readFileSync(path, 'utf8');
  const out = new Map();
  const re = /exports\[`([^`]+)`\] = `([\s\S]*?)`;\n/g;
  let m;
  while ((m = re.exec(src)) !== null) out.set(m[1], m[2]);
  return out;
}

/**
 * The visible words, with all markup removed.
 *
 * Tags go entirely — which takes their attributes with them, and inline style
 * is an attribute. What survives is what a reader sees.
 */
function prose(snapshot) {
  return snapshot
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const before = entries(beforePath);
const after = entries(afterPath);

const drifted = [];
const added = [];
const removed = [];

for (const [key, value] of after) {
  if (!before.has(key)) {
    added.push(key);
    continue;
  }
  if (prose(before.get(key)) !== prose(value)) drifted.push(key);
}
for (const key of before.keys()) {
  if (!after.has(key)) removed.push(key);
}

console.log(`compared ${after.size} snapshot(s) against ${before.size}`);

for (const key of added) console.log(`  NEW:     ${key}`);
for (const key of removed) console.log(`  DROPPED: ${key}`);

if (drifted.length === 0) {
  console.log('prose drift: none — styling changed, wording did not');
} else {
  console.log(`prose drift: ${drifted.length} snapshot(s)`);
  for (const key of drifted) {
    console.log(`\n  DRIFT: ${key}`);
    console.log(`    before: ${prose(before.get(key)).slice(0, 200)}`);
    console.log(`    after:  ${prose(after.get(key)).slice(0, 200)}`);
  }
}

// A dropped snapshot is as much a signal as a changed one: it means a case
// stopped being covered.
process.exit(drifted.length > 0 || removed.length > 0 ? 1 : 0);
