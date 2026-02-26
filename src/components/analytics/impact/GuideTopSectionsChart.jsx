import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function GuideTopSectionsChart({ events }) {
  const data = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const name = e.properties?.section_name || 'Unknown';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 28 ? name.slice(0, 26) + '…' : name, count, fullName: name }));
  }, [events]);

  if (data.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-400)' }}>No section view data yet</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '16px' }}>
      <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
        Most Viewed Sections
      </h4>
      <div className="sr-only">
        <table><caption>Top 10 viewed guide sections</caption>
          <thead><tr><th>Section</th><th>Views</th></tr></thead>
          <tbody>{data.map(d => <tr key={d.fullName}><td>{d.fullName}</td><td>{d.count}</td></tr>)}</tbody>
        </table>
      </div>
      <div aria-hidden="true" style={{ width: '100%', height: Math.max(200, data.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={18} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-500)' }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-700)' }} />
            <Tooltip
              contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }}
              formatter={(value, name, props) => [value, 'Views']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="count" fill="#1D4ED8" radius={[0, 4, 4, 0]} name="Views" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}