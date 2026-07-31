/**
 * Drift guard (Phase 2, AAA remediation).
 *
 * scripts/a11y-report.mjs re-implements the report formatter in plain JS
 * because a .mjs at plain-node runtime can't import the TS formatter. That
 * duplication is a drift risk: if one changes and the other doesn't, report
 * v1 stops matching what the suite intends. This test runs the SAME input
 * through both and asserts identical output, so the two can't diverge
 * silently — a change to one fails here until the other matches.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatReport, type Finding } from '../a11y/lib/report.js';

const SAMPLE: Finding[] = [
  {
    route: '/', routeName: 'homepage', theme: 'Dark',
    ruleId: 'color-contrast-enhanced', kind: 'violation', impact: 'moderate',
    target: 'main > p', html: '<p>x</p>', summary: 'low contrast',
  },
  {
    route: '/attorneys', routeName: 'attorneys directory', theme: 'Low Vision',
    ruleId: 'color-contrast', kind: 'incomplete', impact: null,
    target: 'header', html: '<header>x</header>', summary: 'unresolved bg',
  },
];

/** Extract the JS formatReport from the merge script and run it in a child
 *  node process on the same input, returning its markdown. */
function jsFormat(findings: Finding[]): string {
  const scriptPath = fileURLToPath(
    new URL('../../scripts/a11y-report.mjs', import.meta.url),
  );
  const dir = mkdtempSync(join(tmpdir(), 'a11y-drift-'));
  const dataFile = join(dir, 'in.json');
  writeFileSync(dataFile, JSON.stringify(findings));
  // Tiny harness: import the merge script's module scope isn't exported, so
  // we re-run its formatter by evaluating it in a child that imports nothing
  // and reproduces the call. Simplest robust path: read the script, extract
  // the two functions, eval them. Kept inline to avoid a second artifact.
  const src = execFileSync('node', ['-e', `
    const fs = require('fs');
    let s = fs.readFileSync(${JSON.stringify(scriptPath)}, 'utf8');
    // Pull the two pure functions out of the ESM module by name.
    const rankSrc = s.match(/function rank\\(f\\)[\\s\\S]*?\\n}/)[0];
    const fmtSrc = s.match(/function formatReport\\(findings\\)[\\s\\S]*?\\n}\\n/)[0];
    const findings = JSON.parse(fs.readFileSync(${JSON.stringify(dataFile)}, 'utf8'));
    const mod = new Function(rankSrc + '\\n' + fmtSrc + '\\nreturn formatReport(arguments[0]);');
    process.stdout.write(mod(findings));
  `], { encoding: 'utf8' });
  return src;
}

describe('a11y report — JS/TS formatter parity', () => {
  it('merge-script formatter matches the TS formatter byte-for-byte', () => {
    const ts = formatReport(SAMPLE);
    const js = jsFormat(SAMPLE);
    expect(js).toBe(ts);
  });
});
