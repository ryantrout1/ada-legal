/**
 * Every editable string in every email the site sends. One array.
 *
 * WHY ONE ARRAY. The litigation kind list was written by hand in seven
 * places; five of them were wrong, and the result was a raw slug on the
 * public site, a blank admin dropdown, a silently-dropped save and 22
 * records mislabelled in the portal. Email copy has the same shape —
 * a guard, a label map, an editor dropdown, a default — so it gets the
 * same treatment: one runtime array, everything else derived from it.
 *
 * WHAT A SLOT IS. Prose a person would reasonably want to reword. Not
 * HTML, not styles, not section markup — those stay in the renderers,
 * which is why Gina will never see a tag on the editing screen.
 *
 * VARIABLES. `{{name}}` placeholders are filled by the renderer, not by
 * whoever edits the text. Each slot declares which ones it accepts, and
 * the admin write guard refuses anything else by name rather than
 * dropping it. A placeholder that reaches an inbox as literal braces is
 * the failure this prevents.
 *
 * READING LEVELS. A slot is `varied` when the renderer already produces
 * simple / standard / professional variants of it. Those three are not
 * decoration: they are how someone who finds dense text hard reads their
 * own case. Flattening them to one string is the regression this shape
 * exists to make impossible.
 *
 * DEFAULTS ARE NOT A SEED. Nothing writes these to the database. An
 * empty `email_copy` table means nobody has edited anything, and the
 * resolver falls back here. That keeps "never touched" distinguishable
 * from "edited back to the original".
 *
 * Ref: /plan editable email copy — Phase 1, split. Phase 1b.
 */

import type { ReadingLevel } from '../../types/db.js';

/** The three variants a varied slot carries. */
export type LeveledText = Record<ReadingLevel, string>;

export interface CopySlot {
  key: string;
  /** True when the renderer already varies this string by reading level. */
  varied: boolean;
  /** Placeholder names this slot may use. Anything else is refused on save. */
  variables: readonly string[];
  /** Current wording. One string when flat, three when varied. */
  default: string | LeveledText;
}

export interface EmailTemplateSpec {
  key: string;
  /** Shown on the admin screen. Plain words: who gets it, what makes it send. */
  trigger: string;
  recipient: 'claimant' | 'firm' | 'admin';
  slots: readonly CopySlot[];
}

export const EMAIL_TEMPLATES: readonly EmailTemplateSpec[] = [
  {
    key: 'firm_handoff',
    recipient: 'firm',
    trigger:
      'The firm, when Ada finishes an intake that matched their case and the claimant qualified.',
    slots: [
      {
        key: 'subject',
        varied: false,
        variables: ['listing_title', 'claimant_first_name'],
        default: 'New qualified intake — {{listing_title}} — {{claimant_first_name}}',
      },
      { key: 'heading', varied: false, variables: [], default: 'New qualified intake' },
      {
        key: 'intro',
        varied: false,
        variables: ['listing_title'],
        default: 'An ADA Legal Link client has completed intake for {{listing_title}}.',
      },
      { key: 'section_claimant', varied: false, variables: [], default: 'Claimant' },
      { key: 'section_classification', varied: false, variables: [], default: 'Classification' },
      { key: 'section_case_facts', varied: false, variables: [], default: 'Case facts' },
      { key: 'empty_facts', varied: false, variables: [], default: '(none recorded)' },
      {
        key: 'missing_fields_label',
        varied: false,
        variables: [],
        default: 'Missing required fields:',
      },
    ],
  },

  {
    key: 'claimant_handoff',
    recipient: 'claimant',
    trigger:
      'The claimant, right after Ada finishes and their intake goes to a firm — or, if they did not qualify, to tell them so.',
    slots: [
      {
        key: 'subject_qualified',
        varied: true,
        variables: ['firm_name'],
        default: {
          simple: 'We sent your story to {{firm_name}}',
          standard: "We've sent your information to {{firm_name}}",
          professional: 'Intake submitted to {{firm_name}}',
        },
      },
      {
        key: 'intro_qualified',
        varied: true,
        variables: ['firm_name', 'listing_title'],
        default: {
          simple: 'Thank you for telling us what happened. We sent your story to {{firm_name}}.',
          standard:
            "Thanks for sharing your experience. We've sent your information to {{firm_name}} for the \"{{listing_title}}\" class action.",
          professional:
            'Thank you for completing intake for the "{{listing_title}}" class action. Your information has been submitted to {{firm_name}} for review.',
        },
      },
      {
        key: 'next_steps_qualified',
        varied: true,
        variables: [],
        default: {
          simple:
            'They will look at it and get back to you soon. Watch for their email or call. You do not need to do anything right now.',
          standard:
            "They'll review it and reach out to you directly. Watch for their email or call in the coming days.",
          professional:
            'The firm will review your submission and contact you directly to discuss next steps. Expected response time varies by firm but is typically 1-2 weeks.',
        },
      },
      {
        key: 'subject_unqualified',
        varied: true,
        variables: [],
        default: {
          simple: 'About your story',
          standard: 'Update on your intake',
          professional: 'Update regarding your intake',
        },
      },
      {
        key: 'intro_unqualified',
        varied: true,
        variables: ['listing_title'],
        default: {
          simple:
            'Thank you for telling us what happened. For this case, we were not able to match you.',
          standard:
            "Thanks for sharing your experience. Unfortunately, based on what we discussed, your situation doesn't match the \"{{listing_title}}\" class action.",
          professional:
            'Thank you for completing intake for the "{{listing_title}}" class action. Based on the information provided, your situation does not meet the eligibility criteria for this particular case.',
        },
      },
      {
        key: 'reason_line',
        varied: true,
        variables: ['reason'],
        default: {
          simple: 'Reason: {{reason}}',
          standard: 'The reason: {{reason}}',
          professional: 'Disqualifying reason: {{reason}}',
        },
      },
      {
        key: 'next_steps_unqualified',
        varied: true,
        variables: [],
        default: {
          simple: 'You can still get help. Come back to ADA Legal Link to look for other ways.',
          standard:
            'You may still have options. Come back to ADA Legal Link and we can explore other paths that fit your situation.',
          professional:
            'Other avenues may still be available. Please return to ADA Legal Link to explore alternative options for your situation.',
        },
      },
      {
        key: 'summary_heading',
        varied: true,
        variables: [],
        default: {
          simple: 'What we talked about',
          standard: 'What we discussed',
          professional: 'Summary of intake',
        },
      },
    ],
  },

  {
    key: 'self_help',
    recipient: 'claimant',
    trigger:
      'The claimant, when Ada finishes and there is no firm to hand them to — they get their own summary and next steps.',
    slots: [
      {
        key: 'subject',
        varied: true,
        variables: [],
        default: {
          simple: 'Your accessibility summary from Ada',
          standard: 'Your accessibility summary and next steps',
          professional: 'Your ADA accessibility summary and recommended next steps',
        },
      },
      {
        key: 'greeting',
        varied: true,
        variables: [],
        default: {
          simple: 'Here is the summary of what we talked about.',
          standard: "Here's the summary of what we discussed and the steps you can take.",
          professional: 'Below is the summary of our discussion and the recommended next steps.',
        },
      },
      {
        key: 'letter_line',
        varied: true,
        variables: [],
        default: {
          simple: 'Your summary also has a sample letter you can send.',
          standard: 'Your summary also includes a sample letter you can send to the business.',
          professional:
            'Your summary also includes a sample letter you may send to the business directly.',
        },
      },
      { key: 'cta', varied: false, variables: [], default: 'Open your full summary:' },
      {
        key: 'disclaimer',
        varied: false,
        variables: [],
        default:
          'This summary is based on what you told Ada. Ada is an AI assistant, not a lawyer, and this is not legal advice.',
      },
    ],
  },

  {
    key: 'routing_firm_matched',
    recipient: 'firm',
    trigger: 'The firm, once a claimant has read their summary and agreed to be connected.',
    slots: [
      {
        key: 'subject',
        varied: false,
        variables: ['case_number'],
        default: 'New consented case — {{case_number}}',
      },
      { key: 'heading', varied: false, variables: [], default: 'A claimant consented to connect' },
      {
        key: 'body',
        varied: false,
        variables: ['claimant_name', 'firm_name', 'case_number'],
        default:
          '{{claimant_name}} has reviewed their summary and consented to share their intake with {{firm_name}} on case {{case_number}}.',
      },
      {
        key: 'note',
        varied: false,
        variables: [],
        default: 'Their contact details and intake are in your portal.',
      },
      { key: 'cta_label', varied: false, variables: [], default: 'Review in your portal' },
    ],
  },

  {
    key: 'routing_user_connected',
    recipient: 'claimant',
    trigger: 'The claimant, right after they agree to be connected to a firm.',
    slots: [
      {
        key: 'subject',
        varied: false,
        variables: ['with_firm'],
        default: "You're connected{{with_firm}}",
      },
      { key: 'heading', varied: false, variables: [], default: "You're all set" },
      {
        key: 'intro',
        varied: false,
        variables: ['firm_or_attorney'],
        default:
          'Thanks for confirming. {{firm_or_attorney}} can now review what you described and will reach out to you directly.',
      },
      {
        key: 'reassurance',
        varied: false,
        variables: [],
        default: "There's nothing more you need to do right now — they'll be in touch.",
      },
      { key: 'cta_label', varied: false, variables: [], default: 'View your summary' },
      { key: 'signoff', varied: false, variables: [], default: '— Ada, ADA Legal Link' },
    ],
  },

  {
    key: 'routing_admin',
    recipient: 'admin',
    trigger:
      'Whoever is on the admin address, when a case lands with no firm attached and needs a human to place it.',
    slots: [
      {
        key: 'subject',
        varied: false,
        variables: ['lane', 'case_number', 'action'],
        default: 'New {{lane}} case — {{case_number}} needs {{action}}',
      },
      {
        key: 'heading',
        varied: false,
        variables: ['action'],
        default: 'A case needs {{action}}',
      },
      {
        key: 'body',
        varied: false,
        variables: ['case_number', 'lane', 'action'],
        default: 'Case {{case_number}} routed to the {{lane}} lane and needs {{action}}.',
      },
      { key: 'cta_label', varied: false, variables: [], default: 'Open admin' },
    ],
  },

  {
    key: 'spot_release',
    recipient: 'claimant',
    trigger: 'The person who paid for a Spot screening, when their report is approved and released.',
    slots: [
      {
        key: 'subject',
        varied: false,
        variables: [],
        default: 'Your accessibility screening from Spot is ready',
      },
      { key: 'heading', varied: false, variables: [], default: 'Your screening is ready' },
      {
        key: 'cta_label',
        varied: false,
        variables: [],
        default: 'View your screening report',
      },
      {
        key: 'intro',
        varied: false,
        variables: [],
        // No trailing colon: it introduced a bare URL, and the URL is a
        // button now.
        default: 'Thanks for using Spot. Your accessibility screening report is ready.',
      },
      {
        key: 'disclaimer',
        varied: false,
        variables: [],
        // Screening language only. Never "violation", never "compliant" —
        // spotReleaseEmail.test.ts fails the build on any certifying verb.
        default:
          'This report is an automated screening based on the photos you provided — a starting point for planning remediation, not a professional inspection or a legal determination. Findings should be confirmed on-site.',
      },
      {
        key: 'review',
        varied: false,
        variables: [],
        // Matches buildConfirmationCopy's line on the waiting screen, in the
        // past tense. api/spot/admin/release.ts is the only path that sends a
        // report and it requires an admin, so this is simply true — and it is
        // the reason the wait was hours.
        default: 'A person read this report before it was sent.',
      },
      {
        key: 'retention',
        varied: false,
        variables: [],
        // The report is permanent — api/spot/report.ts says so outright, and
        // spot_photo is what carries the 90-day clock. Saying the link expires
        // would be false and would manufacture urgency the product does not
        // have; the honest urgency is that the photos leave the report.
        default:
          'The link above doesn’t expire. Your uploaded photos are deleted after 90 days, and come out of the report when they go — the findings stay.',
      },
    ],
  },
];
