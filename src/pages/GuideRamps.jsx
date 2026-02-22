import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideRamps() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Ramps & Slope Requirements"
        typeBadge="Technical"
        badgeColor="#9A3412"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="when-required"
            title="When Is a Ramp Required?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §303.4</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Changes in level greater than 1/2 inch (13 mm) high shall be
                  ramped, and shall comply with 405 or 406."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§303.3</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Changes in level between 1/4 inch (6.4 mm) high minimum and
                  1/2 inch (13 mm) high maximum shall be beveled with a slope not
                  steeper than 1:2."
                </p>
              </>
            }
          >
            <p>
              A ramp is required whenever there is a <strong>change in level
              greater than 1/2 inch</strong> along an accessible route. Here's
              the breakdown:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { level: 'Up to 1/4 inch', action: 'May be vertical (no treatment needed)' },
                { level: '1/4 inch to 1/2 inch', action: 'Must be beveled (slope no steeper than 1:2)' },
                { level: 'Over 1/2 inch', action: 'Requires a ramp or elevator' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: '0.9rem' }}>{row.level}</span>
                  <span style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>{row.action}</span>
                </div>
              ))}
            </div>
            <p>
              This applies everywhere along an accessible route — building
              entrances, hallways, sidewalk connections, changes between floor
              levels, and outdoor paths.
            </p>
          </GuideSection>

          <GuideSection
            id="maximum-slope"
            title="Maximum Slope"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §405.2 — Slope</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Ramp runs shall have a running slope not steeper than 1:12."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§405.2 — Existing Sites</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "In existing sites, buildings, and facilities, ramps shall be
                  permitted to have running slopes steeper than 1:12 complying
                  with Table 405.2 where such slopes are necessary due to space
                  limitations." Table 405.2: Slope steeper than 1:10 but not
                  steeper than 1:8 — max rise 3 inches. Slope steeper than 1:12
                  but not steeper than 1:10 — max rise 6 inches.
                </p>
              </>
            }
          >
            <p>
              The maximum slope for an ADA-compliant ramp is <strong>1:12</strong>.
              This means for every 1 inch of rise (height), the ramp must extend
              at least <strong>12 inches horizontally</strong>. That's a slope of
              about 8.33%.
            </p>
            <p>
              In practical terms:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                A <strong>6-inch step</strong> needs a ramp at least
                <strong> 6 feet long</strong> (6 × 12 = 72 inches)
              </li>
              <li style={{ marginBottom: '8px' }}>
                A <strong>30-inch rise</strong> (2.5 feet) needs a ramp at least
                <strong> 30 feet long</strong> — plus landings
              </li>
            </ul>
            <p>
              In existing buildings where space is limited, slightly steeper slopes
              are allowed for short rises: up to 1:10 for a 6-inch rise, and up
              to 1:8 for a 3-inch rise. These exceptions do <strong>not</strong>
              apply to new construction.
            </p>
          </GuideSection>

          <GuideSection
            id="rise-per-run"
            title="Maximum Rise Per Run"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §405.6 — Rise</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The rise for any ramp run shall be 30 inches (760 mm) maximum."
                </p>
              </>
            }
          >
            <p>
              A single ramp run — the sloped section between landings — can have
              a maximum <strong>rise of 30 inches</strong>. If you need to go
              higher than 30 inches, you must add a <strong>level landing</strong>
              and start a new run.
            </p>
            <p>
              For example, to reach a level that is 5 feet (60 inches) above the
              ground, you need at least <strong>two ramp runs</strong> with a
              landing between them. Each run would cover 30 inches of rise, and
              each would be at least 30 feet long at a 1:12 slope.
            </p>
          </GuideSection>

          <GuideSection
            id="landings"
            title="Landing Requirements"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §405.7 — Landings</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  "Ramp runs shall have landings at the top and the bottom of each
                  ramp run."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  §405.7.2 — "Landings shall have a clear length of 60 inches
                  (1525 mm) long minimum."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  §405.7.3 — "Landings shall be at least as wide as the widest
                  ramp run leading to the landing."
                </p>
                <p style={{ margin: 0 }}>
                  §405.7.4 — "Ramps that change direction between runs at landings
                  shall have a clear landing 60 inches (1525 mm) minimum by 60
                  inches (1525 mm) minimum."
                </p>
              </>
            }
          >
            <p>
              Every ramp must have a <strong>level landing</strong> at both the
              top and bottom. Landings provide a flat resting place and allow
              wheelchair users to stop safely.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Length:</strong> At least <strong>60 inches (5 feet)
                </strong> in the direction of travel
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Width:</strong> At least as wide as the ramp itself
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Direction changes:</strong> If the ramp turns, the
                landing must be at least <strong>60 × 60 inches</strong> (5 × 5
                feet) to allow a wheelchair to turn safely
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Slope:</strong> Landings must be <strong>level</strong>
                (maximum cross slope of 1:48)
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="handrails"
            title="Handrail Requirements"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §405.8</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Ramp runs with a rise greater than 6 inches (150 mm) shall
                  have handrails complying with 505."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§505.4 — Height</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Top of gripping surfaces of handrails shall be 34 inches
                  (865 mm) minimum and 38 inches (965 mm) maximum vertically above
                  walking surfaces."
                </p>
                <p style={{ margin: 0 }}>
                  <strong>§505.10 — Extensions</strong>: Handrails at the top of
                  ramp runs shall extend horizontally 12 inches (305 mm) minimum
                  beyond the top of the ramp run. At the bottom, handrails shall
                  extend 12 inches minimum beyond the bottom of the ramp run.
                </p>
              </>
            }
          >
            <p>
              Handrails are required on <strong>both sides</strong> of any ramp
              run with a rise greater than 6 inches. Key specifications:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Height:</strong> Between <strong>34 and 38 inches</strong>
                above the ramp surface, measured to the top of the gripping surface
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Extensions:</strong> Must extend <strong>12 inches
                horizontally</strong> beyond the top and bottom of the ramp. This
                gives users something to hold before stepping onto or off of the
                slope.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Gripping surface:</strong> Must be continuous (no
                obstructions), with a circular cross section of 1.25 to 2 inches
                in diameter, or a non-circular shape with a perimeter of 4 to
                6.25 inches
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Both sides:</strong> Handrails on both sides of every ramp
                run — no exceptions
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="edge-protection"
            title="Edge Protection"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §405.9 — Edge Protection</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Edge protection complying with 405.9.1 or 405.9.2 shall be
                  provided on each side of ramp runs and at each side of ramp
                  landings." Options include: (1) extended floor or ground surface
                  12 inches minimum beyond the inside face of the handrail, or
                  (2) a curb or barrier that prevents the passage of a 4-inch
                  diameter sphere.
                </p>
              </>
            }
          >
            <p>
              Ramps must have <strong>edge protection</strong> on both sides to
              prevent wheelchairs, walkers, and canes from slipping off the edge.
              Two options satisfy this requirement:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Extended surface:</strong> The ramp surface extends at
                least 12 inches beyond the handrail on each side
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Curb, wall, or barrier:</strong> A raised edge (curb) or
                a wall that prevents a 4-inch sphere from passing through
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="cross-slope-surface"
            title="Cross Slope and Surface"
          >
            <p>
              In addition to the running slope (the main slope of the ramp), the
              <strong> cross slope</strong> and surface material matter:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Cross slope:</strong> Maximum of <strong>1:48 (about
                2%)</strong>. This is the sideways tilt. Too much cross slope
                causes a wheelchair to veer to one side.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Surface:</strong> Must be <strong>firm, stable, and
                slip-resistant</strong>. Concrete, asphalt, and non-slip metal
                grating comply. Loose gravel, wood chips, and deep-pile carpet
                do not.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Wet conditions:</strong> Outdoor ramps should be designed
                to minimize water accumulation and remain safe when wet
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide covers the most common ramp requirements from the 2010
                ADA Standards. Curb ramps (§406) have additional requirements not
                covered here. For advice about your specific project, consult an
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