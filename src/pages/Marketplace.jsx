import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAnnounce } from '../components/a11y/LiveAnnouncer';
import { createPageUrl } from '../utils';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters';
import CaseCard from '../components/marketplace/CaseCard';
import CaseListRow from '../components/marketplace/CaseListRow';
import ViewToggle from '../components/marketplace/ViewToggle';
import CaseDetailModal from '../components/marketplace/CaseDetailModal';
import InitiateSupportModal from '../components/marketplace/InitiateSupportModal';
import { attorneyAssignedEmail } from '../components/emails/caseEmails';

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
  const [detailCase, setDetailCase] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [raceError, setRaceError] = useState('');
  const [viewMode, setViewMode] = useState('grid');

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
      <div
        role="status" aria-label="Loading marketplace"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 200px)', gap: '1rem'
        }}
      >
        <div className="a11y-spinner" aria-hidden="true" />
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

  // State name → abbreviation map for matching
  const STATE_NAME_TO_ABBR = {
    'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
    'Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA',
    'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY',
    'Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
    'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
    'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
    'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
    'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
    'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
  };

  const normalizeState = (s) => {
    if (!s) return '';
    const trimmed = s.trim();
    if (trimmed.length === 2) return trimmed.toUpperCase();
    return STATE_NAME_TO_ABBR[trimmed] || trimmed;
  };

  // Filter cases
  const lawyerStates = lawyerProfile?.states_of_practice || [];

  const filteredCases = cases
    .filter(c => {
      if (filters.state === 'my_states') {
        return lawyerStates.includes(normalizeState(c.state));
      }
      if (filters.state !== 'all') return normalizeState(c.state) === filters.state;
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

  const handleViewDetails = (caseData) => {
    setDetailCase(caseData);
  };

  const handleInitiateFromModal = (caseData) => {
    setDetailCase(null);
    setSelectedCase(caseData);
  };

  const handleConfirmInitiate = async () => {
    if (!selectedCase || !lawyerProfile || processing) return;
    setProcessing(true);
    setRaceError('');

    const now = new Date().toISOString();
    const c = selectedCase;

    // Race condition check: re-fetch case to ensure it's still available
    const freshCases = await base44.entities.Case.filter({ id: c.id });
    const freshCase = freshCases[0];
    if (!freshCase || freshCase.status !== 'available') {
      setCases(prev => prev.filter(x => x.id !== c.id));
      setRaceError('This case has already been assigned to another attorney. It has been removed from the marketplace.');
      setProcessing(false);
      return;
    }

    // 1. Update case: assign to lawyer
    await base44.entities.Case.update(c.id, {
      status: 'assigned',
      assigned_lawyer_id: lawyerProfile.id,
      assigned_at: now
    });

    // 2. Remove from local list immediately
    setCases(prev => prev.filter(x => x.id !== c.id));

    // 3. Create timeline event
    await base44.entities.TimelineEvent.create({
      case_id: c.id,
      event_type: 'assigned',
      event_description: 'An attorney has been assigned to your case.',
      actor_role: 'lawyer',
      visible_to_user: true,
      created_at: now
    });

    // 4. Send branded email to claimant
    const portalUrl = window.location.origin + '/MyCases';
    await base44.integrations.Core.SendEmail({
      to: c.contact_email,
      subject: 'Attorney Assigned — ADA Legal Marketplace',
      body: attorneyAssignedEmail(c, lawyerProfile.full_name, lawyerProfile.firm_name, portalUrl)
    });

    // 5. Send email to lawyer
    await base44.integrations.Core.SendEmail({
      to: lawyerProfile.email,
      subject: 'Support Initiation Confirmed — ADA Legal Marketplace',
      body: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E293B;">Support Initiation Confirmed</h2>
          <p>Dear ${lawyerProfile.full_name},</p>
          <p>You have successfully initiated support for the following case:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Business</td><td style="padding: 8px;">${c.business_name}</td></tr>
            <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Location</td><td style="padding: 8px;">${[c.city, c.state].filter(Boolean).join(', ')}</td></tr>
            <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Violation Type</td><td style="padding: 8px;">${c.violation_type === 'physical_space' ? 'Physical Space' : 'Digital / Website'}</td></tr>
            <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Claimant</td><td style="padding: 8px;">${c.contact_name}</td></tr>
            <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Claimant Email</td><td style="padding: 8px;">${c.contact_email}</td></tr>
            <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Claimant Phone</td><td style="padding: 8px;">${c.contact_phone}</td></tr>
            <tr><td style="padding: 8px; color: #64748B; font-weight: 600;">Contact Preference</td><td style="padding: 8px;">${c.contact_preference === 'phone' ? 'Phone' : c.contact_preference === 'email' ? 'Email' : 'No Preference'}</td></tr>
          </table>
          <p><strong>Reminder:</strong> You are required to contact the claimant within <strong>24 hours</strong>.</p>
          <p style="color: #64748B; font-size: 0.875rem; font-style: italic; margin-top: 24px;">
            ADA Legal Marketplace — Connecting people with experienced ADA attorneys.
          </p>
        </div>
      `
    });

    setProcessing(false);
    setSelectedCase(null);

    // 6. Redirect to lawyer dashboard with highlight
    window.location.href = createPageUrl('LawyerDashboard') + `?highlight=${c.id}`;
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', width: '100%' }}>
          <MarketplaceFilters filters={filters} onChange={setFilters} lawyerStates={lawyerStates} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: '0.25rem' }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-500)' }}>
              {filteredCases.length} available case{filteredCases.length !== 1 ? 's' : ''}
            </span>
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>
        </div>

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

        {viewMode === 'grid' ? (
          <div className="marketplace-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))',
            gap: 'var(--space-lg)'
          }}>
            {filteredCases.map(c => (
              <CaseCard key={c.id} caseData={c} onViewDetails={handleViewDetails} />
            ))}
          </div>
        ) : (
          filteredCases.length > 0 && (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <caption className="sr-only">Available marketplace cases</caption>
                <thead>
                  <tr>
                    {['Type', 'Business Type', 'City / State', 'Subtype / Domain', 'Posted', ''].map(h => (
                      <th key={h} scope="col" style={{
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                        color: 'var(--slate-500)', textAlign: 'left', padding: '0.5rem 0.75rem',
                        borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase',
                        letterSpacing: '0.04em', whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map(c => (
                    <CaseListRow key={c.id} caseData={c} onViewDetails={handleViewDetails} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <CaseDetailModal
        caseData={detailCase}
        onClose={() => setDetailCase(null)}
        onInitiate={handleInitiateFromModal}
      />

      <InitiateSupportModal
        open={!!selectedCase || !!raceError}
        onCancel={() => { if (!processing) { setSelectedCase(null); setRaceError(''); } }}
        onConfirm={handleConfirmInitiate}
        processing={processing}
        raceError={raceError}
        onDismissError={() => { setSelectedCase(null); setRaceError(''); }}
      />
    </div>
  );
}