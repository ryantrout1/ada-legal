import React, { useState } from 'react';
import { Pencil, Save, X, Star } from 'lucide-react';
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
  border: '1px solid var(--slate-300)', borderRadius: 'var(--radius-sm)',
  color: 'var(--slate-800)', backgroundColor: 'white', outline: 'none'
};

const labelStyle = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
  color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em',
  margin: '0 0 4px 0'
};

function StarRating({ value, onChange, readOnly }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={20}
          fill={n <= (value || 0) ? '#F59E0B' : 'none'}
          stroke={n <= (value || 0) ? '#F59E0B' : 'var(--slate-300)'}
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
    if (selected.includes(st)) {
      onChange(selected.filter(s => s !== st));
    } else {
      onChange([...selected, st]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle, cursor: 'pointer', minHeight: '38px',
          display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center'
        }}
      >
        {selected.length === 0 && <span style={{ color: 'var(--slate-400)' }}>Select states...</span>}
        {selected.map(s => (
          <span key={s} style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            padding: '1px 6px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: 'var(--terra-100)', color: 'var(--terra-600)',
            borderRadius: '4px'
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
          border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {US_STATES.map(st => (
            <label key={st} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem',
              fontFamily: 'Manrope, sans-serif',
              backgroundColor: selected.includes(st) ? 'var(--terra-50)' : 'white'
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
      full_name: lawyer.full_name || '',
      firm_name: lawyer.firm_name || '',
      email: lawyer.email || '',
      phone: lawyer.phone || '',
      states_of_practice: lawyer.states_of_practice || [],
      bar_numbers: lawyer.bar_numbers || '',
      account_status: lawyer.account_status || 'pending_approval',
      admin_notes: lawyer.admin_notes || '',
      admin_rating: lawyer.admin_rating || null,
      flagged: !!lawyer.flagged,
      flag_reason: lawyer.flag_reason || ''
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const updates = { ...form };
    if (!updates.flagged) {
      updates.flag_reason = '';
    }
    // If status changed to approved and wasn't before, set date_joined
    if (updates.account_status === 'approved' && lawyer.account_status !== 'approved') {
      updates.approved_at = new Date().toISOString();
      if (!lawyer.date_joined) {
        updates.date_joined = new Date().toISOString();
      }
    }
    await onSave(lawyer.id, updates);
    setEditing(false);
  };

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
            Profile Details
          </h3>
          <button type="button" onClick={startEdit} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 600, color: 'var(--terra-600)', backgroundColor: 'var(--terra-50)',
            border: '1px solid var(--terra-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer'
          }}>
            <Pencil size={14} /> Edit
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
          <ReadField label="Full Name" value={lawyer.full_name} />
          <ReadField label="Firm Name" value={lawyer.firm_name} />
          <ReadField label="Email" value={lawyer.email} />
          <ReadField label="Phone" value={lawyer.phone} />
          <ReadField label="States of Practice" value={(lawyer.states_of_practice || []).join(', ')} />
          <ReadField label="Bar Numbers" value={lawyer.bar_numbers} />
          <div>
            <p style={labelStyle}>Marketplace Rules</p>
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-800)' }}>
              {lawyer.marketplace_rules_accepted ? '✓ Accepted' : '✗ Not Accepted'}
            </p>
          </div>
          <div>
            <p style={labelStyle}>Account Status</p>
            <LawyerBadge label={lawyer.account_status} colorMap={accountColors} />
          </div>
          <div>
            <p style={labelStyle}>Subscription Status</p>
            <LawyerBadge label={lawyer.subscription_status} colorMap={subColors} />
          </div>
          <div>
            <p style={labelStyle}>Admin Notes</p>
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)', fontStyle: lawyer.admin_notes ? 'normal' : 'italic' }}>
              {lawyer.admin_notes || 'No notes'}
            </p>
          </div>
          <div>
            <p style={labelStyle}>Admin Rating</p>
            <StarRating value={lawyer.admin_rating} readOnly />
          </div>
          <ReadField label="Date Joined" value={formatDate(lawyer.date_joined)} />
          <div>
            <p style={labelStyle}>Flagged</p>
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: lawyer.flagged ? '#B91C1C' : 'var(--slate-800)' }}>
              {lawyer.flagged ? `⚑ Yes — ${lawyer.flag_reason || 'No reason given'}` : 'No'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
          Profile Details — Editing
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => setEditing(false)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 600, color: 'var(--slate-600)', backgroundColor: 'white',
            border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer'
          }}>
            <X size={14} /> Cancel
          </button>
          <button type="button" onClick={handleSave} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 700, color: 'white', backgroundColor: '#15803D',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer'
          }}>
            <Save size={14} /> Save
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
        <EditField label="Full Name" value={form.full_name} onChange={v => updateForm('full_name', v)} />
        <EditField label="Firm Name" value={form.firm_name} onChange={v => updateForm('firm_name', v)} />
        <EditField label="Email" value={form.email} onChange={v => updateForm('email', v)} />
        <EditField label="Phone" value={form.phone} onChange={v => updateForm('phone', v)} />
        <div>
          <p style={labelStyle}>States of Practice</p>
          <StatesMultiSelect value={form.states_of_practice} onChange={v => updateForm('states_of_practice', v)} />
        </div>
        <EditField label="Bar Numbers" value={form.bar_numbers} onChange={v => updateForm('bar_numbers', v)} />
        <div>
          <p style={labelStyle}>Marketplace Rules</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <input type="checkbox" checked={lawyer.marketplace_rules_accepted} disabled style={{ width: 18, height: 18 }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              {lawyer.marketplace_rules_accepted ? 'Accepted' : 'Not Accepted'} (read-only)
            </span>
          </div>
        </div>
        <div>
          <p style={labelStyle}>Account Status</p>
          <select
            value={form.account_status}
            onChange={e => updateForm('account_status', e.target.value)}
            style={inputStyle}
          >
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="removed">Removed</option>
          </select>
        </div>
        <div>
          <p style={labelStyle}>Subscription Status</p>
          <LawyerBadge label={lawyer.subscription_status} colorMap={subColors} />
          <p style={{ margin: '4px 0 0', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-400)' }}>
            Controlled by Stripe (read-only)
          </p>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <p style={labelStyle}>Admin Notes</p>
          <textarea
            value={form.admin_notes}
            onChange={e => updateForm('admin_notes', e.target.value)}
            placeholder="Internal notes about this lawyer..."
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
        </div>
        <div>
          <p style={labelStyle}>Admin Rating</p>
          <StarRating value={form.admin_rating} onChange={v => updateForm('admin_rating', v)} />
        </div>
        <ReadField label="Date Joined" value={formatDate(lawyer.date_joined)} />
        <div>
          <p style={labelStyle}>Flagged</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <div
              onClick={() => updateForm('flagged', !form.flagged)}
              style={{
                width: '36px', height: '20px', borderRadius: '10px',
                backgroundColor: form.flagged ? '#B91C1C' : 'var(--slate-300)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.15s'
              }}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white',
                position: 'absolute', top: '2px', left: form.flagged ? '18px' : '2px', transition: 'left 0.15s'
              }} />
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {form.flagged ? 'Flagged' : 'Not Flagged'}
            </span>
          </label>
          {form.flagged && (
            <input
              type="text"
              value={form.flag_reason}
              onChange={e => updateForm('flag_reason', e.target.value)}
              placeholder="Reason for flagging (required)..."
              style={{ ...inputStyle, marginTop: '0.5rem' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReadField({ label, value }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-800)' }}>
        {value || '—'}
      </p>
    </div>
  );
}

function EditField({ label, value, onChange }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}