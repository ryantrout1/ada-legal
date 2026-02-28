import React, { useState } from 'react';
import { Pencil, Lock, Save } from 'lucide-react';
import StateMultiSelect from './StateMultiSelect';

const labelStyle = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
  color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em',
  margin: '0 0 4px'
};
const valueStyle = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 600,
  color: 'var(--slate-900)', margin: 0
};
const inputStyle = {
  width: '100%', padding: '8px 12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
  color: 'var(--slate-800)', border: '2px solid var(--slate-200)', borderRadius: '8px',
  outline: 'none', boxSizing: 'border-box', minHeight: '44px'
};

export default function ProfileInfoCard({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({
      full_name: profile.full_name || '',
      firm_name: profile.firm_name || '',
      phone: profile.phone || '',
      states_of_practice: profile.states_of_practice || [],
      bar_numbers: profile.bar_numbers || ''
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setEditing(false);
  };

  const p = profile;

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '12px', padding: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: 0 }}>
          Attorney Information
        </h2>
        {!editing && (
          <button type="button" onClick={startEdit} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 14px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 600, color: 'var(--terra-600)', backgroundColor: 'var(--terra-50, #FFF7ED)',
            border: '1px solid var(--terra-200, #FED7AA)', borderRadius: '8px', cursor: 'pointer', minHeight: '38px'
          }}>
            <Pencil size={14} /> Edit Profile
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={labelStyle}>Full Name</p>
            <input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <p style={labelStyle}>Firm Name</p>
            <input style={inputStyle} value={form.firm_name} onChange={e => setForm(f => ({ ...f, firm_name: e.target.value }))} />
          </div>
          <div>
            <p style={labelStyle}>Email</p>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputStyle, backgroundColor: 'var(--slate-50)', color: 'var(--slate-500)', paddingRight: '36px' }} value={p.email} disabled />
              <Lock size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-500)' }} title="Email cannot be changed — contact support" />
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)', margin: '4px 0 0' }}>
              Email cannot be changed — contact support
            </p>
          </div>
          <div>
            <p style={labelStyle}>Phone</p>
            <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <p style={labelStyle}>States of Practice</p>
            <StateMultiSelect selected={form.states_of_practice} onChange={val => setForm(f => ({ ...f, states_of_practice: val }))} />
          </div>
          <div>
            <p style={labelStyle}>Bar Numbers</p>
            <input style={inputStyle} value={form.bar_numbers} onChange={e => setForm(f => ({ ...f, bar_numbers: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '8px' }}>
            <button type="button" onClick={handleSave} disabled={saving} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '0 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              fontWeight: 700, color: 'white',
              backgroundColor: saving ? 'var(--slate-500)' : 'var(--terra-600)',
              border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', minHeight: '44px'
            }}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
              color: 'var(--slate-500)', padding: '8px'
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
          <div>
            <p style={labelStyle}>Full Name</p>
            <p style={valueStyle}>{p.full_name}</p>
          </div>
          <div>
            <p style={labelStyle}>Firm Name</p>
            <p style={valueStyle}>{p.firm_name}</p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <p style={{ ...labelStyle, margin: 0 }}>Email</p>
              <Lock size={10} style={{ color: 'var(--slate-500)' }} />
            </div>
            <p style={{ ...valueStyle, marginTop: '4px' }}>{p.email}</p>
          </div>
          <div>
            <p style={labelStyle}>Phone</p>
            <p style={valueStyle}>{p.phone}</p>
          </div>
          <div>
            <p style={labelStyle}>States of Practice</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {(p.states_of_practice || []).map(s => (
                <span key={s} style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
                  color: 'var(--terra-600, #C2410C)', backgroundColor: 'var(--terra-100, #FEF1EC)'
                }}>{s}</span>
              ))}
              {(p.states_of_practice || []).length === 0 && <p style={valueStyle}>—</p>}
            </div>
          </div>
          <div>
            <p style={labelStyle}>Bar Numbers</p>
            <p style={valueStyle}>{p.bar_numbers || '—'}</p>
          </div>
        </div>
      )}
    </div>
  );
}