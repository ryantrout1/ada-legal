import React, { createContext, useContext, useCallback, useRef } from 'react';

const AnnounceContext = createContext(() => {});

export function useAnnounce() {
  return useContext(AnnounceContext);
}

export default function LiveAnnouncer({ children }) {
  const politeRef = useRef(null);
  const assertiveRef = useRef(null);

  const announce = useCallback((message, priority = 'polite') => {
    const el = priority === 'assertive' ? assertiveRef.current : politeRef.current;
    if (!el) return;
    // Clear then set to trigger screen reader
    el.textContent = '';
    requestAnimationFrame(() => {
      el.textContent = message;
    });
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
      />
    </AnnounceContext.Provider>
  );
}