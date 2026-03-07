import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import GuideReadingLevelBar from '../components/guide/GuideReadingLevelBar';

export default function GuideEducation() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Education & the ADA"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="overview"
            title="How the ADA Applies to Education"
            simpleContent={
              <>
                <p>The ADA protects students with disabilities in schools and colleges.</p>
                <p>Public schools and government colleges follow Title II. Private schools follow Title III.</p>
                <p>Schools must make changes so students with disabilities can learn alongside everyone else.</p>
              </>
            }
          >
            <p>
              Education is one of the most important areas where the ADA
              protects people with disabilities. Multiple federal laws work
              together — but they cover <strong>different things</strong>, and
              understanding which law applies to your situation matters.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>ADA Title II</strong> covers public schools (K–12),
                public colleges and universities, and all educational programs
                run by state or local government
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>ADA Title III</strong> covers private schools and
                universities (as places of public accommodation)
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Section 504 of the Rehabilitation Act</strong> covers
                any school or university that receives federal funding (which
                includes nearly all of them)
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>IDEA</strong> (Individuals with Disabilities Education
                Act) provides specific rights for K–12 students with
                disabilities in public schools — like IEPs — but is a separate
                law from the ADA
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="k12"
            title="Public K–12 Schools (Title II)"
            simpleContent={
              <>
                <p>Public schools must be accessible to students with disabilities. This includes:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Ramps, elevators, and accessible classrooms</li>
                  <li style={{ marginBottom: "6px" }}>Sign language interpreters and Braille materials</li>
                  <li style={{ marginBottom: "6px" }}>Access to all activities, including sports and field trips</li>
                  <li style={{ marginBottom: "6px" }}>Accessible school websites and online tools</li>
                </ul>
                <p>Schools cannot say no just because it costs money. They must find a way.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "No qualified individual with a disability shall, on the
                  basis of disability, be excluded from participation in or
                  be denied the benefits of the services, programs, or
                  activities of a public entity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(b)(7)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity shall make reasonable modifications in
                  policies, practices, or procedures when the modifications
                  are necessary to avoid discrimination on the basis of
                  disability."
                </p>
              </>
            }
          >
            <p>
              Public school districts are government entities, so <strong>Title
              II applies to everything they do</strong> — not just classroom
              instruction, but athletics, after-school programs, field trips,
              graduation ceremonies, parent-teacher events, and school websites.
            </p>
            <p>
              <strong>How Title II differs from IDEA and 504:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>IDEA</strong> gives eligible students an Individualized
                Education Program (IEP) and a right to a "free appropriate
                public education." It only applies to K–12 students who qualify
                for special education.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Section 504</strong> is broader — it covers any student
                with a disability and requires schools to provide
                accommodations (504 plans), but it's tied to federal funding.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>The ADA</strong> applies regardless of federal funding.
                It covers physical access to buildings, effective communication,
                reasonable modifications to policies, and prohibits disability
                discrimination in all programs.
              </li>
            </ul>
            <p>
              <strong>Example:</strong> A student who uses a wheelchair has
              rights under IDEA (if eligible for special education), Section
              504 (for classroom accommodations), <em>and</em> the ADA (the
              school building, playground, and gymnasium must be physically
              accessible).
            </p>
          </GuideSection>

          <GuideSection
            id="universities"
            title="Public Universities (Title II)"
            simpleContent={
              <>
                <p>Public colleges and universities must be accessible. This means:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Students can request extra time on tests or note-taking help</li>
                  <li style={{ marginBottom: "6px" }}>Classrooms, labs, and dorms must be accessible</li>
                  <li style={{ marginBottom: "6px" }}>Course materials must work with screen readers</li>
                  <li style={{ marginBottom: "6px" }}>There should be a disability services office to help students</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150 — Existing Facilities</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity shall operate each service, program, or
                  activity so that the service, program, or activity, when
                  viewed in its entirety, is readily accessible to and usable
                  by individuals with disabilities."
                </p>
                <p style={{ margin: 0 }}>
                  This program access requirement applies to classrooms,
                  libraries, dormitories, dining halls, recreational
                  facilities, and all other campus facilities and programs.
                </p>
              </>
            }
          >
            <p>
              Public colleges and universities must ensure <strong>program
              access</strong> across all campus facilities and services:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Classrooms:</strong> Must be physically accessible.
                Classes in inaccessible buildings must be relocated when a
                student with a mobility disability enrolls.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Housing:</strong> A sufficient number of accessible
                dormitory rooms must be available. Students with disabilities
                must have the same housing choices as other students — not
                limited to one specific building.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Dining:</strong> Dining facilities must be physically
                accessible, and food service must accommodate dietary needs
                related to disabilities when reasonable.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Academic accommodations:</strong> Note-takers, extended
                time on exams, captioned videos, accessible textbook formats,
                sign language interpreters for lectures.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Campus events:</strong> Guest lectures, sporting events,
                career fairs, and commencement ceremonies must all be accessible.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="private-schools"
            title="Private Schools & Universities (Title III)"
            simpleContent={
              <>
                <p>Private schools must also follow the ADA (Title III), unless they are religious schools.</p>
                <p>They must remove barriers that are easy to fix. They must provide help like interpreters or large-print materials.</p>
                <p>Religious schools are not covered by the ADA, but some state laws may still apply.</p>
              </>
            }
          >
            <p>
              Private schools and universities that are open to the public are
              <strong> places of public accommodation</strong> under Title III
              of the ADA. This means they must:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Not discriminate against students, applicants, or visitors
                with disabilities
              </li>
              <li style={{ marginBottom: '8px' }}>
                Remove <strong>architectural barriers</strong> where readily
                achievable
              </li>
              <li style={{ marginBottom: '8px' }}>
                Provide <strong>auxiliary aids and services</strong> for
                effective communication
              </li>
              <li style={{ marginBottom: '8px' }}>
                Make <strong>reasonable modifications</strong> to policies and
                practices
              </li>
            </ul>
            <p>
              <strong>Exception:</strong> Religious organizations that operate
              schools are exempt from Title III (but not necessarily from
              Section 504 if they receive federal funding).
            </p>
          </GuideSection>

          <GuideSection
            id="testing"
            title="Testing Accommodations"
            simpleContent={
              <>
                <p>Students with disabilities can get changes to how tests are given. Common examples:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Extra time on tests</li>
                  <li style={{ marginBottom: "6px" }}>A separate, quiet room</li>
                  <li style={{ marginBottom: "6px" }}>A computer instead of writing by hand</li>
                  <li style={{ marginBottom: "6px" }}>A reader or scribe to help</li>
                  <li style={{ marginBottom: "6px" }}>Large print or Braille tests</li>
                </ul>
                <p>The school cannot change what the test measures. They can only change how it is given.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.309 — Examinations and Courses</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(a) Any private entity that offers examinations or courses
                  related to applications, licensing, certification, or
                  credentialing for secondary or postsecondary education,
                  professional, or trade purposes shall offer such examinations
                  or courses in a place and manner accessible to persons with
                  disabilities or offer alternative accessible arrangements for
                  such individuals."
                </p>
                <p style={{ margin: 0 }}>
                  "(b)(1)(i) The examination is selected and administered so as
                  to best ensure that… the examination results accurately
                  reflect the individual's aptitude or achievement level…
                  rather than reflecting the individual's impaired sensory,
                  manual, or speaking skills."
                </p>
              </>
            }
          >
            <p>
              Title III requires that standardized tests and licensing exams
              provide <strong>appropriate accommodations</strong> so the test
              measures what it's supposed to measure — not the person's
              disability:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Extended time:</strong> Additional time for students
                with learning disabilities, ADHD, or other conditions that
                affect processing speed
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Alternate formats:</strong> Braille, large print, audio,
                or screen reader–compatible versions for people with visual
                disabilities
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible test locations:</strong> The building must
                be physically accessible, with accessible restrooms and parking
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Separate testing rooms:</strong> For students who need
                a reader, scribe, or reduced-distraction environment
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Breaks:</strong> Additional or extended breaks for
                people who need to take medication, use medical equipment, or
                manage fatigue
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="standardized-tests"
            title="Standardized Testing (SAT, GRE, Bar Exam)"
            simpleContent={
              <>
                <p>Big tests like the SAT, GRE, and Bar Exam must also provide accommodations.</p>
                <p>You need to request help ahead of time. You may need to show proof of your disability.</p>
                <p>Testing companies cannot flag your score as "accommodated" if you got extra time.</p>
                <p>If your request is denied, you can file a complaint with the Department of Justice.</p>
              </>
            }
          >
            <p>
              The DOJ has taken <strong>significant enforcement action</strong>
              against standardized testing companies that make it too difficult
              to get accommodations:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { entity: 'College Board (SAT/AP)', issue: 'DOJ reached settlements requiring faster processing of accommodation requests, prohibiting "flagging" scores of students who received accommodations, and simplifying the application process.' },
                { entity: 'ETS (GRE, Praxis)', issue: 'Required to provide accommodations without excessive documentation requirements and to stop requiring separate documentation for each test.' },
                { entity: 'LSAC (LSAT)', issue: 'Consent decree requiring LSAC to streamline its accommodation process and stop requiring more documentation than what schools already accepted.' },
                { entity: 'State bar exams', issue: 'Multiple DOJ actions against state bar associations for denying or delaying accommodations. Bars must accept documentation from treating professionals and process requests promptly.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.entity}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.issue}</p>
                </div>
              ))}
            </div>
            <p>
              <strong>Key principle:</strong> Testing organizations cannot
              require more documentation than is reasonably necessary. If a
              student already has a documented disability and has been receiving
              accommodations at school, the testing entity generally should
              accept that documentation.
            </p>
          </GuideSection>

          <GuideSection
            id="online-learning"
            title="Online Learning Accessibility"
            simpleContent={
              <>
                <p>Online classes and learning tools must also be accessible. This means:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Videos must have captions</li>
                  <li style={{ marginBottom: "6px" }}>Course websites must work with screen readers</li>
                  <li style={{ marginBottom: "6px" }}>Documents must be in accessible formats</li>
                  <li style={{ marginBottom: "6px" }}>Live online classes should have captioning</li>
                </ul>
                <p>This applies to both public and private schools.</p>
              </>
            }
          >
            <p>
              Online courses and learning platforms must be accessible whether
              offered by a public university (Title II) or a private institution
              (Title III):
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Video lectures must be captioned:</strong>
                Auto-generated captions are not sufficient — they must be
                reviewed and corrected for accuracy
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Learning management systems (LMS)</strong> like Canvas,
                Blackboard, and Moodle must be usable with screen readers and
                keyboard navigation
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Documents and slides</strong> posted online must be
                accessible (tagged PDFs, proper heading structures, alt text)
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Live online sessions</strong> must offer real-time
                captioning or sign language interpreters when needed
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Timed online quizzes and exams</strong> must allow
                extended time for students with approved accommodations
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA requirements
                in education. Students' rights also involve IDEA, Section 504,
                and state education laws. For legal advice about your specific
                situation — whether as a student, parent, or institution —
                connect with an experienced disability rights attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}