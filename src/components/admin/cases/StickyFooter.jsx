import React from 'react';

export default function StickyFooter({ viewingCount, totalCount, cases }) {
  const submitted = cases.filter(c => c.status === 'submitted').length;
  const available = cases.filter(c => c.status === 'available').length;
  const withLawyers = cases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const closed = cases.filter(c => c.status === 'closed').length;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      backgroundColor: 'var(--heading)', color: 'var(--body-secondary)',
      padding: '8px 24px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
      display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap',
      minHeight: '36px', alignItems: 'center',
    }}>
      <span>Viewing <strong style={{ color: 'var(--card-bg)' }}>{viewingCount}</strong> of <strong style={{ color: 'var(--card-bg)' }}>{totalCount}</strong> cases</span>
      <span style={{ color: 'var(--body-secondary)' }}>·</span>
      <span><strong>{submitted}</strong> submitted</span>
      <span style={{ color: 'var(--body-secondary)' }}>·</span>
      <span><strong>{available}</strong> available</span>
      <span style={{ color: 'var(--body-secondary)' }}>·</span>
      <span><strong>{withLawyers}</strong> with lawyers</span>
      <span style={{ color: 'var(--body-secondary)' }}>·</span>
      <span><strong>{closed}</strong> closed</span>
    </div>
  );
}