/**
 * The links the confirmation screen offers while a report is being prepared.
 *
 * These point into the standards guide, so they are only as good as the guide
 * index they name. A slug rename elsewhere in the app would leave four dead
 * links on a screen someone reaches only after paying — the worst place in the
 * product to send a person nowhere.
 *
 * So the slugs are checked against the real index, not a copied list. Both
 * halves matter: `titleForSlug` proves the guide is listed, and `GUIDE_LOADERS`
 * proves the route can actually render it. A slug can pass the first and fail
 * the second, and the result is a link that resolves to nothing.
 *
 * Encodes acceptance criterion 5 from /plan phase 2.
 */

import { describe, it, expect } from 'vitest';
import {
  SPOT_WAIT_GUIDE_SLUGS,
  resolveWaitLinks,
} from '@/app/routes/public/spot/waitLinks';
import {
  ALL_GUIDES,
  GUIDE_LOADERS,
  titleForSlug,
} from '@/app/routes/public/standardsGuideIndex';

describe('the wait-screen guide slugs are real', () => {
  it('offers four of them', () => {
    expect(SPOT_WAIT_GUIDE_SLUGS).toHaveLength(4);
  });

  it('matches what Spot tells people to photograph', () => {
    // The landing page says: the parking space, the curb ramp, the walk up to
    // the door, the door itself, the restroom. These four are that list.
    expect([...SPOT_WAIT_GUIDE_SLUGS]).toEqual(['ramps', 'entrances', 'restrooms', 'parking']);
  });

  it('every slug is listed in the guide index', () => {
    for (const slug of SPOT_WAIT_GUIDE_SLUGS) {
      expect(titleForSlug(slug), `no guide titled for slug "${slug}"`).not.toBeNull();
      expect(ALL_GUIDES.some((g) => g.slug === slug), slug).toBe(true);
    }
  });

  it('every slug has a loader, so the route can actually render', () => {
    for (const slug of SPOT_WAIT_GUIDE_SLUGS) {
      expect(GUIDE_LOADERS[slug], `no loader registered for slug "${slug}"`).toBeDefined();
    }
  });
});

describe('resolveWaitLinks', () => {
  it('returns a title and an href for each slug', () => {
    const links = resolveWaitLinks();
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link.href).toBe(`/standards-guide/guide/${link.slug}`);
      expect(link.title.length).toBeGreaterThan(0);
      expect(link.title).toBe(titleForSlug(link.slug));
    }
  });

  it('preserves the declared order', () => {
    expect(resolveWaitLinks().map((l) => l.slug)).toEqual([...SPOT_WAIT_GUIDE_SLUGS]);
  });

  it('drops a slug the guide index does not know rather than linking to nothing', () => {
    // Belt to the test above's braces: if a rename lands and nobody runs the
    // suite, the screen shows three links instead of one broken one.
    const links = resolveWaitLinks(['ramps', 'no-such-guide']);
    expect(links.map((l) => l.slug)).toEqual(['ramps']);
  });

  it('returns nothing when it knows nothing, instead of throwing', () => {
    expect(resolveWaitLinks(['no-such-guide'])).toEqual([]);
  });
});
