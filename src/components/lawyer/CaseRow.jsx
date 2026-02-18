import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Globe, Clock, AlertTriangle, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import ContactLogHistory from './ContactLogHistory';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const METHOD_LABELS = { phone: 'Phone call', email: 'Email', in_person: 'In person', other: 'Other' };

export default function CaseRow({ caseData, contactLogs, group, onLogContact, onResolve, highlighted, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const hasContact = contactLogs.length > 0;
  const hoursSinceAssign = c.assigned_at ? Math.round((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60)) : 0;

  // Last contact info
  const lastLog = contactLogs.length > 0 
    ? [...contactLogs].sort((a, b) => new Date(b.logged_at || b.created_date) - new Date(a.logged_at || a.created_date))[0] 
    : null;

  const borderColor = group === 'needs_action' ? '#B91C1C' : group === 'in_progress' ? '#15803D' : 'var(--slate-300)';
  const prefLabel = { phone: 'Phone', email: 'Email', no_preference: 'No Preference' };

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: highlighted ? '2px solid #16A34A' : '1px solid var(--slate-200)',
      borderLeft: `4px solid ${borderColor}`, borderRadius: 'var(--radius-sm)',
      marginBottom: '0.5rem',
      boxShadow: highlighted ? '0 0 0 3px rgba(22,163,74,0.2)' : 'none',
      transition: 'box-shadow 0.3s, border-color 0.3s',
      animation: highlighted ? 'highlightPulse 1.5s ease-in-out 2' : 'none'
    }}>
      {highlighted && (
        <style>{`
          @keyframes highlightPulse {
            0%, 100% { box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
            50% { box-shadow: 0 0 0 6px rgba(22,163,74,0.25); }
          }
        `}</style>
      )}
      {/* Row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
        flexWrap: 'wrap'
      }}>
        <button type="button" onClick={() => setExpanded(!expanded)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
          color: 'var(--slate-400)'
        }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div style={{ flex: 1, minWidth: '140px' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {c.business_name}
          </span>
          <span style={{
            display: 'inline-block', marginLeft: '0.5rem', padding: '0.1rem 0.5rem',
            fontSize: '0.6875rem', fontWeight: 700, borderRadius: '9999px',
            backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF',
            color: isPhysical ? '#1D4ED8' : '#7C3AED'
          }}>
            {isPhysical ? 'Physical' : 'Digital'}
          </span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', marginLeft: '0.5rem' }}>
            {[c.city, c.state].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Middle info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem', minWidth: '160px' }}>
          {group === 'needs_action' && (
            <>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                Assigned {formatDate(c.assigned_at)}
              </span>
              {hoursSinceAssign > 24 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C' }}>
                  <AlertTriangle size={12} /> OVERDUE — {hoursSinceAssign - 24}h past deadline
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#D97706' }}>
                  <Clock size={12} /> {24 - hoursSinceAssign}h remaining to make contact
                </span>
              )}
            </>
          )}
          {group === 'in_progress' && lastLog && (
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              Last: {METHOD_LABELS[lastLog.contact_method] || lastLog.contact_method} — {formatDate(lastLog.logged_at || lastLog.created_date)}
            </span>
          )}
          {group === 'completed' && (
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              Closed {formatDate(c.closed_at || c.updated_date)}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {group === 'needs_action' && (
            <>
              <button type="button" onClick={() => onLogContact(c)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600)',
                border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                whiteSpace: 'nowrap', minHeight: '36px'
              }}>
                Log Contact
              </button>
              <button type="button" onClick={() => onResolve(c)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                fontWeight: 700, color: 'var(--slate-500)', backgroundColor: 'transparent',
                border: '1px solid var(--slate-500)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                whiteSpace: 'nowrap', minHeight: '36px'
              }}>
                Resolve Case
              </button>
            </>
          )}
          {group === 'in_progress' && (
            <>
              <button type="button" onClick={() => onLogContact(c)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                fontWeight: 700, color: 'var(--terra-600)', backgroundColor: 'transparent',
                border: '1px solid var(--terra-600)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                whiteSpace: 'nowrap', minHeight: '36px'
              }}>
                Log Follow-Up
              </button>
              <button type="button" onClick={() => onResolve(c)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                fontWeight: 700, color: 'var(--slate-500)', backgroundColor: 'transparent',
                border: '1px solid var(--slate-500)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                whiteSpace: 'nowrap', minHeight: '36px'
              }}>
                Resolve Case
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 1rem 1rem 2.5rem', borderTop: '1px solid var(--slate-100)'
        }}>
          <div style={{ paddingTop: '0.75rem' }}>
            {/* Claimant contact — prominently at top */}
            <div style={{
              padding: '0.875rem', marginBottom: '1rem',
              backgroundColor: '#FFF7ED', borderRadius: 'var(--radius-md)',
              border: '2px solid #FDBA74'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Claimant Contact
                </h4>
                <span style={{
                  display: 'inline-block', padding: '0.15rem 0.5rem',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                  color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: '9999px',
                  textTransform: 'uppercase'
                }}>
                  Prefers {prefLabel[c.contact_preference] || c.contact_preference}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                <Info icon={User} label="Name" value={c.contact_name} />
                <Info icon={Mail} label="Email" value={c.contact_email} />
                <Info icon={Phone} label="Phone" value={c.contact_phone} />
              </div>
            </div>

            {/* Case details */}
            <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem' }}>
              Case Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-sm)' }}>
              <Info icon={Building2} label="Business Type" value={c.business_type} />
              <Info icon={MapPin} label="Location" value={isPhysical ? [c.street_address, c.city, c.state].filter(Boolean).join(', ') : [c.city, c.state].filter(Boolean).join(', ')} />
              {isPhysical && <Info icon={Building2} label="Violation" value={c.violation_subtype} />}
              {!isPhysical && <Info icon={Globe} label="URL" value={c.url_domain} />}
              <Info icon={Calendar} label="Incident Date" value={formatDate(c.incident_date)} />
              <Info icon={Calendar} label="Assigned" value={formatDate(c.assigned_at)} />
            </div>

            {/* Narrative */}
            <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem' }}>
              Narrative
            </h4>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 1rem' }}>
              {c.narrative || '—'}
            </p>

            {/* Contact history */}
            {contactLogs.length > 0 && (
              <>
                <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem' }}>
                  Contact History
                </h4>
                <ContactLogHistory logs={contactLogs} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
      <Icon size={12} style={{ color: 'var(--slate-400)', flexShrink: 0, marginTop: '3px' }} />
      <div>
        <span style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-800)', wordBreak: 'break-word' }}>{value}</span>
      </div>
    </div>
  );
}