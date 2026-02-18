import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { User, Building2, Mail, Phone, MapPin, CreditCard, Shield, Pencil } from 'lucide-react';
import ProfileEditForm from '../components/lawyer/ProfileEditForm';
import PerformanceSection from '../components/lawyer/PerformanceSection';

const accountColors = {
  pending_approval: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DCFCE7', text: '#15803D' },
  suspended: { bg: '#FEE2E2', text: '#B91C1C' },
  removed: { bg: '#F1F5F9', text: '#475569' }
};
const subColors = {
  inactive: { bg: '#F1F5F9', text: '#475569' },
  active: { bg: '#DCFCE7', text: '#15803D' },
  canceled: { bg: '#FEE2E2', text: '#B91C1C' },
  past_due: { bg: '#FEF3C7', text: '#92400E' }
};

function StatusBadge({ label, colorMap }) {
  const c = colorMap[label] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.75rem',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
      color: c.text, backgroundColor: c.bg, borderRadius: '9999px',
      textTransform: 'uppercase'
    }}>
      {(label || '').replace(/_/g, ' ')}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: 'var(--space-md)' }}>
      <Icon size={18} style={{ color: 'var(--slate-400)', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
          color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0'
        }}>{label}</p>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          color: 'var(--slate-800)', margin: 0
        }}>{value}</p>
      </div>
    </div>
  );
}

export default function LawyerProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [cases, setCases] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);
  const [editing, setEditing] = useState(false);
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
      if (!user) {
        base44.auth.redirectToLogin(createPageUrl('LawyerProfile'));
        return;
      }
      const profiles = await base44.entities.LawyerProfile.filter({ email: user.email });
      if (!profiles[0]) { window.location.href = createPageUrl('Home'); return; }
      setProfile(profiles[0]);

      // Update last_active
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
    await base44.entities.LawyerProfile.update(profile.id, updates);
    setProfile(prev => ({ ...prev, ...updates }));
    setEditing(false);
    setToast('Profile updated successfully.');
  };

  if (loading) {
    return (
      <div
        role="status" aria-label="Loading profile"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 200px)', gap: '1rem'
        }}
      >
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading profile…</p>
      </div>
    );
  }

  const p = profile;

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-xl)'
        }}>
          My Profile
        </h1>

        {/* Status badges */}
        <div style={{
          display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap',
          marginBottom: 'var(--space-lg)'
        }}>
          <StatusBadge label={p.account_status} colorMap={accountColors} />
          <StatusBadge label={p.subscription_status} colorMap={subColors} />
        </div>

        {/* Profile info */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h2 style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
              color: 'var(--slate-900)', margin: 0
            }}>
              Attorney Information
            </h2>
            {!editing && (
              <button type="button" onClick={() => setEditing(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.75rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                fontWeight: 600, color: 'var(--terra-600)', backgroundColor: 'var(--terra-50)',
                border: '1px solid var(--terra-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer'
              }}>
                <Pencil size={14} /> Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <ProfileEditForm profile={p} onSave={handleSave} onCancel={() => setEditing(false)} />
          ) : (
            <>
              <InfoRow icon={User} label="Full Name" value={p.full_name} />
              <InfoRow icon={Building2} label="Firm" value={p.firm_name} />
              <InfoRow icon={Mail} label="Email" value={p.email} />
              <InfoRow icon={Phone} label="Phone" value={p.phone} />
              <InfoRow icon={MapPin} label="States of Practice" value={(p.states_of_practice || []).join(', ')} />
              <InfoRow icon={Shield} label="Bar Numbers" value={p.bar_numbers} />
            </>
          )}
        </div>

        {/* Performance section */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)'
        }}>
          <PerformanceSection cases={cases} contactLogs={contactLogs} lawyerProfile={p} />
        </div>

        {/* Billing placeholder */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)'
        }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
            color: 'var(--slate-900)', margin: '0 0 var(--space-md) 0'
          }}>
            Billing & Subscription
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'var(--space-md)' }}>
            <CreditCard size={18} style={{ color: 'var(--slate-400)' }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)'
            }}>
              Subscription Status: <strong style={{ textTransform: 'capitalize' }}>
                {(p.subscription_status || 'inactive').replace(/_/g, ' ')}
              </strong>
            </span>
          </div>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            color: 'var(--slate-500)', margin: 0, lineHeight: 1.6
          }}>
            Billing management coming soon. Contact support for subscription changes.
          </p>
        </div>
      </div>

      {toast && (
        <div role="alert" aria-live="assertive" style={{
          position: 'fixed', bottom: 'var(--space-xl)', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1100, backgroundColor: '#15803D', color: 'white',
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer'
        }} onClick={() => setToast('')}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}