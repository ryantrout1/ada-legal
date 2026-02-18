import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import CaseRow from '../components/lawyer/CaseRow';
import LogContactModal from '../components/lawyer/LogContactModal';
import ResolveCaseModal from '../components/lawyer/ResolveCaseModal';

export default function LawyerDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [cases, setCases] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
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
    const [myCases, logs] = await Promise.all([
      base44.entities.Case.filter({ assigned_lawyer_id: p.id }, '-assigned_at', 200),
      base44.entities.ContactLog.filter({ lawyer_id: p.id }, '-created_date', 500)
    ]);
    setCases(myCases);
    setAllLogs(logs);
  };

  useEffect(() => {
    async function init() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin(createPageUrl('LawyerDashboard'));
        return;
      }
      if (!user) {
        base44.auth.redirectToLogin(createPageUrl('LawyerDashboard'));
        return;
      }
      const profiles = await base44.entities.LawyerProfile.filter({ email: user.email });
      const p = profiles[0];
      if (!p) { window.location.href = createPageUrl('Home'); return; }
      setProfile(p);
      // Update last_active
      base44.entities.LawyerProfile.update(p.id, { last_active: new Date().toISOString() });
      await loadData(p);
      setLoading(false);

      // Check for highlight param (post-initiate redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const hl = urlParams.get('highlight');
      if (hl) {
        setHighlightedCaseId(hl);
        setSuccessMessage('Case assigned successfully. You have 24 hours to make first contact.');
        // Clear highlight after 4 seconds
        setTimeout(() => setHighlightedCaseId(null), 4000);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    init();
  }, []);

  // Group cases
  const needsAction = cases.filter(c => {
    if (c.status !== 'assigned') return false;
    return !allLogs.some(l => l.case_id === c.id);
  });

  const inProgress = cases.filter(c => {
    if (c.status === 'in_progress') return true;
    if (c.status === 'assigned' && allLogs.some(l => l.case_id === c.id)) return true;
    return false;
  });

  const completed = cases.filter(c => c.status === 'closed');

  const handleLogContact = async (formData) => {
    if (!logModalCase || !profile) return;
    setSaving(true);
    const now = new Date().toISOString();

    const newLog = await base44.entities.ContactLog.create({
      case_id: logModalCase.id,
      lawyer_id: profile.id,
      contact_type: formData.contact_type,
      contact_method: formData.contact_method,
      notes: formData.notes || '',
      logged_at: now
    });

    const caseUpdate = { contact_logged_at: now };
    if (formData.contact_type === 'initial_contact') {
      caseUpdate.status = 'in_progress';
    }
    await base44.entities.Case.update(logModalCase.id, caseUpdate);

    await base44.entities.TimelineEvent.create({
      case_id: logModalCase.id,
      event_type: 'contact_logged',
      event_description: 'Attorney logged contact with claimant.',
      actor_role: 'lawyer',
      visible_to_user: false,
      created_at: now
    });

    await loadData();
    setSaving(false);
    setLogModalCase(null);
    setSuccessMessage('Contact logged successfully.');
  };

  const RESOLUTION_DESCRIPTIONS = {
    engaged: 'An attorney has taken your case and is actively working on it. You may be contacted directly for next steps.',
    referred_out: 'Your case has been referred to an attorney who specializes in this area. They may reach out to you directly.',
    not_viable: 'After careful review, the attorney determined this case may not have sufficient grounds for legal action under the ADA. This does not mean your experience was not valid.',
    claimant_unresponsive: 'We were unable to reach you after multiple attempts. If you would like to reconnect, please submit a new report.',
    claimant_declined: 'We understand your decision not to pursue legal action at this time. Your report remains on file.'
  };

  const handleResolve = async (formData) => {
    if (!resolveModalCase || !profile) return;
    setSaving(true);
    const now = new Date().toISOString();

    const caseUpdate = {
      status: 'closed',
      closed_at: now,
      resolution_type: formData.resolution_type,
      resolution_notes: formData.resolution_notes,
      resolved_by: 'lawyer'
    };
    if (formData.resolution_type === 'engaged') {
      caseUpdate.estimated_case_value = formData.estimated_case_value;
      caseUpdate.expected_timeline = formData.expected_timeline;
    }
    await base44.entities.Case.update(resolveModalCase.id, caseUpdate);

    await base44.entities.TimelineEvent.create({
      case_id: resolveModalCase.id,
      event_type: 'closed',
      event_description: RESOLUTION_DESCRIPTIONS[formData.resolution_type] || 'This case has been closed.',
      actor_role: 'lawyer',
      visible_to_user: true,
      created_at: now
    });

    await loadData();
    setSaving(false);
    setResolveModalCase(null);
    setSuccessMessage('Case resolved and closed.');
  };

  if (loading) {
    return (
      <div
        role="status" aria-label="Loading your cases"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 200px)', gap: '1rem'
        }}
      >
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading your cases…</p>
      </div>
    );
  }

  const statCard = (icon, label, count, color) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 1rem', backgroundColor: 'var(--surface)',
      border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)',
      flex: '1 1 160px'
    }}>
      {icon}
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)' }}>{label}</span>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color, marginLeft: 'auto' }}>{count}</span>
    </div>
  );

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-lg)'
        }}>
          My Cases
        </h1>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
          {statCard(<AlertTriangle size={16} style={{ color: '#B91C1C' }} />, 'Needs Action', needsAction.length, '#B91C1C')}
          {statCard(<Clock size={16} style={{ color: '#15803D' }} />, 'In Progress', inProgress.length, '#15803D')}
          {statCard(<CheckCircle size={16} style={{ color: 'var(--slate-500)' }} />, 'Completed', completed.length, 'var(--slate-600)')}
        </div>

        {cases.length === 0 && (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '16px', padding: 'var(--space-2xl)', textAlign: 'center'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--slate-500)', marginBottom: 'var(--space-md)' }}>
              You have no assigned cases yet.
            </p>
            <a href={createPageUrl('Marketplace')} style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--terra-600)'
            }}>
              Browse Available Cases →
            </a>
          </div>
        )}

        {/* Group 1: Needs Action */}
        {needsAction.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
              color: '#B91C1C', margin: '0 0 0.5rem'
            }}>
              Needs Action ({needsAction.length})
            </h2>
            {needsAction.map(c => (
              <CaseRow
                key={c.id} caseData={c} group="needs_action"
                contactLogs={allLogs.filter(l => l.case_id === c.id)}
                onLogContact={setLogModalCase}
                onResolve={setResolveModalCase}
                highlighted={c.id === highlightedCaseId}
                defaultExpanded={c.id === highlightedCaseId}
              />
            ))}
          </div>
        )}

        {/* Group 2: In Progress */}
        {inProgress.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
              color: '#15803D', margin: '0 0 0.5rem'
            }}>
              In Progress ({inProgress.length})
            </h2>
            {inProgress.map(c => (
              <CaseRow
                key={c.id} caseData={c} group="in_progress"
                contactLogs={allLogs.filter(l => l.case_id === c.id)}
                onLogContact={setLogModalCase}
                onResolve={setResolveModalCase}
              />
            ))}
          </div>
        )}

        {/* Group 3: Completed */}
        {completed.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <button type="button" onClick={() => setCompletedOpen(!completedOpen)} style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, marginBottom: '0.5rem'
            }}>
              {completedOpen ? <ChevronDown size={16} style={{ color: 'var(--slate-500)' }} /> : <ChevronRight size={16} style={{ color: 'var(--slate-500)' }} />}
              <h2 style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
                color: 'var(--slate-500)', margin: 0
              }}>
                Completed ({completed.length})
              </h2>
            </button>
            {completedOpen && completed.map(c => (
              <CaseRow
                key={c.id} caseData={c} group="completed"
                contactLogs={allLogs.filter(l => l.case_id === c.id)}
                onLogContact={setLogModalCase}
              />
            ))}
          </div>
        )}
      </div>

      <LogContactModal
        open={!!logModalCase}
        onCancel={() => { if (!saving) setLogModalCase(null); }}
        onSubmit={handleLogContact}
        saving={saving}
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
          position: 'fixed', bottom: 'var(--space-xl)', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, backgroundColor: '#15803D', color: 'white',
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer'
        }} onClick={() => setSuccessMessage('')}>
          ✓ {successMessage}
        </div>
      )}
    </div>
  );
}