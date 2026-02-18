import React, { useState } from 'react';
import { Pencil, Save, X, Star, Flag } from 'lucide-react';
import LawyerBadge, { accountColors, subColors } from './LawyerBadge';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
  border: '1px solid var(--slate-300)', borderRadius: '6px',
  color: '#334155', backgroundColor: 'white', outline: 'none',
  boxSizing: 'border-box'
};

const LABEL = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
  color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em',
  margin: '0 0 2px'
};

const VAL = {
  margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#334155'
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StarRating({ value, onChange, readOnly }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }} role="img" aria-label={`Rating: ${value || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={18}
          fill={n <= (value || 0) ? '#F59E0B' : 'none'}
          stroke={n <= (value || 0) ? '#F59E0B' : '#475569'}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
          onClick={() => { if (!readOnly) onChange(n === value ? null : n); }}
        />
      ))}
    </div>
  );
}

function StatesMultiSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value || [];
  const toggle = (st) => {
    onChange(selected.includes(st) ? selected.filter(s => s !== st) : [...selected, st]);
  };
  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ ...inputStyle, cursor: 'pointer', minHeight: '38px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}
      >
        {selected.length === 0 && <span style={{ color: '#94A3B8' }}>Select states…</span>}
        {selected.map(s => (
          <span key={s} style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            padding: '1px 6px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: '#FEF1EC', color: '#7C2D12', borderRadius: '4px'
          }}>
            {s}
            <X size={10} onClick={e => { e.stopPropagation(); toggle(s); }} style={{ cursor: 'pointer' }} />
          </span>
        ))}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
          maxHeight: '200px', overflow: 'auto', backgroundColor: 'white',
          border: '1px solid var(--slate-200)', borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {US_STATES.map(st => (
            <label key={st} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem',
              fontFamily: 'Manrope, sans-serif',
              backgroundColor: selected.includes(st) ? '#FFF7ED' : 'white'
            }}>
              <input type="checkbox" checked={selected.includes(st)} onChange={() => toggle(st)} />
              {st}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfileSection({ lawyer, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    setForm({
      full_name: lawyer.full_name || '', firm_name: lawyer.firm_name || '',
      email: lawyer.email || '', phone: lawyer.phone || '',
      states_of_practice: lawyer.states_of_practice || [],
      bar_numbers: lawyer.bar_numbers || '',
      account_status: lawyer.account_status || 'pending_approval',
      admin_notes: lawyer.admin_notes || '',
      admin_rating: lawyer.admin_rating || null,
      flagged: !!lawyer.flagged, flag_reason: lawyer.flag_reason || ''
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const updates = { ...form };
    if (!updates.flagged) updates.flag_reason = '';
    if (updates.account_status === 'approved' && lawyer.account_status !== 'approved') {
      updates.approved_at = new Date().toISOString();
      if (!lawyer.date_joined) updates.date_joined = new Date().toISOString();
    }
    await onSave(lawyer.id, updates);
    setEditing(false);
  };

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // -- READ-ONLY VIEW --
  if (!editing) {
    return (
      <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderBottom: '1px solid var(--slate-200)'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
            Profile Details
          </p>
          <button type="button" onClick={startEdit} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 600, color: '#334155', backgroundColor: 'white',
            border: '1px solid var(--slate-200)', borderRadius: '6px', cursor: 'pointer',
            minHeight: '36px'
          }}>
            <Pencil size={14} /> Edit
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          {/* Row 1: 4 cols */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div><p style={LABEL}>Full Name</p><p style={{ ...VAL, fontWeight: 700, color: 'var(--slate-900)' }}>{lawyer.full_name}</p></div>
            <div><p style={LABEL}>Firm Name</p><p style={VAL}>{lawyer.firm_name}</p></div>
            <div><p style={LABEL}>Email</p><p style={VAL}>{lawyer.email}</p></div>
            <div><p style={LABEL}>Phone</p><p style={VAL}>{lawyer.phone || '—'}</p></div>
          </div>

          {/* Row 2: States, Bar, Status badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <p style={LABEL}>States of Practice</p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {(lawyer.states_of_practice || []).length > 0 ? (lawyer.states_of_practice || []).map(s => (
                  <span key={s} style={{
                    display: 'inline-block', padding: '2px 6px', borderRadius: '4px',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                    color: '#7C2D12', backgroundColor: '#FEF1EC'
                  }}>{s}</span>
                )) : <p style={VAL}>—</p>}
              </div>
            </div>
            <div><p style={LABEL}>Bar Numbers</p><p style={VAL}>{lawyer.bar_numbers || '—'}</p></div>
            <div>
              <p style={LABEL}>Account Status</p>
              <LawyerBadge label={lawyer.account_status} colorMap={accountColors} />
            </div>
            <div>
              <p style={LABEL}>Subscription</p>
              <LawyerBadge label={lawyer.subscription_status} colorMap={subColors} />
            </div>
          </div>

          {/* Row 3: Date, Rating, Flagged, Marketplace */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div><p style={LABEL}>Date Joined</p><p style={VAL}>{formatDate(lawyer.date_joined)}</p></div>
            <div>
              <p style={LABEL}>Admin Rating</p>
              <StarRating value={lawyer.admin_rating} readOnly />
            </div>
            <div>
              <p style={LABEL}>Flagged</p>
              {lawyer.flagged ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flag size={14} style={{ color: '#B91C1C' }} />
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#B91C1C', fontWeight: 600 }}>
                    Yes — {lawyer.flag_reason || 'No reason given'}
                  </span>
                </div>
              ) : (
                <p style={VAL}>No</p>
              )}
            </div>
            <div>
              <p style={LABEL}>Marketplace Rules</p>
              <p style={{ ...VAL, color: lawyer.marketplace_rules_accepted ? '#15803D' : '#B91C1C', fontWeight: 600 }}>
                {lawyer.marketplace_rules_accepted ? '✓ Accepted' : '✗ Not Accepted'}
              </p>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <p style={LABEL}>Admin Notes</p>
            <p style={{
              ...VAL, fontSize: '0.875rem',
              color: lawyer.admin_notes ? '#334155' : '#475569',
              fontStyle: lawyer.admin_notes ? 'normal' : 'italic'
            }}>
              {lawyer.admin_notes || 'No notes'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -- EDITING VIEW --
  return (
    <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid var(--slate-200)'
      }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
        Profile Details — Editing
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setEditing(false)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 600, color: '#475569', backgroundColor: 'white',
            border: '1px solid var(--slate-200)', borderRadius: '6px', cursor: 'pointer', minHeight: '36px'
          }}>
            <X size={14} /> Cancel
          </button>
          <button type="button" onClick={handleSave} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 700, color: 'white', backgroundColor: '#15803D',
            border: 'none', borderRadius: '6px', cursor: 'pointer', minHeight: '36px'
          }}>
            <Save size={14} /> Save
          </button>
        </div>
      </div>
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <EditField label="Full Name" value={form.full_name} onChange={v => updateForm('full_name', v)} />
        <EditField label="Firm Name" value={form.firm_name} onChange={v => updateForm('firm_name', v)} />
        <EditField label="Email" value={form.email} onChange={v => updateForm('email', v)} />
        <EditField label="Phone" value={form.phone} onChange={v => updateForm('phone', v)} />
        <div>
          <p style={LABEL}>States of Practice</p>
          <StatesMultiSelect value={form.states_of_practice} onChange={v => updateForm('states_of_practice', v)} />
        </div>
        <EditField label="Bar Numbers" value={form.bar_numbers} onChange={v => updateForm('bar_numbers', v)} />
        <div>
          <p style={LABEL}>Account Status</p>
          <select value={form.account_status} onChange={e => updateForm('account_status', e.target.value)} style={inputStyle} aria-label="Account status">
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="removed">Removed</option>
          </select>
        </div>
        <div>
          <p style={LABEL}>Subscription</p>
          <LawyerBadge label={lawyer.subscription_status} colorMap={subColors} />
          <p style={{ margin: '4px 0 0', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: '#475569' }}>
            Controlled by Stripe (read-only)
          </p>
        </div>
        <div>
          <p style={LABEL}>Admin Rating</p>
          <StarRating value={form.admin_rating} onChange={v => updateForm('admin_rating', v)} />
        </div>
        <div>
          <p style={LABEL}>Flagged</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <div
              role="switch"
              aria-checked={form.flagged}
              tabIndex={0}
              onClick={() => updateForm('flagged', !form.flagged)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updateForm('flagged', !form.flagged); } }}
              style={{
                width: '36px', height: '20px', borderRadius: '10px',
                backgroundColor: form.flagged ? '#B91C1C' : '#94A3B8',
                position: 'relative', cursor: 'pointer', transition: 'background 0.15s'
              }}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white',
                position: 'absolute', top: '2px', left: form.flagged ? '18px' : '2px', transition: 'left 0.15s'
              }} />
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#334155' }}>
              {form.flagged ? 'Flagged' : 'Not Flagged'}
            </span>
          </label>
          {form.flagged && (
            <input type="text" value={form.flag_reason} onChange={e => updateForm('flag_reason', e.target.value)}
              placeholder="Reason for flagging (required)…" style={{ ...inputStyle, marginTop: '0.5rem' }} />
          )}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <p style={LABEL}>Admin Notes</p>
          <textarea value={form.admin_notes} onChange={e => updateForm('admin_notes', e.target.value)}
            placeholder="Internal notes about this lawyer…"
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange }) {
  return (
    <div>
      <p style={LABEL}>{label}</p>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}