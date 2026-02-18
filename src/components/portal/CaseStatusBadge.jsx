import React from 'react';

const statusConfig = {
  submitted: { label: 'Submitted', bg: '#DBEAFE', color: '#1D4ED8' },
  under_review: { label: 'Under Review', bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Approved', bg: '#DCFCE7', color: '#15803D' },
  rejected: { label: 'Not Approved', bg: '#FEE2E2', color: '#B91C1C' },
  available: { label: 'Awaiting Attorney', bg: '#F3E8FF', color: '#7C3AED' },
  assigned: { label: 'Attorney Assigned', bg: '#DBEAFE', color: '#1D4ED8' },
  in_progress: { label: 'In Progress', bg: '#D1FAE5', color: '#065F46' },
  closed: { label: 'Closed', bg: '#E2E8F0', color: '#475569' },
  expired: { label: 'Expired', bg: '#64748B', color: '#FFFFFF' }
};

export default function CaseStatusBadge({ status, large }) {
  const config = statusConfig[status] || { label: status, bg: '#E2E8F0', color: '#475569' };

  return (
    <span
      role="status"
      aria-label={`Case status: ${config.label}`}
      style={{
        display: 'inline-block',
        padding: large ? '0.375rem 1rem' : '0.25rem 0.75rem',
        fontFamily: 'Manrope, sans-serif',
        fontSize: large ? '0.875rem' : '0.75rem',
        fontWeight: 700,
        color: config.color,
        backgroundColor: config.bg,
        borderRadius: '9999px',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap'
      }}
    >
      {config.label}
    </span>
  );
}