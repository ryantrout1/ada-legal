import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideEmployment() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Employment & the ADA (Title I)"
        typeBadge="Title I"
        badgeColor="#15803D"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="who-covered"
            title="Who Is Covered"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12112(a) — General Rule</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "No covered entity shall discriminate against a qualified
                  individual on the basis of disability in regard to job
                  application procedures, the hiring, advancement, or discharge
                  of employees, employee compensation, job training, and other
                  terms, conditions, and privileges of employment."
                </p>
              </>
            }
          >
            <p>
              <strong>Title I of the ADA</strong> applies to employers with
              <strong> 15 or more employees</strong>, including state and local
              governments, employment agencies, and labor organizations.
            </p>
            <p>
              It protects <strong>"qualified individuals with disabilities"</strong>
              — people who can perform the <em>essential functions</em> of the job
              with or without reasonable accommodation.
            </p>
            <p>
              Title I covers <strong>all aspects of employment</strong>: hiring,
              firing, promotions, pay, training, benefits, and all other terms
              and conditions of employment. From the moment you apply for a job
              to the day you leave, ADA protections apply.
            </p>
          </GuideSection>

          <GuideSection
            id="reasonable-accommodation"
            title="What Is a Reasonable Accommodation?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12111(9) — Definition</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The term 'reasonable accommodation' may include — (A) making
                  existing facilities used by employees readily accessible to and
                  usable by individuals with disabilities; and (B) job
                  restructuring, part-time or modified work schedules, reassignment
                  to a vacant position, acquisition or modification of equipment or
                  devices, appropriate adjustment or modifications of examinations,
                  training materials or policies, the provision of qualified readers
                  or interpreters, and other similar accommodations."
                </p>
              </>
            }
          >
            <p>
              A reasonable accommodation is a <strong>modification or adjustment</strong>
              {' '}to the job application process, work environment, or the way a job
              is performed that enables a person with a disability to have equal
              employment opportunities.
            </p>
            <p><strong>Common examples include:</strong></p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Modified work schedules or flexible hours</li>
              <li style={{ marginBottom: '6px' }}>Reassignment to a vacant position</li>
              <li style={{ marginBottom: '6px' }}>Accessible office furniture or ergonomic equipment</li>
              <li style={{ marginBottom: '6px' }}>Screen readers or other assistive technology</li>
              <li style={{ marginBottom: '6px' }}>Sign language interpreters for meetings</li>
              <li style={{ marginBottom: '6px' }}>Telework or remote work arrangements</li>
              <li style={{ marginBottom: '6px' }}>Modified training materials or testing formats</li>
            </ul>

            <GuideLegalCallout citation="42 U.S.C. §12112(b)(5)(A)">
              <p style={{ margin: 0 }}>
                Employers are <strong>not required</strong> to provide an
                accommodation that would cause <strong>"undue hardship"</strong>
                — significant difficulty or expense relative to the employer's
                size, financial resources, and the nature of its operations.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="interactive-process"
            title="The Interactive Process"
          >
            <p>
              The accommodation process is a <strong>collaborative dialogue</strong>
              {' '}between the employee and employer. Here's how it typically works:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { num: '1', title: 'Employee makes a request', desc: 'The employee discloses their disability and explains what they need. They do not need to use the word "accommodation" — any request for help due to a medical condition can trigger the process.' },
                { num: '2', title: 'Employer engages in dialogue', desc: 'The employer must engage in a good-faith conversation to understand the disability, how it limits job performance, and what accommodations might be effective.' },
                { num: '3', title: 'Medical documentation (if needed)', desc: 'If the disability or need for accommodation is not obvious, the employer may request medical documentation. They cannot demand full medical records — only information relevant to the accommodation.' },
                { num: '4', title: 'Employer identifies options', desc: 'The employer chooses among effective accommodations. They do not have to provide the employee\'s preferred option, but they must provide one that is effective in enabling the employee to perform essential job functions.' }
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
            id="employer-prohibitions"
            title="What Employers Cannot Do"
          >
            <p>
              Title I includes <strong>specific prohibitions</strong> on employer
              conduct. Employers cannot:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Ask about disabilities before a job offer</strong> — pre-offer
                inquiries about medical conditions, disability status, or workers'
                compensation history are prohibited.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Require medical exams before a conditional offer</strong> —
                post-offer medical exams are permitted only if required for <em>all</em>
                {' '}employees in the same job category.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Retaliate against employees</strong> who request an accommodation,
                file a complaint, or participate in an investigation.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Use qualification standards that screen out people with
                disabilities</strong> unless those standards are job-related and
                consistent with business necessity.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Refuse to hire a qualified candidate</strong> because of the
                cost of providing a reasonable accommodation.
              </li>
            </ul>

            <GuideLegalCallout citation="Important">
              <p style={{ margin: 0 }}>
                These protections apply throughout the entire employment
                relationship — from the application process through termination
                and post-employment references.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="filing-complaint"
            title="Filing a Title I Complaint"
          >
            <p>
              Employment discrimination complaints under the ADA are filed with the
              <strong> Equal Employment Opportunity Commission (EEOC)</strong>, not the
              Department of Justice.
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { num: '1', title: 'File a charge with the EEOC', desc: 'You must file within 180 days of the discriminatory act. If your state or local agency enforces a similar anti-discrimination law, the deadline extends to 300 days.' },
                { num: '2', title: 'EEOC investigation', desc: 'The EEOC will investigate your charge and may attempt mediation between you and your employer. Mediation is voluntary and confidential.' },
                { num: '3', title: 'Resolution or right to sue', desc: 'If the EEOC cannot resolve your complaint, it will issue a "right to sue" letter. This gives you 90 days to file a lawsuit in federal court.' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '14px', padding: '14px 20px',
                  borderBottom: i < 2 ? '1px solid var(--slate-200)' : 'none',
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

            <p style={{ marginTop: '16px' }}>
              You can file a charge online, by mail, or in person at any EEOC field office.
              Visit{' '}
              <a href="https://www.eeoc.gov/filing-charge-discrimination" target="_blank" rel="noopener noreferrer"
                style={{ color: '#C2410C', fontWeight: 600 }}>
                eeoc.gov/filing-charge-discrimination
              </a>{' '}
              for detailed instructions.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA employment
                protections. For advice about your specific situation, consult
                with an employment attorney experienced in disability
                discrimination law.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}