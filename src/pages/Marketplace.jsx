import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import trackEvent from '../components/analytics/trackEvent';
import { useAnnounce } from '../components/a11y/LiveAnnouncer';
import { createPageUrl } from '../utils';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters';
import CaseCard from '../components/marketplace/CaseCard';
import CaseListRow from '../components/marketplace/CaseListRow';
import ViewToggle from '../components/marketplace/ViewToggle';
import CaseDetailModal from '../components/marketplace/CaseDetailModal';
import InitiateSupportModal from '../components/marketplace/InitiateSupportModal';
import DocScoreModal from '../components/marketplace/DocScoreModal';
import { calculateDocScore, getFreshness } from '../components/marketplace/docScore';
import { renderEmailTemplate } from '../components/emails/renderTemplate';
import { HelpCircle } from 'lucide-react';

export default function Marketplace() {
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState(null);
  const [lawyerProfile, setLawyerProfile] = useState(null);
  const [cases, setCases] = useState([]);
  const [filters, setFilters] = useState({
    state: 'my_states',
    violationType: 'all',
    businessType: 'all',
    sort: 'newest',
    posted: 'any',
    documentation: 'all'
  });
  const [detailCase, setDetailCase] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [raceError, setRaceError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  useEffect(() => {
    async function init() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin(createPageUrl('Marketplace'));
        return;
      }
      if (!user) { base44.auth.redirectToLogin(createPageUrl('Marketplace')); return; }

      const profiles = await base44.entities.LawyerProfile.filter({ email: user.email });
      const profile = profiles[0];
      if (!profile) { setAccessState('denied'); setLoading(false); return; }
      setLawyerProfile(profile);
      if (profile.account_status !== 'approved') { setAccessState('pending'); setLoading(false); return; }
      if (profile.subscription_status !== 'active') { setAccessState('no_sub'); setLoading(false); return; }

      const available = await base44.entities.Case.filter({ status: 'available' }, '-approved_at', 200);
      setCases(available);
      setAccessState('ok');
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div role="status" aria-label="Loading available cases" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Case Marketplace</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-600)' }}>Loading available cases…</p>
      </div>
    );
  }

  if (accessState === 'denied') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-sm)' }}>Access Restricted</h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
            This page is for approved attorneys only. If you'd like to join the attorney network, please <a href={createPageUrl('LawyerRegister')} style={{ color: 'var(--terra-600)', fontWeight: 600 }}>apply here</a>.
          </p>
        </div>
      </div>
    );
  }

  if (accessState === 'pending') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px', backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-lg)', fontSize: '1.75rem' }}>⏳</div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-sm)' }}>Application Pending</h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--slate-600)', lineHeight: 1.6, margin: 0 }}>
            Your application is currently under review. You'll receive an email once your account has been approved.
          </p>
        </div>
      </div>
    );
  }

  if (accessState === 'no_sub') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px', backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-sm)' }}>Subscription Required</h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
            Your account is approved, but you need an active subscription to access available cases.
          </p>
          <a href={createPageUrl('LawyerSubscription')} style={{
            display: 'inline-block', padding: '0.75rem 2rem', fontFamily: 'Manrope, sans-serif',
            fontSize: '1rem', fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600)',
            borderRadius: 'var(--radius-md)', textDecoration: 'none'
          }}>Activate Subscription</a>
        </div>
      </div>
    );
  }

  // State normalization
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
  const normalizeState = (s) => { if (!s) return ''; const t = s.trim(); return t.length === 2 ? t.toUpperCase() : (STATE_NAME_TO_ABBR[t] || t); };

  const lawyerStates = lawyerProfile?.states_of_practice || [];

  const filteredCases = cases
    .filter(c => {
      if (filters.state === 'my_states') return lawyerStates.includes(normalizeState(c.state));
      if (filters.state !== 'all') return normalizeState(c.state) === filters.state;
      return true;
    })
    .filter(c => filters.violationType === 'all' || c.violation_type === filters.violationType)
    .filter(c => filters.businessType === 'all' || c.business_type === filters.businessType)
    .filter(c => {
      if (!filters.posted || filters.posted === 'any') return true;
      const fresh = getFreshness(c);
      if (filters.posted === '7') return fresh.daysAgo <= 7;
      if (filters.posted === '30') return fresh.daysAgo <= 30;
      if (filters.posted === 'older') return fresh.daysAgo > 30;
      return true;
    })
    .filter(c => {
      if (!filters.documentation || filters.documentation === 'all') return true;
      const score = calculateDocScore(c).score;
      return score >= parseInt(filters.documentation);
    })
    .sort((a, b) => {
      const dateA = new Date(a.approved_at || a.created_date);
      const dateB = new Date(b.approved_at || b.created_date);
      return filters.sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleViewDetails = (caseData) => {
    setDetailCase(caseData);
    base44.entities.Case.update(caseData.id, { marketplace_views: (caseData.marketplace_views || 0) + 1 });
  };

  const handleInitiateFromModal = (caseData) => { setDetailCase(null); setSelectedCase(caseData); };

  const handleConfirmInitiate = async () => {
    if (!selectedCase || !lawyerProfile || processing) return;
    setProcessing(true);
    setRaceError('');
    const now = new Date().toISOString();
    const c = selectedCase;

    const freshCases = await base44.entities.Case.filter({ id: c.id });
    const freshCase = freshCases[0];
    if (!freshCase || freshCase.status !== 'available') {
      setCases(prev => prev.filter(x => x.id !== c.id));
      setRaceError('This case has already been assigned to another attorney. It is no longer available.');
      setProcessing(false);
      return;
    }

    await base44.entities.Case.update(c.id, { status: 'assigned', assigned_lawyer_id: lawyerProfile.id, assigned_at: now });
    base44.analytics.track({ eventName: 'attorney_case_accepted', properties: { case_id: c.id, violation_type: c.violation_type } });
    trackEvent('attorney_case_accepted', { case_id: c.id, violation_type: c.violation_type }, 'Marketplace');
    base44.analytics.track({ eventName: 'case_status_changed', properties: { case_id: c.id, old_status: 'available', new_status: 'assigned' } });
    trackEvent('case_status_changed', { case_id: c.id, old_status: 'available', new_status: 'assigned' }, 'Marketplace');
    setCases(prev => prev.filter(x => x.id !== c.id));

    await base44.entities.TimelineEvent.create({
      case_id: c.id, event_type: 'assigned',
      event_description: 'An attorney has been assigned to your case.',
      actor_role: 'lawyer', visible_to_user: true, created_at: now
    });

    const portalUrl = window.location.origin + '/MyCases';
    const prefLabel = c.contact_preference === 'phone' ? 'Phone' : c.contact_preference === 'email' ? 'Email' : 'No Preference';
    const violLabel = c.violation_type === 'physical_space' ? 'Physical Space' : 'Digital / Website';
    const loc = [c.city, c.state].filter(Boolean).join(', ');

    // Reporter email
    const reporterEmail = await renderEmailTemplate('attorney_assigned_reporter', {
      reporter_name: c.contact_name, business_name: c.business_name,
      attorney_name: lawyerProfile.full_name, attorney_firm: lawyerProfile.firm_name,
      contact_preference: prefLabel, case_url: portalUrl
    });
    if (reporterEmail) {
      await base44.integrations.Core.SendEmail({ to: c.contact_email, subject: reporterEmail.subject, body: reporterEmail.body });
    }

    // Attorney confirmation email
    const attorneyEmail = await renderEmailTemplate('attorney_assigned_confirmation', {
      attorney_name: lawyerProfile.full_name, business_name: c.business_name,
      case_location: loc, violation_type: violLabel,
      reporter_name: c.contact_name, reporter_email: c.contact_email,
      reporter_phone: c.contact_phone, contact_preference: prefLabel,
      dashboard_url: window.location.origin + '/LawyerDashboard'
    });
    if (attorneyEmail) {
      await base44.integrations.Core.SendEmail({ to: lawyerProfile.email, subject: attorneyEmail.subject, body: attorneyEmail.body });
    }

    setProcessing(false);
    setSelectedCase(null);
    window.location.href = createPageUrl('LawyerDashboard') + `?highlight=${c.id}`;
  };

  const resetFilters = () => setFilters({ state: 'my_states', violationType: 'all', businessType: 'all', sort: 'newest', posted: 'any', documentation: 'all' });

  const hasActiveFilters = filters.state !== 'my_states' || filters.violationType !== 'all' || filters.businessType !== 'all' || filters.posted !== 'any' || filters.documentation !== 'all';

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'var(--space-xl) var(--space-lg)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--space-md)' }}>
          Available Cases
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px', marginBottom: 'var(--space-lg)', width: '100%' }}>
          <MarketplaceFilters filters={filters} onChange={setFilters} lawyerStates={lawyerStates} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.25rem' }}>
            <button type="button" onClick={() => setScoreModalOpen(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--terra-600)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
            >
              <HelpCircle size={14} /> How are cases scored?
            </button>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-600)' }}>
              {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''}
            </span>
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {filteredCases.length === 0 && (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '16px', padding: 'var(--space-2xl)', textAlign: 'center'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--slate-700)', margin: '0 0 8px' }}>
              No cases match these filters
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569', margin: '0 0 16px' }}>
              There {cases.length === 1 ? 'is' : 'are'} {cases.length} case{cases.length !== 1 ? 's' : ''} available with different criteria
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} style={{
                background: 'none', border: '1px solid var(--slate-300)', borderRadius: 'var(--radius-md)',
                padding: '8px 20px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', fontWeight: 600, color: 'var(--terra-600)'
              }}>Reset Filters</button>
            )}
          </div>
        )}

        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
            gap: '16px'
          }}>
            {filteredCases.map(c => (
              <CaseCard key={c.id} caseData={c} onViewDetails={handleViewDetails} />
            ))}
          </div>
        ) : (
          filteredCases.length > 0 && (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <caption className="sr-only">Available cases</caption>
                <thead>
                  <tr>
                    {['Type', 'Business', 'City / State', 'Subtype', 'Score', '', 'Posted', 'Reports', ''].map(h => (
                      <th key={h} scope="col" style={{
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700,
                        color: '#475569', textAlign: 'left', padding: '6px 0.75rem',
                        borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase',
                        letterSpacing: '0.04em', whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c, i) => (
                    <CaseListRow key={c.id} caseData={c} onViewDetails={handleViewDetails} isEven={i % 2 === 1} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <CaseDetailModal caseData={detailCase} onClose={() => setDetailCase(null)} onInitiate={handleInitiateFromModal} />
      <InitiateSupportModal
        open={!!selectedCase || !!raceError}
        onCancel={() => { if (!processing) { setSelectedCase(null); setRaceError(''); } }}
        onConfirm={handleConfirmInitiate}
        processing={processing}
        raceError={raceError}
        onDismissError={() => { setSelectedCase(null); setRaceError(''); }}
      />
      <DocScoreModal open={scoreModalOpen} onClose={() => setScoreModalOpen(false)} caseData={null} />
    </div>
  );
}