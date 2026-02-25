import React, { useMemo } from 'react';

export default function AttorneyOverviewBar({ lawyers, cases, contactLogs }) {
  const { cells, summaryText } = useMemo(() => {
    const total = lawyers.length;
    const active = lawyers.filter(l => l.subscription_status === 'active' && l.account_status === 'approved').length;
    const pending = lawyers.filter(l => l.account_status === 'pending_approval').length;
    const inactive = lawyers.filter(l => (l.subscription_status === 'inactive' || l.subscription_status === 'canceled') && l.account_status === 'approved').length;
    const suspended = lawyers.filter(l => l.account_status === 'suspended').length;

    // Avg cases per attorney
    const approved = lawyers.filter(l => l.account_status === 'approved');
    const activeCaseCount = cases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
    const avgCases = approved.length > 0 ? Math.round((activeCaseCount / approved.length) * 10) / 10 : 0;

    // Avg response time
    const withAssign = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
    let avgHrs = '—';
    if (withAssign.length > 0) {
      const times = withAssign.map(c => {
        const logs = contactLogs.filter(l => l.case_id === c.id);
        if (logs.length === 0) return null;
        const earliest = Math.min(...logs.map(l => new Date(l.logged_at || l.created_date).getTime()));
        return (earliest - new Date(c.assigned_at).getTime()) / 3600000;
      }).filter(t => t !== null);
      if (times.length > 0) avgHrs = Math.round(times.reduce((a, b) => a + b, 0) / times.length) + 'h';
    }

    // Compliance
    let compliance = '—';
    if (withAssign.length > 0) {
      const compliant = withAssign.filter(c => {
        const deadline = new Date(new Date(c.assigned_at).getTime() + 86400000);
        return contactLogs.some(l => l.case_id === c.id && l.contact_type === 'initial_contact' && new Date(l.logged_at || l.created_date) <= deadline);
      }).length;
      compliance = Math.round((compliant / withAssign.length) * 100) + '%';
    }

    return {
      cells: [
        { label: 'Total Attorneys', value: total, bg: 'white', color: 'var(--slate-900)' },
        { label: 'Active', value: active, bg: '#F0FDF4', color: '#15803D' },
        { label: 'Pending Approval', value: pending, bg: pending > 0 ? '#FEF3C7' : 'white', color: pending > 0 ? '#92400E' : 'var(--slate-500)', pulse: pending > 0 },
        { label: 'Inactive', value: inactive, bg: '#F8FAFC', color: '#64748B' },
        { label: 'Suspended', value: suspended, bg: suspended > 0 ? '#FEF2F2' : 'white', color: suspended > 0 ? '#B91C1C' : 'var(--slate-500)' },
      ],
      summaryText: `Avg cases/attorney: ${avgCases} · Avg response: ${avgHrs} · Compliance: ${compliance}`,
    };
  }, [lawyers, cases, contactLogs]);

  return (
    <div className="attorney-overview-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flex: '1 1 auto', border: '1px solid var(--slate-200)', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'white', minWidth: 0 }}>
        {cells.map((c, i) => (
          <div
            key={c.label}
            style={{
              flex: '1 1 0', padding: '10px 8px', textAlign: 'center',
              borderRight: i < cells.length - 1 ? '1px solid var(--slate-200)' : 'none',
              backgroundColor: c.bg, minWidth: 0,
              animation: c.pulse ? 'attPulse 2s ease-in-out infinite' : 'none',
            }}
          >
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: 700, color: c.color, lineHeight: 1.2 }}>
              {c.value}
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>
      <div className="attorney-summary-text" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {summaryText}
      </div>
      <style>{`
        @keyframes attPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @media (max-width: 768px) {
          .attorney-summary-text { white-space: normal !important; flex-basis: 100% !important; }
        }
      `}</style>
    </div>
  );
}