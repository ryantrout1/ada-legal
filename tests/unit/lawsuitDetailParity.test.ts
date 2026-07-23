/**
 * M3 Phase 3 — LawsuitDetail parity guard.
 *
 * WHAT THIS PROTECTS: /lawsuits/:slug is a port of Base44's
 * LawsuitDetail, but it deliberately renders MORE than B44 does. The
 * four Neon-only guidance blocks, the SEO block, the lead attorney
 * name, and the related-cases card have no B44 counterpart. A future
 * "re-sync from B44" that treats the ledger's difference as deficit
 * would delete every one of them, and every other gate would stay
 * green while it happened — that is exactly the failure M2 caught
 * twice (the guide shells and the chapter tldr blocks).
 *
 * So this pins them at the source level. If someone removes a section,
 * this test names it.
 *
 * It also pins the CTA gate. `lawsuits_ada_cta_enabled` is false today;
 * an ungated Ada affordance on this page would put a claimant into an
 * intake conversation Gina has not reviewed the copy for.
 *
 * Absence assertions use readCode, not readSource — the file's header
 * comment DESCRIBES the B44 divergence, so matching raw source would
 * fire on the explanation rather than the code. That cost three debug
 * cycles in M2 before tests/support/sourceText.ts existed.
 *
 * Ref: /plan M3 Phase 3, AC4 + AC5.
 */

import { describe, it, expect } from 'vitest';
import { readCode, readSource } from '../support/sourceText.js';

const PAGE = 'src/app/routes/public/LawsuitDetail.tsx';
const code = readCode(PAGE);
const source = readSource(PAGE);

describe('LawsuitDetail — B44 anatomy is present', () => {
  it('renders B44\u2019s section headings verbatim', () => {
    for (const heading of [
      'What this case is about',
      'Who may qualify',
      'Legal theory',
      'Named defendants',
      'Case facts',
      'Key dates',
      'Back to Active Cases',
      'This case isn',
    ]) {
      expect(source, `B44 heading missing: ${heading}`).toContain(heading);
    }
  });

  it('keeps B44\u2019s case-facts rows', () => {
    for (const term of ['Type', 'Affected states', 'Court', 'Docket', 'Filed']) {
      expect(source, `case-facts row missing: ${term}`).toContain(term);
    }
  });
});

describe('LawsuitDetail — ahead-of-B44 content survives', () => {
  it('renders all four Neon-only guidance blocks', () => {
    // These fields were preserved through the M0 reconciliation
    // specifically because they exist only on our side.
    for (const field of [
      'documentationRequired',
      'evidenceGuidance',
      'noDocumentationPath',
      'whatThisIsNot',
    ]) {
      expect(code, `guidance field dropped: ${field}`).toContain(field);
    }
  });

  it('renders their headings, not just the field reads', () => {
    for (const heading of [
      'What helps your case',
      'How to document what happened',
      'What if you don',
      'doesn&rsquo;t cover',
    ]) {
      expect(source, `guidance heading dropped: ${heading}`).toContain(heading);
    }
  });

  it('keeps the SEO block B44 has no equivalent of', () => {
    expect(code).toContain('canonical');
    expect(code).toContain('application/ld+json');
    expect(code).toContain('og:title');
  });

  it('keeps the lead attorney name and the related-cases card', () => {
    expect(code).toContain('leadAttorneyName');
    expect(code).toContain('relatedCases');
    expect(source).toContain('Related cases');
  });

  it('resolves the guidance fields through the simple/professional picker', () => {
    // These four have no standard column, so pickReadingLevelText would
    // silently return '' for every one of them.
    expect(code).toContain('pickSimpleProText');
  });
});

describe('LawsuitDetail — Ada CTA is gated', () => {
  it('reads the flag', () => {
    expect(code).toContain('useLawsuitsAdaCta');
    expect(code).toContain('adaCtaEnabled');
  });

  it('gates every Ada affordance on the flag', () => {
    // Both CTAs — the primary one and the off-ramp button — must sit
    // behind the gate. Counting the guard occurrences is the cheap way
    // to catch a second affordance being added ungated later.
    const gates = code.match(/adaCtaEnabled\s*&&/g) ?? [];
    expect(gates.length, 'expected both Ada CTAs behind the flag gate').toBe(2);

    const handlers = code.match(/onClick=\{handleTalkToAda\}/g) ?? [];
    expect(
      handlers.length,
      'every handleTalkToAda button must be inside a gated block',
    ).toBe(gates.length);
  });

  it('keeps the off-ramp PROSE ungated', () => {
    // The off-ramp text carries the DOJ-complaint and demand-letter
    // paths, which stand on their own. Gating the whole section would
    // hide real guidance from a reader who has no documentation.
    const offrampIdx = code.indexOf('no-documentation-heading');
    const proseIdx = code.indexOf('{noDocumentationPath}');
    expect(offrampIdx).toBeGreaterThan(-1);
    expect(proseIdx).toBeGreaterThan(offrampIdx);
    const between = code.slice(offrampIdx, proseIdx);
    expect(between, 'off-ramp prose must not be behind the CTA gate').not.toContain(
      'adaCtaEnabled',
    );
  });
});

describe('LawsuitDetail — routing and data seams', () => {
  it('reads the public detail endpoint, never a Base44 entity', () => {
    expect(code).toContain('/api/public/litigation/');
    expect(code).not.toContain('base44');
  });

  it('links back to /lawsuits, not the legacy route', () => {
    expect(code).toContain("to=\"/lawsuits\"");
    expect(code, 'legacy /class-actions link left behind').not.toContain(
      '/class-actions',
    );
  });

  it('does not render the fields no public surface should show', () => {
    for (const field of ['adaQualifyingQuestions', 'leadAttorneyId', 'leadFirmId']) {
      expect(code, `internal field rendered: ${field}`).not.toContain(field);
    }
  });
});
