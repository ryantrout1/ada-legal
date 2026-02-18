import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Building2, Mail, Phone } from 'lucide-react';
import CaseStatusBadge from '../components/portal/CaseStatusBadge';
import CaseTimeline from '../components/portal/CaseTimeline';
import SubmissionDetails from '../components/portal/SubmissionDetails';
import SupportBanner from '../components/portal/SupportBanner';

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
      try {
        user = await base44.auth.me();
      } catch {
        base44.auth.redirectToLogin(createPageUrl('CaseDetail') + `?id=${caseId}`);
        return;
      }

      // Fetch case
      const myCases = await base44.entities.Case.filter({ submitter_user_id: user.id });
      const found = myCases.find(c => c.id === caseId);
      if (!found) {
        window.location.href = createPageUrl('MyCases');
        return;
      }
      setCaseData(found);

      // Fetch visible timeline events
      const allEvents = await base44.entities.TimelineEvent.filter(
        { case_id: caseId, visible_to_user: true },
        '-created_date',
        100
      );
      setEvents(allEvents);

      // Fetch assigned lawyer if applicable
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
      <div
        role="status" aria-label="Loading case details"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 200px)', gap: '1rem'
        }}
      >
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading case…</p>
      </div>
    );
  }

  if (!caseData) return null;

  const c = caseData;

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
          marginBottom: 'var(--space-lg)'
        }}>
          <Link to={createPageUrl('MyCases')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            color: 'var(--terra-600)', fontWeight: 600, textDecoration: 'none'
          }}>
            <ArrowLeft size={16} /> My Cases
          </Link>
          <span style={{ color: 'var(--slate-400)' }}>/</span>
          <span style={{ color: 'var(--slate-600)' }}>Case #{c.id?.slice(0, 8)}</span>
        </div>

        {/* Status Header */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{
              fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              fontWeight: 700, color: 'var(--slate-900)', margin: 0
            }}>
              {c.business_name}
            </h1>
            {c.status === 'closed' ? (
              <span style={{
                display: 'inline-block', padding: '0.375rem 1rem',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
                color: 'white', backgroundColor: 'var(--slate-500)', borderRadius: '9999px',
                textTransform: 'uppercase'
              }}>Closed</span>
            ) : (
              <CaseStatusBadge status={c.status} large />
            )}
          </div>
        </div>

        {/* Closed case resolution message */}
        {c.status === 'closed' && (() => {
          const closedEvent = events.find(e => e.event_type === 'closed');
          if (!closedEvent) return null;
          return (
            <div style={{
              backgroundColor: '#F8FAFC', border: '1px solid var(--slate-300)',
              borderRadius: '16px', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)'
            }}>
              <h2 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
                color: 'var(--slate-900)', margin: '0 0 var(--space-sm) 0'
              }}>
                Case Resolution
              </h2>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--slate-700)', lineHeight: 1.7, margin: 0
              }}>
                {closedEvent.event_description}
              </p>
            </div>
          );
        })()}

        {/* Assigned Attorney */}
        {lawyer && ['assigned', 'in_progress', 'closed'].includes(c.status) && (
          <div style={{
            backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: '16px', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)'
          }}>
            <h2 style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
              color: '#065F46', margin: '0 0 var(--space-md) 0'
            }}>
              Your Assigned Attorney
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} style={{ color: '#15803D' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B', fontWeight: 600 }}>
                  {lawyer.full_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={16} style={{ color: '#15803D' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B' }}>
                  {lawyer.firm_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: '#15803D' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B' }}>
                  {lawyer.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: '#15803D' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#1E293B' }}>
                  {lawyer.phone}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)'
        }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
            color: 'var(--slate-900)', margin: '0 0 var(--space-lg) 0'
          }}>
            Status Timeline
          </h2>
          <CaseTimeline events={events} />
        </div>

        {/* Original Submission */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)'
        }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
            color: 'var(--slate-900)', margin: '0 0 var(--space-lg) 0'
          }}>
            Original Submission
          </h2>
          <SubmissionDetails caseData={c} />
        </div>

        <SupportBanner />
      </div>
    </div>
  );
}