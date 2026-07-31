/**
 * verify-a11y.mjs — the verify:a11y gate.
 *
 * Runs the Playwright AAA theme-matrix sweep, ALWAYS emits report v1 (you
 * want the defect list precisely when the sweep is red), then exits with
 * the SUITE's code so the gate fails iff the sweep found a blocking
 * violation. Mirrors the pure logic in tests/a11y/lib/gate.ts (kept in
 * sync by tests/unit/a11yGate.test.ts).
 *
 * This is a SEPARATE gate from tsc/build/vitest — it needs a browser, so it
 * cannot fold into `npm run build` (Vercel would run a browser sweep at
 * deploy). Run it on a browser-capable machine or in the CI workflow
 * (.github/workflows/a11y.yml).
 *
 *   npm run verify:a11y
 */

import { spawnSync } from 'node:child_process';

// --- mirror of tests/a11y/lib/gate.ts (plain JS for node runtime) ---------
function finalExitCode(suiteExit) {
  if (suiteExit === null || suiteExit === undefined) return 1;
  return suiteExit;
}
// --------------------------------------------------------------------------

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return r.status; // number | null (null = killed / never exited)
}

console.log('[verify:a11y] running the AAA theme-matrix sweep…');
const suiteExit = run('npx', [
  'playwright',
  'test',
  '--config=playwright.a11y.config.ts',
]);

// Always emit report v1, red or green.
console.log('[verify:a11y] writing report v1…');
run('node', ['scripts/a11y-report.mjs']);

const code = finalExitCode(suiteExit);
if (code === 0) {
  console.log('[verify:a11y] PASS — no blocking AAA findings.');
} else {
  console.log(
    '[verify:a11y] FAIL — blocking AAA findings. See test-results/a11y-report.md',
  );
}
process.exit(code);
