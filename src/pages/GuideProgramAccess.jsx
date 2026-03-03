import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideProgramAccess() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Program Accessibility"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="definition"
            title="What Program Access Means"
            simpleContent={
              <>
                <p>Program access means people with disabilities must be able to use government services.</p>
                <p>If a service is offered in a building, people with disabilities must be able to get to it.</p>
                <p>This does not mean every room in every building must be accessible.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.149 — Discrimination Prohibited</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Except as otherwise provided in §35.150, no qualified
                  individual with a disability shall, because a public entity's
                  facilities are inaccessible to or unusable by individuals with
                  disabilities, be excluded from participation in, or be denied
                  the benefits of the services, programs, or activities of a
                  public entity, or be subjected to discrimination by any public
                  entity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150(a)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity shall operate each service, program, or
                  activity so that the service, program, or activity, when
                  viewed in its entirety, is readily accessible to and usable by
                  individuals with disabilities."
                </p>
              </>
            }
          >
            <p>
              <strong>Program access</strong> is the standard Title II uses for
              existing government facilities. The key phrase is <strong>"when
              viewed in its entirety"</strong> — meaning the overall program
              must be accessible, even if individual buildings are not.
            </p>
            <p>
              This is a <strong>practical, flexible standard</strong>. It
              recognizes that many government buildings are old and may be
              difficult to renovate. Instead of requiring every building to be
              fully accessible, it asks: can a person with a disability actually
              access and use the government's programs?
            </p>
            <p>
              <strong>Example:</strong> A county has four offices that issue
              driver's licenses. Two are in older buildings with stairs. As long
              as the other two offices are accessible and reasonably located,
              the program — driver's license services — is accessible "when
              viewed in its entirety."
            </p>
          </GuideSection>

          <GuideSection
            id="methods"
            title="Methods to Achieve Program Access"
            simpleContent={
              <>
                <p>Governments can provide access in different ways:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Move the service to an accessible location.</li>
                  <li style={{ marginBottom: "6px" }}>Provide the service at home or online.</li>
                  <li style={{ marginBottom: "6px" }}>Modify the building to add access.</li>
                  <li style={{ marginBottom: "6px" }}>Use assistive devices or aids.</li>
                </ul>
              </>
            }
          >
            <p>
              Government entities can use a variety of methods to make programs
              accessible without necessarily renovating every building:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { method: 'Relocate the service', desc: 'Move the program or service to an accessible building. A city could hold public hearings at the accessible community center instead of an older city hall.' },
                { method: 'Reassign to accessible areas', desc: 'Move staff or services to an accessible floor or wing of the same building. A clerk\'s office on the second floor with no elevator could serve walk-in customers at a first-floor window.' },
                { method: 'Offer home visits', desc: 'For social services, inspections, or other programs, staff can visit the individual\'s home instead of requiring them to come to an inaccessible office.' },
                { method: 'Provide online or phone alternatives', desc: 'Many services can be offered online, by phone, or by mail — tax payments, license renewals, complaint filings, records requests.' },
                { method: 'Make structural changes', desc: 'Install ramps, widen doorways, add accessible restrooms, or make other physical modifications to the building.' },
                { method: 'Use portable equipment', desc: 'Temporary ramps, assistive listening devices, or mobile accessible voting machines can be deployed as needed.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.method}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="not-every-building"
            title="Not Every Building Has to Be Accessible"
            simpleContent={
              <>
                <p>The government does not have to make every building accessible.</p>
                <p>But it must make sure every program is accessible when looked at as a whole.</p>
                <p>If a program is only offered in one building, that building must be accessible.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150(a)(1)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity is not required to make each of its existing
                  facilities accessible to and usable by individuals with
                  disabilities."
                </p>
              </>
            }
          >
            <p>
              This is a common misconception. Title II does <strong>not</strong>
              require every government-owned building to be fully accessible.
              It requires that <strong>programs</strong> be accessible.
            </p>
            <p>
              However, there are limits to this flexibility:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                The alternative must provide <strong>equal access</strong> — not
                a lesser experience. Sending someone to a different office
                across town when an accessible office exists next door is not
                equal access.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Unique programs</strong> in a single location must be
                made accessible at that location. If city council meetings
                happen only at city hall, that room must be accessible — you
                can't tell wheelchair users to watch from home.
              </li>
              <li style={{ marginBottom: '10px' }}>
                The person with a disability should not bear a
                <strong> disproportionate burden</strong> — like traveling much
                farther, waiting much longer, or getting less service.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="transition-plans"
            title="Transition Plans"
            simpleContent={
              <>
                <p>If changes to buildings are needed, the government must create a written plan with deadlines.</p>
                <p>This plan should say what will be fixed, when, and who is responsible.</p>
                <p>The public should be able to see this plan.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150(d)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "In the event that structural changes to facilities will be
                  undertaken to achieve program accessibility, a public entity
                  that employs 50 or more persons shall develop, within six
                  months of January 26, 1992, a transition plan setting forth
                  the steps necessary to complete such changes."
                </p>
                <p style={{ margin: 0 }}>
                  The plan must: "(1) Identify physical obstacles in the public
                  entity's facilities that limit the accessibility of its
                  programs, activities, or services; (2) Describe in detail the
                  methods that will be used to make the facilities accessible;
                  (3) Specify the schedule for taking the steps necessary…; and
                  (4) Indicate the official responsible for implementation."
                </p>
              </>
            }
          >
            <p>
              When structural changes <strong>are</strong> needed, public
              entities with 50+ employees must create a <strong>transition
              plan</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Identify barriers:</strong> Survey all facilities and
                list the physical obstacles
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Describe solutions:</strong> For each barrier, explain
                how it will be removed (ramp, elevator, door widening, etc.)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Set a timeline:</strong> Specific dates for when each
                change will be completed
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Name a responsible official:</strong> One person
                accountable for implementing the plan
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Public input:</strong> The plan must be made available
                for public review, and the entity should seek input from people
                with disabilities during development
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="undue-burden"
            title="Undue Financial & Administrative Burden"
            simpleContent={
              <>
                <p>A government does not have to take an action if it would be too expensive or too difficult.</p>
                <p>But the bar is high. The government must show it really cannot afford it.</p>
                <p>Even if one solution is too expensive, they must try another way.</p>
              </>
            }
          >
            <p>
              Title II recognizes that some changes may be extremely costly or
              difficult. A public entity is not required to take any action that
              would result in an <strong>undue financial and administrative
              burden</strong>.
            </p>
            <p>
              But this is a <strong>very high bar</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                The decision must be made by the <strong>head of the entity</strong>
                (or their designee) — not a mid-level manager
              </li>
              <li style={{ marginBottom: '10px' }}>
                It must be based on <strong>all resources available</strong> to
                the entity as a whole — not just one department's budget
              </li>
              <li style={{ marginBottom: '10px' }}>
                Even if full compliance is an undue burden, the entity must
                still take <strong>whatever action it can</strong> that falls
                short of the undue burden
              </li>
              <li style={{ marginBottom: '10px' }}>
                The determination must be accompanied by a <strong>written
                statement</strong> explaining the reasons
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.150(a)(3)">
              <p style={{ margin: 0 }}>
                "The head of the public entity or his or her designee… shall
                decide… whether compliance with §35.150(a) would result in such
                distortion or undue burden. The decision shall be accompanied
                by a written statement of the reasons for reaching that
                conclusion."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="historic-preservation"
            title="Historic Preservation"
            simpleContent={
              <>
                <p>Historic buildings have some flexibility, but they are not exempt from the ADA.</p>
                <p>Changes must be made unless they would threaten or destroy the historic features.</p>
                <p>Even then, alternative methods of access must be provided.</p>
              </>
            }
          >
            <p>
              Many government facilities are in <strong>historic
              buildings</strong>. Title II addresses this:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                The program access requirement still applies — programs in
                historic buildings must be accessible
              </li>
              <li style={{ marginBottom: '10px' }}>
                If making the building accessible would <strong>threaten or
                destroy its historic significance</strong>, alternative methods
                can be used (such as relocating the program)
              </li>
              <li style={{ marginBottom: '10px' }}>
                The entity must consult with the <strong>State Historic
                Preservation Officer</strong> before concluding that a
                modification would threaten historic significance
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="self-evaluation"
            title="Self-Evaluation Requirement"
            simpleContent={
              <>
                <p>Every government was required to review its programs and find problems.</p>
                <p>This review is called a self-evaluation. It should cover policies, practices, and buildings.</p>
                <p>If problems were found, a plan to fix them must be created and followed.</p>
              </>
            }
          >
            <p>
              Title II requires every public entity to conduct a <strong>self-
              evaluation</strong> — a thorough review of all policies,
              practices, and procedures to determine whether they discriminate
              against people with disabilities.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                The self-evaluation examines <strong>all</strong> programs and
                services — not just physical facilities
              </li>
              <li style={{ marginBottom: '8px' }}>
                People with disabilities should be <strong>involved</strong> in
                the self-evaluation process
              </li>
              <li style={{ marginBottom: '8px' }}>
                Entities with 50+ employees must keep the self-evaluation on
                file for <strong>3 years</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                While the original deadline was 1993, the DOJ continues to
                enforce this obligation — many entities update their
                self-evaluations periodically
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about the program access
                requirement under Title II. Specific obligations depend on the
                entity's size, resources, and the nature of its programs. For
                legal advice about your rights or your entity's obligations,
                connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}