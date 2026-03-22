import React from 'react';

const accountColors = {
  pending_approval: { bg: '#FEF9C3', text: 'var(--wrn-fg)' },
  approved: { bg: 'var(--suc-bg)', text: 'var(--suc-fg)' },
  suspended: { bg: 'var(--err-bg)', text: 'var(--err-fg)' },
  removed: { bg: 'var(--card-bg-tinted)', text: 'var(--body-secondary)' }
};

const subColors = {
  inactive: { bg: '#F1EFEA', text: 'var(--heading)' },
  active: { bg: 'var(--suc-bg)', text: 'var(--suc-fg)' },
  canceled: { bg: 'var(--err-bg)', text: 'var(--err-fg)' },
  past_due: { bg: '#FEF9C3', text: 'var(--wrn-fg)' }
};

export { accountColors, subColors };

export default function LawyerBadge({ label, colorMap }) {
  const c = (colorMap || {})[label] || { bg: 'var(--card-bg-tinted)', text: 'var(--body-secondary)' };
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