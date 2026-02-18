import React from 'react';
import StatCard from '../admin/StatCard';
import { FileText, CheckCircle, UserCheck, Clock } from 'lucide-react';

export default function CasePipelineSection({ cases }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const submittedThisMonth = cases.filter(c => c.submitted_at && c.submitted_at >= monthStart).length;
  const approvedThisMonth = cases.filter(c => c.approved_at && c.approved_at >= monthStart).length;
  const assignedThisMonth = cases.filter(c => c.assigned_at && c.assigned_at >= monthStart).length;

  // Avg review time: hours between submitted_at and approved_at for approved cases
  const approvedCases = cases.filter(c => c.submitted_at && c.approved_at);
  let avgReviewHrs = '—';
  if (approvedCases.length > 0) {
    const totalHrs = approvedCases.reduce((sum, c) => {
      return sum + (new Date(c.approved_at) - new Date(c.submitted_at)) / (1000 * 60 * 60);
    }, 0);
    const avg = totalHrs / approvedCases.length;
    avgReviewHrs = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
        color: 'var(--slate-900)', marginBottom: '0.5rem', marginTop: 0
      }}>Case Pipeline</h2>
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <StatCard label="Submitted This Month" count={submittedThisMonth} bgColor="#DBEAFE" textColor="#1D4ED8" icon={FileText} />
        <StatCard label="Approved This Month" count={approvedThisMonth} bgColor="#DCFCE7" textColor="#15803D" icon={CheckCircle} />
        <StatCard label="Assigned This Month" count={assignedThisMonth} bgColor="#F3E8FF" textColor="#7C3AED" icon={UserCheck} />
        <StatCard label="Avg Review Time" count={avgReviewHrs} bgColor="var(--surface)" borderColor="var(--slate-200)" icon={Clock} />
      </div>
    </div>
  );
}