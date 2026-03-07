import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import GuideReadingLevelBar from '../components/guide/GuideReadingLevelBar';

const COMPARISON_ROWS = [
  { label: 'File with', titleI: 'EEOC', titleII: 'DOJ', titleIII: 'DOJ or Court', fha: 'HUD or Court' },
  { label: 'Deadline', titleI: '180/300 days', titleII: '180 days', titleIII: 'No federal deadline', fha: '1 year (HUD) / 2 years (court)' },
  { label: 'Must file before suing?', titleI: 'Yes — EEOC required', titleII: 'No', titleIII: 'No', fha: 'No' },
  { label: 'Money damages?', titleI: 'Yes (capped)', titleII: 'Yes', titleIII: 'Federal: No / State: Often yes', fha: 'Yes' },
  { label: "Attorney's fees?", titleI: 'Yes', titleII: 'Yes', titleIII: 'Yes', fha: 'Yes' },
  { label: 'Contingency available?', titleI: 'Often', titleII: 'Sometimes', titleIII: 'Usually', fha: 'Often' },
];

function ComparisonTable() {
  const headers = ['', 'Title I (Employment)', 'Title II (Government)', 'Title III (Businesses)', 'Fair Housing'];
  const keys = ['label', 'titleI', 'titleII', 'titleIII', 'fha'];

  return (
    <div style={{ overflowX: 'auto', margin: '16px 0', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ minWidth: '680px' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          background: 'var(--dark-bg)', borderRadius: '12px 12px 0 0', overflow: 'hidden'
        }}>
          {headers.map((h, i) => (
            <div key={i} style={{
              padding: '12px 14px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: i === 0 ? 'transparent' : 'white',
              letterSpacing: '0.02em'
            }}>{h}</div>
          ))}
        </div>
        {/* Rows */}
        {COMPARISON_ROWS.map((row, ri) => (
          <div key={ri} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            background: ri % 2 === 0 ? 'var(--page-bg-subtle)' : 'white',
            borderRadius: ri === COMPARISON_ROWS.length - 1 ? '0 0 12px 12px' : undefined,
            overflow: 'hidden'
          }}>
            {keys.map((k, ci) => (
              <div key={ci} style={{
                padding: '10px 14px',
                fontFamily: 'Manrope, sans-serif',
                fontSize: ci === 0 ? '0.8rem' : '0.8rem',
                fontWeight: ci === 0 ? 700 : 500,
                color: ci === 0 ? 'var(--heading)' : 'var(--body)',
                lineHeight: 1.5,
                borderRight: ci < keys.length - 1 ? '1px solid var(--border)' : 'none'
              }}>{row[k]}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GuideLegalOptions() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Your Legal Options After an ADA Violation"
        typeBadge="Know Your Rights"
        badgeColor="var(--accent)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="complaint-vs-lawsuit"
            title="Filing a Government Complaint Is Not the Same as Getting a Lawyer"
            simpleContent={
              <>
                <p>There are two different ways to take action after an ADA violation:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>Government complaint:</strong> You ask the government to look into it. This is free but slow.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Private lawsuit:</strong> A lawyer files a case for you. This can get faster results and may force changes.</li>
                </ul>
                <p>You can do both at the same time. They are separate paths.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Key Distinction</strong></p>
                <p style={{ margin: 0 }}>
                  A DOJ complaint asks the government to investigate and potentially
                  enforce the law. A private lawsuit allows YOU to seek injunctive
                  relief and attorney's fees directly. Most ADA enforcement happens
                  through private lawsuits — not government action.
                </p>
              </>
            }
          >
            <p>
              When you experience an ADA violation, you have two fundamentally
              different paths. Most people only know about one of them.
            </p>
            <p>
              <strong>Path 1: File a complaint with a government agency.</strong>{' '}
              The agency investigates and may take action — but they represent the
              public interest, not you personally. You don't get an attorney. You
              typically don't get compensation. The process can take months or
              years. The agency may decide not to pursue your case at all.
            </p>
            <p>
              <strong>Path 2: Work with a private attorney.</strong> An ADA attorney
              can send a demand letter, negotiate directly with the business, or
              file a lawsuit on your behalf. Under Title III, the prevailing party
              can recover attorney's fees — which means many ADA attorneys take
              cases on contingency (no upfront cost to you). This is how most ADA
              violations actually get fixed.
            </p>
            <p>
              These paths are <strong>not mutually exclusive</strong>. You can file
              a government complaint AND hire an attorney. But understanding the
              difference matters because many people file a DOJ complaint, wait
              months, and never realize they could have had an attorney working on
              their case the entire time.
            </p>
          </GuideSection>

          <GuideSection
            id="title-i-eeoc"
            title="Title I — Employment Discrimination (EEOC)"
            simpleContent={
              <>
                <p>If your employer treated you unfairly because of a disability, you can file with the EEOC.</p>
                <p>You must file within 180 days (300 days in some states).</p>
                <p>The EEOC will look into it. If they find a problem, they may help you settle or give you the right to sue.</p>
                <p>You may be able to get your job back, back pay, or money for damages.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>42 U.S.C. §12117(a)</strong></p>
                <p style={{ margin: '0 0 12px' }}>
                  "The powers, remedies, and procedures set forth in sections 2000e-4,
                  2000e-5, 2000e-6, 2000e-8, and 2000e-9 of this title shall be the
                  powers, remedies, and procedures this subchapter provides."
                </p>
                <p style={{ margin: 0 }}>
                  This means Title I follows the same enforcement framework as
                  Title VII of the Civil Rights Act — which requires filing with the
                  EEOC before suing.
                </p>
              </>
            }
          >
            <p>
              <strong>What it covers:</strong> Employers with 15+ employees. Hiring,
              firing, promotions, pay, reasonable accommodations, and all terms of
              employment.
            </p>
            <p>
              <strong>Where to file:</strong> Equal Employment Opportunity Commission
              (EEOC) —{' '}
              <a href="https://www.eeoc.gov/filing-charge-discrimination"
                 target="_blank" rel="noopener noreferrer"
                 style={{ color: 'var(--accent)', fontWeight: 600 }}>
                eeoc.gov/filing-charge-discrimination
              </a>
            </p>
            <p>
              <strong>Deadline:</strong> 180 days from the discriminatory act.
              Extended to <strong>300 days</strong> if your state has its own
              anti-discrimination agency (most states do).
            </p>
            <GuideLegalCallout citation="Critical Point">
              <p style={{ margin: 0 }}>
                You <strong>MUST</strong> file with the EEOC before you can file a
                lawsuit. This is not optional. The EEOC will investigate and attempt
                mediation. If they don't resolve it, they issue a "right to sue"
                letter — and then you have <strong>90 days</strong> to file in
                federal court.
              </p>
            </GuideLegalCallout>
            <p>
              <strong>What you can recover:</strong> Back pay, reinstatement,
              compensatory damages (emotional distress), punitive damages (capped
              based on employer size: $50,000–$300,000), and attorney's fees.
            </p>
            <p>
              <strong>ADA Legal Link can help:</strong> If you've experienced job
              discrimination, report it through our intake form. We'll connect you
              with an employment attorney who handles Title I cases — often on
              contingency.
            </p>
          </GuideSection>

          <GuideSection
            id="title-ii-doj"
            title="Title II — Government Services (DOJ)"
            simpleContent={
              <>
                <p>If a government building or service was not accessible, you can file with the DOJ.</p>
                <p>This covers things like courthouses, public buses, schools, voting places, and government websites.</p>
                <p>You can also sue the government directly. You may be able to get money damages under Title II.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>28 CFR §35.170(a)</strong></p>
                <p style={{ margin: '0 0 12px' }}>
                  "Any person who believes that he or she or a specific class of
                  persons has been subjected to discrimination on the basis of
                  disability by a public entity may, by himself or herself or by an
                  authorized representative, file a complaint."
                </p>
                <p style={{ margin: 0 }}>
                  Deadline: within 180 days of the discrimination (extensions may be
                  granted for good cause).
                </p>
              </>
            }
          >
            <p>
              <strong>What it covers:</strong> All state and local government
              services, programs, and activities — public schools, courts, voting,
              public transit, parks, sidewalks, public housing, government websites.
            </p>
            <p>
              <strong>Where to file:</strong> U.S. Department of Justice, Civil
              Rights Division —{' '}
              <a href="https://civilrights.justice.gov/"
                 target="_blank" rel="noopener noreferrer"
                 style={{ color: 'var(--accent)', fontWeight: 600 }}>
                civilrights.justice.gov
              </a>
            </p>
            <p>
              <strong>What happens:</strong> The DOJ reviews your complaint, may
              investigate, and can enter into settlement agreements with the
              government entity. The DOJ can also refer complaints to other federal
              agencies with relevant jurisdiction (e.g., Department of Education for
              school issues, Department of Transportation for transit).
            </p>
            <p>
              <strong>Private lawsuit option:</strong> Unlike Title I, you do{' '}
              <strong>NOT</strong> need to file a government complaint before suing.
              You can go directly to court. Title II allows compensatory damages and
              attorney's fees. Some circuits also allow punitive damages.
            </p>
            <p>
              <strong>Key advantage of private action:</strong> Government complaints
              can take years. A private attorney can often achieve faster results
              through demand letters and direct negotiation with the government
              entity.
            </p>
          </GuideSection>

          <GuideSection
            id="title-iii-businesses"
            title="Title III — Businesses & Public Accommodations (DOJ or Private Lawsuit)"
            simpleContent={
              <>
                <p>If a business like a store, restaurant, or hotel was not accessible, you have options.</p>
                <p>You can file a complaint with the DOJ. You can also have a lawyer sue the business.</p>
                <p>Under federal law, a lawsuit can force the business to fix the problem. In many states, you can also get money.</p>
                <p>The business usually has to pay your lawyer if you win. This is called fee shifting.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>42 U.S.C. §12188(a)(1)</strong></p>
                <p style={{ margin: '0 0 12px' }}>
                  "The remedies and procedures set forth in section 2000a-3(a) of
                  this title are the remedies and procedures this subchapter provides
                  to any person who is being subjected to discrimination on the basis
                  of disability in violation of this subchapter."
                </p>
                <p style={{ margin: 0 }}>
                  This means federal Title III lawsuits provide{' '}
                  <strong>INJUNCTIVE RELIEF</strong> (forcing the business to fix the
                  problem) and <strong>ATTORNEY'S FEES</strong> — but NOT monetary
                  damages at the federal level.
                </p>
              </>
            }
          >
            <p>
              <strong>What it covers:</strong> Businesses open to the public
              (restaurants, hotels, stores, doctors' offices, theaters, gyms, gas
              stations, websites), plus commercial facilities.
            </p>
            <p>
              <strong>Where to file complaint:</strong> DOJ —{' '}
              <a href="https://civilrights.justice.gov/"
                 target="_blank" rel="noopener noreferrer"
                 style={{ color: 'var(--accent)', fontWeight: 600 }}>
                civilrights.justice.gov
              </a>{' '}
              — but the DOJ generally only takes "pattern or practice" cases, not
              individual disputes.
            </p>
            <p>
              <strong>Private lawsuit — the primary enforcement tool:</strong> You
              do NOT need to file a DOJ complaint first. You can go directly to
              federal court. Most ADA Title III enforcement happens through private
              lawsuits, not DOJ action.
            </p>
            <p><strong>What you can recover at the federal level:</strong></p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>Injunctive relief:</strong> A court order requiring the
                business to fix the barrier
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Attorney's fees:</strong> The court can order the business
                to pay your lawyer
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>No monetary damages at the federal level</strong> — this
                surprises many people
              </li>
            </ul>
            <GuideLegalCallout citation="State Law Changes Everything">
              <p style={{ margin: 0 }}>
                Many states allow monetary damages on top of federal remedies.
                California's <strong>Unruh Civil Rights Act</strong> provides a
                minimum of <strong>$4,000 per violation</strong>. New York and other
                states have their own damage provisions. This is why state matters —
                and why an attorney who knows your state's laws is critical.
              </p>
            </GuideLegalCallout>
            <p>
              <strong>Why attorneys take these cases:</strong> Because attorney's
              fees are recoverable, many ADA attorneys take Title III cases on
              contingency. The business pays your lawyer's fees as part of the
              resolution. This means you typically pay nothing out of pocket.
            </p>
          </GuideSection>

          <GuideSection
            id="fair-housing"
            title="Fair Housing (HUD)"
            simpleContent={
              <>
                <p>If you had a housing problem because of your disability, you can file with HUD.</p>
                <p>This covers apartments, houses, and landlords.</p>
                <p>The Fair Housing Act also protects emotional support animals, which the ADA does not.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §3610(a)(1)(A)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  Complaints must be filed "not later than one year after an alleged
                  discriminatory housing practice has occurred."
                </p>
                <p style={{ margin: 0 }}>
                  HUD investigates, attempts conciliation, and can refer to DOJ for
                  pattern/practice cases. HUD also refers cases to state or local
                  fair housing agencies.
                </p>
              </>
            }
          >
            <p>
              <strong>What it covers:</strong> Discrimination in housing — renting,
              buying, mortgage lending, and the design/construction of multifamily
              housing. Covers service animals, emotional support animals, reasonable
              modifications, and accessible design.
            </p>
            <p>
              <strong>Where to file:</strong> HUD Office of Fair Housing —{' '}
              <a href="https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint"
                 target="_blank" rel="noopener noreferrer"
                 style={{ color: 'var(--accent)', fontWeight: 600 }}>
                hud.gov — online complaint
              </a>
            </p>
            <p>
              <strong>Deadline:</strong> Within <strong>1 year</strong> of the
              discriminatory act.
            </p>
            <p>
              <strong>Private lawsuit option:</strong> You can file in federal court
              within <strong>2 years</strong>, without filing with HUD first.
              Remedies include actual damages, punitive damages, and attorney's fees.
            </p>
            <GuideLegalCallout citation="Important Distinction">
              <p style={{ margin: 0 }}>
                The Fair Housing Act is <strong>NOT</strong> part of the ADA — it's
                a separate law. But many housing situations are covered by both. If
                your issue involves a government housing program, ADA Title II also
                applies. An attorney can help determine which law gives you the
                strongest case.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="comparison"
            title="Quick Comparison: Your Filing Options"
            simpleContent={
              <>
                <p>Here is a quick look at your choices:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}><strong>EEOC (jobs):</strong> 180-300 day deadline. Can get money and job back.</li>
                  <li style={{ marginBottom: '6px' }}><strong>DOJ (government/business):</strong> 180 day suggested deadline. Government investigates.</li>
                  <li style={{ marginBottom: '6px' }}><strong>Private lawsuit (business):</strong> No set federal deadline. Lawyer files for you. Business pays lawyer fees if you win.</li>
                  <li style={{ marginBottom: '6px' }}><strong>HUD (housing):</strong> 1 year deadline. Covers landlord and housing issues.</li>
                </ul>
              </>
            }
          >
            <ComparisonTable />
          </GuideSection>

          <GuideSection
            id="which-path"
            title="Which Path Is Right for You?"
            simpleContent={
              <>
                <p>Not sure what to do? Here is a simple guide:</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '8px 0' }}>
                  <li style={{ marginBottom: '6px' }}>If you want the problem fixed fast, talk to a lawyer.</li>
                  <li style={{ marginBottom: '6px' }}>If you want the government to handle it, file a complaint.</li>
                  <li style={{ marginBottom: '6px' }}>If you are not sure, report it here on ADA Legal Link and we will help you decide.</li>
                </ul>
              </>
            }
          >
            <p>
              If you're unsure which path to take, here's a simple starting point:
            </p>

            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                {
                  scenario: '"I was denied a job or fired because of my disability"',
                  action: 'File with the EEOC within 180 days AND talk to an employment attorney.'
                },
                {
                  scenario: '"A government building, program, or website is inaccessible"',
                  action: 'File a DOJ complaint AND/OR contact an ADA attorney who handles Title II cases.'
                },
                {
                  scenario: '"A business, store, restaurant, hotel, or website has barriers"',
                  action: 'Contact an ADA attorney directly. This is the fastest path to resolution. You can also file a DOJ complaint, but most individual cases are resolved through private legal action.'
                },
                {
                  scenario: '"My landlord won\'t allow my service animal or make modifications"',
                  action: 'File with HUD AND/OR contact a fair housing attorney.'
                },
                {
                  scenario: 'Not sure?',
                  action: "Report it through our intake form. We'll review the details and connect you with an attorney who handles your type of case."
                }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', gap: '14px', alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.1rem',
                    fontWeight: 700, color: 'var(--accent)', flexShrink: 0, width: '24px',
                    marginTop: '2px'
                  }}>→</span>
                  <div>
                    <p style={{
                      margin: '0 0 4px', fontWeight: 700,
                      color: 'var(--heading)', fontStyle: i < 4 ? 'italic' : 'normal'
                    }}>{item.scenario}</p>
                    <p style={{
                      margin: 0, fontSize: '0.9rem',
                      color: 'var(--body)', lineHeight: 1.7
                    }}>{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}