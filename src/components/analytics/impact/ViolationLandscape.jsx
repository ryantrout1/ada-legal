import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const CATEGORY_LABELS = {
  'physical_entrance': 'Entrance/Exit',
  'physical_restroom': 'Restroom',
  'physical_parking': 'Parking',
  'physical_path': 'Path of Travel',
  'physical_service_animal': 'Service Animal',
  'digital_screen_reader': 'Screen Reader',
  'digital_keyboard_nav': 'Keyboard Nav',
  'digital_forms': 'Digital Forms',
  'digital_video_captions': 'Video Captions',
  'Parking': 'Parking',
  'Entrance': 'Entrance/Exit',
  'Restroom': 'Restroom',
  'Path': 'Path of Travel',
  'Service Animal': 'Service Animal',
  'Other': 'Other',
};

const SEV_COLORS = { high: '#DC2626', medium: '#D97706', low: '#16A34A' };

export default function ViolationLandscape({ cases }) {
  const [showTable, setShowTable] = useState(false);

  const data = useMemo(() => {
    const catMap = {};
    cases.forEach(c => {
      let cat = c.ai_category || c.violation_subtype || c.violation_type || 'other';
      const label = CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (!catMap[label]) catMap[label] = { name: label, high: 0, medium: 0, low: 0, total: 0 };
      const sev = c.ai_severity || 'low';
      catMap[label][sev]++;
      catMap[label].total++;
    });
    return Object.values(catMap).sort((a, b) => b.total - a.total);
  }, [cases]);

  const totalCases = cases.length;

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: 0 }}>
            What barriers are people reporting most?
          </h3>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '2px 0 0' }}>Violation Landscape</p>
        </div>
        <button
          onClick={() => setShowTable(!showTable)}
          style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', padding: '6px 12px', minHeight: '44px',
            border: '1px solid var(--slate-300)', borderRadius: '6px', backgroundColor: 'white',
            cursor: 'pointer', color: 'var(--slate-600)',
          }}
        >
          {showTable ? 'Show Chart' : 'Show Data Table'}
        </button>
      </div>

      {showTable ? (
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', borderBottom: '2px solid var(--slate-200)' }}>Category</th>
                <th style={{ textAlign: 'center', padding: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', borderBottom: '2px solid var(--slate-200)' }}>Total</th>
                <th style={{ textAlign: 'center', padding: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#991B1B', borderBottom: '2px solid var(--slate-200)' }}>High</th>
                <th style={{ textAlign: 'center', padding: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#D97706', borderBottom: '2px solid var(--slate-200)' }}>Medium</th>
                <th style={{ textAlign: 'center', padding: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A', borderBottom: '2px solid var(--slate-200)' }}>Low</th>
                <th style={{ textAlign: 'center', padding: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', borderBottom: '2px solid var(--slate-200)' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.name}>
                  <td style={{ padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, borderBottom: '1px solid var(--slate-100)' }}>{d.name}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)' }}>{d.total}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)', color: '#991B1B' }}>{d.high}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)', color: '#D97706' }}>{d.medium}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)', color: '#16A34A' }}>{d.low}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)', color: 'var(--slate-500)' }}>{totalCases > 0 ? Math.round((d.total / totalCases) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* SR-only table */}
          <div className="sr-only">
            <table><caption>Violation landscape data</caption>
              <thead><tr><th>Category</th><th>High</th><th>Medium</th><th>Low</th><th>Total</th></tr></thead>
              <tbody>{data.map(d => <tr key={d.name}><td>{d.name}</td><td>{d.high}</td><td>{d.medium}</td><td>{d.low}</td><td>{d.total}</td></tr>)}</tbody>
            </table>
          </div>
          <div aria-hidden="true" style={{ width: '100%', height: Math.max(200, data.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" barSize={20} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-500)' }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-700)' }} />
                <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                <Bar dataKey="high" stackId="a" fill={SEV_COLORS.high} name="High Severity" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill={SEV_COLORS.medium} name="Medium" />
                <Bar dataKey="low" stackId="a" fill={SEV_COLORS.low} name="Low" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}