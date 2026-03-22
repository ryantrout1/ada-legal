import React, { useState, useEffect, useRef } from 'react';

const REJECT_REASONS = [
  { value: 'insufficient_detail', label: 'Insufficient detail' },
  { value: 'not_ada_violation', label: 'Not an ADA violation' },
  { value: 'duplicate', label: 'Duplicate report' },
  { value: 'incomplete_contact', label: 'Incomplete contact info' },
  { value: 'other', label: 'Other' },
];

export default function TriageRejectModal({ open, onConfirm, onCancel, saving }) {
  const [reason, setReason] = useState('insufficient_detail');
  const [comment, setComment] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('insufficient_detail');
      setComment('');
      setTimeout(() => selectRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCancel(); }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10010,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      role="dialog" aria-modal="true" aria-label="Reject case"
    >
      <div style={{
        backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '24px',
        maxWidth: '440px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--err-fg)', margin: '0 0 16px' }}>
          ❌ Reject Case
        </h3>
        <label htmlFor="triage-reject-reason" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body-secondary)', display: 'block', marginBottom: '4px' }}>
          Reason
        </label>
        <select
          ref={selectRef}
          id="triage-reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', minHeight: '44px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            border: '1px solid var(--card-border)', borderRadius: '8px', marginBottom: '12px',
          }}
        >
          {REJECT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <label htmlFor="triage-reject-comment" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body-secondary)', display: 'block', marginBottom: '4px' }}>
          Comment (optional)
        </label>
        <textarea
          id="triage-reject-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          style={{
            width: '100%', padding: '10px 12px', fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem', border: '1px solid var(--card-border)', borderRadius: '8px',
            resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              fontWeight: 600, border: '1px solid var(--card-border)', borderRadius: '8px',
              backgroundColor: 'var(--card-bg)', color: 'var(--body)', cursor: 'pointer', minHeight: '44px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ reason, comment })}
            disabled={saving}
            style={{
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', minHeight: '44px',
              backgroundColor: 'var(--err-fg)', color: 'var(--card-bg)', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}