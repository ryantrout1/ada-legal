import React from 'react';
import { BookOpen, Layers, Search, ArrowUpRight } from 'lucide-react';

const CARDS = [
  { key: 'totalViews', label: 'Total Guide Views', icon: BookOpen, color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'uniqueSections', label: 'Unique Sections Viewed', icon: Layers, color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'totalSearches', label: 'Total Searches', icon: Search, color: '#C2410C', bg: '#FEF1EC' },
  { key: 'reportIntent', label: 'Report Intent', icon: ArrowUpRight, color: '#15803D', bg: '#F0FDF4' },
];

export default function GuideEngagementStats({ totalViews, uniqueSections, totalSearches, reportIntent }) {
  const values = { totalViews, uniqueSections, totalSearches, reportIntent };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
      {CARDS.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.key} style={{
            padding: '16px', backgroundColor: 'var(--slate-50)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '9px', background: c.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={18} color={c.color} />
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.1 }}>
                {values[c.key].toLocaleString()}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--slate-500)', marginTop: '2px' }}>
                {c.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}