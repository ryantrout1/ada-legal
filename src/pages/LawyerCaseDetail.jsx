import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Building2, Globe, User, Mail, Phone, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: 'var(--space-md)' }}>
      <Icon size={18} style={{ color: 'var(--slate-500)', flexShrink: 0, marginTop: '2px' }} />
      <div>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
          color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>{label}</span>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-800)',
          margin: '2px 0 0 0', lineHeight: 1.5
        }}>{value}</p>
      </div>
    </div>
  );
}

export default function LawyerCaseDetail() {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  useEffect(() => {
    async function load() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin();
        return;
      }
      const profiles = await base44.entities.LawyerProfile.filter({ email: user.email });
      const profile = profiles[0];
      if (!profile || profile.account_status !== 'approved') {
        window.location.href = createPageUrl('Marketplace');
        return;
      }

      const allCases = await base44.entities.Case.filter({ assigned_lawyer_id: profile.id });
      const found = allCases.find(c => c.id === caseId);
      if (!found) {
        window.location.href = createPageUrl('Marketplace');
        return;
      }
      setCaseData(found);
      setLoading(false);
    }
    load();
  }, [caseId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading case…</p>
      </div>
    );
  }

  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to={createPageUrl('LawyerDashboard')} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--terra-600)', textDecoration: 'none', marginBottom: 'var(--space-lg)'
        }}>
          <ArrowLeft size={16} /> Back to My Cases
        </Link>

        {/* Header */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'var(--space-lg)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
              backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF'
            }}>
              {isPhysical
                ? <Building2 size={20} style={{ color: '#1E3A8A' }} />
                : <Globe size={20} style={{ color: '#7C3AED' }} />
              }
            </span>
            <div>
              <h1 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700,
                color: 'var(--slate-900)', margin: 0
              }}>
                {c.business_name}
              </h1>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                color: isPhysical ? '#1E3A8A' : '#7C3AED', fontWeight: 600
              }}>
                {isPhysical ? 'Physical Space Violation' : 'Digital / Website Violation'}
              </span>
            </div>
            <span style={{
              marginLeft: 'auto', padding: '0.25rem 0.75rem',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: '#1E3A8A', backgroundColor: '#DBEAFE', borderRadius: '9999px',
              textTransform: 'uppercase'
            }}>
              Assigned to You
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
            <div>
              <DetailRow icon={Building2} label="Business Type" value={c.business_type} />
              <DetailRow icon={MapPin} label="Location" value={
                isPhysical
                  ? [c.street_address, c.city, c.state].filter(Boolean).join(', ')
                  : [c.city, c.state].filter(Boolean).join(', ') || null
              } />
              {isPhysical && <DetailRow icon={Building2} label="Violation Sub-type" value={c.violation_subtype} />}
              {!isPhysical && <DetailRow icon={Globe} label="URL / Domain" value={c.url_domain} />}
              {!isPhysical && c.assistive_tech?.length > 0 && (
                <DetailRow icon={Globe} label="Assistive Tech" value={c.assistive_tech.join(', ')} />
              )}
              <DetailRow icon={Calendar} label="Incident Date" value={formatDate(c.incident_date)} />
            </div>
            <div>
              <DetailRow icon={User} label="Reporter Name" value={c.contact_name} />
              <DetailRow icon={Mail} label="Email" value={c.contact_email} />
              <DetailRow icon={Phone} label="Phone" value={c.contact_phone} />
              <DetailRow icon={User} label="Contact Preference" value={
                c.contact_preference === 'phone' ? 'Phone' :
                c.contact_preference === 'email' ? 'Email' : 'No Preference'
              } />
              <DetailRow icon={Calendar} label="Assigned Date" value={formatDate(c.assigned_at)} />
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '16px', padding: 'var(--space-xl)'
        }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
            color: 'var(--slate-900)', marginBottom: 'var(--space-md)', marginTop: 0
          }}>
            Full Narrative
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            color: 'var(--slate-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            margin: 0
          }}>
            {c.narrative}
          </p>
        </div>
      </div>
    </div>
  );
}