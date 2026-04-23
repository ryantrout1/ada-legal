import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideHotelsLodging() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Hotels & Lodging Accessibility"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="scoping"
            title="How Many Accessible Guest Rooms Are Required?"
            simpleContent={
              <><p>Hotels must have a certain number of accessible guest rooms. The more rooms a hotel has, the more accessible rooms it needs.</p><p>Accessible rooms must have wider doors, lower controls, and accessible bathrooms.</p><p>Some rooms must also have visual alarms and other features for deaf guests.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §224.2 — Guest Rooms</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  Accessible guest rooms with mobility features shall be provided
                  in accordance with Table 224.2:
                </p>
                <table style={{
                  width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem',
                  margin: '8px 0'
                }} role="table" aria-label="Accessible guest room scoping table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--border)', fontWeight: 700 }}>Total Rooms</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--border)', fontWeight: 700 }}>Mobility</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--border)', fontWeight: 700 }}>Communication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['1–25', '1', '2'],
                      ['26–50', '2', '4'],
                      ['51–75', '4', '7'],
                      ['76–100', '5', '9'],
                      ['101–150', '7', '12'],
                      ['151–200', '8', '14'],
                      ['201–300', '10', '17'],
                      ['301–400', '12', '20'],
                      ['401–500', '13', '22'],
                      ['501–1000', '2% + 3', '4% + 2']
                    ].map(([total, mob, comm], i) => (
                      <tr key={i}>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{total}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{mob}</td>
                        <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{comm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            }
          >
            <p>
              Hotels, motels, inns, and other places of lodging must provide a
              minimum number of <strong>accessible guest rooms</strong>. Two
              categories are required:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Mobility-accessible rooms:</strong> Rooms with wider doors,
                roll-in showers or accessible bathtubs, accessible routes, grab
                bars, and other features for people who use wheelchairs or have
                mobility impairments.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Communication-accessible rooms:</strong> Rooms with visual
                alarms, visual notification devices (for doorbells and phone calls),
                and telephones with volume control for guests who are deaf or hard
                of hearing.
              </li>
            </ul>
            <p>
              The exact number depends on the total rooms in the facility — see
              the scoping table in the legal text column.
            </p>
          </GuideSection>

          <GuideSection
            id="bathing"
            title="Roll-In Showers vs. Bathtub Rooms"
            simpleContent={
              <><p>Accessible bathrooms can have either a roll-in shower or a bathtub with a seat.</p><p>Most accessible rooms must have a roll-in shower. Some can have a bathtub instead.</p><p>Both types must have grab bars and enough space for a wheelchair.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §224.2</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  Of the total number of mobility-accessible rooms, a portion must
                  include a <strong>roll-in shower</strong> and a portion must
                  include an <strong>accessible bathtub</strong>.
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§608 — Shower Compartments</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Roll-in shower compartments shall be 60 inches (1525 mm) wide
                  minimum by 30 inches (760 mm) deep minimum. Alternate roll-in
                  type: 60 inches wide minimum by 36 inches deep minimum with a
                  folding seat.
                </p>
              </>
            }
          >
            <p>
              Not all mobility-accessible rooms are the same. The ADA requires
              a mix of <strong>bathing options</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Roll-in showers:</strong> A curbless shower that a
                wheelchair user can roll directly into. Minimum size is
                60 × 30 inches. These must include a fold-down bench seat, grab
                bars, and a hand-held shower spray unit.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Accessible bathtubs:</strong> A standard tub with grab
                bars, a removable in-tub seat or a permanent seat at the head of
                the tub, and a hand-held shower spray.
              </li>
            </ul>
            <p>
              Some guests prefer a bathtub (for example, for soaking or bathing
              children), while others need a roll-in shower. Hotels must
              provide <strong>both types</strong> across their accessible room
              inventory.
            </p>
          </GuideSection>

          <GuideSection
            id="reservations"
            title="Reservation System Requirements"
            simpleContent={
              <><p>Hotels must let you book an accessible room the same way anyone books a room.</p><p>They must describe what makes the room accessible. They cannot require extra steps to book it.</p><p>They must hold the room for you and not give it away to someone who does not need it.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.302(e) — Reservations</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  (1) "A public accommodation that owns, leases (or leases to),
                  or operates a place of lodging shall, with respect to reservations
                  made by any means… (i) Modify its policies, practices, or
                  procedures to ensure that individuals with disabilities can make
                  reservations for accessible guest rooms during the same hours and
                  in the same manner as individuals who do not need accessible
                  rooms."
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  (ii) "Identify and describe accessible features in the hotels
                  and guest rooms offered through its reservations service in
                  enough detail to reasonably permit individuals with disabilities
                  to assess independently whether a given hotel or guest room meets
                  his or her accessibility needs."
                </p>
                <p style={{ margin: 0 }}>
                  (iii) "Ensure that accessible guest rooms are held for use by
                  individuals with disabilities until all other guest rooms of that
                  type have been rented and the accessible room requested is the
                  only room of that type remaining."
                </p>
              </>
            }
          >
            <p>
              The ADA has specific rules about <strong>how hotels handle
              reservations</strong> for accessible rooms:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Book the same way:</strong> Guests must be able to reserve
                accessible rooms through the same systems (website, phone, app)
                used for all rooms — and during the same hours.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Describe accessibility features:</strong> The reservation
                system must clearly describe the accessible features — roll-in
                shower vs. bathtub, room layout, grab bars, door widths — so
                guests can decide if the room meets their needs.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Hold rooms for people who need them:</strong> Accessible
                rooms must not be rented to people without disabilities until
                <strong> all other rooms of that type are sold out</strong>.
                Hotels cannot "block" accessible rooms from general inventory
                and then claim none are available.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>No surcharges:</strong> Hotels cannot charge extra for
                accessible rooms.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="dispersion"
            title="Dispersion Across Room Types"
            simpleContent={
              <><p>Accessible rooms cannot all be the cheapest rooms. They must be spread across different types and price levels.</p><p>If a hotel has suites, some suites must be accessible. If it has ocean-view rooms, some of those must be accessible too.</p></>
            }
          >
            <p>
              Accessible rooms must be <strong>dispersed</strong> across the
              different types of rooms the hotel offers. This means:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                If the hotel has standard kings, standard queens, suites, and
                deluxe rooms — accessible rooms should be available in
                <strong> each category</strong>, not just the cheapest rooms
              </li>
              <li style={{ marginBottom: '8px' }}>
                Guests with disabilities should have the same range of
                <strong> choices</strong> as other guests — view, floor level,
                bed type, amenities
              </li>
              <li style={{ marginBottom: '8px' }}>
                Putting all accessible rooms in one wing or on one floor is only
                acceptable if all rooms in the hotel are on that floor
              </li>
            </ul>

            <GuideLegalCallout citation="2010 ADA Standards §224.5">
              <p style={{ margin: 0 }}>
                "Guest rooms required to provide mobility features… shall be
                dispersed among the various classes of guest rooms, and shall
                provide choices of types of guest rooms, number of beds, and
                other amenities comparable to the choices provided to other guests."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="communication-features"
            title="Guest Room Communication Features"
            simpleContent={
              <><p>Some hotel rooms must have features for deaf or hard-of-hearing guests:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Visual fire alarms with flashing lights</li><li style={{ marginBottom: "6px" }}>A doorbell or door knock alert with a flashing light</li><li style={{ marginBottom: "6px" }}>A phone with volume control</li><li style={{ marginBottom: "6px" }}>Closed captioning on the TV</li></ul></>
            }
          >
            <p>
              Rooms designated as <strong>communication-accessible</strong> must
              include features for guests who are deaf, hard of hearing, or
              deaf-blind:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Visual alarms:</strong> Flashing lights connected to the
                building fire alarm system
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Visual notification devices:</strong> Flashing or vibrating
                alerts for the doorbell/door knock, telephone ringing, and alarm
                clock
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Telephone with volume control:</strong> The in-room phone
                must have adjustable volume amplification
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Electrical outlet near phone jack:</strong> For guests who
                use TTY devices or captioned telephone equipment
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA lodging
                requirements. Specific situations may involve additional state or
                local requirements. For advice about your rights as a guest or
                your obligations as a lodging provider, connect with an experienced
                ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
