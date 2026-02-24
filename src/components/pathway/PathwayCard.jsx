import React from 'react';

export default function PathwayCard({ emoji, title, subtitle, isSelected, onClick }) {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        backgroundColor: isSelected ? '#FFF8F5' : 'var(--surface)',
        border: isSelected ? '2px solid #C2410C' : '1px solid var(--slate-200)',
        borderRadius: '16px',
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        boxShadow: isSelected
          ? '0 0 0 3px var(--terra-100)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minHeight: '64px'
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--slate-400)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--slate-200)'; }}
      onFocus={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.15)'; }}
      onBlur={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
    >
      <div aria-hidden="true" style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: isSelected ? 'var(--terra-100)' : 'var(--slate-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', flexShrink: 0, transition: 'background 0.2s'
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.05rem', fontWeight: 600,
          color: 'var(--slate-900)', margin: 0, lineHeight: 1.3
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
            color: '#475569', margin: '4px 0 0', lineHeight: 1.4
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {isSelected && (
        <span aria-hidden="true" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
          fontWeight: 600, color: 'var(--terra-600)', flexShrink: 0
        }}>
          ✓
        </span>
      )}
    </div>
  );
}