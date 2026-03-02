import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideNewConstruction() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="New Construction & Alterations"
        typeBadge="Legal Standard"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="new-construction"
            title="New Construction Must Be Fully Accessible"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.401(a) — New Construction</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Discrimination for purposes of this part includes a failure to
                  design and construct facilities for first occupancy after January
                  26, 1993, that are readily accessible to and usable by individuals
                  with disabilities."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §202.1</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "New construction. New facilities and elements shall comply with
                  these requirements." Applies to all buildings designed and
                  constructed for first occupancy after the effective date.
                </p>
              </>
            }
          >
            <p>
              Any building or facility <strong>designed and constructed for first
              occupancy after January 26, 1993</strong> must be fully accessible
              under the ADA. There is no "readily achievable" exception for new
              construction — the law requires <strong>full compliance</strong> with
              the applicable standards.
            </p>
            <p>
              This means every element — entrances, hallways, restrooms, parking,
              elevators, signage, service counters, and more — must meet the
              accessibility standards from the start.
            </p>
            <p>
              If a new building was not built accessibly, the owner is in violation
              of the ADA even if no one has complained. The obligation exists from
              the day the building opens.
            </p>
          </GuideSection>

          <GuideSection
            id="which-standards"
            title="Which Standards Apply?"
          >
            <p>
              The ADA's design requirements have been updated over time. Which
              standards apply depends on <strong>when the design work began</strong>:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>
                  Before September 15, 2010
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  Must comply with the <strong>1991 ADA Standards for Accessible
                  Design</strong> (ADAAG).
                </p>
              </div>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>
                  September 15, 2010 – March 14, 2012
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  Could use either the 1991 Standards or the <strong>2010 ADA
                  Standards</strong> (safe harbor period).
                </p>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>
                  March 15, 2012 and after
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  Must comply with the <strong>2010 ADA Standards for Accessible
                  Design</strong>. These are the current standards in effect today.
                </p>
              </div>
            </div>
          </GuideSection>

          <GuideSection
            id="alterations"
            title="Alterations: What Triggers Compliance?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.402(a) — General</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Any alteration to a place of public accommodation or a
                  commercial facility, after January 26, 1992, shall be made so as
                  to ensure that, to the maximum extent feasible, the altered
                  portions of the facility are readily accessible to and usable by
                  individuals with disabilities."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§36.402(b) — Alteration Defined</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "An alteration is a change to a place of public accommodation or
                  a commercial facility that affects or could affect the usability
                  of the building or facility or any part thereof."
                </p>
              </>
            }
          >
            <p>
              When you <strong>alter</strong> (renovate, remodel, or significantly
              change) an existing building, the altered portions must be made
              accessible to the <strong>maximum extent feasible</strong>.
            </p>
            <p>
              An "alteration" is any change that <strong>affects or could affect
              the usability</strong> of the building. This includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Remodeling a restroom</li>
              <li style={{ marginBottom: '6px' }}>Relocating walls or doorways</li>
              <li style={{ marginBottom: '6px' }}>Replacing flooring in a lobby</li>
              <li style={{ marginBottom: '6px' }}>Renovating a sales floor or service area</li>
              <li style={{ marginBottom: '6px' }}>Reconfiguring a checkout area</li>
            </ul>
          </GuideSection>

          <GuideSection
            id="maintenance-vs-alteration"
            title="Alteration vs. Maintenance"
          >
            <p>
              Not every change to a building counts as an "alteration" under the
              ADA. <strong>Normal maintenance</strong> does not trigger the
              alteration requirements. The key distinction:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              <div style={{
                display: 'flex', gap: '16px', padding: '16px 20px',
                borderBottom: '1px solid var(--border)', alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'Fraunces, serif', fontSize: '0.8rem', fontWeight: 700,
                  color: 'var(--accent-success)', background: '#DCFCE7',
                  padding: '4px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap'
                }}>Maintenance</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--heading)' }}>
                    Does NOT trigger accessibility requirements
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>
                    Painting walls, re-roofing, replacing light bulbs, patching
                    holes, replacing broken hardware with the same type, or
                    fixing plumbing leaks.
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex', gap: '16px', padding: '16px 20px', alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'Fraunces, serif', fontSize: '0.8rem', fontWeight: 700,
                  color: 'var(--accent)', background: 'var(--card-bg-tinted)',
                  padding: '4px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap'
                }}>Alteration</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--heading)' }}>
                    DOES trigger accessibility requirements
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>
                    Moving walls, installing new flooring, renovating a restroom,
                    reconfiguring a sales area, widening or relocating doorways,
                    or upgrading electrical/plumbing systems in a way that affects
                    usability.
                  </p>
                </div>
              </div>
            </div>

            <GuideLegalCallout citation="28 CFR §36.402(b)(1)">
              <p style={{ margin: 0 }}>
                "Normal maintenance, reroofing, painting or wallpapering,
                asbestos removal, or changes to mechanical and electrical systems
                are not alterations unless they affect or could affect the
                usability of the building or facility."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="path-of-travel"
            title="The Path of Travel Rule"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.403(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "If a private entity has altered a primary function area of an
                  existing facility, it shall, to the maximum extent feasible,
                  make the alterations in such a manner that the path of travel to
                  the altered area… is readily accessible to and usable by
                  individuals with disabilities."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§36.403(f)(1) — Disproportionate Cost</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Alterations made to provide an accessible path of travel to the
                  altered area will be deemed disproportionate to the overall
                  alteration when the cost exceeds 20% of the cost of the alteration
                  to the primary function area."
                </p>
              </>
            }
          >
            <p>
              This is one of the most important — and most misunderstood — parts
              of the alteration rules. When you alter a <strong>"primary function
              area"</strong> (a space where the main business activity happens),
              you must also make the <strong>path of travel</strong> to that area
              accessible.
            </p>
            <p>
              The "path of travel" includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                The route from the entrance to the altered area
              </li>
              <li style={{ marginBottom: '6px' }}>
                Restrooms serving the altered area
              </li>
              <li style={{ marginBottom: '6px' }}>
                Telephones serving the altered area
              </li>
              <li style={{ marginBottom: '6px' }}>
                Drinking fountains serving the altered area
              </li>
            </ul>
            <p>
              <strong>The 20% cap:</strong> You are not required to spend more than
              <strong> 20% of the cost of the alteration</strong> on making the
              path of travel accessible. For example, if your renovation costs
              $100,000, you must spend up to $20,000 on path-of-travel
              improvements. If the full path of travel costs more than 20%,
              prioritize the improvements following the DOJ priority order.
            </p>
          </GuideSection>

          <GuideSection
            id="primary-function"
            title="What Is a 'Primary Function Area'?"
          >
            <p>
              A <strong>primary function area</strong> is any area where the main
              activity of a business or facility takes place. Examples:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                The <strong>dining room</strong> of a restaurant
              </li>
              <li style={{ marginBottom: '6px' }}>
                The <strong>sales floor</strong> of a retail store
              </li>
              <li style={{ marginBottom: '6px' }}>
                The <strong>lobby</strong> and <strong>conference rooms</strong> of
                an office building
              </li>
              <li style={{ marginBottom: '6px' }}>
                The <strong>examination rooms</strong> of a doctor's office
              </li>
              <li style={{ marginBottom: '6px' }}>
                A <strong>classroom</strong> in a school
              </li>
            </ul>
            <p>
              Areas that are <strong>not</strong> considered primary function areas
              include: mechanical rooms, boiler rooms, supply closets, employee
              break rooms, and janitorial closets. Renovating these spaces does
              not trigger the path of travel obligation.
            </p>
          </GuideSection>

          <GuideSection
            id="historic"
            title="Historic Facilities"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.405 — Alterations: Historic Preservation</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Alterations to a building or facility that is eligible for
                  listing in the National Register of Historic Places… or is
                  designated as historic under State or local law, shall comply
                  with [the alteration requirements] to the maximum extent feasible.
                  If it is determined… that it is not feasible to provide physical
                  access… in a manner that will not threaten or destroy the
                  historic significance of the building or facility, alternative
                  methods of access shall be provided."
                </p>
              </>
            }
          >
            <p>
              Buildings that are <strong>historically significant</strong> —
              listed or eligible for listing on the National Register of Historic
              Places — receive a limited exception.
            </p>
            <p>
              They must still comply <strong>"to the maximum extent feasible"
              </strong>, but if full compliance would <strong>threaten or
              destroy the historic significance</strong> of the building, the
              owner can use <strong>alternative methods</strong> of access instead.
            </p>
            <p>Examples of alternative methods:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                Providing services at an accessible alternative location
              </li>
              <li style={{ marginBottom: '6px' }}>
                Using audio or visual materials to provide information about
                inaccessible areas
              </li>
              <li style={{ marginBottom: '6px' }}>
                Assigning staff to assist individuals with disabilities
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA new construction
                and alteration requirements. Specific situations — especially
                involving historic buildings or complex renovations — require
                individual analysis. For advice about your project, consult an
                experienced ADA attorney or certified access specialist.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}