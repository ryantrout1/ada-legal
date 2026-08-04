/**
 * eval-boxes — print box-accuracy per placement method across the fixtures.
 *
 * The instrument for the analyzer-grounding work (/plan phase 1). Answers two
 * questions with numbers instead of impressions:
 *   1. Does ground truth fall INSIDE the analyzer's own box? (the grounding
 *      question — a "no" means the analyzer mislocalized, and every downstream
 *      placement method inherits that.)
 *   2. How far is each method's point from ground truth, on average?
 *
 * Run before and after a prompt change:  npm run eval:boxes
 *
 * Fixtures live in tests/fixtures/boxAccuracy/*.json and carry both the human
 * ground truth and the observed analyzer/placement output for a real run.
 * Refresh `observed` from a new run to score a prompt change.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  scoreFinding,
  scoreSet,
  boxContainmentRate,
} from '../src/lib/spot/boxAccuracy.ts';

const DIR = 'tests/fixtures/boxAccuracy';

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error(`No fixtures in ${DIR}`);
  process.exit(1);
}

const rows = [];
const multiRun = [];
let provisional = 0;

for (const file of files) {
  const fx = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  for (const gt of fx.groundTruth) {
    if (typeof gt.note === 'string' && gt.note.includes('PROVISIONAL')) provisional++;
    const needle = gt.findingTitleContains.toLowerCase();
    const observed = (fx.observed?.findings ?? []).find((f) =>
      f.title.toLowerCase().includes(needle),
    );
    if (!observed) {
      console.warn(`  (no observed finding matching "${gt.findingTitleContains}" in ${file})`);
      continue;
    }
    // When the fixture carries repeated runs of the same photo, containment
    // across those runs is the number that survives run-to-run noise. A single
    // run cannot distinguish a real change from the analyzer's own wobble.
    if (Array.isArray(fx.runs) && fx.runs.length > 0) {
      // Reuses scoreFinding (already imported) rather than importing the
      // summarizer: node's type-stripping cannot resolve a .js specifier to a
      // .ts file, and duplicating the geometry would be worse than looping.
      const matched = fx.runs
        .map((run) => (run.findings ?? []).find((f) => f.title.toLowerCase().includes(needle)))
        .filter(Boolean);
      const boxed = matched.filter((f) => f.box);
      const inside = boxed.filter(
        (f) => scoreFinding(gt, { title: f.title, box: f.box, boxCenter: null, placement: null, cropPlacement: null }).insideBox,
      ).length;
      const ys = boxed.map((f) => f.box.y);
      multiRun.push({
        needle: gt.findingTitleContains,
        inside,
        boxedRuns: boxed.length,
        totalRuns: fx.runs.length,
        min: ys.length ? Math.min(...ys) : null,
        max: ys.length ? Math.max(...ys) : null,
      });
    }
    rows.push(
      scoreFinding(gt, {
        title: observed.title,
        box: observed.box ?? null,
        boxCenter: observed.boxCenter ?? null,
        placement: observed.placement ?? null,
        cropPlacement: observed.cropPlacement ?? null,
      }),
    );
  }
}

const fmt = (n) => (n === null ? '   —  ' : n.toFixed(3));

console.log(`\nBox accuracy — ${rows.length} finding(s) across ${files.length} fixture(s)`);
console.log('Distances are normalized image units (full diagonal ≈ 1.41). Lower is better.\n');

console.log('Per finding:');
for (const r of rows) {
  const inside = r.insideBox ? 'truth INSIDE box ' : 'truth OUTSIDE box';
  const per = r.methods.map((m) => `${m.method}=${fmt(m.distance)}`).join('  ');
  console.log(`  [${inside}] ${r.title}`);
  console.log(`      ${per}`);
}

console.log('\nPer method (mean distance):');
for (const a of scoreSet(rows)) {
  console.log(`  ${a.method.padEnd(14)} ${fmt(a.meanDistance)}   (scored ${a.scored}/${rows.length})`);
}

const rate = boxContainmentRate(rows);
console.log(
  `\nAnalyzer box containment: ${rate === null ? '—' : `${(rate * 100).toFixed(0)}%`} of findings had ground truth inside the box.`,
);
console.log('That containment number is the analyzer-grounding metric to move.\n');

if (multiRun.length > 0) {
  console.log('Across repeated runs of the same photo:');
  for (const s of multiRun) {
    const sp =
      s.min === null
        ? 'no boxes'
        : `spread ${(s.max - s.min).toFixed(3)} (${s.min}-${s.max})`;
    console.log(
      `  "${s.needle}": truth inside box in ${s.inside} of ${s.boxedRuns} boxed runs (${s.totalRuns} sampled); box top edge ${sp}`,
    );
  }
  console.log('  A change that moves the box less than the spread has not been shown to do anything.\n');
}

if (provisional > 0) {
  console.log(
    `WARNING: ${provisional} ground-truth point(s) are marked PROVISIONAL (estimated, not clicked).`,
  );
  console.log(
    'Capture real clicks on /photo?debug=1 and replace them before trusting a before/after comparison.\n',
  );
}
