import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideTitleI() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Title I: Employment"
        typeBadge="Overview"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="scope"
            title="Who Title I Covers"
            simpleContent={
              <>
                <p>Title I covers jobs and hiring. If you have a disability and can do the job, employers cannot treat you differently.</p>
                <p>This applies to businesses with 15 or more employees.</p>
                <p>It covers hiring, firing, pay, promotions, training, and all other parts of employment.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Covered Employers</strong></p>
                <p style={{ margin: '0 0 12px' }}>
                  Title I applies to private employers with 15 or more employees, state and local government employers, employment agencies, and labor organizations. The employee count includes part-time workers and is measured over the current or preceding calendar year.
                </p>
                <GuideLegalCallout>
                  42 U.S.C. §12111(5) — "The term 'employer' means a person engaged in an industry affecting commerce who has 15 or more employees for each working day in each of 20 or more calendar weeks in the current or preceding calendar year."
                </GuideLegalCallout>
              </>
            }
          >
            <p>Title I of the ADA prohibits employment discrimination against qualified individuals with disabilities. It covers all aspects of the employment relationship — from job postings and interviews through promotions, benefits, and termination.</p>
            <p>A "qualified individual" is someone who can perform the <strong>essential functions</strong> of the job, with or without reasonable accommodation. The employer defines essential functions, but the determination is based on the actual duties, not the job title.</p>
          </GuideSection>

          <GuideSection
            id="reasonable-accommodation"
            title="Reasonable Accommodation"
            simpleContent={
              <>
                <p>If you need something changed at work because of your disability, your employer must try to help.</p>
                <p>This could be a different desk, a screen reader, flexible hours, or a quieter workspace.</p>
                <p>The employer does not have to do something that would be very expensive or completely change the business.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>The Interactive Process</strong></p>
                <p style={{ margin: '0 0 12px' }}>
                  Employers must engage in an "interactive process" with the employee to identify effective accommodations. Failure to engage in this process — even if no accommodation is ultimately provided — can itself be a violation. The employer bears the burden of proving undue hardship.
                </p>
                <GuideLegalCallout>
                  42 U.S.C. §12112(b)(5)(A) — Discrimination includes "not making reasonable accommodations to the known physical or mental limitations of an otherwise qualified individual with a disability who is an applicant or employee, unless such covered entity can demonstrate that the accommodation would impose an undue hardship."
                </GuideLegalCallout>
              </>
            }
          >
            <p>Reasonable accommodation is any modification or adjustment to the job, work environment, or hiring process that enables a qualified individual with a disability to perform essential job functions or enjoy equal employment benefits.</p>
            <p>Common examples include modified work schedules, assistive technology, job restructuring, reassignment to a vacant position, accessible parking, and allowing a service animal in the workplace. The accommodation must be effective but does not have to be the employee's preferred accommodation.</p>
            <p>An employer can deny an accommodation only if it would cause <strong>undue hardship</strong> — significant difficulty or expense relative to the employer's size and financial resources.</p>
          </GuideSection>

          <GuideSection
            id="hiring"
            title="Hiring & Interviews"
            simpleContent={
              <>
                <p>An employer cannot ask about your disability during a job interview.</p>
                <p>They can ask if you can do the job and how you would do it.</p>
                <p>A medical exam can only happen after they offer you the job — and only if everyone gets the same exam.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Pre-Employment Inquiries</strong></p>
                <p style={{ margin: 0 }}>
                  Before a conditional job offer, employers may not ask about disability, medical history, or workers' compensation claims. They may ask about the ability to perform specific job functions. Post-offer, medical exams are permitted if required of all entering employees in the same job category. Information must be kept confidential in separate medical files.
                </p>
              </>
            }
          >
            <p>The ADA creates a three-stage framework for medical inquiries. <strong>Before a job offer:</strong> no disability-related questions or medical exams. <strong>After a conditional offer:</strong> medical exams are allowed if required of all entering employees. <strong>During employment:</strong> medical inquiries only if job-related and consistent with business necessity.</p>
            <p>Employers may not use qualification standards, employment tests, or selection criteria that screen out people with disabilities unless the criteria are job-related and consistent with business necessity.</p>
          </GuideSection>

          <GuideSection
            id="enforcement"
            title="Filing a Complaint"
            simpleContent={
              <>
                <p>If your employer breaks these rules, you file a complaint with the EEOC (Equal Employment Opportunity Commission).</p>
                <p>You usually have 180 days from when the problem happened. In some states, you get 300 days.</p>
                <p>The EEOC investigates for free. If they find a problem, they try to fix it. If not, they give you permission to sue.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Administrative Exhaustion Requirement</strong></p>
                <p style={{ margin: 0 }}>
                  Unlike Title III, Title I requires exhaustion of administrative remedies before filing a lawsuit. An EEOC charge must be filed within 180 days (or 300 days in states with a fair employment practices agency). The EEOC investigates, attempts conciliation, and either files suit or issues a "right to sue" letter. The individual then has 90 days to file in federal court.
                </p>
              </>
            }
          >
            <p>Title I complaints go through the <strong>EEOC</strong>, not the DOJ. The process begins with filing a Charge of Discrimination. The EEOC will investigate, and may attempt mediation or conciliation. Remedies can include back pay, front pay, compensatory and punitive damages (capped based on employer size), reinstatement, and reasonable accommodation.</p>
            <p>Damages caps: 15–100 employees = $50,000; 101–200 = $100,000; 201–500 = $200,000; 501+ = $300,000.</p>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
