import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideAccessibleDocuments() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Making Documents Accessible"
        typeBadge="Guide"
        badgeColor="#5B2C6F"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="why-documents"
            title="Why Document Accessibility Matters"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>WCAG 2.1 SC 1.3.1 — Info and Relationships (Level A)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "Information, structure, and relationships conveyed through
                  presentation can be programmatically determined or are available
                  in text."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>SC 1.3.2 — Meaningful Sequence (Level A)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "When the sequence in which content is presented affects its
                  meaning, a correct reading sequence can be programmatically
                  determined."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>SC 4.1.2 — Name, Role, Value (Level A)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "For all user interface components… the name and role can be
                  programmatically determined; states, properties, and values that
                  can be set by the user can be programmatically set."
                </p>
              </>
            }
          >
            <p>
              Government agencies and businesses routinely post documents online —
              applications, reports, agendas, forms, and presentations. If those
              documents aren't accessible, people who use <strong>screen readers,
              magnification software, or Braille displays</strong> can't use them.
            </p>
            <p>
              An inaccessible PDF is like a locked door with no ramp. The
              information is there, but an entire group of people is shut out.
            </p>
            <p>
              Under the ADA's Title II web rule, documents posted on government
              websites after the compliance date must meet WCAG 2.1 Level AA.
              Private businesses also face obligations under Title III to provide
              accessible communications.
            </p>
          </GuideSection>

          <GuideSection
            id="pdfs"
            title="Accessible PDFs"
          >
            <p>
              PDFs are the most common — and most problematic — document format
              online. A PDF that looks fine on screen can be completely
              <strong> unreadable</strong> to a screen reader if it's not
              properly structured. Here's what an accessible PDF requires:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { req: 'Tagged structure', desc: 'Every PDF must have tags that define headings, paragraphs, lists, tables, and images — similar to HTML. Without tags, a screen reader reads the document as a single undifferentiated stream of text.' },
                { req: 'Correct reading order', desc: 'Tags must be ordered so content is read in the right sequence. Multi-column layouts, sidebars, and headers/footers are commonly read out of order in untagged PDFs.' },
                { req: 'Alt text for images', desc: 'Every meaningful image, chart, or graphic in the PDF needs alternative text. Decorative images should be marked as artifacts so screen readers skip them.' },
                { req: 'Accessible form fields', desc: 'Fillable form fields must have labels, proper tab order, and instructions that are associated with the fields — not just visually adjacent.' },
                { req: 'Table headers', desc: 'Data tables must have header cells marked as headers (TH) so screen readers can announce which column or row a data cell belongs to.' },
                { req: 'Document language set', desc: 'The PDF must declare its language (e.g., English) so screen readers use the correct pronunciation engine.' },
                { req: 'Bookmarks for long documents', desc: 'Documents over about 9 pages should include bookmarks that let users navigate to sections — similar to a table of contents.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.req}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="scanned-documents"
            title="Scanned Documents Require OCR"
          >
            <p>
              A scanned document is just a <strong>picture of text</strong>.
              A screen reader sees it as a blank image — there's no text to read.
            </p>
            <p>
              Before posting a scanned document online, you must run <strong>
              Optical Character Recognition (OCR)</strong> to convert the image
              into actual text. Then you still need to add tags, reading order,
              and alt text.
            </p>
            <p>
              <strong>Example:</strong> A city scans a building permit application
              and posts the image PDF. A blind resident trying to fill it out hears
              nothing — just "image, image, image." After OCR processing and
              tagging, the screen reader announces each field label and the
              resident can complete the form.
            </p>

            <GuideLegalCallout citation="PDF/UA Standard (ISO 14289-1)">
              <p style={{ margin: 0 }}>
                The PDF/UA (Universal Accessibility) standard defines the
                technical requirements for accessible PDF documents. It aligns
                with WCAG principles and specifies that all real content must be
                tagged, a logical reading order must be defined, and all
                non-decorative images must have alternative text.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="word-documents"
            title="Accessible Word Documents"
          >
            <p>
              Microsoft Word documents are often more accessible than PDFs
              by default — <strong>if you use the built-in tools correctly</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Use heading styles:</strong> Don't just make text bigger
                and bold — use Word's built-in Heading 1, Heading 2, Heading 3
                styles. This creates structure that screen readers can navigate.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Add alt text to images:</strong> Right-click any image
                and select "Edit Alt Text." Describe what the image shows in
                1–2 sentences.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Use real tables, not tabs:</strong> If you're presenting
                tabular data, insert an actual table. Mark the first row as a
                header row (Table Properties → Row → "Repeat as header row").
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Use real lists:</strong> Use Word's bulleted or numbered
                list feature — don't type dashes or numbers manually.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Meaningful hyperlink text:</strong> "Read the full
                report" is accessible. "Click here" is not — it tells a screen
                reader user nothing about where the link goes.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Run the Accessibility Checker:</strong> Word has a
                built-in tool: Review → Check Accessibility. It flags missing
                alt text, missing table headers, and other common issues.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="presentations"
            title="Accessible Presentations"
          >
            <p>
              PowerPoint and Google Slides presentations posted online or shared
              digitally must also be accessible:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Every slide needs a unique title:</strong> Screen readers
                use slide titles to navigate. Without them, users hear "Slide 1,
                Slide 2" with no way to find specific content.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Set the reading order:</strong> In PowerPoint, use the
                Selection Pane (Home → Arrange → Selection Pane) to check and
                reorder how elements are read. Items are read bottom-to-top in
                the pane.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Alt text for all images and charts:</strong> Right-click
                → Edit Alt Text on every visual element.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Sufficient contrast:</strong> Light text on light
                backgrounds or text over busy images fails contrast requirements.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Don't rely on color alone:</strong> If a chart uses color
                to distinguish categories, also use patterns, labels, or shapes.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="title-ii-exception"
            title="The Preexisting Documents Exception"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.202(a)(3) — Preexisting Conventional
                  Electronic Documents</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  The Title II web rule excepts "preexisting conventional
                  electronic documents" — meaning Word documents, PDFs,
                  spreadsheets, and presentation files posted before the
                  compliance date.
                </p>
                <p style={{ margin: 0 }}>
                  However, this exception does not apply if "a person with a
                  disability requests" the document. In that case, the entity
                  must make the specific document accessible or provide the
                  information in an alternative accessible format.
                </p>
              </>
            }
          >
            <p>
              Under the Title II web rule, documents posted <strong>before the
              compliance date</strong> (April 2026 or 2027, depending on entity
              size) do not need to retroactively meet WCAG 2.1. But there are
              important limits:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                Any document posted <strong>after</strong> the compliance date
                must be fully accessible
              </li>
              <li style={{ marginBottom: '8px' }}>
                If someone with a disability <strong>requests</strong> an older
                document, you must make it accessible or provide the information
                another way
              </li>
              <li style={{ marginBottom: '8px' }}>
                This exception only covers "conventional electronic documents"
                — not web pages, forms, or interactive content
              </li>
              <li style={{ marginBottom: '8px' }}>
                The general Title II obligation to provide <strong>effective
                communication</strong> (28 CFR §35.160) still applies regardless
                of this exception
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="tools"
            title="Tools for Checking Document Accessibility"
          >
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { name: 'Microsoft Accessibility Checker', format: 'Word / PowerPoint / Excel', desc: 'Built-in tool: Review → Check Accessibility. Flags missing alt text, heading issues, table problems, and reading order concerns.' },
                { name: 'Adobe Acrobat Pro Accessibility Check', format: 'PDF', desc: 'Full Check tool under Accessibility tab. Tests for tags, reading order, alt text, form fields, and color contrast. Can also auto-tag simple documents.' },
                { name: 'PAC (PDF Accessibility Checker)', format: 'PDF', desc: 'Free tool from the PDF/UA Foundation. Tests PDFs against the PDF/UA standard and WCAG. Provides a detailed report with pass/fail for each criterion.' },
                { name: 'Grackle Suite', format: 'Google Docs / Slides / Sheets', desc: 'Add-on for Google Workspace. Checks and remediates accessibility issues directly within Google documents.' }
              ].map((tool, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--slate-900)' }}>{tool.name}</p>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
                      borderRadius: '100px', background: '#EDE9FE', color: '#5B2C6F'
                    }}>{tool.format}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{tool.desc}</p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about creating accessible
                documents. Document accessibility can be technically complex,
                especially for legacy content. For legal advice about your
                obligations or your rights, connect with an experienced ADA
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