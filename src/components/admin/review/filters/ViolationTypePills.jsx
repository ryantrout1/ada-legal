import React from 'react';

const OPTIONS = [
  { value: 'physical_space', label: '🏢 Physical' },
  { value: 'digital_website', label: '🌐 Digital' },
];

export default function ViolationTypePills({ selected, onToggle }) {
  return (
    <div>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
        Violation Type
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} role="group" aria-label="Violation type filter">
        {OPTIONS.map(o => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              role="checkbox"
              aria-checked={active}
              aria-label={`${o.value === 'physical_space' ? 'Physical space' : 'Digital website'} violation type`}
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
                border: active ? '2px solid #9A3412' : '1px solid var(--slate-200)',
                backgroundColor: active ? '#FEF1EC' : 'var(--slate-100, #F1F5F9)',
                color: active ? '#9A3412' : 'var(--slate-600)',
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