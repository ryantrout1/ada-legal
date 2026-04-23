import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideAdaCoordinators() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="ADA Coordinators: Roles & Requirements"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="requirement"
            title="Who Must Designate an ADA Coordinator?"
            simpleContent={
              <>
                <p>Any government with 50 or more employees must have a person in charge of ADA compliance.</p>
                <p>This person is called the ADA coordinator.</p>
                <p>Smaller governments should also have one, but it is not legally required.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.107(a)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity that employs 50 or more persons shall
                  designate at least one employee to coordinate its efforts
                  to comply with and carry out its responsibilities under
                  this part, including any investigation of any complaint
                  communicated to it alleging its noncompliance with this
                  part or alleging any actions that would be prohibited by
                  this part."
                </p>
              </>
            }
          >
            <p>
              Every <strong>state or local government entity with 50 or more
              employees</strong> must designate at least one person as its
              ADA Coordinator. This includes cities, counties, school districts,
              transit authorities, public universities, courts, and every other
              public entity that meets the threshold.
            </p>
            <p>
              There is no specific job title required — the person may be
              called "ADA Coordinator," "Disability Services Director,"
              "Civil Rights Compliance Officer," or something else entirely.
              What matters is that <strong>someone is designated</strong> and
              empowered to do the work.
            </p>
            <p>
              <strong>Smaller entities</strong> (under 50 employees) are not
              required to designate a coordinator, but they still must comply
              with every other Title II requirement. Many smaller entities
              voluntarily designate a coordinator because it makes compliance
              easier.
            </p>
          </GuideSection>

          <GuideSection
            id="responsibilities"
            title="Coordinator Responsibilities"
            simpleContent={
              <>
                <p>The ADA coordinator:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Handles disability complaints and requests.</li>
                  <li style={{ marginBottom: "6px" }}>Makes sure government programs are accessible.</li>
                  <li style={{ marginBottom: "6px" }}>Trains staff about the ADA.</li>
                  <li style={{ marginBottom: "6px" }}>Coordinates building and program changes.</li>
                </ul>
              </>
            }
          >
            <p>
              While the regulation doesn't list every specific duty, the ADA
              Coordinator's role typically includes:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { duty: 'Handle complaints & requests', desc: 'Receive and investigate complaints from people with disabilities about accessibility barriers. Process requests for reasonable modifications and auxiliary aids. Track complaint patterns to identify systemic issues.' },
                { duty: 'Review policies & procedures', desc: 'Examine all of the entity\'s policies, practices, and programs for potential disability discrimination. Recommend changes to remove barriers. Ensure new policies are ADA-compliant before adoption.' },
                { duty: 'Coordinate physical access', desc: 'Work with facilities staff to identify and remove architectural barriers. Oversee the transition plan for structural changes. Ensure new construction and alterations meet accessibility standards.' },
                { duty: 'Train staff', desc: 'Provide ADA training for employees across the organization — front-desk staff, managers, IT personnel, facilities workers, and leadership. Training should cover disability etiquette, legal obligations, and how to respond to accommodation requests.' },
                { duty: 'Respond to public inquiries', desc: 'Serve as the public point of contact for ADA questions. Provide information about the entity\'s accessibility features, accommodation process, and grievance procedures.' },
                { duty: 'Monitor compliance', desc: 'Conduct regular accessibility assessments. Stay current on ADA regulations and guidance. Report to leadership on compliance status and needed improvements.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.duty}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="public-notice"
            title="Making Coordinator Information Public"
            simpleContent={
              <>
                <p>The government must tell the public who the ADA coordinator is and how to reach them.</p>
                <p>This information should be on the government website and in public buildings.</p>
              </>
            }
          >
            <p>
              The entire purpose of having an ADA Coordinator is defeated if
              no one knows who they are. The entity must make the coordinator's
              information <strong>readily available</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Name</strong> (or at minimum, the title of the position)
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Office address</strong>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Phone number</strong> (and TTY or relay service number)
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Email address</strong>
              </li>
            </ul>
            <p>
              This information should be posted on the entity's <strong>
              website</strong>, included on <strong>public notices</strong>,
              and available at <strong>service locations</strong>. Many
              entities also include it on meeting agendas, application forms,
              and building signage.
            </p>

            <GuideLegalCallout citation="DOJ Guidance">
              <p style={{ margin: 0 }}>
                The DOJ recommends that public entities "provide the ADA
                coordinator's name, office address, and telephone number to
                all interested individuals" and that this information be
                "included in public notices describing the entity's obligations
                under the ADA."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="grievance"
            title="Grievance Procedures"
            simpleContent={
              <>
                <p>Governments with 50+ employees must have a written process for filing ADA complaints.</p>
                <p>The process should be simple and easy to find.</p>
                <p>Anyone should be able to file a complaint, and it should be resolved promptly.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.107(b)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity that employs 50 or more persons shall adopt
                  and publish grievance procedures providing for prompt and
                  equitable resolution of complaints alleging any action that
                  would be prohibited by this part."
                </p>
              </>
            }
          >
            <p>
              Entities with 50+ employees must have a formal <strong>grievance
              procedure</strong> — a clear process for people to file ADA
              complaints and have them resolved. An effective procedure
              includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Simple filing process:</strong> A complaint form (in
                accessible formats) or the ability to file by email, phone,
                or in person. The process should be easy enough that anyone
                can use it.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Clear timelines:</strong> The entity should specify
                how quickly it will acknowledge the complaint, investigate,
                and respond. "Prompt" typically means weeks, not months.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Investigation process:</strong> An impartial review
                of the facts. The complainant should have the opportunity to
                present evidence and be kept informed of progress.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Appeals:</strong> If the complainant disagrees with
                the resolution, there should be a way to appeal to a higher
                authority within the entity.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>No retaliation:</strong> The procedure must make clear
                that retaliation against anyone who files a complaint is
                prohibited.
              </li>
            </ul>
            <p>
              <strong>Important:</strong> Filing a grievance with the entity is
              <em> not</em> a prerequisite for filing a complaint with the DOJ
              or a federal court. People can file externally at any time.
            </p>
          </GuideSection>

          <GuideSection
            id="self-evaluation"
            title="Self-Evaluation"
            simpleContent={
              <>
                <p>The government must review all its services to check for accessibility problems.</p>
                <p>This includes buildings, websites, policies, and communication methods.</p>
                <p>The results should be kept on file and shared with the public.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.105(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity shall, within one year of the effective
                  date of this part, evaluate its current services, policies,
                  and practices, and the effects thereof, that do not or may
                  not meet the requirements of this part and, to the extent
                  modification of any such services, policies, and practices
                  is required, the public entity shall proceed to make the
                  necessary modifications."
                </p>
                <p style={{ margin: 0 }}>
                  <strong>28 CFR §35.105(c)</strong><br />
                  "Interested persons, including individuals with disabilities
                  or organizations representing individuals with disabilities,
                  shall be provided an opportunity to participate in the
                  self-evaluation process."
                </p>
              </>
            }
          >
            <p>
              A <strong>self-evaluation</strong> is a comprehensive review of
              everything the entity does — all programs, services, policies,
              and practices — to determine if they discriminate against people
              with disabilities:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Scope:</strong> Review every program, service, and
                activity — parks, libraries, licensing, public meetings,
                websites, emergency services, hiring, everything
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Involve the community:</strong> People with disabilities
                and disability organizations must have the opportunity to
                participate in the self-evaluation process
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Document findings:</strong> Entities with 50+ employees
                must keep the self-evaluation on file for at least <strong>3
                years</strong>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Take action:</strong> Where barriers are found, the
                entity must modify its services, policies, and practices
              </li>
            </ul>
            <p>
              Although the original deadline for completing the self-evaluation
              was 1993, many entities never completed one — and the DOJ
              continues to require it in enforcement actions and settlement
              agreements.
            </p>
          </GuideSection>

          <GuideSection
            id="transition-plan"
            title="Transition Plans"
            simpleContent={
              <>
                <p>If problems are found during the self-evaluation, the government must make a plan to fix them.</p>
                <p>The plan should include deadlines and the people responsible.</p>
                <p>The public should have a chance to comment on the plan.</p>
              </>
            }
          >
            <p>
              If the self-evaluation identifies <strong>physical barriers</strong>
              in facilities that require structural changes for program access,
              the entity must develop a <strong>transition plan</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Identify obstacles:</strong> List every physical barrier
                in every facility — steps, narrow doorways, inaccessible
                restrooms, lack of signage, etc.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Describe solutions:</strong> For each barrier, explain
                how it will be fixed (install a ramp, widen a doorway, add an
                elevator, etc.)
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Set a schedule:</strong> Specific completion dates for
                each modification, with priority given to the most critical
                programs
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Designate responsibility:</strong> Name the official
                responsible for overseeing the plan's implementation
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Public review:</strong> The transition plan must be
                available for public inspection and comment
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.150(d)(1)">
              <p style={{ margin: 0 }}>
                "The plan shall, at a minimum — (i) Identify physical
                obstacles in the public entity's facilities that limit the
                accessibility of its programs, activities, or services to
                individuals with disabilities; (ii) Describe in detail the
                methods that will be used to make the facilities accessible;
                (iii) Specify the schedule for taking the steps necessary to
                achieve compliance; and (iv) Indicate the official responsible
                for implementation of the plan."
              </p>
            </GuideLegalCallout>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA Coordinator
                requirements and related obligations. For legal advice about
                your entity's specific obligations or your rights as a person
                with a disability, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
