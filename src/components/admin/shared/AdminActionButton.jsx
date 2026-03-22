import React from 'react';

export default function AdminActionButton({ icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="admin-action-btn"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', minHeight: '44px',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', fontWeight: 700,
        color: 'var(--card-bg)', backgroundColor: disabled ? 'var(--body-secondary)' : 'var(--accent)',
        border: 'none', borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {icon}{label}
    </button>
  );
}