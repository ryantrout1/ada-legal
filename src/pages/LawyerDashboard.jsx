import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import StatPills from '../components/lawyer/StatPills';
import NeedsActionCard from '../components/lawyer/NeedsActionCard';
import InProgressCard from '../components/lawyer/InProgressCard';
import CompletedCaseRow from '../components/lawyer/CompletedCaseRow';
import LogContactModal from '../components/lawyer/LogContactModal';
import ResolveCaseModal from '../components/lawyer/ResolveCaseModal';

export default function LawyerDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [cases, setCases] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [logModalCase, setLogModalCase] = useState(null);
  const [resolveModalCase, setResolveModalCase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [completedOpen, setCompletedOpen] = useState(false);
  const [highlightedCaseId, setHighlightedCaseId] = useState(null);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const loadData = async (profileObj) => {
    const p = profileObj || profile;
    const [myCases, logs, notes] = await Promise.all([
      base44.entities.Case.filter({ assigned_lawyer_id: p.id }, '-assigned_at', 200),
      base44.entities.ContactLog.filter({ lawyer_id: p.id }, '-created_date', 500),
      base44.entities.LawyerNote.filter({ lawyer_id: p.id }, '-created_date', 500)
    ]);
    setCases(myCases);
    setAllLogs(logs);
    setAllNotes(notes);
  };

  useEffect(() => {
    async function init() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin(createPageUrl('LawyerDashboard'));
        return;
      }
      if (!user) { base44.auth.redirectToLogin(createPageUrl('LawyerDashboard')); return; }
      const profiles = await base44.entities.LawyerProfile.filter({ email: user.email });
      const p = profiles[0];
      if (!p) { window.location.href = createPageUrl('Home'); return; }
      setProfile(p);
      if (p.account_status !== 'approved') { setLoading(false); return; }
      base44.entities.LawyerProfile.update(p.id, { last_active: new Date().toISOString() });
      await loadData(p);
      setLoading(false);

      const urlParams = new URLSearchParams(window.location.search);
      const hl = urlParams.get('highlight');
      if (hl) {
        setHighlightedCaseId(hl);
        setSuccessMessage('Case assigned successfully. You have 24 hours to make first contact.');
        setTimeout(() => setHighlightedCaseId(null), 4000);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    init();
  }, []);

  // Groups
  const needsAction = cases.filter(c => c.status === 'assigned' && !allLogs.some(l => l.case_id === c.id));
  const inProgress = cases.filter(c => {
    if (c.status === 'in_progress') return true;
    if (c.status === 'assigned' && allLogs.some(l => l.case_id === c.id)) return true;
    return false;
  });
  const completed = cases.filter(c => c.status === 'closed');

  const getNotesForCase = (caseId) => allNotes.filter(n => n.case_id === caseId);
  const getLogsForCase = (caseId) => allLogs.filter(l => l.case_id === caseId);

  const handleSaveNote = async (caseId, text) => {
    const now = new Date().toISOString();
    await base44.entities.LawyerNote.create({
      case_id: caseId,
      lawyer_id: profile.id,
      note_text: text,
      created_at: now
    });
    await loadData();
    setSuccessMessage('Note saved');
  };

  const handleLogContact = async (formData) => {
    if (!logModalCase || !profile) return;
    setSaving(true);
    const now = new Date().toISOString();
    await base44.entities.ContactLog.create({
      case_id: logModalCase.id, lawyer_id: profile.id,
      contact_type: formData.contact_type, contact_method: formData.contact_method,
      notes: formData.notes || '', logged_at: now
    });
    const caseUpdate = { contact_logged_at: now };
    if (formData.contact_type === 'initial_contact') caseUpdate.status = 'in_progress';
    await base44.entities.Case.update(logModalCase.id, caseUpdate);
    await base44.entities.TimelineEvent.create({
      case_id: logModalCase.id, event_type: 'contact_logged',
      event_description: 'Attorney logged contact with reporter.',
      actor_role: 'lawyer', visible_to_user: false, created_at: now
    });
    setHighlightedCaseId(logModalCase.id);
    await loadData();
    setSaving(false);
    setLogModalCase(null);
    setSuccessMessage('Contact logged successfully.');
    setTimeout(() => setHighlightedCaseId(null), 3000);
  };

  const RESOLUTION_DESCRIPTIONS = {
    engaged: 'An attorney has taken your case and is actively working on it. You may be contacted directly for next steps.',
    referred_out: 'Your case has been referred to an attorney who specializes in this area.',
    not_viable: 'After careful review, the attorney determined this case may not have sufficient grounds for legal action under the ADA.',
    claimant_unresponsive: 'We were unable to reach you after multiple attempts.',
    claimant_declined: 'We understand your decision not to pursue legal action at this time.'
  };

  const handleResolve = async (formData) => {
    if (!resolveModalCase || !profile) return;
    setSaving(true);
    const now = new Date().toISOString();
    const caseUpdate = {
      status: 'closed', closed_at: now, resolution_type: formData.resolution_type,
      resolution_notes: formData.resolution_notes, resolved_by: 'lawyer'
    };
    if (formData.resolution_type === 'engaged') {
      caseUpdate.estimated_case_value = formData.estimated_case_value;
      caseUpdate.expected_timeline = formData.expected_timeline;
    }
    await base44.entities.Case.update(resolveModalCase.id, caseUpdate);
    await base44.entities.TimelineEvent.create({
      case_id: resolveModalCase.id, event_type: 'closed',
      event_description: RESOLUTION_DESCRIPTIONS[formData.resolution_type] || 'This case has been closed.',
      actor_role: 'lawyer', visible_to_user: true, created_at: now
    });
    await loadData();
    setSaving(false);
    setResolveModalCase(null);
    setSuccessMessage('Case resolved and closed.');
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading your cases" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0 }}>Attorney Dashboard</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body)' }}>Loading your cases…</p>
      </div>
    );
  }

  if (profile && profile.account_status === 'pending_approval') {
    return (
      <div style={{ backgroundColor: 'var(--page-bg-subtle)', minHeight: 'calc(100vh - 200px)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '520px', width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700, color: 'var(--heading)', marginBottom: '0.75rem' }}>
            Application Under Review
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--body)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Thank you for applying, {profile.full_name?.split(' ')[0] || 'Counselor'}. We're reviewing your application and will reach out directly within 2 business days.
          </p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body-secondary)', margin: 0 }}>
            Questions? Contact us at <a href="mailto:support@adalegallink.com" style={{ color: 'var(--section-label)', textDecoration: 'none', fontWeight: 600 }}>support@adalegallink.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--page-bg-subtle)', minHeight: 'calc(100vh - 200px)', padding: '1.5rem' }}>
      <style>{`
        button:focus-visible, a:focus-visible, select:focus-visible,
        input:focus-visible, textarea:focus-visible, [role="button"]:focus-visible {
          outline: 3px solid var(--accent-light); outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        @media (prefers-contrast: more) { button, a, input, select, textarea { border-width: 2px !important; } }
      `}</style>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>
          My Cases
        </h1>

        <StatPills needsAction={needsAction.length} inProgress={inProgress.length} completed={completed.length} onScrollTo={scrollTo} />

        {cases.length === 0 && (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '3rem', textAlign: 'center'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--body)', marginBottom: '1rem' }}>
              You have no assigned cases yet.
            </p>
            <Link to={createPageUrl('Marketplace')} style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
              color: 'var(--section-label)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}>
              Browse Available Cases <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* NEEDS ACTION */}
        <div id="needs-action">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: '#B91C1C' }} />
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
              Needs Action
            </h2>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: '#B91C1C' }}>({needsAction.length})</span>
          </div>
          {needsAction.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', backgroundColor: '#DCFCE7', borderRadius: '10px' }}>
              <CheckCircle size={16} style={{ color: '#15803D' }} />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: '#15803D' }}>
                All caught up — no cases need immediate action.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {needsAction.map(c => (
                <NeedsActionCard
                  key={c.id} caseData={c}
                  contactLogs={getLogsForCase(c.id)}
                  notes={getNotesForCase(c.id)}
                  onLogContact={setLogModalCase}
                  onResolve={setResolveModalCase}
                  onSaveNote={(text) => handleSaveNote(c.id, text)}
                  highlighted={c.id === highlightedCaseId}
                  defaultExpanded={c.id === highlightedCaseId}
                />
              ))}
            </div>
          )}
        </div>

        {/* IN PROGRESS */}
        <div id="in-progress">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: '#15803D' }} />
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
              In Progress
            </h2>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: '#15803D' }}>({inProgress.length})</span>
          </div>
          {inProgress.length === 0 ? (
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)' }}>
                No active cases. <Link to={createPageUrl('Marketplace')} style={{ color: 'var(--section-label)', fontWeight: 600, textDecoration: 'none' }}>Browse available cases</Link> to get started.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {inProgress.map(c => (
                <InProgressCard
                  key={c.id} caseData={c}
                  contactLogs={getLogsForCase(c.id)}
                  notes={getNotesForCase(c.id)}
                  onLogContact={setLogModalCase}
                  onResolve={setResolveModalCase}
                  onSaveNote={(text) => handleSaveNote(c.id, text)}
                  defaultExpanded={c.id === highlightedCaseId}
                />
              ))}
            </div>
          )}
        </div>

        {/* COMPLETED */}
        <div id="completed">
          <button type="button" onClick={() => setCompletedOpen(!completedOpen)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, marginBottom: completedOpen ? '8px' : 0
          }}>
            {completedOpen ? <ChevronDown size={15} style={{ color: 'var(--body-secondary)' }} /> : <ChevronRight size={15} style={{ color: 'var(--body-secondary)' }} />}
            <div style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: 'var(--body-secondary)' }} />
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
              Completed
            </h2>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--body)' }}>({completed.length})</span>
          </button>
          {completedOpen && (
            completed.length === 0 ? (
              <div style={{ padding: '16px 20px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)' }}>
                  No resolved cases yet.
                </span>
              </div>
            ) : (
              <div>
                {completed.map(c => (
                  <CompletedCaseRow
                    key={c.id} caseData={c}
                    notes={getNotesForCase(c.id)}
                    onSaveNote={(text) => handleSaveNote(c.id, text)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <LogContactModal
        open={!!logModalCase}
        onCancel={() => { if (!saving) setLogModalCase(null); }}
        onSubmit={handleLogContact}
        saving={saving}
        businessName={logModalCase?.business_name}
      />

      <ResolveCaseModal
        open={!!resolveModalCase}
        caseData={resolveModalCase}
        onCancel={() => { if (!saving) setResolveModalCase(null); }}
        onSubmit={handleResolve}
        saving={saving}
      />

      {successMessage && (
        <div role="alert" aria-live="assertive" style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, backgroundColor: '#15803D', color: 'white',
          padding: '12px 24px', borderRadius: '10px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer'
        }} onClick={() => setSuccessMessage('')}>
          ✓ {successMessage}
        </div>
      )}
    </div>
  );
}