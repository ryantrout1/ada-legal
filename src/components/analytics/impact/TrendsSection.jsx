import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function TrendsSection({ cases }) {
  const [showTable, setShowTable] = useState(false);

  const { chartData, callouts } = useMemo(() => {
    // Group by month
    const monthMap = {};
    cases.forEach(c => {
      const d = new Date(c.submitted_at || c.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { month: key, physical: 0, digital: 0 };
      if (c.violation_type === 'digital_website') monthMap[key].digital++;
      else monthMap[key].physical++;
    });
    const sorted = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // Callouts
    const bizTypeMap = {};
    const categoryMap = {};
    const businessMap = {};
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevPrevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevPrevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

    const catThisMonth = {};
    const catLastMonth = {};

    cases.forEach(c => {
      const bt = c.business_type || 'Other';
      bizTypeMap[bt] = (bizTypeMap[bt] || 0) + 1;

      const cat = c.ai_category || c.violation_subtype || c.violation_type || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      const bn = c.business_name || 'Unknown';
      businessMap[bn] = (businessMap[bn] || 0) + 1;

      const d = new Date(c.submitted_at || c.created_date);
      if (d >= prevMonthStart && d <= prevMonthEnd) catThisMonth[cat] = (catThisMonth[cat] || 0) + 1;
      if (d >= prevPrevStart && d <= prevPrevEnd) catLastMonth[cat] = (catLastMonth[cat] || 0) + 1;
    });

    const topBizType = Object.entries(bizTypeMap).sort((a, b) => b[1] - a[1])[0];
    const topBusiness = Object.entries(businessMap).sort((a, b) => b[1] - a[1])[0];

    // Fastest growing category
    let fastestGrowing = null;
    let bestGrowth = 0;
    Object.entries(catThisMonth).forEach(([cat, count]) => {
      const prev = catLastMonth[cat] || 0;
      if (prev > 0) {
        const growth = ((count - prev) / prev) * 100;
        if (growth > bestGrowth) { bestGrowth = growth; fastestGrowing = { cat, growth: Math.round(growth), count }; }
      } else if (count > 1) {
        fastestGrowing = fastestGrowing || { cat, growth: 100, count };
      }
    });

    return {
      chartData: sorted,
      callouts: {
        topBizType: topBizType ? { name: topBizType[0], count: topBizType[1] } : null,
        fastestGrowing,
        topBusiness: topBusiness ? { name: topBusiness[0], count: topBusiness[1] } : null,
      }
    };
  }, [cases]);

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: 0 }}>
            How is reporting trending?
          </h3>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '2px 0 0' }}>Patterns & Trends</p>
        </div>
        <button onClick={() => setShowTable(!showTable)} style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', padding: '6px 12px', minHeight: '44px',
          border: '1px solid var(--slate-300)', borderRadius: '6px', backgroundColor: 'white',
          cursor: 'pointer', color: 'var(--slate-600)',
        }}>
          {showTable ? 'Show Chart' : 'Show Data Table'}
        </button>
      </div>

      {showTable ? (
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-500)', borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase' }}>Month</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-500)', borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase' }}>Physical</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-500)', borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase' }}>Digital</th>
            </tr></thead>
            <tbody>{chartData.map(d => (
              <tr key={d.month}>
                <td style={{ padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)' }}>{d.month}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)' }}>{d.physical}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', borderBottom: '1px solid var(--slate-100)' }}>{d.digital}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="sr-only">
            <table><caption>Reports by month</caption>
              <thead><tr><th>Month</th><th>Physical</th><th>Digital</th></tr></thead>
              <tbody>{chartData.map(d => <tr key={d.month}><td>{d.month}</td><td>{d.physical}</td><td>{d.digital}</td></tr>)}</tbody>
            </table>
          </div>
          <div aria-hidden="true" style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" />
                <XAxis dataKey="month" tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-500)' }} />
                <YAxis allowDecimals={false} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: 'var(--slate-500)' }} />
                <Tooltip contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                <Line type="monotone" dataKey="physical" stroke="#C2410C" strokeWidth={2} name="Physical" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="digital" stroke="#1D4ED8" strokeWidth={2} name="Digital" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Callouts */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        {callouts.topBizType && (
          <div style={{ flex: '1 1 200px', padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '8px' }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Reported Business Type</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>
              {callouts.topBizType.name} <span style={{ fontWeight: 400, color: 'var(--slate-500)' }}>({callouts.topBizType.count})</span>
            </div>
          </div>
        )}
        {callouts.fastestGrowing && (
          <div style={{ flex: '1 1 200px', padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '8px' }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fastest Growing Category</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px', textTransform: 'capitalize' }}>
              {callouts.fastestGrowing.cat.replace(/_/g, ' ')} <span style={{ fontWeight: 400, color: '#15803D' }}>↑{callouts.fastestGrowing.growth}%</span>
            </div>
          </div>
        )}
        {callouts.topBusiness && (
          <div style={{ flex: '1 1 200px', padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: '8px' }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Reported Business</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>
              {callouts.topBusiness.name} <span style={{ fontWeight: 400, color: 'var(--slate-500)' }}>({callouts.topBusiness.count})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}