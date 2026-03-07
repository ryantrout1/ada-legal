import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import GuideReadingLevelBar from '../components/guide/GuideReadingLevelBar';
import ParkingDiagram from '../components/guide/diagrams/ParkingDiagram';

export default function GuideParkingRequirements() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Accessible Parking Requirements"
        typeBadge="Checklist"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <ParkingDiagram />

          <GuideSection
            id="scoping-table"
            title="How Many Accessible Spaces Are Required?"
            simpleContent={
              <>
                <p>The number of accessible parking spaces depends on the total number of spaces:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}>1 to 25 total spaces: 1 accessible space.</li>
                  <li style={{ marginBottom: '6px' }}>26 to 50: 2 accessible spaces.</li>
                  <li style={{ marginBottom: '6px' }}>51 to 75: 3 accessible spaces.</li>
                  <li style={{ marginBottom: '6px' }}>Larger lots: about 1 for every 25 spaces.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §208.2 — Minimum Number</strong>
                </p>
                <p style={{ margin: '0 0 8px', fontSize: '0.8125rem' }}>
                  Parking facilities shall provide accessible parking spaces in
                  accordance with the following table:
                </p>
                <table style={{
                  width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem',
                  margin: '8px 0'
                }} role="table" aria-label="Accessible parking scoping table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--border)', fontWeight: 700 }}>Total Spaces</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--border)', fontWeight: 700 }}>Min. Accessible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['1–25', '1'], ['26–50', '2'], ['51–75', '3'],
                      ['76–100', '4'], ['101–150', '5'], ['151–200', '6'],
                      ['201–300', '7'], ['301–400', '8'], ['401–500', '9'],
                      ['501–1000', '2% of total'], ['1001+', '20 + 1 per 100 over 1000']
                    ].map(([total, min], i) => (
                      <tr key={i}>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{total}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            }
          >
            <p>
              The number of accessible parking spaces you need depends on the
              <strong> total number of parking spaces</strong> in your lot or
              garage. The ADA's 2010 Standards provide a specific scoping table.
            </p>
            <p>
              For example:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                A small medical office with <strong>15 spaces</strong> needs at
                least <strong>1 accessible space</strong>.
              </li>
              <li style={{ marginBottom: '6px' }}>
                A retail store with <strong>60 spaces</strong> needs at least
                <strong> 3 accessible spaces</strong>.
              </li>
              <li style={{ marginBottom: '6px' }}>
                A shopping center with <strong>400 spaces</strong> needs at
                least <strong>8 accessible spaces</strong>.
              </li>
            </ul>
            <p>
              Medical facilities that specialize in treating people with mobility
              impairments must provide <strong>20% accessible spaces</strong> for
              outpatient areas (§208.2.1).
            </p>
          </GuideSection>

          <GuideSection
            id="van-accessible"
            title="Van-Accessible Spaces"
            simpleContent={
              <>
                <p>At least 1 out of every 6 accessible spaces must be van-accessible.</p>
                <p>Van spaces are wider because wheelchair vans need room for a ramp or lift on the side.</p>
                <p>They are marked with a "Van Accessible" sign.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §208.2.4</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "For every six or fraction of six accessible parking spaces
                  required by 208.2, at least one shall be a van parking space
                  complying with 502."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§502.2 — Vehicle Spaces</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Car parking spaces: 96 inches (8 ft) wide minimum. Van parking
                  spaces: 132 inches (11 ft) wide minimum. An alternative
                  configuration of 96 inches (8 ft) van space with 96 inches
                  (8 ft) access aisle is permitted.
                </p>
              </>
            }
          >
            <p>
              For every <strong>six accessible spaces</strong> (or fraction of six),
              at least one must be <strong>van-accessible</strong>. Wheelchair vans
              need extra room to deploy a side-mounted ramp or lift.
            </p>
            <p>Two configurations are allowed:</p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>
                  Option A: Wide space
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)' }}>
                  <strong>132 inches (11 ft)</strong> wide parking space + <strong>60 inches (5 ft)</strong> access aisle
                </p>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>
                  Option B: Wide aisle
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)' }}>
                  <strong>96 inches (8 ft)</strong> wide parking space + <strong>96 inches (8 ft)</strong> access aisle
                </p>
              </div>
            </div>
            <p>
              Van-accessible spaces must be identified with a sign that includes
              the words <strong>"Van Accessible"</strong> in addition to the
              International Symbol of Accessibility.
            </p>
          </GuideSection>

          <GuideSection
            id="dimensions"
            title="Space Dimensions"
            simpleContent={
              <>
                <p>Accessible parking spaces must be big enough for a wheelchair:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}>Standard accessible space: 8 feet wide with a 5-foot access aisle.</li>
                  <li style={{ marginBottom: '6px' }}>Van-accessible space: 8 feet wide with an 8-foot access aisle (or 11 feet wide with a 5-foot aisle).</li>
                </ul>
                <p>The access aisle is the striped area next to the space. It must stay clear.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §502.2 — Vehicle Spaces</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Car parking spaces shall be 96 inches (2440 mm) wide minimum."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§502.3 — Access Aisles</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Access aisles serving parking spaces shall comply with 502.3.
                  Access aisles shall adjoin an accessible route."
                </p>
                <p style={{ margin: 0 }}>
                  "§502.3.1 Width. Access aisles serving car parking spaces shall
                  be 60 inches (1525 mm) wide minimum. Access aisles serving van
                  parking spaces shall be 60 inches (1525 mm) wide minimum."
                </p>
              </>
            }
          >
            <p>Here are the minimum dimensions:</p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { label: 'Car space width', value: '96 in (8 ft) minimum' },
                { label: 'Van space width', value: '132 in (11 ft) minimum' },
                { label: 'Car access aisle', value: '60 in (5 ft) minimum' },
                { label: 'Van access aisle', value: '60 in (5 ft) minimum (or 96 in if space is 8 ft)' },
                { label: 'Space length', value: 'Not specified by federal ADA (check state code)' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.label}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <p>
              Two adjacent accessible spaces may share a single access aisle
              between them. The aisle must connect to an <strong>accessible
              route</strong> leading to the building entrance.
            </p>
          </GuideSection>

          <GuideSection
            id="location"
            title="Location Requirements"
            simpleContent={
              <>
                <p>Accessible spaces must be close to the entrance. They should be the closest spaces in the lot.</p>
                <p>There must be a safe, smooth path from the space to the front door with no steps.</p>
                <p>If a lot serves more than one building, accessible spaces should be spread out near each entrance.</p>
              </>
            }
          >
            <p>
              Accessible parking spaces must be located on the <strong>shortest
              accessible route</strong> to the entrance they serve. That means:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                As <strong>close to the entrance</strong> as possible
              </li>
              <li style={{ marginBottom: '8px' }}>
                On a route that doesn't require crossing traffic lanes, going
                up/down stairs, or navigating steep slopes
              </li>
              <li style={{ marginBottom: '8px' }}>
                If a facility has <strong>multiple entrances</strong>, accessible
                spaces should be dispersed among them
              </li>
              <li style={{ marginBottom: '8px' }}>
                In a parking garage, accessible spaces should be on the
                <strong> level closest</strong> to the building entrance or elevator
              </li>
            </ul>

            <GuideLegalCallout citation="2010 ADA Standards §208.3.1">
              <p style={{ margin: 0 }}>
                "Parking spaces complying with 502 that serve a particular building
                or facility shall be located on the shortest accessible route from
                parking to an entrance complying with 206.4."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="signage"
            title="Signage Requirements"
            simpleContent={
              <>
                <p>Every accessible space must have a sign with the wheelchair symbol.</p>
                <p>The sign must be high enough that a parked car does not block it.</p>
                <p>Van spaces need an extra sign that says "Van Accessible."</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §502.6</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Accessible parking spaces shall be identified by signs showing
                  the International Symbol of Accessibility complying with 703.7.2.1.
                  Signs identifying van parking spaces shall contain the designation
                  'van accessible.' Signs shall be 60 inches (1525 mm) minimum above
                  the finish floor or ground surface measured to the bottom of the
                  sign."
                </p>
              </>
            }
          >
            <p>
              Every accessible parking space must have a <strong>sign</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Show the <strong>International Symbol of Accessibility</strong>
                (blue wheelchair symbol)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Be mounted at least <strong>60 inches (5 ft) above the ground</strong>,
                measured to the bottom of the sign — so it's visible even when a
                vehicle is parked in the space
              </li>
              <li style={{ marginBottom: '8px' }}>
                Van-accessible spaces must include the text <strong>"Van
                Accessible"</strong>
              </li>
            </ul>
            <p>
              <strong>Ground-painted symbols alone are not sufficient.</strong> An
              upright post-mounted sign is always required. Many states also require
              signs to display the fine amounts for illegal use.
            </p>
          </GuideSection>

          <GuideSection
            id="slope-surface"
            title="Slope and Surface Requirements"
            simpleContent={
              <>
                <p>Accessible parking spaces and aisles must be flat and smooth.</p>
                <p>The maximum slope is 1:48 in any direction. That is almost flat.</p>
                <p>The surface must be firm, stable, and not slippery. Gravel lots usually do not meet this rule.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §502.4</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Parking spaces and access aisles shall comply with 302. Access
                  aisles shall be at the same level as the parking spaces they serve.
                  Changes in level are not permitted."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§502.4 — Floor or Ground Surfaces</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Parking spaces and access aisles serving them shall have surface
                  slopes not steeper than 1:48." (Approximately 2% in any direction.)
                </p>
              </>
            }
          >
            <p>
              Accessible spaces and their access aisles must be <strong>nearly
              level</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Maximum slope of <strong>1:48 (approximately 2%)</strong> in
                any direction — this is essentially flat
              </li>
              <li style={{ marginBottom: '8px' }}>
                The surface must be <strong>firm, stable, and slip-resistant</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                The access aisle must be at the <strong>same level</strong> as the
                parking space — no curbs, steps, or level changes between them
              </li>
              <li style={{ marginBottom: '8px' }}>
                Loose gravel, deep grass, or unpaved surfaces generally
                <strong> do not comply</strong>
              </li>
            </ul>
            <p>
              These requirements exist because even a slight slope can cause a
              wheelchair to roll unexpectedly, making it dangerous for someone
              transferring between their vehicle and their wheelchair.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide covers federal ADA standards. Your state or local
                building code may impose stricter requirements for accessible
                parking dimensions, signage, and slope. Always check both federal
                and local requirements. For legal advice, connect with an
                experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}