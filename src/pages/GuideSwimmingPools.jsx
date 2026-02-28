import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideSwimmingPools() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner title="Swimming Pool Accessibility" typeBadge="§242 / §1009" badgeColor="#15803D" />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection id="which-pools" title="Which Pools Are Covered?"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§242 — Swimming Pools, Wading Pools & Spas</strong></p><p style={{ margin: 0 }}>"Where swimming pools, wading pools, or spas are provided, accessible means of entry shall be provided." Applies to Title II (government) and Title III (public accommodations) facilities.</p></>}>
            <p>All <strong>public and commercial</strong> swimming pools, wading pools, and spas are covered — including:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
              <li style={{ marginBottom: '6px' }}>Hotel and resort pools</li>
              <li style={{ marginBottom: '6px' }}>Community and municipal pools</li>
              <li style={{ marginBottom: '6px' }}>Water parks and splash pads</li>
              <li style={{ marginBottom: '6px' }}>Health clubs and fitness centers</li>
              <li style={{ marginBottom: '6px' }}>Apartment complex pools (common areas)</li>
            </ul>
            <p>The requirements apply to <strong>new construction AND existing facilities</strong>. Existing facilities must remove barriers where readily achievable. The DOJ issued specific guidance in 2012 confirming these obligations.</p>
          </GuideSection>

          <GuideSection id="large-pools" title="Means of Entry — Large Pools"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§242.2 — Swimming Pools</strong></p><p style={{ margin: 0 }}>"Where a swimming pool has over 300 linear feet of swimming pool wall, at least two accessible means of entry shall be provided. At least one accessible means of entry shall comply with §1009.2 (Sloped Entries) or §1009.3 (Pool Lifts)."</p></>}>
            <p>Pools with <strong>over 300 linear feet</strong> of pool wall must have <strong>two</strong> accessible means of entry:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>At least one must be a <strong>pool lift</strong> or <strong>sloped entry</strong></li>
              <li style={{ marginBottom: '6px' }}>The second can be a pool lift, sloped entry, <strong>transfer wall</strong>, <strong>transfer system</strong>, or <strong>accessible pool stairs</strong></li>
            </ul>
          </GuideSection>

          <GuideSection id="small-pools" title="Means of Entry — Small Pools">
            <p>Pools with <strong>300 linear feet of pool wall or less</strong> must have <strong>one</strong> accessible means of entry:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
              <li style={{ marginBottom: '6px' }}>Must be a <strong>pool lift</strong> or <strong>sloped entry</strong></li>
            </ul>
            <GuideLegalCallout citation="How to Measure">
              <p style={{ margin: 0 }}>Measure the total perimeter of the pool wall at the water line. A standard 25-yard lap pool (75 ft × 42 ft) has about 234 linear feet — so it would need <strong>one</strong> accessible entry. An Olympic-size pool (164 ft × 82 ft) has about 492 linear feet — so it needs <strong>two</strong>.</p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection id="pool-lifts" title="Pool Lifts"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§1009.2 — Pool Lifts</strong></p><p style={{ margin: 0 }}>"Pool lift seats shall be 16 inches wide minimum. The deck-to-seat height shall be 16 inches minimum and 19 inches maximum." "Pool lifts shall be capable of unassisted operation from both the deck and water levels."</p></>}>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Must be <strong>fixed/permanent</strong> — portable lifts do not comply</li>
              <li style={{ marginBottom: '8px' }}>Seat must be at least <strong>16 inches wide</strong></li>
              <li style={{ marginBottom: '8px' }}><strong>Footrest</strong> must be provided</li>
              <li style={{ marginBottom: '8px' }}>Must be operable <strong>without an attendant</strong> — from both deck and water levels</li>
              <li style={{ marginBottom: '8px' }}>Must lower to at least <strong>18 inches below</strong> the water surface</li>
              <li style={{ marginBottom: '8px' }}>Must be located where water depth does not exceed <strong>48 inches</strong></li>
              <li style={{ marginBottom: '8px' }}>Must support a minimum weight of <strong>300 pounds</strong></li>
            </ul>
          </GuideSection>

          <GuideSection id="sloped-entries" title="Sloped Entries"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§1009.3 — Sloped Entries</strong></p><p style={{ margin: 0 }}>"Sloped entries shall comply with §405 (Ramps) except as modified. The sloped entry shall extend to a depth of 24 inches minimum and 30 inches maximum below the stationary water level."</p></>}>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Must comply with §405 ramp requirements (<strong>1:12 slope max</strong>, handrails)</li>
              <li style={{ marginBottom: '6px' }}>Must extend to a depth of <strong>24–30 inches</strong></li>
              <li style={{ marginBottom: '6px' }}>Width: <strong>36 inches minimum</strong> between handrails</li>
              <li style={{ marginBottom: '6px' }}>Handrails on <strong>both sides</strong> extending the full length</li>
            </ul>
          </GuideSection>

          <GuideSection id="wading-spas" title="Wading Pools & Spas"
            legalContent={<><p style={{ margin: '0 0 12px' }}><strong>§242.3 & §242.4</strong></p><p style={{ margin: 0 }}>"At least one accessible means of entry shall be provided for wading pools." "At least one accessible means of entry shall be provided for spas." Spa entry may be a lift, transfer wall, or transfer system.</p></>}>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Wading pools:</strong> Must have a sloped entry into the deepest part</li>
              <li style={{ marginBottom: '8px' }}><strong>Spas:</strong> Must have at least one accessible means of entry — a pool lift, transfer wall, or transfer system</li>
              <li style={{ marginBottom: '8px' }}>Spa means of entry is <strong>NOT required to be a lift</strong> — transfer walls and transfer systems are acceptable</li>
            </ul>
          </GuideSection>

          <GuideSection id="existing" title="Existing Pool Obligations">
            <p>For <strong>existing</strong> pools at hotels, health clubs, and other Title III entities:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Must remove barriers where <strong>"readily achievable"</strong></li>
              <li style={{ marginBottom: '8px' }}>If a permanent lift is not readily achievable, a <strong>portable lift may be acceptable temporarily</strong></li>
              <li style={{ marginBottom: '8px' }}>The DOJ has stated that at minimum, entities must <strong>evaluate</strong> whether a lift is readily achievable</li>
              <li style={{ marginBottom: '8px' }}>Cost of a pool lift (typically $3,000–$5,000) is generally considered readily achievable for most commercial facilities</li>
            </ul>
            <GuideLegalCallout citation="DOJ Guidance (2012)">
              <p style={{ margin: 0 }}>"The Department expects that the vast majority of public accommodations that own or operate swimming pools will be able to comply with the accessible means-of-entry requirements by providing a fixed pool lift." Entities that cannot must document why a lift is not readily achievable.</p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>
      <GuideReportCTA />
    </>
  );
}