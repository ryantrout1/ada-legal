import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ForceCloseModal({ open, caseData, onSubmit, onCancel, saving }) {
  const [notes, setNotes] = useState('');

  if (!open || !caseData) return null;

  const canSubmit = notes.trim().length > 0;

  const handleSubmit = () => {
    onSubmit({ resolution_notes: notes });
  };

  const handleClose = () => {
    setNotes('');
    onCancel();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem'
    }} onClick={e => { if (e.target === e.currentTarget && !saving) handleClose(); }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflow: 'auto', padding: 'var(--space-xl)'
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--slate-900)', margin: '0 0 var(--space-lg) 0'
        }}>
          Force Close — {caseData.business_name}
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.375rem' }}>
            Resolution Type
          </p>
          <div style={{
            padding: '0.5rem 0.75rem', backgroundColor: 'var(--slate-50)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)'
          }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-600)' }}>
              Admin Closed
            </span>
          </div>
        </div>

        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.375rem' }}>
          Resolution Notes *
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Reason for admin closure..."
          rows={4}
          style={{
            width: '100%', padding: '0.5rem 0.75rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            border: '2px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
            color: 'var(--slate-800)', outline: 'none', resize: 'vertical',
            minHeight: '100px', boxSizing: 'border-box'
          }}
        />

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          padding: '0.75rem', backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-md)',
          border: '1px solid #FECACA', margin: '1rem 0'
        }}>
          <AlertTriangle size={16} style={{ color: '#B91C1C', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>
            This will close the case and notify the claimant. If a lawyer is assigned, they will lose access to this case.
          </p>
        </div>

        <button type="button" disabled={!canSubmit || saving} onClick={handleSubmit} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '0.625rem 1.5rem',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
          color: 'white', backgroundColor: (!canSubmit || saving) ? 'var(--slate-300)' : '#B91C1C',
          border: 'none', borderRadius: 'var(--radius-md)',
          cursor: (!canSubmit || saving) ? 'not-allowed' : 'pointer', minHeight: '44px',
          marginBottom: '0.75rem'
        }}>
          {saving ? 'Closing…' : 'Confirm Close'}
        </button>
        <div style={{ textAlign: 'center' }}>
          <button type="button" onClick={handleClose} disabled={saving} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
            color: 'var(--slate-500)', padding: '0.5rem'
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}