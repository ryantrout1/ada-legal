import React from 'react';

export default function StatCard({ label, count, bgColor, textColor, borderColor, icon: Icon }) {
  return (
    <div style={{
      backgroundColor: bgColor || 'var(--surface)',
      border: `1px solid ${borderColor || bgColor || 'var(--slate-200)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      flex: '1 1 200px',
      minWidth: '180px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-sm)'
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: textColor || 'var(--slate-700)',
          margin: 0
        }}>
          {label}
        </p>
        {Icon && <Icon size={20} style={{ color: textColor || 'var(--slate-500)', opacity: 0.7 }} />}
      </div>
      <p style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '2rem',
        fontWeight: 700,
        color: textColor || 'var(--slate-900)',
        margin: 0,
        lineHeight: 1.2
      }}>
        {count ?? '—'}
      </p>
    </div>
  );
}