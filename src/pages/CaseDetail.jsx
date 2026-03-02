import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Building2, Mail, Phone } from 'lucide-react';
import StatusProgress from '../components/portal/StatusProgress';
import WhatYouReported from '../components/portal/WhatYouReported';
import CaseTimeline from '../components/portal/CaseTimeline';
import CaseHelpCard from '../components/portal/CaseHelpCard';

const STATUS_BADGE_CONFIG = {
  submitted: { label: 'Submitted', bg: 'var(--body-secondary)' },
  under_review: { label: 'Under Review', bg: '#1D4ED8' },
  approved: { label: 'Matched & Waiting', bg: '#15803D' },
  available: { label: 'Matched & Waiting', bg: '#15803D' },
  assigned: { label: 'Attorney Assigned', bg: 'var(--accent)' },
  in_progress: { label: 'Attorney Working Your Case', bg: '#15803D' },
  closed: { label: 'Closed', bg: 'var(--body)' },
  expired: { label: 'Expired', bg: 'var(--body-secondary)' },
  rejected: { label: 'Not Approved', bg: '#B91C1C' }
};

export default function CaseDetail() {
  const [caseData, setCaseData] = useState(null);
  const [events, setEvents] = useState([]);
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  useEffect(() => {
    async function load() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin(createPageUrl('CaseDetail') + `?id=${caseId}`);
        return;
      }
      const myCases = await base44.entities.Case.filter({ submitter_user_id: user.id });
      const found = myCases.find(c => c.id === caseId);
      if (!found) { window.location.href = createPageUrl('MyCases'); return; }
      setCaseData(found);

      const allEvents = await base44.entities.TimelineEvent.filter(
        { case_id: caseId, visible_to_user: true }, '-created_date', 100
      );
      setEvents(allEvents);

      if (['assigned', 'in_progress', 'closed'].includes(found.status) && found.assigned_lawyer_id) {
        const lawyers = await base44.entities.LawyerProfile.filter({ id: found.assigned_lawyer_id });
        if (lawyers.length > 0) setLawyer(lawyers[0]);
      }
      setLoading(false);
    }
    load();
  }, [caseId]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading case details" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading case…</p>
      </div>
    );
  }

  if (!caseData) return null;
  const c = caseData;
  const badge = STATUS_BADGE_CONFIG[c.status] || STATUS_BADGE_CONFIG.submitted;
  const closedEvent = events.find(e => e.event_type === 'closed');

  return (
    <div style={{ backgroundColor: 'var(--page-bg-subtle)', minHeight: 'calc(100vh - 200px)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem' }}>
          <Link to={createPageUrl('MyCases')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--section-label)', fontWeight: 600, textDecoration: 'none'
          }}>
            <ArrowLeft size={16} /> My Cases
          </Link>
          <span style={{ color: 'var(--body-secondary)' }}>/</span>
          <span style={{ color: 'var(--body-secondary)' }}>Case #{c.id?.slice(0, 8)}</span>
        </div>

        {/* Page Header */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
        }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>
            {c.business_name}
          </h1>
          <span role="status" aria-label={`Case status: ${badge.label}`} style={{
            display: 'inline-block', padding: '8px 18px', borderRadius: '10px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
            color: 'white', backgroundColor: badge.bg, whiteSpace: 'nowrap'
          }}>{badge.label}</span>
        </div>

        {/* Status Progress */}
        <StatusProgress
          status={c.status}
          closedEventDescription={closedEvent?.event_description}
        />

        {/* Assigned Attorney */}
        {lawyer && ['assigned', 'in_progress', 'closed'].includes(c.status) && (
          <div style={{
            backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: '12px', padding: '24px'
          }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: '#065F46', margin: '0 0 12px' }}>
              Your Assigned Attorney
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: '#15803D' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B', fontWeight: 600 }}>
                  {lawyer.full_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} style={{ color: '#15803D' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B' }}>
                  {lawyer.firm_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: '#15803D' }} />
                <a href={`mailto:${lawyer.email}`} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B', textDecoration: 'none' }}>
                  {lawyer.email}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} style={{ color: '#15803D' }} />
                <a href={`tel:${lawyer.phone}`} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B', textDecoration: 'none' }}>
                  {lawyer.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* What You Reported */}
        <WhatYouReported caseData={c} />

        {/* Timeline */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px'
        }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--heading)', margin: '0 0 16px' }}>
            Timeline
          </h2>
          <CaseTimeline events={events} />
        </div>

        {/* Help Card */}
        <CaseHelpCard caseId={c.id} />
      </div>
    </div>
  );
}