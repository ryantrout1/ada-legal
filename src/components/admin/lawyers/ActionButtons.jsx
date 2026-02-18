import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, Trash2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const btnBase = {
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
  fontSize: '0.875rem', fontWeight: 700, color: 'white',
  border: 'none', borderRadius: 'var(--radius-md)',
  cursor: 'pointer', minHeight: '44px', transition: 'opacity 0.15s'
};

function ConfirmModal({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)'
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'white', borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)', maxWidth: '480px', width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 0.5rem' }}>
          {title}
        </h3>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-600)', lineHeight: 1.6, margin: '0 0 1rem' }}>
          {message}
        </p>
        {children}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onCancel} style={{
            ...btnBase, color: 'var(--slate-700)', backgroundColor: 'white',
            border: '1px solid var(--slate-200)'
          }}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ ...btnBase, backgroundColor: confirmColor }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActionButtons({ lawyer, cases, contactLogs, onRefresh, onToast }) {
  const [modal, setModal] = useState(null); // 'reject'|'suspend'|'remove'|'reassign'
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [processing, setProcessing] = useState(false);

  const status = lawyer.account_status;
  const activeCases = cases.filter(c =>
    c.assigned_lawyer_id === lawyer.id && (c.status === 'assigned' || c.status === 'in_progress')
  );
  const showReassign = activeCases.length > 0 && (status === 'suspended' || status === 'removed');

  const handleApprove = async () => {
    setProcessing(true);
    const now = new Date().toISOString();
    const updates = { account_status: 'approved', approved_at: now };
    if (!lawyer.date_joined) updates.date_joined = now;
    await base44.entities.LawyerProfile.update(lawyer.id, updates);
    onToast('Lawyer approved successfully.');
    await onRefresh();
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setProcessing(true);
    await base44.entities.LawyerProfile.update(lawyer.id, { account_status: 'removed' });
    onToast('Lawyer rejected.');
    setModal(null);
    setReason('');
    await onRefresh();
    setProcessing(false);
  };

  const handleSuspend = async () => {
    if (!reason.trim()) return;
    setProcessing(true);
    await base44.entities.LawyerProfile.update(lawyer.id, {
      account_status: 'suspended', flagged: true, flag_reason: reason.trim()
    });
    onToast('Lawyer suspended.');
    setModal(null);
    setReason('');
    await onRefresh();
    setProcessing(false);
  };

  const handleReinstate = async () => {
    setProcessing(true);
    await base44.entities.LawyerProfile.update(lawyer.id, {
      account_status: 'approved', flagged: false, flag_reason: ''
    });
    onToast('Lawyer reinstated.');
    await onRefresh();
    setProcessing(false);
  };

  const handleRemove = async () => {
    if (confirmText !== 'REMOVE') return;
    setProcessing(true);
    await base44.entities.LawyerProfile.update(lawyer.id, { account_status: 'removed' });
    onToast('Lawyer removed.');
    setModal(null);
    setConfirmText('');
    await onRefresh();
    setProcessing(false);
  };

  const handleReassign = async () => {
    setProcessing(true);
    const now = new Date().toISOString();
    for (const c of activeCases) {
      await base44.entities.Case.update(c.id, {
        status: 'available',
        assigned_lawyer_id: '',
        assigned_at: '',
        contact_logged_at: ''
      });
      await base44.entities.TimelineEvent.create({
        case_id: c.id,
        event_type: 'reclaimed',
        event_description: 'Case returned to marketplace by admin.',
        actor_role: 'admin',
        visible_to_user: false,
        created_at: now
      });
    }
    await base44.entities.LawyerProfile.update(lawyer.id, {
      cases_reclaimed: (lawyer.cases_reclaimed || 0) + activeCases.length
    });
    onToast(`${activeCases.length} case(s) returned to marketplace.`);
    setModal(null);
    await onRefresh();
    setProcessing(false);
  };

  const disabledStyle = processing ? { opacity: 0.5, pointerEvents: 'none' } : {};

  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem', marginTop: '0.5rem',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
    border: '1px solid var(--slate-300)', borderRadius: 'var(--radius-sm)',
    color: 'var(--slate-800)', outline: 'none'
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', ...disabledStyle }}>
        {status === 'pending_approval' && (
          <>
            <button type="button" onClick={handleApprove} style={{ ...btnBase, backgroundColor: '#15803D' }}>
              <CheckCircle size={16} /> Approve
            </button>
            <button type="button" onClick={() => { setReason(''); setModal('reject'); }} style={{ ...btnBase, backgroundColor: '#B91C1C' }}>
              <XCircle size={16} /> Reject
            </button>
          </>
        )}
        {status === 'approved' && (
          <>
            <button type="button" onClick={() => { setReason(''); setModal('suspend'); }} style={{ ...btnBase, backgroundColor: '#D97706' }}>
              <AlertTriangle size={16} /> Suspend
            </button>
            <button type="button" onClick={() => { setConfirmText(''); setModal('remove'); }} style={{ ...btnBase, backgroundColor: '#B91C1C' }}>
              <Trash2 size={16} /> Remove
            </button>
          </>
        )}
        {status === 'suspended' && (
          <>
            <button type="button" onClick={handleReinstate} style={{ ...btnBase, backgroundColor: '#15803D' }}>
              <RotateCcw size={16} /> Reinstate
            </button>
            <button type="button" onClick={() => { setConfirmText(''); setModal('remove'); }} style={{ ...btnBase, backgroundColor: '#B91C1C' }}>
              <Trash2 size={16} /> Remove
            </button>
          </>
        )}
        {showReassign && (
          <button type="button" onClick={() => setModal('reassign')} style={{ ...btnBase, backgroundColor: 'var(--slate-700)' }}>
            <RefreshCw size={16} /> Reassign Cases ({activeCases.length})
          </button>
        )}
      </div>

      {/* Reject Modal */}
      <ConfirmModal
        open={modal === 'reject'}
        title="Reject Lawyer"
        message="Please provide a reason for rejecting this application."
        confirmLabel="Reject"
        confirmColor="#B91C1C"
        onConfirm={handleReject}
        onCancel={() => setModal(null)}
      >
        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection (required)..." style={inputStyle} />
      </ConfirmModal>

      {/* Suspend Modal */}
      <ConfirmModal
        open={modal === 'suspend'}
        title="Suspend Lawyer"
        message="Please provide a reason for suspending this lawyer."
        confirmLabel="Suspend"
        confirmColor="#D97706"
        onConfirm={handleSuspend}
        onCancel={() => setModal(null)}
      >
        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for suspension (required)..." style={inputStyle} />
      </ConfirmModal>

      {/* Remove Modal */}
      <ConfirmModal
        open={modal === 'remove'}
        title="Remove Lawyer"
        message="This will permanently remove this lawyer and return their active cases to the marketplace. This cannot be undone."
        confirmLabel="Remove"
        confirmColor="#B91C1C"
        onConfirm={handleRemove}
        onCancel={() => setModal(null)}
      >
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)', margin: '0 0 0.25rem' }}>
            Type <strong>REMOVE</strong> to confirm:
          </p>
          <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)}
            placeholder="REMOVE" style={inputStyle} />
        </div>
      </ConfirmModal>

      {/* Reassign Modal */}
      <ConfirmModal
        open={modal === 'reassign'}
        title="Reassign Cases"
        message={`This will return ${activeCases.length} active case(s) to the marketplace. Claimants will not be notified.`}
        confirmLabel="Reassign Cases"
        confirmColor="var(--slate-700)"
        onConfirm={handleReassign}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}