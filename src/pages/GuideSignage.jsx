import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideSignage() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="ADA Signage Requirements"
        typeBadge="Checklist"
        badgeColor="#9A3412"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="room-signs"
            title="Room Identification Signs"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §216.2</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Interior and exterior signs identifying permanent rooms and
                  spaces shall comply with 703.1, 703.2, and 703.5." This includes
                  raised characters and Braille.
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§703.4.1 — Height Above Finish Floor</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Tactile characters on signs shall be located 48 inches (1220 mm)
                  minimum above the finish floor or ground surface, measured from
                  the baseline of the lowest tactile character and 60 inches
                  (1525 mm) maximum above the finish floor or ground surface,
                  measured from the baseline of the highest tactile character."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§703.4.2 — Location</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Where a tactile sign is provided at a door, the sign shall be
                  located alongside the door at the latch side."
                </p>
              </>
            }
          >
            <p>
              Signs that identify <strong>permanent rooms and spaces</strong> —
              restrooms, offices, conference rooms, stairwells, exits — must
              include both <strong>raised (tactile) characters</strong> and
              <strong> Braille</strong>. These signs allow people who are blind or
              have low vision to read the sign by touch.
            </p>
            <p>
              Placement rules:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Mount on the wall beside the door, on the <strong>latch
                side</strong> (the side with the door handle)
              </li>
              <li style={{ marginBottom: '8px' }}>
                The baseline of the lowest character must be at least
                <strong> 48 inches</strong> above the floor
              </li>
              <li style={{ marginBottom: '8px' }}>
                The baseline of the highest character must be no more than
                <strong> 60 inches</strong> above the floor
              </li>
              <li style={{ marginBottom: '8px' }}>
                The sign must be placed so a person reading it by touch is
                <strong> not in the path of the opening door</strong>
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="raised-characters"
            title="Raised Characters and Braille"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §703.2 — Raised Characters</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  §703.2.3 — "Characters shall be uppercase."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  §703.2.5 — "Characters shall be raised 1/32 inch (0.8 mm)
                  minimum above their background."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  §703.2.6 — "Character height measured vertically from the
                  baseline of the character shall be 5/8 inch (16 mm) minimum
                  and 2 inches (51 mm) maximum based on the height of the
                  uppercase letter 'I'."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§703.3 — Braille</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Braille shall be contracted (Grade 2) and shall comply with
                  §703.3."  Braille dots shall have a domed or rounded shape and
                  shall be 1/25 inch (1.0 mm) to 1/16 inch (1.6 mm) in base
                  diameter, 0.025 inches (0.6 mm) to 0.037 inches (0.9 mm) high.
                </p>
              </>
            }
          >
            <p>
              For tactile signs (those meant to be read by touch), the characters
              must meet specific requirements:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>All uppercase</strong> letters
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Raised at least 1/32 inch</strong> above the background
              </li>
              <li style={{ marginBottom: '8px' }}>
                Character height between <strong>5/8 inch and 2 inches</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Sans serif or simple serif</strong> font — no decorative
                or script fonts
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Grade 2 (contracted) Braille</strong> must be placed
                directly below the corresponding raised text
              </li>
            </ul>
            <p>
              The Braille dots must have a <strong>rounded or domed shape</strong>,
              not flat-topped — flat-topped dots are harder to read by touch and
              do not comply.
            </p>
          </GuideSection>

          <GuideSection
            id="directional-signs"
            title="Directional and Informational Signs"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §216.3</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Signs that provide direction to or information about interior
                  spaces and facilities of the site shall comply with 703.5."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§703.5 — Visual Characters</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Characters shall contrast with their background with either
                  light characters on a dark background or dark characters on a
                  light background." Character height shall comply with Table
                  703.5.5 based on viewing distance. Minimum height for signs
                  viewed at 72 inches or less: 5/8 inch minimum.
                </p>
              </>
            }
          >
            <p>
              Signs that give <strong>directions</strong> (like "Exit →" or
              "Elevator ↑") or <strong>information</strong> (like building
              directories or floor-level signs) have different rules than room
              identification signs. They do <strong>not</strong> need raised
              characters or Braille, but they must be <strong>visually
              clear</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>High contrast:</strong> Light characters on a dark
                background, or dark characters on a light background
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Text size:</strong> Based on viewing distance — the farther
                away a person will read the sign, the larger the characters must be
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Non-glare finish:</strong> The sign surface must not create
                glare that makes it hard to read
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Font:</strong> Sans serif or simple serif, conventional in
                form — no italic, oblique, script, or highly decorative fonts
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="isa-symbol"
            title="International Symbol of Accessibility (ISA)"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §703.7.2.1</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The International Symbol of Accessibility shall comply with
                  Figure 703.7.2.1." The symbol consists of a white figure on a
                  blue background. It must be used to identify accessible elements
                  and facilities including entrances, parking spaces, toilet rooms,
                  and bathing rooms.
                </p>
              </>
            }
          >
            <p>
              The <strong>ISA</strong> — the blue wheelchair symbol — must be
              displayed at:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>Accessible parking spaces</strong>
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Accessible entrances</strong> (when not all entrances are
                accessible)
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Accessible restrooms</strong>
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Accessible checkout lanes</strong> and service areas
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Areas of refuge</strong> (emergency safe areas)
              </li>
            </ul>
            <p>
              The symbol must follow the standard design — a white stylized
              figure on a <strong>blue background</strong>. Some jurisdictions
              accept the updated "dynamic" ISA symbol with the figure leaning
              forward, but the traditional symbol always complies.
            </p>
          </GuideSection>

          <GuideSection
            id="exit-signs"
            title="Exit Signs"
          >
            <p>
              Exit signs have requirements under both the ADA and the fire/life
              safety code. Under the ADA:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Doors at <strong>accessible means of egress</strong> must have
                signs with the ISA and visual characters
              </li>
              <li style={{ marginBottom: '8px' }}>
                Where <strong>not all exits are accessible</strong>, accessible
                exits must be identified and directional signage must be provided
                at inaccessible exits
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Areas of refuge</strong> — safe areas where people who
                cannot use stairs can wait during an emergency — must have
                illuminated signs with the ISA symbol
              </li>
            </ul>

            <GuideLegalCallout citation="2010 ADA Standards §216.4">
              <p style={{ margin: 0 }}>
                "Signs required by §216.4.1 through §216.4.3 shall comply with
                703.1, 703.2, and 703.5." Exit signs at accessible exits must
                include tactile characters and Braille where required by the
                applicable building or fire code.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="parking-signage"
            title="Parking Signage"
          >
            <p>
              Accessible parking signs have their own specific requirements
              (covered in detail in our Accessible Parking guide):
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Must display the <strong>ISA symbol</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Mounted <strong>60 inches minimum</strong> above the ground
                (measured to the bottom of the sign)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Van-accessible spaces: must include the words
                <strong> "Van Accessible"</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Ground-painted symbols alone are not sufficient</strong>
                — an upright sign is always required
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="finish-contrast"
            title="Finish and Contrast Requirements"
          >
            <p>
              For all ADA signs to be readable, the finish and contrast must meet
              these standards:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Non-glare finish:</strong> Characters and their background
                must have a non-glare or eggshell finish. Glossy surfaces create
                reflections that make signs harder to read, especially for people
                with low vision.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>High contrast:</strong> There must be a strong visual
                contrast between the characters and the background. The ADA does
                not specify an exact contrast ratio for signs (unlike WCAG for
                digital), but <strong>light-on-dark or dark-on-light</strong> is
                required.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Font style:</strong> Characters must be <strong>sans serif
                or simple serif</strong>, not italic, not oblique, not decorative,
                and not script.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Stroke width:</strong> Characters must not be too thin or
                too heavy — standard weight provides the best readability.
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide covers the most common signage requirements from the
                2010 ADA Standards. Your state or local building code may impose
                additional signage requirements. For advice about your specific
                facility, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}