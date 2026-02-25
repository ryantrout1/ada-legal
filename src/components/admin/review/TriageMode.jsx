import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Zap } from 'lucide-react';
import TriageCaseDetail from './TriageCaseDetail';
import TriageRejectModal from './TriageRejectModal';
import TriageFlagModal from './TriageFlagModal';
import { caseRejectedEmail } from '../../emails/caseEmails';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortTriageCases(cases) {
  return [...cases].sort((a, b) => {
    const sevA = SEVERITY_ORDER[a.ai_severity] ?? 3;
    const sevB = SEVERITY_ORDER[b.ai_severity] ?? 3;
    if (sevA !== sevB) return sevA - sevB;
    return (b.ai_completeness_score ?? 0) - (a.ai_completeness_score ?? 0);
  });
}

const REJECT_REASONS_EMAIL = [
  { value: 'insufficient_detail', emailText: 'We were unable to fully evaluate your report based on the information provided.' },
  { value: 'not_ada_violation', emailText: 'The issue described does not appear to fall under the ADA accessibility standards that our platform covers.' },
  { value: 'duplicate', emailText: 'It appears this report is a duplicate of a previous submission.' },
  { value: 'incomplete_contact', emailText: 'The contact information provided was incomplete.' },
  { value: 'other', emailText: '' },
];

export default function TriageMode({ filteredCases, onExit, onCasesChanged }) {
  const sorted = useMemo(() => sortTriageCases(filteredCases), [filteredCases]);
  const total = sorted.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [stats, setStats] = useState({ approved: 0, rejected: 0, flagged: 0, skipped: 0 });
  const [saving, setSaving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [slideDir, setSlideDir] = useState(null);
  const [completed, setCompleted] = useState(false);
  const titleRef = useRef(null);

  const currentCase = sorted[currentIdx] || null;
  const reviewed = stats.approved + stats.rejected + stats.flagged + stats.skipped;

  // Dismiss shortcut tooltip after 5s
  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Focus title on case change
  useEffect(() => {
    if (titleRef.current && !completed) {
      titleRef.current.focus();
    }
  }, [currentIdx, completed]);

  const advance = useCallback(() => {
    setSlideDir('left');
    setTimeout(() => {
      if (currentIdx + 1 >= total) {
        setCompleted(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
      setSlideDir(null);
    }, 200);
  }, [currentIdx, total]);

  const handleApprove = useCallback(async () => {
    if (!currentCase || saving) return;
    setSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Case.update(currentCase.id, {
      status: 'available', approved_at: now, qc_reviewer_notes: null,
    });
    await base44.entities.TimelineEvent.create({
      case_id: currentCase.id, event_type: 'approved',
      event_description: 'Your case has been approved and is now visible to attorneys in your area.',
      actor_role: 'admin', visible_to_user: true, created_at: now,
    });
    setStats(s => ({ ...s, approved: s.approved + 1 }));
    setSaving(false);
    advance();
  }, [currentCase, saving, advance]);

  const handleRejectConfirm = useCallback(async ({ reason, comment }) => {
    if (!currentCase) return;
    setSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Case.update(currentCase.id, {
      status: 'rejected', qc_rejection_reason: reason, qc_reviewer_notes: comment || null,
    });
    await base44.entities.TimelineEvent.create({
      case_id: currentCase.id, event_type: 'rejected',
      event_description: 'After review, this report did not meet the criteria for our platform.',
      actor_role: 'admin', visible_to_user: true, created_at: now,
    });
    const emailReasonText = (REJECT_REASONS_EMAIL.find(r => r.value === reason)?.emailText || '') + (comment ? ' ' + comment : '');
    const portalUrl = window.location.origin + '/MyCases';
    try {
      await base44.integrations.Core.SendEmail({
        to: currentCase.contact_email,
        subject: 'ADA Legal Link — Submission Update',
        body: caseRejectedEmail(currentCase, emailReasonText, portalUrl),
      });
    } catch (e) { console.error('Rejection email failed:', e); }
    setStats(s => ({ ...s, rejected: s.rejected + 1 }));
    setSaving(false);
    setRejectOpen(false);
    advance();
  }, [currentCase, advance]);

  const handleFlagConfirm = useCallback(async ({ reason, comment }) => {
    if (!currentCase) return;
    setSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Case.update(currentCase.id, {
      qc_flagged: true, qc_flag_reason: reason,
      qc_reviewer_notes: comment || currentCase.qc_reviewer_notes || null,
    });
    await base44.entities.TimelineEvent.create({
      case_id: currentCase.id, event_type: 'reviewed',
      event_description: `Flagged for review: ${reason}${comment ? '. Note: ' + comment : ''}`,
      actor_role: 'admin', visible_to_user: false, created_at: now,
    });
    setStats(s => ({ ...s, flagged: s.flagged + 1 }));
    setSaving(false);
    setFlagOpen(false);
    advance();
  }, [currentCase, advance]);

  const handleSkip = useCallback(() => {
    if (saving) return;
    setStats(s => ({ ...s, skipped: s.skipped + 1 }));
    advance();
  }, [saving, advance]);

  const handleExit = useCallback(() => {
    onCasesChanged();
    onExit(stats);
  }, [onExit, onCasesChanged, stats]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't handle if modals are open or typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (rejectOpen || flagOpen) {
        // Escape closes modals (handled by modal itself)
        return;
      }

      if (e.key === 'Escape') { handleExit(); return; }
      if (completed) return;
      if (saving) return;

      const key = e.key.toLowerCase();
      if (key === 'a') { e.preventDefault(); handleApprove(); }
      else if (key === 'r') { e.preventDefault(); setRejectOpen(true); }
      else if (key === 'f') { e.preventDefault(); setFlagOpen(true); }
      else if (key === 's') { e.preventDefault(); handleSkip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rejectOpen, flagOpen, completed, saving, handleApprove, handleSkip, handleExit]);

  const percent = total > 0 ? Math.round(((currentIdx + (completed ? 0 : 0)) / total) * 100) : 100;

  // Completion screen
  if (completed || total === 0) {
    const totalReviewed = stats.approved + stats.rejected + stats.flagged + stats.skipped;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 16px' }}>🎉</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 8px' }}>
            All caught up!
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: '#475569', margin: '0 0 24px' }}>
            {totalReviewed} case{totalReviewed !== 1 ? 's' : ''} reviewed in this session.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px',
          }}>
            {[
              { label: 'Approved', value: stats.approved, color: '#15803D', bg: '#DCFCE7' },
              { label: 'Rejected', value: stats.rejected, color: '#B91C1C', bg: '#FEE2E2' },
              { label: 'Flagged', value: stats.flagged, color: '#92400E', bg: '#FEF3C7' },
              { label: 'Skipped', value: stats.skipped, color: '#475569', bg: '#F1F5F9' },
            ].map(s => (
              <div key={s.label} style={{
                backgroundColor: s.bg, borderRadius: '10px', padding: '16px 12px', textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: s.color, margin: '4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleExit}
            autoFocus
            style={{
              padding: '14px 32px', fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              fontWeight: 700, border: 'none', borderRadius: '10px', cursor: 'pointer',
              backgroundColor: 'var(--slate-900)', color: 'white', minHeight: '56px',
            }}
          >
            Exit Triage Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'white',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid var(--slate-200)',
        flexShrink: 0, gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={18} style={{ color: '#D97706' }} /> Triage Mode
          </span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>
            Case {currentIdx + 1} of {total}
          </span>
        </div>

        {/* Center: Progress bar */}
        <div style={{ flex: '1 1 200px', maxWidth: '400px', minWidth: '120px' }}>
          <div
            role="progressbar"
            aria-valuenow={currentIdx + 1}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`Progress: case ${currentIdx + 1} of ${total}`}
            style={{
              height: '8px', backgroundColor: '#E2E8F0', borderRadius: '100px', overflow: 'hidden',
            }}
          >
            <div style={{
              height: '100%', width: `${percent}%`,
              backgroundColor: 'var(--terra-600)', borderRadius: '100px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        <button
          onClick={handleExit}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            fontWeight: 600, border: '1px solid var(--slate-300)', borderRadius: '8px',
            backgroundColor: 'white', color: 'var(--slate-600)', cursor: 'pointer', minHeight: '44px',
          }}
          aria-label="Exit Triage Mode"
        >
          <X size={16} /> Exit Triage
        </button>
      </div>

      {/* Keyboard shortcuts tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute', top: '68px', right: '20px', zIndex: 10001,
          backgroundColor: 'var(--slate-900)', color: 'white', borderRadius: '10px',
          padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', lineHeight: 1.6,
          maxWidth: '220px',
        }}>
          <p style={{ fontWeight: 700, margin: '0 0 6px' }}>Keyboard Shortcuts</p>
          <p style={{ margin: 0 }}>
            <kbd style={{ padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>A</kbd> Approve &nbsp;
            <kbd style={{ padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>R</kbd> Reject<br />
            <kbd style={{ padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>F</kbd> Flag &nbsp;
            <kbd style={{ padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>S</kbd> Skip<br />
            <kbd style={{ padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>Esc</kbd> Exit
          </p>
          <button
            onClick={() => setShowTooltip(false)}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: '0.7rem', marginTop: '4px', padding: 0,
              fontFamily: 'inherit', textDecoration: 'underline',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 20px 120px',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '800px', width: '100%',
          opacity: slideDir ? 0 : 1,
          transform: slideDir === 'left' ? 'translateX(-40px)' : 'translateX(0)',
          transition: 'opacity 0.2s, transform 0.2s',
        }}>
          <TriageCaseDetail caseData={currentCase} titleRef={titleRef} />
        </div>
      </div>

      {/* Skip link */}
      <div style={{
        position: 'fixed', bottom: '80px', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 10001,
      }}>
        <button
          onClick={handleSkip}
          disabled={saving}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            color: '#475569', textDecoration: 'underline', padding: '8px 16px',
            minHeight: '44px',
          }}
          aria-label="Skip this case"
        >
          Skip →
        </button>
      </div>

      {/* Action Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', borderTop: '1px solid var(--slate-200)',
        padding: '10px 20px', display: 'flex', gap: '12px',
        justifyContent: 'center', zIndex: 10001,
      }}>
        <button
          onClick={handleApprove}
          disabled={saving}
          aria-label={`Approve case for ${currentCase?.business_name || ''}`}
          style={{
            flex: '1 1 0', maxWidth: '260px', minHeight: '56px',
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
            color: 'white', backgroundColor: '#15803D', border: 'none',
            borderRadius: '10px', cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          ✅ Approve
        </button>
        <button
          onClick={() => setRejectOpen(true)}
          disabled={saving}
          aria-label={`Reject case for ${currentCase?.business_name || ''}`}
          style={{
            flex: '1 1 0', maxWidth: '260px', minHeight: '56px',
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
            color: 'white', backgroundColor: '#DC2626', border: 'none',
            borderRadius: '10px', cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          ❌ Reject
        </button>
        <button
          onClick={() => setFlagOpen(true)}
          disabled={saving}
          aria-label={`Flag and skip case for ${currentCase?.business_name || ''}`}
          style={{
            flex: '1 1 0', maxWidth: '260px', minHeight: '56px',
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
            color: 'white', backgroundColor: '#D97706', border: 'none',
            borderRadius: '10px', cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          🚩 Flag & Skip
        </button>
      </div>

      {/* Reject Modal */}
      <TriageRejectModal
        open={rejectOpen}
        onConfirm={handleRejectConfirm}
        onCancel={() => { if (!saving) setRejectOpen(false); }}
        saving={saving}
      />

      {/* Flag Modal */}
      <TriageFlagModal
        open={flagOpen}
        onConfirm={handleFlagConfirm}
        onCancel={() => { if (!saving) setFlagOpen(false); }}
        saving={saving}
      />
    </div>
  );
}