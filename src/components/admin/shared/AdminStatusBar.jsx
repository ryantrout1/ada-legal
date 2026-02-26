import React from 'react';

/*
  Universal status bar for admin pages.
  cells: Array<{ key, label, value, bg?, color?, warn?, danger?, onClick?, ariaLabel?, active?, accentBorder? }>
  secondaryText: optional ReactNode or string for right-side compact stats
*/
export default function AdminStatusBar({ cells, secondaryText }) {
  return (
    <div className="admin-status-bar-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div
        className="admin-status-bar"
        style={{
          display: 'flex', flex: '1 1 auto', minWidth: 0,
          border: '1px solid var(--slate-200)', borderRadius: '8px',
          overflow: 'hidden', backgroundColor: 'white',
        }}
      >
        {cells.map((cell, i) => {
          const isZero = cell.value === 0 || cell.value === '0';
          const bgColor = cell.danger ? '#FEE2E2' : cell.warn ? '#FEF3C7' : cell.active ? (cell.bg || 'var(--slate-50)') : (isZero ? 'white' : (cell.bg || 'white'));
          const numColor = isZero ? 'var(--slate-300)' : (cell.danger ? '#B91C1C' : cell.warn ? '#92400E' : (cell.color || 'var(--slate-800)'));
          const labelColor = isZero ? 'var(--slate-400)' : 'var(--slate-500)';
          const Tag = cell.onClick ? 'button' : 'div';

          return (
            <Tag
              key={cell.key}
              role={cell.onClick ? 'button' : undefined}
              tabIndex={cell.onClick ? 0 : undefined}
              aria-label={cell.ariaLabel || `${cell.label}: ${cell.value}`}
              aria-pressed={cell.active || undefined}
              onClick={cell.onClick}
              className="admin-status-cell"
              style={{
                flex: '1 1 0', minWidth: 0, minHeight: '44px',
                padding: '8px 4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: cell.onClick ? 'pointer' : 'default',
                border: 'none', outline: 'none',
                borderLeft: i > 0 ? '1px solid var(--slate-200)' : 'none',
                borderBottom: cell.accentBorder ? `2px solid ${cell.accentBorder}` : cell.active ? '2px solid var(--slate-700)' : '2px solid transparent',
                backgroundColor: bgColor,
                transition: 'background-color 0.15s',
                ...(cell.pulse ? { animation: 'adminCellPulse 2s ease-in-out infinite' } : {}),
              }}
            >
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: numColor,
              }}>
                {cell.value}
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px',
                color: labelColor, whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', maxWidth: '100%',
              }}>
                {cell.label}
              </span>
            </Tag>
          );
        })}
      </div>

      {secondaryText && (
        <div className="admin-status-secondary" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)',
          whiteSpace: 'nowrap', flexShrink: 0, paddingLeft: '4px',
        }}>
          {secondaryText}
        </div>
      )}

      <style>{`
        @keyframes adminCellPulse { 0%,100%{opacity:1}50%{opacity:0.7} } @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        .admin-status-cell:hover { background-color: var(--slate-50) !important; }
        .admin-status-cell:focus-visible { outline: 3px solid #1D4ED8 !important; outline-offset: -2px !important; z-index: 1; }
        @media (max-width: 768px) {
          .admin-status-secondary { white-space: normal !important; flex-basis: 100% !important; }
          .admin-status-cell span:first-child { font-size: 1rem !important; }
          .admin-status-cell span:last-child { font-size: 0.6rem !important; }
        }
      `}</style>
    </div>
  );
}