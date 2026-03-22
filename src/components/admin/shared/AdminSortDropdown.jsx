import React from 'react';

export default function AdminSortDropdown({ value, onChange, options }) {
  const id = React.useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label htmlFor={id} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          minHeight: '44px', padding: '8px 16px', minWidth: '180px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
          border: '1px solid var(--card-border)', borderRadius: '8px',
          backgroundColor: 'var(--card-bg)', color: 'var(--body)', cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
