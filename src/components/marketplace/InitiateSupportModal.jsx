import React, { useEffect, useRef } from 'react';

export default function InitiateSupportModal({ open, onCancel, onConfirm, processing }) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Focus the cancel button when modal opens
    cancelRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Tab') {
        const focusable = [cancelRef.current, confirmRef.current].filter(Boolean);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="initiate-modal-heading"
      aria-describedby="initiate-modal-body"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-lg)'
      }}
    >
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)', padding: 'var(--space-2xl)',
        maxWidth: '480px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <h2
          id="initiate-modal-heading"
          style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
            color: 'var(--slate-900)', margin: '0 0 var(--space-md) 0'
          }}
        >
          Initiate Support for This Case?
        </h2>
        <p
          id="initiate-modal-body"
          style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            color: 'var(--slate-600)', lineHeight: 1.6,
            margin: '0 0 var(--space-xl) 0'
          }}
        >
          By initiating support for this case, you agree to contact the claimant within 24 hours. This case will be exclusively assigned to you. This action cannot be undone.
        </p>

        <div style={{
          display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={processing}
            style={{
              padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-700)',
              backgroundColor: 'transparent', border: '2px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)', cursor: processing ? 'not-allowed' : 'pointer',
              minHeight: '44px', transition: 'all 0.15s',
              opacity: processing ? 0.5 : 1
            }}
            onMouseEnter={e => { if (!processing) e.currentTarget.style.borderColor = 'var(--slate-400)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--slate-200)'; }}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={processing}
            style={{
              padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', fontWeight: 700, color: 'white',
              backgroundColor: processing ? 'var(--slate-400)' : 'var(--terra-600)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: processing ? 'not-allowed' : 'pointer',
              minHeight: '44px', transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => { if (!processing) e.currentTarget.style.backgroundColor = 'var(--terra-700)'; }}
            onMouseLeave={e => { if (!processing) e.currentTarget.style.backgroundColor = processing ? 'var(--slate-400)' : 'var(--terra-600)'; }}
          >
            {processing ? 'Assigning…' : 'Confirm — Initiate Support'}
          </button>
        </div>
      </div>
    </div>
  );
}