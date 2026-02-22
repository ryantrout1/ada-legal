import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideReasonableModifications() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Reasonable Modifications"
        typeBadge="Guide"
        badgeColor="#D4570A"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="what-is-it"
            title="What Is a Reasonable Modification?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(b)(7) — Title II</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity shall make reasonable modifications in policies,
                  practices, or procedures when the modifications are necessary to
                  avoid discrimination on the basis of disability, unless the public
                  entity can demonstrate that making the modifications would
                  fundamentally alter the nature of the service, program, or activity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.302(a) — Title III</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public accommodation shall make reasonable modifications in
                  policies, practices, or procedures, when such modifications are
                  necessary to afford such goods, services, facilities, privileges,
                  advantages, or accommodations to individuals with disabilities."
                </p>
              </>
            }
          >
            <p>
              A <strong>reasonable modification</strong> is a change to a rule,
              policy, or the usual way of doing things so that a person with a
              disability can have equal access. Both government agencies (Title II)
              and businesses open to the public (Title III) are required to make
              these changes.
            </p>
            <p>
              For example, a store with a "no animals" policy must modify that rule
              to allow service animals. A government office that requires
              in-person visits must consider offering phone or video alternatives
              for someone who cannot physically travel.
            </p>
          </GuideSection>

          <GuideSection
            id="modification-vs-accommodation"
            title="Modification vs. Accommodation"
          >
            <p>
              You'll hear two similar terms in ADA law. They mean slightly different
              things depending on the context:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              <div style={{
                display: 'flex', gap: '16px', padding: '16px 20px',
                borderBottom: '1px solid var(--slate-200)', alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'Fraunces, serif', fontSize: '0.8rem', fontWeight: 700,
                  color: '#C2410C', background: '#FEF1EC',
                  padding: '4px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap'
                }}>Title II / III</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--slate-900)' }}>
                    Reasonable Modification
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    Changes to policies, practices, or procedures by government
                    agencies and businesses. Example: a restaurant allowing a
                    service animal despite a "no pets" policy.
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex', gap: '16px', padding: '16px 20px', alignItems: 'flex-start'
              }}>
                <span style={{
                  fontFamily: 'Fraunces, serif', fontSize: '0.8rem', fontWeight: 700,
                  color: '#C2410C', background: '#FEF1EC',
                  padding: '4px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap'
                }}>Title I</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--slate-900)' }}>
                    Reasonable Accommodation
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    Changes in the workplace by employers. Example: providing a
                    standing desk, modified schedule, or screen reader software for
                    an employee.
                  </p>
                </div>
              </div>
            </div>
            <p>
              The concepts are similar, but the legal standards and enforcement
              agencies differ. This page focuses on <strong>reasonable
              modifications</strong> under Titles II and III.
            </p>
          </GuideSection>

          <GuideSection
            id="examples"
            title="Common Examples of Reasonable Modifications"
          >
            <p>
              Modifications can look different depending on the business or agency.
              Here are real-world examples:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Service animals:</strong> A grocery store must modify its
                "no pets" policy to allow a trained guide dog.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Extended test time:</strong> A state licensing agency must
                give extra time on an exam for someone with a learning disability.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Flexible seating:</strong> A movie theater must allow a
                person with a mobility impairment to sit in an aisle seat if fixed
                wheelchair spaces don't meet their needs.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Curbside service:</strong> A pharmacy must offer curbside
                pickup to a customer who cannot navigate interior aisles due to a
                disability, if it's a reasonable change to their process.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Waiving fees:</strong> A city must waive late fees on a
                utility bill if a person with a cognitive disability missed the
                deadline due to their disability.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Alternative formats:</strong> A government agency must
                provide forms in large print, Braille, or electronic format.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="when-not-required"
            title="When Modifications Are Not Required"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(b)(7) — Fundamental Alteration</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  A modification is not required if it would "fundamentally alter
                  the nature of the service, program, or activity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.208 — Direct Threat</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "This part does not require a public accommodation to permit an
                  individual to participate in or benefit from the goods, services,
                  facilities, privileges, advantages and accommodations of that
                  public accommodation when that individual poses a direct threat
                  to the health or safety of others."
                </p>
              </>
            }
          >
            <p>
              There are two main situations where a modification is <strong>not
              required</strong>:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Fundamental alteration:</strong> The change would completely
                change the nature of the service. For example, a university doesn't
                have to waive a core course requirement for a degree — that would
                change the nature of the program itself.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Direct threat:</strong> The person's participation would
                pose a real, significant danger to the health or safety of others.
                This must be based on objective evidence, not fears or stereotypes.
              </li>
            </ol>
            <p>
              However, even when one specific modification isn't required, the
              business or agency must consider whether a <strong>different
              modification</strong> could work instead.
            </p>
          </GuideSection>

          <GuideSection
            id="interactive-process"
            title="The Interactive Process"
          >
            <p>
              When someone requests a modification, the business or agency should
              engage in an <strong>interactive process</strong> — a back-and-forth
              conversation to figure out what change will work. This isn't a formal
              legal requirement under Titles II and III the way it is under Title I,
              but courts have recognized it as best practice.
            </p>
            <p>Good practice looks like this:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Listen to what the person needs and why
              </li>
              <li style={{ marginBottom: '8px' }}>
                Discuss possible solutions together
              </li>
              <li style={{ marginBottom: '8px' }}>
                If the first option isn't feasible, explore alternatives
              </li>
              <li style={{ marginBottom: '8px' }}>
                Document what was discussed and agreed upon
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="documentation"
            title="Documentation Considerations"
          >
            <p>
              Under Titles II and III, businesses and government agencies generally
              <strong> cannot require medical documentation</strong> to provide a
              modification. The two-question rule for service animals is one example
              — no proof of training or disability documentation can be required.
            </p>
            <p>
              However, in some situations — especially for government programs — an
              agency may ask for <strong>enough information to understand the need
              </strong> for the modification. They cannot ask for full medical
              records or a diagnosis. They can ask what barrier exists and what
              change would help.
            </p>

            <GuideLegalCallout citation="28 CFR §35.130(b)(7) / §36.302">
              <p style={{ margin: 0 }}>
                The determination of whether a modification is "reasonable" is made
                on a case-by-case basis. Factors include the cost, the nature of
                the program, and whether alternative modifications exist.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="vs-barrier-removal"
            title="Modification vs. Barrier Removal"
          >
            <p>
              It's important not to confuse reasonable modifications with
              <strong> barrier removal</strong>. They are different legal concepts:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Reasonable modification:</strong> Changing a policy,
                practice, or procedure. Example: allowing a person to bring a
                companion to help navigate a store.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Barrier removal:</strong> Physically changing the built
                environment. Example: installing a ramp, widening a doorway, or
                adding grab bars in a restroom.
              </li>
            </ul>
            <p>
              Barrier removal is required when it is "readily achievable" — meaning
              it can be done without much difficulty or expense. Modifications to
              policies are almost always less costly and are generally required
              unless they cause a fundamental alteration.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA reasonable
                modification requirements. Every situation is different. For advice
                about your specific situation, connect with an experienced ADA
                attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}