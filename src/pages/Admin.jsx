import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Clock, Briefcase, Users, AlertTriangle, UserPlus, Timer } from 'lucide-react';
import StatCard from '../components/admin/StatCard';
import RecentSubmissionsTable from '../components/admin/RecentSubmissionsTable';
import UnclaimedCasesBanner from '../components/admin/UnclaimedCasesBanner.jsx';
import PendingLawyersBanner from '../components/admin/PendingLawyersBanner.jsx';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);

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

      const [allCases, allLawyers] = await Promise.all([
        base44.entities.Case.list('-created_date', 500),
        base44.entities.LawyerProfile.list('-created_date', 500)
      ]);
      setCases(allCases);
      setLawyers(allLawyers);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--slate-500)' }}>Loading dashboard…</p>
      </div>
    );
  }

  const pendingCount = cases.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
  const activeCount = cases.filter(c => ['available', 'assigned', 'in_progress'].includes(c.status)).length;
  const activeLawyerCount = lawyers.filter(l => l.subscription_status === 'active').length;
  const pendingLawyerCount = lawyers.filter(l => l.account_status === 'pending_approval').length;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const needsAttentionCases = cases.filter(c =>
    c.status === 'assigned' &&
    c.assigned_at &&
    c.assigned_at < twentyFourHoursAgo &&
    !c.contact_logged_at
  );
  const needsAttentionCount = needsAttentionCases.length;

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const unclaimedCases = cases.filter(c =>
    c.status === 'available' &&
    c.approved_at &&
    c.approved_at < seventyTwoHoursAgo
  );
  const unclaimedCount = unclaimedCases.length;

  const pendingLawyers = lawyers.filter(l => l.account_status === 'pending_approval');

  const recentSubmissions = cases
    .filter(c => c.status === 'submitted')
    .sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date))
    .slice(0, 10);

  return (
    <div style={{
      backgroundColor: 'var(--slate-50)',
      minHeight: 'calc(100vh - 200px)',
      padding: 'var(--space-xl) var(--space-lg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 700,
          color: 'var(--slate-900)',
          marginBottom: 'var(--space-xl)'
        }}>
          Admin Dashboard
        </h1>

        {/* Stat Cards */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-2xl)'
        }}>
          <StatCard
            label="Pending Review"
            count={pendingCount}
            bgColor="#DBEAFE"
            textColor="#1D4ED8"
            icon={Clock}
          />
          <StatCard
            label="Active Cases"
            count={activeCount}
            bgColor="#DCFCE7"
            textColor="#15803D"
            icon={Briefcase}
          />
          <StatCard
            label="Active Lawyers"
            count={activeLawyerCount}
            bgColor="var(--surface)"
            borderColor="var(--slate-200)"
            icon={Users}
          />
          <StatCard
            label="Needs Attention"
            count={needsAttentionCount}
            bgColor="#FEE2E2"
            textColor="#B91C1C"
            icon={AlertTriangle}
          />
          <StatCard
            label="Unclaimed 72hrs+"
            count={unclaimedCount}
            bgColor="#FEF3C7"
            textColor="#92400E"
            icon={Timer}
          />
          <StatCard
            label="Lawyer Applications"
            count={pendingLawyerCount}
            bgColor={pendingLawyerCount > 0 ? '#F3E8FF' : 'var(--surface)'}
            textColor={pendingLawyerCount > 0 ? '#7C3AED' : 'var(--slate-700)'}
            borderColor={pendingLawyerCount > 0 ? '#E9D5FF' : 'var(--slate-200)'}
            icon={UserPlus}
          />
        </div>

        {/* Alert Banners */}
        {pendingLawyers.length > 0 && (
          <PendingLawyersBanner lawyers={pendingLawyers} />
        )}
        {unclaimedCases.length > 0 && (
          <UnclaimedCasesBanner cases={unclaimedCases} />
        )}

        {/* Recent Submissions */}
        <h2 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--slate-900)',
          marginBottom: 'var(--space-md)'
        }}>
          Recent Submissions
        </h2>

        <RecentSubmissionsTable cases={recentSubmissions} />
      </div>
    </div>
  );
}