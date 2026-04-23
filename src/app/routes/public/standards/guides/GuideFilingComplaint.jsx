import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideFilingComplaint() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="How to File an ADA Complaint"
        typeBadge="Guide"
        badgeColor="var(--accent)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          {/* Section 1 */}
          <GuideSection
            id="who-can-file"
            title="Who Can File a Complaint?"
            simpleContent={
              <>
                <p>Anyone can file an ADA complaint. You do not need a lawyer.</p>
                <p>You can file for yourself. A family member or friend can also file for you.</p>
                <p>You can even file if you saw discrimination happen to someone else.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.170(a)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "Any person who believes that he or she or a specific class of
                  persons has been subjected to discrimination on the basis of
                  disability by a public entity may, by himself or herself or by an
                  authorized representative, file a complaint."
                </p>
              </>
            }
          >
            <p>
              <strong>Anyone</strong> who believes disability discrimination has
              occurred can file a complaint. You don't need a lawyer to file. You
              can file on your own behalf, or someone can file for you — a family
              member, friend, or advocate.
            </p>
            <p>
              You also don't need to be the person who was discriminated against.
              For example, if you witnessed a restaurant refusing to serve someone
              with a guide dog, you could file a complaint about that.
            </p>
          </GuideSection>

          {/* Section 2 */}
          <GuideSection
            id="where-to-file"
            title="Where to File"
            simpleContent={
              <>
                <p>Where you file depends on what happened:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>Job discrimination?</strong> File with the EEOC.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Government building or service?</strong> File with the Department of Justice (DOJ).</li>
                  <li style={{ marginBottom: '6px' }}><strong>Business like a store or restaurant?</strong> File with the DOJ or talk to a lawyer about suing.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Housing?</strong> File with HUD (Department of Housing).</li>
                </ul>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Filing Destinations by Title</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Title I (Employment):</strong> U.S. Equal Employment
                  Opportunity Commission (EEOC) — must file within 180 days
                  (or 300 days in states with anti-discrimination agencies).
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Title II (Government):</strong> U.S. Department of
                  Justice, Civil Rights Division, or the relevant federal agency.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Title III (Businesses):</strong> U.S. Department of
                  Justice via ADA.gov or by mail.
                </p>
              </>
            }
          >
            <p>Where you file depends on the type of discrimination:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Job discrimination</strong> (Title I) — File with the EEOC.
                You must file before you can sue your employer.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Government services</strong> (Title II) — File with the
                Department of Justice (DOJ) or the specific federal agency that
                funds the program.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Businesses and public places</strong> (Title III) — File
                with the DOJ. This includes restaurants, stores, hotels, doctor's
                offices, and theaters.
              </li>
            </ul>
          </GuideSection>

          {/* Section 3: Step by Step */}
          <GuideSection
            id="step-by-step"
            title="DOJ Complaint Process: Step by Step"
            simpleContent={
              <>
                <p>Here is how filing a government complaint works:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>Step 1:</strong> Write down what happened. Include dates and details.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Step 2:</strong> Send your complaint to the DOJ online, by mail, or by fax.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Step 3:</strong> The DOJ reviews it and may send it to the right agency.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Step 4:</strong> The agency looks into it. They may try to work it out or take action.</li>
                </ul>
                <p>This process is free. It usually takes several months.</p>
              </>
            }
          >
            <p>
              Here's what happens when you file a complaint with the Department of
              Justice:
            </p>

            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '20px 0'
            }}>
              {[
                { step: '1', title: 'Gather your information', desc: 'Write down what happened, when it happened, where it happened, and who was involved. Include dates, names, addresses, and any evidence (photos, emails, letters).' },
                { step: '2', title: 'Submit your complaint', desc: 'File online at ADA.gov, by mail to the U.S. DOJ, Disability Rights Section, or by fax. Online is the fastest option.' },
                { step: '3', title: 'DOJ reviews your complaint', desc: 'The DOJ will review your complaint and decide whether to investigate. Not all complaints lead to an investigation — they prioritize cases involving patterns of discrimination or broad public impact.' },
                { step: '4', title: 'Investigation or referral', desc: 'If the DOJ investigates, they may contact you for more details, inspect the location, or reach out to the business/agency. They may also refer your complaint to another federal agency.' },
                { step: '5', title: 'Resolution', desc: 'Possible outcomes include a settlement agreement, mediation, a consent decree, or — in some cases — a federal lawsuit. If the DOJ declines to act, you still have the right to file a private lawsuit.' }
              ].map((s, i) => (
                <div key={s.step} style={{
                  display: 'flex', gap: '16px', padding: '16px 20px',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '0.9rem', fontWeight: 700,
                    color: 'var(--accent)', background: 'var(--card-bg-tinted)',
                    padding: '4px 10px', borderRadius: '6px', flexShrink: 0,
                    minWidth: '28px', textAlign: 'center'
                  }}>{s.step}</span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--heading)' }}>{s.title}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="28 CFR §35.170–35.178">
              <p style={{ margin: 0 }}>
                The DOJ's complaint procedures for Title II are outlined in 28 CFR
                §35.170 through §35.178. For Title III complaints, the DOJ has
                authority under 42 U.S.C. §12188(b) to investigate and bring civil
                actions.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          {/* Section 4: What to Include */}
          <GuideSection
            id="what-to-include"
            title="What to Include in Your Complaint"
            simpleContent={
              <>
                <p>Your complaint should include:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}>Your name and how to reach you.</li>
                  <li style={{ marginBottom: '6px' }}>The name and address of the place that discriminated.</li>
                  <li style={{ marginBottom: '6px' }}>What happened and when it happened.</li>
                  <li style={{ marginBottom: '6px' }}>Photos or documents if you have them.</li>
                </ul>
                <p>Write it in your own words. It does not have to be perfect.</p>
              </>
            }
          >
            <p>A strong complaint includes:</p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Your name and contact information</strong> (the DOJ will
                keep it confidential if you ask)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>The name and location</strong> of the business, agency, or
                organization that discriminated
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>A description of what happened</strong> — be specific about
                dates, barriers, and what you were denied access to
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>How your disability was affected</strong> — what you couldn't
                do because of the barrier
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Any evidence</strong> — photos, correspondence, or names of
                witnesses
              </li>
            </ul>
            <p>
              For example: <em>"On January 15, 2025, I visited ABC Restaurant at
              123 Main St, Phoenix, AZ. The only entrance had three steps and no
              ramp. I use a wheelchair and could not enter the building. I asked
              the manager for help and was told there was no other way in."</em>
            </p>
          </GuideSection>

          {/* Section 5: Timeline and Deadlines */}
          <GuideSection
            id="timeline"
            title="Timeline and Deadlines"
            simpleContent={
              <>
                <p>There are time limits for filing. Act quickly:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>Job complaints (EEOC):</strong> You have 180 days. Some states give you 300 days.</li>
                  <li style={{ marginBottom: '6px' }}><strong>DOJ complaints:</strong> File within 180 days. They may still accept it later.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Lawsuits:</strong> There is no set federal deadline for ADA lawsuits, but do not wait. State deadlines vary.</li>
                </ul>
                <p>The sooner you act, the stronger your case.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Statute of Limitations</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Title I (EEOC):</strong> 180 days from the discriminatory
                  act (300 days in states with fair employment agencies).
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Title II (DOJ):</strong> 180 days from the discriminatory
                  act (28 CFR §35.170(b)). Agencies may extend for good cause.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Title III (Private lawsuit):</strong> Varies by state;
                  no specific federal statute of limitations. State personal injury
                  or civil rights statutes typically apply (1–6 years).
                </p>
              </>
            }
          >
            <p>
              <strong>File as soon as possible.</strong> For Title I (employment)
              complaints, you have either 180 or 300 days, depending on your state.
              For Title II (government), the DOJ deadline is 180 days from the
              incident, though extensions are sometimes granted.
            </p>
            <p>
              For Title III (businesses), there's no single federal deadline, but
              waiting too long can hurt your case. State statutes of limitations
              vary, so it's best to act quickly.
            </p>
            <p>
              After filing, the DOJ process can take months or even years. You don't
              need to wait for the DOJ to resolve your complaint before filing a
              private lawsuit.
            </p>
          </GuideSection>

          {/* Section 6: File Online */}
          <GuideSection
            id="file-online"
            title="File Your DOJ Complaint Online"
            simpleContent={
              <>
                <p>You can file your complaint online at ADA.gov. It is free.</p>
                <p>You can also report a violation right here on ADA Legal Link. We will connect you with an attorney who can help you decide the best next step.</p>
              </>
            }
          >
            <p>
              The fastest way to file is through the DOJ's online form:
            </p>
            <p style={{ margin: '16px 0' }}>
              <a
                href="https://www.ada.gov/file-a-complaint/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'var(--accent)', color: 'var(--page-bg)',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
                  padding: '12px 24px', borderRadius: '10px',
                  textDecoration: 'none', minHeight: '44px'
                }}
              >
                File on ADA.gov →
              </a>
            </p>
            <p>
              You can also file by mail: <br />
              U.S. Department of Justice<br />
              Civil Rights Division<br />
              Disability Rights Section — 1425 NYA<br />
              950 Pennsylvania Avenue, N.W.<br />
              Washington, D.C. 20530
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide is for informational purposes only. Filing a DOJ complaint
                does not create an attorney-client relationship. For advice about your
                specific situation, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
