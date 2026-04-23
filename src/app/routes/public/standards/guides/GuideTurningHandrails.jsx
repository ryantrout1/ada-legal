import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';
import TurningSpaceDiagram from '../../../../components/standards/diagrams/TurningSpaceDiagram.jsx';
import HandrailDiagram from '../../../../components/standards/diagrams/HandrailDiagram.jsx';

export default function GuideTurningHandrails() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Turning Spaces & Handrail Profiles"
        typeBadge="Technical"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <TurningSpaceDiagram />

          <GuideSection
            id="turning-where"
            title="Where Are Turning Spaces Required?"
            simpleContent={
              <><p>Turning spaces are needed wherever a wheelchair needs to turn around. Common places include:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>At the end of a hallway</li><li style={{ marginBottom: "6px" }}>Inside accessible restrooms</li><li style={{ marginBottom: "6px" }}>In elevator lobbies</li></ul><p>The space must be at least 60 inches across for a full turn.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §304.1</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Turning spaces are required wherever a wheelchair user needs to change
                  direction — at the end of dead-end corridors, inside accessible restrooms,
                  within dressing rooms, and in kitchenettes and break rooms.
                </p>
              </>
            }
          >
            <p>
              A turning space is needed anywhere a person in a wheelchair must reverse
              direction. Common locations include:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Dead-end corridors</strong> — at the end of any hallway longer than a wheelchair
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Accessible toilet rooms</strong> — within the room itself (not necessarily inside the stall)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Dressing and fitting rooms</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Kitchenettes</strong> and break rooms
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Transient lodging guest rooms</strong>
              </li>
            </ul>
            <p>
              You can use either the <strong>60-inch diameter circle</strong> or the
              <strong> T-shaped</strong> option — whichever fits your layout.
            </p>
          </GuideSection>

          <GuideSection
            id="turning-tips"
            title="Design Tips"
            simpleContent={
              <><p>When designing turning spaces:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>A circular space needs 60 inches diameter</li><li style={{ marginBottom: "6px" }}>A T-shaped space can fit in a 60-by-60-inch area</li><li style={{ marginBottom: "6px" }}>The floor must be flat and clear of objects</li></ul></>
            }
          >
            <p>
              The circular space is simpler but needs a full 5-foot clear diameter.
              The T-shaped option often fits better in narrow spaces like corridors or
              between bathroom fixtures. Key points to remember:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Knee and toe clearance under lavatories, counters, and benches <strong>can overlap</strong> with the turning space
              </li>
              <li style={{ marginBottom: '8px' }}>
                Doors can swing <strong>into</strong> the turning space, but there must still be usable space
              </li>
              <li style={{ marginBottom: '8px' }}>
                The floor must be <strong>level</strong> — max 1:48 slope (about 2%)
              </li>
              <li style={{ marginBottom: '8px' }}>
                No changes in level are permitted within the turning space
              </li>
            </ul>
          </GuideSection>

          <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '48px 0' }} />

          <HandrailDiagram />

          <GuideSection
            id="handrail-where"
            title="Where Are Handrails Required?"
            simpleContent={
              <><p>Handrails are required on both sides of stairs and ramps.</p><p>They help people keep their balance. They must be between 34 and 38 inches high.</p><p>Handrails must be smooth and easy to grip.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §505.1</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Handrails provided along walking surfaces complying with 403, required
                  at ramps complying with 405, and required at stairs complying with 504
                  shall comply with 505."
                </p>
              </>
            }
          >
            <p>
              Handrails are required on both sides of:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Ramps</strong> with a rise greater than 6 inches
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Stairs</strong> that are part of a means of egress
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Walking surfaces</strong> with slopes steeper than 1:20 (5%)
              </li>
            </ul>
            <p>
              Handrails must be mounted between <strong>34 and 38 inches</strong> above
              the walking surface (measured from the top of the rail to the stair nosing
              or ramp surface). They must extend <strong>12 inches beyond the top</strong> and
              bottom of stairs and ramps.
            </p>
          </GuideSection>

          <GuideSection
            id="handrail-extensions"
            title="Handrail Extensions"
            simpleContent={
              <><p>Handrails must extend past the top and bottom of stairs and ramps.</p><p>At the top, they extend 12 inches past the last step. At the bottom, they extend the length of one tread plus 12 inches.</p><p>This gives people something to hold as they start and finish.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §505.10</strong>
                </p>
                <p style={{ margin: 0 }}>
                  At the top of stairs and ramps: extend horizontally 12 inches minimum
                  beyond the top riser nosing. At the bottom: extend at the slope of the
                  stair flight for a distance equal to one tread depth beyond the last
                  riser nosing, then extend horizontally 12 inches minimum.
                </p>
              </>
            }
          >
            <p>
              Handrails must extend beyond the stairs or ramp so users can stabilize
              themselves before and after the slope change:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Top extension:</strong> 12 inches minimum, horizontal, at the same height
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Bottom extension:</strong> slopes down with the stair for one tread depth,
                then extends 12 inches horizontally
              </li>
              <li style={{ marginBottom: '8px' }}>
                Extensions must <strong>return to the wall</strong> or post (no open, protruding ends
                that could catch clothing or injure)
              </li>
            </ul>
          </GuideSection>

          <GuideLegalCallout citation="Important Note">
            <p style={{ margin: 0 }}>
              This guide covers the most common turning space and handrail requirements.
              Specific building types (such as detention facilities or residential units)
              may have additional or modified requirements. Consult a qualified ADA
              professional for your specific facility.
            </p>
          </GuideLegalCallout>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
