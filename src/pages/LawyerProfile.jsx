import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import ProfileHeader from '../components/lawyer/ProfileHeader';
import ProfileInfoCard from '../components/lawyer/ProfileInfoCard';
import PerformanceSection from '../components/lawyer/PerformanceSection';
import BillingCard from '../components/lawyer/BillingCard';
import AccountSettingsCard from '../components/lawyer/AccountSettingsCard';

export default function LawyerProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [cases, setCases] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function init() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin(createPageUrl('LawyerProfile'));
        return;
      }
      if (!user) { base44.auth.redirectToLogin(createPageUrl('LawyerProfile')); return; }
      const profiles = await base44.entities.LawyerProfile.filter({ email: user.email });
      if (!profiles[0]) { window.location.href = createPageUrl('Home'); return; }
      setProfile(profiles[0]);
      base44.entities.LawyerProfile.update(profiles[0].id, { last_active: new Date().toISOString() });
      const [allCases, allLogs] = await Promise.all([
        base44.entities.Case.filter({ assigned_lawyer_id: profiles[0].id }, '-assigned_at', 500),
        base44.entities.ContactLog.filter({ lawyer_id: profiles[0].id }, '-created_date', 1000)
      ]);
      setCases(allCases);
      setContactLogs(allLogs);
      setLoading(false);
    }
    init();
  }, []);

  const handleSave = async (updates) => {
    try {
      await base44.entities.LawyerProfile.update(profile.id, updates);
      setProfile(prev => ({ ...prev, ...updates }));
      setToast('Profile updated');
    } catch (e) {
      console.error('Profile save failed:', e);
      setToast('Failed to save — please try again');
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading profile" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0 }}>Attorney Profile</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading profile…</p>
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
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0 }}>Attorney Profile</h1>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <ProfileHeader profile={profile} />
        <ProfileInfoCard profile={profile} onSave={handleSave} />
        <PerformanceSection cases={cases} contactLogs={contactLogs} lawyerProfile={profile} />
        <BillingCard profile={profile} />
        <AccountSettingsCard />
      </div>

      {toast && (
        <div role="alert" aria-live="assertive" style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, backgroundColor: '#15803D', color: 'white',
          padding: '12px 24px', borderRadius: '10px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer'
        }} onClick={() => setToast('')}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}