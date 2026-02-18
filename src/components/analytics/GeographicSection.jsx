import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GeographicSection({ cases }) {
  // Cases by state
  const stateMap = {};
  cases.forEach(c => {
    if (c.state) stateMap[c.state] = (stateMap[c.state] || 0) + 1;
  });
  const stateData = Object.entries(stateMap)
    .map(([state, count]) => ({ name: state, count }))
    .sort((a, b) => b.count - a.count);

  // Cases by city — top 10
  const cityMap = {};
  cases.forEach(c => {
    if (c.city) {
      const key = c.city.trim();
      if (key) cityMap[key] = (cityMap[key] || 0) + 1;
    }
  });
  const cityData = Object.entries(cityMap)
    .map(([city, count]) => ({ name: city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Violation type split
  const physical = cases.filter(c => c.violation_type === 'physical_space').length;
  const digital = cases.filter(c => c.violation_type === 'digital_website').length;
  const total = physical + digital;

  const cardStyle = {
    backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)'
  };
  const subhead = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
    color: 'var(--slate-800)', marginBottom: 'var(--space-md)', marginTop: 0
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
        color: 'var(--slate-900)', marginBottom: 'var(--space-md)', marginTop: 0
      }}>Geographic Distribution</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* By State */}
        <div style={cardStyle}>
          <p style={subhead}>Cases by State</p>
          {stateData.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.875rem' }}>No data yet</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(200, stateData.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fill: 'var(--slate-500)' }} />
                  <YAxis type="category" dataKey="name" width={40} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fill: 'var(--slate-700)' }} />
                  <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 13 }} />
                  <Bar dataKey="count" fill="var(--terra-600)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* By City top 10 */}
        <div style={cardStyle}>
          <p style={subhead}>Top 10 Cities</p>
          {cityData.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.875rem' }}>No data yet</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(200, cityData.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fill: 'var(--slate-500)' }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-700)' }} />
                  <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 13 }} />
                  <Bar dataKey="count" fill="var(--terra-600)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Violation type split */}
      <div style={{ ...cardStyle, marginTop: 'var(--space-lg)' }}>
        <p style={subhead}>Violation Type Split</p>
        <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'var(--terra-600)' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)' }}>
              Physical Space: <strong>{physical}</strong>{total > 0 && ` (${Math.round((physical / total) * 100)}%)`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#1D4ED8' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)' }}>
              Digital / Website: <strong>{digital}</strong>{total > 0 && ` (${Math.round((digital / total) * 100)}%)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}