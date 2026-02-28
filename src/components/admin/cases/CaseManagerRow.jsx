import React from 'react';
import { Building2, Globe, ChevronDown, ChevronUp } from 'lucide-react';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_BADGE = {
  submitted:    { bg: '#64748B', label: 'SUBMITTED' },
  under_review: { bg: '#1D4ED8', label: 'UNDER REVIEW' },
  available:    { bg: '#C2410C', label: 'AVAILABLE' },
  assigned:     { bg: '#B45309', label: 'ASSIGNED' },
  in_progress:  { bg: '#15803D', label: 'IN PROGRESS' },
  closed:       { bg: '#475569', label: 'CLOSED' },
  rejected:     { bg: '#B91C1C', label: 'REJECTED' },
  expired:      { bg: '#92400E', label: 'EXPIRED' },
};

const RESOLUTION_LABELS = {
  engaged: 'Engaged', referred_out: 'Referred Out', not_viable: 'Not Viable',
  claimant_unresponsive: 'Reporter Unresponsive', claimant_declined: 'Reporter Declined', admin_closed: 'Admin Closed'
};

function AgingIndicator({ caseData, lawyer }) {
  const c = caseData;
  const s = c.status;

  if (s === 'submitted' || s === 'under_review') {
    const days = daysSince(c.submitted_at || c.created_date);
    return <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>Submitted {days}d ago</span>;
  }
  if (s === 'available') {
    const days = daysSince(c.approved_at || c.created_date);
    const color = days >= 14 ? '#B91C1C' : days >= 7 ? '#92400E' : 'var(--slate-500)';
    return <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: days >= 7 ? 700 : 400, color }}>Available {days}d{days >= 7 ? ' ⚠️' : ''}</span>;
  }
  if (s === 'assigned') {
    const noContact = !c.contact_logged_at && daysSince(c.assigned_at) >= 1;
    return (
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: noContact ? '#B91C1C' : 'var(--slate-500)' }}>
        Assigned to {lawyer ? lawyer.full_name : '—'}
        {noContact && <span style={{ fontWeight: 700 }}> · ⚠️ No contact logged</span>}
      </span>
    );
  }
  if (s === 'in_progress') {
    return (
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
        With {lawyer ? lawyer.full_name : '—'}
        {c.contact_logged_at && <> · Contact logged {formatDate(c.contact_logged_at)}</>}
      </span>
    );
  }
  if (s === 'closed') {
    return <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>Closed {formatDate(c.closed_at)} · {RESOLUTION_LABELS[c.resolution_type] || c.resolution_type || '—'}</span>;
  }
  if (s === 'rejected') {
    return <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>Rejected {formatDate(c.closed_at || c.updated_date)}</span>;
  }
  return null;
}

export default function CaseManagerRow({ caseData, lawyer, expanded, onToggle }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const badge = STATUS_BADGE[c.status] || STATUS_BADGE.submitted;
  const clusterSize = c.ai_duplicate_cluster_size ?? 0;

  return (
    <div style={{ borderBottom: '1px solid var(--slate-200)' }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${c.business_name} — ${badge.label}, ${[c.city, c.state].filter(Boolean).join(', ') || 'unknown'}. ${expanded ? 'Collapse' : 'Expand'} details.`}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="cm-case-row"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
          cursor: 'pointer', minHeight: '48px',
          backgroundColor: expanded ? 'var(--slate-50)' : 'transparent',
          transition: 'background-color 0.15s', flexWrap: 'wrap',
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Icon */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isPhysical ? <Building2 size={15} style={{ color: '#C2410C' }} /> : <Globe size={15} style={{ color: '#1E3A8A' }} />}
        </div>

        {/* Name + ID */}
        <div style={{ minWidth: 0, flex: '1 1 140px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.business_name}
          </p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)', margin: 0 }}>
            {c.id?.slice(0, 8)}…
          </p>
        </div>

        {/* Pills area */}
        <div className="cm-pills" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: '0 1 auto' }}>
          {c.business_type && (
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '6px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: '#1E293B', backgroundColor: '#F1EFEA' }}>
              {c.business_type}
            </span>
          )}
          {(c.violation_subtype || c.url_domain) && (
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '6px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: isPhysical ? '#7C2D12' : '#1E3A5F', backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE' }}>
              {c.violation_subtype || c.url_domain}
            </span>
          )}
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
            {[c.city, c.state].filter(Boolean).join(', ') || '—'}
          </span>
        </div>

        {/* Status badge */}
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700,
          color: 'white', backgroundColor: badge.bg,
          textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {badge.label}
        </span>

        {/* Aging */}
        <div style={{ flex: '0 1 220px', minWidth: 0 }}>
          <AgingIndicator caseData={c} lawyer={lawyer} />
        </div>

        {/* Cluster badge */}
        {clusterSize >= 2 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: '100px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700,
            color: '#1E3A8A', backgroundColor: 'var(--info-100, #DBEAFE)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {clusterSize} reports
          </span>
        )}

        {/* Chevron */}
        <span aria-hidden="true" style={{ color: 'var(--slate-500)', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '4px' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cm-case-row { flex-direction: row; flex-wrap: wrap !important; }
          .cm-pills { width: 100%; order: 10; }
        }
      `}</style>
    </div>
  );
}