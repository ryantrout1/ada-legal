import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Clock, Building2, Globe, Check, X } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SEVERITY_CFG = {
  high:   { emoji: '🔴', label: 'High Severity', bg: 'var(--error-100)',   color: 'var(--err-fg)' },
  medium: { emoji: '🟡', label: 'Medium',        bg: 'var(--warning-100)', color: 'var(--wrn-fg)' },
  low:    { emoji: '🟢', label: 'Low',            bg: 'var(--success-100)', color: '#14532D' },
};

function getHighestSeverity(cases) {
  const order = ['high', 'medium', 'low'];
  for (const s of order) {
    if (cases.some(c => c.ai_severity === s)) return s;
  }
  return null;
}

function avgCompleteness(cases) {
  const scores = cases.map(c => c.ai_completeness_score ?? 0);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function CompIndicator({ score }) {
  const cfg = score >= 80
    ? { dot: 'var(--suc-fg)', label: 'Ready',      color: 'var(--suc-fg)' }
    : score >= 50
      ? { dot: '#D97706', label: 'Partial',    color: 'var(--wrn-fg)' }
      : { dot: 'var(--err-fg)', label: 'Incomplete', color: '#991B1B' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: cfg.color }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label} ({score}%)
    </span>
  );
}

function SubRow({ c, onExpand }) {
  const sev = SEVERITY_CFG[c.ai_severity] || null;
  const score = c.ai_completeness_score ?? 0;
  return (
    <button
      onClick={() => onExpand(c)}
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px',
        padding: '10px 16px 10px 28px', cursor: 'pointer', width: '100%',
        border: 'none', borderTop: '1px solid var(--card-border)',
        backgroundColor: 'transparent', textAlign: 'left',
        minHeight: '44px', fontFamily: 'Manrope, sans-serif',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--body-secondary)', flex: '0 0 70px' }}>{c.id?.slice(0, 8)}…</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)', flex: '1 1 200px', lineHeight: 1.4 }}>
        {c.ai_summary || c.narrative?.slice(0, 100) || '—'}
      </span>
      {sev && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
          color: sev.color, backgroundColor: sev.bg,
        }}>
          {sev.emoji} {sev.label}
        </span>
      )}
      <CompIndicator score={score} />
      <span style={{ fontSize: '0.75rem', color: 'var(--body-secondary)', flex: '0 0 auto' }}>
        {formatDate(c.submitted_at || c.created_date)}
      </span>
    </button>
  );
}

export default function ClusterRow({ clusterId, cases, onBulkApprove, onBulkReject, onExpandCase }) {
  const [expanded, setExpanded] = useState(false);
  const [bulkDismissed, setBulkDismissed] = useState(false);
  const triggerRef = useRef(null);

  const representative = cases[0];
  const businessName = representative?.business_name || 'Unknown';
  const location = [representative?.city, representative?.state].filter(Boolean).join(', ') || '—';
  const highestSev = getHighestSeverity(cases);
  const sev = highestSev ? SEVERITY_CFG[highestSev] : null;
  const avg = avgCompleteness(cases);

  const violationTypes = [...new Set(cases.map(c => c.violation_type).filter(Boolean))];
  const dates = cases.map(c => new Date(c.submitted_at || c.created_date)).sort((a, b) => a - b);
  const firstDate = formatDate(dates[0]);
  const lastDate = formatDate(dates[dates.length - 1]);

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${businessName} cluster — ${cases.length} reports. ${expanded ? 'Collapse' : 'Expand'}`}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px',
          padding: '14px 16px', cursor: 'pointer', minHeight: '48px',
          backgroundColor: expanded ? 'var(--page-bg-subtle)' : 'transparent',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Business name + count */}
        <div style={{ minWidth: 0, flex: '1 1 200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--heading)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {businessName}
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: '100px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
              color: '#1E3A8A', backgroundColor: 'var(--info-100)', whiteSpace: 'nowrap',
            }}>
              {cases.length} reports
            </span>
          </div>
        </div>

        {/* Location */}
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
          {location}
        </span>

        {/* Violation type pills */}
        <div style={{ display: 'flex', gap: '4px', flex: '0 1 auto' }}>
          {violationTypes.map(vt => (
            <span key={vt} style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
              color: vt === 'physical_space' ? '#7C2D12' : '#1E3A5F',
              backgroundColor: vt === 'physical_space' ? '#FEF1EC' : '#DBEAFE',
            }}>
              {vt === 'physical_space' ? 'Physical' : 'Digital'}
            </span>
          ))}
        </div>

        {/* Severity + completeness */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 1 auto' }}>
          {sev && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '2px 8px', borderRadius: '6px', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.7rem', fontWeight: 700, color: sev.color, backgroundColor: sev.bg,
            }}>
              {sev.emoji} {sev.label}
            </span>
          )}
          <CompIndicator score={avg} />
        </div>

        {/* Date range */}
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--body-secondary)', flex: '0 0 auto', whiteSpace: 'nowrap' }}>
          {firstDate} — {lastDate}
        </span>

        <span aria-hidden="true" style={{ color: 'var(--body-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--card-border)' }}>
          {/* Bulk action bar */}
          {!bulkDismissed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
              padding: '12px 16px', backgroundColor: 'var(--page-bg-subtle)', borderBottom: '1px solid var(--card-border)',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); onBulkApprove(clusterId, cases); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 18px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  fontWeight: 700, color: 'var(--card-bg)', backgroundColor: 'var(--suc-fg)',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', minHeight: '44px',
                }}
              >
                <Check size={16} /> Approve All {cases.length} Cases
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onBulkReject(clusterId, cases); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 18px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  fontWeight: 700, color: '#991B1B', backgroundColor: 'transparent',
                  border: '2px solid #B91C1C', borderRadius: '8px', cursor: 'pointer', minHeight: '44px',
                }}
              >
                <X size={16} /> Reject All
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setBulkDismissed(true); }}
                style={{
                  background: 'none', border: 'none', fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.8125rem', color: 'var(--terra-600)', cursor: 'pointer',
                  textDecoration: 'underline', padding: '4px 8px', minHeight: '44px',
                }}
              >
                Review Individually
              </button>
            </div>
          )}

          {/* Sub-rows */}
          {cases.map(c => (
            <SubRow key={c.id} c={c} onExpand={onExpandCase} />
          ))}
        </div>
      )}
    </div>
  );
}