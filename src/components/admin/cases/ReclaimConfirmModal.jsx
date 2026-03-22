import React, { useEffect, useRef } from 'react';

export default function ReclaimConfirmModal({ open, caseData, lawyerName, onConfirm, onCancel, saving }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open && confirmRef.current) confirmRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape' && !saving) onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, saving, onCancel]);

  if (!open || !caseData) return null;

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="reclaim-heading"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem'
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onCancel(); }}
    >
      <div style={{
        backgroundColor: 'var(--card-bg)', borderRadius: '16px', width: '100%', maxWidth: '420px',
        padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h2 id="reclaim-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 700,
          color: 'var(--heading)', margin: '0 0 12px'
        }}>
          Reclaim Case
        </h2>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Reclaim <strong>{caseData.business_name}</strong> from <strong>{lawyerName || 'Unknown'}</strong>? It will return to the available case pool.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '8px 20px', minHeight: '44px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--slate-600)', backgroundColor: 'transparent',
              border: '1.5px solid var(--card-border)', borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={saving}
            aria-label={`Confirm reclaim ${caseData.business_name} from ${lawyerName}`}
            style={{
              padding: '8px 20px', minHeight: '44px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
              color: 'var(--card-bg)', backgroundColor: saving ? 'var(--body-secondary)' : 'var(--err-fg)',
              border: 'none', borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Reclaiming…' : 'Reclaim'}
          </button>
        </div>
      </div>
    </div>
  );
}