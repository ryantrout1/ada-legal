import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideSidewalks() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner title="Sidewalks & Pedestrian Access" typeBadge="Title II" badgeColor="var(--accent-success)" />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection id="government-responsibility" title="Government Responsibility"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>28 CFR §35.151(e) — Curb Ramps</strong></p><p style={{ margin: 0 }}>"Newly constructed or altered streets, roads, and highways must contain curb ramps or other sloped areas at any intersection having curbs or other barriers to entry from a street level pedestrian walkway."</p></>}>
            simpleContent={
              <><p>Cities and towns must keep sidewalks accessible. This is required by Title II of the ADA.</p><p>Cracked, uneven, or blocked sidewalks can be ADA violations.</p></>
            }
            <p>State and local governments are responsible for accessible <strong>sidewalks and pedestrian infrastructure</strong> under ADA Title II.</p>
            <p>The DOJ has confirmed that <strong>curb ramps must be provided</strong> wherever a sidewalk crosses a curb at a street intersection. This requirement applies when:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
              <li style={{ marginBottom: '6px' }}>Streets or sidewalks are <strong>newly built</strong></li>
              <li style={{ marginBottom: '6px' }}>Streets are <strong>altered</strong>, including when roads are <strong>resurfaced</strong></li>
              <li style={{ marginBottom: '6px' }}>As part of a government's <strong>program access</strong> obligations for existing infrastructure</li>
            </ul>
            <GuideLegalCallout citation="Kinney v. Yerusalim (9th Cir. 1993)">
              <p style={{ margin: 0 }}>Courts have ruled that <strong>resurfacing a road</strong> is an "alteration" that triggers the obligation to install curb ramps — even if no other sidewalk work is planned.</p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection id="sidewalk-requirements" title="Sidewalk Requirements"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>28 CFR §35.150 — Program Accessibility</strong></p><p style={{ margin: 0 }}>"A public entity shall operate each service, program, or activity so that the service, program, or activity, when viewed in its entirety, is readily accessible to and usable by individuals with disabilities."</p></>}>
            simpleContent={
              <><p>Accessible sidewalks must:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Be at least 3 feet wide (4 feet is better)</li><li style={{ marginBottom: "6px" }}>Have a firm, smooth surface</li><li style={{ marginBottom: "6px" }}>Not be too steep (maximum 5% slope)</li><li style={{ marginBottom: "6px" }}>Have no sudden drops or gaps</li></ul></>
            }
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Minimum width:</strong> 36 inches (48 inches preferred for two-way traffic)</li>
              <li style={{ marginBottom: '8px' }}><strong>Running slope:</strong> Match the grade of the adjacent road</li>
              <li style={{ marginBottom: '8px' }}><strong>Cross slope:</strong> 1:48 maximum (about 2%)</li>
              <li style={{ marginBottom: '8px' }}><strong>Surface:</strong> Firm, stable, and slip-resistant</li>
              <li style={{ marginBottom: '8px' }}><strong>Protruding objects:</strong> Nothing below 80 inches overhead or projecting more than 4 inches between 27 and 80 inches above ground</li>
              <li style={{ marginBottom: '8px' }}><strong>Vertical clearance:</strong> 80 inches minimum</li>
            </ul>
          </GuideSection>

          <GuideSection id="curb-ramps" title="Curb Ramps"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>28 CFR §35.151(e)(2)</strong></p><p style={{ margin: 0 }}>"Curb ramps at a pedestrian crossing shall comply with the applicable requirements of the 2010 Standards for accessible design."</p></>}>
            simpleContent={
              <><p>Every place where a sidewalk meets a street must have a curb ramp.</p><p>Curb ramps let wheelchair users and people with strollers cross the street safely.</p><p>Ramps must have a detectable warning surface (bumpy pads) at the bottom.</p></>
            }
            <p>Curb ramps are required at <strong>every pedestrian crossing</strong> where a curb exists:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}><strong>Detectable warning surfaces</strong> (truncated domes) required at the bottom</li>
              <li style={{ marginBottom: '6px' }}><strong>Running slope:</strong> 1:12 maximum</li>
              <li style={{ marginBottom: '6px' }}><strong>Cross slope:</strong> 1:48 maximum</li>
              <li style={{ marginBottom: '6px' }}><strong>Width:</strong> 36 inches minimum (exclusive of flares)</li>
              <li style={{ marginBottom: '6px' }}><strong>Level landing</strong> at the top of the ramp</li>
              <li style={{ marginBottom: '6px' }}><strong>Flared sides:</strong> 1:10 maximum slope where adjacent to a walkway</li>
            </ul>
          </GuideSection>

          <GuideSection id="pedestrian-signals" title="Pedestrian Signals">
            <p><strong>Accessible Pedestrian Signals (APS)</strong> provide audible and vibrotactile information at signalized intersections:</p>
            simpleContent={
              <><p>Crosswalk signals should be accessible. This includes:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Push buttons that are easy to reach</li><li style={{ marginBottom: "6px" }}>Audio signals for blind pedestrians</li><li style={{ marginBottom: "6px" }}>Enough time to cross the street</li></ul></>
            }
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>The DOJ recommends APS at <strong>all signalized intersections</strong></li>
              <li style={{ marginBottom: '6px' }}>Walk intervals must be <strong>long enough</strong> for pedestrians with disabilities to cross safely</li>
              <li style={{ marginBottom: '6px' }}>Push buttons must comply with §309 — <strong>operable with one hand</strong>, no tight grasping</li>
              <li style={{ marginBottom: '6px' }}>APS provide <strong>locator tones</strong>, walk indicators, and directional information</li>
            </ul>
          </GuideSection>

          <GuideSection id="common-barriers" title="Common Barriers & Complaints">
            <p>The most frequently reported sidewalk accessibility barriers include:</p>
            simpleContent={
              <><p>Common sidewalk problems include:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Cracks and uneven surfaces</li><li style={{ marginBottom: "6px" }}>Missing curb ramps</li><li style={{ marginBottom: "6px" }}>Signs or poles blocking the path</li><li style={{ marginBottom: "6px" }}>Construction blocking the sidewalk with no alternate route</li></ul></>
            }
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', margin: '16px 0' }}>
              {[
                'Missing curb ramps at intersections',
                'Sidewalks blocked by utility poles, signs, or overgrown vegetation',
                'Cracked, uneven, or broken sidewalk surfaces',
                'Steep cross slopes where driveways cross sidewalks',
                'Missing detectable warnings at curb ramps',
                'Insufficient pedestrian crossing time at signals'
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 20px', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>•</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection id="filing-complaint" title="Filing a Complaint">
            <p>If your city's sidewalks have accessibility barriers, you have several options:</p>
            simpleContent={
              <><p>If a sidewalk is not accessible, you can:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Report it to your city or town</li><li style={{ marginBottom: "6px" }}>File a complaint with the Department of Justice</li><li style={{ marginBottom: "6px" }}>Contact a disability rights attorney</li></ul></>
            }
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>File with the DOJ:</strong> <a href="https://civilrights.justice.gov/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>civilrights.justice.gov</a></li>
              <li style={{ marginBottom: '8px' }}>Many cities have <strong>ADA coordinators</strong> who handle sidewalk complaints directly</li>
              <li style={{ marginBottom: '8px' }}>Some cities have <strong>transition plans</strong> that prioritize curb ramp installation — you can request a copy</li>
              <li style={{ marginBottom: '8px' }}>Document the barrier with <strong>photos, location, and measurements</strong> if possible</li>
            </ul>
            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>This guide provides general information about sidewalk accessibility under the ADA. For advice about your specific situation, connect with an experienced ADA attorney.</p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>
      <GuideReportCTA />
    </>
  );
}
