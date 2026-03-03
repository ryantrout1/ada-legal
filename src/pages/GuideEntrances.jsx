import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import DoorDiagram from '../components/guide/diagrams/DoorDiagram';

export default function GuideEntrances() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Accessible Entrances & Doors"
        typeBadge="Checklist"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <DoorDiagram />

          <GuideSection
            id="how-many"
            title="How Many Entrances Must Be Accessible?"
            simpleContent={
              <>
                <p>At least 60% of all public entrances must be accessible.</p>
                <p>If a building has only one public entrance, it must be accessible.</p>
                <p>The accessible entrance must be on a path that connects to parking and sidewalks.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §206.4 — Entrances</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "At least 60 percent of all public entrances shall comply with
                  404." In addition, entrances required by §206.4.1 through
                  §206.4.8 shall also comply.
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§206.4.1</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Each public entrance to a facility on an accessible route
                  from site arrival points shall be accessible. At least one
                  accessible entrance shall be a public entrance."
                </p>
              </>
            }
          >
            <p>
              The ADA requires that at least <strong>60% of all public
              entrances</strong> be accessible. In addition, these specific
              entrances must always be accessible:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                At least <strong>one</strong> entrance connected to an accessible
                route from the parking lot, sidewalk, or public transit stop
              </li>
              <li style={{ marginBottom: '8px' }}>
                Entrances to each <strong>tenant space</strong> in a building
                with multiple businesses (like a strip mall)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Entrances from <strong>parking garages</strong> and
                <strong> tunnels or elevated walkways</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Restricted entrances</strong> (employee-only, loading
                docks) that are not public — but at least one must be accessible
                if employees with disabilities use them
              </li>
            </ul>
            <p>
              If your main entrance has steps and no ramp, you must provide an
              accessible alternative and post <strong>directional signage</strong>
              pointing to the accessible entrance.
            </p>
          </GuideSection>

          <GuideSection
            id="door-width"
            title="Door Clear Width"
            simpleContent={
              <>
                <p>Doors must be at least 32 inches wide when open. This lets wheelchairs pass through.</p>
                <p>Double doors: at least one of the two doors must be 32 inches wide.</p>
                <p>This is measured with the door open at 90 degrees.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §404.2.3 — Clear Width</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Door openings shall provide a clear width of 32 inches (815 mm)
                  minimum. Clear openings of doorways with swinging doors shall be
                  measured between the face of the door and the stop, with the door
                  open 90 degrees."
                </p>
                <p style={{ margin: 0 }}>
                  Projections into the clear width between 34 inches (865 mm) and
                  80 inches (2030 mm) above the floor are limited to 4 inches
                  (100 mm) maximum.
                </p>
              </>
            }
          >
            <p>
              When an accessible door is open 90 degrees, the <strong>clear
              opening</strong> must be at least <strong>32 inches wide</strong>.
              This is measured from the face of the door to the opposite door stop.
            </p>
            <p>
              Important details:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                A standard <strong>36-inch door</strong> typically provides about
                32 inches of clear width when open — just meeting the requirement
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Double doors:</strong> At least one leaf must provide 32
                inches of clear width independently
              </li>
              <li style={{ marginBottom: '8px' }}>
                Nothing can protrude more than <strong>4 inches</strong> into
                the clear width between 34 and 80 inches above the floor
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="maneuvering"
            title="Maneuvering Clearances"
            simpleContent={
              <>
                <p>There must be enough flat space in front of a door for a wheelchair to approach and open it.</p>
                <p>The space needed depends on which way the door swings and which side the handle is on.</p>
                <p>This space must be level and free of objects like planters or signs.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §404.2.4 — Maneuvering Clearances</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  Minimum maneuvering clearances at doors and gates shall comply
                  with §404.2.4. The floor surface within the required clearances
                  shall have a slope not steeper than 1:48 and shall comply with
                  §302.
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>
                  The specific clearances vary by approach direction (front, hinge
                  side, latch side) and whether the user is pulling or pushing.
                  See Table 404.2.4.1 for swinging doors and 404.2.4.2 for sliding
                  and folding doors.
                </p>
              </>
            }
          >
            <p>
              A wheelchair user needs <strong>floor space on both sides of a
              door</strong> to position themselves, open the door, and pass through.
              The amount of space depends on how you approach the door:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { approach: 'Front approach (pull side)', clearance: '60 in deep × 18 in latch side' },
                { approach: 'Front approach (push side)', clearance: '48 in deep minimum' },
                { approach: 'Hinge approach (pull side)', clearance: '60 in deep × 36 in from hinge' },
                { approach: 'Latch approach (pull side)', clearance: '60 in deep × 24 in from latch' },
                { approach: 'Latch approach (push side)', clearance: '48 in deep × 24 in from latch' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.approach}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem' }}>{row.clearance}</span>
                </div>
              ))}
            </div>
            <p>
              The floor in these clearance areas must be <strong>level</strong>
              (maximum slope of 1:48 or 2%) so a wheelchair doesn't roll away
              while the person opens the door.
            </p>
          </GuideSection>

          <GuideSection
            id="hardware"
            title="Door Hardware"
            simpleContent={
              <>
                <p>Door handles must be easy to use with one hand and without gripping or twisting.</p>
                <p>Lever handles and push bars are good. Round knobs are not allowed because they are hard to turn.</p>
                <p>Handles must be between 34 and 48 inches from the floor.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §404.2.7 — Hardware</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Handles, pulls, latches, locks, and other operable parts on
                  doors and gates shall comply with 309.4. Operable parts of such
                  hardware shall be 34 inches (865 mm) minimum and 48 inches
                  (1220 mm) maximum above the finish floor or ground surface."
                </p>
              </>
            }
          >
            <p>
              Door hardware must be usable with <strong>one hand</strong> and
              without tight grasping, pinching, or twisting of the wrist. This
              means:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Round doorknobs do not comply.</strong> They require a
                grasping and twisting motion that many people with arthritis,
                limited hand strength, or paralysis cannot perform.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Lever handles</strong> are the most common compliant option
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Push/pull bars, U-shaped handles,</strong> and loop handles
                also comply
              </li>
              <li style={{ marginBottom: '8px' }}>
                Hardware must be mounted between <strong>34 and 48 inches</strong>
                above the floor
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="thresholds"
            title="Thresholds"
            simpleContent={
              <>
                <p>The bump at the bottom of a door is called a threshold. It must be low enough for a wheelchair.</p>
                <p>Maximum height: 1/2 inch for most doors, 3/4 inch for sliding doors.</p>
                <p>Raised thresholds must have sloped edges so wheels can roll over them.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §404.2.5</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Thresholds at doorways shall be 1/2 inch (13 mm) high maximum.
                  Raised thresholds and changes in level at doorways shall comply
                  with §302 and §303. EXCEPTION: Existing or altered thresholds
                  3/4 inch (19 mm) high maximum that have a beveled edge on each
                  side with a slope not steeper than 1:2 shall not be required to
                  comply."
                </p>
              </>
            }
          >
            <p>
              A door threshold is the raised strip at the bottom of a doorway.
              Under the ADA:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                New construction: maximum <strong>1/2 inch</strong> high
              </li>
              <li style={{ marginBottom: '8px' }}>
                Existing/altered buildings: maximum <strong>3/4 inch</strong>,
                but it must have <strong>beveled edges</strong> on both sides
                (no steeper than 1:2 slope)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Sliding doors: maximum <strong>3/4 inch</strong>
              </li>
            </ul>
            <p>
              Even a 1-inch threshold can be impassable for someone using a
              wheelchair or walker. This is one of the most common — and easiest
              to fix — ADA violations at entrances.
            </p>
          </GuideSection>

          <GuideSection
            id="closing-speed"
            title="Door Closing Speed"
            simpleContent={
              <>
                <p>Doors with closers must close slowly enough for someone in a wheelchair to get through.</p>
                <p>The door must take at least 5 seconds to close from fully open to almost closed.</p>
                <p>If a door slams shut too fast, it is a barrier.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §404.2.8.1</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Door closers and gate closers shall be adjusted so that from an
                  open position of 90 degrees, the time required to move the door
                  to a position of 12 degrees from the latch is 5 seconds minimum."
                </p>
              </>
            }
          >
            <p>
              If a door has an automatic closer, it must close <strong>slowly
              enough</strong> for a person with a disability to pass through
              safely. The rule: it must take at least <strong>5 seconds</strong>
              for the door to swing from 90 degrees open to 12 degrees from closed.
            </p>
            <p>
              A fast-closing door can strike a slow-moving person, knock over
              someone using a walker, or slam on a wheelchair before the person
              is through. This is a common violation that can be fixed simply by
              adjusting the closer mechanism.
            </p>
          </GuideSection>

          <GuideSection
            id="automatic-doors"
            title="Automatic Doors"
            simpleContent={
              <>
                <p>Automatic doors are great for accessibility but they are not always required.</p>
                <p>When they are installed, they must stay open long enough for someone to pass through safely.</p>
                <p>Power-assisted doors must not open too fast or too forcefully.</p>
              </>
            }
          >
            <p>
              While the ADA does <strong>not require</strong> automatic doors in
              most situations, they are the most accessible option and are
              strongly recommended. When automatic doors are provided:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                They must remain open long enough for a slow-moving person to
                pass through safely
              </li>
              <li style={{ marginBottom: '8px' }}>
                Sensors must detect people using wheelchairs, walkers, and other
                devices close to the ground
              </li>
              <li style={{ marginBottom: '8px' }}>
                Power-assisted doors must not open too quickly or with too much force
              </li>
            </ul>

            <GuideLegalCallout citation="2010 ADA Standards §404.3">
              <p style={{ margin: 0 }}>
                "Full-powered automatic doors shall comply with ANSI/BHMA A156.10.
                Low-energy and power-assisted doors shall comply with ANSI/BHMA
                A156.19."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="directional-signage"
            title="Directional Signage to Accessible Entrances"
            simpleContent={
              <>
                <p>If the main entrance is not accessible, signs must point to the one that is.</p>
                <p>Signs should use the wheelchair symbol and an arrow.</p>
                <p>People should not have to guess which entrance to use.</p>
              </>
            }
          >
            <p>
              When not all entrances are accessible, you must post <strong>
              directional signs</strong> at the inaccessible entrances telling
              people where the accessible entrance is located.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Signs must include the <strong>International Symbol of
                Accessibility</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Must clearly direct people to the nearest accessible entrance
              </li>
              <li style={{ marginBottom: '8px' }}>
                The accessible entrance itself must be clearly identified with
                the ISA symbol
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide covers the most common entrance and door requirements
                from the 2010 ADA Standards. Your specific situation may involve
                additional requirements. For advice about your facility, connect
                with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}