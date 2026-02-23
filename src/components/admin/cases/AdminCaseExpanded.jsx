import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';
import AdminCaseTimeline from './AdminCaseTimeline';
import PhotoGallery from '../../shared/PhotoGallery';
import SourceBadge from '../../shared/SourceBadge';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const VISITED_LABELS = { yes: 'Yes', no: 'No', first_time: 'First time' };
const CONTACT_PREF_LABELS = { phone: 'Phone', email: 'Email', no_preference: 'No preference' };
const RESOLUTION_LABELS = {
  engaged: 'Engaged', referred_out: 'Referred Out', not_viable: 'Not Viable',
  claimant_unresponsive: 'Claimant Unresponsive', claimant_declined: 'Claimant Declined',
  admin_closed: 'Admin Closed'
};

function DocScoreDots({ caseData }) {
  const c = caseData;
  const criteria = [
    { label: 'Narrative', met: c.narrative?.length >= 100 },
    { label: 'Date', met: !!c.incident_date },
    { label: 'Location', met: !!(c.city && c.state) },
    { label: 'Business', met: !!c.business_name },
    { label: 'Contact', met: !!(c.contact_email && c.contact_phone) },
    { label: 'Subtype', met: !!(c.violation_subtype || c.url_domain) },
    { label: 'Photos', met: c.photos?.length > 0 }
  ];
  const score = criteria.filter(cr => cr.met).length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>
        Documentation: {score}/7
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {criteria.map((cr, i) => (
          <div key={i} title={cr.label} style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: cr.met ? '#15803D' : '#E2E8F0'
          }} />
        ))}
      </div>
    </div>
  );
}

const LABEL_STYLE = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
  color: '#475569', margin: '0 0 2px', textTransform: 'uppercase'
};

const VALUE_STYLE = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0
};

export default function AdminCaseExpanded({ caseData, lawyer, onForceClose, onReassign }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const isClosed = ['closed', 'rejected', 'expired'].includes(c.status);
  const isReviewable = ['submitted', 'under_review'].includes(c.status);
  const isAssigned = ['assigned', 'in_progress'].includes(c.status);
  const isAvailable = c.status === 'available';

  return (
    <div style={{ borderTop: '1px solid var(--slate-200)', padding: '20px' }}>
      {/* Violation Summary Card */}
      <div style={{
        backgroundColor: 'var(--slate-50)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px'
      }}>
        <div style={{ height: '6px', backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE' }} />
        <div style={{ padding: '16px' }}>
          {/* Row 1: 3 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
            <div>
              <p style={LABEL_STYLE}>Business</p>
              <p style={{ ...VALUE_STYLE, fontWeight: 700, color: 'var(--slate-900)' }}>{c.business_name}</p>
            </div>
            <div>
              <p style={LABEL_STYLE}>Type</p>
              <p style={VALUE_STYLE}>{c.business_type}</p>
            </div>
            <div>
              <p style={LABEL_STYLE}>Location</p>
              <p style={VALUE_STYLE}>
                {[c.city, c.state].filter(Boolean).join(', ')}
                {c.street_address && <><br />{c.street_address}</>}
              </p>
            </div>
          </div>

          {/* Row 2: 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '12px' }}>
            <div>
              <p style={LABEL_STYLE}>{isPhysical ? 'Violation Subtype' : 'URL / Domain'}</p>
              <p style={VALUE_STYLE}>{isPhysical ? (c.violation_subtype || '—') : (c.url_domain || '—')}</p>
            </div>
            <div>
              <p style={LABEL_STYLE}>Incident Date</p>
              <p style={VALUE_STYLE}>{formatDate(c.incident_date)}</p>
            </div>
          </div>

          {/* Digital only: assistive tech */}
          {!isPhysical && c.assistive_tech?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ ...LABEL_STYLE, margin: '0 0 6px' }}>Assistive Technologies</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {c.assistive_tech.map((t, i) => (
                  <span key={i} style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                    color: '#1E3A5F', backgroundColor: '#DBEAFE'
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Visited Before */}
          <div>
            <p style={LABEL_STYLE}>Visited Before?</p>
            <p style={VALUE_STYLE}>{VISITED_LABELS[c.visited_before] || '—'}</p>
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div style={{
        borderLeft: '3px solid #C2410C', backgroundColor: '#FFF7ED',
        padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '16px'
      }}>
        <p style={{ ...LABEL_STYLE, margin: '0 0 6px' }}>Claimant Narrative</p>
        <p style={{ ...VALUE_STYLE, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.narrative}</p>
      </div>

      {/* Photos */}
      {c.photos?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ ...LABEL_STYLE, margin: '0 0 8px' }}>Evidence Photos</p>
          <PhotoGallery photos={c.photos} />
        </div>
      )}

      {/* Claimant Contact Card */}
      <div style={{
        backgroundColor: 'var(--slate-50)', borderRadius: '12px', padding: '16px', marginBottom: '16px'
      }}>
        <p style={{ ...LABEL_STYLE, margin: '0 0 12px' }}>Claimant Contact</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} style={{ color: '#94A3B8' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={14} style={{ color: '#94A3B8' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={14} style={{ color: '#94A3B8' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_phone}</span>
          </div>
        </div>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
          color: '#1E293B', backgroundColor: 'var(--slate-200)'
        }}>Prefers: {CONTACT_PREF_LABELS[c.contact_preference] || '—'}</span>
      </div>

      {/* Case Metadata */}
      <div style={{
        display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px',
        padding: '12px 16px', backgroundColor: 'var(--slate-50)', borderRadius: '8px'
      }}>
        <MetaItem label="Submitted" value={formatDate(c.submitted_at || c.created_date)} />
        {c.approved_at && <MetaItem label="Approved" value={formatDate(c.approved_at)} />}
        {c.assigned_at && <MetaItem label="Assigned" value={formatDate(c.assigned_at)} />}
        {c.closed_at && <MetaItem label="Closed" value={formatDate(c.closed_at)} />}
        <MetaItem label="Assigned to" value={lawyer ? lawyer.full_name : 'Unassigned'} />
        {c.qc_reviewer_notes && <MetaItem label="QC Notes" value={c.qc_reviewer_notes} />}
        {c.admin_notes && <MetaItem label="Admin Notes" value={c.admin_notes} />}
        {c.intake_source && <MetaItem label="Source" value={c.intake_source === 'pathway' ? 'Rights Pathway' : 'Direct Report'} />}
      </div>

      {/* Doc Score */}
      <div style={{ marginBottom: '16px' }}>
        <DocScoreDots caseData={c} />
      </div>

      {/* Resolution info for closed cases */}
      {c.status === 'closed' && c.resolution_type && (
        <div style={{
          padding: '12px 16px', backgroundColor: '#F1F5F9', borderRadius: '8px', marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: c.resolution_notes ? '8px' : 0 }}>
            <span style={LABEL_STYLE}>Resolution:</span>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: '#1E293B', backgroundColor: '#E2E8F0'
            }}>{RESOLUTION_LABELS[c.resolution_type] || c.resolution_type}</span>
          </div>
          {c.resolution_notes && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
              {c.resolution_notes}
            </p>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {c.status === 'rejected' && c.rejection_reason && (
        <div style={{
          padding: '12px 16px', backgroundColor: '#FEE2E2', borderRadius: '8px', marginBottom: '16px'
        }}>
          <p style={{ ...LABEL_STYLE, color: '#991B1B', margin: '0 0 4px' }}>Rejection Reason</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#991B1B', margin: 0, lineHeight: 1.5 }}>
            {c.rejection_reason}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div style={{ marginBottom: '20px' }}>
        <AdminCaseTimeline caseId={c.id} />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {/* Reviewable: go to review queue */}
        {isReviewable && (
          <Link
            to={createPageUrl('AdminReview')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              fontWeight: 700, color: '#1D4ED8', backgroundColor: 'transparent',
              border: '2px solid #1D4ED8', borderRadius: '8px', textDecoration: 'none',
              minHeight: '44px'
            }}
          >
            Go to Review Queue <ArrowRight size={16} />
          </Link>
        )}

        {/* Available: force close */}
        {isAvailable && (
          <button type="button" onClick={() => onForceClose(c)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: '#B91C1C', backgroundColor: 'transparent',
            border: '2px solid #B91C1C', borderRadius: '8px', cursor: 'pointer',
            minHeight: '44px'
          }}>
            Force Close Case
          </button>
        )}

        {/* Assigned/In Progress */}
        {isAssigned && (
          <>
            {lawyer && (
              <Link
                to={createPageUrl('AdminLawyers') + `?highlight=${lawyer.id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                  fontWeight: 700, color: '#1D4ED8', backgroundColor: 'transparent',
                  border: '2px solid #1D4ED8', borderRadius: '8px', textDecoration: 'none',
                  minHeight: '44px'
                }}
              >
                View Lawyer Profile <ArrowRight size={16} />
              </Link>
            )}
            <button type="button" onClick={() => onReassign(c)} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              fontWeight: 700, color: '#92400E', backgroundColor: 'transparent',
              border: '2px solid #92400E', borderRadius: '8px', cursor: 'pointer',
              minHeight: '44px'
            }}>
              Reassign Case
            </button>
            <button type="button" onClick={() => onForceClose(c)} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              fontWeight: 700, color: '#B91C1C', backgroundColor: 'transparent',
              border: '2px solid #B91C1C', borderRadius: '8px', cursor: 'pointer',
              minHeight: '44px'
            }}>
              Force Close Case
            </button>
          </>
        )}

        {/* Closed/rejected/expired: no action buttons (read-only) */}
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div style={{ flex: '0 0 auto' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
        {label}:{' '}
      </span>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#334155' }}>
        {value}
      </span>
    </div>
  );
}