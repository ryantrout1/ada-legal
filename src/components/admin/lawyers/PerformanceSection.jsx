import React from 'react';
import { Briefcase, Activity, Clock, ShieldCheck } from 'lucide-react';

export default function PerformanceSection({ lawyer, cases, contactLogs }) {
  const myCases = cases.filter(c => c.assigned_lawyer_id === lawyer.id);
  const totalCases = myCases.length;
  const activeCases = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;

  // Avg time to contact
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

  // Compliance rate
  let complianceRate = null;
  if (casesWithAssign.length > 0) {
    const compliant = casesWithAssign.filter(c => {
      const deadline = new Date(new Date(c.assigned_at).getTime() + 24 * 60 * 60 * 1000);
      return contactLogs.some(l =>
        l.case_id === c.id &&
        l.contact_type === 'initial_contact' &&
        new Date(l.logged_at || l.created_date) <= deadline
      );
    }).length;
    complianceRate = Math.round((compliant / casesWithAssign.length) * 100);
  }

  const complianceBg = complianceRate === null ? 'var(--surface)' :
    complianceRate >= 80 ? '#DCFCE7' : complianceRate >= 50 ? '#FEF3C7' : '#FEE2E2';
  const complianceText = complianceRate === null ? 'var(--slate-700)' :
    complianceRate >= 80 ? '#15803D' : complianceRate >= 50 ? '#92400E' : '#B91C1C';

  const card = (label, value, bg, text, IconComp) => (
    <div style={{
      backgroundColor: bg || 'var(--surface)', border: `1px solid ${bg || 'var(--slate-200)'}`,
      borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem', flex: '1 1 160px', minWidth: '140px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text || 'var(--slate-500)', margin: 0 }}>{label}</p>
        <IconComp size={16} style={{ color: text || 'var(--slate-400)', opacity: 0.7 }} />
      </div>
      <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: text || 'var(--slate-900)', margin: 0 }}>{value}</p>
    </div>
  );

  return (
    <div>
      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 0.75rem 0' }}>
        Performance Metrics
      </h3>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {card('Total Cases', totalCases, '#DBEAFE', '#1D4ED8', Briefcase)}
        {card('Active Cases', activeCases, '#F3E8FF', '#7C3AED', Activity)}
        {card('Avg Time to Contact', avgContactHrs !== null ? `${avgContactHrs}h` : '—', 'var(--surface)', 'var(--slate-700)', Clock)}
        {card('Compliance Rate', complianceRate !== null ? `${complianceRate}%` : '—', complianceBg, complianceText, ShieldCheck)}
      </div>
    </div>
  );
}