import React from 'react';

export default function EngagementDateFilter({ dateRange, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body)' }}>
        Date Range:
      </label>
      <input
        type="date"
        value={dateRange.from}
        onChange={(e) => onChange({ ...dateRange, from: e.target.value })}
        style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          padding: '6px 10px', border: '1px solid var(--border)',
          borderRadius: '6px', minHeight: '36px'
        }}
      />
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>to</span>
      <input
        type="date"
        value={dateRange.to}
        onChange={(e) => onChange({ ...dateRange, to: e.target.value })}
        style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          padding: '6px 10px', border: '1px solid var(--border)',
          borderRadius: '6px', minHeight: '36px'
        }}
      />
      {(dateRange.from || dateRange.to) && (
        <button
          onClick={() => onChange({ from: '', to: '' })}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
            fontWeight: 600, color: 'var(--section-label)', padding: '4px 8px'
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}