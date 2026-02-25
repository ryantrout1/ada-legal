import React, { useMemo } from 'react';
import { Clock, Users, UserPlus, CheckCircle } from 'lucide-react';

export default function SecondaryStatCards({ cases, lawyers }) {
  const stats = useMemo(() => {
    const pendingReview = cases.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
    const activeLawyers = lawyers.filter(l => l.subscription_status === 'active').length;
    const lawyerApps = lawyers.filter(l => l.account_status === 'pending_approval').length;

    // Contact compliance: assigned cases where contact was logged within 24h
    const assignedWithLawyer = cases.filter(c => c.assigned_at && c.assigned_lawyer_id);
    let compliance = '—';
    if (assignedWithLawyer.length > 0) {
      const compliant = assignedWithLawyer.filter(c => {
        if (!c.contact_logged_at) return false;
        return (new Date(c.contact_logged_at) - new Date(c.assigned_at)) <= 86400000;
      }).length;
      compliance = `${Math.round((compliant / assignedWithLawyer.length) * 100)}%`;
    }

    return { pendingReview, activeLawyers, lawyerApps, compliance };
  }, [cases, lawyers]);

  const cards = [
    { label: 'Pending Review', value: stats.pendingReview, icon: Clock },
    { label: 'Active Lawyers', value: stats.activeLawyers, icon: Users },
    { label: 'Lawyer Applications', value: stats.lawyerApps, icon: UserPlus },
    { label: 'Contact Compliance', value: stats.compliance, icon: CheckCircle },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            aria-label={`${card.label}: ${card.value}`}
            style={{
              flex: '1 1 140px',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#FAFAF9',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
            }}
          >
            <Icon size={14} style={{ color: '#64748B', flexShrink: 0 }} aria-hidden="true" />
            <div>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: '#475569', margin: 0, lineHeight: 1 }}>
                {card.value}
              </p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 600, color: '#64748B', margin: '1px 0 0', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                {card.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}