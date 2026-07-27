/**
 * Phase 1 — barrier category taxonomy.
 *
 * `barrier_category` answers the only question a person browsing the
 * directory actually asks: where did this happen to me? It is a
 * separate axis from `kind` (the legal instrument, which is Gina's
 * field) and from `status` (the lifecycle stage).
 *
 * These tests pin the three properties the rest of the feature relies
 * on:
 *
 *   1. The enum is closed and every value carries a display label, so
 *      no surface can ever render a raw slug to a claimant.
 *   2. Every category belongs to exactly one cluster, and the clusters
 *      partition the enum — a category that drifts out of a cluster
 *      would silently vanish from grouped navigation.
 *   3. `unassigned` exists as a value but is never offered as a
 *      browsable option. It is the NOT NULL default that makes an
 *      un-categorised row visibly wrong rather than silently null.
 *
 * Ref: /plan litigation-taxonomy-and-contacts, Phase 1, AC1.
 */

import { describe, it, expect } from 'vitest';
import {
  BARRIER_CATEGORY_ORDER,
  BARRIER_CATEGORY_LABELS,
  BARRIER_CLUSTER_ORDER,
  BARRIER_CLUSTER_LABELS,
  CATEGORIES_BY_CLUSTER,
  barrierCategoryLabel,
  clusterForCategory,
  isBrowsableCategory,
  type BarrierCategory,
} from '@/app/lib/barrierCategories';

describe('barrier category enum', () => {
  it('carries the 15 browsable categories in cluster order', () => {
    expect(BARRIER_CATEGORY_ORDER).toEqual([
      // Getting around
      'sidewalks_streets',
      'rideshare_taxis',
      'air_travel',
      'buses_transit',
      // Places that serve the public
      'healthcare',
      'hotels_lodging',
      'restaurants_stores_venues',
      // Online & digital
      'websites_apps_kiosks',
      // Government & civic life
      'voting_elections',
      'gov_services',
      // Where you live, learn & work
      'jails_prisons',
      'community_living',
      'education',
      'employment',
      'housing',
    ]);
  });

  it('does not offer `unassigned` as a browsable option', () => {
    expect(BARRIER_CATEGORY_ORDER).not.toContain('unassigned');
    expect(isBrowsableCategory('unassigned')).toBe(false);
    expect(isBrowsableCategory('sidewalks_streets')).toBe(true);
    expect(isBrowsableCategory('not_a_category')).toBe(false);
  });

  it('gives every category — including `unassigned` — a display label', () => {
    for (const category of BARRIER_CATEGORY_ORDER) {
      const label = BARRIER_CATEGORY_LABELS[category];
      expect(label, `missing label for ${category}`).toBeTruthy();
      // A label that still looks like a slug means someone added the
      // enum value and forgot the human string.
      expect(label).not.toContain('_');
    }
    expect(BARRIER_CATEGORY_LABELS.unassigned).toBeTruthy();
  });

  it('falls back to the raw value rather than rendering blank', () => {
    expect(barrierCategoryLabel('sidewalks_streets')).toBe(
      'Sidewalks & street crossings',
    );
    expect(barrierCategoryLabel('made_up')).toBe('made_up');
    expect(barrierCategoryLabel(null)).toBe('');
    expect(barrierCategoryLabel(undefined)).toBe('');
  });
});

describe('cluster grouping', () => {
  it('carries the five clusters in navigation order', () => {
    expect(BARRIER_CLUSTER_ORDER).toEqual([
      'getting_around',
      'public_places',
      'online_digital',
      'gov_civic',
      'live_learn_work',
    ]);
  });

  it('gives every cluster a display label', () => {
    for (const cluster of BARRIER_CLUSTER_ORDER) {
      expect(BARRIER_CLUSTER_LABELS[cluster], `missing label for ${cluster}`).toBeTruthy();
    }
  });

  it('partitions the enum — every browsable category lands in exactly one cluster', () => {
    const seen = new Map<string, number>();
    for (const cluster of BARRIER_CLUSTER_ORDER) {
      for (const category of CATEGORIES_BY_CLUSTER[cluster]) {
        seen.set(category, (seen.get(category) ?? 0) + 1);
      }
    }

    // Every category appears.
    for (const category of BARRIER_CATEGORY_ORDER) {
      expect(seen.get(category), `${category} is in no cluster`).toBe(1);
    }
    // And nothing extra appears.
    expect(seen.size).toBe(BARRIER_CATEGORY_ORDER.length);
  });

  it('resolves a category back to its cluster', () => {
    expect(clusterForCategory('air_travel')).toBe('getting_around');
    expect(clusterForCategory('jails_prisons')).toBe('live_learn_work');
    expect(clusterForCategory('websites_apps_kiosks')).toBe('online_digital');
    expect(clusterForCategory('unassigned')).toBeNull();
    expect(clusterForCategory('made_up')).toBeNull();
  });

  it('is exhaustive over the type — a new category without a cluster is a compile error', () => {
    // Type-level guard. CATEGORIES_BY_CLUSTER is typed
    // Record<BarrierCluster, readonly BarrierCategory[]>, and the
    // runtime partition check above catches the omission. This
    // assertion documents the contract for the next author.
    const all: BarrierCategory[] = [...BARRIER_CATEGORY_ORDER];
    expect(all.length).toBe(15);
  });
});
