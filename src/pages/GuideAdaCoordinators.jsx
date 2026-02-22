import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideAdaCoordinators() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="ADA Coordinators: Roles & Requirements"
        typeBadge="Guide"
        badgeColor="#8B1A1A"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="requirement"
            title="When an ADA Coordinator Is Required"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.107(a)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity that employs 50 or more persons shall
                  designate at least one employee to coordinate its efforts to
                  comply with and carry out its responsibilities under this
                  part, including any investigation of any complaint communicated
                  to it alleging its noncompliance with this part or alleging
                  any actions that would be prohibited by this part."
                </p>
              </>
            }
          >
            <p>
              Any state or local government entity with <strong>50 or more
              employees</strong> must designate at least one person as their
              <strong> ADA Coordinator</strong>. This includes cities, counties,
              school districts, transit agencies, state departments, and public
              universities.
            </p>
            <p>
              <strong>Important points:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                The 50-employee threshold counts <strong>all employees</strong>
                of the entity — not just those in a particular department
              </li>
              <li style={{ marginBottom: '8px' }}>
                Larger entities may need <strong>multiple coordinators</strong>
                — one for employment (Title I) and one for programs and services
                (Title II)
              </li>
              <li style={{ marginBottom: '8px' }}>
                Entities with <strong>fewer than 50 employees</strong> are not
                required to designate a coordinator, but they still must comply
                with all other Title II requirements
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="responsibilities"
            title="Coordinator Responsibilities"
          >
            <p>
              The ADA Coordinator serves as the entity's <strong>point
              person</strong> for disability access. While the regulation
              mentions complaint investigation and compliance coordination,
              in practice the role encompasses much more:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { duty: 'Complaint handling', desc: 'Receive, investigate, and resolve disability-related complaints from the public. Track complaints to identify patterns and systemic issues.' },
                { duty: 'Policy review', desc: 'Review the entity\'s policies, practices, and procedures to identify those that may discriminate against people with disabilities and recommend changes.' },
                { duty: 'Staff training', desc: 'Develop and conduct training for employees on their ADA obligations — front-line staff, managers, and leadership all need different levels of training.' },
                { duty: 'Public inquiries', desc: 'Serve as the first point of contact for members of the public who have questions about the entity\'s accessibility or need to request accommodations.' },
                { duty: 'Accommodation requests', desc: 'Process and respond to requests for reasonable modifications, auxiliary aids and services, and accessible formats of documents and communications.' },
                { duty: 'Facility review', desc: 'Monitor the accessibility of the entity\'s facilities, programs, and services. Coordinate with facilities management on barrier removal projects.' },
                { duty: 'Self-evaluation and transition plan', desc: 'Lead or coordinate the entity\'s self-evaluation of programs and services, and oversee the transition plan for structural changes to facilities.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.duty}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="grievance-procedures"
            title="Grievance Procedure Requirements"
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
              Entities with 50+ employees must have a <strong>formal
              grievance procedure</strong> — a clear, written process for
              handling ADA complaints. The procedure must be:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Published and available:</strong> The procedure must be
                publicly available — on the entity's website, in public
                buildings, and provided upon request
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Prompt:</strong> Complaints should be resolved within a
                reasonable timeframe. Many entities set a goal of 30–60 days for
                investigation and response.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Equitable:</strong> The process must be fair to both the
                complainant and the entity. It should include an opportunity for
                the complainant to present evidence and a written decision.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible:</strong> The complaint process itself must
                be accessible — forms available in alternate formats, ability to
                file by phone or email (not just in person), and communication
                accommodations during the investigation
              </li>
            </ul>
            <p>
              <strong>Key elements</strong> of a good grievance procedure:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>How and where to file a complaint</li>
              <li style={{ marginBottom: '6px' }}>Timeline for the entity to respond</li>
              <li style={{ marginBottom: '6px' }}>Who investigates the complaint</li>
              <li style={{ marginBottom: '6px' }}>Right to present witnesses and evidence</li>
              <li style={{ marginBottom: '6px' }}>Written decision with explanation</li>
              <li style={{ marginBottom: '6px' }}>Appeal process</li>
              <li style={{ marginBottom: '6px' }}>Statement that the complainant can also file with the DOJ</li>
            </ol>
          </GuideSection>

          <GuideSection
            id="self-evaluation"
            title="Self-Evaluation"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.105 — Self-Evaluation</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(a) A public entity shall, within one year of the effective
                  date of this part, evaluate its current services, policies,
                  and practices, and the effects thereof, that do not or may not
                  meet the requirements of this part and, to the extent
                  modification of any such services, policies, and practices is
                  required, the public entity shall proceed to make the
                  necessary modifications."
                </p>
                <p style={{ margin: 0 }}>
                  "(c) A public entity that employs 50 or more persons shall,
                  for at least three years following completion of the self-
                  evaluation, maintain on file and make available for public
                  inspection: (1) A list of the interested persons consulted;
                  (2) A description of areas examined and any problems
                  identified; and (3) A description of any modifications made."
                </p>
              </>
            }
          >
            <p>
              Every public entity was required to complete a <strong>self-
              evaluation</strong> — a comprehensive review of all programs,
              services, and policies for ADA compliance. While the original
              deadline was 1993, this is treated as an <strong>ongoing
              obligation</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>What to review:</strong> All services, programs,
                activities, policies, practices, and procedures — including
                employment, building access, communications, website, and
                public-facing programs
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Community input:</strong> People with disabilities must
                be involved in the self-evaluation process. The entity should
                consult with disability organizations, independent living
                centers, and individual community members.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Document everything:</strong> Entities with 50+ employees
                must keep records of the self-evaluation on file for at least
                3 years — including who was consulted, what was examined, problems
                found, and changes made
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Best practice:</strong> Many entities update their
                self-evaluation every 3–5 years as programs change, technology
                evolves, and new facilities are built
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="transition-plan"
            title="Transition Plan"
          >
            <p>
              If the self-evaluation identifies <strong>structural
              changes</strong> needed to achieve program access, the entity
              must develop a <strong>transition plan</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Identify barriers:</strong> List every physical obstacle
                in the entity's facilities that limits program access
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Describe solutions:</strong> For each barrier, what will
                be done — ramp, elevator, door widening, restroom renovation,
                signage, etc.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Set timelines:</strong> Specific dates for when each
                change will be completed
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Assign responsibility:</strong> Name the official who
                will ensure the plan is carried out
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Prioritize:</strong> Programs with the most public
                contact and the highest urgency should be addressed first
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.150(d)(2)">
              <p style={{ margin: 0 }}>
                "If a public entity has responsibility or authority over
                streets, roads, or walkways, its transition plan shall include a
                schedule for providing curb ramps or other sloped areas where
                pedestrian walks cross curbs, giving priority to walkways
                serving entities covered by the Act."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="public-info"
            title="Making Coordinator Information Public"
          >
            <p>
              The ADA Coordinator's information must be <strong>easily
              accessible to the public</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Required information:</strong> The coordinator's name
                (or title), office address, and telephone number
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Where to publish:</strong> The entity's website, public
                buildings, employee directories, and wherever the entity posts
                public notices
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible formats:</strong> The information must be
                available in formats that people with disabilities can access —
                including large print, Braille, and electronic formats
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Include with notices:</strong> Every public notice about
                ADA compliance, grievance procedures, or accommodation requests
                should include the coordinator's contact information
              </li>
            </ul>
            <p>
              <strong>Example:</strong> A city's website should have a clearly
              labeled "ADA Accessibility" or "ADA Information" page that
              includes the coordinator's name, phone, email, and office
              location, along with the grievance procedure and instructions
              for requesting accommodations.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA Coordinator
                requirements under Title II. Individual entities may have
                additional obligations under state law or local ordinance.
                For legal advice about your entity's obligations or your
                rights, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}