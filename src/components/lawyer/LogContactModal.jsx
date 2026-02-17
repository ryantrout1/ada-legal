import React, { useState, useEffect, useRef } from 'react';

const CONTACT_TYPES = [
  { value: 'initial_contact', label: 'Initial Contact' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'case_update', label: 'Case Update' }
];

const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other', label: 'Other' }
];

const selectStyle = {
  width: '100%', minHeight: '44px', padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
  color: 'var(--slate-800)', backgroundColor: 'var(--surface)',
  border: '2px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
  outline: 'none', boxSizing: 'border-box'
};

export default function LogContactModal({ open, onCancel, onSubmit, saving }) {
  const [form, setForm] = useState({ contact_type: '', contact_method: '', notes: '' });
  const [errors, setErrors] = useState({});
  const cancelRef = useRef(null);
  const submitRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm({ contact_type: '', contact_method: '', notes: '' });
    setErrors({});
    setTimeout(() => cancelRef.current?.focus(), 50);

    const handleKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      if (e.key === 'Tab') {
        const els = [cancelRef.current, submitRef.current].filter(Boolean);
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [open, onCancel]);

  if (!open) return null;

  const handleSubmit = () => {
    const e = {};
    if (!form.contact_type) e.contact_type = 'Required';
    if (!form.contact_method) e.contact_method = 'Required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit(form);
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="log-contact-heading"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onCancel(); }}
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
        maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <h2 id="log-contact-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--slate-900)', margin: '0 0 var(--space-lg) 0'
        }}>Log Contact Made</h2>

        {/* Contact Type */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{
            display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 700, color: 'var(--slate-600)', marginBottom: '4px'
          }}>Contact Type *</label>
          <select
            value={form.contact_type} onChange={e => setForm(p => ({ ...p, contact_type: e.target.value }))}
            style={{ ...selectStyle, borderColor: errors.contact_type ? 'var(--error-600)' : 'var(--slate-200)' }}
          >
            <option value="">Select…</option>
            {CONTACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Contact Method */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{
            display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 700, color: 'var(--slate-600)', marginBottom: '4px'
          }}>Contact Method *</label>
          <select
            value={form.contact_method} onChange={e => setForm(p => ({ ...p, contact_method: e.target.value }))}
            style={{ ...selectStyle, borderColor: errors.contact_method ? 'var(--error-600)' : 'var(--slate-200)' }}
          >
            <option value="">Select…</option>
            {CONTACT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <label style={{
            display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 700, color: 'var(--slate-600)', marginBottom: '4px'
          }}>Notes (optional)</label>
          <textarea
            value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3} placeholder="Brief summary of the contact…"
            style={{ ...selectStyle, minHeight: '80px', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={saving} style={{
            padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 600, color: 'var(--slate-700)', backgroundColor: 'transparent',
            border: '2px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
            cursor: saving ? 'not-allowed' : 'pointer', minHeight: '44px', opacity: saving ? 0.5 : 1
          }}>Cancel</button>
          <button ref={submitRef} type="button" onClick={handleSubmit} disabled={saving} style={{
            padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'white',
            backgroundColor: saving ? 'var(--slate-400)' : 'var(--terra-600)',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: saving ? 'not-allowed' : 'pointer', minHeight: '44px'
          }}>
            {saving ? 'Saving…' : 'Log Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}