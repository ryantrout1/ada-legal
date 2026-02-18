import React from 'react';
import { Building2, Globe, ChevronDown, ChevronUp } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_BADGE = {
  submitted:    { bg: '#64748B', text: '#FFFFFF', label: 'Submitted' },
  under_review: { bg: '#1D4ED8', text: '#FFFFFF', label: 'Under Review' },
  available:    { bg: '#15803D', text: '#FFFFFF', label: 'Available' },
  approved:     { bg: '#15803D', text: '#FFFFFF', label: 'Approved' },
  assigned:     { bg: '#C2410C', text: '#FFFFFF', label: 'Assigned' },
  in_progress:  { bg: '#15803D', text: '#FFFFFF', label: 'In Progress' },
  closed:       { bg: '#475569', text: '#FFFFFF', label: 'Closed' },
  rejected:     { bg: '#B91C1C', text: '#FFFFFF', label: 'Rejected' },
  expired:      { bg: '#92400E', text: '#FFFFFF', label: 'Expired' }
};

const ACCENT_COLORS = {
  submitted: '#1D4ED8',
  under_review: '#1D4ED8',
  available: '#15803D',
  approved: '#15803D',
  assigned: '#C2410C',
  in_progress: '#C2410C',
  closed: '#94A3B8',
  rejected: '#B91C1C',
  expired: '#92400E'
};

export default function AdminCaseRow({ caseData, lawyer, expanded, onToggle }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const badge = STATUS_BADGE[c.status] || STATUS_BADGE.submitted;
  const accent = ACCENT_COLORS[c.status] || '#94A3B8';

  return (
    <div style={{ borderBottom: '1px solid var(--slate-200)' }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${c.business_name} — ${badge.label}, ${[c.city, c.state].filter(Boolean).join(', ') || 'unknown location'}. ${expanded ? 'Collapse' : 'Expand'} details.`}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          minHeight: '48px',
          backgroundColor: expanded ? 'var(--slate-50)' : 'transparent',
          borderLeft: `4px solid ${accent}`,
          transition: 'background-color 0.15s',
          flexWrap: 'wrap'
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Violation icon */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isPhysical
            ? <Building2 size={16} style={{ color: '#C2410C' }} />
            : <Globe size={16} style={{ color: '#1D4ED8' }} />
          }
        </div>

        {/* Name + case ID */}
        <div style={{ minWidth: 0, flex: '1 1 160px' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
            color: 'var(--slate-900)', margin: 0, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {c.business_name}
          </p>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: '#475569', margin: 0
          }}>
            {c.id?.slice(0, 8)}…
          </p>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: '0 1 auto' }}>
          {c.business_type && (
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
              color: '#1E293B', backgroundColor: '#F1EFEA'
            }}>{c.business_type}</span>
          )}
          {(c.violation_subtype || c.url_domain) && (
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
              color: isPhysical ? '#7C2D12' : '#1E3A5F',
              backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE'
            }}>{c.violation_subtype || c.url_domain}</span>
          )}
        </div>

        {/* Location */}
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569',
          whiteSpace: 'nowrap', flex: '0 0 auto'
        }}>
          {[c.city, c.state].filter(Boolean).join(', ') || '—'}
        </span>

        {/* Status badge */}
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
          color: badge.text, backgroundColor: badge.bg,
          textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap',
          flex: '0 0 auto'
        }}>
          {badge.label}
        </span>

        {/* Date */}
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569',
          whiteSpace: 'nowrap', flex: '0 0 auto'
        }}>
          {formatDate(c.submitted_at || c.created_date)}
        </span>

        {/* Lawyer */}
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: lawyer ? '#334155' : '#94A3B8',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: '0 1 130px', minWidth: 0
        }}>
          {lawyer ? lawyer.full_name : '—'}
        </span>

        {/* Expand arrow */}
        <span aria-hidden="true" style={{ color: '#475569', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '4px' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>
    </div>
  );
}