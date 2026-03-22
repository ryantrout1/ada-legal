import React from 'react';

export default function AdminFilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="admin-filter-pill"
      style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
        fontWeight: active ? 700 : 500,
        padding: '8px 20px', minHeight: '44px', borderRadius: '20px',
        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        border: active ? 'none' : '1px solid var(--card-border)',
        backgroundColor: active ? 'var(--accent)' : 'var(--card-bg)',
        color: active ? '#fff' : 'var(--body)',
      }}
    >
      {label}
      <style>{`
        .admin-filter-pill:hover:not([aria-pressed="true"]) {
          background-color: var(--card-bg-tinted) !important;
          border-color: var(--accent) !important;
        }
        .admin-filter-pill:focus-visible {
          outline: 3px solid var(--accent-light) !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </button>
  );
}