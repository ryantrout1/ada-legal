import React from 'react';

export default function ClickableStatCard({ label, count, bgColor, textColor, borderColor, icon: Icon, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      aria-label={`${label}: ${count ?? '—'}${onClick ? ', click to filter' : ''}`}
      type={onClick ? 'button' : undefined}
      style={{
        backgroundColor: bgColor || 'var(--card-bg)',
        border: `1px solid ${borderColor || bgColor || 'var(--card-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        flex: '1 1 10rem',
        minWidth: '9.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: textColor || 'var(--body-secondary)', margin: 0 }}>{label}</p>
        {Icon && <Icon size={16} aria-hidden="true" style={{ color: textColor || 'var(--body-secondary)', opacity: 0.7 }} />}
      </div>
      <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.7rem', fontWeight: 700, color: textColor || 'var(--heading)', margin: 0, lineHeight: 1.2 }} aria-hidden="true">
        {count ?? '—'}
      </p>
    </Tag>
  );
}
