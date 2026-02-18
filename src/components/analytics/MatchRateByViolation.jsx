import React from 'react';

const LABELS = {
  physical_space: 'Physical Space',
  digital_website: 'Digital / Website'
};

export default function MatchRateByViolation({ cases, filters, onFilterChange }) {
  const activeType = filters.violationType;
  const matchedStatuses = ['assigned', 'in_progress', 'closed'];

  const typeMap = {};
  cases.forEach(c => {
    const vt = c.violation_type;
    if (!vt) return;
    if (!typeMap[vt]) typeMap[vt] = { matched: 0, expired: 0, available: 0 };
    if (matchedStatuses.includes(c.status)) typeMap[vt].matched++;
    else if (c.status === 'expired') typeMap[vt].expired++;
    else if (c.status === 'available') typeMap[vt].available++;
  });

  const data = Object.entries(typeMap)
    .map(([type, counts]) => ({
      type,
      label: LABELS[type] || type,
      ...counts,
      total: counts.matched + counts.expired + counts.available
    }))
    .filter(d => d.total > 0);

  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map(d => d.total));

  const handleClick = (type) => {
    onFilterChange('violationType', type === activeType ? null : type);
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem', marginBottom: '0.75rem'
    }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
        color: 'var(--slate-800)', marginBottom: '0.5rem', marginTop: 0
      }}>Match Rate by Violation Type</p>
      {data.map(d => {
        const isActive = d.type === activeType;
        const faded = activeType && !isActive;
        const matchRate = d.total > 0 ? Math.round((d.matched / d.total) * 100) : 0;
        return (
          <div
            key={d.type}
            onClick={() => handleClick(d.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem',
              cursor: 'pointer', opacity: faded ? 0.45 : 1,
              borderLeft: isActive ? '3px solid var(--terra-600)' : '3px solid transparent',
              paddingLeft: '0.25rem', transition: 'opacity 0.15s'
            }}
          >
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-700)',
              minWidth: '110px', textAlign: 'right', flexShrink: 0
            }}>{d.label}</span>
            <div style={{ flex: 1, height: '16px', display: 'flex', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
              {d.matched > 0 && (
                <div style={{ width: `${(d.matched / maxTotal) * 100}%`, backgroundColor: '#15803D', height: '100%' }} />
              )}
              {d.expired > 0 && (
                <div style={{ width: `${(d.expired / maxTotal) * 100}%`, backgroundColor: '#B91C1C', height: '100%' }} />
              )}
              {d.available > 0 && (
                <div style={{ width: `${(d.available / maxTotal) * 100}%`, backgroundColor: '#CBD5E1', height: '100%' }} />
              )}
            </div>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--slate-800)', minWidth: '70px', flexShrink: 0
            }}>
              {d.total} <span style={{ fontWeight: 400, color: 'var(--slate-500)' }}>({matchRate}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}