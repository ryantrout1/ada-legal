import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

const ACTIVE_COLOR = '#9A3412';
const DEFAULT_COLOR = '#C2410C';
const FADED_COLOR = '#C2410C80';

export default function GeographicSection({ cases, filters, onFilterChange }) {
  const activeState = filters.state;
  const activeCity = filters.city;

  const stateMap = {};
  cases.forEach(c => {
    const st = normalizeState(c.state);
    if (st) stateMap[st] = (stateMap[st] || 0) + 1;
  });
  const stateData = Object.entries(stateMap)
    .map(([state, count]) => ({ name: state, count }))
    .sort((a, b) => b.count - a.count);

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

  const handleStateClick = (data) => {
    if (!data?.name) return;
    onFilterChange('state', data.name === activeState ? null : data.name);
  };

  const handleCityClick = (data) => {
    if (!data?.name) return;
    onFilterChange('city', data.name === activeCity ? null : data.name);
  };

  const cardStyle = {
    backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
    borderRadius: 'var(--radius-md)', padding: '12px'
  };
  const subhead = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
    color: 'var(--slate-800)', marginBottom: '0.5rem', marginTop: 0
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={cardStyle}>
          <p style={subhead}>Cases by State</p>
          {stateData.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.8125rem' }}>No data yet</p>
          ) : (
            <>
            <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
              <table>
                <caption>Cases by State data</caption>
                <thead><tr><th scope="col">State</th><th scope="col">Count</th></tr></thead>
                <tbody>{stateData.map(d => <tr key={d.name}><td>{d.name}</td><td>{d.count}</td></tr>)}</tbody>
              </table>
            </div>
            <div aria-hidden="true" style={{ width: '100%', height: Math.max(140, stateData.length * 24) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} layout="vertical" barSize={14} margin={{ left: 5, right: 15, top: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-500)' }} />
                  <YAxis type="category" dataKey="name" width={32} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-700)' }} />
                  <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} cursor="pointer" onClick={handleStateClick}>
                    {stateData.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={activeState ? (entry.name === activeState ? ACTIVE_COLOR : FADED_COLOR) : DEFAULT_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </>
          )}
        </div>

        <div style={cardStyle}>
          <p style={subhead}>Top 10 Cities</p>
          {cityData.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)', fontSize: '0.8125rem' }}>No data yet</p>
          ) : (
            <>
            <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
              <table>
                <caption>Top Cities data</caption>
                <thead><tr><th scope="col">City</th><th scope="col">Count</th></tr></thead>
                <tbody>{cityData.map(d => <tr key={d.name}><td>{d.name}</td><td>{d.count}</td></tr>)}</tbody>
              </table>
            </div>
            <div aria-hidden="true" style={{ width: '100%', height: Math.max(140, cityData.length * 24) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} layout="vertical" barSize={14} margin={{ left: 5, right: 15, top: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-500)' }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: 'var(--slate-700)' }} />
                  <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} cursor="pointer" onClick={handleCityClick}>
                    {cityData.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={activeCity ? (entry.name === activeCity ? ACTIVE_COLOR : FADED_COLOR) : DEFAULT_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}