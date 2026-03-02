import React from 'react';
import StatCard from '../admin/StatCard';
import { ShoppingCart, Timer, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function MarketplaceHealthSection({ cases, contactLogs }) {
  const availableNow = cases.filter(c => c.status === 'available').length;

  // Avg time to assignment: hours between approved_at and assigned_at
  const assignedCases = cases.filter(c => c.approved_at && c.assigned_at);
  let avgAssignHrs = '—';
  if (assignedCases.length > 0) {
    const total = assignedCases.reduce((sum, c) => {
      return sum + (new Date(c.assigned_at) - new Date(c.approved_at)) / (1000 * 60 * 60);
    }, 0);
    const avg = total / assignedCases.length;
    avgAssignHrs = avg < 1 ? '<1h' : `${Math.round(avg)}h`;
  }

  // Contact compliance: % of assigned cases with initial_contact log within 24h of assigned_at
  const casesWithAssignment = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
  let complianceRate = '—';
  if (casesWithAssignment.length > 0) {
    const compliant = casesWithAssignment.filter(c => {
      const deadline = new Date(new Date(c.assigned_at).getTime() + 24 * 60 * 60 * 1000);
      return contactLogs.some(l =>
        l.case_id === c.id &&
        l.contact_type === 'initial_contact' &&
        new Date(l.logged_at || l.created_date) <= deadline
      );
    }).length;
    complianceRate = Math.round((compliant / casesWithAssignment.length) * 100) + '%';
  }

  // Unclaimed 72hrs+
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const unclaimed72 = cases.filter(c =>
    c.status === 'available' && c.approved_at && c.approved_at < seventyTwoHoursAgo
  ).length;

  return (
    <div>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
        color: 'var(--heading)', marginBottom: '0.5rem', marginTop: 0
      }}>Marketplace Health</h2>
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <StatCard label="Available Now" count={availableNow} bgColor="#DCFCE7" textColor="#15803D" icon={ShoppingCart} />
        <StatCard label="Avg Time to Assignment" count={avgAssignHrs} bgColor="var(--surface)" borderColor="var(--border)" icon={Timer} />
        <StatCard label="Contact Compliance" count={complianceRate} bgColor="#DBEAFE" textColor="#1D4ED8" icon={ShieldCheck} />
        <StatCard label="Unclaimed 72hrs+" count={unclaimed72} bgColor={unclaimed72 > 0 ? '#FEE2E2' : 'var(--surface)'} textColor={unclaimed72 > 0 ? '#B91C1C' : 'var(--body)'} borderColor={unclaimed72 > 0 ? '#FECACA' : 'var(--border)'} icon={AlertTriangle} />
      </div>
    </div>
  );
}