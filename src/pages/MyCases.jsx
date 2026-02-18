import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAnnounce } from '../components/a11y/LiveAnnouncer';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import MyCaseCard from '../components/portal/MyCaseCard';

export default function MyCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let user;
      try {
        user = await base44.auth.me();
      } catch {
        base44.auth.redirectToLogin(createPageUrl('MyCases'));
        return;
      }

      // Redirect lawyers to their own dashboard
      if (user.role === 'lawyer') {
        window.location.href = createPageUrl('LawyerDashboard');
        return;
      }

      const myCases = await base44.entities.Case.filter(
        { submitter_user_id: user.id },
        '-created_date',
        200
      );
      setCases(myCases);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div
        role="status" aria-label="Loading your cases"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 200px)', gap: '1rem'
        }}
      >
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading your cases…</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)',
          marginBottom: 'var(--space-xl)', marginTop: 0
        }}>
          My Cases
        </h1>

        {cases.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
            borderRadius: '16px', padding: 'var(--space-2xl)', textAlign: 'center'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--slate-100)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-lg)'
            }}>
              <FileText size={28} aria-hidden="true" style={{ color: 'var(--slate-400)' }} />
            </div>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              color: 'var(--slate-600)', marginBottom: 'var(--space-lg)', margin: '0 0 var(--space-lg) 0'
            }}>
              No cases yet. Report an ADA violation to get started.
            </p>
            <Link
              to={createPageUrl('Intake')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', fontFamily: 'Manrope, sans-serif',
                fontSize: '1rem', fontWeight: 700, color: 'white',
                backgroundColor: 'var(--terra-600)', borderRadius: 'var(--radius-md)',
                textDecoration: 'none', minHeight: '44px'
              }}
            >
              Report a Violation <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {cases.map(c => (
              <MyCaseCard key={c.id} caseData={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}