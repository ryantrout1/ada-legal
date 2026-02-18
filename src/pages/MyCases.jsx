import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import MyCaseCard from '../components/portal/MyCaseCard';
import CaseHelpCard from '../components/portal/CaseHelpCard';

const STATUS_PRIORITY = {
  assigned: 0,
  in_progress: 1,
  under_review: 2,
  submitted: 3,
  available: 4,
  approved: 4,
  closed: 5,
  expired: 6,
  rejected: 7
};

const FILTER_GROUPS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In Progress', statuses: ['assigned', 'in_progress'] },
  { key: 'awaiting', label: 'Awaiting Attorney', statuses: ['available', 'approved'] },
  { key: 'review', label: 'Under Review', statuses: ['submitted', 'under_review'] },
  { key: 'closed', label: 'Closed', statuses: ['closed', 'expired', 'rejected'] }
];

function sortCases(cases) {
  return [...cases].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 10;
    const pb = STATUS_PRIORITY[b.status] ?? 10;
    if (pa !== pb) return pa - pb;
    return new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date);
  });
}

export default function MyCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      let user;
      try { user = await base44.auth.me(); } catch {
        base44.auth.redirectToLogin(createPageUrl('MyCases'));
        return;
      }
      if (user.role === 'lawyer') {
        window.location.href = createPageUrl('LawyerDashboard');
        return;
      }
      const myCases = await base44.entities.Case.filter(
        { submitter_user_id: user.id }, '-created_date', 200
      );
      setCases(myCases);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div role="status" aria-label="Loading your cases" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading your cases…</p>
      </div>
    );
  }

  // Counts per filter group
  const groupCounts = {};
  FILTER_GROUPS.forEach(g => {
    groupCounts[g.key] = g.key === 'all'
      ? cases.length
      : cases.filter(c => g.statuses.includes(c.status)).length;
  });

  const activeCaseCount = cases.filter(c =>
    ['submitted', 'under_review', 'available', 'approved', 'assigned', 'in_progress'].includes(c.status)
  ).length;

  const filteredCases = filter === 'all'
    ? cases
    : cases.filter(c => {
        const group = FILTER_GROUPS.find(g => g.key === filter);
        return group?.statuses?.includes(c.status);
      });

  const sorted = sortCases(filteredCases);

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--slate-900)', margin: 0 }}>
              My Cases
            </h1>
            {cases.length > 0 && (
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: '#475569', margin: '4px 0 0' }}>
                You have {activeCaseCount} active case{activeCaseCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link to={createPageUrl('Intake')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600, #C2410C)',
            borderRadius: '10px', textDecoration: 'none', minHeight: '44px'
          }}>
            Report New Violation <ArrowRight size={16} />
          </Link>
        </div>

        {/* Filter Pills */}
        {cases.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FILTER_GROUPS.map(g => {
              const count = groupCounts[g.key];
              if (g.key !== 'all' && count === 0) return null;
              const active = filter === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setFilter(g.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '6px 14px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                    fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer',
                    color: active ? 'white' : '#475569',
                    backgroundColor: active ? 'var(--slate-900)' : 'var(--slate-100)',
                    minHeight: '36px', transition: 'background-color 0.15s, color 0.15s'
                  }}
                >
                  {g.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Cases or Empty State */}
        {cases.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '12px', padding: '48px 24px', textAlign: 'center',
            maxWidth: '480px', margin: '24px auto 0', width: '100%'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--slate-100)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <FileText size={28} aria-hidden="true" style={{ color: 'var(--slate-400)' }} />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 8px' }}>
              No cases yet
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: '#475569', margin: '0 0 20px', lineHeight: 1.6 }}>
              When you report an ADA violation, you can track its progress here.
            </p>
            <Link to={createPageUrl('Intake')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '0 24px', fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600, #C2410C)',
              borderRadius: '10px', textDecoration: 'none', minHeight: '48px'
            }}>
              Report a Violation <ArrowRight size={18} />
            </Link>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '12px', padding: '32px', textAlign: 'center'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: '#475569', margin: '0 0 8px' }}>
              No cases match this filter.
            </p>
            <button type="button" onClick={() => setFilter('all')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
              color: 'var(--terra-600, #C2410C)', padding: '4px', minHeight: '44px'
            }}>View all cases</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sorted.map(c => <MyCaseCard key={c.id} caseData={c} />)}
          </div>
        )}

        {/* Help Footer */}
        <div style={{
          backgroundColor: 'var(--slate-900)', borderRadius: '12px', padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--slate-300)', margin: 0 }}>
            Questions? Contact us at{' '}
            <a href="mailto:support@adalegalconnect.com" style={{ color: 'white', fontWeight: 600, textDecoration: 'underline' }}>
              support@adalegalconnect.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}