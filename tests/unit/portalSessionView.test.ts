/**
 * Unit — portal bootstrap view decision (test-after, /plan Phase 4b).
 * Loading until the session resolves; onboarded → shell; not-onboarded or a
 * bootstrap error → the holding screen.
 */

import { describe, it, expect } from 'vitest';
import { portalSessionView, type PortalSession } from '@/app/data/portalClient';

const onboarded: PortalSession = {
  onboarded: true,
  attorney: { id: 'a', name: 'A', email: null },
  firm: { id: 'f', name: 'Firm' },
  firmRole: 'member',
};
const notOnboarded: PortalSession = { onboarded: false, reason: 'no_match', email: 'x@y.com' };

describe('portalSessionView', () => {
  it('is loading until the session resolves', () => {
    expect(portalSessionView({ session: null, error: false })).toBe('loading');
  });
  it('renders the shell when onboarded', () => {
    expect(portalSessionView({ session: onboarded, error: false })).toBe('shell');
  });
  it('renders the holding screen when not onboarded', () => {
    expect(portalSessionView({ session: notOnboarded, error: false })).toBe('holding');
  });
  it('renders the holding screen on a bootstrap error', () => {
    expect(portalSessionView({ session: null, error: true })).toBe('holding');
  });
});
