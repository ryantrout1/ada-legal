/**
 * Tests for renderFirmEmail + renderUserEmail.
 *
 * The renderers are pure functions over AttorneyPackage. We build a
 * fixture package and assert on substrings in the output. Two
 * priorities:
 *
 *   1. HTML escaping: anything derived from user input must be
 *      escaped, especially claimant name/email and free-text fields.
 *      Test with attack-looking strings so regressions are caught.
 *
 *   2. Copy correctness: the qualified/unqualified branches say the
 *      right thing, reading-level variants fire, and the transcript
 *      link is firm-only.
 *
 * Ref: Step 24, Commit 2.
 */

import { describe, it, expect } from 'vitest';
import {
  renderFirmEmail,
  renderUserEmail,
} from '@/engine/handoff/emailTemplates';
import type { AttorneyPackage } from '@/engine/handoff/attorneyPackage';

function fieldEntry(value: unknown, confidence = 0.9) {
  return {
    value,
    confidence,
    extracted_at: '2026-04-22T00:00:00.000Z',
  };
}

function basePackage(
  overrides: Partial<AttorneyPackage> = {},
): AttorneyPackage {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    listing: {
      id: '00000000-0000-4000-8000-000000000a02',
      title: 'Hotel booking fraud class action',
      firmName: 'Acme ADA Law',
    },
    qualified: true,
    disqualifyingReason: null,
    claimant: {
      name: 'Alex Morales',
      email: 'alex@example.com',
      phone: '+1-555-111-2222',
      preferredContact: 'email',
    },
    fields: {
      hotel_name: fieldEntry('Marriott Phoenix', 0.95),
      incident_date: fieldEntry('2026-03-15', 0.9),
      was_refunded: fieldEntry(false, 0.7),
    },
    missingRequiredFields: [],
    classification: {
      title: 'III',
      tier: 'high',
      reasoning: 'Discrimination in a public accommodation',
      standard: 'ADA Title III',
      class_action_candidate: null,
    },
    photos: [],
    conversationSummary:
      'User booked accessible room at Marriott Phoenix for 2026-03-15, arrived to find room had no roll-in shower. Refund denied.',
    conversationSummaryIsApproved: true,
    conversationTranscriptUrl: null,
    generatedAt: '2026-04-22T18:00:00.000Z',
    ...overrides,
  };
}

// ─── renderFirmEmail ──────────────────────────────────────────────────────────

describe('renderFirmEmail — subject', () => {
  it('includes listing title and claimant first name', () => {
    const { subject } = renderFirmEmail(basePackage());
    expect(subject).toBe(
      'New qualified intake — Hotel booking fraud class action — Alex',
    );
  });

  it('falls back to "Claimant" when name is null', () => {
    const { subject } = renderFirmEmail(
      basePackage({
        claimant: {
          name: null,
          email: 'alex@example.com',
          phone: null,
          preferredContact: 'email',
        },
      }),
    );
    expect(subject).toContain('Claimant');
  });
});

describe('renderFirmEmail — html body', () => {
  it('includes listing title + firm block + claimant details', () => {
    const { html } = renderFirmEmail(basePackage());
    expect(html).toContain('Hotel booking fraud class action');
    expect(html).toContain('Alex Morales');
    expect(html).toContain('alex@example.com');
    expect(html).toContain('+1-555-111-2222');
  });

  it('renders all case facts with confidence tags', () => {
    const { html } = renderFirmEmail(basePackage());
    expect(html).toContain('hotel_name');
    expect(html).toContain('Marriott Phoenix');
    expect(html).toContain('high confidence'); // 0.95
    expect(html).toContain('medium confidence'); // 0.7
  });

  it('shows missingRequiredFields warning when present', () => {
    const { html } = renderFirmEmail(
      basePackage({ missingRequiredFields: ['incident_date', 'hotel_name'] }),
    );
    expect(html).toContain('Missing required fields');
    expect(html).toContain('incident_date');
    expect(html).toContain('hotel_name');
  });

  it('shows "Auto-generated (not user-approved)" for unapproved summaries', () => {
    const { html } = renderFirmEmail(
      basePackage({ conversationSummaryIsApproved: false }),
    );
    expect(html).toContain('Auto-generated (not user-approved)');
  });

  it('does NOT show that warning when summary IS approved', () => {
    const { html } = renderFirmEmail(
      basePackage({ conversationSummaryIsApproved: true }),
    );
    expect(html).not.toContain('Auto-generated');
  });

  it('includes transcript link ONLY when conversationTranscriptUrl is set', () => {
    const without = renderFirmEmail(basePackage()).html;
    expect(without).not.toContain('Download PDF transcript');

    const withUrl = renderFirmEmail(
      basePackage({ conversationTranscriptUrl: 'https://blob.example/transcript.pdf' }),
    ).html;
    expect(withUrl).toContain('Download PDF transcript');
    expect(withUrl).toContain('https://blob.example/transcript.pdf');
  });

  it('lists photos with finding counts', () => {
    const { html } = renderFirmEmail(
      basePackage({
        photos: [
          { url: 'https://blob.example/p1.jpg', findings: [] },
          {
            url: 'https://blob.example/p2.jpg',
            findings: [
              {
                finding: 'No roll-in shower',
                severity: 'major',
                standard: 'ADAAG 608.2',
                confidence: 0.8,
              },
            ],
          },
        ],
      }),
    );
    expect(html).toContain('https://blob.example/p1.jpg');
    expect(html).toContain('https://blob.example/p2.jpg');
    expect(html).toContain('1 finding');
  });

  it('handles empty fields block gracefully', () => {
    const { html } = renderFirmEmail(basePackage({ fields: {} }));
    expect(html).toContain('(none recorded)');
  });
});

describe('renderFirmEmail — html escaping', () => {
  it('escapes script tags in claimant name', () => {
    const { html } = renderFirmEmail(
      basePackage({
        claimant: {
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          phone: null,
          preferredContact: null,
        },
      }),
    );
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes quotes and angle brackets in field values', () => {
    const { html } = renderFirmEmail(
      basePackage({
        fields: {
          narrative: fieldEntry('Hotel said "we don\'t have accessible rooms" <sigh>'),
        },
      }),
    );
    expect(html).not.toMatch(/<sigh>/);
    expect(html).toContain('&quot;');
    expect(html).toContain('&lt;sigh&gt;');
  });

  it('escapes attribute values in photo URLs', () => {
    const { html } = renderFirmEmail(
      basePackage({
        photos: [
          {
            // A URL with characters that must be escaped inside href=""
            url: 'https://example.com/photo.jpg?q="injected"',
            findings: [],
          },
        ],
      }),
    );
    expect(html).toContain('&quot;injected&quot;');
    expect(html).not.toContain('"injected"');
  });

  it('escapes HTML in conversation summary', () => {
    const { html } = renderFirmEmail(
      basePackage({
        conversationSummary: '<img src=x onerror=alert(1)>',
      }),
    );
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('renderFirmEmail — text body', () => {
  it('includes claimant details in plain text', () => {
    const { text } = renderFirmEmail(basePackage());
    expect(text).toContain('Alex Morales');
    expect(text).toContain('alex@example.com');
  });

  it('renders fields as key: value pairs with confidence tag', () => {
    const { text } = renderFirmEmail(basePackage());
    expect(text).toMatch(/hotel_name: Marriott Phoenix \[high confidence\]/);
  });

  it('renders missing-fields warning in text too', () => {
    const { text } = renderFirmEmail(
      basePackage({ missingRequiredFields: ['hotel_name'] }),
    );
    expect(text).toMatch(/Missing required fields: hotel_name/);
  });

  it('omits transcript section when URL is null', () => {
    const { text } = renderFirmEmail(basePackage());
    expect(text).not.toContain('FULL TRANSCRIPT');
  });
});

// ─── renderUserEmail ──────────────────────────────────────────────────────────

describe('renderUserEmail — qualified path', () => {
  it('reassures the user at "standard" reading level', () => {
    const { subject, html } = renderUserEmail({
      pkg: basePackage(),
      readingLevel: 'standard',
    });
    expect(subject).toMatch(/sent your information to Acme ADA Law/);
    expect(html).toMatch(/review it/i);
    expect(html).toMatch(/reach out/i);
  });

  it('uses simpler wording for "simple" reading level', () => {
    const { subject, html } = renderUserEmail({
      pkg: basePackage(),
      readingLevel: 'simple',
    });
    expect(subject).toMatch(/sent your story/);
    expect(html).toMatch(/You do not need to do anything right now/);
  });

  it('uses more formal wording for "professional"', () => {
    const { subject, html } = renderUserEmail({
      pkg: basePackage(),
      readingLevel: 'professional',
    });
    expect(subject).toMatch(/submitted/);
    expect(html).toMatch(/typically 1-2 weeks/);
  });

  it('NEVER includes the transcript link in user email', () => {
    const html = renderUserEmail({
      pkg: basePackage({
        conversationTranscriptUrl: 'https://blob.example/transcript.pdf',
      }),
      readingLevel: 'standard',
    }).html;
    expect(html).not.toContain('https://blob.example/transcript.pdf');
    expect(html).not.toContain('transcript');
  });

  it('includes the conversation summary', () => {
    const html = renderUserEmail({
      pkg: basePackage(),
      readingLevel: 'standard',
    }).html;
    expect(html).toContain('Marriott Phoenix');
  });
});

describe('renderUserEmail — unqualified path', () => {
  it('has different subject + copy than qualified', () => {
    const { subject, html } = renderUserEmail({
      pkg: basePackage({
        qualified: false,
        disqualifyingReason: 'Claim is older than three years',
      }),
      readingLevel: 'standard',
    });
    expect(subject).toMatch(/Update/);
    expect(html).toMatch(/doesn&#39;t match/i);
    expect(html).toContain('Claim is older than three years');
  });

  it('encourages next steps without promising anything', () => {
    const { html } = renderUserEmail({
      pkg: basePackage({
        qualified: false,
        disqualifyingReason: 'Outside jurisdiction',
      }),
      readingLevel: 'standard',
    });
    expect(html).toMatch(/explore other paths/i);
  });

  it('omits reason gracefully when disqualifyingReason is null', () => {
    const { html } = renderUserEmail({
      pkg: basePackage({ qualified: false, disqualifyingReason: null }),
      readingLevel: 'standard',
    });
    // No "The reason:" prefix when there's no reason
    expect(html).not.toMatch(/The reason:/);
  });

  it('uses simple wording for unqualified + simple level', () => {
    const { subject, html } = renderUserEmail({
      pkg: basePackage({
        qualified: false,
        disqualifyingReason: 'Too long ago',
      }),
      readingLevel: 'simple',
    });
    expect(subject).toMatch(/About your story/);
    expect(html).toMatch(/still get help/);
  });
});

describe('renderUserEmail — html escaping', () => {
  it('escapes the firm name', () => {
    const { subject, html } = renderUserEmail({
      pkg: basePackage({
        listing: {
          id: '00000000-0000-4000-8000-000000000a02',
          title: 'Normal title',
          firmName: '<b>Evil Firm</b>',
        },
      }),
      readingLevel: 'standard',
    });
    // subject is plain text; html must escape
    expect(subject).toContain('<b>Evil Firm</b>'); // subject isn't HTML
    expect(html).not.toContain('<b>Evil Firm</b>');
    expect(html).toContain('&lt;b&gt;Evil Firm&lt;/b&gt;');
  });

  it('escapes the disqualifying reason', () => {
    const { html } = renderUserEmail({
      pkg: basePackage({
        qualified: false,
        disqualifyingReason: '<script>alert(1)</script>',
      }),
      readingLevel: 'standard',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('renderUserEmail — text body', () => {
  it('is plain-text shaped (no HTML tags)', () => {
    const { text } = renderUserEmail({
      pkg: basePackage(),
      readingLevel: 'standard',
    });
    expect(text).not.toMatch(/<[a-z]/);
  });

  it('still includes the summary', () => {
    const { text } = renderUserEmail({
      pkg: basePackage(),
      readingLevel: 'standard',
    });
    expect(text).toContain('Marriott Phoenix');
  });
});
