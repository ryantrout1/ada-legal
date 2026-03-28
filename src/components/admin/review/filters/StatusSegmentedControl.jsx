import React from 'react';

const SEGMENTS = [
  { value: 'submitted', label: 'New (Submitted)' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'all_pending', label: 'All Pending' },
];

export default function StatusSegmentedControl({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Case status filter"
      style={{
        display: 'inline-flex',
        backgroundColor: 'var(--slate-100, #F1F5F9)',
        borderRadius: '12px',
        padding: '4px',
        gap: '4px',
        flexWrap: 'wrap',
      }}
    >
      {SEGMENTS.map(seg => {
        const active = value === seg.value;
        return (
          <button
            key={seg.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(seg.value)}
            style={{
              minHeight: '44px',
              padding: '0 20px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              fontWeight: active ? 700 : 500,
              color: active ? 'white' : 'var(--slate-600)',
              backgroundColor: active ? 'var(--slate-800)' : 'transparent',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}