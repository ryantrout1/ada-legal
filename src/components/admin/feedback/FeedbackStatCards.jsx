import React from 'react';
import { MessageSquare, Bell, Calendar } from 'lucide-react';

const CARDS = [
  { key: 'total', label: 'Total Feedback', icon: MessageSquare, color: '#475569', bg: '#F1F5F9' },
  { key: 'newCount', label: 'New (Unreviewed)', icon: Bell, color: '#C2410C', bg: '#FEF1EC' },
  { key: 'thisWeek', label: 'This Week', icon: Calendar, color: '#1E3A8A', bg: '#EFF6FF' },
];

export default function FeedbackStatCards({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
      {CARDS.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.key} style={{
            background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px',
            padding: '20px', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', background: c.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={20} color={c.color} />
            </div>
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#64748B', margin: 0 }}>{c.label}</p>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{stats[c.key]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}