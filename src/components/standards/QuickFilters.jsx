import React from 'react';
import { Shield, Home, Monitor, FileText, Users, CheckCircle } from 'lucide-react';

const FILTERS = [
  { key: 'rights', label: 'My Rights', Icon: Shield },
  { key: 'business', label: 'Business Compliance', Icon: Home },
  { key: 'website', label: 'Website Accessibility', Icon: Monitor },
  { key: 'design', label: 'Design Standards', Icon: FileText },
  { key: 'government', label: 'Government Entities', Icon: Users },
  { key: 'complaint', label: 'Filing a Complaint', Icon: CheckCircle }
];

export default function QuickFilters({ activeFilters, onToggle }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderBottom: '1px solid var(--slate-200)',
      padding: 'clamp(24px, 4vw, 48px) clamp(16px, 4vw, 40px)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
          color: 'var(--slate-900)', margin: '0 0 16px'
        }}>
          I need information about:
        </p>
        <div className="sg-filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {FILTERS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className="sg-filter-btn"
              aria-pressed={activeFilters.includes(key) ? 'true' : 'false'}
              onClick={() => onToggle(key)}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}