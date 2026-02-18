import React from 'react';

export default function ApprovalRejectionSection({ cases }) {
  const total = cases.length;
  const approvedStatuses = ['approved', 'available', 'assigned', 'in_progress', 'closed'];
  const approvedCount = cases.filter(c => approvedStatuses.includes(c.status)).length;
  const rejectedCount = cases.filter(c => c.status === 'rejected').length;

  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejectedCount / total) * 100) : 0;

  // Top 3 rejection reasons
  const rejectedCases = cases.filter(c => c.status === 'rejected' && c.rejection_reason);
  const reasonMap = {};
  rejectedCases.forEach(c => {
    const r = c.rejection_reason.trim();
    if (r) reasonMap[r] = (reasonMap[r] || 0) + 1;
  });
  const topReasons = Object.entries(reasonMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const statBox = {
    backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
    flex: '1 1 200px', minWidth: '180px'
  };
  const statLabel = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
    color: 'var(--slate-500)', margin: '0 0 var(--space-xs) 0'
  };
  const statValue = {
    fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 700,
    color: 'var(--slate-900)', margin: 0, lineHeight: 1.2
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
        color: 'var(--slate-900)', marginBottom: 'var(--space-md)', marginTop: 0
      }}>Approval & Rejection</h2>
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <div style={statBox}>
          <p style={statLabel}>Total Submitted (All Time)</p>
          <p style={statValue}>{total}</p>
        </div>
        <div style={statBox}>
          <p style={statLabel}>Approval Rate</p>
          <p style={{ ...statValue, color: '#15803D' }}>{approvalRate}%</p>
        </div>
        <div style={statBox}>
          <p style={statLabel}>Rejection Rate</p>
          <p style={{ ...statValue, color: rejectionRate > 0 ? '#B91C1C' : 'var(--slate-900)' }}>{rejectionRate}%</p>
        </div>
        <div style={statBox}>
          <p style={statLabel}>Top Rejection Reasons</p>
          {topReasons.length === 0 ? (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-400)', margin: 0 }}>No rejections yet</p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {topReasons.map(([reason, count]) => (
                <li key={reason} style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  color: 'var(--slate-700)', marginBottom: '0.25rem'
                }}>
                  {reason} <span style={{ color: 'var(--slate-400)' }}>({count})</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}