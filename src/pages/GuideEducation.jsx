import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideEducation() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Education & the ADA"
        typeBadge="Guide"
        badgeColor="#8B1A1A"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="overview"
            title="How the ADA Applies to Education"
          >
            <p>
              Education is covered by the ADA at every level — from
              kindergarten through graduate school. But the ADA isn't the only
              disability law in education. Understanding <strong>which law
              applies</strong> depends on whether the school is public or
              private.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Public schools and universities</strong> are covered by
                <strong> Title II</strong> (state and local government entities)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Private schools and universities</strong> are covered by
                <strong> Title III</strong> (places of public accommodation)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>IDEA</strong> (Individuals with Disabilities Education
                Act) covers special education for K–12 public schools — this is
                separate from the ADA
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Section 504</strong> of the Rehabilitation Act covers
                any school receiving federal funding — which is nearly all of them
              </li>
            </ul>
            <p>
              The ADA's requirements <strong>overlap with but go beyond</strong>
              IDEA and Section 504. A school can comply with IDEA but still
              violate the ADA.
            </p>
          </GuideSection>

          <GuideSection
            id="k12"
            title="Public K–12 Schools (Title II)"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "No qualified individual with a disability shall, on the basis
                  of disability, be excluded from participation in or be denied
                  the benefits of the services, programs, or activities of a
                  public entity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150 — Existing Facilities</strong>
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
              Public school districts are <strong>Title II entities</strong>.
              This means all school programs — not just classroom instruction —
              must be accessible:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Physical access:</strong> School buildings, playgrounds,
                athletic fields, auditoriums, and cafeterias must be accessible
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Extracurricular activities:</strong> Sports, clubs,
                field trips, dances, and graduation ceremonies must include
                students with disabilities
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Effective communication:</strong> Sign language
                interpreters, materials in Braille or large print, and
                captioned videos
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Reasonable modifications:</strong> Changing policies
                when needed — like allowing a student with diabetes to eat in
                class or carry a glucose monitor
              </li>
            </ul>
            <p>
              <strong>How ADA differs from IDEA:</strong> IDEA guarantees a
              "free appropriate public education" with an Individualized
              Education Program (IEP). The ADA goes further — it requires
              <strong> equal access to all programs</strong>, not just academic
              instruction. A student might not qualify for an IEP under IDEA but
              still have rights under the ADA.
            </p>
          </GuideSection>

          <GuideSection
            id="universities"
            title="Public Universities (Title II)"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150 — Program Access</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Public universities must ensure program access across all
                  facilities and services — including dormitories, dining halls,
                  laboratories, libraries, athletic facilities, and student
                  services offices. The program, "when viewed in its entirety,"
                  must be readily accessible.
                </p>
              </>
            }
          >
            <p>
              State universities and community colleges must make <strong>all
              aspects of campus life</strong> accessible:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Classroom access:</strong> Accessible buildings,
                adjustable-height desks, assistive listening systems in lecture
                halls, captioned media
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Housing:</strong> A percentage of dormitory rooms must
                be mobility-accessible and communication-accessible. Students
                must be able to request accessible housing during the standard
                housing selection process.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Dining:</strong> Cafeterias and dining halls must have
                accessible seating, reachable food service areas, and
                accommodations for dietary needs related to disability
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Technology:</strong> Learning management systems
                (Canvas, Blackboard), course websites, and digital textbooks
                must be accessible to screen readers and other assistive
                technology
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="private-schools"
            title="Private Schools & Universities (Title III)"
          >
            <p>
              Private educational institutions that are open to the public are
              <strong> places of public accommodation</strong> under Title III.
              This includes private K–12 schools, colleges, trade schools, and
              test preparation centers.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Must remove <strong>architectural barriers</strong> where
                readily achievable
              </li>
              <li style={{ marginBottom: '8px' }}>
                New construction and alterations must be fully accessible
              </li>
              <li style={{ marginBottom: '8px' }}>
                Must provide <strong>auxiliary aids and services</strong> for
                effective communication
              </li>
              <li style={{ marginBottom: '8px' }}>
                Must make <strong>reasonable modifications</strong> to policies
              </li>
            </ul>
            <p>
              <strong>Exception:</strong> Religious schools operated by
              religious organizations are exempt from Title III. However, if
              they receive federal funding, Section 504 still applies.
            </p>
          </GuideSection>

          <GuideSection
            id="testing"
            title="Testing Accommodations"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.309 — Examinations and Courses</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(a) Any private entity that offers examinations… related to
                  applications, licensing, certification, or credentialing for
                  secondary or postsecondary education, professional, or trade
                  purposes shall offer such examinations… in a place and manner
                  accessible to persons with disabilities or offer alternative
                  accessible arrangements for such individuals."
                </p>
                <p style={{ margin: 0 }}>
                  "(b)(1) …Examinations must… (iii) be administered so as to
                  best ensure that, when the examination is administered to an
                  individual with a disability that impairs sensory, manual, or
                  speaking skills, the examination results accurately reflect the
                  individual's aptitude or achievement level."
                </p>
              </>
            }
          >
            <p>
              The ADA requires that standardized tests and licensing exams
              provide <strong>accommodations</strong> so the test measures a
              person's knowledge — not their disability:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Extended time</strong> for people with learning
                disabilities, ADHD, or conditions that affect processing speed
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Alternate formats:</strong> Large print, Braille,
                screen reader-compatible versions, or a human reader
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Accessible testing locations:</strong> Wheelchair-
                accessible rooms with appropriate furniture
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Separate rooms</strong> to reduce distractions for
                people with certain disabilities
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Sign language interpreters</strong> for spoken
                instructions
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="standardized-tests"
            title="Standardized Tests (SAT, GRE, Bar Exam)"
          >
            <p>
              The DOJ has taken <strong>enforcement action</strong> against
              major testing organizations for failing to provide timely
              accommodations:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                Testing organizations cannot require <strong>excessive
                documentation</strong> that creates barriers to receiving
                accommodations
              </li>
              <li style={{ marginBottom: '10px' }}>
                Accommodation decisions must be made <strong>promptly</strong>
                — not so late that the person misses registration deadlines
              </li>
              <li style={{ marginBottom: '10px' }}>
                Tests cannot <strong>flag</strong> scores as accommodated —
                the DOJ reached a settlement with the Law School Admission
                Council (LSAC) over this practice
              </li>
              <li style={{ marginBottom: '10px' }}>
                The <strong>bar exam</strong> has been a frequent enforcement
                target — multiple state bar associations have entered consent
                decrees over inadequate accommodations
              </li>
            </ul>

            <GuideLegalCallout citation="DOJ Guidance on Testing">
              <p style={{ margin: 0 }}>
                "Testing entities must ensure that their tests do not reflect
                the individual's disability but rather their aptitude,
                achievement, or whatever the test purports to measure. The
                failure to provide testing accommodations in a timely manner
                may itself constitute discrimination."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="online-learning"
            title="Online Learning Accessibility"
          >
            <p>
              Online and hybrid learning must be <strong>fully
              accessible</strong> to students with disabilities:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Learning management systems</strong> (Canvas,
                Blackboard, Moodle) must work with screen readers and keyboard
                navigation
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Video lectures</strong> must have accurate captions —
                auto-generated captions are generally not sufficient
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Course materials</strong> (PDFs, slides, documents)
                must be tagged and readable by assistive technology
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Live virtual classes</strong> must provide captioning,
                sign language interpretation, or other accommodations as needed
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Online exams</strong> must accommodate extended time,
                screen readers, and other testing modifications
              </li>
            </ul>
            <p>
              The DOJ has entered into <strong>multiple settlement
              agreements</strong> with universities over inaccessible online
              learning platforms, course content, and library resources.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA requirements
                in education. Education law also involves IDEA, Section 504,
                and state laws. For legal advice about your specific situation
                — as a student, parent, or institution — connect with an
                experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}