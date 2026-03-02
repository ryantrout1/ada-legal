import React from 'react';
import CompactStatCard from './CompactStatCard';
import { FileText, CheckCircle, UserCheck, Clock, ShoppingCart, Timer, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function PipelineMarketplaceSection({ cases, contactLogs }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const submittedThisMonth = cases.filter(c => c.submitted_at && c.submitted_at >= monthStart).length;
  const approvedThisMonth = cases.filter(c => c.approved_at && c.approved_at >= monthStart).length;
  const assignedThisMonth = cases.filter(c => c.assigned_at && c.assigned_at >= monthStart).length;

  const approvedCases = cases.filter(c => c.submitted_at && c.approved_at);
  let avgReviewHrs = '—';
  if (approvedCases.length > 0) {
    const totalHrs = approvedCases.reduce((sum, c) => sum + (new Date(c.approved_at) - new Date(c.submitted_at)) / (1000 * 60 * 60), 0);
    const avg = totalHrs / approvedCases.length;
    avgReviewHrs = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
  }

  const availableNow = cases.filter(c => c.status === 'available').length;
  const assignedCases = cases.filter(c => c.approved_at && c.assigned_at);
  let avgAssignHrs = '—';
  if (assignedCases.length > 0) {
    const total = assignedCases.reduce((sum, c) => sum + (new Date(c.assigned_at) - new Date(c.approved_at)) / (1000 * 60 * 60), 0);
    const avg = total / assignedCases.length;
    avgAssignHrs = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
  }

  const casesWithAssignment = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
  let complianceRate = '—';
  if (casesWithAssignment.length > 0) {
    const compliant = casesWithAssignment.filter(c => {
      const deadline = new Date(new Date(c.assigned_at).getTime() + 24 * 60 * 60 * 1000);
      return contactLogs.some(l => l.case_id === c.id && l.contact_type === 'initial_contact' && new Date(l.logged_at || l.created_date) <= deadline);
    }).length;
    complianceRate = Math.round((compliant / casesWithAssignment.length) * 100) + '%';
  }

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const unclaimed72 = cases.filter(c => c.status === 'available' && c.approved_at && c.approved_at < seventyTwoHoursAgo).length;

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <CompactStatCard label="Submitted This Month" count={submittedThisMonth} bgColor="#DBEAFE" textColor="#1D4ED8" icon={FileText} />
      <CompactStatCard label="Approved This Month" count={approvedThisMonth} bgColor="#DCFCE7" textColor="#15803D" icon={CheckCircle} />
      <CompactStatCard label="Assigned This Month" count={assignedThisMonth} bgColor="#F3E8FF" textColor="#7C3AED" icon={UserCheck} />
      <CompactStatCard label="Avg Review Time" count={avgReviewHrs} bgColor="var(--surface)" borderColor="var(--border)" icon={Clock} />
      <CompactStatCard label="Available Now" count={availableNow} bgColor="#DCFCE7" textColor="#15803D" icon={ShoppingCart} />
      <CompactStatCard label="Avg Time to Assign" count={avgAssignHrs} bgColor="var(--surface)" borderColor="var(--border)" icon={Timer} />
      <CompactStatCard label="Contact Compliance" count={complianceRate} bgColor="#DBEAFE" textColor="#1D4ED8" icon={ShieldCheck} />
      <CompactStatCard label="Unclaimed 72hrs+" count={unclaimed72} bgColor={unclaimed72 > 0 ? '#FEE2E2' : 'var(--surface)'} textColor={unclaimed72 > 0 ? '#B91C1C' : 'var(--body)'} borderColor={unclaimed72 > 0 ? '#FECACA' : 'var(--border)'} icon={AlertTriangle} />
    </div>
  );
}