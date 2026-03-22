import React from 'react';

const MODES = [
  { key: 'list', label: '📋 List View' },
  { key: 'cluster', label: '🏢 Cluster View' },
];

export default function ViewModeToggle({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Queue view mode"
      style={{ display: 'flex', gap: '4px' }}
    >
      {MODES.map(m => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(m.key)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                onChange(value === 'list' ? 'cluster' : 'list');
              }
            }}
            className="admin-filter-pill"
            style={{
              padding: '8px 20px',
              minHeight: '44px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.85rem',
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              border: active ? 'none' : '1px solid var(--card-border)',
              borderRadius: '20px',
              backgroundColor: active ? 'var(--accent)' : 'var(--card-bg)',
              color: active ? 'white' : 'var(--body)',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}