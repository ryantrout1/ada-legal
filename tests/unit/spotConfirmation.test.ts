/**
 * The paid confirmation screen tells someone who just spent $99 what happens
 * next. Three things can be true when it renders, and the screen has to say a
 * different honest thing for each:
 *
 *   found    — we have their address. Name it, so a typo is catchable now
 *              rather than after hours of silence.
 *   none     — we have no address. Say so, and say where to write. Never
 *              promise an email that has nowhere to go.
 *   unknown  — the lookup failed. We do not know either way, so we must not
 *              claim there is no address on file. Someone who typed their
 *              address correctly should not be told we lost it because a
 *              fetch timed out.
 *
 * The third case is the one worth pinning. Collapsing it into `none` is the
 * easy mistake and it produces a confident lie.
 *
 * Encodes acceptance criteria 1, 2 and 4 from /plan phase 1.
 */

import { describe, it, expect } from 'vitest';
import {
  SPOT_SUPPORT_EMAIL,
  buildConfirmationCopy,
} from '@/lib/spot/confirmationCopy';

describe('buildConfirmationCopy — address on file', () => {
  const copy = buildConfirmationCopy({ state: 'found', email: 'buyer@example.com' });

  it('names the exact address the report is going to', () => {
    expect(copy.addressLine).toContain('buyer@example.com');
  });

  it('reports that it has an address', () => {
    expect(copy.hasEmail).toBe(true);
  });

  it('does not send them chasing support', () => {
    expect(copy.addressLine).not.toContain(SPOT_SUPPORT_EMAIL);
  });
});

describe('buildConfirmationCopy — no address on file', () => {
  const copy = buildConfirmationCopy({ state: 'none' });

  it('never promises an email it cannot send', () => {
    expect(copy.addressLine).not.toMatch(/will be emailed|on its way to/i);
  });

  it('says where to write instead', () => {
    expect(copy.addressLine).toContain(SPOT_SUPPORT_EMAIL);
  });

  it('reports that it has no address', () => {
    expect(copy.hasEmail).toBe(false);
  });
});

describe('buildConfirmationCopy — lookup failed', () => {
  const copy = buildConfirmationCopy({ state: 'unknown' });

  it('does not claim there is no address on file', () => {
    // The failure mode this guards: a timed-out fetch telling a buyer who
    // typed their address correctly that we never got one.
    expect(copy.addressLine).not.toContain(SPOT_SUPPORT_EMAIL);
    expect(copy.addressLine).not.toMatch(/don't have|do not have|no email/i);
  });

  it('still tells them an email is coming', () => {
    expect(copy.addressLine).toMatch(/email/i);
  });

  it('names no address, because it does not know one', () => {
    expect(copy.addressLine).not.toContain('@');
    expect(copy.hasEmail).toBe(false);
  });
});

describe('buildConfirmationCopy — shared across every branch', () => {
  const branches = [
    buildConfirmationCopy({ state: 'found', email: 'buyer@example.com' }),
    buildConfirmationCopy({ state: 'none' }),
    buildConfirmationCopy({ state: 'unknown' }),
  ];

  it('explains that a person reviews the report before it sends', () => {
    for (const copy of branches) {
      expect(copy.reviewLine).toMatch(/person/i);
    }
  });

  it('keeps the same heading regardless of what we know', () => {
    for (const copy of branches) {
      expect(copy.heading).toBe('Payment received — photos in');
    }
  });

  it('always tells them they can leave', () => {
    for (const copy of branches) {
      expect(copy.closingLine).toMatch(/close this page/i);
    }
  });
});

describe('buildConfirmationCopy — input hygiene', () => {
  it('treats a blank or whitespace-only address as no address', () => {
    // markPaid writes whatever Stripe resolved. An empty string is not an
    // address, and rendering "on its way to " would be worse than useless.
    expect(buildConfirmationCopy({ state: 'found', email: '   ' }).hasEmail).toBe(false);
    expect(buildConfirmationCopy({ state: 'found', email: '' }).hasEmail).toBe(false);
  });

  it('trims a padded address rather than rendering the padding', () => {
    const copy = buildConfirmationCopy({ state: 'found', email: '  buyer@example.com  ' });
    expect(copy.addressLine).toContain('buyer@example.com');
    expect(copy.addressLine).not.toContain('  buyer');
  });
});
