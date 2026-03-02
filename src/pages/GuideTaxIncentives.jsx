import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideTaxIncentives() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="ADA Tax Incentives for Businesses"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="overview"
            title="Two Federal Tax Incentives"
          >
            <p>
              The federal government offers <strong>two tax incentives</strong> to
              help businesses pay for ADA accessibility improvements. Many business
              owners don't know these exist — but they can significantly reduce the
              cost of making your business accessible.
            </p>
            <p>
              The two programs are:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Disabled Access Credit (Section 44):</strong> A tax credit
                of up to $5,000 per year for small businesses
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Barrier Removal Deduction (Section 190):</strong> A tax
                deduction of up to $15,000 per year for any business
              </li>
            </ul>
            <p>
              You can use <strong>both incentives in the same tax year</strong>,
              which means a qualifying small business could receive up to $20,000
              in combined tax benefits annually for accessibility improvements.
            </p>
          </GuideSection>

          <GuideSection
            id="section-44"
            title="Section 44: Disabled Access Credit"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Internal Revenue Code §44</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "An eligible small business for any taxable year may elect to
                  claim an amount equal to 50 percent of so much of the eligible
                  access expenditures for the taxable year as exceed $250 but do
                  not exceed $10,250."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Eligible Small Business Defined</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The term 'eligible small business' means any person if either
                  (A) the gross receipts of such person for the preceding taxable
                  year did not exceed $1,000,000, or (B) such person employed not
                  more than 30 full-time employees during the preceding taxable
                  year."
                </p>
              </>
            }
          >
            <p>
              The Disabled Access Credit is a <strong>tax credit</strong> — meaning
              it directly reduces the taxes you owe, dollar for dollar. It's worth
              more than a deduction of the same amount.
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { label: 'Maximum credit', value: '$5,000 per year' },
                { label: 'How it works', value: '50% of eligible costs between $250 and $10,250' },
                { label: 'Who qualifies', value: 'Businesses with ≤30 full-time employees OR ≤$1 million gross receipts' },
                { label: 'IRS form', value: 'Form 8826 — Disabled Access Credit' },
                { label: 'Can carry forward', value: 'Yes, unused credit can be carried forward' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.label}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <p>
              <strong>Example:</strong> A small restaurant spends $6,250 on
              installing a ramp and accessible restroom fixtures. The eligible
              amount is $6,250 − $250 = $6,000. The credit is 50% of $6,000 =
              <strong> $3,000 off their tax bill</strong>.
            </p>
          </GuideSection>

          <GuideSection
            id="section-190"
            title="Section 190: Barrier Removal Deduction"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>Internal Revenue Code §190</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A taxpayer may elect to treat qualified architectural and
                  transportation barrier removal expenses which are paid or incurred
                  by him during the taxable year as expenses which are not
                  chargeable to capital account. The expenditures so treated shall
                  be allowed as a deduction."
                </p>
                <p style={{ margin: 0 }}>
                  The maximum deduction is $15,000 per taxable year for qualified
                  expenses related to removing architectural barriers, transportation
                  barriers, or communication barriers in a facility or public
                  transportation vehicle.
                </p>
              </>
            }
          >
            <p>
              The Barrier Removal Deduction is a <strong>tax deduction</strong> —
              it reduces your taxable income (not your tax bill directly). Unlike
              Section 44, there is <strong>no size restriction</strong> — any
              business can claim it.
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { label: 'Maximum deduction', value: '$15,000 per year' },
                { label: 'Who qualifies', value: 'Any business, any size' },
                { label: 'What it covers', value: 'Removing architectural, transportation, or communication barriers' },
                { label: 'Claimed on', value: 'Business tax return as a current expense' }
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '12px', flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '0.9rem' }}>{row.label}</span>
                  <span style={{ color: 'var(--body)', fontSize: '0.9rem', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <p>
              <strong>Example:</strong> A mid-size retail chain spends $12,000
              widening aisles and installing automatic doors at one location. They
              can deduct the full $12,000 as a current expense rather than
              capitalizing it over many years.
            </p>
          </GuideSection>

          <GuideSection
            id="using-both"
            title="Using Both Incentives Together"
          >
            <p>
              A qualifying small business can use <strong>both Section 44 and
              Section 190 in the same tax year</strong>. When combined:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Apply the <strong>Section 44 credit first</strong> to the first
                $10,250 of eligible expenses
              </li>
              <li style={{ marginBottom: '8px' }}>
                Then apply the <strong>Section 190 deduction</strong> to any
                remaining qualifying expenses, up to $15,000
              </li>
            </ul>
            <p>
              <strong>Example:</strong> A small dental office spends $20,000 on
              accessibility improvements. They claim the Section 44 credit on the
              first $10,250 (getting a $5,000 credit), then deduct the remaining
              $9,750 under Section 190. Total tax benefit: the $5,000 credit plus
              a $9,750 deduction.
            </p>
          </GuideSection>

          <GuideSection
            id="what-qualifies"
            title="What Expenses Qualify?"
          >
            <p>
              Both incentives cover a wide range of accessibility expenses:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { title: 'Barrier removal', desc: 'Installing ramps, widening doorways, adding grab bars, lowering counters, repaving for accessible parking' },
                { title: 'Signage', desc: 'Braille signage, raised-character room signs, accessible parking signs, directional signage' },
                { title: 'Equipment', desc: 'TTY/TDD devices, assistive listening systems, video relay equipment, accessible point-of-sale systems' },
                { title: 'Interpreters and readers', desc: 'Sign language interpreters, qualified readers for people with vision disabilities' },
                { title: 'Materials in alternative formats', desc: 'Large print, Braille, audio versions of menus, documents, or materials' },
                { title: 'Website accessibility', desc: 'Remediation to meet WCAG guidelines, screen reader compatibility, captioning' }
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
          </GuideSection>

          <GuideSection
            id="how-to-claim"
            title="How to Claim on Your Tax Return"
          >
            <p>
              Here's how to take advantage of each incentive:
            </p>
            <ol style={{ paddingLeft: '1.25rem', margin: '12px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Section 44 Credit:</strong> File <strong>IRS Form 8826
                </strong> (Disabled Access Credit) with your annual tax return.
                The credit flows to your Form 3800 (General Business Credit).
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Section 190 Deduction:</strong> Claim the deduction
                directly on your business tax return as a current-year expense.
                No special form is required — but keep detailed records and
                receipts.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Keep records:</strong> Document all expenditures with
                invoices, photos of work completed, and a description of how each
                expense relates to ADA accessibility.
              </li>
            </ol>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA-related tax
                incentives. Tax law is complex and individual circumstances vary.
                Consult a qualified tax professional or CPA before claiming these
                credits and deductions. For legal questions about your ADA
                obligations, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}