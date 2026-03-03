import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import ReachRangeDiagram from '../components/guide/diagrams/ReachRangeDiagram';

export default function GuideReachRanges() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Reach Ranges & Operable Parts"
        typeBadge="Technical"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <ReachRangeDiagram />

          <GuideSection
            id="forward-unobstructed"
            title="Unobstructed Forward Reach"
            simpleContent={
              <><p>When nothing is in the way, a person in a wheelchair can reach between 15 and 48 inches high.</p><p>Things like light switches and controls must be within this range.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §308.2.1</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Where a forward reach is unobstructed, the high forward reach shall be 48 inches
                  (1220 mm) maximum and the low forward reach shall be 15 inches (380 mm) minimum
                  above the finish floor or ground."
                </p>
              </>
            }
          >
            <p>
              When a person in a wheelchair approaches an element head-on with no obstruction
              between them and the control, the <strong>reach range is 15 to 48 inches</strong> above the floor.
              This applies to wall-mounted controls like light switches, thermostats, elevator call buttons,
              and fire alarm pull stations.
            </p>
            <p>
              A <strong>30 × 48 inch clear floor space</strong> must be provided directly in front
              of the element so the wheelchair can pull straight up to it.
            </p>
          </GuideSection>

          <GuideSection
            id="forward-obstructed"
            title="Obstructed Forward Reach"
            simpleContent={
              <><p>When something is in the way, like a counter, the maximum reach height is lower.</p><p>The deeper the counter, the lower things must be placed. A 20-inch deep counter means things must be no higher than 48 inches. A 25-inch counter means no higher than 44 inches.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §308.2.2</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Where the high forward reach is over an obstruction, the clear floor space shall
                  extend beneath the element. Obstruction ≤ 20 inches deep: 48 inches max high reach.
                  Obstruction 20–25 inches deep: 44 inches max high reach. Obstructions deeper than
                  25 inches are not permitted.
                </p>
              </>
            }
          >
            <p>
              Reaching forward over a counter, shelf, or half-wall reduces how high a person
              can reach. The ADA accounts for this with a sliding scale:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { depth: 'Up to 20 inches deep', reach: '48 inches maximum height' },
                { depth: '20 to 25 inches deep', reach: '44 inches maximum height' },
                { depth: 'Over 25 inches deep', reach: 'Not permitted (use side reach)' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.depth}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem' }}>{row.reach}</span>
                </div>
              ))}
            </div>
            <p>
              The clear floor space must extend <strong>beneath the obstruction</strong> so the
              wheelchair user's knees can slide under the counter. Knee clearance of at least
              27 inches high is typically required.
            </p>
          </GuideSection>

          <GuideSection
            id="side-reach"
            title="Side Reach Ranges"
            simpleContent={
              <><p>When reaching to the side, a person in a wheelchair can reach between 15 and 48 inches high.</p><p>If something is in the way, the maximum height drops depending on how far they have to reach over.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §308.3</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  Unobstructed (§308.3.1): "the high side reach shall be 48 inches (1220 mm)
                  maximum and the low side reach shall be 15 inches (380 mm) minimum."
                </p>
                <p style={{ margin: 0 }}>
                  Obstructed (§308.3.2): Obstruction ≤ 10 inches: 48 inches max.
                  10–24 inches: 46 inches max. Over 24 inches: not permitted.
                </p>
              </>
            }
          >
            <p>
              A <strong>side reach</strong> (parallel approach) has the same 15- to 48-inch
              unobstructed range as forward reach. When reaching sideways over an obstruction:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Obstruction <strong>up to 10 inches</strong> deep: maximum high reach stays at <strong>48 inches</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Obstruction <strong>10 to 24 inches</strong> deep: maximum drops to <strong>46 inches</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Obstructions <strong>over 24 inches</strong> deep are not permitted for side reach
              </li>
            </ul>
            <p>
              Side reach is often used for elements like paper towel dispensers, soap dispensers,
              and controls on appliances.
            </p>
          </GuideSection>

          <GuideSection
            id="operable-parts"
            title="Operable Parts"
            simpleContent={
              <><p>Controls, switches, and handles must be easy to use:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>No tight gripping or twisting required</li><li style={{ marginBottom: "6px" }}>Can be used with one hand</li><li style={{ marginBottom: "6px" }}>Less than 5 pounds of force to operate</li></ul><p>Round door knobs are not accessible. Lever handles are.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §309.4</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Operable parts shall be operable with one hand and shall not require tight
                  grasping, pinching, or twisting of the wrist. The force required to activate
                  operable parts shall be 5 pounds (22.2 N) maximum."
                </p>
              </>
            }
          >
            <p>
              Every control within reach range must be <strong>usable with one hand</strong> and
              must not require tight grasping, pinching, or twisting. The maximum operating force
              is <strong>5 pounds</strong>. This includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Light switches and thermostats</li>
              <li style={{ marginBottom: '8px' }}>Electrical outlets (receptacles)</li>
              <li style={{ marginBottom: '8px' }}>Fire alarm pull stations</li>
              <li style={{ marginBottom: '8px' }}>Vending machine controls</li>
              <li style={{ marginBottom: '8px' }}>ATM keypads and card readers</li>
              <li style={{ marginBottom: '8px' }}>Hand dryers and paper towel dispensers</li>
            </ul>
            <p>
              Rocker switches, push buttons, and touch screens generally comply. Round twist
              knobs (like old-style dimmer switches) do not.
            </p>
          </GuideSection>

          <GuideSection
            id="clear-floor"
            title="Clear Floor Space"
            simpleContent={
              <><p>There must be a flat, clear space in front of things you need to reach.</p><p>This space must be at least 30 by 48 inches, big enough for a wheelchair.</p><p>The floor must be flat and firm.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §305</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Clear floor or ground space shall be 30 inches (760 mm) minimum by 48 inches
                  (1220 mm) minimum." May be positioned for forward or parallel approach. "One
                  full unobstructed side of the clear floor space shall adjoin an accessible route
                  or adjoin another clear floor or ground space."
                </p>
              </>
            }
          >
            <p>
              A <strong>30 × 48 inch</strong> clear floor space is required at every element
              a person needs to use. Key rules:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Can face <strong>forward</strong> (toward the element) or be <strong>parallel</strong> (alongside it)
              </li>
              <li style={{ marginBottom: '8px' }}>
                The floor must be <strong>level</strong> — max slope 1:48 (about 2%)
              </li>
              <li style={{ marginBottom: '8px' }}>
                At least one full side must connect to an <strong>accessible route</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Surface must be firm, stable, and slip-resistant
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="children"
            title="Children's Reach Ranges"
            simpleContent={
              <><p>Spaces built for children use lower reach ranges:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Ages 3-4: 20 to 36 inches high</li><li style={{ marginBottom: "6px" }}>Ages 5-8: 18 to 40 inches high</li><li style={{ marginBottom: "6px" }}>Ages 9-12: 16 to 44 inches high</li></ul></>
            }
          >
            <p>
              The ADA Standards do not <em>require</em> children's reach ranges except at elements
              specifically designed for children's use. However, the <strong>Advisory notes</strong> in
              §308.1 recommend reduced reach heights by age group:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { age: 'Ages 3–4', forward: '36 inches max', side: '36 inches max' },
                { age: 'Ages 5–8', forward: '40 inches max', side: '40 inches max' },
                { age: 'Ages 9–12', forward: '44 inches max', side: '44 inches max' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.age}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem' }}>Forward: {row.forward}</span>
                </div>
              ))}
            </div>
            <p>
              Schools, daycare centers, and other facilities designed for children should follow
              these advisory recommendations for elements like coat hooks, drinking fountains,
              hand dryers, and light switches.
            </p>
          </GuideSection>

          <GuideLegalCallout citation="Important Note">
            <p style={{ margin: 0 }}>
              This guide covers the most common reach range and operable parts requirements.
              Specific elements (such as ATMs, kitchen counters, or laundry machines) may have
              additional requirements in their respective sections of the Standards. Consult
              a qualified ADA professional for your specific situation.
            </p>
          </GuideLegalCallout>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}