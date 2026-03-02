import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Building2, Globe, User, Mail, Phone, Calendar, MapPin, FileText } from 'lucide-react';
import CaseStatusBadge from './CaseStatusBadge';
import ContactComplianceBanner from './ContactComplianceBanner';
import ContactLogHistory from './ContactLogHistory';
import PhotoGallery from '../shared/PhotoGallery';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyCaseCard({ caseData, contactLogs, onLogContact }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: 'var(--space-xl)',
      transition: 'border-color 0.15s, box-shadow 0.15s'
    }}>
      {/* Header: type + status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
            backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF', flexShrink: 0
          }}>
            {isPhysical
              ? <Building2 size={18} style={{ color: '#1E3A8A' }} />
              : <Globe size={18} style={{ color: '#7C3AED' }} />
            }
          </span>
          <div>
            <Link
              to={createPageUrl('LawyerCaseDetail') + `?id=${c.id}`}
              style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 700,
                color: 'var(--heading)', textDecoration: 'none'
              }}
            >
              {c.business_name}
            </Link>
            <span style={{
              display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
              color: isPhysical ? '#1E3A8A' : '#7C3AED', fontWeight: 600
            }}>
              {isPhysical ? 'Physical Space' : 'Digital / Website'}
            </span>
          </div>
        </div>
        <CaseStatusBadge status={c.status} />
      </div>

      {/* Contact Compliance */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <ContactComplianceBanner assignedAt={c.assigned_at} contactLoggedAt={c.contact_logged_at} />
      </div>

      {/* Case Details Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-md)', marginBottom: 'var(--space-md)',
        padding: 'var(--space-md)', backgroundColor: 'var(--page-bg-subtle)',
        borderRadius: 'var(--radius-md)'
      }}>
        <InfoItem icon={Building2} label="Business Type" value={c.business_type} />
        <InfoItem icon={MapPin} label="Location" value={
          isPhysical
            ? [c.street_address, c.city, c.state].filter(Boolean).join(', ')
            : [c.city, c.state].filter(Boolean).join(', ')
        } />
        {isPhysical && <InfoItem icon={Building2} label="Violation" value={c.violation_subtype} />}
        {!isPhysical && <InfoItem icon={Globe} label="URL" value={c.url_domain} />}
        <InfoItem icon={Calendar} label="Incident Date" value={formatDate(c.incident_date)} />
        <InfoItem icon={Calendar} label="Assigned" value={formatDate(c.assigned_at)} />
      </div>

      {/* Contact Info */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-sm)', marginBottom: 'var(--space-md)',
        padding: 'var(--space-md)', backgroundColor: '#FFF7ED',
        borderRadius: 'var(--radius-md)', border: '1px solid #FED7AA'
      }}>
        <InfoItem icon={User} label="Reporter" value={c.contact_name} />
        <InfoItem icon={Mail} label="Email" value={c.contact_email} />
        <InfoItem icon={Phone} label="Phone" value={c.contact_phone} />
        <InfoItem icon={User} label="Preference" value={
          c.contact_preference === 'phone' ? 'Phone' :
          c.contact_preference === 'email' ? 'Email' : 'No Preference'
        } />
      </div>

      {/* Narrative */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-xs)' }}>
          <FileText size={14} style={{ color: 'var(--body-secondary)' }} />
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>Narrative</span>
        </div>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          color: 'var(--body)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0
        }}>
          {c.narrative}
        </p>
        {/* Photos */}
        {c.photos?.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <PhotoGallery photos={c.photos} />
          </div>
        )}
      </div>

      {/* Log Contact Button */}
      <button
        type="button"
        onClick={() => onLogContact(c)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          width: '100%', padding: '0.875rem',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
          color: 'white', backgroundColor: 'var(--section-label)',
          border: 'none', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', minHeight: '52px', transition: 'background-color 0.15s',
          marginBottom: 'var(--space-lg)'
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--section-label)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--section-label)'; }}
      >
        <Phone size={18} />
        Log Contact Made
      </button>

      {/* Contact Log History */}
      <div>
        <h3 style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
          color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
          marginBottom: 'var(--space-sm)', marginTop: 0
        }}>Contact History</h3>
        <ContactLogHistory logs={contactLogs} />
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
      <Icon size={14} aria-hidden="true" style={{ color: 'var(--body-secondary)', flexShrink: 0, marginTop: '3px' }} />
      <div>
        <span style={{
          display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem',
          fontWeight: 700, color: 'var(--body)', textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>{label}</span>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)',
          wordBreak: 'break-word'
        }}>{value}</span>
      </div>
    </div>
  );
}