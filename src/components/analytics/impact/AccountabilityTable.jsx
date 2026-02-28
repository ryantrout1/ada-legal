import React, { useMemo } from 'react';

export default function AccountabilityTable({ cases }) {
  const rows = useMemo(() => {
    const clusterMap = {};
    cases.forEach(c => {
      const cid = c.ai_duplicate_cluster_id || `solo_${c.id}`;
      if (!clusterMap[cid]) clusterMap[cid] = {
        businessName: c.business_name || 'Unknown',
        location: `${(c.city || '').trim()}${c.city && c.state ? ', ' : ''}${(c.state || '').trim()}`,
        total: 0,
        violationTypes: new Set(),
        highestSev: 'low',
        firstReport: c.submitted_at || c.created_date,
        hasAttorney: false,
      };
      const cluster = clusterMap[cid];
      cluster.total++;
      if (c.ai_category) cluster.violationTypes.add(c.ai_category.replace(/_/g, ' '));
      else if (c.violation_subtype) cluster.violationTypes.add(c.violation_subtype);
      else if (c.violation_type) cluster.violationTypes.add(c.violation_type === 'physical_space' ? 'Physical' : 'Digital');

      const sevOrder = { high: 3, medium: 2, low: 1 };
      if ((sevOrder[c.ai_severity] || 0) > (sevOrder[cluster.highestSev] || 0)) cluster.highestSev = c.ai_severity;

      const d = new Date(c.submitted_at || c.created_date);
      if (d < new Date(cluster.firstReport)) cluster.firstReport = c.submitted_at || c.created_date;

      if (['assigned', 'in_progress', 'closed'].includes(c.status)) cluster.hasAttorney = true;
    });

    return Object.values(clusterMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 25)
      .map(r => ({ ...r, violationTypes: Array.from(r.violationTypes) }));
  }, [cases]);

  const sevColors = { high: { bg: '#FEE2E2', text: '#B91C1C' }, medium: { bg: '#FEF3C7', text: '#92400E' }, low: { bg: '#DCFCE7', text: '#15803D' } };

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--slate-500)', textAlign: 'left', padding: '8px 10px',
    borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase', letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
    padding: '8px 10px', borderBottom: '1px solid var(--slate-100)', verticalAlign: 'top',
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 4px' }}>
        Which businesses have the most reports?
      </h3>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '0 0 16px' }}>Business Accountability — Top 25</p>

      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={th}>Business Name</th>
              <th style={th}>Location</th>
              <th style={{ ...th, textAlign: 'center' }}>Reports</th>
              <th style={th}>Violation Types</th>
              <th style={{ ...th, textAlign: 'center' }}>Severity</th>
              <th style={th}>First Report</th>
              <th style={{ ...th, textAlign: 'center' }}>Attorney</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontWeight: 600, color: 'var(--slate-900)' }}>{r.businessName}</td>
                <td style={td}>{r.location}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 700, fontSize: '0.9375rem' }}>{r.total}</td>
                <td style={td}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {r.violationTypes.slice(0, 3).map(vt => (
                      <span key={vt} style={{
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '100px',
                        backgroundColor: 'var(--slate-100)', color: 'var(--slate-600)',
                        textTransform: 'capitalize', whiteSpace: 'nowrap',
                      }}>{vt}</span>
                    ))}
                    {r.violationTypes.length > 3 && (
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', color: 'var(--slate-500)' }}>+{r.violationTypes.length - 3}</span>
                    )}
                  </div>
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600,
                    padding: '2px 10px', borderRadius: '100px',
                    backgroundColor: sevColors[r.highestSev]?.bg || '#F1F5F9',
                    color: sevColors[r.highestSev]?.text || 'var(--slate-700)',
                    textTransform: 'capitalize',
                  }}>{r.highestSev}</span>
                </td>
                <td style={td}>{new Date(r.firstReport).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: r.hasAttorney ? '#16A34A' : 'var(--slate-400)' }}>
                  {r.hasAttorney ? 'Yes' : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '16px', fontStyle: 'italic' }}>
        This data represents reports submitted by community members and has not been independently verified. Report counts indicate community concern, not confirmed violations.
      </p>
    </div>
  );
}