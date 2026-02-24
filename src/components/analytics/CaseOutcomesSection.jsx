import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import CompactStatCard from './CompactStatCard';
import { CheckCircle, TrendingUp, Clock } from 'lucide-react';

const RESOLUTION_COLORS = {
  engaged: '#15803D',
  referred_out: '#1D4ED8',
  not_viable: '#94A3B8',
  claimant_unresponsive: '#D97706',
  claimant_declined: '#D97706',
  admin_closed: '#B91C1C'
};

const RESOLUTION_LABELS = {
  engaged: 'Engaged',
  referred_out: 'Referred Out',
  not_viable: 'Not Viable',
  claimant_unresponsive: 'Claimant Unresponsive',
  claimant_declined: 'Claimant Declined',
  admin_closed: 'Admin Closed'
};

const VALUE_LABELS = {
  under_5k: 'Under $5K',
  '5k_25k': '$5K–$25K',
  '25k_75k': '$25K–$75K',
  '75k_plus': '$75K+'
};
const VALUE_ORDER = ['under_5k', '5k_25k', '25k_75k', '75k_plus'];

export default function CaseOutcomesSection({ cases, filters, onFilterChange }) {
  const activeResolution = filters.resolutionType;
  const activeValue = filters.caseValue;

  const closedCases = cases.filter(c => c.status === 'closed');
  const totalClosed = closedCases.length;
  const engagedCount = closedCases.filter(c => c.resolution_type === 'engaged').length;
  const engagementRate = totalClosed > 0 ? Math.round((engagedCount / totalClosed) * 100) : null;
  const rateColor = engagementRate === null ? 'var(--slate-700)' : engagementRate >= 30 ? '#15803D' : engagementRate >= 15 ? '#92400E' : '#B91C1C';
  const rateBg = engagementRate === null ? 'var(--surface)' : engagementRate >= 30 ? '#DCFCE7' : engagementRate >= 15 ? '#FEF3C7' : '#FEE2E2';

  const casesWithTime = closedCases.filter(c => c.assigned_at && c.closed_at);
  let avgDays = '—';
  if (casesWithTime.length > 0) {
    const totalMs = casesWithTime.reduce((s, c) => s + (new Date(c.closed_at) - new Date(c.assigned_at)), 0);
    const avg = totalMs / casesWithTime.length / (1000 * 60 * 60 * 24);
    avgDays = avg < 1 ? '<1d' : `${Math.round(avg)}d`;
  }

  const resMap = {};
  closedCases.forEach(c => { const rt = c.resolution_type || 'unknown'; resMap[rt] = (resMap[rt] || 0) + 1; });
  const resData = Object.entries(resMap).filter(([k]) => k !== 'unknown').map(([type, count]) => ({ name: RESOLUTION_LABELS[type] || type, type, count })).sort((a, b) => b.count - a.count);

  const engagedCases = closedCases.filter(c => c.resolution_type === 'engaged');
  const valMap = {};
  engagedCases.forEach(c => { const v = c.estimated_case_value; if (v) valMap[v] = (valMap[v] || 0) + 1; });
  const valData = VALUE_ORDER.filter(v => valMap[v]).map(v => ({ name: VALUE_LABELS[v], value: v, count: valMap[v] || 0 }));

  const handleResClick = (data) => { if (!data?.type) return; onFilterChange('resolutionType', data.type === activeResolution ? null : data.type); };
  const handleValClick = (data) => { if (!data?.value) return; onFilterChange('caseValue', data.value === activeValue ? null : data.value); };

  const cardStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '12px' };
  const subhead = { fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.375rem', marginTop: 0 };

  // No closed cases — compact message
  if (totalClosed === 0) {
    return (
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-500)', margin: 0 }}>
        No resolved cases yet.
      </p>
    );
  }

  return (
    <div>
      {/* Side by side: stat cards left, resolution chart right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <CompactStatCard label="Cases Resolved" count={totalClosed} bgColor="#F1F5F9" textColor="#475569" icon={CheckCircle} />
          <CompactStatCard label="Engagement Rate" count={engagementRate !== null ? `${engagementRate}%` : '—'} bgColor={rateBg} textColor={rateColor} icon={TrendingUp} />
          <CompactStatCard label="Avg Time to Resolution" count={avgDays} bgColor="var(--surface)" borderColor="var(--slate-200)" icon={Clock} />
        </div>

        <div style={cardStyle}>
          <p style={subhead}>Resolution Type Breakdown</p>
          {resData.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.8125rem' }}>No data</p>
          ) : (
            <>
              <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                <table><caption>Resolution Type Breakdown data</caption><thead><tr><th scope="col">Type</th><th scope="col">Count</th></tr></thead><tbody>{resData.map(d => <tr key={d.type}><td>{d.name}</td><td>{d.count}</td></tr>)}</tbody></table>
              </div>
              <div aria-hidden="true" style={{ width: '100%', height: Math.max(120, resData.length * 26) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resData} layout="vertical" barSize={14} margin={{ left: 10, right: 15, top: 2, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-500)' }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-700)' }} />
                    <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 11 }} />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]} cursor="pointer" onClick={handleResClick}>
                      {resData.map(entry => (
                        <Cell key={entry.type} fill={activeResolution ? (entry.type === activeResolution ? RESOLUTION_COLORS[entry.type] : (RESOLUTION_COLORS[entry.type] || '#94A3B8') + '40') : (RESOLUTION_COLORS[entry.type] || '#94A3B8')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Value Distribution below if exists */}
      {valData.length > 0 && (
        <div style={{ ...cardStyle, marginTop: '12px' }}>
          <p style={subhead}>Estimated Case Value (Engaged)</p>
          <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
            <table><caption>Estimated Case Value data</caption><thead><tr><th scope="col">Value</th><th scope="col">Count</th></tr></thead><tbody>{valData.map(d => <tr key={d.value}><td>{d.name}</td><td>{d.count}</td></tr>)}</tbody></table>
          </div>
          <div aria-hidden="true" style={{ width: '100%', height: Math.max(100, valData.length * 26) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valData} layout="vertical" barSize={14} margin={{ left: 5, right: 15, top: 2, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-500)' }} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-700)' }} />
                <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} cursor="pointer" onClick={handleValClick}>
                  {valData.map(entry => (<Cell key={entry.value} fill={activeValue ? (entry.value === activeValue ? '#C2410C' : '#C2410C40') : '#C2410C'} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}