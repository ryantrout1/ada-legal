import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuidePlaygrounds() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner title="Accessible Playgrounds" typeBadge="§240 / §1008" badgeColor="#15803D" />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection id="what-required" title="What the ADA Requires"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§240.1 — Scope</strong></p><p style={{ margin: 0 }}>"Play areas for children ages 2 and over shall comply with §240. Where separate play areas are provided within a site for specific age groups, each play area shall comply with §240."</p></>}>
            <p>The 2010 ADA Standards include <strong>specific requirements for play areas</strong> (§240 scoping, §1008 technical). These apply to:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
              <li style={{ marginBottom: '6px' }}>Newly constructed and altered play areas at <strong>parks, schools, daycare centers, restaurants</strong>, and other public/commercial facilities</li>
              <li style={{ marginBottom: '6px' }}>Both <strong>ground-level</strong> and <strong>elevated</strong> play components have accessibility requirements</li>
              <li style={{ marginBottom: '6px' }}>Separate play areas for different age groups must <strong>each</strong> comply independently</li>
            </ul>
          </GuideSection>

          <GuideSection id="ground-level" title="Ground-Level Play Components"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§240.2.1 — Ground-Level Play Components</strong></p><p style={{ margin: 0 }}>"Ground level play components that are provided to comply with §240.2.1 shall be on an accessible route and shall be dispersed throughout the play area."</p></>}>
            <p>Ground-level play components must be <strong>on an accessible route</strong>. Requirements:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>The number of accessible ground-level components depends on the <strong>total ground-level play components</strong> provided (per the scoping table in §240.2.1)</li>
              <li style={{ marginBottom: '6px' }}>Types must be <strong>distributed</strong> among the various types available — if there are swings, rockers, and sandboxes, accessible versions of <strong>different types</strong> must be provided</li>
              <li style={{ marginBottom: '6px' }}>Ground-level components include swings, spring rockers, sandboxes, sensory panels, and activity walls</li>
            </ul>
          </GuideSection>

          <GuideSection id="elevated" title="Elevated Play Components"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§240.2.2 — Elevated Play Components</strong></p><p style={{ margin: 0 }}>"Where elevated play components are provided, at least 50 percent shall be on an accessible route."</p></>}>
            <p>At least <strong>50% of elevated play components</strong> must be on an accessible route:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Ramps</strong> provide the highest level of accessibility — a wheelchair user can roll directly up</li>
              <li style={{ marginBottom: '8px' }}><strong>Transfer platforms</strong> require a person to leave their wheelchair and move onto the platform — less ideal but permitted</li>
              <li style={{ marginBottom: '8px' }}><strong>Transfer steps</strong> allow children to step up from a transfer platform to elevated components</li>
            </ul>
          </GuideSection>

          <GuideSection id="routes" title="Accessible Routes Within Play Areas">
            <p>Accessible routes within play areas have <strong>special surface requirements</strong>:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Ground surfaces must be <strong>firm, stable, and slip-resistant</strong> while still meeting fall attenuation requirements (ASTM F1292)</li>
              <li style={{ marginBottom: '8px' }}><strong>Engineered wood fiber</strong>, poured-in-place rubber, and rubber tiles can meet both requirements</li>
              <li style={{ marginBottom: '8px' }}>Accessible routes within play areas must be at least <strong>60 inches wide</strong> (or 44 inches at certain points)</li>
              <li style={{ marginBottom: '8px' }}>Ramps must comply with §405 (<strong>1:12 slope max</strong>) with additional exceptions for play areas</li>
            </ul>
            <GuideLegalCallout citation="Important">
              <p style={{ margin: 0 }}>Loose-fill materials like <strong>pea gravel and sand</strong> typically do NOT meet accessibility requirements. <strong>Wood chips alone</strong> are generally not firm enough for wheelchair access. Engineered wood fiber (EWF) that is properly installed and maintained can comply.</p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection id="transfer" title="Transfer Platforms & Steps"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§1008.3 — Transfer Platforms & Steps</strong></p><p style={{ margin: 0 }}>"Transfer platforms shall have a clear width of 24 inches minimum. The transfer platform height shall be 11 inches minimum and 18 inches maximum." Transfer steps: "8 inches high maximum, 14 inches deep minimum, 24 inches wide minimum."</p></>}>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Transfer platforms:</strong> 24 inches deep minimum, 14–18 inches high, at least 24 inches wide</li>
              <li style={{ marginBottom: '8px' }}><strong>Transfer steps:</strong> 8 inches high maximum, 14 inches deep minimum, 24 inches wide minimum</li>
              <li style={{ marginBottom: '8px' }}><strong>Transfer supports</strong> (handholds) must be provided to assist children moving from wheelchair to play structure</li>
            </ul>
          </GuideSection>

          <GuideSection id="tips" title="Tips for Parents & Advocates">
            <p>When evaluating a playground for accessibility, look for:</p>
            <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden', margin: '16px 0' }}>
              {[
                'Is there a paved accessible route from the parking lot or sidewalk to the play area?',
                'Are ground-level components (swings, sensory panels) reachable on an accessible surface?',
                'Is the surfacing wheelchair-accessible? (Wood chips alone typically are not.)',
                'Do elevated structures have ramps or at least transfer platforms?',
                'Are there accessible swings (e.g., high-back bucket seats)?'
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 20px', borderBottom: i < 4 ? '1px solid var(--slate-200)' : 'none', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#15803D', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
            <p>If barriers exist, file a complaint with the <strong>DOJ</strong> or contact your local <strong>ADA coordinator</strong>.</p>
            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>This guide provides general information about playground accessibility under the ADA. For advice about your specific situation, connect with an experienced ADA attorney.</p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>
      <GuideReportCTA />
    </>
  );
}