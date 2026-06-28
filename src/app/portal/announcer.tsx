/**
 * Portal status announcer (WCAG 4.1.3 Status Messages).
 *
 * One polite, visually-hidden live region mounted once in the portal shell.
 * Any surface calls `useAnnounce()` and fires a short message after a
 * state-changing action (accept, decline, move, resolve, reassign, task
 * add/complete) so assistive-tech users — Josh on switch/voice/eye-gaze —
 * get confirmation the action landed without visually hunting for the change.
 *
 * The clear-then-set step re-announces identical consecutive messages, which
 * some screen readers otherwise swallow (e.g. accepting two referrals in a row).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type AnnounceFn = (message: string) => void;

const AnnounceContext = createContext<AnnounceFn>(() => {});

/** Returns `announce(message)` — call after a successful state change. */
export function useAnnounce(): AnnounceFn {
  return useContext(AnnounceContext);
}

export function PortalAnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback<AnnounceFn>((msg) => {
    // Clear first, then set on the next tick, so re-announcing the same text
    // still triggers the live region.
    setMessage('');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(msg), 60);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </AnnounceContext.Provider>
  );
}
