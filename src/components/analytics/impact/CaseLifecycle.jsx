import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CaseLifecycle({ events }) {
  const { avgStartToComplete, avgCompleteToAccept, statusCounts, statusData } = useMemo(() => {
    // Group events by properties to correlate timings
    // report_started → report_completed: match by session proximity
    const startedEvents = events.filter(e => e.event_name === 'report_started');
    const completedEvents = events.filter(e => e.event_name === 'report_completed');
    const acceptedEvents = events.filter(e => e.event_name === 'attorney_case_accepted');

    // Average start→complete: use chronological pairing
    let totalStartToComplete = 0;
    let countStartToComplete = 0;
    const sortedStarted = [...startedEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const sortedCompleted = [...completedEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const usedCompleted = new Set();
    sortedStarted.forEach(s => {
      const sTime = new Date(s.timestamp).getTime();
      // Find nearest completed event after this start
      for (let i = 0; i < sortedCompleted.length; i++) {
        if (usedCompleted.has(i)) continue;
        const cTime = new Date(sortedCompleted[i].timestamp).getTime();
        if (cTime >= sTime) {
          const diffMin = (cTime - sTime) / 60000;
          if (diffMin < 1440) { // within 24h
            totalStartToComplete += diffMin;
            countStartToComplete++;
            usedCompleted.add(i);
          }
          break;
        }
      }
    });

    // Average complete→accepted: match by case_id in properties
    let totalCompleteToAccept = 0;
    let countCompleteToAccept = 0;
    const completedByCaseish = {};
    completedEvents.forEach(e => {
      const key = e.properties?.violation_type || 'any';
      if (!completedByCaseish[key]) completedByCaseish[key] = [];
      completedByCaseish[key].push(new Date(e.timestamp).getTime());
    });

    const acceptedByCase = {};
    acceptedEvents.forEach(e => {
      const cid = e.properties?.case_id;
      if (cid && !acceptedByCase[cid]) acceptedByCase[cid] = new Date(e.timestamp).getTime();
    });

    // For case_id-based matching
    completedEvents.forEach(ce => {
      const ceTime = new Date(ce.timestamp).getTime();
      // Find an accepted event after completion
      for (const ae of acceptedEvents) {
        const aTime = new Date(ae.timestamp).getTime();
        if (aTime >= ceTime) {
          const diffH = (aTime - ceTime) / 3600000;
          if (diffH < 720) { // within 30 days
            totalCompleteToAccept += diffH;
            countCompleteToAccept++;
          }
          break;
        }
      }
    });

    const avgStartToComplete = countStartToComplete > 0 ? Math.round(totalStartToComplete / countStartToComplete) : null;
    const avgCompleteToAccept = countCompleteToAccept > 0 ? (totalCompleteToAccept / countCompleteToAccept) : null;

    // Status change counts
    const statusMap = {};
    events.filter(e => e.event_name === 'case_status_changed').forEach(e => {
      const ns = e.properties?.new_status || 'unknown';
      statusMap[ns] = (statusMap[ns] || 0) + 1;
    });
    const statusData = Object.entries(statusMap)
      .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count);

    return { avgStartToComplete, avgCompleteToAccept, statusCounts: statusMap, statusData };
  }, [events]);

  const formatAvgComplete = () => {
    if (avgStartToComplete === null) return '—';
    if (avgStartToComplete < 60) return `${avgStartToComplete} min`;
    return `${(avgStartToComplete / 60).toFixed(1)} hr`;
  };

  const formatAvgAccept = () => {
    if (avgCompleteToAccept === null) return '—';
    if (avgCompleteToAccept < 1) return `${Math.round(avgCompleteToAccept * 60)} min`;
    if (avgCompleteToAccept < 24) return `${avgCompleteToAccept.toFixed(1)} hr`;
    return `${(avgCompleteToAccept / 24).toFixed(1)} days`;
  };

  const STATUS_COLORS = {
    available: '#15803D', assigned: '#2563EB', rejected: '#DC2626',
    closed: '#475569', 'in progress': '#92400E', expired: '#92400E'
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--heading)', margin: '0 0 16px' }}>
        Case Lifecycle
      </h3>

      {/* Timing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '16px', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: '#9A3412' }}>{formatAvgComplete()}</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#9A3412', marginTop: '4px' }}>Avg Start → Complete</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1E3A8A' }}>{formatAvgAccept()}</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#1E3A8A', marginTop: '4px' }}>Avg Complete → Attorney Accept</div>
        </div>
      </div>

      {/* Status transitions chart */}
      {statusData.length > 0 && (
        <>
          <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
            Status Transitions
          </h4>
          <div aria-hidden="true" style={{ width: '100%', height: Math.max(160, statusData.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" barSize={20} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--body-secondary)' }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--body)', textTransform: 'capitalize' }} />
                <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                <Bar dataKey="count" fill="#C2410C" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="sr-only">
            <table><caption>Case status transitions</caption>
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>{statusData.map(d => <tr key={d.name}><td>{d.name}</td><td>{d.count}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      {statusData.length === 0 && (
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>No status change data yet</p>
      )}
    </div>
  );
}