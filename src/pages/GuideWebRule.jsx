import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import GuideReadingLevelBar from '../components/guide/GuideReadingLevelBar';

export default function GuideWebRule() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Title II Web & Mobile App Accessibility Rule"
        typeBadge="New Rule"
        badgeColor="var(--link)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="what-the-rule-requires"
            title="What the Rule Requires"
            simpleContent={
              <>
                <p>The government made a new rule: all state and local government websites must follow WCAG 2.1 Level AA.</p>
                <p>This means government websites must work with screen readers, keyboards, and other tools people with disabilities use.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.200 — Requirements</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity shall ensure that the web content and mobile
                  applications of the public entity comply with Level A and Level
                  AA success criteria and conformance requirements specified in
                  WCAG 2.1."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>89 FR 31320 (April 24, 2024)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  The Department of Justice published the final rule on
                  "Nondiscrimination on the Basis of Disability; Accessibility of
                  Web Information and Services of State and Local Government
                  Entities" establishing specific technical standards for web and
                  mobile app accessibility under Title II of the ADA.
                </p>
              </>
            }
          >
            <p>
              In April 2024, the Department of Justice published a <strong>new
              rule</strong> that, for the first time, sets a specific technical
              standard for government websites and mobile apps.
            </p>
            <p>
              The rule says: all <strong>state and local government</strong>
              websites and mobile apps must meet <strong>WCAG 2.1 Level AA
              </strong> — a widely recognized set of technical guidelines for
              making digital content accessible to people with disabilities.
            </p>
            <p>
              This covers everything a government entity puts online:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Government websites and web applications</li>
              <li style={{ marginBottom: '8px' }}>Mobile apps (iOS, Android)</li>
              <li style={{ marginBottom: '8px' }}>Online forms and documents</li>
              <li style={{ marginBottom: '8px' }}>Online payment systems</li>
              <li style={{ marginBottom: '8px' }}>Interactive maps and tools</li>
              <li style={{ marginBottom: '8px' }}>Video and multimedia content</li>
            </ul>
          </GuideSection>

          <GuideSection
            id="who-it-applies-to"
            title="Who It Applies To"
            simpleContent={
              <>
                <p>This rule applies to state and local governments. This includes:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>City and county websites.</li>
                  <li style={{ marginBottom: "6px" }}>Public school and university websites.</li>
                  <li style={{ marginBottom: "6px" }}>State agency websites.</li>
                  <li style={{ marginBottom: "6px" }}>Public library websites.</li>
                </ul>
              </>
            }
          >
            <p>
              This rule applies to <strong>Title II entities</strong> — that
              means state and local governments and all their departments,
              agencies, and programs. This includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>State government</strong> agencies, departments, and offices
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>County and city</strong> governments
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Public school districts</strong> and state universities
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Public transit agencies</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Public libraries,</strong> courts, parks departments, and
                public hospitals
              </li>
              <li style={{ marginBottom: '8px' }}>
                Any other <strong>instrumentality</strong> of a state or local
                government
              </li>
            </ul>
            <p>
              <strong>Important:</strong> This specific rule does <em>not</em>
              apply to private businesses (Title III entities) — although private
              businesses have their own ADA obligations regarding digital access.
              Courts have increasingly held that Title III covers private
              business websites as well.
            </p>
          </GuideSection>

          <GuideSection
            id="deadlines"
            title="Compliance Deadlines"
            simpleContent={
              <>
                <p>Governments must make their websites accessible by a deadline:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}><strong>Large governments</strong> (50,000+ people): April 2026.</li>
                  <li style={{ marginBottom: "6px" }}><strong>Small governments</strong> (under 50,000): April 2027.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.200(b) — Compliance Date</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(1) For public entities with a total population of 50,000 or
                  more — April 24, 2026."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(2) For public entities with a total population of less than
                  50,000 — April 24, 2027."
                </p>
                <p style={{ margin: 0 }}>
                  For entities that are not defined by population (e.g., state
                  agencies that serve the entire state), the 2026 deadline
                  generally applies.
                </p>
              </>
            }
          >
            <p>
              The rule has <strong>two deadlines</strong>, based on the
              population served:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { entity: 'Entities serving 50,000+ people', deadline: 'April 24, 2026', note: 'Large cities, counties, state agencies, universities' },
                { entity: 'Entities serving under 50,000 people', deadline: 'April 24, 2027', note: 'Small towns, rural counties, small special districts' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.95rem' }}>{row.entity}</span>
                    <span style={{
                      background: '#FEF3C7', color: 'var(--section-label)', padding: '2px 10px',
                      borderRadius: '100px', fontSize: '0.8125rem', fontWeight: 600
                    }}>{row.deadline}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--body-secondary)' }}>{row.note}</p>
                </div>
              ))}
            </div>
            <p>
              These are <strong>hard deadlines</strong> — by the compliance date,
              the entity's web content and mobile apps must fully conform to
              WCAG 2.1 Level AA. There is no phase-in period beyond the deadline
              itself.
            </p>
          </GuideSection>

          <GuideSection
            id="exceptions"
            title="What's Excepted?"
            simpleContent={
              <>
                <p>A few things are not covered by this rule:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}>
                  <li style={{ marginBottom: "6px" }}>Archived content that is not being updated.</li>
                  <li style={{ marginBottom: "6px" }}>Content posted by the public (like comments).</li>
                  <li style={{ marginBottom: "6px" }}>Content from other organizations that is linked but not controlled.</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.202 — Exceptions</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  The following content is excepted from the WCAG 2.1 conformance
                  requirement:
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  "(1) Archived web content" — content maintained exclusively
                  for reference, research, or recordkeeping, not used for current
                  services, and stored in a dedicated area clearly identified as
                  archived.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  "(2) Content posted by a third party" — content not posted by
                  or under the control of the public entity.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  "(3) Preexisting conventional electronic documents" — unless
                  an individual with a disability requests such a document.
                </p>
                <p style={{ margin: 0 }}>
                  "(4) Preexisting social media posts."
                </p>
              </>
            }
          >
            <p>
              The rule includes several <strong>narrow exceptions</strong>.
              Content in these categories does not need to meet WCAG 2.1:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Archived content:</strong> Old content kept only for
                research or recordkeeping — not content you still link to from
                your main site or use for current services. It must be in a
                clearly labeled archive area.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Third-party content:</strong> Content posted by members
                of the public (like comments on a government social media post)
                that the government doesn't control.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Preexisting conventional electronic documents:</strong>
                PDFs, Word docs, and similar files posted <em>before</em> the
                compliance date — <strong>unless</strong> someone with a disability
                requests them, in which case you must make them accessible.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Preexisting social media posts:</strong> Posts made
                before the compliance date on platforms the government doesn't
                fully control.
              </li>
            </ul>
            <p>
              <strong>Important:</strong> These exceptions are <em>narrow</em>.
              Any new document, post, or content published after the compliance
              date must meet the standard.
            </p>
          </GuideSection>

          <GuideSection
            id="conforming-alternate"
            title="Conforming Alternate Versions"
            simpleContent={
              <>
                <p>A government can offer an alternative accessible version of content instead of fixing the original.</p>
                <p>But the accessible version must be just as easy to find and use as the original.</p>
                <p>It cannot be hidden or harder to get to.</p>
              </>
            }
          >
            <p>
              In some cases, a government entity may provide a <strong>conforming
              alternate version</strong> of web content instead of making the
              original fully accessible. This means:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                The alternate version meets WCAG 2.1 Level AA
              </li>
              <li style={{ marginBottom: '8px' }}>
                It provides the <strong>same information and functionality</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                It is kept <strong>up to date</strong> with the original version
              </li>
              <li style={{ marginBottom: '8px' }}>
                There is an accessible way to <strong>find and reach</strong> the
                alternate version from the non-conforming page
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.201">
              <p style={{ margin: 0 }}>
                "A public entity may meet the requirements of §35.200 by providing
                a conforming alternate version of the web content, but only if the
                conforming alternate version provides the same information and
                the same level of functionality, is updated as often as the
                nonconforming content, and can be reached from the nonconforming
                web content through an accessible mechanism."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="other-obligations"
            title="Other Obligations Still Apply"
            simpleContent={
              <>
                <p>This new rule adds to existing obligations. Governments already had to make their services accessible under Title II of the ADA.</p>
                <p>Even before this rule, people could file complaints about inaccessible government websites.</p>
              </>
            }
          >
            <p>
              Meeting WCAG 2.1 Level AA is the <strong>technical floor</strong>,
              not the ceiling. Even with full WCAG compliance, government entities
              still must:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Provide effective communication</strong> — if a person
                with a disability needs information in a specific format (Braille,
                large print, plain language), the entity must provide it
                regardless of WCAG conformance.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Make reasonable modifications</strong> — if a policy or
                procedure makes digital content inaccessible in a particular
                situation, the entity must modify it.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Ensure program access</strong> — the broader Title II
                obligation that all government programs, services, and activities
                be accessible to people with disabilities.
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about the Title II web
                accessibility rule. The rule is complex and its application may
                vary based on the entity's size, resources, and specific
                circumstances. For legal advice about your entity's obligations or
                your rights under this rule, connect with an experienced ADA
                attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}