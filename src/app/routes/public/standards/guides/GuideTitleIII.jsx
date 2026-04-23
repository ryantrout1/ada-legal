import React from 'react';
import GuideStyles from '../../../../components/standards/GuideStyles.js';
import GuideHeroBanner from '../../../../components/standards/GuideHeroBanner.js';
import GuideSection from '../../../../components/standards/GuideSection.jsx';
import GuideLegalCallout from '../../../../components/standards/GuideLegalCallout.jsx';
import GuideReportCTA from '../../../../components/standards/GuideReportCTA.jsx';
import GuideReadingLevelBar from '../../../../components/standards/GuideReadingLevelBar.jsx';

export default function GuideTitleIII() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Title III: Public Accommodations & Businesses"
        typeBadge="Overview"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="scope"
            title="Who Title III Covers"
            simpleContent={
              <>
                <p>Title III covers businesses and places open to the public.</p>
                <p>This includes stores, restaurants, hotels, movie theaters, doctors' offices, gyms, gas stations, and websites.</p>
                <p>It applies to almost every private business — even small ones with no employees.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>12 Categories of Public Accommodation</strong></p>
                <p style={{ margin: '0 0 12px' }}>
                  Title III defines 12 categories of "places of public accommodation" covering virtually all private entities that offer goods, services, or facilities to the public. There is no minimum size or employee threshold. Religious organizations and private clubs are exempt.
                </p>
                <GuideLegalCallout>
                  42 U.S.C. §12182(a) — "No individual shall be discriminated against on the basis of disability in the full and equal enjoyment of the goods, services, facilities, privileges, advantages, or accommodations of any place of public accommodation."
                </GuideLegalCallout>
              </>
            }
          >
            <p>Title III is the section of the ADA most people encounter in daily life. It requires that <strong>private businesses open to the public</strong> be accessible to people with disabilities. The law covers 12 categories including lodging, restaurants, entertainment, retail, service establishments, transportation terminals, recreation, education, and social service centers.</p>
            <p>Unlike Title I (which has a 15-employee threshold) or Title II (which only covers government), Title III applies to virtually every business that serves the public, regardless of size. A one-person law office, a food truck, and a Fortune 500 headquarters are all covered.</p>
          </GuideSection>

          <GuideSection
            id="barriers"
            title="Barrier Removal"
            simpleContent={
              <>
                <p>Existing buildings must remove barriers if it is "readily achievable" — meaning easy and not too expensive.</p>
                <p>Examples: adding a ramp, widening a doorway, lowering a counter, adding grab bars.</p>
                <p>New buildings and major renovations must be fully accessible from the start — no excuses.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Readily Achievable Standard</strong></p>
                <p style={{ margin: 0 }}>
                  Existing facilities must remove architectural barriers where "readily achievable" — easily accomplishable without much difficulty or expense. Factors include the nature and cost of the action, the overall financial resources of the facility and parent entity, and the type of operation. This is a lower standard than "undue hardship" under Title I. New construction and alterations must comply fully with the 2010 ADA Standards for Accessible Design.
                </p>
              </>
            }
          >
            <p>Title III creates different obligations depending on when a building was built or altered. <strong>New construction</strong> (first occupancy after January 26, 1993) must be fully accessible. <strong>Alterations</strong> must comply to the maximum extent feasible. <strong>Existing facilities</strong> must remove barriers where "readily achievable."</p>
            <p>The readily achievable standard is flexible — what's readily achievable for a large chain is different from a small independent business. But the obligation is ongoing: as resources change, previously unachievable modifications may become required.</p>
          </GuideSection>

          <GuideSection
            id="design-standards"
            title="2010 ADA Standards for Accessible Design"
            simpleContent={
              <>
                <p>The "2010 Standards" are the rulebook for how buildings must be designed.</p>
                <p>They cover everything: doors, ramps, parking, restrooms, signs, elevators, counters, and more.</p>
                <p>Our Standards Guide breaks these down chapter by chapter in plain language.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>28 CFR Part 36, Appendix D</strong></p>
                <p style={{ margin: 0 }}>
                  The 2010 Standards incorporate the 2004 ADA/ABA Accessibility Guidelines (ADAAG) with DOJ modifications. They became mandatory for new construction and alterations on March 15, 2012. The Standards contain 10 chapters of scoping requirements and technical specifications covering site elements, accessible routes, plumbing, communication elements, special rooms and spaces, and built-in elements.
                </p>
              </>
            }
          >
            <p>The 2010 ADA Standards for Accessible Design are the technical specifications that define what "accessible" means in physical spaces. They contain hundreds of measurements, ratios, and requirements organized into 10 chapters. Our <strong>ADA Standards Guide</strong> translates all 10 chapters into plain language with interactive diagrams.</p>
          </GuideSection>

          <GuideSection
            id="websites"
            title="Websites & Digital Access"
            simpleContent={
              <>
                <p>Businesses' websites must also be accessible to people with disabilities.</p>
                <p>This means screen readers must work, keyboard navigation must work, and text must be readable.</p>
                <p>The DOJ has confirmed that websites are covered under Title III, and a new Title II web rule sets specific deadlines for government websites.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Web Accessibility Under Title III</strong></p>
                <p style={{ margin: 0 }}>
                  The DOJ has consistently maintained that Title III applies to websites of places of public accommodation. While no formal Title III web regulation exists yet, courts have increasingly applied WCAG 2.1 AA as the benchmark. The 2024 Title II web rule (28 CFR §35.200) sets WCAG 2.1 AA as the standard for state and local government websites, and this standard is widely expected to influence Title III enforcement.
                </p>
              </>
            }
          >
            <p>Website accessibility is one of the fastest-growing areas of ADA litigation. The DOJ's position is that the websites of businesses that serve the public are "places of public accommodation" under Title III. Courts have largely agreed, though the legal landscape varies by circuit.</p>
            <p>The practical standard is <strong>WCAG 2.1 Level AA</strong> — the Web Content Accessibility Guidelines. Common violations include missing alt text on images, inaccessible forms, poor color contrast, and content that cannot be navigated by keyboard or screen reader.</p>
          </GuideSection>

          <GuideSection
            id="enforcement"
            title="Enforcement & Remedies"
            simpleContent={
              <>
                <p>You can sue a business directly — you do not need to file a complaint first.</p>
                <p>You cannot get money damages in federal court for Title III, but the business pays your attorney's fees if you win.</p>
                <p>Many states have their own laws that DO allow money damages — California's Unruh Act pays $4,000+ per violation.</p>
              </>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}><strong>Private Right of Action</strong></p>
                <p style={{ margin: 0 }}>
                  Title III provides a private right of action for injunctive relief (a court order to fix the barrier) and attorney's fees. There are no compensatory or punitive damages available under federal Title III. However, state disability rights laws often provide significant monetary remedies — California's Unruh Civil Rights Act ($4,000+ minimum per violation), New York City Human Rights Law, and others. Most ADA attorneys work on contingency or fee-shifting, meaning the plaintiff pays nothing out of pocket.
                </p>
              </>
            }
          >
            <p>Title III enforcement works differently from Title I. There is <strong>no requirement to file with a government agency first</strong> — you can go directly to court. The primary federal remedy is injunctive relief (forcing the business to fix the problem) plus attorney's fees paid by the defendant.</p>
            <p>While federal Title III does not provide monetary damages, most ADA lawsuits are filed alongside state law claims that do. This is why most ADA attorneys work on contingency — the business pays the attorney's fees when the case succeeds.</p>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}
