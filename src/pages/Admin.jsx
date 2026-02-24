import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Clock, Briefcase, Users, AlertTriangle, UserPlus, Timer } from 'lucide-react';
import ClickableStatCard from '../components/admin/ClickableStatCard';
import QuickStatsBar from '../components/admin/QuickStatsBar';
import DashboardCollapsible from '../components/admin/DashboardCollapsible';
import CompactUnclaimedSection from '../components/admin/CompactUnclaimedSection';
import CompactSubmissionsTable from '../components/admin/CompactSubmissionsTable';
import LawyerActivityAlerts from '../components/admin/LawyerActivityAlerts';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [contactLogs, setContactLogs] = useState([]);

  const loadData = async () => {
    const [allCases, allLawyers, allLogs] = await Promise.all([
      base44.entities.Case.list('-created_date', 500),
      base44.entities.LawyerProfile.list('-created_date', 500),
      base44.entities.ContactLog.list('-created_date', 500)
    ]);

    // Auto-expire cases available > 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const toExpire = allCases.filter(c =>
      c.status === 'available' && (c.created_date || c.submitted_at) < ninetyDaysAgo
    );
    const now = new Date().toISOString();
    for (const c of toExpire) {
      await base44.entities.Case.update(c.id, { status: 'expired', expired_at: now });
      await base44.entities.TimelineEvent.create({
        case_id: c.id, event_type: 'expired',
        event_description: 'This case was not matched with an attorney within 90 days. You may resubmit at any time.',
        actor_role: 'system', visible_to_user: true, created_at: now
      });
      c.status = 'expired';
      c.expired_at = now;
    }

    setCases(allCases);
    setLawyers(allLawyers);
    setContactLogs(allLogs);
    return { allCases, allLawyers };
  };

  useEffect(() => {
    async function init() {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        if (user?.role === 'lawyer') {
          window.location.href = createPageUrl('LawyerDashboard');
        } else {
          window.location.href = createPageUrl('MyCases');
        }
        return;
      }
      await loadData();
      setLoading(false);
    }
    init();
  }, []);

  const handleDataRefresh = async () => {
    await loadData();
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading dashboard" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)', gap: '1rem'
      }}>
        <h1 className="sr-only">Admin Dashboard</h1>
        <div className="a11y-spinner" aria-hidden="true" />
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-600)' }}>Loading dashboard…</p>
      </div>
    );
  }

  const pendingCount = cases.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
  const activeCount = cases.filter(c => ['available', 'assigned', 'in_progress'].includes(c.status)).length;
  const activeLawyerCount = lawyers.filter(l => l.subscription_status === 'active').length;
  const pendingLawyerCount = lawyers.filter(l => l.account_status === 'pending_approval').length;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const needsAttentionCount = cases.filter(c =>
    c.status === 'assigned' && c.assigned_at && c.assigned_at < twentyFourHoursAgo && !c.contact_logged_at
  ).length;

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const unclaimedCases = cases.filter(c => c.status === 'available' && c.approved_at && c.approved_at < seventyTwoHoursAgo);

  const recentSubmissions = cases
    .filter(c => c.status === 'submitted')
    .sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date))
    .slice(0, 5);

  const scrollToUnclaimed = () => {
    const el = document.getElementById('unclaimed-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.25rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700, color: 'var(--slate-900)', margin: 0
        }}>Admin Dashboard</h1>

        {/* Stat Cards — single row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <ClickableStatCard label="Pending Review" count={pendingCount} bgColor="#DBEAFE" textColor="#1D4ED8" icon={Clock}
            onClick={() => { window.location.href = createPageUrl('AdminReview'); }} />
          <ClickableStatCard label="Active Cases" count={activeCount} bgColor="#DCFCE7" textColor="#15803D" icon={Briefcase}
            onClick={() => { window.location.href = createPageUrl('AdminCases'); }} />
          <ClickableStatCard label="Active Lawyers" count={activeLawyerCount} bgColor="var(--surface)" borderColor="var(--slate-200)" icon={Users}
            onClick={() => { window.location.href = createPageUrl('AdminLawyers'); }} />
          <ClickableStatCard label="Needs Attention" count={needsAttentionCount} bgColor="#FEE2E2" textColor="#B91C1C" icon={AlertTriangle}
            onClick={scrollToUnclaimed} />
          <ClickableStatCard label="Unclaimed 72hrs+" count={unclaimedCases.length} bgColor="#FEF3C7" textColor="#92400E" icon={Timer}
            onClick={scrollToUnclaimed} />
          <ClickableStatCard label="Lawyer Applications" count={pendingLawyerCount}
            bgColor={pendingLawyerCount > 0 ? '#F3E8FF' : 'var(--surface)'}
            textColor={pendingLawyerCount > 0 ? '#7C3AED' : 'var(--slate-700)'}
            borderColor={pendingLawyerCount > 0 ? '#E9D5FF' : 'var(--slate-200)'} icon={UserPlus}
            onClick={() => { window.location.href = createPageUrl('AdminLawyers'); }} />
        </div>

        {/* Quick Stats Bar */}
        <QuickStatsBar cases={cases} />

        {/* Unclaimed Cases */}
        <DashboardCollapsible id="unclaimed-section" title="Unclaimed 72hrs+" icon={Timer} iconColor="#92400E" count={unclaimedCases.length}>
          <CompactUnclaimedSection cases={unclaimedCases} />
        </DashboardCollapsible>

        {/* Recent Submissions */}
        <DashboardCollapsible id="recent-submissions" title="Recent Submissions" icon={Clock} iconColor="#1D4ED8" count={recentSubmissions.length}>
          <CompactSubmissionsTable cases={recentSubmissions} />
        </DashboardCollapsible>

        {/* Lawyer Activity Alerts */}
        <DashboardCollapsible id="lawyer-alerts" title="Lawyer Activity Alerts" icon={AlertTriangle} iconColor="#B91C1C">
          <LawyerActivityAlerts lawyers={lawyers} cases={cases} contactLogs={contactLogs} onDataRefresh={handleDataRefresh} />
        </DashboardCollapsible>
      </div>
    </div>
  );
}