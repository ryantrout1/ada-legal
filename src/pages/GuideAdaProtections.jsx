import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideAdaProtections() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Who the ADA Protects"
        typeBadge="Overview"
        badgeColor="var(--accent)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="three-prong"
            title="The Three-Part Definition of Disability"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12102(1) — Definition</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  The term "disability" means, with respect to an individual:
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (A) a physical or mental impairment that substantially limits one
                  or more major life activities of such individual;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (B) a record of such an impairment; or
                </p>
                <p style={{ margin: '0 0 12px', paddingLeft: '12px' }}>
                  (C) being regarded as having such an impairment (as described in
                  paragraph (3)).
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>
                  As amended by the ADA Amendments Act of 2008 (P.L. 110-325)
                </p>
              </>
            }
          >
            <p>
              The ADA protects people who meet any one of <strong>three
              definitions</strong> of disability:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Actual disability:</strong> You have a physical or mental
                condition that <strong>substantially limits</strong> one or more
                major life activities. This is the most straightforward — you
                currently have a disability that affects your daily life.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Record of a disability:</strong> You have a <strong>history
                </strong> of a disability, even if you no longer have it. For
                example, someone who had cancer that is now in remission, or a
                person with a past psychiatric hospitalization.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Regarded as having a disability:</strong> Someone treats
                you as if you have a disability, <strong>whether you actually do
                or not</strong>. For example, if an employer fires you because they
                mistakenly believe you have HIV, you're protected even if you don't.
              </li>
            </ol>
          </GuideSection>

          <GuideSection
            id="major-life-activities"
            title="What Are Major Life Activities?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12102(2) — Major Life Activities</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  (A) Major life activities include, but are not limited to: caring
                  for oneself, performing manual tasks, seeing, hearing, eating,
                  sleeping, walking, standing, lifting, bending, speaking,
                  breathing, learning, reading, concentrating, thinking,
                  communicating, and working.
                </p>
                <p style={{ margin: 0 }}>
                  (B) A major life activity also includes the operation of a major
                  bodily function, including but not limited to: functions of the
                  immune system, normal cell growth, digestive, bowel, bladder,
                  neurological, brain, respiratory, circulatory, endocrine, and
                  reproductive functions.
                </p>
              </>
            }
          >
            <p>
              <strong>Major life activities</strong> are the basic things people
              do every day. The ADA provides a broad (but not exhaustive) list:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '4px' }}>Seeing, hearing, speaking</li>
              <li style={{ marginBottom: '4px' }}>Walking, standing, lifting, bending</li>
              <li style={{ marginBottom: '4px' }}>Eating, sleeping, breathing</li>
              <li style={{ marginBottom: '4px' }}>Learning, reading, concentrating, thinking</li>
              <li style={{ marginBottom: '4px' }}>Caring for yourself, working, communicating</li>
            </ul>
            <p>
              The law also includes <strong>major bodily functions</strong> — things
              like immune system function, normal cell growth, digestion, bladder
              and bowel function, brain and neurological function, and circulation.
              This means conditions like diabetes, epilepsy, HIV, Crohn's disease,
              and many others clearly qualify.
            </p>
          </GuideSection>

          <GuideSection
            id="substantially-limits"
            title="What Does 'Substantially Limits' Mean?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.108(d)(1) / §36.105(d)(1)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "The term 'substantially limits' shall be construed broadly in
                  favor of expansive coverage… An impairment is a disability…
                  if it substantially limits the ability of an individual to
                  perform a major life activity as compared to most people in the
                  general population."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§35.108(d)(1)(v)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The comparison of an individual's performance of a major life
                  activity to the performance of the same major life activity by
                  most people in the general population usually will not require
                  scientific, medical, or statistical analysis."
                </p>
              </>
            }
          >
            <p>
              Before 2008, courts sometimes set a very high bar for "substantially
              limits" — requiring people to prove their disability was severe and
              permanent. The <strong>ADA Amendments Act (ADAAA) of 2008</strong>
              changed that.
            </p>
            <p>
              Now, the standard is <strong>much lower and broader</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                The term must be interpreted <strong>in favor of broad
                coverage</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                You don't need scientific or medical evidence to prove you're
                limited compared to "most people"
              </li>
              <li style={{ marginBottom: '8px' }}>
                A condition doesn't have to be <strong>severe</strong> — it just
                needs to be more than minor
              </li>
              <li style={{ marginBottom: '8px' }}>
                The focus should be on whether discrimination occurred, not on
                whether the person's condition qualifies
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="episodic"
            title="Episodic Conditions and Remission"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12102(4)(D)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "An impairment that is episodic or in remission is a disability
                  if it would substantially limit a major life activity when active."
                </p>
              </>
            }
          >
            <p>
              Many disabilities are not constant — they come and go. The ADAAA
              made clear that <strong>episodic conditions</strong> and conditions
              <strong> in remission</strong> are still disabilities under the ADA
              if they would substantially limit a major life activity when active.
            </p>
            <p>Examples:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Epilepsy:</strong> A person may go weeks or months without
                a seizure, but is still protected because seizures substantially
                limit neurological function when they occur.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Cancer in remission:</strong> Even if treatment was
                successful, a history of cancer that affected major bodily functions
                qualifies.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Major depression:</strong> Episodic by nature — periods of
                significant impairment qualify even between episodes.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Multiple sclerosis:</strong> Symptoms may flare and recede,
                but the condition is always protected.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="regarded-as"
            title="The 'Regarded As' Prong"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12102(3)(A)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "An individual meets the requirement of 'being regarded as
                  having such an impairment' if the individual establishes that
                  he or she has been subjected to an action prohibited under this
                  chapter because of an actual or perceived physical or mental
                  impairment whether or not the impairment limits or is perceived
                  to limit a major life activity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>§12102(3)(B) — Exception</strong>
                </p>
                <p style={{ margin: 0 }}>
                  This prong does not apply to impairments that are "transitory
                  and minor" (actual duration or expected duration of 6 months or
                  less).
                </p>
              </>
            }
          >
            <p>
              The "regarded as" prong is powerful. It protects you even when you
              <strong> don't actually have a disability</strong> — as long as
              someone discriminated against you because they <em>thought</em> you
              did.
            </p>
            <p>Examples:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                A restaurant refuses to seat you because the staff thinks your
                facial scarring is "disturbing to other customers"
              </li>
              <li style={{ marginBottom: '8px' }}>
                An employer fires you after learning you take medication, assuming
                you must have a serious mental health condition
              </li>
              <li style={{ marginBottom: '8px' }}>
                A gym refuses a membership to someone because they walk with a
                limp, assuming they'd be a "safety risk"
              </li>
            </ul>
            <p>
              The only exception: if the impairment is both <strong>transitory
              (lasting 6 months or less) and minor</strong>, the "regarded as"
              prong does not apply. A broken arm, for example, would not qualify
              under this prong.
            </p>
          </GuideSection>

          <GuideSection
            id="not-covered"
            title="Who Is Not Covered?"
          >
            <p>
              A few situations are <strong>specifically excluded</strong> from
              ADA protection:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Current illegal drug use:</strong> People currently using
                illegal drugs are not protected under the ADA. However, people who
                have <strong>completed</strong> or are <strong>currently
                participating in</strong> a supervised drug rehabilitation program
                and are no longer using drugs <em>are</em> protected.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Compulsive gambling, kleptomania, pyromania:</strong>
                Specifically excluded from the definition of disability.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Sexual behavior disorders:</strong> Certain conditions are
                specifically excluded by the statute.
              </li>
            </ul>
            <p>
              <strong>Alcoholism</strong> is treated differently — it is generally
              considered a disability under the ADA, but an employer can hold
              an employee with alcoholism to the same performance and conduct
              standards as other employees.
            </p>
          </GuideSection>

          <GuideSection
            id="related-laws"
            title="Relationship to Other Laws"
          >
            <p>
              The ADA's definition of disability works alongside other federal
              laws. Understanding how they overlap is important:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Section 504 of the Rehabilitation Act:</strong> Uses the
                same three-prong definition. Applies to any entity receiving
                federal funds. Often the two laws apply to the same situation.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Fair Housing Act (FHA):</strong> Has its own disability
                definition, which is similar but not identical. The FHA covers
                housing discrimination and includes emotional support animals,
                which the ADA does not.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>State disability rights laws:</strong> Many states have
                their own definitions that are broader than the federal ADA. For
                example, California's Fair Employment and Housing Act explicitly
                rejects the "substantially limits" requirement and covers a wider
                range of conditions.
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about who the ADA protects.
                Whether a specific condition qualifies as a disability under the ADA
                depends on the individual circumstances. For legal advice about your
                situation, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}