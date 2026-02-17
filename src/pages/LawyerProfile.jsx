import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { User, Building2, Mail, Phone, MapPin, CreditCard, Shield } from 'lucide-react';

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
      if (!profiles[0]) {
        window.location.href = createPageUrl('Home');
        return;
      }
      setProfile(profiles[0]);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
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
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
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
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
            color: 'var(--slate-900)', margin: '0 0 var(--space-lg) 0'
          }}>
            Attorney Information
          </h2>
          <InfoRow icon={User} label="Full Name" value={p.full_name} />
          <InfoRow icon={Building2} label="Firm" value={p.firm_name} />
          <InfoRow icon={Mail} label="Email" value={p.email} />
          <InfoRow icon={Phone} label="Phone" value={p.phone} />
          <InfoRow icon={MapPin} label="States of Practice" value={(p.states_of_practice || []).join(', ')} />
          <InfoRow icon={Shield} label="Bar Numbers" value={p.bar_numbers} />
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
    </div>
  );
}