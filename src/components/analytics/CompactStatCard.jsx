import React from 'react';

export default function CompactStatCard({ label, count, bgColor, textColor, borderColor, icon: Icon }) {
  return (
    <div
      role="group"
      aria-label={`${label}: ${count ?? '—'}`}
      style={{
        backgroundColor: bgColor || 'var(--surface)',
        border: `1px solid ${borderColor || bgColor || 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        flex: '1 1 11rem',
        minWidth: '10rem'
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2px'
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
          color: textColor || 'var(--body)', margin: 0
        }}>{label}</p>
        {Icon && <Icon size={16} aria-hidden="true" style={{ color: textColor || 'var(--body-secondary)', opacity: 0.7 }} />}
      </div>
      <p style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.7rem', fontWeight: 700,
        color: textColor || 'var(--heading)', margin: 0, lineHeight: 1.2
      }} aria-hidden="true">
        {count ?? '—'}
      </p>
    </div>
  );
}