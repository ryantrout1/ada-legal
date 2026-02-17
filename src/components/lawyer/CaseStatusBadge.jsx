import React from 'react';

const STATUS_CONFIG = {
  submitted:    { label: 'Submitted',    bg: '#E2E8F0', color: '#475569' },
  under_review: { label: 'Under Review', bg: '#FEF3C7', color: '#92400E' },
  approved:     { label: 'Approved',     bg: '#DBEAFE', color: '#1D4ED8' },
  rejected:     { label: 'Rejected',     bg: '#FEE2E2', color: '#B91C1C' },
  available:    { label: 'Available',    bg: '#DCFCE7', color: '#15803D' },
  assigned:     { label: 'Assigned',     bg: '#DBEAFE', color: '#1D4ED8' },
  in_progress:  { label: 'In Progress',  bg: '#FEF3C7', color: '#92400E' },
  closed:       { label: 'Closed',       bg: '#E2E8F0', color: '#475569' }
};

export default function CaseStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.75rem',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
      color: cfg.color, backgroundColor: cfg.bg, borderRadius: '9999px',
      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
    }}>
      {cfg.label}
    </span>
  );
}