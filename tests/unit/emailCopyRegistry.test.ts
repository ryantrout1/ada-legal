/**
 * The email copy registry has to match what the renderers actually send.
 *
 * Phase 1b moves 66 prose values out of seven renderers and into one
 * array. That is transcription, and the failure it invites is a sentence
 * retyped slightly wrong — which then becomes the default a future edit
 * starts from, and nobody notices because the renderer still holds the
 * real string until Phase 1e swaps it.
 *
 * So the registry is checked against live output here, at the point the
 * defaults are written, rather than after the swap. Every literal
 * fragment of every default must appear in what that renderer produces
 * today. A typo fails by template and slot name.
 *
 * Variables are not substituted. A default is split on its {{...}}
 * placeholders and each literal run between them is looked for
 * separately, so the check needs no knowledge of what a variable
 * resolves to. Runs shorter than four characters are skipped — matching
 * "." proves nothing.
 *
 * Ref: /plan editable email copy — Phase 1, split. Phase 1b, AC1/2/6.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  EMAIL_TEMPLATES,
  type EmailTemplateSpec,
  type LeveledText,
} from '@/engine/email/copySlots';
import { renderFirmEmail, renderUserEmail } from '@/engine/handoff/emailTemplates';
import { renderSelfHelpUserEmail } from '@/engine/handoff/selfHelpEmail';
import {
  renderFirmMatchedEmail,
  renderUserConnectedEmail,
  renderAdminRoutingEmail,
} from '@/engine/notifications/routingEmailTemplates';
import { buildReleaseEmail } from '@/lib/spot/releaseEmail';
import type { AttorneyPackage } from '@/engine/handoff/attorneyPackage';
import type { CaseRow } from '@/engine/clients/types';
import type { ReadingLevel } from '@/types/db';

const LEVELS: ReadingLevel[] = ['simple', 'standard', 'professional'];

function fieldEntry(value: unknown) {
  return { value, confidence: 0.9, extracted_at: '2026-04-22T00:00:00.000Z' };
}

function pkg(overrides: Partial<AttorneyPackage> = {}): AttorneyPackage {
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
    fields: { hotel_name: fieldEntry('Marriott Phoenix') },
    missingRequiredFields: [],
    classification: {
      title: 'III',
      tier: 'high',
      reasoning: 'Discrimination in a public accommodation',
      standard: 'ADA Title III',
      class_action_candidate: null,
    },
    photos: [],
    conversationSummary: 'Room had no roll-in shower. Refund denied.',
    conversationSummaryIsApproved: true,
    conversationTranscriptUrl: null,
    generatedAt: '2026-04-22T18:00:00.000Z',
    ...overrides,
  };
}

const caseRow: CaseRow = {
  id: 'case-1',
  orgId: 'org-1',
  adaSessionId: 'sess-1',
  litigationListingId: null,
  caseNumber: 'CASE-0042',
  lane: 'routed_firm',
  status: 'new',
  firmId: 'firm-1',
  consentToShare: true,
  assignedLawyerId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const URL_ = 'https://ada.adalegallink.com/s/s-abcdefghjkmn';

/**
 * Everything each template can produce, flattened into one searchable
 * blob per reading level. Both branches of every conditional are
 * included: a slot that only appears in the unqualified path still has
 * to be found somewhere.
 */
function outputFor(templateKey: string, level: ReadingLevel): string {
  const join = (...rs: { subject: string; html: string; text: string }[]) =>
    rs.map((r) => `${r.subject}\n${r.text}\n${r.html}`).join('\n');

  switch (templateKey) {
    case 'firm_handoff':
      return join(
        renderFirmEmail(pkg()),
        renderFirmEmail(pkg({ qualified: false, disqualifyingReason: 'Outside the class period' })),
        renderFirmEmail(pkg({ fields: {}, missingRequiredFields: ['incident_date'] })),
      );
    case 'claimant_handoff':
      return join(
        renderUserEmail({ pkg: pkg(), readingLevel: level }),
        renderUserEmail({
          pkg: pkg({ qualified: false, disqualifyingReason: 'Outside the class period' }),
          readingLevel: level,
        }),
      );
    case 'self_help':
      return join(
        renderSelfHelpUserEmail({
          packageUrl: URL_,
          readingLevel: level,
          summary: 'A barrier at a restaurant.',
          hasLetter: true,
        }),
        renderSelfHelpUserEmail({
          packageUrl: URL_,
          readingLevel: level,
          summary: 'A barrier at a restaurant.',
          hasLetter: false,
        }),
      );
    case 'routing_firm_matched':
      return join(
        renderFirmMatchedEmail({ caseRow, firmName: 'Acme ADA Law', claimantName: 'Jane Doe' }),
        renderFirmMatchedEmail({ caseRow, firmName: 'Acme ADA Law', claimantName: null }),
      );
    case 'routing_user_connected':
      return join(
        renderUserConnectedEmail({ caseRow, firmName: 'Acme ADA Law', readoutUrl: URL_ }),
        renderUserConnectedEmail({ caseRow, firmName: null, readoutUrl: URL_ }),
      );
    case 'routing_admin':
      return join(
        renderAdminRoutingEmail({ caseRow: { ...caseRow, lane: 'sourcing' } }),
        renderAdminRoutingEmail({ caseRow: { ...caseRow, lane: 'general_queue' } }),
      );
    case 'spot_release':
      return join(buildReleaseEmail({ slug: 'abc123xyz', baseUrl: 'https://ada.adalegallink.com' }));
    default:
      throw new Error(`no renderer wired for template ${templateKey}`);
  }
}

/** Literal runs between {{placeholders}}, long enough to be worth checking. */
function literalRuns(s: string): string[] {
  return s
    .split(/\{\{[a-z0-9_]+\}\}/i)
    .map((run) => run.trim())
    .filter((run) => run.length >= 4);
}

function defaultsFor(slot: EmailTemplateSpec['slots'][number]): Array<[ReadingLevel, string]> {
  return typeof slot.default === 'string'
    ? [['standard', slot.default]]
    : LEVELS.map((l) => [l, (slot.default as LeveledText)[l]] as [ReadingLevel, string]);
}

describe('every default is the string the renderer sends today', () => {
  for (const tpl of EMAIL_TEMPLATES) {
    for (const slot of tpl.slots) {
      for (const [level, value] of defaultsFor(slot)) {
        const label = `${tpl.key}.${slot.key}${slot.varied ? ` (${level})` : ''}`;
        it(label, () => {
          const out = outputFor(tpl.key, level);
          for (const run of literalRuns(value)) {
            expect(out, `${label} — not found in what the renderer sends: "${run}"`).toContain(run);
          }
        });
      }
    }
  }
});

describe('the registry holds together', () => {
  it('varied slots carry all three reading levels, flat slots carry one', () => {
    for (const tpl of EMAIL_TEMPLATES) {
      for (const slot of tpl.slots) {
        const label = `${tpl.key}.${slot.key}`;
        if (slot.varied) {
          expect(typeof slot.default, `${label} is varied but holds a single string`).toBe('object');
          for (const l of LEVELS) {
            expect(
              (slot.default as Record<string, string>)[l],
              `${label} is missing the ${l} variant`,
            ).toBeTruthy();
          }
        } else {
          expect(typeof slot.default, `${label} is flat but holds three variants`).toBe('string');
        }
      }
    }
  });

  it('names every variable its default uses', () => {
    // A placeholder with no declaration is a variable the editor will not
    // offer and the guard will not accept — it would render as literal
    // braces in a claimant's inbox.
    for (const tpl of EMAIL_TEMPLATES) {
      for (const slot of tpl.slots) {
        for (const [, value] of defaultsFor(slot)) {
          for (const m of value.matchAll(/\{\{([a-z0-9_]+)\}\}/gi)) {
            expect(
              slot.variables,
              `${tpl.key}.${slot.key} uses {{${m[1]}}} without declaring it`,
            ).toContain(m[1]);
          }
        }
      }
    }
  });

  it('uses each template key and slot key once', () => {
    const tplKeys = EMAIL_TEMPLATES.map((t) => t.key);
    expect(new Set(tplKeys).size, 'duplicate template key').toBe(tplKeys.length);
    for (const tpl of EMAIL_TEMPLATES) {
      const slotKeys = tpl.slots.map((s) => s.key);
      expect(new Set(slotKeys).size, `duplicate slot key in ${tpl.key}`).toBe(slotKeys.length);
    }
  });

  it('says in plain words who gets each email and when', () => {
    // This string is what Gina reads on the admin screen. An empty one
    // leaves her guessing which email she is editing.
    for (const tpl of EMAIL_TEMPLATES) {
      expect(tpl.trigger.length, `${tpl.key} has no trigger description`).toBeGreaterThan(20);
      expect(['claimant', 'firm', 'admin']).toContain(tpl.recipient);
    }
  });

  it('covers every renderer, with no template left unwired', () => {
    for (const tpl of EMAIL_TEMPLATES) {
      expect(() => outputFor(tpl.key, 'standard')).not.toThrow();
    }
    expect(EMAIL_TEMPLATES.length, 'seven emails go out; the registry should hold seven').toBe(7);
  });
});

describe('the renderers stay pure', () => {
  it('none of them became async', () => {
    // resolveCopy reads the database. If it were awaited inside a
    // renderer these would go async, which breaks the side-effect-free
    // contract in their headers and ripples into every caller and all
    // 101 existing assertions. Copy is loaded once at the call site.
    const files = [
      'src/engine/handoff/emailTemplates.ts',
      'src/engine/handoff/selfHelpEmail.ts',
      'src/engine/notifications/routingEmailTemplates.ts',
      'src/lib/spot/releaseEmail.ts',
    ];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, `${f} has an async exported renderer`).not.toMatch(
        /export\s+async\s+function\s+(render|build)/,
      );
    }
  });
});
