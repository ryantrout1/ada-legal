#!/usr/bin/env node
/**
 * verify-guide-parity — pin and check the 46 Standards Guide bodies
 * against the frozen Base44 revision (M2 Phase 1).
 *
 * WHY THIS EXISTS: the M0 drift ledger reported all 46 guide bodies as
 * "drifted" by 11–16 lines. Re-diffing with import lines excluded showed
 * the drift was entirely the rewritten import paths — the content is
 * identical. The M2 plan therefore does NOT re-port these files. This
 * script pins that fact so a later "sync from B44" cannot quietly
 * overwrite them, and so the check keeps working after the B44 repo is
 * archived (the manifest travels with our repo; the B44 clone does not).
 *
 * Usage:
 *   node scripts/verify-guide-parity.mjs --generate --b44 <path-to-b44-repo>
 *       Rebuild the manifest from a B44 checkout. Run only when
 *       deliberately re-baselining, and record why in the commit.
 *
 *   node scripts/verify-guide-parity.mjs
 *       Check our files against the committed manifest. Exit 1 on drift.
 *       (tests/unit/guideParity.test.ts runs the same comparison in CI.)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GUIDES_DIR = resolve(root, 'src/app/routes/public/standards/guides');
const MANIFEST = resolve(root, 'content-migration/guide-parity/GUIDE_BODY_PARITY.json');

/** Must stay in lockstep with bodyDigest() in tests/unit/guideParity.test.ts. */
function bodyDigest(source) {
  const stripped = source
    .split('\n')
    .filter((l) => !/^\s*import\s/.test(l))
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('md5').update(stripped).digest('hex');
}

const args = process.argv.slice(2);
const generate = args.includes('--generate');
const b44Path = args[args.indexOf('--b44') + 1];

const localFiles = readdirSync(GUIDES_DIR)
  .filter((f) => /^Guide.*\.(jsx|tsx)$/.test(f))
  .sort();

if (generate) {
  if (!b44Path || !existsSync(b44Path)) {
    console.error('--generate requires --b44 <path to a base44 checkout>');
    process.exit(2);
  }
  const bodies = {};
  const missing = [];
  const mismatched = [];
  for (const file of localFiles) {
    const name = file.replace(/\.(jsx|tsx)$/, '');
    const b44File = join(b44Path, 'src/pages', `${name}.jsx`);
    if (!existsSync(b44File)) {
      missing.push(name);
      continue;
    }
    const b44Digest = bodyDigest(readFileSync(b44File, 'utf8'));
    const ourDigest = bodyDigest(readFileSync(join(GUIDES_DIR, file), 'utf8'));
    // Pin ONLY where the two already agree. A mismatch here is real drift
    // and must be resolved deliberately, never baked into the baseline.
    if (b44Digest !== ourDigest) {
      mismatched.push(name);
      continue;
    }
    bodies[file] = b44Digest;
  }

  if (mismatched.length) {
    console.error('Refusing to generate — these differ from B44 in content:');
    for (const m of mismatched) console.error(`  ${m}`);
    console.error('Resolve the difference first; do not baseline over it.');
    process.exit(1);
  }

  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        b44_revision: '6b1e9ac',
        note:
          'Digests of guide bodies with import lines excluded and whitespace collapsed. '
          + 'These files are verified-identical to Base44 at the frozen revision and are NOT '
          + 'to be re-ported. A failure means our copy changed, or someone synced from B44 '
          + 'over content that never needed syncing.',
        generated: new Date().toISOString().slice(0, 10),
        bodies,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Pinned ${Object.keys(bodies).length} guide bodies.`);
  if (missing.length) console.log(`No B44 counterpart (not pinned): ${missing.join(', ')}`);
  process.exit(0);
}

if (!existsSync(MANIFEST)) {
  console.error('No manifest. Run with --generate --b44 <path>.');
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const drifted = [];
for (const [file, digest] of Object.entries(manifest.bodies)) {
  const path = join(GUIDES_DIR, file);
  if (!existsSync(path)) {
    drifted.push(`${file}: MISSING`);
    continue;
  }
  if (bodyDigest(readFileSync(path, 'utf8')) !== digest) drifted.push(`${file}: changed`);
}
const unpinned = localFiles.filter((f) => !(f in manifest.bodies));

if (drifted.length || unpinned.length) {
  for (const d of drifted) console.error(`DRIFT  ${d}`);
  for (const u of unpinned) console.error(`UNPINNED  ${u}`);
  process.exit(1);
}
console.log(`${Object.keys(manifest.bodies).length} guide bodies match the pinned baseline.`);
