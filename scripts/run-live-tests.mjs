#!/usr/bin/env node
/**
 * Runs the test files that need a real database.
 *
 * WHY THIS EXISTS. Seven test files are gated on DATABASE_URL. Nothing in
 * this repo has ever set it: vitest.config.ts loads no env file (a .env
 * containing DATABASE_URL does not reach process.env — verified), the test
 * script is a bare `vitest run`, and there is no CI. So all seven skipped
 * on every run, on every machine, since the day they were written. The
 * suite reported green because a skip is not a failure.
 *
 * Handing someone `DATABASE_URL=... npx vitest run <files>` would have
 * repeated the trap: forget the variable and it skips seven files and
 * still exits 0. This runner exits 1 with a sentence instead.
 *
 * TWO GROUPS, DIFFERENT RISK.
 *
 *   schema — reads information_schema and pg_catalog only. Confirms the
 *            migrations landed as authored. Safe against production.
 *
 *   write  — creates Spot sessions, marks them paid, inserts photos and
 *            reports, then deletes its own rows. Point this at a Neon
 *            branch, not main. It needs SPOT_TEST_ALLOW_WRITES=1 as well,
 *            so nobody reaches it by accident.
 *
 * Ref: /triage — seven test files that have never run.
 */

import { spawn } from 'node:child_process';

const GROUPS = {
  schema: [
    'tests/integration/casesSchemaApplied.test.ts',
    'tests/integration/portalSchemaApplied.test.ts',
    'tests/integration/spotSchemaApplied.test.ts',
  ],
  write: [
    'tests/integration/spotStore.test.ts',
    'tests/integration/spotSessionStore.test.ts',
    'tests/integration/spotPhotoLifecycle.test.ts',
    'tests/integration/spotReportStore.test.ts',
  ],
};

/** Host only — never print the credentials in the connection string. */
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return '(unparseable connection string)';
  }
}

function die(lines) {
  console.error(`\n${lines.join('\n')}\n`);
  process.exit(1);
}

const group = process.argv[2];

if (!Object.hasOwn(GROUPS, group)) {
  die([
    `Unknown group: ${JSON.stringify(group ?? '')}`,
    '',
    'Usage:  node scripts/run-live-tests.mjs schema',
    '        node scripts/run-live-tests.mjs write',
  ]);
}

const files = GROUPS[group];

if (!process.env.DATABASE_URL) {
  die([
    'DATABASE_URL is not set, so these tests would skip and still exit 0.',
    'That is the thing this runner exists to prevent.',
    '',
    `Would have run ${files.length} file(s):`,
    ...files.map((f) => `  ${f}`),
    '',
    'Export a connection string first:',
    '  export DATABASE_URL="postgresql://..."',
    group === 'write'
      ? '  export SPOT_TEST_ALLOW_WRITES=1   # and point at a Neon branch, not main'
      : '  # reads only — safe against production',
  ]);
}

if (group === 'write' && process.env.SPOT_TEST_ALLOW_WRITES !== '1') {
  die([
    'These tests write to the database: they create Spot sessions, mark them',
    'paid, insert photos and reports, then delete their own rows.',
    '',
    `They would run against: ${hostOf(process.env.DATABASE_URL)}`,
    '',
    'Point DATABASE_URL at a Neon branch rather than main, then:',
    '  export SPOT_TEST_ALLOW_WRITES=1',
  ]);
}

console.log(
  `Running ${files.length} ${group} test file(s) against ${hostOf(process.env.DATABASE_URL)}\n`,
);

const child = spawn('npx', ['vitest', 'run', ...files], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error(`\nCould not start vitest: ${err.message}\n`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  // A signal death is not a pass. Turn it into a non-zero exit rather than
  // letting `code === null` fall through as 0.
  process.exit(signal ? 1 : (code ?? 1));
});
