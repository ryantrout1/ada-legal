import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideParking() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Accessible Parking Rights"
        typeBadge="Reference"
        badgeColor="#D4570A"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="federal-requirements"
            title="Federal Requirements for Accessible Parking"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §208.2 — Minimum Number</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  Parking facilities must include the following minimum number of
                  accessible spaces:
                </p>
                <div style={{ fontSize: '0.8125rem', margin: '0 0 12px' }}>
                  <p style={{ margin: '0 0 2px' }}>1–25 total spaces → 1 accessible</p>
                  <p style={{ margin: '0 0 2px' }}>26–50 → 2 accessible</p>
                  <p style={{ margin: '0 0 2px' }}>51–75 → 3 accessible</p>
                  <p style={{ margin: '0 0 2px' }}>76–100 → 4 accessible</p>
                  <p style={{ margin: '0 0 2px' }}>101–150 → 5 accessible</p>
                  <p style={{ margin: '0 0 2px' }}>151–200 → 6 accessible</p>
                  <p style={{ margin: '0 0 2px' }}>201–300 → 7 accessible</p>
                  <p style={{ margin: '0 0 2px' }}>301–400 → 8 accessible</p>
                  <p style={{ margin: 0 }}>401–500 → 9 accessible</p>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                  For lots over 500: 2% of first 500, plus 1 for each additional
                  100 or fraction thereof.
                </p>
              </>
            }
          >
            <p>
              Under the <strong>2010 ADA Standards for Accessible Design</strong>,
              every parking lot or garage open to the public must include a minimum
              number of <strong>accessible parking spaces</strong>. The number
              depends on the total size of the lot.
            </p>
            <p>
              For example, a small restaurant with 20 parking spaces must have at
              least 1 accessible space. A shopping center with 300 spaces must
              have at least 7. These are the <em>minimum</em> — some facilities
              choose to provide more.
            </p>
            <p>
              Accessible spaces must be located on the <strong>shortest
              accessible route</strong> to the building entrance. That means as
              close to the door as possible, on a path without stairs or steep
              slopes.
            </p>
          </GuideSection>

          <GuideSection
            id="van-accessible"
            title="Van-Accessible Spaces"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §208.2.4</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "For every six or fraction of six accessible parking spaces
                  required by §208.2, at least one shall be a van parking space."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§502.2 — Vehicle Space Width</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Van parking spaces shall be 132 inches (11 feet) wide minimum.
                  Van parking access aisles shall be 60 inches (5 feet) wide minimum.
                </p>
              </>
            }
          >
            <p>
              At least <strong>one out of every six</strong> accessible spaces must
              be "van-accessible." These spaces are wider because wheelchair-accessible
              vans need extra room to deploy a side ramp or lift.
            </p>
            <p>
              Van-accessible spaces must be at least <strong>11 feet wide</strong>
              (compared to 8 feet for standard accessible spaces) with an access
              aisle of at least 5 feet. Alternatively, the standard 8-foot space
              can be used with an 8-foot access aisle.
            </p>
            <p>
              Van-accessible spaces must have a sign that says <strong>"Van
              Accessible"</strong> in addition to the standard accessible parking
              sign.
            </p>
          </GuideSection>

          <GuideSection
            id="signage"
            title="Signage Requirements"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §502.6</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Accessible parking spaces shall be identified by signs showing
                  the International Symbol of Accessibility (ISA). Signs identifying
                  van parking spaces shall contain the designation 'van accessible.'
                  Signs shall be 60 inches minimum above the finish floor or ground
                  surface measured to the bottom of the sign."
                </p>
              </>
            }
          >
            <p>
              Every accessible space must have a <strong>sign</strong> with the
              International Symbol of Accessibility (the blue wheelchair symbol).
              The sign must be:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                Mounted at least <strong>60 inches high</strong> (measured from
                the ground to the bottom of the sign), so it's visible even when
                a car is parked in the space
              </li>
              <li style={{ marginBottom: '6px' }}>
                Include <strong>"Van Accessible"</strong> text for van spaces
              </li>
            </ul>
            <p>
              Ground-painted symbols alone are <strong>not sufficient</strong> —
              an upright sign is required. Many states also require the sign to
              display state-specific penalties for illegal use.
            </p>
          </GuideSection>

          <GuideSection
            id="access-aisles"
            title="Access Aisles"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §502.3</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  "Access aisles shall adjoin an accessible route. Two parking
                  spaces shall be permitted to share a common access aisle."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§502.3.1</strong> — Width: 60 inches minimum.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>§502.3.3</strong> — Marking: "Access aisles shall be
                  marked so as to discourage parking in them."
                </p>
              </>
            }
          >
            <p>
              The <strong>access aisle</strong> is the striped area next to an
              accessible space. It provides room for a person to get in and out
              of their vehicle, deploy a wheelchair ramp, or use a mobility device.
            </p>
            <p>
              Access aisles must be:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                At least <strong>5 feet wide</strong> (8 feet for van-accessible
                when the space is standard width)
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Level</strong> — maximum slope of 1:48 (2%) in any direction
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Clearly marked</strong> with painted stripes or hatching
              </li>
              <li style={{ marginBottom: '6px' }}>
                Connected to an <strong>accessible route</strong> to the building
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="common-violations"
            title="Common Parking Violations"
          >
            <p>
              These are the most frequently reported accessible parking problems:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { title: 'Blocked access aisles', desc: 'Cars, shopping carts, or snow piled in the striped area, preventing wheelchair users from getting in and out of their vehicles.' },
                { title: 'Missing or damaged signs', desc: 'No upright sign, sign too low, or faded/damaged signs that are hard to read. Ground paint alone doesn\'t count.' },
                { title: 'Non-compliant slopes', desc: 'Accessible spaces or aisles on sloped surfaces that make it dangerous or impossible for wheelchair users.' },
                { title: 'Not enough spaces', desc: 'The lot doesn\'t have the required minimum number of accessible spaces based on its total size.' },
                { title: 'Too far from entrance', desc: 'Accessible spaces located far from the building entrance rather than on the shortest accessible route.' },
                { title: 'No van-accessible space', desc: 'All accessible spaces are standard width with no van-accessible option.' }
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < 5 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--slate-900)' }}>
                    {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="state-permits"
            title="State Disabled Parking Permits"
          >
            <p>
              Disabled parking <strong>permits</strong> (placards and plates) are
              issued by <strong>state governments</strong>, not the federal
              government. The rules vary by state, but generally:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                You need a doctor's certification that you have a qualifying
                mobility limitation
              </li>
              <li style={{ marginBottom: '8px' }}>
                Permits are either <strong>temporary</strong> (usually 6 months)
                or <strong>permanent</strong> (renewed every few years)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Using someone else's placard or using an expired placard is
                illegal in every state and carries fines
              </li>
              <li style={{ marginBottom: '8px' }}>
                Your state-issued placard is valid in all 50 states
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="reporting"
            title="How to Report Parking Violations"
          >
            <p>
              If you encounter an accessible parking violation, you have several
              options:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Take photos</strong> of the violation — the space, the
                access aisle, signage (or lack thereof), and any cars blocking
                access
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Contact the property manager</strong> or business owner
                to request immediate correction
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>File a complaint with the DOJ</strong> at{' '}
                <a
                  href="https://www.ada.gov/file-a-complaint/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#C2410C' }}
                >
                  ADA.gov
                </a>{' '}
                for systemic or ongoing violations
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Report to local code enforcement</strong> or your city's
                ADA coordinator for building code issues
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA parking
                requirements. State and local building codes may impose additional
                requirements. For legal advice about your specific situation,
                connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}