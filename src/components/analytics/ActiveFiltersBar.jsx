import React from 'react';
import { X } from 'lucide-react';

const FILTER_LABELS = {
  state: 'State',
  city: 'City',
  violationType: 'Type',
  violationSubtype: 'Subtype',
  businessType: 'Business'
};

export default function ActiveFiltersBar({ filters, onRemove, onClearAll }) {
  const entries = Object.entries(filters).filter(([, v]) => v !== null);
  if (entries.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
      padding: '0.625rem 1rem',
      backgroundColor: 'var(--terra-100)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--terra-200)'
    }}>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
        color: 'var(--terra-600)', marginRight: '0.25rem'
      }}>Filtered by:</span>

      {entries.map(([key, value]) => (
        <button
          key={key}
          type="button"
          onClick={() => onRemove(key)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
            color: 'var(--terra-600)', backgroundColor: 'white',
            border: '1px solid var(--terra-200)', borderRadius: '9999px',
            cursor: 'pointer', transition: 'background-color 0.1s'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-50)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
        >
          {FILTER_LABELS[key]}: {value}
          <X size={12} />
        </button>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--terra-600)', marginLeft: 'auto', padding: '0.25rem 0.5rem',
          textDecoration: 'underline'
        }}
      >
        Clear All
      </button>
    </div>
  );
}