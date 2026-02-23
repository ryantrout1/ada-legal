import React from 'react';

export default function SourceBadge({ source }) {
  if (!source) return null;

  const isPathway = source === 'pathway';

  return (
    <span
      title={isPathway ? 'Submitted via Rights Pathway → Report' : 'Submitted via Report Violation form'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '6px',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
        color: isPathway ? '#7C2D12' : '#1E3A5F',
        backgroundColor: isPathway ? '#FEF1EC' : '#DBEAFE',
        letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap'
      }}
    >
      {isPathway ? '↳ Pathway' : '⊕ Direct'}
    </span>
  );
}