/**
 * The planner turns a vercel.json redirect rule into one concrete request.
 * Getting it wrong is quiet: a rule modelled as the wrong URL either
 * passes against a path nobody uses, or fails against a rule that is
 * actually fine. Both erode trust in the verifier, which is worse than
 * not having one.
 *
 * The distinction that matters most is `has.value`: a named capture like
 * `(?<slug>.*)` means "any value, carry it through", while a literal like
 * `coen-v-ga-doc-deaf-prisoners` means the rule fires for that value only.
 * Modelling the second as the first is exactly how the closed-case
 * overrides would look verified while never being exercised.
 *
 * Ref: B44 decommission, Gate E.
 */

import { describe, expect, it } from 'vitest';

import {
  planCheck,
  locationMatches,
  SAMPLE_PARAM,
} from '../../scripts/redirectPlan.mjs';

describe('planCheck', () => {
  it('models a plain literal redirect', () => {
    const c = planCheck({ source: '/Lawsuits', destination: '/lawsuits', permanent: true });
    expect(c.path).toBe('/Lawsuits');
    expect(c.expectedLocation).toBe('/lawsuits');
    expect(c.skipped).toBeUndefined();
  });

  it('accepts 308 or 301 for a permanent rule', () => {
    const c = planCheck({ source: '/a', destination: '/b', permanent: true });
    // Vercel emits 308; 301 is the same instruction to a crawler.
    expect(c.expectedStatuses).toContain(308);
    expect(c.expectedStatuses).toContain(301);
  });

  it('uses temporary statuses when permanent is false', () => {
    const c = planCheck({ source: '/a', destination: '/b', permanent: false });
    expect(c.expectedStatuses).toContain(307);
    expect(c.expectedStatuses).not.toContain(308);
  });

  it('round-trips a :param through source and destination', () => {
    // Synthetic on purpose. A real retired path here would both couple
    // this unit test to live config and trip the route-rename guard.
    const c = planCheck({
      source: '/legacy-detail/:slug',
      destination: '/lawsuits/:slug',
      permanent: true,
    });
    expect(c.path).toBe(`/legacy-detail/${SAMPLE_PARAM}`);
    expect(c.expectedLocation).toBe(`/lawsuits/${SAMPLE_PARAM}`);
  });

  it('feeds a named capture the sample and expects it back', () => {
    const c = planCheck({
      source: '/LawsuitDetail',
      destination: '/lawsuits/:slug',
      permanent: true,
      has: [{ type: 'query', key: 'slug', value: '(?<slug>.*)' }],
    });
    expect(c.path).toBe(`/LawsuitDetail?slug=${SAMPLE_PARAM}`);
    expect(c.expectedLocation).toBe(`/lawsuits/${SAMPLE_PARAM}`);
  });

  it('uses a literal has-value verbatim rather than the sample', () => {
    // The closed-case overrides. Substituting the sample here would
    // request a URL the rule does not match and report a false failure.
    const c = planCheck({
      source: '/LawsuitDetail',
      destination: '/lawsuits',
      permanent: true,
      has: [{ type: 'query', key: 'slug', value: 'coen-v-ga-doc-deaf-prisoners' }],
    });
    expect(c.path).toBe('/LawsuitDetail?slug=coen-v-ga-doc-deaf-prisoners');
    expect(c.expectedLocation).toBe('/lawsuits');
  });

  it('skips a regex source rather than guessing a URL', () => {
    const c = planCheck({ source: '/(admin|portal)(/.*)?', destination: '/x' });
    expect(c.skipped).toBeTruthy();
  });

  it('skips a non-query has condition rather than pretending', () => {
    const c = planCheck({
      source: '/x',
      destination: '/y',
      has: [{ type: 'host', key: 'host', value: 'example.com' }],
    });
    expect(c.skipped).toBeTruthy();
  });
});

describe('locationMatches', () => {
  it('matches a path against a path', () => {
    expect(locationMatches('/lawsuits', '/lawsuits')).toBe(true);
  });

  it('matches an absolute Location against a path destination', () => {
    // Vercel returns absolute URLs in some configurations.
    expect(locationMatches('https://ada.adalegallink.com/lawsuits', '/lawsuits')).toBe(true);
  });

  it('preserves the query string in the comparison', () => {
    expect(locationMatches('/guides?preview=1', '/guides?preview=1')).toBe(true);
    expect(locationMatches('/guides', '/guides?preview=1')).toBe(false);
  });

  it('ignores a trailing slash difference', () => {
    expect(locationMatches('/lawsuits/', '/lawsuits')).toBe(true);
  });

  it('is false when there is no Location header at all', () => {
    // This is the 200-from-the-SPA case the verifier exists to catch.
    expect(locationMatches(null, '/lawsuits')).toBe(false);
  });

  it('does not match a different destination', () => {
    expect(locationMatches('/lawsuits', '/attorneys')).toBe(false);
  });
});
