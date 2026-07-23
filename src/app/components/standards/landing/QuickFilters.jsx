/**
 * QuickFilters — ported from Base44 (src/components/standards/QuickFilters.jsx
 * @ 6b1e9ac) for M2 Phase 3. Design authority is B44; the changes here
 * are confined to the port seams:
 *   - Base44 flat routing (createPageUrl) → b44PageToRoute
 *   - Base44 SDK / analytics imports removed (M5)
 * Visual output is unchanged; tokens resolve through the alias layer in
 * app.css at the AAA-corrected values.
 */

import { b44PageToRoute } from './b44PageToRoute.js';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Home, Monitor, FileText, Users, CheckCircle } from 'lucide-react';

const FILTERS = [
  { key: 'rights', label: 'My Rights', Icon: Shield },
  { key: 'business', label: 'Business Compliance', Icon: Home },
  { key: 'website', label: 'Website Accessibility', Icon: Monitor },
  { key: 'design', label: 'Design Standards', Icon: FileText },
  { key: 'government', label: 'Government Entities', Icon: Users },
  { key: 'complaint', label: 'Filing a Complaint', Icon: CheckCircle, isLink: true }
];

/**
 * @param {{ activeFilters: string[], onToggle: (key: string) => void }} props
 */
export default function QuickFilters({ activeFilters, onToggle }) {
  const navigate = useNavigate();

  // B44 opened a "coming soon" modal for Filing a Complaint because it had
  // no page to send people to. This app has one — the Filing a Complaint
  // guide — so the filter navigates there instead of apologising. The
  // modal itself belongs to M5.
  const handleClick = (key, isLink) => {
    if (isLink) {
      const route = b44PageToRoute('GuideFilingComplaint');
      if (route) navigate(route);
      return;
    }
    onToggle(key);
  };

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--border)',
      padding: 'clamp(24px, 4vw, 48px) clamp(16px, 4vw, 40px)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{
          fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
          color: 'var(--heading)', margin: '0 0 16px'
        }}>
          I need information about:
        </p>
        <div className="sg-filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {FILTERS.map(({ key, label, Icon, isLink }) => (
            <button
              key={key}
              type="button"
              className="sg-filter-btn"
              aria-pressed={!isLink && activeFilters.includes(key) ? 'true' : 'false'}
              onClick={() => handleClick(key, isLink)}
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
