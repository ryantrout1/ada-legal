import React from 'react';

export default function AdminSortDropdown({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Sort order"
      style={{
        minHeight: '44px', padding: '8px 12px',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
        border: '1px solid var(--slate-200)', borderRadius: '8px',
        backgroundColor: 'white', color: 'var(--slate-800)', cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}