import React from 'react';

const accountColors = {
  pending_approval: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DCFCE7', text: '#15803D' },
  suspended: { bg: '#FEE2E2', text: '#B91C1C' },
  removed: { bg: '#F1F5F9', text: '#475569' }
};

const subColors = {
  inactive: { bg: '#F1F5F9', text: '#475569' },
  active: { bg: '#DCFCE7', text: '#15803D' },
  canceled: { bg: '#FEE2E2', text: '#B91C1C' },
  past_due: { bg: '#FEF3C7', text: '#92400E' }
};

export { accountColors, subColors };

export default function LawyerBadge({ label, colorMap }) {
  const c = (colorMap || {})[label] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.625rem',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
      color: c.text, backgroundColor: c.bg, borderRadius: '9999px',
      textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap'
    }}>
      {(label || '').replace(/_/g, ' ')}
    </span>
  );
}