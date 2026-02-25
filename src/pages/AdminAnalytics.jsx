import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import AdminStatusBar from '../components/admin/shared/AdminStatusBar';
import AdminFilterPill from '../components/admin/shared/AdminFilterPill';
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
import UserJourneyEngagement from '../components/analytics/impact/UserJourneyEngagement';

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
      setCases(allCases); setLawyers(allLawyers); setContactLogs(allLogs); setLoading(false);
    }
    init();
  }, []);

  // Operations status bar cells
  const opsStatusCells = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const submittedMonth = cases.filter(c => c.submitted_at && c.submitted_at >= monthStart).length;
    const approvedMonth = cases.filter(c => c.approved_at && c.approved_at >= monthStart).length;
    const assignedMonth = cases.filter(c => c.assigned_at && c.assigned_at >= monthStart).length;
    const reviewed = cases.filter(c => c.submitted_at && c.approved_at);
    let avgReview = '—';
    if (reviewed.length > 0) { const h = reviewed.reduce((s, c) => s + (new Date(c.approved_at) - new Date(c.submitted_at)) / 3600000, 0) / reviewed.length; avgReview = h < 1 ? '<1h' : `${Math.round(h)}h`; }
    const assigned = cases.filter(c => c.approved_at && c.assigned_at);
    let avgAssign = '—';
    if (assigned.length > 0) { const h = assigned.reduce((s, c) => s + (new Date(c.assigned_at) - new Date(c.approved_at)) / 3600000, 0) / assigned.length; avgAssign = h < 1 ? '<1h' : `${Math.round(h)}h`; }
    const withA = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
    let compliance = '—'; let compNum = 100;
    if (withA.length > 0) { const comp = withA.filter(c => { const d = new Date(new Date(c.assigned_at).getTime() + 86400000); return contactLogs.some(l => l.case_id === c.id && l.contact_type === 'initial_contact' && new Date(l.logged_at || l.created_date) <= d); }).length; compNum = Math.round((comp / withA.length) * 100); compliance = compNum + '%'; }
    const available = cases.filter(c => c.status === 'available').length;
    const t72 = new Date(Date.now() - 72 * 3600000).toISOString();
    const unclaimed72 = cases.filter(c => c.status === 'available' && c.approved_at && c.approved_at < t72).length;
    return [
      { key: 'submitted', label: 'Submitted', value: submittedMonth },
      { key: 'approved', label: 'Approved', value: approvedMonth },
      { key: 'assigned', label: 'Assigned', value: assignedMonth },
      { key: 'avgReview', label: 'Avg Review', value: avgReview },
      { key: 'avgAssign', label: 'Avg to Assign', value: avgAssign },
      { key: 'compliance', label: 'Compliance', value: compliance, warn: compNum < 70, danger: compNum < 50 },
      { key: 'available', label: 'Available', value: available },
      { key: 'unclaimed72', label: 'Unclaimed 72h+', value: unclaimed72, warn: unclaimed72 > 0, danger: unclaimed72 > 3 },
    ];
  }, [cases, contactLogs]);

  // Impact status bar cells
  const impactStatusCells = useMemo(() => {
    const clusterIds = new Set(); cases.forEach(c => { if (c.ai_duplicate_cluster_id) clusterIds.add(c.ai_duplicate_cluster_id); });
    const noClusters = cases.filter(c => !c.ai_duplicate_cluster_id).length;
    const communities = new Set(); cases.forEach(c => { const k = `${(c.city || '').trim().toLowerCase()}|${(c.state || '').trim().toUpperCase()}`; if (k !== '|') communities.add(k); });
    const connected = cases.filter(c => ['assigned', 'in_progress', 'closed'].includes(c.status)).length;
    return [
      { key: 'violations', label: 'Total Violations', value: cases.length, color: '#9A3412' },
      { key: 'businesses', label: 'Businesses Identified', value: clusterIds.size + noClusters, color: '#1D4ED8' },
      { key: 'communities', label: 'Communities', value: communities.size, color: '#15803D' },
      { key: 'connected', label: 'Connected to Attorneys', value: connected, color: '#92400E' },
    ];
  }, [cases]);

  if (loading) {
    return (<div role="status" aria-label="Loading analytics" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}><h1 className="sr-only">Platform Intelligence</h1><div className="a11y-spinner" aria-hidden="true" /><p style={{ fontFamily: 'Manrope, sans-serif', color: '#475569' }}>Loading intelligence…</p></div>);
  }

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.25rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AdminPageHeader
          title="Platform Intelligence"
          statusBar={<AdminStatusBar cells={activeTab === 'operations' ? opsStatusCells : impactStatusCells} />}
          filterPills={
            <>
              <AdminFilterPill label="📊 Operations" active={activeTab === 'operations'} onClick={() => setActiveTab('operations')} />
              <AdminFilterPill label="🌍 ADA Impact" active={activeTab === 'impact'} onClick={() => setActiveTab('impact')} />
            </>
          }
          sortDropdown={<IntelExport activeTab={activeTab} cases={cases} lawyers={lawyers} contactLogs={contactLogs} />}
        />

        {activeTab === 'operations' && (
          <div role="tabpanel" id="panel-operations" aria-labelledby="tab-operations" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <OpsFunnel cases={cases} contactLogs={contactLogs} />
            <OpsLawyerTable lawyers={lawyers} cases={cases} contactLogs={contactLogs} />
            <OpsCoverageGaps cases={cases} lawyers={lawyers} />
          </div>
        )}

        {activeTab === 'impact' && (
          <div role="tabpanel" id="panel-impact" aria-labelledby="tab-impact" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ViolationLandscape cases={cases} />
            <GeographicImpact cases={cases} lawyers={lawyers} />
            <TrendsSection cases={cases} />
            <AccountabilityTable cases={cases} />
            <CommunityVoice cases={cases} />
            <UserJourneyEngagement />
          </div>
        )}
      </div>
    </div>
  );
}