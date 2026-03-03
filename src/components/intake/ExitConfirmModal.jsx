import React, { useEffect, useRef } from 'react';
import { createPageUrl } from '../../utils';

export default function ExitConfirmModal({ open, onStay }) {
  const stayRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    stayRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onStay(); }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onStay]);

  if (!open) return null;

  const handleLeave = () => {
    window.location.href = createPageUrl('Home');
  };

  return (
    <div
      ref={overlayRef}
      role="dialog" aria-modal="true" aria-labelledby="exit-heading"
      onClick={(e) => { if (e.target === overlayRef.current) onStay(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', padding: 'var(--space-2xl)',
        maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <h2 id="exit-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--heading)', margin: '0 0 var(--space-md) 0'
        }}>
          Leave this form?
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          color: 'var(--body)', lineHeight: 1.6,
          margin: '0 0 var(--space-xl) 0'
        }}>
          Your progress has been saved automatically. You can return to this form later and pick up where you left off.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button" onClick={handleLeave}
            style={{
              padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', fontWeight: 600, color: 'var(--body)',
              backgroundColor: 'transparent', border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '44px'
            }}
          >
            Save &amp; Exit
          </button>
          <button
            ref={stayRef} className="intake-nav-btn"
            type="button" onClick={onStay}
            style={{
              padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', fontWeight: 700, color: 'white',
              backgroundColor: 'var(--section-label)', border: 'none',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '44px'
            }}
          >
            Keep Working
          </button>
        </div>
      </div>
    </div>
  );
}