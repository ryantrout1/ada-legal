import React, { useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
  border: '2px solid var(--border)', borderRadius: 'var(--radius-md)',
  color: 'var(--heading)', outline: 'none', boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
  color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px'
};

export default function ProfileEditForm({ profile, onSave, onCancel }) {
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    firm_name: profile.firm_name || '',
    phone: profile.phone || '',
    states_of_practice: profile.states_of_practice || [],
    bar_numbers: profile.bar_numbers || ''
  });
  const [saving, setSaving] = useState(false);
  const [statesOpen, setStatesOpen] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const toggleState = (st) => {
    const arr = form.states_of_practice;
    setForm(prev => ({
      ...prev,
      states_of_practice: arr.includes(st) ? arr.filter(s => s !== st) : [...arr, st]
    }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      <div>
        <label style={labelStyle}>Full Name</label>
        <input style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
      </div>
      <div>
        <label style={labelStyle}>Firm Name</label>
        <input style={inputStyle} value={form.firm_name} onChange={e => setForm(p => ({ ...p, firm_name: e.target.value }))} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input style={{ ...inputStyle, backgroundColor: 'var(--page-bg-subtle)', color: 'var(--body-secondary)' }} value={profile.email} disabled />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--body-secondary)' }}>Cannot be changed</span>
      </div>
      <div>
        <label style={labelStyle}>Phone</label>
        <input style={inputStyle} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      </div>
      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>States of Practice</label>
        <div onClick={() => setStatesOpen(!statesOpen)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatesOpen(!statesOpen); }}} role="button" tabIndex="0" style={{
          ...inputStyle, cursor: 'pointer', minHeight: '38px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center'
        }}>
          {form.states_of_practice.length === 0 && <span style={{ color: 'var(--body-secondary)' }}>Select...</span>}
          {form.states_of_practice.map(s => (
            <span key={s} style={{
              display: 'inline-flex', alignItems: 'center', gap: '2px',
              padding: '1px 6px', fontSize: '0.75rem', fontWeight: 600,
              backgroundColor: 'var(--card-bg-tinted)', color: 'var(--section-label)', borderRadius: '4px'
            }}>
              {s}
              <X size={10} onClick={e => { e.stopPropagation(); toggleState(s); }} style={{ cursor: 'pointer' }} />
            </span>
          ))}
        </div>
        {statesOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
            maxHeight: '200px', overflow: 'auto', backgroundColor: 'white',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {US_STATES.map(st => (
              <label key={st} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.375rem 0.75rem', cursor: 'pointer', fontSize: '0.8125rem',
                fontFamily: 'Manrope, sans-serif',
                backgroundColor: form.states_of_practice.includes(st) ? 'var(--card-bg-tinted)' : 'white'
              }}>
                <input type="checkbox" checked={form.states_of_practice.includes(st)} onChange={() => toggleState(st)} />
                {st}
              </label>
            ))}
          </div>
        )}
      </div>
      <div>
        <label style={labelStyle}>Bar Numbers</label>
        <input style={inputStyle} value={form.bar_numbers} onChange={e => setForm(p => ({ ...p, bar_numbers: e.target.value }))} />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '0.5rem' }}>
        <button type="button" onClick={handleSave} disabled={saving} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          fontWeight: 700, color: 'white', backgroundColor: saving ? 'var(--body-secondary)' : 'var(--section-label)',
          border: 'none', borderRadius: 'var(--radius-md)', cursor: saving ? 'not-allowed' : 'pointer',
          minHeight: '44px'
        }}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          color: 'var(--body-secondary)', padding: '0.5rem'
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}