import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, Users, MoreHorizontal } from 'lucide-react';

const CONTACT_TYPES = [
  { value: 'initial_contact', label: 'Initial Contact' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'case_update', label: 'Case Update' }
];

const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'in_person', label: 'In-Person', icon: '🤝' },
  { value: 'other', label: 'Other', icon: '💬' }
];

export default function LogContactModal({ open, onCancel, onSubmit, saving, businessName }) {
  const [form, setForm] = useState({ contact_type: '', contact_method: '', notes: '' });
  const [errors, setErrors] = useState({});
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm({ contact_type: '', contact_method: '', notes: '' });
    setErrors({});
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape' && !saving) onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [open, onCancel, saving]);

  if (!open) return null;

  const handleSubmit = () => {
    const e = {};
    if (!form.contact_type) e.contact_type = true;
    if (!form.contact_method) e.contact_method = true;
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit(form);
  };

  const radioBtn = (group, value, label, extra) => {
    const active = form[group] === value;
    return (
      <label key={value} style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
        border: active ? '2px solid var(--terra-600)' : `2px solid ${errors[group] ? '#FECACA' : 'var(--slate-200)'}`,
        backgroundColor: active ? 'var(--terra-50, #FFF7ED)' : 'white',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: active ? 700 : 500,
        color: active ? 'var(--terra-600)' : 'var(--slate-700)',
        transition: 'all 0.1s', minHeight: '44px'
      }}>
        <input type="radio" name={group} checked={active}
          onChange={() => setForm(p => ({ ...p, [group]: value }))}
          style={{ display: 'none' }}
        />
        {extra && <span>{extra}</span>}
        {label}
      </label>
    );
  };

  return (
    <div
      ref={overlayRef}
      role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === overlayRef.current && !saving) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(30,41,59,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: '16px', overflow: 'hidden',
        maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{ backgroundColor: 'var(--slate-900)', padding: '16px 24px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: 0 }}>
            Log Contact{businessName ? ` — ${businessName}` : ''}
          </h2>
        </div>

        {/* Form */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Contact Type */}
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 8px' }}>
              Contact Type {errors.contact_type && <span style={{ color: '#B91C1C', fontSize: '0.75rem' }}>— Required</span>}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CONTACT_TYPES.map(t => radioBtn('contact_type', t.value, t.label))}
            </div>
          </div>

          {/* Contact Method */}
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 8px' }}>
              Contact Method {errors.contact_method && <span style={{ color: '#B91C1C', fontSize: '0.75rem' }}>— Required</span>}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CONTACT_METHODS.map(m => radioBtn('contact_method', m.value, m.label, m.icon))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 8px' }}>
              Notes
            </p>
            <textarea
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="What was discussed? Any next steps?"
              style={{
                width: '100%', padding: '12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--slate-800)', border: '2px solid var(--slate-200)', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px',
                backgroundColor: 'var(--surface)'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          <button type="button" onClick={onCancel} disabled={saving} style={{
            background: 'none', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
            color: 'var(--slate-500)', padding: '8px'
          }}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving} style={{
            padding: '0 24px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'white',
            backgroundColor: saving ? 'var(--slate-400)' : 'var(--terra-600)',
            border: 'none', borderRadius: '10px',
            cursor: saving ? 'not-allowed' : 'pointer', minHeight: '44px',
            transition: 'background-color 0.15s'
          }}>
            {saving ? 'Saving…' : 'Save Contact Log'}
          </button>
        </div>
      </div>
    </div>
  );
}