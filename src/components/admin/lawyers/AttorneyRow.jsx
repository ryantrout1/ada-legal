import React, { useMemo } from 'react';
import { Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import LawyerBadge, { accountColors, subColors } from './LawyerBadge';

function computeMetrics(lawyer, cases, contactLogs) {
  const myCases = cases.filter(c => c.assigned_lawyer_id === lawyer.id);
  const active = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const total = myCases.length;

  const withAssign = myCases.filter(c => c.assigned_at);
  let responseRate = null;
  let avgHrs = null;

  if (withAssign.length > 0) {
    let responded24 = 0;
    const contactTimes = [];
    withAssign.forEach(c => {
      const logs = contactLogs.filter(l => l.case_id === c.id && l.lawyer_id === lawyer.id);
      if (logs.length > 0) {
        const earliest = Math.min(...logs.map(l => new Date(l.logged_at || l.created_date).getTime()));
        const hrs = (earliest - new Date(c.assigned_at).getTime()) / 3600000;
        contactTimes.push(hrs);
        if (hrs <= 24) responded24++;
      }
    });
    responseRate = Math.round((responded24 / withAssign.length) * 100);
    if (contactTimes.length > 0) avgHrs = Math.round(contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length);
  }

  return { active, total, responseRate, avgHrs };
}

export default function AttorneyRow({ lawyer, cases, contactLogs, isExpanded, onToggle, onQuickApprove, children }) {
  const { active, total, responseRate, avgHrs } = useMemo(
    () => computeMetrics(lawyer, cases, contactLogs),
    [lawyer, cases, contactLogs]
  );

  const initial = (lawyer.full_name || '?')[0].toUpperCase();
  const isPending = lawyer.account_status === 'pending_approval';
  const isSuspended = lawyer.account_status === 'suspended';

  // Row bg and left border
  let rowBg = 'transparent';
  let leftBorder = '4px solid transparent';
  if (isPending) rowBg = 'var(--wrn-bg)';
  else if (isSuspended) rowBg = 'var(--err-bg)';
  if (responseRate !== null && responseRate < 50) leftBorder = '4px solid #DC2626';
  else if (responseRate !== null && responseRate < 70) leftBorder = '4px solid #D97706';

  // Response rate pill
  let rrPill = null;
  if (responseRate !== null) {
    const rrColor = responseRate >= 90 ? { bg: 'var(--suc-bg)', text: 'var(--suc-fg)', icon: '✓' }
      : responseRate >= 70 ? { bg: 'var(--wrn-bg)', text: 'var(--wrn-fg)', icon: '⚠' }
      : { bg: 'var(--err-bg)', text: 'var(--err-fg)', icon: '🔴' };
    rrPill = (
      <span aria-label={`Contact compliance: ${responseRate} percent${responseRate < 70 ? ', below threshold' : ''}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        padding: '2px 8px', borderRadius: '100px', fontFamily: 'Manrope, sans-serif',
        fontSize: '0.6875rem', fontWeight: 700, backgroundColor: rrColor.bg, color: rrColor.text,
      }}>
        {rrColor.icon} {responseRate}%
      </span>
    );
  }

  // Avg response color
  let avgColor = 'var(--body-secondary)';
  if (avgHrs !== null) {
    if (avgHrs <= 12) avgColor = 'var(--suc-fg)';
    else if (avgHrs <= 24) avgColor = 'var(--wrn-fg)';
    else avgColor = 'var(--err-fg)';
  }

  // States display
  const states = lawyer.states_of_practice || [];
  const statesDisplay = states.length <= 4 ? states.join(', ') : states.slice(0, 3).join(', ') + ` +${states.length - 3} more`;

  return (
    <div style={{ borderBottom: '1px solid var(--card-border)' }}>
      <div
        role="button" tabIndex={0} aria-expanded={isExpanded}
        aria-label={`${lawyer.full_name}, ${lawyer.firm_name}. ${(lawyer.account_status || '').replace(/_/g, ' ')}. ${isExpanded ? 'Collapse' : 'Expand'} details.`}
        onClick={onToggle} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="attorney-collapsed-row"
        style={{
          display: 'flex', width: '100%', alignItems: 'center', gap: '12px',
          padding: '12px 16px', background: isExpanded ? 'var(--page-bg-subtle)' : rowBg,
          borderLeft: leftBorder, cursor: 'pointer', minHeight: '56px',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = isExpanded ? 'var(--page-bg-subtle)' : rowBg; }}
      >
        {/* Avatar */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: 'var(--heading)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--card-bg)',
        }}>
          {initial}
        </div>

        {/* Name + Firm */}
        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--heading)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lawyer.full_name}
          </p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', margin: 0 }}>
            {lawyer.firm_name}
          </p>
        </div>

        {/* Performance indicators */}
        <div className="attorney-perf-indicators" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '1 1 auto' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Briefcase size={14} style={{ color: 'var(--body-secondary)' }} /> {active} active
          </span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--body-secondary)' }}>{total} total</span>
          {rrPill}
          {avgHrs !== null && (
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: avgColor }}>
              {avgHrs}h avg
            </span>
          )}
        </div>

        {/* Badges + states */}
        <div className="attorney-badges-section" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
          <LawyerBadge label={lawyer.account_status} colorMap={accountColors} />
          <LawyerBadge label={lawyer.subscription_status} colorMap={subColors} />
          {statesDisplay && (
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--body-secondary)', whiteSpace: 'nowrap' }}>
              {statesDisplay}
            </span>
          )}
        </div>

        {/* Quick approve for pending */}
        {isPending && (
          <button
            onClick={e => { e.stopPropagation(); onQuickApprove(lawyer); }}
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: 'var(--suc-fg)', backgroundColor: 'var(--suc-bg)', border: 'none', borderRadius: '6px',
              padding: '6px 12px', minHeight: '36px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}
            aria-label={`Quick approve ${lawyer.full_name}`}
          >
            Quick Approve ✓
          </button>
        )}

        <span aria-hidden="true" style={{ color: 'var(--body-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div style={{ padding: '20px', borderTop: '1px solid var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
          {children}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .attorney-perf-indicators { flex-basis: 100% !important; order: 3; margin-top: 4px; }
          .attorney-badges-section { flex-basis: 100% !important; order: 4; margin-top: 4px; }
        }
      `}</style>
    </div>
  );
}

export { computeMetrics };