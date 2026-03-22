import React from 'react';

export default function AdminStatusBar({ cells, secondaryText }) {
  return (
    <div className="admin-status-bar-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div
        className="admin-status-bar"
        role="region"
        aria-label="Status summary"
        style={{
          display: 'flex', flex: '1 1 auto', minWidth: 0,
          border: '1px solid var(--card-border)', borderRadius: '8px',
          overflow: 'hidden', backgroundColor: 'var(--card-bg)',
        }}
      >
        {cells.map((cell, i) => {
          const isZero = cell.value === 0 || cell.value === '0';
          const bgColor = cell.danger ? 'var(--err-bg)' : cell.warn ? 'var(--wrn-bg)' : cell.active ? (cell.bg || 'var(--card-bg-tinted)') : (isZero ? 'var(--card-bg)' : (cell.bg || 'var(--card-bg)'));
          const numColor = isZero ? 'var(--body-secondary)' : (cell.danger ? 'var(--err-fg)' : cell.warn ? 'var(--wrn-fg)' : (cell.color || 'var(--heading)'));
          const Tag = cell.onClick ? 'button' : 'div';

          return (
            <Tag
              key={cell.key}
              type={cell.onClick ? 'button' : undefined}
              aria-label={cell.ariaLabel || `${cell.label}: ${cell.value}`}
              aria-pressed={cell.active || undefined}
              onClick={cell.onClick}
              className="admin-status-cell"
              style={{
                flex: '1 1 0', minWidth: 0, minHeight: '52px',
                padding: '8px 4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: cell.onClick ? 'pointer' : 'default',
                border: 'none', outline: 'none',
                borderLeft: i > 0 ? '1px solid var(--card-border)' : 'none',
                borderBottom: cell.accentBorder ? `2px solid ${cell.accentBorder}` : cell.active ? '2px solid var(--accent)' : '2px solid transparent',
                backgroundColor: bgColor,
                transition: 'background-color 0.15s',
                fontFamily: 'inherit',
                ...(cell.pulse ? { animation: 'adminCellPulse 2s ease-in-out infinite' } : {}),
              }}
            >
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: numColor }}>
                {cell.value}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px', color: 'var(--body-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {cell.label}
              </span>
            </Tag>
          );
        })}
      </div>

      {secondaryText && (
        <div className="admin-status-secondary" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)', whiteSpace: 'nowrap', flexShrink: 0, paddingLeft: '4px' }}>
          {secondaryText}
        </div>
      )}

      <style>{`
        @keyframes adminCellPulse { 0%,100%{opacity:1}50%{opacity:0.7} }
        @media (prefers-reduced-motion: reduce) { .admin-status-cell { animation: none !important; transition: none !important; } }
        .admin-status-cell:hover { background-color: var(--card-bg-tinted) !important; }
        .admin-status-cell:focus-visible { outline: 3px solid var(--accent-light) !important; outline-offset: -2px !important; z-index: 1; }
        @media (max-width: 768px) {
          .admin-status-secondary { white-space: normal !important; flex-basis: 100% !important; }
          .admin-status-cell span:first-child { font-size: 1rem !important; }
          .admin-status-cell span:last-child { font-size: 0.6rem !important; }
        }
      `}</style>
    </div>
  );
}
