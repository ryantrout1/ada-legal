/**
 * M2 Phase 1 — verify-don't-port guards.
 *
 * Encodes the /plan acceptance criteria that protect the Standards Guide
 * from being *regressed* by the M2 re-port:
 *
 *  AC-1  All 46 guide bodies remain byte-identical to B44 @ 6b1e9ac once
 *        import lines are ignored. Recon found the drift ledger's Δ counts
 *        for these files were entirely rewritten import paths — there is no
 *        content drift, so any future diff is a real regression.
 *  AC-2  All 10 chapter pages keep their Vercel-authored `tldr` blocks.
 *        These do NOT exist in B44; a naive "sync from B44" would delete
 *        them. This test is the tripwire.
 *  AC-3  The reading-level control matches B44's current state: the
 *        Legal→Professional rename, legible control text, a real icon
 *        rather than emoji — and it still persists through the shared
 *        displayPrefs module rather than touching localStorage directly
 *        (B44 does the latter; porting that back would reopen the
 *        split-brain closed in M1 Phase 1).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const GUIDES_DIR = resolve(root, 'src/app/routes/public/standards/guides');
const CHAPTERS_DIR = resolve(root, 'src/app/routes/public/standards');
const MANIFEST = resolve(root, 'content-migration/guide-parity/GUIDE_BODY_PARITY.json');

/**
 * The comparison unit: file content with `import` lines removed and
 * whitespace collapsed. Imports are excluded because the port legitimately
 * rewrote every path; everything else must match.
 */
export function bodyDigest(source: string): string {
  const stripped = source
    .split('\n')
    .filter((l) => !/^\s*import\s/.test(l))
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('md5').update(stripped).digest('hex');
}

// ---------------------------------------------------------------------------
// AC-1 — guide bodies unchanged from the frozen B44 revision
// ---------------------------------------------------------------------------

describe('AC-1: guide body parity with B44 @ 6b1e9ac', () => {
  it('ships a pinned parity manifest', () => {
    expect(
      existsSync(MANIFEST),
      'GUIDE_BODY_PARITY.json missing — run scripts/verify-guide-parity.mjs --generate',
    ).toBe(true);
  });

  it('every guide body matches its pinned digest', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
      b44_revision: string;
      bodies: Record<string, string>;
    };
    const drifted: string[] = [];
    for (const [file, digest] of Object.entries(manifest.bodies)) {
      const path = resolve(GUIDES_DIR, file);
      if (!existsSync(path)) {
        drifted.push(`${file}: MISSING`);
        continue;
      }
      const actual = bodyDigest(readFileSync(path, 'utf8'));
      if (actual !== digest) drifted.push(`${file}: content changed`);
    }
    expect(drifted, 'guide bodies drifted from the frozen B44 revision').toEqual([]);
  });

  it('covers every guide file present in the repo', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
      bodies: Record<string, string>;
    };
    const onDisk = readdirSync(GUIDES_DIR).filter((f) => /^Guide.*\.(jsx|tsx)$/.test(f));
    const unpinned = onDisk.filter((f) => !(f in manifest.bodies));
    expect(unpinned, 'guide files not covered by the manifest').toEqual([]);
    expect(onDisk.length).toBeGreaterThanOrEqual(46);
  });
});

// ---------------------------------------------------------------------------
// AC-2 — chapter pages keep the Vercel-authored tldr blocks
// ---------------------------------------------------------------------------

describe('AC-2: chapter tldr blocks survive the M2 re-port', () => {
  const CHAPTERS = Array.from({ length: 10 }, (_, i) => i + 1);

  it.each(CHAPTERS)('StandardsCh%i passes a tldr to ChapterPageLayout', (n) => {
    const src = readFileSync(resolve(CHAPTERS_DIR, `StandardsCh${n}.tsx`), 'utf8');
    expect(src, `Ch${n} lost its tldr block — B44 has no equivalent, so this is a deletion`)
      .toMatch(/tldr=\{/);
    expect(src).toMatch(/What this chapter covers/);
    expect(src).toMatch(/The most important thing/);
  });
});

// ---------------------------------------------------------------------------
// AC-3 — reading-level control parity with B44
// ---------------------------------------------------------------------------

describe('AC-3: reading-level control matches B44', () => {
  const LABEL_FILES = [
    'src/app/components/standards/GuideReadingLevelBar.jsx',
    'src/app/components/standards/CurrentReadingLevel.tsx',
    'src/app/components/standards/ReadingLevelToggle.tsx',
    'src/app/components/AccessibilityPanel.tsx',
  ];

  it.each(LABEL_FILES)('%s calls the top level "Professional", not "Legal"', (rel) => {
    const src = readFileSync(resolve(root, rel), 'utf8');
    const offenders = src
      .split('\n')
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => /label:\s*'Legal'|label:\s*"Legal"|label: 'Legal'/.test(line));
    expect(offenders.map((o) => `line ${o.n}`), 'B44 renamed Legal → Professional').toEqual([]);
    expect(src).toMatch(/Professional/);
  });

  const BAR = 'src/app/components/standards/GuideReadingLevelBar.jsx';

  it('sizes the control text legibly, matching B44', () => {
    const src = readFileSync(resolve(root, BAR), 'utf8');
    // B44 lifted these from 0.72rem / 0.65rem (~11px) to 0.9375rem (15px).
    expect(src).not.toMatch(/0\.72rem/);
    expect(src).not.toMatch(/0\.65rem/);
    expect(src).toMatch(/0\.9375rem/);
  });

  it('uses an icon rather than emoji for the caption', () => {
    const src = readFileSync(resolve(root, BAR), 'utf8');
    // Emoji announce as junk on screen readers; B44 swapped to lucide.
    expect(src).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    expect(src).toMatch(/lucide-react/);
  });

  it('persists through the shared displayPrefs module, not raw localStorage', () => {
    const src = readFileSync(resolve(root, BAR), 'utf8');
    // B44's copy writes ada-display-prefs by hand and dispatches the change
    // event itself. Porting that back would reopen the M1 split-brain.
    // Match calls, not prose — the file's comments legitimately mention
    // the removed localStorage write.
    expect(src).not.toMatch(/localStorage\s*\.\s*(get|set|remove)Item/);
    expect(src).not.toMatch(/dispatchEvent/);
  });
});
