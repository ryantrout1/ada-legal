import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, Trash2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useFocusTrap } from '../../a11y/FocusTrap';

const btnBase = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '10px 20px', fontFamily: 'Manrope, sans-serif',
  fontSize: '0.9375rem', fontWeight: 700, color: 'var(--card-bg)',
  border: 'none', borderRadius: '8px',
  cursor: 'pointer', minHeight: '44px', transition: 'opacity 0.15s'
};

function ActionModal({ open, title, headerColor, message, confirmLabel, confirmColor, confirmDisabled, onConfirm, onCancel, saving, children }) {
  const trapRef = useFocusTrap(open, () => { if (!saving) onCancel(); });
  if (!open) return null;
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="action-modal-heading"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem'
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onCancel(); }}
    >
      <div ref={trapRef} style={{
        backgroundColor: 'var(--card-bg)', borderRadius: '16px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflow: 'auto'
      }}>
        {/* Colored header bar */}
        <div style={{ height: '6px', backgroundColor: headerColor || 'var(--body-secondary)', borderRadius: '16px 16px 0 0' }} />
        <div style={{ padding: '24px' }}>
          <h2 id="action-modal-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
            color: 'var(--heading)', margin: '0 0 8px'
          }}>
            {title}
          </h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
            {message}
          </p>
          {children}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={onCancel} disabled={saving} style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
              color: 'var(--body-secondary)', backgroundColor: 'transparent', border: 'none',
              cursor: 'pointer', padding: '8px 16px', minHeight: '44px'
            }}>
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={confirmDisabled || saving} style={{
              ...btnBase,
              backgroundColor: (confirmDisabled || saving) ? 'var(--body-secondary)' : confirmColor,
              cursor: (confirmDisabled || saving) ? 'not-allowed' : 'pointer'
            }}>
              {saving ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionButtons({ lawyer, cases, contactLogs, onRefresh, onToast }) {
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [processing, setProcessing] = useState(false);

  const status = lawyer.account_status;
  const activeCases = cases.filter(c =>
    c.assigned_lawyer_id === lawyer.id && (c.status === 'assigned' || c.status === 'in_progress')
  );
  const showReassign = activeCases.length > 0 && (status === 'approved' || status === 'suspended');

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
    setModal(null); setReason('');
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
    setModal(null); setReason('');
    await onRefresh();
    setProcessing(false);
  };

  const handleReinstate = async () => {
    setProcessing(true);
    await base44.entities.LawyerProfile.update(lawyer.id, {
      account_status: 'approved', flagged: false, flag_reason: ''
    });
    onToast('Lawyer reinstated.');
    setModal(null); setReason('');
    await onRefresh();
    setProcessing(false);
  };

  const handleRemove = async () => {
    if (confirmText !== 'REMOVE') return;
    setProcessing(true);
    // Return active cases first
    const now = new Date().toISOString();
    for (const c of activeCases) {
      await base44.entities.Case.update(c.id, { status: 'available', assigned_lawyer_id: '', assigned_at: '' });
      await base44.entities.TimelineEvent.create({
        case_id: c.id, event_type: 'reclaimed',
        event_description: 'Case returned to available pool by admin.',
        actor_role: 'admin', visible_to_user: false, created_at: now
      });
    }
    await base44.entities.LawyerProfile.update(lawyer.id, { account_status: 'removed' });
    onToast('Lawyer removed.');
    setModal(null); setConfirmText('');
    await onRefresh();
    setProcessing(false);
  };

  const handleReassign = async () => {
    setProcessing(true);
    const now = new Date().toISOString();
    for (const c of activeCases) {
      await base44.entities.Case.update(c.id, { status: 'available', assigned_lawyer_id: '', assigned_at: '', contact_logged_at: '' });
      await base44.entities.TimelineEvent.create({
        case_id: c.id, event_type: 'reclaimed',
        event_description: 'Case returned to available pool by admin.',
        actor_role: 'admin', visible_to_user: false, created_at: now
      });
    }
    await base44.entities.LawyerProfile.update(lawyer.id, {
      cases_reclaimed: (lawyer.cases_reclaimed || 0) + activeCases.length
    });
    onToast(`${activeCases.length} case(s) returned to available pool.`);
    setModal(null);
    await onRefresh();
    setProcessing(false);
  };

  const disabledStyle = processing ? { opacity: 0.5, pointerEvents: 'none' } : {};

  const inputStyle = {
    width: '100%', padding: '10px 12px', marginTop: '8px',
    fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
    border: '2px solid var(--card-border)', borderRadius: '8px',
    color: 'var(--body)', outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', ...disabledStyle }}>
        {status === 'pending_approval' && (
          <>
            <button type="button" onClick={handleApprove} style={{ ...btnBase, backgroundColor: 'var(--suc-fg)' }}>
              <CheckCircle size={16} /> Approve
            </button>
            <button type="button" onClick={() => { setReason(''); setModal('reject'); }} style={{ ...btnBase, backgroundColor: 'var(--err-fg)' }}>
              <XCircle size={16} /> Reject
            </button>
          </>
        )}
        {status === 'approved' && (
          <>
            <button type="button" onClick={() => { setReason(''); setModal('suspend'); }} style={{ ...btnBase, backgroundColor: 'var(--wrn-fg)' }}>
              <AlertTriangle size={16} /> Suspend
            </button>
            <button type="button" onClick={() => { setConfirmText(''); setModal('remove'); }} style={{ ...btnBase, backgroundColor: 'var(--err-fg)' }}>
              <Trash2 size={16} /> Remove
            </button>
          </>
        )}
        {status === 'suspended' && (
          <>
            <button type="button" onClick={() => { setReason(''); setModal('reinstate'); }} style={{ ...btnBase, backgroundColor: 'var(--suc-fg)' }}>
              <RotateCcw size={16} /> Reinstate
            </button>
            <button type="button" onClick={() => { setConfirmText(''); setModal('remove'); }} style={{ ...btnBase, backgroundColor: 'var(--err-fg)' }}>
              <Trash2 size={16} /> Remove
            </button>
          </>
        )}
        {showReassign && (
          <button type="button" onClick={() => setModal('reassign')} style={{
            ...btnBase, color: 'var(--wrn-fg)', backgroundColor: 'transparent',
            border: '2px solid #92400E'
          }}>
            <RefreshCw size={16} /> Reassign {activeCases.length} Case{activeCases.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Reject Modal */}
      <ActionModal
        open={modal === 'reject'} title="Reject Application" headerColor="#B91C1C"
        message="Please provide a reason for rejecting this lawyer's application."
        confirmLabel="Reject" confirmColor="#B91C1C"
        confirmDisabled={!reason.trim()} onConfirm={handleReject}
        onCancel={() => setModal(null)} saving={processing}
      >
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection (required)…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </ActionModal>

      {/* Suspend Modal */}
      <ActionModal
        open={modal === 'suspend'} title="Suspend Lawyer" headerColor="#92400E"
        message="Please provide a reason for suspending this lawyer's access."
        confirmLabel="Suspend" confirmColor="#92400E"
        confirmDisabled={!reason.trim()} onConfirm={handleSuspend}
        onCancel={() => setModal(null)} saving={processing}
      >
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for suspension (required)…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        {activeCases.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px',
            backgroundColor: '#FEF9C3', borderRadius: '8px', marginTop: '12px'
          }}>
            <AlertTriangle size={16} style={{ color: 'var(--wrn-fg)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--wrn-fg)', margin: 0, lineHeight: 1.5 }}>
              This lawyer has {activeCases.length} active case(s). You can reassign them after suspending.
            </p>
          </div>
        )}
      </ActionModal>

      {/* Reinstate Modal */}
      <ActionModal
        open={modal === 'reinstate'} title="Reinstate Lawyer" headerColor="#15803D"
        message="This will restore the lawyer's access to the attorney network."
        confirmLabel="Reinstate" confirmColor="#15803D"
        confirmDisabled={false} onConfirm={handleReinstate}
        onCancel={() => setModal(null)} saving={processing}
      >
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Notes (optional)…" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </ActionModal>

      {/* Remove Modal */}
      <ActionModal
        open={modal === 'remove'} title="Remove Lawyer" headerColor="#B91C1C"
        message="This will permanently remove this lawyer. Active cases will be returned to the available case pool. This cannot be undone."
        confirmLabel="Remove" confirmColor="#B91C1C"
        confirmDisabled={confirmText !== 'REMOVE'} onConfirm={handleRemove}
        onCancel={() => setModal(null)} saving={processing}
      >
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', margin: '0 0 4px' }}>
            Type <strong>REMOVE</strong> to confirm:
          </p>
          <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)}
            placeholder="REMOVE" style={inputStyle} />
        </div>
      </ActionModal>

      {/* Reassign Modal */}
      <ActionModal
        open={modal === 'reassign'} title="Reassign Cases" headerColor="#92400E"
        message={`This will return ${activeCases.length} active case(s) to the available case pool. Reporters will not be notified.`}
        confirmLabel="Reassign Cases" confirmColor="#92400E"
        confirmDisabled={false} onConfirm={handleReassign}
        onCancel={() => setModal(null)} saving={processing}
      />
    </div>
  );
}