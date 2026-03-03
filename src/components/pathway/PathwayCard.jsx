import React from 'react';

export default function PathwayCard({ emoji, title, subtitle, isSelected, onClick, index, totalOptions, onArrowNav }) {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected || index === 0 ? 0 : -1}
      onClick={onClick}
      className="pw-card"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          onArrowNav?.((index + 1) % totalOptions);
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          onArrowNav?.((index - 1 + totalOptions) % totalOptions);
        }
      }}
      style={{
        backgroundColor: isSelected ? 'var(--card-bg-tinted)' : 'var(--surface)',
        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isSelected
          ? '0 0 0 3px var(--card-bg-tinted)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minHeight: '64px'
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--body-secondary)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div aria-hidden="true" style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: isSelected ? 'var(--card-bg-tinted)' : 'var(--border-lighter)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', flexShrink: 0, transition: 'background 0.2s'
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.05rem', fontWeight: 600,
          color: 'var(--heading)', margin: 0, lineHeight: 1.5
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
            color: 'var(--body-secondary)', margin: '4px 0 0', lineHeight: 1.5
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {isSelected && (
        <span aria-hidden="true" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
          fontWeight: 600, color: 'var(--section-label)', flexShrink: 0
        }}>
          ✓
        </span>
      )}
    </div>
  );
}