import React from 'react';

const OPTIONS = [
  { value: 'high', label: '🔴 High', activeBg: 'var(--err-bg)', activeColor: 'var(--err-fg)' },
  { value: 'medium', label: '🟡 Medium', activeBg: 'var(--wrn-bg)', activeColor: 'var(--wrn-fg)' },
  { value: 'low', label: '🟢 Low', activeBg: 'var(--suc-bg)', activeColor: 'var(--suc-fg)' },
];

export default function SeverityPills({ selected, onToggle }) {
  return (
    <div>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
        AI Severity
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} role="group" aria-label="AI Severity filter">
        {OPTIONS.map(o => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              role="checkbox"
              aria-checked={active}
              aria-label={`${o.value} severity`}
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