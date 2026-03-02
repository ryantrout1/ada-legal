import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideSmallBusiness() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Small Business ADA Primer"
        typeBadge="Primer"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="who-is-covered"
            title="Which Businesses Are Covered?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12181(7) — Public Accommodation</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  The following private entities are considered public accommodations
                  if their operations affect commerce:
                </p>
                <ol style={{ paddingLeft: '16px', margin: '0 0 12px', fontSize: '0.8125rem' }}>
                  <li>Hotels, inns, motels</li>
                  <li>Restaurants, bars</li>
                  <li>Movie theaters, stadiums, concert halls</li>
                  <li>Auditoriums, convention centers</li>
                  <li>Bakeries, grocery stores, shopping centers</li>
                  <li>Laundromats, banks, gas stations, professional offices</li>
                  <li>Hospitals, health care offices</li>
                  <li>Bus stations, train stations</li>
                  <li>Museums, libraries, galleries</li>
                  <li>Parks, zoos, amusement parks</li>
                  <li>Schools, nurseries, day care centers</li>
                  <li>Gyms, bowling alleys, golf courses</li>
                </ol>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>
                  28 CFR Part 36 — Nondiscrimination on the Basis of Disability by
                  Public Accommodations and in Commercial Facilities
                </p>
              </>
            }
          >
            <p>
              <strong>Title III of the ADA</strong> covers all private businesses
              that are open to the public. The law calls these <strong>"places
              of public accommodation."</strong> There are 12 categories, and they
              cover nearly every type of business you can think of.
            </p>
            <p>
              This includes restaurants, stores, hotels, doctor's offices, gyms,
              movie theaters, gas stations, banks, day care centers, and more.
              If the public comes to your business — whether you have 2 employees
              or 2,000 — you are covered.
            </p>
            <p>
              There is <strong>no small business exemption</strong> under Title III.
              A one-person law office and a national chain restaurant have the same
              basic obligations. However, what's considered "reasonable" does take
              the size and resources of the business into account.
            </p>
          </GuideSection>

          <GuideSection
            id="three-obligations"
            title="Three Main Obligations"
          >
            <p>
              Every business open to the public has three core ADA duties:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif', fontSize: '1.05rem' }}>
                  1. Remove barriers in existing buildings
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  If your building was built before the ADA, you must remove
                  <strong> architectural barriers</strong> where it is "readily
                  achievable" — meaning it can be done without much difficulty
                  or expense.
                </p>
              </div>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif', fontSize: '1.05rem' }}>
                  2. Make reasonable modifications
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  You must change your policies, practices, or procedures when
                  needed so a person with a disability can use your business.
                  For example, allowing a service animal even if you have a
                  "no pets" rule.
                </p>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif', fontSize: '1.05rem' }}>
                  3. Communicate effectively
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  You must take steps to communicate with customers who have
                  hearing, vision, or speech disabilities. This might mean
                  providing written notes, reading a menu aloud, or offering
                  large-print materials.
                </p>
              </div>
            </div>
          </GuideSection>

          <GuideSection
            id="new-vs-existing"
            title="New Construction vs. Existing Buildings"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.401 — New Construction</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Discrimination for purposes of this part includes a failure to
                  design and construct facilities for first occupancy after January
                  26, 1993 that are readily accessible to and usable by individuals
                  with disabilities."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.304 — Existing Facilities</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public accommodation shall remove architectural barriers in
                  existing facilities… where such removal is readily achievable,
                  i.e., easily accomplishable and able to be carried out without
                  much difficulty or expense."
                </p>
              </>
            }
          >
            <p>
              The ADA sets <strong>different standards</strong> depending on when
              your building was built or last renovated:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>New construction (after Jan 26, 1993):</strong> Must be
                fully accessible. Must meet the 2010 ADA Standards for Accessible
                Design (for buildings designed/built after March 15, 2012).
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Alterations:</strong> When you renovate, the altered areas
                must meet current standards. If you renovate a "primary function
                area" (like the dining room or sales floor), up to 20% of the
                renovation cost must go toward making the path of travel accessible.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Existing buildings (pre-ADA):</strong> You must remove
                barriers where it is <strong>"readily achievable"</strong> — meaning
                easy and inexpensive. You are not required to do major structural
                work, but you must take reasonable steps.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="readily-achievable"
            title="The 'Readily Achievable' Standard"
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
                  <strong>28 CFR §36.304(b) — Examples</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Examples include: installing ramps; making curb cuts; lowering
                  shelves; rearranging tables, chairs, display racks; installing
                  grab bars; adding raised markings on elevator buttons; installing
                  accessible door hardware; installing an accessible paper cup
                  dispenser at a water fountain.
                </p>
              </>
            }
          >
            <p>
              "Readily achievable" means <strong>easy to accomplish and not
              expensive</strong>. What counts depends on your business's size
              and resources. A large chain restaurant can afford more than a
              family-owned café.
            </p>
            <p>
              Common readily achievable changes include:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Installing a small ramp over a step</li>
              <li style={{ marginBottom: '6px' }}>Rearranging furniture to create wider paths</li>
              <li style={{ marginBottom: '6px' }}>Adding grab bars in restrooms</li>
              <li style={{ marginBottom: '6px' }}>Lowering a counter section or adding a clipboard</li>
              <li style={{ marginBottom: '6px' }}>Replacing round doorknobs with lever handles</li>
              <li style={{ marginBottom: '6px' }}>Adding Braille or raised-letter signs</li>
            </ul>
            <p>
              If removing a barrier <em>isn't</em> readily achievable, you must
              offer an <strong>alternative method</strong> of service. For example,
              if you can't make a raised dining area accessible, you must offer
              table service on the accessible level.
            </p>
          </GuideSection>

          <GuideSection
            id="staff-training"
            title="Staff Training"
          >
            <p>
              The ADA doesn't specifically list "training" as a requirement, but
              <strong> poorly trained staff</strong> is one of the most common
              sources of ADA complaints. Your employees should know:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Service animal rules:</strong> You may ask only two
                questions — (1) is this a service animal required because of a
                disability? and (2) what task has the animal been trained to
                perform? No documentation required.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Communication:</strong> If a customer is deaf, don't just
                talk louder. Offer pen and paper, type on a phone, or use gestures.
                Ask the person what works best for them.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Wheelchair etiquette:</strong> Never grab or lean on
                someone's wheelchair. Ask before helping. Speak directly to the
                person, not their companion.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Reasonable modifications:</strong> If a customer asks for
                a policy change, staff should know to take the request seriously
                and escalate if unsure.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="tax-incentives"
            title="Tax Incentives for ADA Compliance"
          >
            <p>
              The federal government offers <strong>two tax incentives</strong> to
              help small businesses cover the cost of ADA compliance:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)'
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>
                  Disabled Access Credit (IRS Section 44)
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  Small businesses with 30 or fewer full-time employees OR $1
                  million or less in gross receipts can claim a tax credit of up
                  to <strong>$5,000 per year</strong> for ADA-related expenses.
                  The credit covers 50% of eligible costs between $250 and $10,250.
                </p>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>
                  Barrier Removal Deduction (IRS Section 190)
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                  Any business (no size limit) can deduct up to <strong>$15,000
                  per year</strong> for costs related to removing architectural
                  or transportation barriers. This can be used alongside Section 44.
                </p>
              </div>
            </div>
            <p>
              These incentives can significantly reduce the out-of-pocket cost
              of compliance improvements. Consult a tax professional for eligibility
              details.
            </p>
          </GuideSection>

          <GuideSection
            id="first-steps"
            title="Practical First Steps"
          >
            <p>
              If you're a small business owner and want to start improving ADA
              compliance, here's where to begin:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Walk through your business</strong> as if you were a
                customer using a wheelchair, or one who is blind. Note every step,
                narrow path, and missing sign.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Check your parking lot</strong> for accessible spaces with
                proper signs, access aisles, and a route to the entrance.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Review your entrance</strong> — can a wheelchair user get
                through the door independently? Is there a step that needs a ramp?
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Train your staff</strong> on service animal rules,
                communication basics, and how to handle modification requests.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Post a non-discrimination policy</strong> and let
                customers know you welcome requests for accommodations.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Check your website</strong> — does it work with a
                screen reader? Can customers navigate with a keyboard only?
              </li>
            </ol>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA obligations for
                small businesses. Requirements vary by situation. For advice about
                your specific business, consult an ADA attorney or certified access
                specialist.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}