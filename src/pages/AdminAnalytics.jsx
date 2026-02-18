import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import CasePipelineSection from '../components/analytics/CasePipelineSection';
import MarketplaceHealthSection from '../components/analytics/MarketplaceHealthSection';
import GeographicSection from '../components/analytics/GeographicSection';
import LawyerActivitySection from '../components/analytics/LawyerActivitySection';
import ViolationTypeSection from '../components/analytics/ViolationTypeSection';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        if (user?.role === 'lawyer') {
          window.location.href = createPageUrl('LawyerDashboard');
        } else {
          window.location.href = createPageUrl('Home');
        }
        return;
      }

      const [allCases, allLawyers, allLogs] = await Promise.all([
        base44.entities.Case.list('-created_date', 1000),
        base44.entities.LawyerProfile.list('-created_date', 500),
        base44.entities.ContactLog.list('-created_date', 1000)
      ]);

      setCases(allCases);
      setLawyers(allLawyers);
      setContactLogs(allLogs);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading analytics…</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)',
      minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)', margin: 0
        }}>
          Analytics
        </h1>

        <CasePipelineSection cases={cases} />
        <MarketplaceHealthSection cases={cases} contactLogs={contactLogs} />
        <GeographicSection cases={cases} />
        <ViolationTypeSection cases={cases} />
        <LawyerActivitySection lawyers={lawyers} cases={cases} contactLogs={contactLogs} />
      </div>
    </div>
  );
}