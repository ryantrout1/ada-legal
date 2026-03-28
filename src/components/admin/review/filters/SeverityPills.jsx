import React from 'react';

const OPTIONS = [
  { value: 'high', label: '🔴 High', activeBg: '#FEE2E2', activeColor: '#B91C1C' },
  { value: 'medium', label: '🟡 Medium', activeBg: '#FEF3C7', activeColor: '#92400E' },
  { value: 'low', label: '🟢 Low', activeBg: '#DCFCE7', activeColor: '#15803D' },
];

export default function SeverityPills({ selected, onToggle }) {
  return (
    <div>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
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
                border: active ? '2px solid ' + o.activeColor : '1px solid var(--slate-200)',
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