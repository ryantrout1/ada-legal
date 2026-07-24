import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * AdaSoonModal — a lightweight, non-capturing "Ada is opening soon" notice for
 * the HomeV2 landing. Replaces the email-capturing ComingSoonModal for Ada CTAs
 * during the pre-launch testing window: no waitlist, no obligation. Points the
 * reader to the Standards Guide in the meantime.
 *
 * Used via the provider/hook pattern (mirrors useComingSoonModal) so any Ada CTA
 * on the page can call openSoon() without prop drilling. Mounted in HomeV2.
 */
const AdaSoonContext = createContext(null);

export function useAdaSoon() {
  return useContext(AdaSoonContext);
}

export function AdaSoonProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openSoon = useCallback(() => setOpen(true), []);
  const closeSoon = useCallback(() => setOpen(false), []);

  return (
    <AdaSoonContext.Provider value={{ openSoon }}>
      {children}
      <AdaSoonModal isOpen={open} onClose={closeSoon} />
    </AdaSoonContext.Provider>
  );
}

function AdaSoonModal({ isOpen, onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog on open
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,18,25,0.6)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ada-soon-title"
        aria-describedby="ada-soon-desc"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px', padding: '32px',
          maxWidth: '440px', width: '100%', position: 'relative',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '16px', right: '16px', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--body-secondary)',
            borderRadius: '8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div aria-hidden="true" style={{
          width: '52px', height: '52px', borderRadius: '13px', marginBottom: '20px',
          background: 'rgba(124,92,252,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-ada-500)',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>

        <h2 id="ada-soon-title" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--heading)',
          margin: '0 0 10px', fontStyle: 'normal',
        }}>
          Ada is opening soon
        </h2>
        <p id="ada-soon-desc" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: 'var(--body)', lineHeight: 1.6, margin: '0 0 24px',
        }}>
          She's in final testing right now and will be ready to talk soon. In the meantime, you can
          explore the ADA Standards Guide to understand your rights — it's live and ready to use today.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            to={'/standards-guide'}
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent)',
              color: 'var(--btn-text)', padding: '13px 24px', borderRadius: '10px', fontSize: '0.95rem',
              fontWeight: 700, fontFamily: 'Manrope, sans-serif', textDecoration: 'none', minHeight: '44px', border: 'none',
            }}
          >
            Explore the Standards Guide →
          </Link>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', color: 'var(--body)', border: '1px solid var(--border)',
              padding: '13px 24px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600,
              fontFamily: 'Manrope, sans-serif', minHeight: '44px', cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {/* Meet-her link — explore Ada's story while she's in testing */}
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)',
          margin: '20px 0 0',
        }}>
          Curious about her in the meantime?{' '}
          <Link
            to="/about-ada"
            onClick={onClose}
            style={{
              color: 'var(--link)', fontWeight: 600,
              textDecoration: 'underline', textUnderlineOffset: '3px',
            }}
          >
            Why she's called Ada →
          </Link>
        </p>
      </div>
    </div>
  );
}
