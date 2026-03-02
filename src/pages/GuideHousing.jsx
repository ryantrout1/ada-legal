import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideHousing() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Housing, Apartments & the ADA"
        typeBadge="Title II & III + FHA"
        badgeColor="var(--accent-success)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="which-law"
            title="Which Law Applies?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §3604(f) — Fair Housing Act</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "It shall be unlawful to discriminate in the sale or rental,
                  or to otherwise make unavailable or deny, a dwelling to any
                  buyer or renter because of a handicap of — (A) that buyer or
                  renter, (B) a person residing in or intending to reside in
                  that dwelling after it is so sold, rented, or made available;
                  or (C) any person associated with that buyer or renter."
                </p>
              </>
            }
          >
            <p>
              Housing accessibility is covered by <strong>multiple federal laws</strong>
              {' '}that work together:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Fair Housing Act (FHA):</strong> Applies to nearly <em>all</em>
                {' '}housing — sales and rentals. Covers disability discrimination in
                housing design and reasonable accommodations/modifications.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>ADA Title II:</strong> Applies to state and local government
                housing programs — public housing authorities, housing vouchers, and
                government-operated housing.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>ADA Title III:</strong> Applies to <em>public areas</em> of
                housing complexes — leasing offices, common rooms, parking lots,
                fitness centers — but <strong>not</strong> individual dwelling units.
              </li>
            </ul>
            <p>
              Many housing situations are covered by <strong>both</strong> the FHA
              and the ADA simultaneously. When multiple laws apply, the one providing
              the greatest protection governs.
            </p>
          </GuideSection>

          <GuideSection
            id="fha-design"
            title="The Fair Housing Act — Design Requirements"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>24 CFR §100.205 — Design & Construction</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Covered multifamily dwellings built for first occupancy after
                  March 13, 1991 must include: (1) accessible building entrance on
                  accessible route; (2) accessible common and public use areas;
                  (3) usable doors; (4) accessible route into and through the
                  dwelling unit; (5) accessible environmental controls; (6)
                  reinforced bathroom walls; and (7) usable kitchens and bathrooms.
                </p>
              </>
            }
          >
            <p>
              The FHA requires <strong>accessible design</strong> in multifamily
              housing with <strong>4 or more units</strong> built for first
              occupancy after March 13, 1991.
            </p>
            <p>
              All ground-floor units (and <em>all</em> units in buildings with
              elevators) must meet <strong>seven design requirements</strong>:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                'Accessible building entrance on an accessible route',
                'Accessible common and public use areas',
                'Doors usable by wheelchair users (32" clear width)',
                'Accessible route into and through the dwelling unit',
                'Light switches, outlets, and thermostats in accessible locations',
                'Reinforced bathroom walls for later grab bar installation',
                'Usable kitchens and bathrooms with adequate maneuvering space'
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px', padding: '10px 20px',
                  borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1rem',
                    fontWeight: 700, color: 'var(--accent)', flexShrink: 0, width: '24px'
                  }}>{i + 1}</span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
            <p>
              These are <strong>design requirements</strong> — they apply at
              construction, not as a retrofit obligation. However, failure to
              build to these standards is itself a violation that can be
              enforced years after construction.
            </p>
          </GuideSection>

          <GuideSection
            id="reasonable-accommodations"
            title="Reasonable Accommodations"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §3604(f)(3)(B)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Discrimination includes "a refusal to make reasonable
                  accommodations in rules, policies, practices, or services,
                  when such accommodations may be necessary to afford such
                  person equal opportunity to use and enjoy a dwelling."
                </p>
              </>
            }
          >
            <p>
              Landlords must make <strong>reasonable accommodations</strong> in
              rules, policies, or services for tenants with disabilities.
            </p>
            <p><strong>Common examples include:</strong></p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                Allowing a <strong>service animal or emotional support animal</strong>
                {' '}despite a "no pets" policy
              </li>
              <li style={{ marginBottom: '6px' }}>
                Providing a <strong>reserved accessible parking space</strong>
                {' '}closer to the unit
              </li>
              <li style={{ marginBottom: '6px' }}>
                Allowing <strong>early lease termination</strong> when a disability
                requires relocation
              </li>
              <li style={{ marginBottom: '6px' }}>
                Permitting a <strong>live-in aide</strong> even in "single occupancy"
                units
              </li>
            </ul>

            <GuideLegalCallout citation="Important">
              <p style={{ margin: 0 }}>
                Landlords <strong>cannot charge extra fees or deposits</strong> for
                service animals or emotional support animals. The accommodation must
                be granted unless it would cause an undue financial or administrative
                burden or fundamentally alter the housing program.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="reasonable-modifications"
            title="Reasonable Modifications"
          >
            <p>
              Tenants have the right to make <strong>reasonable physical modifications</strong>
              {' '}to their unit or common areas at their own expense.
            </p>
            <p><strong>Common examples include:</strong></p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>Installing <strong>grab bars</strong> in the bathroom</li>
              <li style={{ marginBottom: '6px' }}>Widening <strong>doorways</strong> for wheelchair access</li>
              <li style={{ marginBottom: '6px' }}>Adding a <strong>ramp</strong> at the entrance</li>
              <li style={{ marginBottom: '6px' }}>Lowering <strong>countertops or cabinets</strong></li>
              <li style={{ marginBottom: '6px' }}>Installing <strong>visual fire alarms</strong></li>
            </ul>
            <p>
              The landlord <strong>cannot refuse</strong> a reasonable modification.
              For <em>private</em> housing, the landlord may require the tenant to
              restore the unit to its original condition at move-out (at the
              tenant's expense). For <strong>federally assisted housing</strong>,
              the housing provider typically pays for modifications.
            </p>
          </GuideSection>

          <GuideSection
            id="public-housing"
            title="Public Housing & Government Programs (ADA Title II)"
          >
            <p>
              Public housing authorities (PHAs) are government entities covered by
              <strong> ADA Title II</strong>. They have additional obligations:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Must provide <strong>program access</strong> — the program as a whole
                must be accessible to people with disabilities
              </li>
              <li style={{ marginBottom: '8px' }}>
                Must make <strong>reasonable modifications</strong> to policies and procedures
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Section 504</strong> of the Rehabilitation Act also applies to
                all federally assisted housing programs
              </li>
              <li style={{ marginBottom: '8px' }}>
                At least <strong>5% of public housing units</strong> must be accessible
                for mobility disabilities, and <strong>2%</strong> for hearing/vision
                disabilities
              </li>
            </ul>

            <GuideLegalCallout citation="Section 504 — Rehabilitation Act">
              <p style={{ margin: 0 }}>
                Section 504 prohibits discrimination on the basis of disability in
                any program or activity receiving federal financial assistance. This
                includes HUD-funded housing, Housing Choice Vouchers (Section 8),
                and all other federally assisted housing programs.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="filing-complaint"
            title="Filing a Housing Complaint"
          >
            <p>
              If you believe you've experienced housing discrimination based on
              disability, you have several options:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { num: '1', title: 'Fair Housing complaints → HUD', desc: 'File with the U.S. Department of Housing and Urban Development within 1 year of the discriminatory act. HUD investigates, attempts conciliation, and can refer cases to the DOJ.' },
                { num: '2', title: 'ADA complaints for government housing → DOJ', desc: 'For state or local government housing programs, file a complaint with the Department of Justice\'s Civil Rights Division.' },
                { num: '3', title: 'Private lawsuits', desc: 'You can file a lawsuit in federal court within 2 years of the discriminatory act. An attorney can help you evaluate the strength of your case.' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '14px', padding: '14px 20px',
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.25rem',
                    fontWeight: 700, color: 'var(--accent)', flexShrink: 0, width: '28px'
                  }}>{item.num}</span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ marginTop: '16px' }}>
              <strong>File a Fair Housing complaint:</strong>{' '}
              <a href="https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent)', fontWeight: 600 }}>
                hud.gov — Online Complaint
              </a>
            </p>
            <p>
              <strong>File an ADA complaint (government housing):</strong>{' '}
              <a href="https://civilrights.justice.gov/" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent)', fontWeight: 600 }}>
                civilrights.justice.gov
              </a>
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about housing rights under
                federal disability law. For advice about your specific situation,
                consult with a fair housing attorney or contact your local fair
                housing agency.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}