import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Building2, Globe, ChevronRight } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACCENT_COLORS = {
  submitted: '#1D4ED8',
  under_review: '#1D4ED8',
  approved: '#15803D',
  available: '#15803D',
  assigned: '#C2410C',
  in_progress: '#C2410C',
  closed: '#94A3B8',
  rejected: '#B91C1C',
  expired: '#D97706'
};

const BADGE_CONFIG = {
  submitted: { label: 'Under Review', bg: '#DBEAFE', color: '#1D4ED8' },
  under_review: { label: 'Under Review', bg: '#DBEAFE', color: '#1D4ED8' },
  approved: { label: 'Awaiting Attorney', bg: '#DCFCE7', color: '#15803D' },
  available: { label: 'Awaiting Attorney', bg: '#DCFCE7', color: '#15803D' },
  assigned: { label: 'Attorney Assigned', bg: '#FEF1EC', color: '#C2410C' },
  in_progress: { label: 'Attorney Working Your Case', bg: '#DCFCE7', color: '#15803D' },
  closed: { label: 'Closed', bg: '#F1F5F9', color: '#475569' },
  rejected: { label: 'Not Approved', bg: '#FEE2E2', color: '#B91C1C' },
  expired: { label: 'Expired', bg: '#FEF3C7', color: '#92400E' }
};

const CONTEXT_LINES = {
  submitted: { text: 'Our team is reviewing your report — usually within 24 hours.', color: '#1D4ED8' },
  under_review: { text: 'Our team is reviewing your report — usually within 24 hours.', color: '#1D4ED8' },
  approved: { text: 'Approved and visible to attorneys in your area.', color: '#15803D' },
  available: { text: 'Approved and visible to attorneys in your area.', color: '#15803D' },
  assigned: { text: 'An attorney has your case and should contact you soon.', color: '#C2410C' },
  in_progress: { text: 'Your attorney is actively working on your case.', color: '#15803D' },
  closed: null,
  rejected: { text: 'This report did not meet the criteria for our platform.', color: '#B91C1C' },
  expired: { text: 'No attorney was matched within 90 days.', color: '#D97706' }
};

const RESOLUTION_LABELS = {
  engaged: 'An attorney is representing you.',
  referred_out: 'Your case was referred to a specialist.',
  not_viable: 'Case closed — not viable.',
  claimant_unresponsive: 'Case closed — unable to reach you.',
  claimant_declined: 'Case closed — you declined to proceed.',
  admin_closed: 'Case closed by administrator.'
};

export default function MyCaseCard({ caseData }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const accent = ACCENT_COLORS[c.status] || '#94A3B8';
  const badge = BADGE_CONFIG[c.status] || BADGE_CONFIG.submitted;
  const context = CONTEXT_LINES[c.status];
  const pill = isPhysical ? c.violation_subtype : c.url_domain;

  const closedContext = c.status === 'closed'
    ? (RESOLUTION_LABELS[c.resolution_type] || 'This case has been closed.')
    : null;

  return (
    <Link
      to={createPageUrl('CaseDetail') + `?id=${c.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '12px', overflow: 'hidden',
          display: 'flex', cursor: 'pointer',
          transition: 'box-shadow 0.15s, transform 0.15s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Accent bar */}
        <div style={{ width: '4px', flexShrink: 0, backgroundColor: accent }} />

        <div style={{ flex: 1, padding: '16px 20px', minWidth: 0 }}>
          {/* Row 1: icon + name + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            {isPhysical
              ? <Building2 size={18} aria-hidden="true" style={{ color: '#C2410C', flexShrink: 0 }} />
              : <Globe size={18} aria-hidden="true" style={{ color: '#1D4ED8', flexShrink: 0 }} />
            }
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.05rem', fontWeight: 600,
              color: 'var(--slate-900)', margin: 0, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {c.business_name}
            </p>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: '8px', flexShrink: 0,
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
              color: badge.color, backgroundColor: badge.bg, textTransform: 'uppercase',
              letterSpacing: '0.03em', whiteSpace: 'nowrap'
            }}>{badge.label}</span>
          </div>

          {/* Row 2: location + date + subtype pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: context || closedContext ? '8px' : 0 }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569' }}>
              {[c.city, c.state].filter(Boolean).join(', ') || '—'}
            </span>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569' }}>
              {formatDate(c.submitted_at || c.created_date)}
            </span>
            {pill && (
              <span style={{
                display: 'inline-block', padding: '1px 8px', borderRadius: '6px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
                color: '#475569', backgroundColor: 'var(--slate-100)'
              }}>{pill}</span>
            )}
          </div>

          {/* Row 3: context line */}
          {context && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: context.color, margin: 0, lineHeight: 1.4 }}>
              {context.text}
            </p>
          )}
          {closedContext && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: 0, lineHeight: 1.4 }}>
              {closedContext}
            </p>
          )}
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: '16px', flexShrink: 0 }}>
          <ChevronRight size={18} style={{ color: 'var(--slate-400)' }} />
        </div>
      </div>
    </Link>
  );
}