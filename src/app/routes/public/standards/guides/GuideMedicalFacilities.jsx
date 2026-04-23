import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideMedicalFacilities() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Medical Facility Accessibility"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="overview"
            title="Why Medical Accessibility Matters"
            simpleContent={
              <><p>Doctors offices, hospitals, and clinics must be accessible to people with disabilities.</p><p>This is one of the most important areas of the ADA. If you cannot get into the building or onto the exam table, you cannot get healthcare.</p></>
            }
          >
            <p>
              People with disabilities need healthcare like everyone else — often
              more frequently. Yet medical facilities are among the most
              <strong> commonly reported</strong> sources of ADA violations. The
              Department of Justice has made enforcement in healthcare a priority.
            </p>
            <p>
              Both <strong>Title II</strong> (public hospitals and government
              health programs) and <strong>Title III</strong> (private doctors'
              offices, clinics, and hospitals) require full accessibility. This
              means physical access, accessible equipment, and effective
              communication.
            </p>
          </GuideSection>

          <GuideSection
            id="exam-rooms"
            title="Accessible Examination Rooms"
            simpleContent={
              <><p>Medical exam rooms must be accessible. This means:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Doors wide enough for wheelchairs (at least 32 inches)</li><li style={{ marginBottom: "6px" }}>Enough space to move around in the room</li><li style={{ marginBottom: "6px" }}>Exam tables that can lower down for wheelchair transfers</li><li style={{ marginBottom: "6px" }}>Accessible weight scales</li></ul></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §223.2.1</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "In licensed medical care facilities and licensed long-term care
                  facilities where the period of stay exceeds twenty-four hours, at
                  least 10 percent, but no fewer than one, of each type of patient
                  or resident sleeping room shall provide mobility features
                  complying with 805."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.302 — Reasonable Modification</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Medical providers must "make reasonable modifications in policies,
                  practices, or procedures when such modifications are necessary to
                  afford goods, services, facilities, privileges, advantages, or
                  accommodations to individuals with disabilities." This includes
                  providing accessible medical equipment.
                </p>
              </>
            }
          >
            <p>
              Examination rooms must be physically accessible to patients who use
              wheelchairs or other mobility devices:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Adjustable-height exam tables:</strong> Standard fixed-height
                tables (typically 32+ inches) are too high for many wheelchair users
                to transfer onto safely. The DOJ has emphasized that providing
                <strong> height-adjustable exam tables</strong> is a reasonable
                modification.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Transfer surfaces:</strong> The table should lower to
                approximately <strong>17–19 inches</strong> (wheelchair seat
                height) to allow independent or minimally assisted transfer
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Clear floor space:</strong> Enough room beside the exam
                table for a wheelchair to pull alongside — at least 30 × 48 inches
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Accessible route:</strong> The path from the waiting room
                to the exam room must be wheelchair-accessible — no steps, narrow
                hallways, or heavy doors
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="equipment"
            title="Accessible Medical Equipment"
            simpleContent={
              <><p>Medical equipment must be usable by people with disabilities:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Height-adjustable exam tables</li><li style={{ marginBottom: "6px" }}>Wheelchair-accessible weight scales</li><li style={{ marginBottom: "6px" }}>Accessible mammography and x-ray equipment</li></ul><p>Staff must be trained to help patients transfer safely.</p></>
            }
          >
            <p>
              Beyond exam tables, other <strong>medical equipment</strong> must
              also be accessible or alternative methods must be provided:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { title: 'Weight scales', desc: 'Wheelchair-accessible scales that allow a person to be weighed in their wheelchair (then subtract the chair weight) or roll-on platform scales. Standard standing scales are inaccessible to many patients.' },
                { title: 'Imaging equipment', desc: 'X-ray tables, MRI machines, and mammography equipment that can accommodate wheelchair users or people who cannot stand. Adjustable-height tables and open MRI machines improve access.' },
                { title: 'Dental chairs', desc: 'Dental offices should provide wheelchair-accessible treatment, either through transfer-capable dental chairs or the ability to treat a patient in their own wheelchair.' },
                { title: 'Blood draw chairs', desc: 'Phlebotomy stations should have at least one accessible chair or the ability to draw blood while the patient remains in their wheelchair.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--heading)' }}>
                    {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="DOJ/HHS Joint Guidance (2010)">
              <p style={{ margin: 0 }}>
                "Providing accessible medical equipment, including accessible
                examination tables and chairs, accessible weight scales, and
                accessible mammography equipment, is an important means of
                providing full and equal access to medical care for individuals
                with disabilities."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="communication"
            title="Effective Communication in Healthcare"
            simpleContent={
              <><p>Medical offices must communicate effectively with patients who have disabilities:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Sign language interpreters for deaf patients</li><li style={{ marginBottom: "6px" }}>Large print or Braille materials for blind patients</li><li style={{ marginBottom: "6px" }}>Simple language for patients with learning disabilities</li></ul><p>The medical office pays for these services, not the patient.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.303 — Auxiliary Aids and Services</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public accommodation shall take those steps that may be
                  necessary to ensure that no individual with a disability is
                  excluded, denied services, segregated or otherwise treated
                  differently than other individuals because of the absence of
                  auxiliary aids and services."
                </p>
                <p style={{ margin: 0 }}>
                  "The type of auxiliary aid or service necessary to ensure
                  effective communication will vary in accordance with the method
                  of communication used by the individual; the nature, length, and
                  complexity of the communication involved; and the context in
                  which the communication is taking place."
                </p>
              </>
            }
          >
            <p>
              Medical information is complex and high-stakes. Effective
              communication is <strong>critical</strong> in healthcare settings:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Deaf and hard of hearing patients:</strong> Qualified sign
                language interpreters are generally required for appointments
                involving diagnosis, treatment options, procedures, and consent
                forms. Video Remote Interpreting (VRI) may be used if the
                technology works reliably. Written notes may be sufficient for
                simple, brief interactions like scheduling.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Blind and low-vision patients:</strong> Medical records,
                consent forms, discharge instructions, and prescriptions must be
                provided in <strong>accessible formats</strong> — large print,
                electronic text, Braille, or read aloud by qualified staff.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Cognitive disabilities:</strong> Information should be
                presented in <strong>plain language</strong> and, when needed,
                with visual aids or simplified materials.
              </li>
            </ul>
            <p>
              The provider — not the patient — bears the <strong>cost of
              auxiliary aids</strong>. A doctor's office cannot charge a deaf
              patient for an interpreter, and cannot ask the patient's family
              member to interpret.
            </p>
          </GuideSection>

          <GuideSection
            id="scoping"
            title="Scoping for Medical Care Facilities"
            simpleContent={
              <><p>When building or remodeling a medical facility, a certain number of exam rooms must be accessible.</p><p>The number depends on the size of the facility. At least one exam room on each floor should be accessible.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>2010 ADA Standards §223.2.1</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  For facilities where stays exceed 24 hours: "at least 10 percent,
                  but no fewer than one, of each type of patient or resident sleeping
                  room shall provide mobility features."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§223.2.2</strong>
                </p>
                <p style={{ margin: 0 }}>
                  For facilities specializing in treating conditions affecting
                  mobility: "100 percent of the patient sleeping rooms shall provide
                  mobility features."
                </p>
              </>
            }
          >
            <p>
              The number of accessible patient rooms in medical care facilities
              depends on the type of facility:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { type: 'General hospitals (stays >24 hours)', requirement: '10% of each type, minimum 1' },
                { type: 'Rehabilitation hospitals / mobility specialty', requirement: '100% of patient rooms' },
                { type: 'Outpatient facilities', requirement: 'All patient areas on accessible route' },
                { type: 'Outpatient medical facility parking', requirement: '20% of spaces accessible (§208.2.1)' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.type}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem', textAlign: 'right' }}>{row.requirement}</span>
                </div>
              ))}
            </div>
            <p>
              Note the special parking rule: outpatient medical facilities must
              provide <strong>20% accessible parking</strong> — much higher than
              the standard scoping — because a high proportion of patients have
              mobility impairments.
            </p>
          </GuideSection>

          <GuideSection
            id="enforcement"
            title="DOJ Enforcement in Healthcare"
            simpleContent={
              <><p>The Department of Justice has taken action against medical facilities that are not accessible.</p><p>If you cannot access medical care because of your disability, you can file a complaint with the DOJ or file a lawsuit.</p></>
            }
          >
            <p>
              The Department of Justice has been <strong>actively
              enforcing</strong> ADA requirements against medical providers. Recent
              enforcement actions have targeted:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Lack of accessible exam tables:</strong> Multiple
                settlement agreements have required medical practices to purchase
                height-adjustable exam tables and train staff on their use
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Failure to provide interpreters:</strong> Hospitals and
                clinics that rely on family members or untrained bilingual staff
                instead of qualified interpreters have faced enforcement action
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Inaccessible medical equipment:</strong> DOJ has required
                facilities to acquire wheelchair-accessible scales, adjustable
                imaging tables, and accessible dental chairs
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Website and telehealth inaccessibility:</strong> Medical
                providers whose patient portals and telehealth platforms are not
                accessible to screen readers have been cited
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA requirements for
                medical facilities. Healthcare accessibility involves both federal
                ADA requirements and Section 504 of the Rehabilitation Act (for
                facilities receiving federal funds). For legal advice about your
                specific situation — as a patient or provider — connect with an
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
