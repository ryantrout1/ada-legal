import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertTriangle, Flag } from 'lucide-react';

const REJECTION_REASONS = [
  { value: 'insufficient_detail', label: 'Insufficient detail' },
  { value: 'not_ada_violation', label: 'Not an ADA violation' },
  { value: 'duplicate', label: 'Duplicate submission' },
  { value: 'incomplete_contact', label: 'Incomplete contact info' },
  { value: 'other', label: 'Other' }
];

const FLAG_REASONS = [
  { value: 'needs_info', label: 'Needs more information' },
  { value: 'possible_duplicate', label: 'Possible duplicate' },
  { value: 'verify_business', label: 'Verify business exists' },
  { value: 'sensitive_case', label: 'Sensitive case — needs senior review' },
  { value: 'other', label: 'Other' }
];

const ACTION_CONFIG = {
  approve: {
    title: 'Approve Case',
    headerBg: '#DCFCE7',
    headerColor: '#15803D',
    buttonBg: '#15803D',
    icon: Check,
    message: 'This case will be moved to the attorney marketplace and become visible to licensed attorneys in the claimant\'s state.',
    commentLabel: 'Review Note (optional — internal only, not visible to claimant)',
    commentPlaceholder: 'Add a review note (optional) — e.g., strong narrative, may need follow-up on address...',
    confirmText: 'Approve Case'
  },
  reject: {
    title: 'Reject Case',
    headerBg: '#FEE2E2',
    headerColor: '#B91C1C',
    buttonBg: '#B91C1C',
    icon: X,
    message: 'This case will be rejected and the claimant will be notified. Please provide a reason.',
    commentLabel: 'Rejection Note (optional — internal only)',
    commentPlaceholder: 'Provide additional context for the rejection (optional)...',
    confirmText: 'Reject Case',
    warning: 'The claimant will see a generic rejection message, not your notes.'
  },
  flag: {
    title: 'Flag for Review',
    headerBg: '#FEF3C7',
    headerColor: '#92400E',
    buttonBg: '#D97706',
    icon: Flag,
    message: 'This case will be flagged for further review. It will remain in the queue.',
    commentLabel: 'Flag Note (optional)',
    commentPlaceholder: 'What needs to be reviewed? (optional)...',
    confirmText: 'Flag Case'
  }
};

export default function QCActionModal({ open, action, businessName, onConfirm, onCancel, saving }) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setComment('');
      modalRef.current?.focus();
    }
  }, [open, action]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !saving) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, saving, onCancel]);

  if (!open || !action) return null;

  const config = ACTION_CONFIG[action];
  const Icon = config.icon;
  const needsReason = action === 'reject' || action === 'flag';
  const reasons = action === 'reject' ? REJECTION_REASONS : FLAG_REASONS;
  const canConfirm = !needsReason || reason;

  const handleConfirm = () => {
    if (!canConfirm || saving) return;
    onConfirm({ reason, comment });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qc-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onCancel(); }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          backgroundColor: config.headerBg, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <Icon size={20} style={{ color: config.headerColor }} />
          <h2 id="qc-modal-title" style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
            color: config.headerColor, margin: 0, flex: 1
          }}>
            {config.title} — {businessName}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              padding: '4px', color: config.headerColor, opacity: saving ? 0.5 : 1
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569',
            margin: '0 0 16px', lineHeight: 1.5
          }}>
            {config.message}
          </p>

          {needsReason && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px'
              }}>
                {action === 'reject' ? 'Rejection Reason' : 'Flag Reason'} <span style={{ color: '#B91C1C' }}>*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={saving}
                style={{
                  width: '100%', padding: '10px 12px', fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.9375rem', border: '1px solid var(--slate-300)', borderRadius: '8px',
                  backgroundColor: 'white', color: 'var(--slate-800)'
                }}
              >
                <option value="">Select a reason...</option>
                {reasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: config.warning ? '12px' : '0' }}>
            <label style={{
              display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
              fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px'
            }}>
              {config.commentLabel}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={config.commentPlaceholder}
              disabled={saving}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.9375rem', border: '1px solid var(--slate-300)', borderRadius: '8px',
                resize: 'vertical', minHeight: '80px'
              }}
            />
          </div>

          {config.warning && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
              backgroundColor: '#FEF3C7', borderRadius: '8px'
            }}>
              <AlertTriangle size={16} style={{ color: '#92400E', flexShrink: 0, marginTop: '2px' }} />
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#92400E',
                margin: 0, lineHeight: 1.4
              }}>
                {config.warning}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid var(--slate-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px'
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              background: 'none', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
              color: 'var(--slate-600)', padding: '8px 16px'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              fontWeight: 700, color: 'white', backgroundColor: config.buttonBg,
              border: 'none', borderRadius: '8px',
              cursor: (!canConfirm || saving) ? 'not-allowed' : 'pointer',
              opacity: (!canConfirm || saving) ? 0.6 : 1
            }}
          >
            {saving ? 'Processing...' : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}