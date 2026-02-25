import React, { useMemo } from 'react';

export default function OpsStatBar({ cases, contactLogs }) {
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const submittedMonth = cases.filter(c => c.submitted_at && c.submitted_at >= monthStart).length;
    const approvedMonth = cases.filter(c => c.approved_at && c.approved_at >= monthStart).length;
    const assignedMonth = cases.filter(c => c.assigned_at && c.assigned_at >= monthStart).length;

    // Avg review time
    const reviewed = cases.filter(c => c.submitted_at && c.approved_at);
    let avgReview = '—';
    if (reviewed.length > 0) {
      const hrs = reviewed.reduce((s, c) => s + (new Date(c.approved_at) - new Date(c.submitted_at)) / 3600000, 0) / reviewed.length;
      avgReview = hrs < 1 ? '<1h' : `${Math.round(hrs)}h`;
    }

    // Avg time to assign
    const assigned = cases.filter(c => c.approved_at && c.assigned_at);
    let avgAssign = '—';
    if (assigned.length > 0) {
      const hrs = assigned.reduce((s, c) => s + (new Date(c.assigned_at) - new Date(c.approved_at)) / 3600000, 0) / assigned.length;
      avgAssign = hrs < 1 ? '<1h' : `${Math.round(hrs)}h`;
    }

    // Contact compliance
    const withAssignment = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
    let compliance = '—';
    let complianceNum = 100;
    if (withAssignment.length > 0) {
      const compliant = withAssignment.filter(c => {
        const deadline = new Date(new Date(c.assigned_at).getTime() + 86400000);
        return contactLogs.some(l => l.case_id === c.id && l.contact_type === 'initial_contact' && new Date(l.logged_at || l.created_date) <= deadline);
      }).length;
      complianceNum = Math.round((compliant / withAssignment.length) * 100);
      compliance = complianceNum + '%';
    }

    const availableNow = cases.filter(c => c.status === 'available').length;
    const t72 = new Date(Date.now() - 72 * 3600000).toISOString();
    const unclaimed72 = cases.filter(c => c.status === 'available' && c.approved_at && c.approved_at < t72).length;

    return [
      { label: 'Submitted', value: submittedMonth, warn: false },
      { label: 'Approved', value: approvedMonth, warn: false },
      { label: 'Assigned', value: assignedMonth, warn: false },
      { label: 'Avg Review', value: avgReview, warn: false },
      { label: 'Avg to Assign', value: avgAssign, warn: false },
      { label: 'Compliance', value: compliance, warn: complianceNum < 70, danger: complianceNum < 50 },
      { label: 'Available', value: availableNow, warn: false },
      { label: 'Unclaimed 72h+', value: unclaimed72, warn: unclaimed72 > 0, danger: unclaimed72 > 3 },
    ];
  }, [cases, contactLogs]);

  return (
    <div style={{ display: 'flex', border: '1px solid var(--slate-200)', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'white' }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          flex: '1 1 0', padding: '10px 8px', textAlign: 'center',
          borderRight: i < stats.length - 1 ? '1px solid var(--slate-200)' : 'none',
          backgroundColor: s.danger ? '#FEE2E2' : s.warn ? '#FEF3C7' : 'white',
          minWidth: 0,
        }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: 700, color: s.danger ? '#B91C1C' : s.warn ? '#92400E' : 'var(--slate-900)', lineHeight: 1.2 }}>
            {s.value}
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.label}
          </div>
        </div>
      ))}
      <style>{`
        @media (max-width: 768px) {
          /* Let stat bar scroll horizontally on mobile */
        }
      `}</style>
    </div>
  );
}