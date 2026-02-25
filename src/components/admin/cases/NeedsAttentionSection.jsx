import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import AssignLawyerDropdown from './AssignLawyerDropdown';
import ReclaimConfirmModal from './ReclaimConfirmModal';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function hoursSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
}

/* Escalation tiers for unclaimed (days available) */
function getUnclaimedEscalation(days) {
  if (days >= 31) return { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA', fontWeight: 700, prefix: '🔴 CRITICAL · ' };
  if (days >= 15) return { color: '#B91C1C', bg: '#FEF2F2', border: '#FDE68A', fontWeight: 700, prefix: '' };
  return { color: '#B45309', bg: 'white', border: '#FDE68A', fontWeight: 700, prefix: '' };
}

/* Escalation tiers for awaiting contact (hours since assigned) */
function getContactEscalation(hrs) {
  const days = hrs / 24;
  if (days >= 7) return { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA', fontWeight: 700, prefix: '🔴 CRITICAL · ' };
  if (hrs >= 48) return { color: '#B91C1C', bg: '#FEF2F2', border: '#FDE68A', fontWeight: 700, prefix: '' };
  return { color: '#B45309', bg: 'white', border: '#FDE68A', fontWeight: 400, prefix: '' };
}

const actionBtnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px 10px', minHeight: '36px',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
  backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap',
};

export default function NeedsAttentionSection({
  unclaimed, awaitingContact, lawyerMap, approvedLawyers,
  onForceAssign, onForceClose, onReclaim, saving,
}) {
  const [open, setOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [reclaimCase, setReclaimCase] = useState(null);
  const total = unclaimed.length + awaitingContact.length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (total === 0) return null;

  return (
    <>
      <div role="alert" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', overflow: 'hidden' }}>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', minHeight: '44px', border: 'none', backgroundColor: 'transparent',
            cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
            color: '#92400E', textAlign: 'left',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> {total} case{total !== 1 ? 's' : ''} need attention
          </span>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {open && (
          <div style={{ padding: '0 16px 16px' }}>
            {/* Unclaimed too long */}
            {unclaimed.length > 0 && (
              <div style={{ marginBottom: awaitingContact.length > 0 ? '16px' : 0 }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Unclaimed too long ({unclaimed.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {unclaimed.map(c => {
                    const days = daysSince(c.approved_at || c.created_date);
                    const esc = getUnclaimedEscalation(days);
                    return (
                      <div key={c.id} className="na-row" style={{
                        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                        padding: '8px 12px', backgroundColor: esc.bg, borderRadius: '8px', border: `1px solid ${esc.border}`,
                        minHeight: '44px',
                      }}>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-800)', flex: '1 1 140px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.business_name}
                        </span>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {c.violation_type === 'physical_space' ? '🏢' : '🌐'} {c.business_type}
                        </span>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {[c.city, c.state].filter(Boolean).join(', ')}
                        </span>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: esc.fontWeight, color: esc.color }}>
                          {esc.prefix}Available for {days}d
                        </span>
                        {/* Action buttons */}
                        <div className="na-actions" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <AssignLawyerDropdown
                            caseData={c}
                            approvedLawyers={approvedLawyers || []}
                            onAssign={onForceAssign}
                            saving={saving}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); onForceClose(c); }}
                            aria-label={`Close case for ${c.business_name}`}
                            style={{ ...actionBtnBase, color: '#B91C1C', border: '1.5px solid #B91C1C' }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Awaiting lawyer contact */}
            {awaitingContact.length > 0 && (
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Awaiting lawyer contact ({awaitingContact.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {awaitingContact.map(c => {
                    const hrs = hoursSince(c.assigned_at);
                    const esc = getContactEscalation(hrs);
                    const lawyer = c.assigned_lawyer_id ? lawyerMap[c.assigned_lawyer_id] : null;
                    return (
                      <div key={c.id} className="na-row" style={{
                        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                        padding: '8px 12px', backgroundColor: esc.bg, borderRadius: '8px', border: `1px solid ${esc.border}`,
                        minHeight: '44px',
                      }}>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-800)', flex: '1 1 140px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.business_name}
                        </span>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {c.violation_type === 'physical_space' ? '🏢' : '🌐'} {c.business_type}
                        </span>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                          Assigned to {lawyer ? lawyer.full_name : 'Unknown'}
                        </span>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: esc.fontWeight, color: esc.color }}>
                          {esc.prefix}⚠️ Assigned {hrs}h ago — no contact
                        </span>
                        {/* Action buttons */}
                        <div className="na-actions" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); showToast('Reminder functionality coming soon'); }}
                            aria-label={`Send reminder for ${c.business_name}`}
                            style={{ ...actionBtnBase, color: '#B45309', border: '1.5px solid #B45309' }}
                          >
                            Remind
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setReclaimCase(c); }}
                            aria-label={`Reclaim ${c.business_name} from ${lawyer?.full_name || 'lawyer'}`}
                            style={{ ...actionBtnBase, color: '#B91C1C', border: '1.5px solid #B91C1C' }}
                          >
                            Reclaim
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reclaim confirmation modal */}
      <ReclaimConfirmModal
        open={!!reclaimCase}
        caseData={reclaimCase}
        lawyerName={reclaimCase?.assigned_lawyer_id ? lawyerMap[reclaimCase.assigned_lawyer_id]?.full_name : 'Unknown'}
        onConfirm={() => { if (reclaimCase) { onReclaim(reclaimCase); setReclaimCase(null); } }}
        onCancel={() => setReclaimCase(null)}
        saving={saving}
      />

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, padding: '10px 20px', borderRadius: '10px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', backgroundColor: '#D97706', color: 'white',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .na-row { flex-direction: column !important; align-items: flex-start !important; }
          .na-actions { width: 100%; margin-top: 4px; }
        }
      `}</style>
    </>
  );
}