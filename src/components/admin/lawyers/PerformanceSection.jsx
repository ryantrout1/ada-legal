import React from 'react';

export default function PerformanceSection({ lawyer, cases, contactLogs }) {
  const myCases = cases.filter(c => c.assigned_lawyer_id === lawyer.id);
  const totalCases = myCases.length;
  const activeCases = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;

  const casesWithAssign = myCases.filter(c => c.assigned_at);
  let avgContactHrs = null;
  if (casesWithAssign.length > 0) {
    const times = casesWithAssign
      .map(c => {
        const logs = contactLogs.filter(lg => lg.case_id === c.id && lg.lawyer_id === lawyer.id);
        if (logs.length === 0) return null;
        const earliest = logs.reduce((min, lg) => {
          const t = new Date(lg.logged_at || lg.created_date);
          return t < min ? t : min;
        }, new Date('2999-01-01'));
        return (earliest - new Date(c.assigned_at)) / (1000 * 60 * 60);
      })
      .filter(t => t !== null);
    if (times.length > 0) {
      avgContactHrs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    }
  }

  let complianceRate = null;
  if (casesWithAssign.length > 0) {
    const compliant = casesWithAssign.filter(c => {
      const deadline = new Date(new Date(c.assigned_at).getTime() + 24 * 60 * 60 * 1000);
      return contactLogs.some(l =>
        l.case_id === c.id && l.contact_type === 'initial_contact' &&
        new Date(l.logged_at || l.created_date) <= deadline
      );
    }).length;
    complianceRate = Math.round((compliant / casesWithAssign.length) * 100);
  }

  const compColor = complianceRate === null ? 'white' :
    complianceRate >= 80 ? '#4ADE80' : complianceRate >= 50 ? '#FCD34D' : '#FCA5A5';

  return (
    <div>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>
        Performance Metrics
      </p>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
        backgroundColor: 'var(--slate-900)', borderRadius: '12px', padding: '14px 20px'
      }}>
        <Stat label="Total" value={totalCases} />
        <Sep />
        <Stat label="Active" value={activeCases} />
        <Sep />
        <Stat label="Avg Response" value={avgContactHrs !== null ? `${avgContactHrs}h` : '—'} />
        <Sep />
        <Stat label="On-Time" value={complianceRate !== null ? `${complianceRate}%` : '—'} color={compColor} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700, color: color || 'white', marginLeft: '6px' }}>
        {value}
      </span>
    </div>
  );
}

function Sep() {
  return <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.15)' }} />;
}