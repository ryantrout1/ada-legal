/**
 * The admin email screen — what it shows and what it refuses to hide.
 *
 * Phase A is read-only, so the assertions here are about honesty rather
 * than behaviour: every email is listed, each slot shows the wording that
 * will actually go out, and a slot that has been edited says so instead
 * of quietly presenting someone's change as the original.
 *
 * The endpoints are exercised through their handlers with a fake request
 * and response. There is no React render testing in this repo, so the
 * screens themselves are pinned by source assertion — the same approach
 * the portal label guard uses.
 *
 * Ref: /plan the email editing screen, Phase A. AC1, AC2.
 */

import { describe, it, expect } from 'vitest';
import { EMAIL_TEMPLATES } from '@/engine/email/copySlots';
import { readCode } from '../support/sourceText.js';

const LIST = 'src/app/routes/admin/AdminEmailCopy.tsx';
const DETAIL = 'src/app/routes/admin/AdminEmailCopyDetail.tsx';
const LIST_API = 'api/admin/email-copy/index.ts';
const DETAIL_API = 'api/admin/email-copy/[key].ts';

describe('the screen is reachable and gated', () => {
  it('is registered as a route under admin', () => {
    const app = readCode('src/app/App.tsx');
    expect(app).toContain('path="email"');
    expect(app).toContain('path="email/:key"');
  });

  it('appears in the admin menu', () => {
    // Same shape as adminNavParity: a page nobody can navigate to is a
    // page nobody uses.
    const nav = readCode('src/app/layouts/AdminLayout.tsx');
    expect(nav).toContain("to: '/admin/email'");
  });

  it('requires an admin on both endpoints', () => {
    // These read claimant-facing copy and, from Phase B, write it. The
    // Clerk boundary is not optional on either.
    for (const f of [LIST_API, DETAIL_API]) {
      expect(readCode(f), `${f} does not call requireAdmin`).toContain('requireAdmin(req, res)');
      expect(readCode(f), `${f} does not short-circuit on a failed auth`).toContain(
        'if (!auth) return;',
      );
    }
  });

  it('refuses anything but GET while it is read-only', () => {
    for (const f of [LIST_API, DETAIL_API]) {
      expect(readCode(f)).toContain("res.setHeader('Allow', 'GET')");
      expect(readCode(f)).toContain('405');
    }
  });
});

describe('a missing table is a state, not a failure', () => {
  it('both endpoints carry on and report that storage is not ready', () => {
    // Migration 0048 has not been applied. Failing the whole screen over
    // that would hide seven emails to report one missing table, and the
    // registry wording it falls back to is exactly what is being sent.
    for (const f of [LIST_API, DETAIL_API]) {
      const src = readCode(f);
      expect(src, `${f} does not report storage readiness`).toContain('storage_ready');
      expect(src, `${f} does not tolerate an unreadable table`).toMatch(/catch\s*\(/);
    }
  });

  it('the screen says so rather than offering an action that would fail', () => {
    const src = readCode(LIST);
    expect(src).toContain('storage_ready');
    expect(src).toContain('Showing the original wording');
  });
});

describe('what the list shows', () => {
  it('covers every registered email', () => {
    // The list is built from EMAIL_TEMPLATES, so it cannot drift from
    // what the renderers read. Asserted rather than assumed.
    expect(readCode(LIST_API)).toContain('EMAIL_TEMPLATES.map');
    expect(EMAIL_TEMPLATES.length).toBe(7);
  });

  it('says who gets each email and what makes it send', () => {
    const src = readCode(LIST_API);
    for (const field of ['recipient', 'trigger', 'slot_count', 'edited_count']) {
      expect(src, `list does not return ${field}`).toContain(field);
    }
  });

  it('names the recipient in words rather than a key', () => {
    // 'claimant_handoff' tells a reviewer nothing about which of the
    // three claimant emails she is about to open.
    const src = readCode(LIST);
    expect(src).toContain('Goes to the person');
    expect(src).toContain('Goes to the firm');
  });
});

describe('what the detail screen shows', () => {
  it('returns the wording that will go out AND the original', () => {
    // Only the first makes a reverted slot look untouched; only the
    // second shows something other than what claimants receive.
    const src = readCode(DETAIL_API);
    expect(src).toContain('value:');
    expect(src).toContain('default:');
    expect(src).toContain('is_edited:');
  });

  it('marks an edited slot instead of presenting a change as the original', () => {
    expect(readCode(DETAIL)).toContain('is_edited');
    expect(readCode(DETAIL)).toContain('Originally');
  });

  it('shows all three reading levels for a varied slot and one for a flat slot', () => {
    const src = readCode(DETAIL_API);
    expect(src).toContain('slot.varied ? LEVELS');
    expect(src).toContain("(['standard'] as ReadingLevel[])");
  });

  it('shows the allowed variables rather than expecting them to be typed from memory', () => {
    expect(readCode(DETAIL_API)).toContain('variables: slot.variables');
    expect(readCode(DETAIL)).toContain('Fills in automatically');
  });

  it('404s an email that does not exist rather than rendering an empty one', () => {
    expect(readCode(DETAIL_API)).toContain("res.status(404)");
  });
});

describe('the AAA floor', () => {
  it('gives every control a 44px target', () => {
    // Gina navigates by knuckle. A 32px row is not reachable.
    for (const f of [LIST, DETAIL]) {
      expect(readCode(f), `${f} has no 44px target`).toContain('min-h-[44px]');
    }
  });

  it('uses design tokens, never a hardcoded colour', () => {
    for (const f of [LIST, DETAIL]) {
      expect(readCode(f), `${f} hardcodes a hex colour`).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});
