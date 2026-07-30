/**
 * A reply to the Spot release email has to reach a person.
 *
 * The from-address is whatever RESEND_FROM_ADDRESS is set to, which is not
 * something a buyer should be replying into and not something this repo can
 * see. `replyTo` has been supported by the Resend client and the send options
 * type all along; the two Spot send paths just never set it. Someone with a
 * question about a report they paid for had nowhere to go.
 *
 * Source assertions rather than request tests: both files are Vercel handlers
 * that need a live database and a Resend key, and everything under
 * tests/integration/ skips without DATABASE_URL, so a request test would prove
 * nothing on `npm test`.
 *
 * Encodes acceptance criterion 5 from /plan phase 1 (Spot release email).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SPOT_SUPPORT_EMAIL } from '@/lib/spot/confirmationCopy';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const SEND_PATHS = ['api/spot/admin/release.ts', 'api/spot/admin/resend.ts'] as const;

describe.each(SEND_PATHS)('%s', (path) => {
  const src = read(path);

  it('sets a reply-to on the send', () => {
    expect(src).toMatch(/replyTo:/);
  });

  it('points it at the support address, not a literal', () => {
    // Importing the constant means the waiting screen and the email name the
    // same mailbox. Two hardcoded strings would drift the first time one moved.
    expect(src).toMatch(/SPOT_SUPPORT_EMAIL/);
    expect(src).not.toContain(`'${SPOT_SUPPORT_EMAIL}'`);
  });

  it('still sends the html and text alternatives', () => {
    expect(src).toMatch(/html:/);
    expect(src).toMatch(/text:/);
  });
});
