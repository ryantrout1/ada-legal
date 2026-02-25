import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import IntelTabs from '../components/analytics/IntelTabs';
import IntelExport from '../components/analytics/IntelExport';
import OpsStatBar from '../components/analytics/ops/OpsStatBar';
import OpsFunnel from '../components/analytics/ops/OpsFunnel';
import OpsLawyerTable from '../components/analytics/ops/OpsLawyerTable';
import OpsCoverageGaps from '../components/analytics/ops/OpsCoverageGaps';
import BigNumbers from '../components/analytics/impact/BigNumbers';
import ViolationLandscape from '../components/analytics/impact/ViolationLandscape';
import GeographicImpact from '../components/analytics/impact/GeographicImpact';
import TrendsSection from '../components/analytics/impact/TrendsSection';
import AccountabilityTable from '../components/analytics/impact/AccountabilityTable';
import CommunityVoice from '../components/analytics/impact/CommunityVoice';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('operations');

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        if (user?.role === 'lawyer') window.location.href = createPageUrl('LawyerDashboard');
        else window.location.href = createPageUrl('Home');
        return;
      }
      const [allCases, allLawyers, allLogs] = await Promise.all([
        base44.entities.Case.list('-created_date', 1000),
        base44.entities.LawyerProfile.list('-created_date', 500),
        base44.entities.ContactLog.list('-created_date', 1000),
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
      <div role="status" aria-label="Loading analytics" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
        <h1 className="sr-only">Platform Intelligence</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading intelligence…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.25rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
            Platform Intelligence
          </h1>
          <IntelExport activeTab={activeTab} cases={cases} lawyers={lawyers} contactLogs={contactLogs} />
        </div>

        {/* Tab Toggle */}
        <IntelTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Panels */}
        {activeTab === 'operations' && (
          <div role="tabpanel" id="panel-operations" aria-labelledby="tab-operations" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <OpsStatBar cases={cases} contactLogs={contactLogs} />
            <OpsFunnel cases={cases} contactLogs={contactLogs} />
            <OpsLawyerTable lawyers={lawyers} cases={cases} contactLogs={contactLogs} />
            <OpsCoverageGaps cases={cases} lawyers={lawyers} />
          </div>
        )}

        {activeTab === 'impact' && (
          <div role="tabpanel" id="panel-impact" aria-labelledby="tab-impact" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <BigNumbers cases={cases} />
            <ViolationLandscape cases={cases} />
            <GeographicImpact cases={cases} lawyers={lawyers} />
            <TrendsSection cases={cases} />
            <AccountabilityTable cases={cases} />
            <CommunityVoice cases={cases} />
          </div>
        )}
      </div>
    </div>
  );
}