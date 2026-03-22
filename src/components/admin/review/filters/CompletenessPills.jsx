import React from 'react';

const OPTIONS = [
  { value: 'ready', label: 'Ready (80+)', activeBg: 'var(--suc-bg)', activeColor: 'var(--suc-fg)' },
  { value: 'partial', label: 'Partial (50–79)', activeBg: 'var(--wrn-bg)', activeColor: 'var(--wrn-fg)' },
  { value: 'incomplete', label: 'Incomplete (<50)', activeBg: 'var(--err-bg)', activeColor: 'var(--err-fg)' },
];

export default function CompletenessPills({ selected, onToggle }) {
  return (
    <div>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
        Completeness
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} role="group" aria-label="Completeness filter">
        {OPTIONS.map(o => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              role="checkbox"
              aria-checked={active}
              aria-label={`${o.label} completeness`}
              onClick={() => onToggle(o.value)}
              style={{
                minHeight: '44px',
                minWidth: '80px',
                padding: '8px 18px',
                borderRadius: '20px',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: active ? '2px solid ' + o.activeColor : '1px solid var(--card-border)',
                backgroundColor: active ? o.activeBg : 'var(--slate-100, #F1F5F9)',
                color: active ? o.activeColor : 'var(--slate-600)',
                transition: 'all 0.15s',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}