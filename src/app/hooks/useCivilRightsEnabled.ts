/**
 * useCivilRightsEnabled: is the state civil rights complaint page open?
 *
 * Reads civil_rights_enabled from /api/public/site-flags. FAILS CLOSED:
 * 'off' on any error, and 'loading' (never 'on') until the answer arrives,
 * so the wizard never starts before the flag says it may.
 */

import { useEffect, useState } from 'react';

export type FlagState = 'loading' | 'on' | 'off';

export function useCivilRightsEnabled(): FlagState {
  const [state, setState] = useState<FlagState>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/public/site-flags');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const body = (await resp.json()) as { civil_rights_enabled?: boolean };
        if (!cancelled) setState(body.civil_rights_enabled === true ? 'on' : 'off');
      } catch {
        if (!cancelled) setState('off');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
