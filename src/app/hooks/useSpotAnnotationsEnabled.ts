/**
 * useSpotAnnotationsEnabled — should the public report render photo pins?
 *
 * Reads spot_show_annotations from /api/public/site-flags. FAILS CLOSED:
 * false while loading and false on any error, so pins never appear unless the
 * flag is explicitly on. This is the render kill-switch — flipping the flag off
 * pulls pins from every public report within the endpoint's ~60s cache, no
 * redeploy. Mirrors useLawsuitsAdaCta.
 */

import { useEffect, useState } from 'react';

interface SiteFlagsResponse {
  spot_show_annotations?: boolean;
}

export function useSpotAnnotationsEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/public/site-flags');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const body = (await resp.json()) as SiteFlagsResponse;
        if (!cancelled) setEnabled(body.spot_show_annotations === true);
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
