import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Briefcase, Activity, Clock, ShieldCheck } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statusColors = {
  submitted: { bg: '#FEF3C7', text: '#92400E' },
  under_review: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DBEAFE', text: '#1D4ED8' },
  available: { bg: '#F3E8FF', text: '#7C3AED' },
  assigned: { bg: '#DCFCE7', text: '#15803D' },
  in_progress: { bg: '#DCFCE7', text: '#15803D' },
  closed: { bg: '#F1F5F9', text: '#475569' }
};

export default function PerformanceSection({ cases, contactLogs, lawyerProfile }) {
  const myCases = cases.filter(c => c.assigned_lawyer_id === lawyerProfile.id);
  const totalCases = myCases.length;
  const activeCases = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;

  // Avg response time
  const casesWithAssign = myCases.filter(c => c.assigned_at);
  let avgHrs = null;
  if (casesWithAssign.length > 0) {
    const times = casesWithAssign.map(c => {
      const logs = contactLogs.filter(l => l.case_id === c.id);
      if (logs.length === 0) return null;
      const earliest = logs.reduce((min, l) => {
        const t = new Date(l.logged_at || l.created_date);
        return t < min ? t : min;
      }, new Date('2999-01-01'));
      return (earliest - new Date(c.assigned_at)) / (1000 * 60 * 60);
    }).filter(t => t !== null);
    if (times.length > 0) avgHrs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  // On-time rate
  let onTimeRate = null;
  if (casesWithAssign.length > 0) {
    const onTime = casesWithAssign.filter(c => {
      const deadline = new Date(new Date(c.assigned_at).getTime() + 24 * 60 * 60 * 1000);
      return contactLogs.some(l =>
        l.case_id === c.id && l.contact_type === 'initial_contact' &&
        new Date(l.logged_at || l.created_date) <= deadline
      );
    }).length;
    onTimeRate = Math.round((onTime / casesWithAssign.length) * 100);
  }

  const rateColor = onTimeRate === null ? 'var(--slate-700)' : onTimeRate >= 80 ? '#15803D' : onTimeRate >= 50 ? '#92400E' : '#B91C1C';
  const rateBg = onTimeRate === null ? 'var(--surface)' : onTimeRate >= 80 ? '#DCFCE7' : onTimeRate >= 50 ? '#FEF3C7' : '#FEE2E2';

  const card = (label, value, bg, text, Icon) => (
    <div style={{
      backgroundColor: bg || 'var(--surface)', border: `1px solid ${bg || 'var(--slate-200)'}`,
      borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem', flex: '1 1 160px', minWidth: '140px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text || 'var(--slate-500)', margin: 0 }}>{label}</p>
        <Icon size={16} style={{ color: text || 'var(--slate-400)', opacity: 0.7 }} />
      </div>
      <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: text || 'var(--slate-900)', margin: 0 }}>{value}</p>
    </div>
  );

  // Case history table
  const sortedCases = [...myCases].sort((a, b) => new Date(b.assigned_at || b.created_date) - new Date(a.assigned_at || a.created_date));
  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--slate-500)', textAlign: 'left', padding: '0.4rem 0.625rem',
    borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase',
    letterSpacing: '0.04em', whiteSpace: 'nowrap'
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
    padding: '0.4rem 0.625rem', borderBottom: '1px solid var(--slate-100)', whiteSpace: 'nowrap'
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
        color: 'var(--slate-900)', margin: '0 0 var(--space-md) 0'
      }}>My Performance</h2>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
        {card('Total Cases', totalCases, '#DBEAFE', '#1D4ED8', Briefcase)}
        {card('Active Cases', activeCases, '#F3E8FF', '#7C3AED', Activity)}
        {card('Avg Response Time', avgHrs !== null ? `${avgHrs}h` : '—', 'var(--surface)', 'var(--slate-700)', Clock)}
        {card('On-Time Contact Rate', onTimeRate !== null ? `${onTimeRate}%` : '—', rateBg, rateColor, ShieldCheck)}
      </div>

      <h3 style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
        color: 'var(--slate-900)', margin: '0 0 0.5rem'
      }}>Case History</h3>

      {sortedCases.length === 0 ? (
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-500)' }}>
          No cases yet. <Link to={createPageUrl('Marketplace')} style={{ color: 'var(--terra-600)', fontWeight: 600 }}>Browse the marketplace to get started.</Link>
        </p>
      ) : (
        <div style={{ overflow: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <caption className="sr-only">Case history</caption>
            <thead>
              <tr>
                <th scope="col" style={th}>Business</th>
                <th scope="col" style={th}>Location</th>
                <th scope="col" style={th}>Type</th>
                <th scope="col" style={th}>Assigned</th>
                <th scope="col" style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedCases.map(c => {
                const sc = statusColors[c.status] || statusColors.submitted;
                return (
                  <tr key={c.id}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--slate-800)' }}>{c.business_name}</td>
                    <td style={td}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                    <td style={td}>{c.violation_type === 'physical_space' ? '🏢' : '🌐'}</td>
                    <td style={td}>{formatDate(c.assigned_at)}</td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block', padding: '0.15rem 0.5rem',
                        fontSize: '0.6875rem', fontWeight: 700, borderRadius: '9999px',
                        backgroundColor: sc.bg, color: sc.text, textTransform: 'uppercase'
                      }}>
                        {(c.status || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}