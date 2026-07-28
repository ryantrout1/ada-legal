/**
 * Feedback needs a way to be dealt with.
 *
 * The inbox lists everything ever submitted, newest first, capped at 500,
 * with no way to mark anything handled. That is fine at zero rows and
 * useless at fifty: the tenth message buries the first and nobody can
 * tell what has been read. Base44's table had new / reviewed / archived
 * and Neon's had no status at all.
 *
 * ARCHIVED IS NOT DELETED. Feedback on an accessibility product is
 * evidence about the product. Archiving takes a message out of the way;
 * it never removes it, and the filter can always reach it again.
 *
 * THE GUARD REFUSES BY NAME. A status the column will not accept comes
 * back with the field and the allowed values, not a 500 from the CHECK
 * and not a quiet no-op. This repo has been bitten by silent drops in an
 * admin write path before.
 *
 * Ref: /plan finish feedback on Vercel, Phase 1. AC1, AC2, AC4.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import { isFeedbackStatus, FEEDBACK_STATUSES } from '@/engine/clients/types';
import { readCode } from '../support/sourceText.js';

const ORG = '00000000-0000-4000-8000-000000000001';

async function seed(c: InMemoryDbClient, message = 'The ramp photo helped') {
  return c.createFeedback({
    orgId: ORG,
    message,
    feedbackType: 'general_feedback',
  });
}

describe('what a status can be', () => {
  it('is exactly the three the column accepts', () => {
    expect([...FEEDBACK_STATUSES].sort()).toEqual(['archived', 'new', 'reviewed']);
  });

  it.each(FEEDBACK_STATUSES)('accepts %s', (s) => {
    expect(isFeedbackStatus(s)).toBe(true);
  });

  it('rejects anything else, including near misses', () => {
    for (const bad of ['done', 'Archived', 'new ', '', null, undefined, 0, {}, ['new']]) {
      expect(isFeedbackStatus(bad), `${String(bad)} was accepted`).toBe(false);
    }
  });
});

describe('a new message', () => {
  it('starts as new without anyone saying so', async () => {
    const c = new InMemoryDbClient();
    const row = await seed(c);
    expect(row.status).toBe('new');
  });
});

describe('dealing with a message', () => {
  it('marks it reviewed and it stays that way', async () => {
    const c = new InMemoryDbClient();
    const row = await seed(c);

    const updated = await c.updateFeedbackStatus(row.id, 'reviewed');
    expect(updated?.status).toBe('reviewed');

    const [read] = await c.listFeedback({ status: 'reviewed' });
    expect(read.id).toBe(row.id);
  });

  it('changes nothing else about it', async () => {
    // The message is the thing somebody took the trouble to write. A
    // status change must not touch a character of it.
    const c = new InMemoryDbClient();
    const row = await seed(c, 'The contrast on the guide pages is hard for me');

    const updated = await c.updateFeedbackStatus(row.id, 'archived');
    expect(updated?.message).toBe('The contrast on the guide pages is hard for me');
    expect(updated?.feedbackType).toBe(row.feedbackType);
    expect(updated?.createdAt).toBe(row.createdAt);
  });

  it('reports a miss rather than pretending', async () => {
    const c = new InMemoryDbClient();
    expect(await c.updateFeedbackStatus('no-such-feedback', 'reviewed')).toBeNull();
  });

  it('archiving keeps it, it does not delete it', async () => {
    const c = new InMemoryDbClient();
    const row = await seed(c);
    await c.updateFeedbackStatus(row.id, 'archived');

    expect(await c.listFeedback({ status: 'new' })).toHaveLength(0);
    expect(await c.listFeedback({ status: 'archived' })).toHaveLength(1);
    expect(await c.listFeedback({})).toHaveLength(1);
  });
});

describe('reading the inbox', () => {
  it('filters to one status, or returns everything', async () => {
    const c = new InMemoryDbClient();
    const a = await seed(c, 'one');
    await seed(c, 'two');
    const cc = await seed(c, 'three');
    await c.updateFeedbackStatus(a.id, 'reviewed');
    await c.updateFeedbackStatus(cc.id, 'archived');

    expect(await c.listFeedback({ status: 'new' })).toHaveLength(1);
    expect(await c.listFeedback({ status: 'reviewed' })).toHaveLength(1);
    expect(await c.listFeedback({ status: 'archived' })).toHaveLength(1);
    expect(await c.listFeedback({})).toHaveLength(3);
  });

  it('puts the newest first, because that is the one to read', async () => {
    const c = new InMemoryDbClient();
    await seed(c, 'older');
    await seed(c, 'newer');
    const rows = await c.listFeedback({});
    expect(rows[0].message).toBe('newer');
  });

  it('is empty rather than null when nobody has said anything', async () => {
    const c = new InMemoryDbClient();
    expect(await c.listFeedback({})).toEqual([]);
  });

  it('keeps the testimonial consent flag exactly as submitted', async () => {
    // Someone marked as a testimonial WITHOUT consent must keep saying
    // so. Losing this flag on a read would make an unquotable message
    // look quotable.
    const c = new InMemoryDbClient();
    await c.createFeedback({
      orgId: ORG,
      message: 'Ada found the thing I could not describe',
      feedbackType: 'testimonial',
      testimonialConsent: false,
    });
    const [row] = await c.listFeedback({});
    expect(row.feedbackType).toBe('testimonial');
    expect(row.testimonialConsent).toBe(false);
  });
});

/**
 * The screen, pinned by source assertion — this repo has no React render
 * testing, so the file's text is what can be checked. Same approach as
 * the portal label guard and the email screen.
 */
describe('the inbox screen', () => {
  const SCREEN = 'src/app/routes/admin/AdminFeedback.tsx';
  const src = readCode(SCREEN);

  it('opens on what needs attention, not on everything ever sent', () => {
    expect(src).toContain("useState<Filter>('new')");
    expect(src).toContain('status=${filter}');
  });

  it('can still reach archived, because archiving is not deleting', () => {
    expect(src).toContain("value: 'archived'");
    expect(src).toContain("value: 'all'");
  });

  it('offers a way back out of archived', () => {
    // Nothing here deletes. A message put away by mistake has to be
    // retrievable or the archive button becomes a trap.
    expect(src).toContain('Put back');
  });

  it('says why an action failed instead of looking like it worked', () => {
    expect(src).toContain('actionError');
    expect(src).toContain('role="alert"');
  });

  it('tells you what an empty view means, per view', () => {
    // "No feedback yet" under the Archived filter is a lie.
    expect(src).toContain('EMPTY_BY_FILTER[filter]');
    expect(src).toContain('Nothing waiting');
  });

  it('keeps the 44px floor on every control', () => {
    const controls = src.match(/<button/g) ?? [];
    const targets = src.match(/min-h-\[44px\]/g) ?? [];
    expect(controls.length).toBeGreaterThan(0);
    expect(targets.length, 'a button without a 44px target').toBeGreaterThanOrEqual(
      controls.length,
    );
  });

  it('uses tokens, never a hardcoded colour', () => {
    expect(src).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
