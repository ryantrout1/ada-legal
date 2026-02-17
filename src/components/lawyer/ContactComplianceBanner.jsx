import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

export default function ContactComplianceBanner({ assignedAt, contactLoggedAt }) {
  const [hoursLeft, setHoursLeft] = useState(null);

  useEffect(() => {
    if (contactLoggedAt) return;
    if (!assignedAt) return;

    const calc = () => {
      const deadline = new Date(assignedAt).getTime() + 24 * 60 * 60 * 1000;
      const remaining = Math.max(0, deadline - Date.now());
      setHoursLeft(remaining / (1000 * 60 * 60));
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [assignedAt, contactLoggedAt]);

  if (contactLoggedAt) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.625rem 1rem', backgroundColor: '#DCFCE7',
        borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0'
      }}>
        <CheckCircle2 size={18} style={{ color: '#15803D', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
          color: '#15803D'
        }}>
          Contact Logged ✓ — {formatDateTime(contactLoggedAt)}
        </span>
      </div>
    );
  }

  const hrs = hoursLeft !== null ? Math.floor(hoursLeft) : '—';
  const mins = hoursLeft !== null ? Math.floor((hoursLeft % 1) * 60) : 0;
  const isOverdue = hoursLeft !== null && hoursLeft <= 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      padding: '0.625rem 1rem', backgroundColor: '#FEE2E2',
      borderRadius: 'var(--radius-md)', border: '1px solid #FECACA'
    }}>
      <AlertTriangle size={18} style={{ color: '#B91C1C', flexShrink: 0 }} />
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
        color: '#B91C1C'
      }}>
        {isOverdue
          ? 'Contact Overdue — You were required to contact the claimant within 24 hours.'
          : `Contact Required — You must contact the claimant within 24 hours. ${hrs}h ${mins}m remaining.`
        }
      </span>
    </div>
  );
}