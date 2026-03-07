import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import GuideReadingLevelBar from '../components/guide/GuideReadingLevelBar';
import ToiletStallDiagram from '../components/guide/diagrams/ToiletStallDiagram';

export default function GuideRestrooms() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Accessible Restroom Requirements"
        typeBadge="Checklist"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <ToiletStallDiagram />

          <GuideSection
            id="scoping"
            title="How Many Accessible Restrooms Are Required?"
            simpleContent={
              <>
                <p>If a building has restrooms for the public, at least one of each type must be accessible.</p>
                <p>This means one accessible men's room and one accessible women's room (or one accessible all-gender room).</p>
                <p>Each floor that has restrooms must have an accessible one.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §213.2</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Where toilet rooms are provided, each toilet room shall comply
                  with 603. Where bathing rooms are provided, each bathing room
                  shall comply with 603."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§213.2 Exception 4</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Where multiple single user toilet rooms or bathing rooms are
                  clustered at a single location, no more than 50 percent of the
                  single user toilet rooms for each use at each cluster shall be
                  required to comply with 603."
                </p>
              </>
            }
          >
            <p>
              The basic rule is straightforward: if you provide restrooms to the
              public, they must be <strong>accessible</strong>. The number of
              accessible restrooms depends on what you have:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Multi-stall restrooms:</strong> At least one stall must be
                wheelchair-accessible, and at least one must be ambulatory-accessible
                (narrower, with grab bars, for people who can walk but need support).
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Single-user restrooms:</strong> If you have multiple
                single-user restrooms grouped together, at least <strong>50%</strong>
                must be accessible.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Unisex restrooms:</strong> If you provide a unisex
                (single-user) restroom, it must be accessible. This is also
                required when existing multi-stall restrooms aren't accessible
                in an existing facility.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="stall-dimensions"
            title="Wheelchair-Accessible Stall Dimensions"
            simpleContent={
              <>
                <p>The accessible stall must be big enough for a wheelchair to enter and turn around.</p>
                <p>Minimum size: 60 inches wide by 59 inches deep (for a wall-mounted toilet).</p>
                <p>The door must swing out or be a sliding door. It cannot swing into the stall.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §604.8.1.1 — Floor Mounted</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Wheelchair accessible compartments with floor-mounted water
                  closets shall be 60 inches (1525 mm) wide minimum measured
                  perpendicular to the side wall, and 59 inches (1500 mm) deep
                  minimum measured perpendicular to the rear wall."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§604.8.1.2 — Wall Mounted</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Wheelchair accessible compartments with wall-hung water closets
                  shall be 60 inches (1525 mm) wide minimum measured perpendicular
                  to the side wall, and 56 inches (1420 mm) deep minimum measured
                  perpendicular to the rear wall."
                </p>
              </>
            }
          >
            <p>
              The wheelchair-accessible stall must be large enough for a person
              using a wheelchair to enter, close the door, transfer to the toilet,
              and exit. The minimum dimensions are:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { label: 'Width', value: '60 inches (5 ft) minimum' },
                { label: 'Depth (floor-mounted toilet)', value: '59 inches minimum' },
                { label: 'Depth (wall-hung toilet)', value: '56 inches minimum' },
                { label: 'Door', value: 'Must open outward or be wide enough to not block transfer' },
                { label: 'Door clear width', value: '32 inches minimum' }
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
              The stall door on a wheelchair-accessible stall must <strong>swing
              outward</strong> unless the stall is large enough that the door
              doesn't reduce the required floor space. Self-closing hinges are
              allowed but the door must close slowly enough for safe use.
            </p>
          </GuideSection>

          <GuideSection
            id="grab-bars"
            title="Grab Bar Requirements"
            simpleContent={
              <>
                <p>Grab bars help people transfer from a wheelchair to the toilet.</p>
                <p>There must be grab bars on the side wall and the back wall.</p>
                <p>Side bar: at least 42 inches long. Back bar: at least 36 inches long.</p>
                <p>They must hold at least 250 pounds and be between 33 and 36 inches high.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §604.5 — Grab Bars</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  §604.5.1 — Side wall: "The side wall grab bar shall be 42 inches
                  (1065 mm) long minimum, located 12 inches (305 mm) maximum from
                  the rear wall and extending 54 inches (1370 mm) minimum from the
                  rear wall."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  §604.5.2 — Rear wall: "The rear wall grab bar shall be 36 inches
                  (915 mm) long minimum and extend from the centerline of the water
                  closet 12 inches (305 mm) minimum on one side and 24 inches
                  (610 mm) minimum on the other side."
                </p>
                <p style={{ margin: 0 }}>
                  §609.4 — Height: "Grab bars shall be installed in a horizontal
                  position, 33 inches (840 mm) minimum and 36 inches (915 mm)
                  maximum above the finish floor."
                </p>
              </>
            }
          >
            <p>
              Grab bars are essential safety features. They help people transfer
              from a wheelchair to the toilet and provide support for people who
              have difficulty sitting and standing.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Side wall:</strong> At least <strong>42 inches long</strong>,
                starting no more than 12 inches from the back wall. It must extend
                at least 54 inches from the back wall.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Rear wall:</strong> At least <strong>36 inches long</strong>,
                centered behind the toilet. It extends 12 inches minimum on one side
                and 24 inches minimum on the other side of the toilet centerline.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Height:</strong> Mounted between <strong>33 and 36
                inches</strong> above the finished floor.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Strength:</strong> Must support at least 250 pounds of force.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="toilet-specs"
            title="Toilet Height and Position"
            simpleContent={
              <>
                <p>The toilet seat must be between 17 and 19 inches high. This makes it easier to transfer from a wheelchair.</p>
                <p>The toilet must be centered 16 to 18 inches from the side wall.</p>
                <p>The flush handle must be on the open side, not against the wall.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §604.4 — Seat Height</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "The seat height of a water closet above the finish floor shall
                  be 17 inches (430 mm) minimum and 19 inches (485 mm) maximum
                  measured to the top of the seat."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§604.2 — Location</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The water closet shall be positioned with a wall or partition to
                  the rear and to one side. The centerline of the water closet shall
                  be 16 inches (405 mm) minimum to 18 inches (455 mm) maximum from
                  the side wall or partition."
                </p>
              </>
            }
          >
            <p>
              The toilet itself has specific requirements:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Seat height:</strong> Between <strong>17 and 19
                inches</strong> from the floor to the top of the seat. This
                "comfort height" makes transfers from a wheelchair much easier.
                Standard residential toilets are typically 15 inches — too low
                for ADA compliance.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Centerline position:</strong> The center of the toilet
                must be <strong>16 to 18 inches</strong> from the side wall.
                This ensures the grab bar is within reach during transfers.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Flush controls:</strong> Must be operable with one hand
                and not require tight grasping, pinching, or twisting. Automatic
                flush systems always comply.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="lavatory"
            title="Lavatory (Sink) Requirements"
            simpleContent={
              <>
                <p>The sink must be low enough for someone in a wheelchair to reach.</p>
                <p>The top of the sink can be no higher than 34 inches. There must be knee space underneath.</p>
                <p>Faucets must work with one hand. Lever or sensor faucets are best.</p>
                <p>Hot water pipes under the sink must be covered so they do not burn someone's legs.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §606.3 — Height</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Lavatories and sinks shall be installed with the front of the
                  higher of the rim or counter surface 34 inches (865 mm) maximum
                  above the finish floor."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§306 — Knee and Toe Clearance</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Knee clearance at 27 inches (685 mm) high minimum, 8 inches
                  (205 mm) deep minimum at 27 inches AFF. Toe clearance space
                  under the element 30 inches (760 mm) wide minimum and 17 inches
                  (430 mm) deep minimum.
                </p>
              </>
            }
          >
            <p>
              The sink (or "lavatory" in code language) must allow a person in a
              wheelchair to pull up underneath it:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Rim or counter height:</strong> No more than <strong>34
                inches</strong> above the floor
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Knee clearance:</strong> At least 27 inches high and 8
                inches deep under the sink for wheelchair access
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Insulated pipes:</strong> Hot water and drain pipes under
                the sink must be <strong>insulated or covered</strong> to prevent
                burns for wheelchair users whose legs may contact them
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Faucets:</strong> Must be operable with one hand without
                tight grasping. Lever handles, push controls, or automatic
                sensors all comply.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="door"
            title="Restroom Door Requirements"
            simpleContent={
              <>
                <p>The restroom door must be at least 32 inches wide.</p>
                <p>It must have a lever handle or push plate, not a round knob.</p>
                <p>There must be enough space for a wheelchair to approach and open the door.</p>
              </>
            }
          >
            <p>
              The restroom door is often where violations occur. Key requirements:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Clear width:</strong> At least <strong>32 inches</strong>
                when the door is open 90 degrees
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Hardware:</strong> Must be operable with one hand without
                tight grasping, pinching, or twisting of the wrist. Round knobs
                do <strong>not</strong> comply. Lever handles, push/pull bars, and
                U-shaped pulls do.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Closing speed:</strong> If the door has a closer, it must
                take at least <strong>5 seconds</strong> to move from the 90-degree
                open position to 12 degrees
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Maneuvering clearance:</strong> Sufficient floor space on
                both sides of the door for a wheelchair user to approach, open, and
                pass through
              </li>
            </ul>

            <GuideLegalCallout citation="2010 ADA Standards §404.2.3">
              <p style={{ margin: 0 }}>
                "Door closers and gate closers shall be adjusted so that from an
                open position of 90 degrees, the time required to move the door to
                a position of 12 degrees from the latch is 5 seconds minimum."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="signage"
            title="Restroom Signage"
            simpleContent={
              <>
                <p>Restroom signs must include raised letters and Braille so blind people can read them.</p>
                <p>Signs go on the wall next to the door handle, not on the door itself.</p>
                <p>If not all restrooms are accessible, signs must point to the nearest accessible one.</p>
              </>
            }
          >
            <p>
              Accessible restrooms require specific signage:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>International Symbol of Accessibility (ISA):</strong>
                The blue wheelchair symbol must be posted at accessible restrooms
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Room identification signs:</strong> Must include
                <strong> raised characters and Braille</strong>, mounted on the
                wall next to the latch side of the door, between 48 and 60 inches
                above the floor
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Directional signs:</strong> If not all restrooms in a
                facility are accessible, directional signs must guide people to
                the accessible ones
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide covers the most common restroom requirements from the
                2010 ADA Standards. State and local plumbing codes may add
                requirements. For advice about your specific facility, consult an
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