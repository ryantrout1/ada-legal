/**
 * Claimant-facing words for the civil rights complaint page.
 *
 * DRAFT: nothing here is approved until Gina reviews it. When wording
 * changes after launch, bump COPY_VERSION; when a consent sentence
 * changes, bump that consent's `version`. The save endpoint stores the
 * server's copy of the wording for the version the page showed, so the
 * proof of what someone agreed to never depends on what a browser sent.
 */

import type { StateConfig } from './types.js';

export const COPY_VERSION = 'draft-2026-10-19';

export type ConsentKind = 'updates' | 'contact';

export interface ConsentWording {
  kind: ConsentKind;
  version: string;
  wording: string;
}

/** Both optional, unchecked by default, never needed for the PDF. */
export const CONSENTS: readonly ConsentWording[] = [
  {
    kind: 'updates',
    version: '2026-10-19.1',
    wording: 'Send me updates from ADA Legal Link.',
  },
  {
    kind: 'contact',
    version: '2026-10-19.1',
    wording:
      'ADA Legal Link or a partner attorney may contact me about my report. I understand no one is promising to contact me or take my case.',
  },
];

/** Page and wizard words. DRAFT until Gina approves. */
export const UI = {
  pickerTitle: 'File a state civil rights complaint',
  pickerIntro:
    "Pick your state. We'll walk you through your state's civil rights complaint form, one or two questions at a time, and give you the filled-in form to sign and send yourself.",
  pickerMore: 'More states are coming.',
  pickerUnknown: "We don't have that state yet.",
  title: (stateName: string) => `Get your ${stateName} civil rights complaint form ready`,
  intro: (agency: string, formName: string) =>
    `Answer a few short questions and we'll fill in the ${agency}'s ${formName} for you. ` +
    'This version is for disability discrimination at a business or place open to the public, ' +
    'like a store, restaurant, theater or office.',
  howItWorks: [
    'Answer about 11 short screens. It takes about 10 minutes.',
    'Check everything on the review screen. You can change any answer.',
    'Download or print your filled-in form. Sign it and send it to the Attorney General yourself.',
  ],
  privacyNote:
    'We keep a copy of your answers so we can understand the barriers people face. See our privacy policy for how we handle it.',
  privacyLink: 'Privacy policy',
  previewBanner: 'Admin preview. Forms you finish here are saved and tagged "admin-preview".',
  start: 'Start',
  comingSoon: 'This form is coming soon. Please check back.',
  loading: 'Loading',
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  back: 'Back',
  next: 'Next',
  backToReview: 'Back to review',
  errorSummary: 'Please fix these before you go on:',
  yes: 'Yes',
  no: 'No',
  chooseState: 'Choose a state',
  reviewTitle: 'Check your answers',
  reviewIntro: 'This is what goes on your form. Change anything that is not right.',
  edit: (title: string) => `Change ${title.toLowerCase()}`,
  notGiven: 'Not given',
  areaLine: (area: string, basis: string) => `Type of complaint: ${area}, ${basis}. This is already chosen on your form.`,
  consentTitle: 'Two optional choices',
  consentIntro: 'You do not need to check either box to get your form.',
  getForm: 'Get my form',
  working: 'Making your form',
  pdfFailed:
    'Something went wrong making your form. Please try again. If it keeps happening, you can fill in the blank form from the Attorney General instead:',
  blankForm: 'Blank form from the Attorney General (PDF)',
  tryAgain: 'Try again',
  doneTitle: 'Your form is ready',
  doneWarning: "Download or print it now. We can't show it to you again after you leave this page.",
  download: 'Download my form (PDF)',
  openToPrint: 'Open my form to print',
  nextStepsTitle: 'What to do next',
  nextSteps: [
    'Read your form. You can still change anything in it.',
    'Sign and date the last page.',
    'Send it to the Attorney General one of the ways below. We do not send it for you.',
  ],
  leaveWarning: 'Your answers are not saved anywhere you can come back to. Leave this page?',
} as const;

/** Shown on the first and last screens. */
export function disclaimer(config: StateConfig): string {
  return (
    `ADA Legal Link is not the ${config.agencyName}. We do not file this for you ` +
    'and we do not give legal advice. You review it, sign it, and send it yourself.'
  );
}

/**
 * The agency's own deadline wording, as a note. Takes the config only:
 * it never sees the person's dates, so it cannot tell anyone they are late.
 */
export function deadlineNote(config: StateConfig): string {
  const d = config.deadline;
  return `The ${config.agencyName} lists this time limit for ${d.area} complaints: ${d.limit}. ${d.from}.`;
}
