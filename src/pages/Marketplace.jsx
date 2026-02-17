import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters';
import CaseCard from '../components/marketplace/CaseCard';

export default function Marketplace() {
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState(null); // 'ok' | 'pending' | 'no_sub' | 'denied'
  const [lawyerProfile, setLawyerProfile] = useState(null);
  const [cases, setCases] = useState([]);
  const [filters, setFilters] = useState({
    state: 'my_states',
    violationType: 'all',
    businessType: 'all',
    sort: 'newest'
  });

  useEffect(() => {
    async function init() {
      let user;
      try {
        user = await base44.auth.me();
      } catch {
        base44.auth.redirectToLogin(createPageUrl('Marketplace'));
        return;
      }

      if (!user) {
        base44.auth.redirectToLogin(createPageUrl('Marketplace'));
        return;
      }

      // Find lawyer profile by email
      const profiles = await base44.entities.LawyerProfile.filter({ email: user.email });
      const profile = profiles[0];

      if (!profile) {
        setAccessState('denied');
        setLoading(false);
        return;
      }

      setLawyerProfile(profile);

      if (profile.account_status !== 'approved') {
        setAccessState('pending');
        setLoading(false);
        return;
      }

      if (profile.subscription_status !== 'active') {
        setAccessState('no_sub');
        setLoading(false);
        return;
      }

      // Load available cases
      const available = await base44.entities.Case.filter({ status: 'available' }, '-approved_at', 200);
      setCases(available);
      setAccessState('ok');
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading marketplace…</p>
      </div>
    );
  }

  if (accessState === 'denied') {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', padding: 'var(--space-xl)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700,
            color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
          }}>Access Restricted</h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: 'var(--slate-600)', lineHeight: 1.6
          }}>
            This page is for approved attorneys only. If you'd like to join the marketplace, please <a href={createPageUrl('LawyerRegister')} style={{ color: 'var(--terra-600)', fontWeight: 600 }}>apply here</a>.
          </p>
        </div>
      </div>
    );
  }

  if (accessState === 'pending') {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', padding: 'var(--space-xl)'
      }}>
        <div style={{
          textAlign: 'center', maxWidth: '480px', backgroundColor: 'var(--surface)',
          border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2xl)'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto var(--space-lg)',
            fontSize: '1.75rem'
          }}>⏳</div>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700,
            color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
          }}>Application Pending</h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: 'var(--slate-600)', lineHeight: 1.6, margin: 0
          }}>
            Your application is currently under review. You'll receive an email once your account has been approved.
          </p>
        </div>
      </div>
    );
  }

  if (accessState === 'no_sub') {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', padding: 'var(--space-xl)'
      }}>
        <div style={{
          textAlign: 'center', maxWidth: '480px', backgroundColor: 'var(--surface)',
          border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2xl)'
        }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700,
            color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
          }}>Subscription Required</h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: 'var(--space-lg)'
          }}>
            Your account is approved, but you need an active subscription to access the marketplace.
          </p>
          <a
            href={createPageUrl('LawyerSubscription')}
            style={{
              display: 'inline-block', padding: '0.75rem 2rem',
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
              color: 'white', backgroundColor: 'var(--terra-600)',
              borderRadius: 'var(--radius-md)', textDecoration: 'none',
              transition: 'background-color 0.15s'
            }}
          >
            Activate Subscription
          </a>
        </div>
      </div>
    );
  }

  // Filter cases
  const lawyerStates = lawyerProfile?.states_of_practice || [];

  const filteredCases = cases
    .filter(c => {
      if (filters.state === 'my_states') {
        return lawyerStates.includes(c.state);
      }
      if (filters.state !== 'all') return c.state === filters.state;
      return true;
    })
    .filter(c => {
      if (filters.violationType !== 'all') return c.violation_type === filters.violationType;
      return true;
    })
    .filter(c => {
      if (filters.businessType !== 'all') return c.business_type === filters.businessType;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.approved_at || a.created_date);
      const dateB = new Date(b.approved_at || b.created_date);
      return filters.sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleInitiate = (caseData) => {
    window.location.href = createPageUrl('CaseInitiate') + `?id=${caseData.id}`;
  };

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)',
      minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)',
          marginBottom: 'var(--space-xl)'
        }}>
          Available Cases
        </h1>

        <MarketplaceFilters
          filters={filters}
          onChange={setFilters}
          lawyerStates={lawyerStates}
        />

        {filteredCases.length === 0 && (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '16px', padding: 'var(--space-2xl)', textAlign: 'center'
          }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--slate-500)', margin: 0
            }}>
              No available cases match your filters. Try broadening your search.
            </p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {filteredCases.map(c => (
            <CaseCard key={c.id} caseData={c} onInitiate={handleInitiate} />
          ))}
        </div>
      </div>
    </div>
  );
}