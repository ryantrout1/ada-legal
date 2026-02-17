import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import MyCaseCard from '../components/lawyer/MyCaseCard';
import LogContactModal from '../components/lawyer/LogContactModal';

export default function LawyerDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [cases, setCases] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [logModalCase, setLogModalCase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

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
      if (!p) {
        window.location.href = createPageUrl('Home');
        return;
      }
      setProfile(p);

      const myCases = await base44.entities.Case.filter({ assigned_lawyer_id: p.id }, '-assigned_at', 200);
      setCases(myCases);

      // Load all contact logs for these cases
      const logs = await base44.entities.ContactLog.filter({ lawyer_id: p.id }, '-created_date', 500);
      setAllLogs(logs);

      setLoading(false);
    }
    init();
  }, []);

  const handleLogContact = async (formData) => {
    if (!logModalCase || !profile) return;
    setSaving(true);

    const now = new Date().toISOString();

    // Create contact log
    const newLog = await base44.entities.ContactLog.create({
      case_id: logModalCase.id,
      lawyer_id: profile.id,
      contact_type: formData.contact_type,
      contact_method: formData.contact_method,
      notes: formData.notes || '',
      logged_at: now
    });

    // Update case: set contact_logged_at, and if initial_contact set status to in_progress
    const caseUpdate = { contact_logged_at: now };
    const isFirstContact = formData.contact_type === 'initial_contact';
    if (isFirstContact) {
      caseUpdate.status = 'in_progress';
    }
    await base44.entities.Case.update(logModalCase.id, caseUpdate);

    // Create timeline event (not visible to user)
    await base44.entities.TimelineEvent.create({
      case_id: logModalCase.id,
      event_type: 'contact_logged',
      event_description: 'Attorney logged contact with claimant.',
      actor_role: 'lawyer',
      visible_to_user: false,
      created_at: now
    });

    // Update local state
    setCases(prev => prev.map(c =>
      c.id === logModalCase.id
        ? { ...c, contact_logged_at: now, ...(isFirstContact ? { status: 'in_progress' } : {}) }
        : c
    ));
    setAllLogs(prev => [newLog, ...prev]);

    setSaving(false);
    setLogModalCase(null);
    setSuccessMessage('Contact logged successfully.');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading your cases…</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)',
          marginBottom: 'var(--space-xl)'
        }}>
          My Cases
        </h1>

        {cases.length === 0 && (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '16px', padding: 'var(--space-2xl)', textAlign: 'center'
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              color: 'var(--slate-500)', marginBottom: 'var(--space-md)'
            }}>
              You have no assigned cases yet.
            </p>
            <a
              href={createPageUrl('Marketplace')}
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                fontWeight: 600, color: 'var(--terra-600)'
              }}
            >
              Browse Available Cases →
            </a>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {cases.map(c => (
            <MyCaseCard
              key={c.id}
              caseData={c}
              contactLogs={allLogs.filter(l => l.case_id === c.id)}
              onLogContact={setLogModalCase}
            />
          ))}
        </div>
      </div>

      <LogContactModal
        open={!!logModalCase}
        onCancel={() => { if (!saving) setLogModalCase(null); }}
        onSubmit={handleLogContact}
        saving={saving}
      />

      {successMessage && (
        <div
          role="alert"
          style={{
            position: 'fixed', bottom: 'var(--space-xl)', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1100, backgroundColor: '#15803D', color: 'white',
            padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
          onClick={() => setSuccessMessage('')}
        >
          ✓ {successMessage}
        </div>
      )}
    </div>
  );
}