import React, { useEffect, useRef, useState } from 'react';

const REJECTION_REASONS = [
  { value: 'insufficient_detail', label: 'Insufficient detail' },
  { value: 'not_ada_violation', label: 'Not an ADA violation' },
  { value: 'duplicate', label: 'Duplicate report' },
  { value: 'incomplete_contact', label: 'Incomplete contact info' },
  { value: 'other', label: 'Other' },
];

export default function BulkActionModal({ open, action, businessName, count, onConfirm, onCancel, saving }) {
  const overlayRef = useRef(null);
  const firstFocusRef = useRef(null);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setComment('');
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const isApprove = action === 'approve';

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isApprove ? `Approve all ${count} cases` : `Reject all ${count} cases`}
    >
      <div style={{
        backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px',
        maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
          color: 'var(--heading)', margin: '0 0 12px',
        }}>
          {isApprove ? `Approve all ${count} cases` : `Reject all ${count} cases`}
        </h2>

        {isApprove ? (
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
            Approve all <strong>{count}</strong> cases for <strong>{businessName}</strong>? They will all move to the available case pool.
          </p>
        ) : (
          <>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
              Reject all <strong>{count}</strong> cases for <strong>{businessName}</strong>. The same reason will apply to all.
            </p>
            <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body-secondary)', display: 'block', marginBottom: '4px' }}>
              Rejection reason *
            </label>
            <select
              ref={firstFocusRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', border: '1px solid var(--card-border)', borderRadius: '8px',
                marginBottom: '12px', minHeight: '44px',
              }}
            >
              <option value="">Select reason…</option>
              {REJECTION_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body-secondary)', display: 'block', marginBottom: '4px' }}>
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', border: '1px solid var(--card-border)', borderRadius: '8px',
                resize: 'vertical', marginBottom: '16px',
              }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              fontWeight: 600, border: '1px solid var(--card-border)', borderRadius: '8px',
              backgroundColor: 'var(--card-bg)', color: 'var(--body)', cursor: 'pointer', minHeight: '44px',
            }}
          >
            Cancel
          </button>
          <button
            ref={isApprove ? firstFocusRef : undefined}
            onClick={() => onConfirm({ reason, comment })}
            disabled={saving || (!isApprove && !reason)}
            style={{
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', minHeight: '44px',
              backgroundColor: isApprove ? 'var(--suc-fg)' : 'var(--err-fg)',
              color: 'var(--card-bg)',
              opacity: (saving || (!isApprove && !reason)) ? 0.5 : 1,
            }}
          >
            {saving ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}