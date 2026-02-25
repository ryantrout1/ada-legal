import React from 'react';

export default function AdminFilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
        fontWeight: active ? 700 : 500,
        padding: '6px 14px', minHeight: '44px', borderRadius: '20px',
        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        border: active ? 'none' : '1px solid var(--slate-200)',
        backgroundColor: active ? '#C2410C' : 'white',
        color: active ? 'white' : 'var(--slate-800)',
      }}
    >
      {label}
    </button>
  );
}