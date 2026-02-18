import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { CheckCircle, Flag, ArrowUpDown } from 'lucide-react';
import QCCaseCard from '../components/admin/review/QCCaseCard';
import QCActionModal from '../components/admin/review/QCActionModal';

export default function AdminReview() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [sortOrder, setSortOrder] = useState('oldest');
  const [modalState, setModalState] = useState({ open: false, action: null, caseData: null });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadCases = async () => {
    const submitted = await base44.entities.Case.filter({ status: 'submitted' }, 'created_date', 500);
    const underReview = await base44.entities.Case.filter({ status: 'under_review' }, 'created_date', 500);
    setCases([...submitted, ...underReview]);
  };

  useEffect(() => {
    async function init() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin(createPageUrl('AdminReview'));
        return;
      }
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      await loadCases();
      setLoading(false);
    }
    init();
  }, []);

  const flaggedCases = cases.filter(c => c.qc_flagged);
  const sortedCases = [...cases].sort((a, b) => {
    // Flagged first
    if (a.qc_flagged && !b.qc_flagged) return -1;
    if (!a.qc_flagged && b.qc_flagged) return 1;
    // Then by date
    const dateA = new Date(a.submitted_at || a.created_date);
    const dateB = new Date(b.submitted_at || b.created_date);
    return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  const openModal = (action, caseData) => {
    setModalState({ open: true, action, caseData });
  };

  const closeModal = () => {
    if (!saving) setModalState({ open: false, action: null, caseData: null });
  };

  const handleConfirm = async ({ reason, comment }) => {
    if (!modalState.caseData) return;
    setSaving(true);
    const c = modalState.caseData;
    const now = new Date().toISOString();

    if (modalState.action === 'approve') {
      await base44.entities.Case.update(c.id, {
        status: 'available',
        approved_at: now,
        qc_reviewer_notes: comment || null
      });
      await base44.entities.TimelineEvent.create({
        case_id: c.id,
        event_type: 'approved',
        event_description: 'Your case has been approved and is now visible to attorneys in your area.',
        actor_role: 'admin',
        visible_to_user: true,
        created_at: now
      });
      if (comment) {
        await base44.entities.TimelineEvent.create({
          case_id: c.id,
          event_type: 'reviewed',
          event_description: `QC Note: ${comment}`,
          actor_role: 'admin',
          visible_to_user: false,
          created_at: now
        });
      }
      setToast({ type: 'success', message: 'Case approved' });
    }

    if (modalState.action === 'reject') {
      await base44.entities.Case.update(c.id, {
        status: 'rejected',
        qc_rejection_reason: reason,
        qc_reviewer_notes: comment || null
      });
      await base44.entities.TimelineEvent.create({
        case_id: c.id,
        event_type: 'rejected',
        event_description: 'After review, this report did not meet the criteria for our platform. This does not mean your experience was not valid.',
        actor_role: 'admin',
        visible_to_user: true,
        created_at: now
      });
      await base44.entities.TimelineEvent.create({
        case_id: c.id,
        event_type: 'reviewed',
        event_description: `Rejection reason: ${reason}${comment ? `. Note: ${comment}` : ''}`,
        actor_role: 'admin',
        visible_to_user: false,
        created_at: now
      });
      setToast({ type: 'success', message: 'Case rejected' });
    }

    if (modalState.action === 'flag') {
      await base44.entities.Case.update(c.id, {
        qc_flagged: true,
        qc_flag_reason: reason,
        qc_reviewer_notes: comment || c.qc_reviewer_notes || null
      });
      await base44.entities.TimelineEvent.create({
        case_id: c.id,
        event_type: 'reviewed',
        event_description: `Flagged for review: ${reason}${comment ? `. Note: ${comment}` : ''}`,
        actor_role: 'admin',
        visible_to_user: false,
        created_at: now
      });
      setToast({ type: 'warning', message: 'Case flagged for review' });
    }

    await loadCases();
    setSaving(false);
    closeModal();
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading review queue" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading review queue…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--slate-900)', margin: 0 }}>
              QC Review Queue
            </h1>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: '#475569', margin: '4px 0 0' }}>
              {cases.length} case{cases.length !== 1 ? 's' : ''} pending review
            </p>
          </div>

          {/* Sort dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--slate-500)' }} />
            <select
              aria-label="Sort order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: '8px 12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                border: '1px solid var(--slate-300)', borderRadius: '8px',
                backgroundColor: 'white', color: 'var(--slate-800)', cursor: 'pointer'
              }}
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Flagged banner */}
        {flaggedCases.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', backgroundColor: '#FEF3C7', borderRadius: '10px'
          }}>
            <Flag size={18} style={{ color: '#92400E' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: '#92400E' }}>
              {flaggedCases.length} case{flaggedCases.length !== 1 ? 's' : ''} flagged for review
            </span>
          </div>
        )}

        {/* Cases */}
        {cases.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '12px', padding: '48px 24px', textAlign: 'center'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#DCFCE7', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <CheckCircle size={28} style={{ color: '#15803D' }} />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 8px' }}>
              All caught up — no cases pending review
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
              New submissions will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedCases.map(c => (
              <QCCaseCard
                key={c.id}
                caseData={c}
                onApprove={() => openModal('approve', c)}
                onReject={() => openModal('reject', c)}
                onFlag={() => openModal('flag', c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      <QCActionModal
        open={modalState.open}
        action={modalState.action}
        businessName={modalState.caseData?.business_name}
        onConfirm={handleConfirm}
        onCancel={closeModal}
        saving={saving}
      />

      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="assertive" style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, padding: '12px 24px', borderRadius: '10px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer',
          backgroundColor: toast.type === 'success' ? '#15803D' : '#D97706',
          color: 'white'
        }} onClick={() => setToast(null)}>
          ✓ {toast.message}
        </div>
      )}
    </div>
  );
}