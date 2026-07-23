/**
 * useLawsuitsAdaCta — should the lawsuit pages render the Ada CTA?
 *
 * Ported from Base44 (src/hooks/useLawsuitsAdaCta.js @ 6b1e9ac), which
 * read the SiteConfig entity directly. Here the flag comes from
 * /api/public/site-flags, backed by the `lawsuits_ada_cta_enabled` key
 * in Neon's system_settings blob (migrated at M0).
 *
 * FAILS CLOSED, exactly as B44's does: false while loading and false on
 * any error, so the CTA is never shown unless the flag is explicitly
 * true. No CTA means render nothing in its place — the caller omits the
 * block rather than substituting a placeholder.
 */

import { useEffect, useState } from 'react';

interface SiteFlagsResponse {
  lawsuits_ada_cta_enabled?: boolean;
}

export function useLawsuitsAdaCta(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/public/site-flags');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const body = (await resp.json()) as SiteFlagsResponse;
        if (!cancelled) setEnabled(body.lawsuits_ada_cta_enabled === true);
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
