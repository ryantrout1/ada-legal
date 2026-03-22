import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Flag } from 'lucide-react';
import { renderEmailTemplate } from '../emails/renderTemplate';

const inputStyle = {
  width: '100%', minHeight: '44px', padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
  color: 'var(--body)', backgroundColor: 'var(--card-bg)',
  border: '2px solid var(--card-border)', borderRadius: 'var(--radius-md)',
  outline: 'none', boxSizing: 'border-box'
};

export default function ReviewActions({ caseData, onActionComplete }) {
  const [mode, setMode] = useState(null); // 'reject' | 'flag' | null
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    const now = new Date().toISOString();

    await base44.entities.Case.update(caseData.id, {
      status: 'available',
      approved_at: now
    });

    await base44.entities.TimelineEvent.create({
      case_id: caseData.id,
      event_type: 'approved',
      event_description: 'Your case has been approved and is now available for attorney review.',
      actor_role: 'admin',
      visible_to_user: true,
      created_at: now
    });

    try {
      const prefLabel = caseData.contact_preference === 'phone' ? 'Phone' : caseData.contact_preference === 'email' ? 'Email' : 'No Preference';
      const rendered = await renderEmailTemplate('case_approved', {
        reporter_name: caseData.contact_name,
        business_name: caseData.business_name,
        contact_preference: prefLabel,
        case_url: window.location.origin + '/MyCases'
      });
      if (rendered) await base44.integrations.Core.SendEmail({ to: caseData.contact_email, subject: rendered.subject, body: rendered.body });
    } catch {}

    setProcessing(false);
    onActionComplete();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setProcessing(true);
    const now = new Date().toISOString();

    await base44.entities.Case.update(caseData.id, {
      status: 'rejected',
      rejection_reason: rejectionReason.trim()
    });

    await base44.entities.TimelineEvent.create({
      case_id: caseData.id,
      event_type: 'rejected',
      event_description: `Your submission could not be approved. Reason: ${rejectionReason.trim()}`,
      actor_role: 'admin',
      visible_to_user: true,
      created_at: now
    });

    try {
      const rendered = await renderEmailTemplate('case_rejected', {
        reporter_name: caseData.contact_name,
        business_name: caseData.business_name,
        rejection_reason: rejectionReason.trim(),
        case_url: window.location.origin + '/MyCases',
        standards_guide_url: window.location.origin + '/StandardsGuide',
        intake_url: window.location.origin + '/Intake'
      });
      if (rendered) await base44.integrations.Core.SendEmail({ to: caseData.contact_email, subject: rendered.subject, body: rendered.body });
    } catch {}

    setProcessing(false);
    onActionComplete();
  };

  const handleFlag = async () => {
    setProcessing(true);
    await base44.entities.Case.update(caseData.id, {
      status: 'under_review',
      admin_notes: adminNotes.trim()
    });
    setProcessing(false);
    onActionComplete();
  };

  return (
    <div style={{
      padding: '0 var(--space-lg) var(--space-lg)',
      borderTop: '1px solid var(--card-border)',
      marginTop: 'var(--space-sm)'
    }}>
      {/* Action buttons */}
      {!mode && (
        <div style={{
          display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap',
          paddingTop: 'var(--space-lg)'
        }}>
          <button
            type="button"
            onClick={handleApprove}
            disabled={processing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', fontWeight: 700, color: 'var(--card-bg)',
              backgroundColor: processing ? 'var(--body-secondary)' : 'var(--suc-fg)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: processing ? 'not-allowed' : 'pointer', minHeight: '48px'
            }}
          >
            <CheckCircle size={18} />
            {processing ? 'Processing…' : 'Approve'}
          </button>

          <button
            type="button"
            onClick={() => setMode('reject')}
            disabled={processing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', fontWeight: 700, color: 'var(--card-bg)',
              backgroundColor: 'var(--err-fg)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', minHeight: '48px'
            }}
          >
            <XCircle size={18} />
            Reject
          </button>

          <button
            type="button"
            onClick={() => setMode('flag')}
            disabled={processing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem', fontWeight: 700, color: '#A16207',
              backgroundColor: 'transparent',
              border: '2px solid #A16207', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', minHeight: '48px'
            }}
          >
            <Flag size={18} />
            Flag for Review
          </button>
        </div>
      )}

      {/* Rejection reason input */}
      {mode === 'reject' && (
        <div style={{ paddingTop: 'var(--space-lg)' }}>
          <label style={{
            display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            fontWeight: 600, color: 'var(--body)', marginBottom: 'var(--space-xs)'
          }}>
            Rejection Reason <span style={{ color: 'var(--error-600)' }}>*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Explain why this submission is being rejected…"
            rows={3}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            <button
              type="button"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              style={{
                padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', fontWeight: 700, color: 'var(--card-bg)',
                backgroundColor: (!rejectionReason.trim() || processing) ? 'var(--body-secondary)' : 'var(--err-fg)',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: (!rejectionReason.trim() || processing) ? 'not-allowed' : 'pointer',
                minHeight: '44px'
              }}
            >
              {processing ? 'Processing…' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              onClick={() => { setMode(null); setRejectionReason(''); }}
              style={{
                padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)',
                backgroundColor: 'transparent', border: '2px solid var(--card-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '44px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Flag admin notes */}
      {mode === 'flag' && (
        <div style={{ paddingTop: 'var(--space-lg)' }}>
          <label style={{
            display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            fontWeight: 600, color: 'var(--body)', marginBottom: 'var(--space-xs)'
          }}>
            Admin Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            placeholder="Add internal notes about why this case needs further review…"
            rows={3}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            <button
              type="button"
              onClick={handleFlag}
              disabled={processing}
              style={{
                padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', fontWeight: 700, color: 'var(--card-bg)',
                backgroundColor: processing ? 'var(--body-secondary)' : '#A16207',
                border: 'none', borderRadius: 'var(--radius-md)',
                cursor: processing ? 'not-allowed' : 'pointer', minHeight: '44px'
              }}
            >
              {processing ? 'Processing…' : 'Flag as Under Review'}
            </button>
            <button
              type="button"
              onClick={() => { setMode(null); setAdminNotes(''); }}
              style={{
                padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)',
                backgroundColor: 'transparent', border: '2px solid var(--card-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '44px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}