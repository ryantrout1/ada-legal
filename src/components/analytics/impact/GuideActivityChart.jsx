import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

export default function GuideActivityChart({ events, days, range }) {
  const data = useMemo(() => {
    const numDays = range === 'all' ? 90 : days;
    const dayMap = {};
    for (let i = numDays - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dayMap[d] = 0;
    }
    events.forEach(e => {
      const d = format(new Date(e.created_date), 'yyyy-MM-dd');
      if (d in dayMap) dayMap[d]++;
    });
    return Object.entries(dayMap).map(([date, views]) => ({
      date,
      label: format(new Date(date + 'T12:00:00'), 'MMM d'),
      views,
    }));
  }, [events, days, range]);

  if (data.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-400)' }}>No activity data yet</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
      <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
        Guide Activity Over Time
      </h4>
      <div className="sr-only">
        <table><caption>Guide views per day</caption>
          <thead><tr><th>Date</th><th>Views</th></tr></thead>
          <tbody>{data.map(d => <tr key={d.date}><td>{d.label}</td><td>{d.views}</td></tr>)}</tbody>
        </table>
      </div>
      <div aria-hidden="true" style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-500)' }}
              interval={Math.max(0, Math.floor(data.length / 7) - 1)}
            />
            <YAxis allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-500)' }} />
            <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
            <Line type="monotone" dataKey="views" stroke="#C2410C" strokeWidth={2} name="Guide Views" dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}