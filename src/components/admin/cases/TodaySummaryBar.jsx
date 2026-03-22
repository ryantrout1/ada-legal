import React, { useMemo } from 'react';

export default function TodaySummaryBar({ cases, avgAssignDays }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekISO = weekStart.toISOString();

    const newToday = cases.filter(c => c.submitted_at && c.submitted_at >= todayISO).length;
    const approvedWeek = cases.filter(c => c.approved_at && c.approved_at >= weekISO).length;
    const rejectedWeek = cases.filter(c => c.status === 'rejected' && c.created_date >= weekISO).length;

    const approvedCases = cases.filter(c => c.submitted_at && c.approved_at);
    let avgReview = '—';
    if (approvedCases.length > 0) {
      const totalHrs = approvedCases.reduce((sum, c) => sum + (new Date(c.approved_at) - new Date(c.submitted_at)) / 3600000, 0);
      const avg = totalHrs / approvedCases.length;
      avgReview = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
    }

    return { newToday, approvedWeek, rejectedWeek, avgReview };
  }, [cases]);

  const items = [
    { label: 'Today', value: `${stats.newToday} new` },
    { label: 'This week', value: `${stats.approvedWeek} approved, ${stats.rejectedWeek} rejected` },
    { label: 'Avg review', value: stats.avgReview },
    { label: 'Avg to assign', value: avgAssignDays === '—' ? '—' : `${avgAssignDays}d` },
  ];

  return (
    <div
      role="status"
      aria-label="Today's summary"
      style={{
        display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center',
        padding: '8px 14px', backgroundColor: 'var(--card-bg-tinted)',
        borderRadius: '8px', border: '1px solid var(--card-border)',
      }}
    >
      {items.map((item, i) => (
        <span key={i} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
          <strong style={{ color: 'var(--body)' }}>{item.label}:</strong> {item.value}
        </span>
      ))}
    </div>
  );
}