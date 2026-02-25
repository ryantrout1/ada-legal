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
      style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--slate-300)' }}
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
            style={{
              padding: '8px 16px',
              minHeight: '44px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: active ? 'var(--slate-900)' : 'var(--slate-100)',
              color: active ? 'white' : 'var(--slate-600)',
              transition: 'background-color 0.15s, color 0.15s',
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