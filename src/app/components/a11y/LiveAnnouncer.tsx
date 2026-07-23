/**
 * LiveAnnouncer — B44 chrome port (src/components/a11y/LiveAnnouncer.jsx
 * @ 6b1e9ac, M1 Phase 3).
 *
 * App-level aria-live regions + a context hook so any component can post
 * a screen-reader announcement without owning its own live region. B44
 * wraps the whole Layout in this; the accessibility panel announces every
 * preference change through it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';

type Announce = (message: string, priority?: 'polite' | 'assertive') => void;

const AnnounceContext = createContext<Announce>(() => {});

export function useAnnounce(): Announce {
  return useContext(AnnounceContext);
}

export default function LiveAnnouncer({ children }: { children: ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce = useCallback<Announce>((message, priority = 'polite') => {
    const el =
      priority === 'assertive' ? assertiveRef.current : politeRef.current;
    if (!el) return;
    // Clear then set on the next frame so repeat announcements re-trigger.
    el.textContent = '';
    requestAnimationFrame(() => {
      el.textContent = message;
    });
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <aside role="complementary" aria-label="Notifications" className="sr-only">
        <div ref={politeRef} aria-live="polite" aria-atomic="true" role="status" />
        <div
          ref={assertiveRef}
          aria-live="assertive"
          aria-atomic="true"
          role="alert"
        />
      </aside>
    </AnnounceContext.Provider>
  );
}
