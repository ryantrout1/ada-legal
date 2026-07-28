/**
 * Keeps the never-runs pile from growing quietly.
 *
 * Seven integration files are gated on DATABASE_URL. Nothing in this repo
 * has ever set it — no CI, and vitest loads no env file — so all seven
 * skipped on every run since they were written, while the suite reported
 * green. A skip is not a failure, and the skip count is a number nobody
 * reads. That is how the pile got to seven without anyone deciding it
 * should.
 *
 * This file always runs. It does not need a database, and it does not try
 * to assert anything about one. It asserts two things about the repo:
 *
 *   1. The set of database-gated files is exactly the known seven. An
 *      eighth fails here, by name, instead of joining the pile.
 *   2. Every one of them is reachable by an npm script. A gated file with
 *      no way to run it is a file that will never run.
 *
 * Ref: /triage — seven test files that have never run.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const INTEGRATION_DIR = 'tests/integration';

/**
 * The seven, split by what they do to the database. The split is the whole
 * reason there are two scripts: the schema files only read, so they are
 * safe against production; the Spot files create sessions, mark them paid,
 * insert photos and reports, and delete their own rows afterwards.
 */
const READ_ONLY = [
  'casesSchemaApplied.test.ts',
  'portalSchemaApplied.test.ts',
  'spotSchemaApplied.test.ts',
];

const WRITES = [
  'spotStore.test.ts',
  'spotSessionStore.test.ts',
  'spotPhotoLifecycle.test.ts',
  'spotReportStore.test.ts',
];

const DECLARED = [...READ_ONLY, ...WRITES].sort();

/** Files whose describe block is switched off by DATABASE_URL being absent. */
function gatedFiles(): string[] {
  return readdirSync(INTEGRATION_DIR)
    .filter((f) => f.endsWith('.test.ts'))
    .filter((f) =>
      readFileSync(join(INTEGRATION_DIR, f), 'utf8').includes('describe.skipIf(!DATABASE_URL'),
    )
    .sort();
}

describe('tests that need a database', () => {
  it('are exactly the seven we know about', () => {
    const found = gatedFiles();
    const surprise = found.filter((f) => !DECLARED.includes(f));
    const vanished = DECLARED.filter((f) => !found.includes(f));

    expect(
      surprise,
      'a new database-gated file appeared. It will never run under `npm run test`. ' +
        'Add it to READ_ONLY or WRITES here and to the matching group in ' +
        'scripts/run-live-tests.mjs, or it joins a pile nobody looks at.',
    ).toEqual([]);

    expect(
      vanished,
      'a declared file is gone or no longer gated — drop it from this list ' +
        'and from scripts/run-live-tests.mjs.',
    ).toEqual([]);
  });

  it('each have a way to be run', () => {
    const runner = readFileSync('scripts/run-live-tests.mjs', 'utf8');
    for (const f of DECLARED) {
      expect(runner, `${f} is gated but no npm script runs it`).toContain(
        `${INTEGRATION_DIR}/${f}`,
      );
    }
  });

  it('keep the writing ones behind a second switch', () => {
    // An exported DATABASE_URL is enough to reach a read-only file, which is
    // fine. It must not be enough to write to whatever that URL points at.
    for (const f of WRITES) {
      const src = readFileSync(join(INTEGRATION_DIR, f), 'utf8');
      expect(src, `${f} writes but an exported DATABASE_URL alone would run it`).toContain(
        'describe.skipIf(!DATABASE_URL || !ALLOW_WRITES)',
      );
      expect(src).toContain("process.env.SPOT_TEST_ALLOW_WRITES === '1'");
    }
  });

  it('say plainly that they do not run under npm run test', () => {
    // Presence only. The obvious companion — asserting the old "local/CI
    // without secrets" wording is gone — cannot work: that phrase only ever
    // lives in a comment, so checking raw source fires on any header that
    // quotes it while explaining itself, and checking comment-stripped
    // source can never fail at all. A test that cannot fail is worse than
    // no test. See tests/support/sourceText.ts on the same trap.
    for (const f of DECLARED) {
      const src = readFileSync(join(INTEGRATION_DIR, f), 'utf8');
      expect(src, `${f} does not tell the reader it never runs`).toContain('DOES NOT RUN');
    }
  });
});
