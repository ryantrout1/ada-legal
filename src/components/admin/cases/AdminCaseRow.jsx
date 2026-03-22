import React from 'react';
import { Building2, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import SourceBadge from '../../shared/SourceBadge';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_BADGE = {
  submitted:    { bg: 'var(--body-secondary)', text: '#FFFFFF', label: 'Submitted' },
  under_review: { bg: '#1D4ED8', text: '#FFFFFF', label: 'Under Review' },
  available:    { bg: 'var(--suc-fg)', text: '#FFFFFF', label: 'Available' },
  approved:     { bg: 'var(--suc-fg)', text: '#FFFFFF', label: 'Approved' },
  assigned:     { bg: 'var(--accent)', text: '#FFFFFF', label: 'Assigned' },
  in_progress:  { bg: 'var(--suc-fg)', text: '#FFFFFF', label: 'In Progress' },
  closed:       { bg: 'var(--body-secondary)', text: '#FFFFFF', label: 'Closed' },
  rejected:     { bg: 'var(--err-fg)', text: '#FFFFFF', label: 'Rejected' },
  expired:      { bg: 'var(--wrn-fg)', text: '#FFFFFF', label: 'Expired' }
};

const ACCENT_COLORS = {
  submitted: '#1D4ED8',
  under_review: '#1D4ED8',
  available: 'var(--suc-fg)',
  approved: 'var(--suc-fg)',
  assigned: 'var(--accent)',
  in_progress: 'var(--accent)',
  closed: '#4B5563',
  rejected: 'var(--err-fg)',
  expired: 'var(--wrn-fg)'
};

export default function AdminCaseRow({ caseData, lawyer, expanded, onToggle }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const badge = STATUS_BADGE[c.status] || STATUS_BADGE.submitted;
  const accent = ACCENT_COLORS[c.status] || '#4B5563';

  return (
    <div style={{ borderBottom: '1px solid var(--card-border)' }}>
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
          backgroundColor: expanded ? 'var(--page-bg-subtle)' : 'transparent',
          borderLeft: `4px solid ${accent}`,
          transition: 'background-color 0.15s',
          flexWrap: 'wrap'
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Violation icon */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isPhysical
            ? <Building2 size={16} style={{ color: 'var(--accent)' }} />
            : <Globe size={16} style={{ color: '#1E3A8A' }} />
          }
        </div>

        {/* Name + case ID */}
        <div style={{ minWidth: 0, flex: '1 1 160px' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
            color: 'var(--heading)', margin: 0, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {c.business_name}
          </p>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)', margin: 0
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
              color: 'var(--heading)', backgroundColor: '#F1EFEA'
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
          <SourceBadge source={c.intake_source} />
        </div>

        {/* Location */}
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)',
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
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)',
          whiteSpace: 'nowrap', flex: '0 0 auto'
        }}>
          {formatDate(c.submitted_at || c.created_date)}
        </span>

        {/* Lawyer */}
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: lawyer ? 'var(--body)' : '#4B5563',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: '0 1 130px', minWidth: 0
        }}>
          {lawyer ? lawyer.full_name : '—'}
        </span>

        {/* Expand arrow */}
        <span aria-hidden="true" style={{ color: 'var(--body-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '4px' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>
    </div>
  );
}