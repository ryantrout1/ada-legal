import React from 'react';

export default function QuickStatsBar({ cases }) {
  const now = Date.now();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  // Today's new submissions
  const todaySubmissions = cases.filter(c => c.submitted_at && c.submitted_at >= twentyFourHoursAgo).length;

  // This week: approved & rejected
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekISO = weekStart.toISOString();
  const approvedThisWeek = cases.filter(c => c.approved_at && c.approved_at >= weekISO).length;
  const rejectedThisWeek = cases.filter(c => c.status === 'rejected' && c.created_date >= weekISO).length;

  // Avg review time
  const approvedCases = cases.filter(c => c.submitted_at && c.approved_at);
  let avgReviewHrs = '—';
  if (approvedCases.length > 0) {
    const totalHrs = approvedCases.reduce((sum, c) => sum + (new Date(c.approved_at) - new Date(c.submitted_at)) / (1000 * 60 * 60), 0);
    const avg = totalHrs / approvedCases.length;
    avgReviewHrs = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
  }

  const items = [
    { label: 'Today', value: `${todaySubmissions} new submission${todaySubmissions !== 1 ? 's' : ''}` },
    { label: 'This week', value: `${approvedThisWeek} approved, ${rejectedThisWeek} rejected` },
    { label: 'Avg review time', value: avgReviewHrs },
  ];

  return (
    <div style={{
      display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center',
      padding: '8px 14px', backgroundColor: 'var(--card-bg-tinted)',
      borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)'
    }}>
      {items.map((item, i) => (
        <span key={i} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
          <strong style={{ color: 'var(--body)' }}>{item.label}:</strong> {item.value}
        </span>
      ))}
    </div>
  );
}