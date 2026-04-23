import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideIntroToAda() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Introduction to the ADA"
        typeBadge="Overview"
        badgeColor="var(--accent)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          {/* Section 1: What Is the ADA */}
          <GuideSection
            id="what-is-ada"
            title="What Is the ADA?"
            simpleContent={
              <>
                <p>The ADA is a law that protects people with disabilities.</p>
                <p>It says businesses and the government must treat people with disabilities fairly.</p>
                <p>This includes things like jobs, buses, restaurants, and websites.</p>
                <p>The law was signed in 1990. It was updated in 2008 to protect more people.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12101(b)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "It is the purpose of this chapter — (1) to provide a clear and
                  comprehensive national mandate for the elimination of discrimination
                  against individuals with disabilities; (2) to provide clear, strong,
                  consistent, enforceable standards addressing discrimination against
                  individuals with disabilities."
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>
                  Source: Americans with Disabilities Act of 1990, as amended
                </p>
              </>
            }
          >
            <p>
              The <strong>Americans with Disabilities Act (ADA)</strong> is a federal
              civil rights law signed on July 26, 1990. It makes it illegal to
              discriminate against people with disabilities in everyday activities —
              things like getting a job, riding the bus, going to a restaurant, or
              using a government website.
            </p>
            <p>
              Think of the ADA like other civil rights laws that protect people based
              on race, sex, or religion — but for disability. Before the ADA, a
              business could refuse to serve someone in a wheelchair, or a city could
              build a courthouse with no way for a deaf person to communicate with a
              clerk. The ADA changed that.
            </p>
            <p>
              The law was updated in 2008 through the <strong>ADA Amendments Act
              (ADAAA)</strong>, which made the definition of "disability" broader so
              that more people are protected.
            </p>
          </GuideSection>

          {/* Section 2: Who Is Protected */}
          <GuideSection
            id="who-protected"
            title="Who Is Protected?"
            simpleContent={
              <>
                <p>You are protected if you have a disability that makes daily life harder.</p>
                <p>This includes trouble walking, seeing, hearing, breathing, or learning.</p>
                <p>You are also protected if you had a disability in the past, like cancer that went away.</p>
                <p>You are even protected if someone thinks you have a disability, even if you do not.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12102 — Definition of Disability</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  The term "disability" means, with respect to an individual:
                </p>
                <p style={{ margin: '0 0 6px', paddingLeft: '12px' }}>
                  (A) a physical or mental impairment that substantially limits one
                  or more major life activities of such individual;
                </p>
                <p style={{ margin: '0 0 6px', paddingLeft: '12px' }}>
                  (B) a record of such an impairment; or
                </p>
                <p style={{ margin: '0 0 12px', paddingLeft: '12px' }}>
                  (C) being regarded as having such an impairment.
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>
                  As amended by the ADA Amendments Act of 2008 (P.L. 110-325)
                </p>
              </>
            }
          >
            <p>
              The ADA protects people who have a <strong>disability</strong> — defined
              as a physical or mental condition that significantly limits one or more
              <strong> major life activities</strong>. This includes activities like
              walking, seeing, hearing, breathing, learning, working, and caring for
              yourself.
            </p>
            <p>You're also protected if you:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>Have a record</strong> of a disability (for example, a history
                of cancer that's now in remission)
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Are regarded as</strong> having a disability, even if you
                don't — for example, if an employer refuses to hire you because they
                think you have a disability
              </li>
            </ul>
            <p>
              Common examples include mobility impairments, blindness, deafness,
              intellectual disabilities, chronic illnesses like diabetes or epilepsy,
              and mental health conditions like PTSD or depression.
            </p>
          </GuideSection>

          {/* Section 3: The Five Titles */}
          <GuideSection
            id="five-titles"
            title="The Five Titles of the ADA"
            simpleContent={
              <>
                <p>The ADA has five parts. Each part covers a different area of life:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>Title I — Jobs.</strong> Employers cannot treat you unfairly because of a disability.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Title II — Government.</strong> Government buildings and services must be accessible.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Title III — Businesses.</strong> Stores, restaurants, hotels, and doctors must let everyone in.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Title IV — Phone services.</strong> Phone companies must help people who are deaf or hard of hearing.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Title V — Other rules.</strong> You cannot be punished for using your ADA rights.</li>
                </ul>
              </>
            }
          >
            <p>The ADA is divided into five sections called <strong>titles</strong>,
            each covering a different area of life:</p>

            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '20px 0'
            }}>
              {[
                { num: 'I', name: 'Employment', agency: 'EEOC', desc: 'Employers with 15+ employees cannot discriminate in hiring, firing, promotions, or job conditions. Must provide reasonable accommodations.' },
                { num: 'II', name: 'State & Local Government', agency: 'DOJ', desc: 'All programs, services, and activities of state/local governments must be accessible — courthouses, public transit, schools, voting, websites.' },
                { num: 'III', name: 'Public Accommodations', agency: 'DOJ', desc: 'Private businesses open to the public — restaurants, stores, hotels, theaters, doctors\' offices — must remove barriers and provide equal access.' },
                { num: 'IV', name: 'Telecommunications', agency: 'FCC', desc: 'Telephone companies must provide relay services for callers who are deaf, hard of hearing, or have speech disabilities.' },
                { num: 'V', name: 'Miscellaneous', agency: 'Various', desc: 'Anti-retaliation protections, relationship to other laws, insurance rules, and other technical provisions.' }
              ].map((t, i) => (
                <div key={t.num} style={{
                  display: 'flex', gap: '16px', padding: '16px 20px',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '0.9rem', fontWeight: 700,
                    color: 'var(--accent)', background: 'var(--card-bg-tinted)',
                    padding: '4px 10px', borderRadius: '6px', flexShrink: 0,
                    minWidth: '36px', textAlign: 'center'
                  }}>{t.num}</span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--heading)' }}>
                      {t.name} <span style={{ fontSize: '0.8rem', color: 'var(--body-secondary)', fontWeight: 400 }}>
                        — Enforced by {t.agency}
                      </span>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="42 U.S.C. §12101–12213">
              <p style={{ margin: 0 }}>
                The full text of the ADA is codified in Title 42 of the United States
                Code, Sections 12101 through 12213. The implementing regulations are
                found at 28 CFR Part 35 (Title II) and 28 CFR Part 36 (Title III),
                and 29 CFR Part 1630 (Title I).
              </p>
            </GuideLegalCallout>
          </GuideSection>

          {/* Section 4: Enforcement */}
          <GuideSection
            id="enforcement"
            title="How the ADA Is Enforced"
            simpleContent={
              <>
                <p>If someone breaks the ADA, you can take action.</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>Job problems?</strong> File a complaint with the EEOC within 180 days.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Government or business problems?</strong> File a complaint with the Department of Justice. You can also sue.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Lawsuits against businesses</strong> can force them to fix the problem. Some states also let you get money.</li>
                </ul>
                <p>Many states have their own laws that give you even more protection.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Enforcement Agencies</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Title I:</strong> U.S. Equal Employment Opportunity
                  Commission (EEOC) — 29 CFR Part 1630
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Title II:</strong> U.S. Department of Justice, Civil Rights
                  Division — 28 CFR Part 35
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Title III:</strong> U.S. Department of Justice — 28 CFR
                  Part 36. Private lawsuits for injunctive relief.
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Title IV:</strong> Federal Communications Commission (FCC)
                  — 47 CFR Part 64
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--body-secondary)' }}>
                  Source: ADA.gov enforcement overview
                </p>
              </>
            }
          >
            <p>
              The ADA is enforced by several federal agencies, depending on which title
              applies:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Employment (Title I):</strong> File a charge with the EEOC
                within 180 days (or 300 days in some states) of the discrimination.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Government services (Title II) and public accommodations
                (Title III):</strong> File a complaint with the Department of Justice
                (DOJ). You can also file a private lawsuit.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Private lawsuits:</strong> Under Title III, individuals can
                sue businesses directly — but can only get the court to order changes
                (injunctive relief), not money damages. Under Title II, money damages
                may be available.
              </li>
            </ul>
            <p>
              The DOJ can also investigate patterns of discrimination and bring its own
              cases. Many states have their own disability rights laws that may provide
              additional protections or remedies.
            </p>
          </GuideSection>

          {/* Section 5: Related Laws */}
          <GuideSection
            id="related-laws"
            title="Related Laws You Should Know"
            simpleContent={
              <>
                <p>The ADA is not the only law that helps people with disabilities. Here are others:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>Section 504</strong> — Protects you at places that get government money, like schools.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Fair Housing Act</strong> — Protects you from unfair treatment in housing. Covers emotional support animals too.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Air Carrier Access Act</strong> — Covers your rights on airplanes.</li>
                  <li style={{ marginBottom: '6px' }}><strong>State laws</strong> — Many states have stronger protections than the federal ADA.</li>
                </ul>
              </>
            }
          >
            <p>
              The ADA isn't the only law protecting people with disabilities. These
              other laws work alongside it:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Section 504 of the Rehabilitation Act (1973):</strong> The
                predecessor to the ADA. Applies to any organization that receives
                federal funding. Similar protections, but narrower scope.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Fair Housing Act (FHA):</strong> Prohibits disability
                discrimination in housing. Covers emotional support animals (which
                the ADA does not).
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Air Carrier Access Act (ACAA):</strong> Covers accessibility
                on commercial airlines — a gap the ADA doesn't fill.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>State disability rights laws:</strong> Many states have
                broader protections. For example, California's Unruh Civil Rights Act
                includes damages provisions not available under federal ADA Title III.
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide is for informational purposes only and does not constitute
                legal advice. If you believe your rights have been violated, consider
                connecting with an ADA attorney who can evaluate your specific situation.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
