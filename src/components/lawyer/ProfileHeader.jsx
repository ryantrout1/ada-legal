import React from 'react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const accountColors = {
  pending_approval: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DCFCE7', text: '#15803D' },
  suspended: { bg: '#FEE2E2', text: '#B91C1C' },
  removed: { bg: 'var(--page-bg-subtle)', text: 'var(--body-secondary)' }
};
const subColors = {
  inactive: { bg: 'var(--page-bg-subtle)', text: 'var(--body-secondary)' },
  active: { bg: '#DCFCE7', text: '#15803D' },
  canceled: { bg: '#FEE2E2', text: '#B91C1C' },
  past_due: { bg: '#FEF3C7', text: '#92400E' }
};

export default function ProfileHeader({ profile }) {
  const p = profile;
  const ac = accountColors[p.account_status] || accountColors.pending_approval;
  const sc = subColors[p.subscription_status] || subColors.inactive;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
          {p.full_name}
        </h1>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--body)', margin: '4px 0 0' }}>
          {p.firm_name}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: ac.text, backgroundColor: ac.bg, textTransform: 'uppercase'
          }}>{(p.account_status || '').replace(/_/g, ' ')}</span>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: sc.text, backgroundColor: sc.bg, textTransform: 'uppercase'
          }}>{(p.subscription_status || 'inactive').replace(/_/g, ' ')}</span>
        </div>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--body-secondary)' }}>
          Member since {formatDate(p.date_joined || p.approved_at || p.created_date)}
        </span>
      </div>
    </div>
  );
}