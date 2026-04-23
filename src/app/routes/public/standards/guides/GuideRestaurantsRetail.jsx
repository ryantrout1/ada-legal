import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideRestaurantsRetail() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Restaurants & Retail Accessibility"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="dining-surfaces"
            title="Accessible Dining Surfaces"
            simpleContent={
              <>
                <p>At least 5% of dining tables (but no less than one) must be accessible.</p>
                <p>An accessible table is 28 to 34 inches high with knee space underneath.</p>
                <p>Wheelchair users should not be stuck in a separate area. They get the same choices as everyone else.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §226.1 — Dining Surfaces</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Where dining surfaces are provided for the consumption of food
                  or drink, at least 5 percent of the seating spaces and standing
                  spaces at the dining surfaces shall comply with 902."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§902.3 — Height</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "The tops of dining surfaces and work surfaces shall be 28 inches
                  (710 mm) minimum and 34 inches (865 mm) maximum above the finish
                  floor or ground."
                </p>
                <p style={{ margin: 0 }}>
                  <strong>§902.2 — Knee and Toe Clearance</strong>: Knee and toe
                  clearance shall comply with §306.
                </p>
              </>
            }
          >
            <p>
              At least <strong>5% of dining surfaces</strong> in a restaurant or
              café must be accessible to wheelchair users. This means:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Table height:</strong> Between <strong>28 and 34
                inches</strong> above the floor
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Knee clearance:</strong> At least 27 inches high, 8 inches
                deep, and 30 inches wide under the table for a wheelchair to fit
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Location:</strong> Accessible tables must be on an
                accessible route — not stuck in a corner or behind steps
              </li>
            </ul>
            <p>
              <strong>Example:</strong> A restaurant with 40 tables needs at least
              2 accessible tables. Pedestal-base tables often work better than
              four-legged tables because they provide more knee clearance.
            </p>
            <p>
              High-top bar tables and counters typically <strong>do not</strong>
              meet the height requirement on their own, so the accessible 5% must
              include standard-height tables.
            </p>
          </GuideSection>

          <GuideSection
            id="food-service-lines"
            title="Food Service Lines"
            simpleContent={
              <>
                <p>Buffets, cafeteria lines, and salad bars must be reachable from a wheelchair.</p>
                <p>The aisle must be at least 36 inches wide.</p>
                <p>If a counter is too high, staff must offer to serve the food.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §227.3 — Self-Service Areas</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Self-service shelving shall be on an accessible route. At least
                  50 percent of each type of self-service shelf provided shall
                  comply with 308."
                </p>
                <p style={{ margin: 0 }}>
                  <strong>§403.5.1 — Clear Width</strong>: The clear width of
                  walking surfaces shall be 36 inches (915 mm) minimum. At turns
                  around an obstruction, the clear width shall be 48 inches (1220
                  mm) minimum on the approaching side and 42 inches (1065 mm)
                  minimum on the latch side.
                </p>
              </>
            }
          >
            <p>
              Buffets, cafeteria lines, and self-service food stations must be
              accessible:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Aisle width:</strong> At least <strong>36 inches
                wide</strong> throughout the service line — wide enough for a
                wheelchair
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Tray slides:</strong> If provided, they must be usable
                from a seated position and within reach range
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Self-service items:</strong> At least 50% of each type
                of shelf or dispensing area must be within <strong>reach range
                </strong> (15–48 inches for a forward reach, or 15–46 inches for
                a side reach)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Staff assistance:</strong> If some items are out of reach
                range, staff must be available to help retrieve them
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="counters"
            title="Sales and Service Counters"
            simpleContent={
              <>
                <p>At least one section of a counter must be no higher than 36 inches.</p>
                <p>This applies to checkout counters, order counters, and reception desks.</p>
                <p>If the counter is too high, the business must provide another way to serve you.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §904.4 — Sales and Service Counters</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "§904.4.1 Approach. A portion of the counter surface that is 36
                  inches (915 mm) long minimum and 36 inches (915 mm) high maximum
                  above the finish floor shall be provided."
                </p>
                <p style={{ margin: 0 }}>
                  "Where the counter surface is less than 36 inches (915 mm) long,
                  the entire counter surface shall be 36 inches (915 mm) high
                  maximum."
                </p>
              </>
            }
          >
            <p>
              Every sales or service counter where customers interact with staff
              must have an <strong>accessible portion</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                At least a <strong>36-inch-long section</strong> of the counter
                must be no higher than <strong>36 inches</strong> above the floor
              </li>
              <li style={{ marginBottom: '8px' }}>
                This applies to check-in desks, pharmacy counters, bank teller
                windows, dry cleaner drop-offs, and any other service counter
              </li>
              <li style={{ marginBottom: '8px' }}>
                An <strong>alternative</strong>: a fold-out shelf, a clipboard,
                or a side counter that meets the height requirement can also work
              </li>
            </ul>
            <p>
              <strong>Example:</strong> A coffee shop with a 42-inch counter must
              provide at least 36 inches of counter space at 36 inches high where
              a wheelchair user can order, pay, and receive their drink.
            </p>
          </GuideSection>

          <GuideSection
            id="checkout-aisles"
            title="Checkout Aisles"
            simpleContent={
              <>
                <p>At least one checkout aisle must be wide enough for a wheelchair (at least 36 inches).</p>
                <p>The accessible aisle must be clearly marked.</p>
                <p>Card readers and pin pads must be low enough to reach from a wheelchair.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §904.3 — Checkout Aisles</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Where checkout aisles are provided, at least one of each type of
                  checkout aisle shall be accessible. In new construction, checkout
                  aisles shall comply with §904.3."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Table 227.2 — Checkout Aisles</strong>
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                  1–4 total aisles: 1 accessible. 5–8 total: 2 accessible. 9–15
                  total: 3 accessible. Over 15 total: 3 + 20% of additional.
                </p>
              </>
            }
          >
            <p>
              Retail stores with checkout aisles must provide <strong>accessible
              lanes</strong>. The number required depends on the total:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { total: '1–4 checkout aisles', accessible: '1 accessible' },
                { total: '5–8 checkout aisles', accessible: '2 accessible' },
                { total: '9–15 checkout aisles', accessible: '3 accessible' },
                { total: 'Over 15 checkout aisles', accessible: '3 + 20% of additional' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.total}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem' }}>{row.accessible}</span>
                </div>
              ))}
            </div>
            <p>
              Accessible checkout aisles must be at least <strong>36 inches
              wide</strong>, have a counter no higher than 38 inches, and be
              identified with the International Symbol of Accessibility.
            </p>
          </GuideSection>

          <GuideSection
            id="display-aisles"
            title="Display Aisles and Merchandise"
            simpleContent={
              <>
                <p>Store aisles must be wide enough for a wheelchair to pass. The minimum is 36 inches.</p>
                <p>Products should be within reach. Anything important should be between 15 and 48 inches high.</p>
                <p>If something is out of reach, staff must help when asked.</p>
              </>
            }
          >
            <p>
              Retail display aisles must be wide enough for customers using
              wheelchairs or mobility devices:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Clear width:</strong> At least <strong>36 inches</strong>
                throughout the aisle, and 44 inches in areas with two-way traffic
              </li>
              <li style={{ marginBottom: '8px' }}>
                Floor displays, boxes, and rack extensions that narrow the aisle
                below 36 inches are a <strong>common violation</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Merchandise displayed above 48 inches or below 15 inches may be
                out of reach range for wheelchair users — staff assistance should
                be offered
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="outdoor-dining"
            title="Outdoor Dining Areas"
            simpleContent={
              <>
                <p>Outdoor patios and dining areas must also be accessible.</p>
                <p>There must be an accessible path from inside the restaurant to the outdoor area.</p>
                <p>Accessible tables must be available outside too, not just inside.</p>
                <p>The ground surface must be firm and level enough for a wheelchair.</p>
              </>
            }
          >
            <p>
              If a restaurant provides outdoor dining (patio, sidewalk café,
              rooftop), the outdoor area must be <strong>accessible too</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                An <strong>accessible route</strong> must connect the interior to
                the outdoor area — no steps without a ramp
              </li>
              <li style={{ marginBottom: '8px' }}>
                At least <strong>5% of outdoor tables</strong> must meet
                accessible dimensions (28–34 inches high with knee clearance)
              </li>
              <li style={{ marginBottom: '8px' }}>
                The ground surface must be <strong>firm, stable, and
                slip-resistant</strong> — loose gravel or deep grass can be
                inaccessible
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA requirements for
                restaurants and retail establishments. Your specific situation may
                involve additional state or local requirements. For advice about
                your facility, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
