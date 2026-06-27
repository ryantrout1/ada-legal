/**
 * Unit — attorney email-bind policy (test-first, /plan Phase 4a, AC 1/3/5).
 *
 * decideBind is the whole linkage policy as a pure function: bind only on a
 * verified email with exactly one unbound match; never on unverified, zero,
 * or ambiguous; short-circuit when the user is already bound.
 */

import { describe, it, expect } from 'vitest';
import { decideBind } from '@/engine/portal/attorneyBinding';

describe('decideBind', () => {
  it('short-circuits when the clerk user is already bound', () => {
    expect(
      decideBind({ alreadyBound: true, emailVerified: true, email: 'a@x.com', matches: [{ id: 'm1' }] }),
    ).toEqual({ action: 'already_bound' });
  });

  it('refuses to bind on an unverified email', () => {
    expect(
      decideBind({ alreadyBound: false, emailVerified: false, email: 'a@x.com', matches: [{ id: 'm1' }] }),
    ).toEqual({ action: 'unverified' });
  });

  it('reports no match when nothing unbound matches', () => {
    expect(
      decideBind({ alreadyBound: false, emailVerified: true, email: 'a@x.com', matches: [] }),
    ).toEqual({ action: 'no_match' });
  });

  it('refuses to guess when more than one unbound attorney matches', () => {
    expect(
      decideBind({
        alreadyBound: false,
        emailVerified: true,
        email: 'a@x.com',
        matches: [{ id: 'm1' }, { id: 'm2' }],
      }),
    ).toEqual({ action: 'ambiguous' });
  });

  it('binds on a verified email with exactly one unbound match', () => {
    expect(
      decideBind({ alreadyBound: false, emailVerified: true, email: 'a@x.com', matches: [{ id: 'm1' }] }),
    ).toEqual({ action: 'bind', attorneyId: 'm1' });
  });
});
