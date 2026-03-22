import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LawyerActivityAlerts({ lawyers, cases, contactLogs, onDataRefresh }) {
  const [processing, setProcessing] = useState(null);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Overdue contact: assigned cases > 24h with no contact log
  const overdueContacts = [];
  cases.filter(c => c.status === 'assigned' && c.assigned_at && c.assigned_at < twentyFourHoursAgo && c.assigned_lawyer_id).forEach(c => {
    const hasLog = contactLogs.some(l => l.case_id === c.id);
    if (hasLog) return;
    const lawyer = lawyers.find(l => l.id === c.assigned_lawyer_id);
    if (!lawyer) return;
    const hrs = Math.floor((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60));
    overdueContacts.push({ caseId: c.id, caseName: c.business_name, lawyerName: lawyer.full_name, hoursOverdue: hrs });
  });

  // Pending approval lawyers
  const pendingLawyers = lawyers.filter(l => l.account_status === 'pending_approval');

  const handleApprove = async (lawyer) => {
    setProcessing(lawyer.id + '_approve');
    const now = new Date().toISOString();
    await base44.entities.LawyerProfile.update(lawyer.id, { account_status: 'approved', approved_at: now, date_joined: now });
    setProcessing(null);
    if (onDataRefresh) onDataRefresh();
  };

  const handleReject = async (lawyer) => {
    setProcessing(lawyer.id + '_reject');
    await base44.entities.LawyerProfile.update(lawyer.id, { account_status: 'removed' });
    setProcessing(null);
    if (onDataRefresh) onDataRefresh();
  };

  const noAlerts = overdueContacts.length === 0 && pendingLawyers.length === 0;

  if (noAlerts) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '10px 14px',
        backgroundColor: 'var(--suc-bg)', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0'
      }}>
        <CheckCircle size={16} style={{ color: 'var(--suc-fg)' }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--suc-fg)', fontWeight: 600 }}>
          No alerts — all lawyers are in good standing
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Overdue contacts */}
      {overdueContacts.length > 0 && (
        <div style={{
          backgroundColor: 'var(--err-bg)', border: '1px solid #FECACA',
          borderRadius: 'var(--radius-md)', overflow: 'hidden'
        }}>
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '0.375rem', borderBottom: '1px solid #FECACA' }}>
            <AlertTriangle size={14} style={{ color: 'var(--err-fg)' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--err-fg)' }}>
              Overdue Contact ({overdueContacts.length})
            </span>
          </div>
          {overdueContacts.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '6px 12px', borderBottom: i < overdueContacts.length - 1 ? '1px solid #FECACA' : 'none',
              backgroundColor: '#FFF5F5'
            }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body)' }}>{item.lawyerName}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--body-secondary)' }}>→ {item.caseName}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--err-fg)', marginLeft: 'auto', flexShrink: 0 }}>
                {item.hoursOverdue}h overdue
              </span>
              <Link to={createPageUrl('AdminCases') + `?search=${encodeURIComponent(item.caseName)}`} style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--terra-600)',
                textDecoration: 'none', flexShrink: 0
              }}>View</Link>
            </div>
          ))}
        </div>
      )}

      {/* Pending lawyers */}
      {pendingLawyers.length > 0 && (
        <div style={{
          backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF',
          borderRadius: 'var(--radius-md)', overflow: 'hidden'
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #E9D5FF' }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: '#7C3AED' }}>
              Pending Approval ({pendingLawyers.length})
            </span>
          </div>
          {pendingLawyers.map((l, i) => (
            <div key={l.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '6px 12px', borderBottom: i < pendingLawyers.length - 1 ? '1px solid #E9D5FF' : 'none',
              backgroundColor: '#F3E8FF20'
            }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--body)' }}>{l.full_name}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--body-secondary)' }}>{l.firm_name}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#7C3AED', marginLeft: 'auto', flexShrink: 0 }}>
                Applied {formatDate(l.created_date)}
              </span>
              <button
                type="button"
                disabled={!!processing}
                onClick={() => handleApprove(l)}
                style={{
                  padding: '2px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid #15803D', backgroundColor: 'var(--suc-fg)', color: 'var(--card-bg)',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                  cursor: processing ? 'not-allowed' : 'pointer', flexShrink: 0
                }}
              >
                {processing === l.id + '_approve' ? '…' : 'Approve'}
              </button>
              <button
                type="button"
                disabled={!!processing}
                onClick={() => handleReject(l)}
                style={{
                  padding: '2px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid #B91C1C', backgroundColor: 'transparent', color: 'var(--err-fg)',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                  cursor: processing ? 'not-allowed' : 'pointer', flexShrink: 0
                }}
              >
                {processing === l.id + '_reject' ? '…' : 'Reject'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}