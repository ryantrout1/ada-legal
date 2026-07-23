/**
 * useUniversalCta — is the universal-Ada CTA live?
 *
 * Ported from Base44 (src/hooks/useUniversalCta.js @ 6b1e9ac), which
 * read the SiteConfig singleton. Here the flag comes from
 * /api/public/site-flags, backed by `ada_universal_cta` in Neon's
 * system_settings blob (migrated at M0). It is `false` today.
 *
 * When on, CTAs that would route to the Pathway pages retarget to
 * Ada — classification happens in conversation rather than in a triage
 * form, which is the Ada-as-front-door commitment. This app never
 * built the Pathway pages, so the flag-off branch routes to the same
 * place a flag-on branch would; the hook is kept so the landing's
 * flag-aware copy still reads the real flag rather than a constant.
 *
 * Fails closed, like every other flag hook here: false while loading,
 * false on any error.
 */

import { useEffect, useState } from 'react';

interface SiteFlagsResponse {
  ada_universal_cta?: boolean;
}

export function useUniversalCta(): { adaUniversalCta: boolean; loaded: boolean } {
  const [adaUniversalCta, setAdaUniversalCta] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/public/site-flags');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const body = (await resp.json()) as SiteFlagsResponse;
        if (!cancelled) setAdaUniversalCta(body.ada_universal_cta === true);
      } catch {
        if (!cancelled) setAdaUniversalCta(false);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { adaUniversalCta, loaded };
}
