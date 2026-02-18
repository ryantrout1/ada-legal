import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATE_NAME_TO_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
  'Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY',
  'Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
  'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
  'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
};

function normalizeState(s) {
  if (!s) return null;
  const trimmed = s.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed] || trimmed;
}

export default function GeographicSection({ cases }) {
  // Cases by state (normalized to 2-letter codes)
  const stateMap = {};
  cases.forEach(c => {
    const st = normalizeState(c.state);
    if (st) stateMap[st] = (stateMap[st] || 0) + 1;
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
    borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem'
  };
  const subhead = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
    color: 'var(--slate-800)', marginBottom: '0.5rem', marginTop: 0
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
        color: 'var(--slate-900)', marginBottom: '0.5rem', marginTop: 0
      }}>Geographic Distribution</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* By State */}
        <div style={cardStyle}>
          <p style={subhead}>Cases by State</p>
          {stateData.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.8125rem' }}>No data yet</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(140, stateData.length * 24) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} layout="vertical" barSize={14} margin={{ left: 5, right: 15, top: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-500)' }} />
                  <YAxis type="category" dataKey="name" width={32} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-700)' }} />
                  <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                  <Bar dataKey="count" fill="var(--terra-600)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* By City top 10 */}
        <div style={cardStyle}>
          <p style={subhead}>Top 10 Cities</p>
          {cityData.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.8125rem' }}>No data yet</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(140, cityData.length * 24) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} layout="vertical" barSize={14} margin={{ left: 5, right: 15, top: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-500)' }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-700)' }} />
                  <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                  <Bar dataKey="count" fill="var(--terra-600)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}