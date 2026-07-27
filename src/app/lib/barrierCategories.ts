/**
 * Barrier categories — the "where did this happen to me" axis.
 *
 * `litigation_listings` carries three independent dimensions and they
 * answer different people's questions:
 *
 *   kind             the legal instrument (class, consent decree,
 *                    enforcement action…). Gina's field, and an
 *                    attorney's. A claimant should never have to know
 *                    whether their problem is a pattern of practice
 *                    before they can find help.
 *   status           the lifecycle stage (active, investigating,
 *                    compliance, tracking, closed).
 *   barrier_category THIS file. Where the barrier was encountered.
 *                    The only one of the three a person can navigate by.
 *
 * Fifteen categories, grouped into five clusters for navigation. The
 * grouping is display-only — `barrier_category` stores the leaf, and
 * the cluster is derived, so re-grouping later is a front-end change
 * with no migration.
 *
 * `unassigned` is a real enum value, not a null stand-in. The column is
 * NOT NULL DEFAULT 'unassigned', which makes an un-categorised row
 * visibly wrong on the admin surface rather than silently absent from
 * every category page. It is deliberately excluded from
 * BARRIER_CATEGORY_ORDER so it can never be offered as a filter.
 *
 * Ref: /plan litigation-taxonomy-and-contacts, Phase 1.
 */

export type BarrierCategory =
  // Getting around
  | 'sidewalks_streets'
  | 'rideshare_taxis'
  | 'air_travel'
  | 'buses_transit'
  // Places that serve the public
  | 'healthcare'
  | 'hotels_lodging'
  | 'restaurants_stores_venues'
  // Online & digital
  | 'websites_apps_kiosks'
  // Government & civic life
  | 'voting_elections'
  | 'gov_services'
  // Where you live, learn & work
  | 'jails_prisons'
  | 'community_living'
  | 'education'
  | 'employment'
  | 'housing';

/** The stored value for a row nobody has categorised yet. */
export type BarrierCategoryStored = BarrierCategory | 'unassigned';

export type BarrierCluster =
  | 'getting_around'
  | 'public_places'
  | 'online_digital'
  | 'gov_civic'
  | 'live_learn_work';

/**
 * The browsable categories, in navigation order. `unassigned` is
 * deliberately absent — see the file header.
 */
export const BARRIER_CATEGORY_ORDER: readonly BarrierCategory[] = [
  'sidewalks_streets',
  'rideshare_taxis',
  'air_travel',
  'buses_transit',
  'healthcare',
  'hotels_lodging',
  'restaurants_stores_venues',
  'websites_apps_kiosks',
  'voting_elections',
  'gov_services',
  'jails_prisons',
  'community_living',
  'education',
  'employment',
  'housing',
];

/**
 * Display labels. Plain language, no legal vocabulary — a person who
 * has just been refused a ride should recognise their situation in the
 * list without translating anything.
 *
 * Typed as a total record over the stored union so adding a category
 * without a label is a compile error, not a raw slug rendered to a
 * claimant.
 */
export const BARRIER_CATEGORY_LABELS: Record<BarrierCategoryStored, string> = {
  sidewalks_streets: 'Sidewalks & street crossings',
  rideshare_taxis: 'Rideshare & taxis',
  air_travel: 'Air travel',
  buses_transit: 'Buses & intercity transit',
  healthcare: 'Healthcare & medical offices',
  hotels_lodging: 'Hotels & lodging',
  restaurants_stores_venues: 'Restaurants, stores & venues',
  websites_apps_kiosks: 'Websites, apps & kiosks',
  voting_elections: 'Voting & elections',
  gov_services: 'Government services & benefits',
  jails_prisons: 'Jails & prisons',
  community_living: 'Community living & institutions',
  education: 'Education',
  employment: 'Employment',
  housing: 'Housing',
  unassigned: 'Not yet categorised',
};

export const BARRIER_CLUSTER_ORDER: readonly BarrierCluster[] = [
  'getting_around',
  'public_places',
  'online_digital',
  'gov_civic',
  'live_learn_work',
];

export const BARRIER_CLUSTER_LABELS: Record<BarrierCluster, string> = {
  getting_around: 'Getting around',
  public_places: 'Places that serve the public',
  online_digital: 'Online & digital',
  gov_civic: 'Government & civic life',
  live_learn_work: 'Where you live, learn & work',
};

/**
 * Cluster → categories. Typed as a total record over BarrierCluster
 * whose values are BarrierCategory arrays, so a typo in a category name
 * is a compile error. That the union of these arrays exactly equals
 * BARRIER_CATEGORY_ORDER is enforced by test, not by the type system.
 */
export const CATEGORIES_BY_CLUSTER: Record<BarrierCluster, readonly BarrierCategory[]> = {
  getting_around: ['sidewalks_streets', 'rideshare_taxis', 'air_travel', 'buses_transit'],
  public_places: ['healthcare', 'hotels_lodging', 'restaurants_stores_venues'],
  online_digital: ['websites_apps_kiosks'],
  gov_civic: ['voting_elections', 'gov_services'],
  live_learn_work: [
    'jails_prisons',
    'community_living',
    'education',
    'employment',
    'housing',
  ],
};

const BROWSABLE = new Set<string>(BARRIER_CATEGORY_ORDER);

/** True only for the 15 categories a reader can filter by. */
export function isBrowsableCategory(value: string | null | undefined): value is BarrierCategory {
  return typeof value === 'string' && BROWSABLE.has(value);
}

/**
 * Display label for a stored category.
 *
 * Falls back to the raw value rather than rendering blank — same rule
 * `kindLabel` and `statusLabel` follow. A visible slug is a bug report;
 * an empty cell is invisible.
 */
export function barrierCategoryLabel(value: string | null | undefined): string {
  if (!value) return '';
  return BARRIER_CATEGORY_LABELS[value as BarrierCategoryStored] ?? value;
}

const CLUSTER_BY_CATEGORY: ReadonlyMap<string, BarrierCluster> = new Map(
  BARRIER_CLUSTER_ORDER.flatMap((cluster) =>
    CATEGORIES_BY_CLUSTER[cluster].map((category) => [category as string, cluster] as const),
  ),
);

/** The cluster a category belongs to, or null for `unassigned` / unknown. */
export function clusterForCategory(value: string | null | undefined): BarrierCluster | null {
  if (!value) return null;
  return CLUSTER_BY_CATEGORY.get(value) ?? null;
}
