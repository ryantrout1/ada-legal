import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';

export default function AttorneyAlertBar({ lawyers, cases, contactLogs, onQuickApprove }) {
  const [expanded, setExpanded] = useState(false);

  const { pending, overdue, totalIssues } = useMemo(() => {
    const pendingList = lawyers.filter(l => l.account_status === 'pending_approval');

    const overdueList = [];
    cases.filter(c => c.assigned_at && c.assigned_lawyer_id && (c.status === 'assigned' || c.status === 'in_progress')).forEach(c => {
      const hrs = (Date.now() - new Date(c.assigned_at).getTime()) / 3600000;
      if (hrs > 24 && !contactLogs.some(l => l.case_id === c.id)) {
        const lawyer = lawyers.find(l => l.id === c.assigned_lawyer_id);
        overdueList.push({ caseData: c, lawyer, hoursOverdue: Math.round(hrs - 24) });
      }
    });

    return { pending: pendingList, overdue: overdueList, totalIssues: pendingList.length + overdueList.length };
  }, [lawyers, cases, contactLogs]);

  if (totalIssues === 0) return null;

  return (
    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #FDE68A' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', width: '100%', alignItems: 'center', gap: '8px',
          padding: '10px 16px', minHeight: '44px',
          backgroundColor: '#FEF3C7', border: 'none', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#92400E',
          textAlign: 'left',
        }}
      >
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          {totalIssues} attorney{totalIssues !== 1 ? 's' : ''} need attention
          {pending.length > 0 ? ` · ${pending.length} pending approval` : ''}
          {overdue.length > 0 ? ` · ${overdue.length} with overdue contact` : ''}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div style={{ backgroundColor: '#FFFBEB', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pending.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
                Pending Approvals
              </p>
              {pending.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)' }}>{l.full_name}</span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>{l.firm_name}</span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    Applied {new Date(l.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickApprove(l); }}
                    style={{
                      marginLeft: 'auto', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                      color: '#15803D', backgroundColor: '#DCFCE7', border: 'none', borderRadius: '6px',
                      padding: '4px 12px', minHeight: '36px', cursor: 'pointer',
                    }}
                  >
                    Quick Approve ✓
                  </button>
                </div>
              ))}
            </div>
          )}

          {overdue.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
                Overdue Contact
              </p>
              {overdue.map(o => (
                <div key={o.caseData.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)' }}>{o.lawyer?.full_name || 'Unknown'}</span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>→ {o.caseData.business_name}</span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>{o.hoursOverdue}h overdue</span>
                  <Link
                    to={createPageUrl('AdminCases') + `?search=${o.caseData.id?.slice(0, 8)}`}
                    style={{
                      marginLeft: 'auto', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                      color: 'var(--terra-600)', textDecoration: 'none', minHeight: '44px', display: 'inline-flex', alignItems: 'center',
                    }}
                  >
                    View Case →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}