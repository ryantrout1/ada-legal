/**
 * Redirect-map planning: turn vercel.json's `redirects` array into a list
 * of concrete request/expectation pairs.
 *
 * Split out from the runner so the interesting part — building a real URL
 * from a rule that may carry `:params` and `has` query conditions — is
 * unit-testable without touching the network. The runner does the fetching.
 *
 * Ref: B44 decommission, Gate E — 301 verification.
 */

/**
 * @typedef {{ type: string, key: string, value: string }} HasCondition
 * @typedef {{ source: string, destination: string, permanent?: boolean,
 *             statusCode?: number, has?: HasCondition[],
 *             missing?: { type: string, key: string, value?: string }[] }} RedirectRule
 * @typedef {{ path: string, expectedLocation: string, expectedStatuses: number[],
 *             source: string, skipped?: string }} RedirectCheck
 */

/** Stand-in used wherever a rule interpolates a dynamic segment. */
export const SAMPLE_PARAM = 'sample-slug';

/** True for a Vercel named capture like `(?<slug>.*)`. */
function isNamedCapture(value) {
  return /\(\?<[A-Za-z_][A-Za-z0-9_]*>/.test(value);
}

/**
 * Substitute `:param` segments in a source or destination.
 *
 * Vercel's `:param` matches one path segment. A rule whose source has a
 * param and whose destination reuses it must round-trip the SAME value,
 * which is the property worth checking — a map that silently drops the
 * slug sends someone who clicked a specific case to a list.
 */
function fillParams(pattern, value) {
  return pattern.replace(/:([A-Za-z_][A-Za-z0-9_]*)\*?/g, value);
}

/** Regex-ish sources can't be turned into one concrete request. */
function isPatternSource(source) {
  return /[()[\]{}|+?^$\\]/.test(source);
}

/**
 * @param {RedirectRule} rule
 * @returns {RedirectCheck}
 */
export function planCheck(rule) {
  const expectedStatuses = rule.statusCode
    ? [rule.statusCode]
    : rule.permanent === false
      ? [307, 302]
      : [308, 301];
  const base = { source: rule.source, expectedStatuses };

  if (rule.missing && rule.missing.length > 0) {
    return {
      ...base,
      path: rule.source,
      expectedLocation: rule.destination,
      skipped: 'rule has a `missing` condition; not modelled',
    };
  }

  if (isPatternSource(rule.source)) {
    return {
      ...base,
      path: rule.source,
      expectedLocation: rule.destination,
      skipped: 'source is a pattern, not a literal path',
    };
  }

  let path = fillParams(rule.source, SAMPLE_PARAM);
  let expectedLocation = fillParams(rule.destination, SAMPLE_PARAM);

  if (rule.has && rule.has.length > 0) {
    const queryConds = rule.has.filter((h) => h.type === 'query');
    if (queryConds.length !== rule.has.length) {
      return {
        ...base,
        path,
        expectedLocation,
        skipped: 'non-query `has` condition; not modelled',
      };
    }
    const params = new URLSearchParams();
    for (const h of queryConds) {
      // A named capture means "any value" — feed it the sample and expect
      // that same value back in the destination. A literal means the rule
      // only fires for that exact value, so use it verbatim.
      const value = isNamedCapture(h.value) ? SAMPLE_PARAM : h.value;
      params.set(h.key, value);
    }
    path = `${path}?${params.toString()}`;
    expectedLocation = fillParams(rule.destination, SAMPLE_PARAM);
  }

  return { ...base, path, expectedLocation };
}

/**
 * @param {RedirectRule[]} rules
 * @returns {RedirectCheck[]}
 */
export function planAll(rules) {
  return rules.map(planCheck);
}

/**
 * Compare an observed Location against what the rule promised.
 *
 * Vercel returns Location as a path for same-origin destinations and an
 * absolute URL for cross-origin ones; normalize so the comparison is about
 * the destination, not the serialization. Query strings on the destination
 * are preserved, which matters for the `?preview` parked-route rules.
 */
/**
 * @param {string | null} observed
 * @param {string} expected
 * @returns {boolean}
 */
export function locationMatches(observed, expected) {
  if (observed == null) return false;
  let got = observed;
  try {
    // Absolute → path + query. Relative URL() throws without a base, so
    // only strip when it actually parses as absolute.
    const u = new URL(observed);
    got = `${u.pathname}${u.search}`;
  } catch {
    /* already a path */
  }
  const strip = (s) => (s.length > 1 && s.endsWith('/') ? s.slice(0, -1) : s);
  return strip(got) === strip(expected);
}
