import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Building2, Globe, ArrowUpRight } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statusColors = {
  assigned: { bg: '#FEF3C7', text: '#92400E' },
  in_progress: { bg: '#DCFCE7', text: '#15803D' },
  closed: { bg: '#F1F5F9', text: '#475569' }
};

const resolutionBadge = {
  engaged: { label: 'Engaged', bg: '#DCFCE7', color: '#15803D' },
  referred_out: { label: 'Referred Out', bg: '#DBEAFE', color: '#1E3A8A' },
  not_viable: { label: 'Not Viable', bg: 'var(--slate-100)', color: 'var(--slate-600)' },
  claimant_unresponsive: { label: 'Reporter Unresponsive', bg: '#FEF3C7', color: '#B45309' },
  claimant_declined: { label: 'Reporter Declined', bg: '#FEF3C7', color: '#B45309' },
  admin_closed: { label: 'Admin Closed', bg: 'var(--slate-100)', color: 'var(--slate-600)' }
};

export default function PerformanceSection({ cases, contactLogs, lawyerProfile }) {
  const [sortField, setSortField] = useState('assigned_at');
  const [sortDir, setSortDir] = useState(-1);

  const myCases = cases.filter(c => c.assigned_lawyer_id === lawyerProfile.id);
  const totalCases = myCases.length;
  const activeCases = myCases.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const resolvedCases = myCases.filter(c => c.status === 'closed');
  const resolvedCount = resolvedCases.length;

  // Avg response time
  const casesWithAssign = myCases.filter(c => c.assigned_at);
  let avgHrs = null;
  let fastestHrs = null;
  const responseTimes = [];
  casesWithAssign.forEach(c => {
    const logs = contactLogs.filter(l => l.case_id === c.id);
    if (logs.length === 0) return;
    const earliest = logs.reduce((min, l) => {
      const t = new Date(l.logged_at || l.created_date);
      return t < min ? t : min;
    }, new Date('2999-01-01'));
    const hrs = (earliest - new Date(c.assigned_at)) / (1000 * 60 * 60);
    responseTimes.push(hrs);
  });
  if (responseTimes.length > 0) {
    avgHrs = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    fastestHrs = Math.round(Math.min(...responseTimes));
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

  const rateColor = onTimeRate === null ? 'white' : onTimeRate >= 80 ? '#4ADE80' : onTimeRate >= 50 ? '#FCD34D' : '#FCA5A5';

  // Resolution breakdown
  const resolutionCounts = {};
  resolvedCases.forEach(c => {
    const t = c.resolution_type || 'unknown';
    resolutionCounts[t] = (resolutionCounts[t] || 0) + 1;
  });
  const engagedCount = resolutionCounts['engaged'] || 0;
  const engagementRate = resolvedCount > 0 ? Math.round((engagedCount / resolvedCount) * 100) : 0;

  // Sorting
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d * -1);
    else { setSortField(field); setSortDir(-1); }
  };
  const sortedCases = [...myCases].sort((a, b) => {
    const av = a[sortField] || '';
    const bv = b[sortField] || '';
    return av > bv ? sortDir : av < bv ? -sortDir : 0;
  });

  const th = (label, field) => (
    <th scope="col" onClick={() => toggleSort(field)} style={{
      fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
      color: 'var(--slate-500)', textAlign: 'left', padding: '8px 10px',
      borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase',
      letterSpacing: '0.04em', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none'
    }}>
      {label} {sortField === field ? (sortDir === -1 ? '↓' : '↑') : ''}
    </th>
  );

  const tdStyle = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
    padding: '8px 10px', borderBottom: '1px solid var(--slate-100)', whiteSpace: 'nowrap'
  };

  const barSegments = [
    { key: 'engaged', label: 'Engaged', color: '#15803D', bg: '#DCFCE7' },
    { key: 'referred_out', label: 'Referred', color: '#1E3A8A', bg: '#DBEAFE' },
    { key: 'not_viable', label: 'Not Viable', color: 'var(--slate-600)', bg: 'var(--slate-100)' },
    { key: 'claimant_unresponsive', label: 'Unresponsive', color: '#B45309', bg: '#FEF3C7' },
    { key: 'claimant_declined', label: 'Declined', color: '#B45309', bg: '#FEF3C7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary Bar */}
      <div style={{
        backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
        borderRadius: '12px', padding: '24px'
      }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 16px' }}>
          My Performance
        </h2>
        <div style={{
          backgroundColor: 'var(--slate-900)', borderRadius: '12px', padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
        }}>
          {[
            { label: 'Total Cases', value: totalCases },
            { label: 'Active', value: activeCases },
            { label: 'Resolved', value: resolvedCount },
            { label: 'Avg Response', value: avgHrs !== null ? `${avgHrs}h` : '—' },
            { label: 'On-Time Rate', value: onTimeRate !== null ? `${onTimeRate}%` : '—', color: rateColor },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', flex: '1 1 0' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>
                {s.label}
              </p>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: s.color || 'white', margin: 0 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {/* Response Performance */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 16px' }}>
            Response Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>Avg time to first contact</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>{avgHrs !== null ? `${avgHrs}h` : '—'}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>On-time contact rate</span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: onTimeRate === null ? 'var(--slate-900)' : onTimeRate >= 80 ? '#15803D' : onTimeRate >= 50 ? '#B45309' : '#B91C1C' }}>
                  {onTimeRate !== null ? `${onTimeRate}%` : '—'}
                </span>
              </div>
              {onTimeRate !== null && (
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--slate-100)' }}>
                  <div style={{ height: '100%', borderRadius: '3px', width: `${onTimeRate}%`, backgroundColor: onTimeRate >= 80 ? '#15803D' : onTimeRate >= 50 ? '#D97706' : '#B91C1C', transition: 'width 0.5s' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>Fastest response</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>{fastestHrs !== null ? `${fastestHrs}h` : '—'}</span>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-400)', margin: '4px 0 0', fontStyle: 'italic' }}>
              Your goal: contact within 24 hours of assignment
            </p>
            {onTimeRate !== null && onTimeRate < 50 && (
              <div style={{ backgroundColor: '#FEF3C7', borderRadius: '8px', padding: '12px', marginTop: '4px' }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                  Your contact rate is below the platform standard. Late contact may result in cases being reassigned.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Case Outcomes */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 16px' }}>
            Case Outcomes
          </h3>
          {resolvedCount === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-500)', lineHeight: 1.6, margin: 0 }}>
              No resolved cases yet. Your outcomes will appear here as you close cases.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>Total resolved</span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>{resolvedCount}</span>
              </div>
              {barSegments.map(seg => {
                const count = resolutionCounts[seg.key] || 0;
                if (count === 0) return null;
                const pct = Math.round((count / resolvedCount) * 100);
                return (
                  <div key={seg.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: seg.color, fontWeight: 600 }}>{seg.label}</span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--slate-100)' }}>
                      <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, backgroundColor: seg.color, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>Engagement rate</span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: '#15803D' }}>{engagementRate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case History Table */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 12px' }}>
          Case History
        </h3>
        {sortedCases.length === 0 ? (
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-500)', margin: 0 }}>
            No cases yet. <Link to={createPageUrl('Marketplace')} style={{ color: 'var(--terra-600)', fontWeight: 600, textDecoration: 'none' }}>Browse available cases to get started.</Link>
          </p>
        ) : (
          <div style={{ overflow: 'auto', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
              <caption className="sr-only">Case history</caption>
              <thead>
                <tr style={{ backgroundColor: 'var(--slate-50)' }}>
                  {th('Business', 'business_name')}
                  {th('City, State', 'city')}
                  <th scope="col" style={{ ...tdStyle, fontWeight: 700, fontSize: '0.6875rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid var(--slate-200)' }}>Type</th>
                  {th('Assigned', 'assigned_at')}
                  {th('Status', 'status')}
                  <th scope="col" style={{ ...tdStyle, fontWeight: 700, fontSize: '0.6875rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid var(--slate-200)' }}>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {sortedCases.map(c => {
                  const sc = statusColors[c.status] || { bg: '#F1F5F9', text: '#475569' };
                  const isPhysical = c.violation_type === 'physical_space';
                  const rb = c.status === 'closed' ? (resolutionBadge[c.resolution_type] || { label: '—', bg: 'var(--slate-100)', color: 'var(--slate-600)' }) : null;
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer', transition: 'background-color 0.1s' }}
                      onClick={() => { window.location.href = createPageUrl('LawyerDashboard') + `?highlight=${c.id}`; }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--slate-800)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.business_name}
                          <ArrowUpRight size={12} style={{ color: 'var(--slate-400)' }} />
                        </div>
                      </td>
                      <td style={tdStyle}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                      <td style={tdStyle}>
                        {isPhysical ? <Building2 size={14} style={{ color: 'var(--terra-600, #C2410C)' }} /> : <Globe size={14} style={{ color: '#1E3A8A' }} />}
                      </td>
                      <td style={tdStyle}>{formatDate(c.assigned_at)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '9999px',
                          fontSize: '0.6875rem', fontWeight: 700,
                          backgroundColor: sc.bg, color: sc.text, textTransform: 'uppercase'
                        }}>{(c.status || '').replace(/_/g, ' ')}</span>
                      </td>
                      <td style={tdStyle}>
                        {rb ? (
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '9999px',
                            fontSize: '0.6875rem', fontWeight: 700,
                            backgroundColor: rb.bg, color: rb.color
                          }}>{rb.label}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}