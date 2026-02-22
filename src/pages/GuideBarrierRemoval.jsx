import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideBarrierRemoval() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Barrier Removal: What's 'Readily Achievable'?"
        typeBadge="Legal Standard"
        badgeColor="#9A3412"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="definition"
            title="What Does 'Readily Achievable' Mean?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12181(9) — Definition</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "The term 'readily achievable' means easily accomplishable and
                  able to be carried out without much difficulty or expense."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.304(a)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public accommodation shall remove architectural barriers in
                  existing facilities, including communication barriers that are
                  structural in nature, where such removal is readily achievable,
                  i.e., easily accomplishable and able to be carried out without
                  much difficulty or expense."
                </p>
              </>
            }
          >
            <p>
              Under <strong>Title III of the ADA</strong>, businesses open to the
              public must remove <strong>architectural barriers</strong> in
              existing buildings when doing so is "readily achievable." This means
              the change can be made <strong>without much difficulty or
              expense</strong>.
            </p>
            <p>
              This standard applies to buildings that existed before the ADA
              (January 26, 1992) and have not been significantly renovated. New
              construction and major renovations have stricter rules — they must
              meet full accessibility standards.
            </p>
            <p>
              The key idea: <strong>you don't have to do everything, but you must
              do what's reasonable for your business.</strong>
            </p>
          </GuideSection>

          <GuideSection
            id="factors"
            title="Factors That Determine 'Readily Achievable'"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12181(9) — Factors</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  In determining whether an action is readily achievable, factors
                  to be considered include:
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (A) The nature and cost of the action;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (B) The overall financial resources of the facility involved,
                  the number of persons employed, the effect on expenses and
                  resources, or any other impact of the action on the operation
                  of the facility;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (C) The overall financial resources of the covered entity, the
                  number and type of its facilities;
                </p>
                <p style={{ margin: 0, paddingLeft: '12px' }}>
                  (D) The type of operation, including the composition, structure,
                  and functions of the workforce, and the geographic separateness
                  and administrative or fiscal relationship of the facility to the
                  covered entity.
                </p>
              </>
            }
          >
            <p>
              Whether barrier removal is "readily achievable" depends on <strong>four
              main factors</strong>:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Cost of the change:</strong> How expensive is it? A $200
                portable ramp is very different from a $50,000 elevator.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Resources of the facility:</strong> How much money does
                this specific location generate? A busy downtown location can
                afford more than a struggling rural branch.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Resources of the parent company:</strong> If the location
                is part of a larger corporation, the parent's overall resources
                count too. A single franchise location is judged partly by the
                franchisor's resources.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Type of operation:</strong> The physical nature of the
                building, the type of business, and how removing the barrier
                would impact operations.
              </li>
            </ol>
            <p>
              A small family-owned shop with a single step might be required to
              add a portable ramp ($100–$300). The same shop would <em>not</em>
              likely be required to install an elevator ($50,000+).
            </p>
          </GuideSection>

          <GuideSection
            id="priority-order"
            title="Priority Order for Barrier Removal"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.304(c) — Priorities</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  The Department of Justice recommends the following priority order
                  for barrier removal:
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (1) Providing access to the facility from public sidewalks,
                  parking, or public transportation (entrance access);
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (2) Providing access to areas where goods and services are made
                  available to the public;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (3) Providing access to restroom facilities; and
                </p>
                <p style={{ margin: 0, paddingLeft: '12px' }}>
                  (4) Removing remaining barriers.
                </p>
              </>
            }
          >
            <p>
              The DOJ recommends tackling barriers in a specific <strong>priority
              order</strong>:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { num: '1', title: 'Entrance access', desc: 'Can people with disabilities get to and through the front door? This includes accessible parking, ramps, door hardware, and a clear path from the street or lot.' },
                { num: '2', title: 'Access to goods and services', desc: 'Once inside, can customers reach the service counter, browse products, or get to the areas they need? Rearranging furniture or lowering a counter section may help.' },
                { num: '3', title: 'Restroom access', desc: 'If you provide restrooms to the public, at least one must be accessible — wide enough for a wheelchair, with grab bars, proper door clearance, and accessible fixtures.' },
                { num: '4', title: 'Remaining barriers', desc: 'All other accessibility improvements: signage, water fountains, phone accessibility, aisle widths, etc.' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '14px', padding: '14px 20px',
                  borderBottom: i < 3 ? '1px solid var(--slate-200)' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.25rem',
                    fontWeight: 700, color: '#C2410C', flexShrink: 0, width: '28px'
                  }}>{item.num}</span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="examples"
            title="Examples of Readily Achievable Changes"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.304(b) — Examples</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Examples of steps to remove barriers include: installing ramps;
                  making curb cuts in sidewalks and at entrances; repositioning
                  shelves; rearranging tables, chairs, vending machines, display
                  racks, and other furniture; repositioning telephones; adding
                  raised markings on elevator control buttons; installing flashing
                  alarm lights; widening doors; installing offset hinges to widen
                  doorways; eliminating a turnstile or providing an alternative
                  accessible path; installing accessible door hardware; installing
                  grab bars in toilet stalls; rearranging toilet partitions to
                  increase maneuvering space; insulating lavatory pipes under sinks
                  to prevent burns; installing a raised toilet seat; installing a
                  full-length bathroom mirror; repositioning paper towel dispensers;
                  removing high pile, low density carpeting; and installing vehicle
                  hand controls.
                </p>
              </>
            }
          >
            <p>
              The DOJ provides a long list of changes that are <em>typically</em>
              considered readily achievable. Here are the most common:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>Installing a ramp</strong> over a step at the entrance
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Adding grab bars</strong> in restroom stalls
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Rearranging furniture</strong> to create wider paths (36
                inches minimum)
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Installing lever-style door handles</strong> to replace
                round knobs
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Lowering a section of counter</strong> or providing a
                clipboard for signing at counter height
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Adding Braille or raised-letter signs</strong> at doors
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Repositioning shelves</strong> or paper towel dispensers
                within reach range
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Insulating exposed pipes</strong> under sinks to prevent
                burns for wheelchair users
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="ongoing"
            title="An Ongoing Obligation"
          >
            <p>
              Barrier removal is <strong>not a one-time task</strong>. The ADA
              imposes a continuing obligation to remove barriers. That means:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Reassess regularly:</strong> As your business's financial
                situation changes, what was once too expensive may become readily
                achievable. The DOJ recommends reviewing annually.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Cumulative progress:</strong> Even if you can only do one
                change per year, you should be making steady progress toward full
                accessibility.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Tax incentives help:</strong> The Disabled Access Credit
                (Section 44) and Barrier Removal Deduction (Section 190) can
                offset costs, making more changes "readily achievable."
              </li>
            </ul>

            <GuideLegalCallout citation="DOJ Technical Assistance — 28 CFR Part 36">
              <p style={{ margin: 0 }}>
                "The obligation to engage in readily achievable barrier removal is
                a continuing one. Over time, barrier removal that initially was not
                readily achievable may later be required because of changed
                circumstances."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="alternatives"
            title="If Barrier Removal Isn't Readily Achievable"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.305 — Alternatives</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "If a public accommodation can demonstrate that the removal of a
                  barrier under §36.304 is not readily achievable, a public
                  accommodation shall not fail to make such goods, services,
                  facilities, privileges, advantages, or accommodations available
                  through alternative methods if such methods are readily
                  achievable."
                </p>
              </>
            }
          >
            <p>
              When removing a barrier is <strong>not</strong> readily achievable,
              you must still provide an <strong>alternative method of
              access</strong>. Examples:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                If a mezzanine dining area isn't accessible, <strong>provide
                table service</strong> on the main accessible floor
              </li>
              <li style={{ marginBottom: '8px' }}>
                If shelving is too high, <strong>offer staff assistance</strong>
                to retrieve items
              </li>
              <li style={{ marginBottom: '8px' }}>
                If a fitting room is too narrow, <strong>allow customers to use
                an alternative space</strong> or offer a return/exchange policy
              </li>
              <li style={{ marginBottom: '8px' }}>
                If your entrance has stairs, <strong>provide curbside
                service</strong> or move operations to an accessible location
              </li>
            </ul>
            <p>
              The alternative method doesn't have to be perfect — but it must
              provide <strong>meaningful access</strong> to the goods or services
              your business offers.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about the ADA's barrier
                removal standard. Whether a specific change is "readily achievable"
                for your business depends on your individual circumstances. For
                advice about your specific situation, connect with an experienced
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