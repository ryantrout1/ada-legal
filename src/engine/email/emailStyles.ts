/**
 * The colours and metrics every transactional email renders with.
 *
 * Emails cannot use the design token system — a mail client strips stylesheets
 * and custom properties, so inline hex is the only thing that survives. That
 * exemption is real, but it was being used as a licence to eyeball values, and
 * two renderers drifted under the AAA floor independently. The Spot release
 * email shipped its retention line at 2.40:1 and its disclaimer at 4.45:1;
 * the self-help email's footer sits at 3.32:1.
 *
 * So the values live here once and `emailContrast.test.ts` computes the real
 * WCAG ratio for every declared pair. A colour that is not declared here is a
 * colour nobody is checking, which is why `spotReleaseEmail.test.ts` also
 * fails a renderer that draws any hex from outside this list.
 *
 * All ratios below are against EMAIL_BG.
 *
 * Ref: /plan phase 1 (Spot release email).
 */

/** Page background. Matches the site's --page so the two feel like one product. */
export const EMAIL_BG = '#faf7f2';

/** Headings. 13.69:1. */
export const EMAIL_INK = '#1e293b';

/** Body text. 9.69:1. */
export const EMAIL_BODY = '#334155';

/**
 * Small print — disclaimers, retention. 8.30:1.
 *
 * Lighter than body for hierarchy, and still clear of 7:1. The previous
 * "muted" was #94a3b8, which is hierarchy achieved by making the text nearly
 * invisible; on a product for disabled people that is the wrong trade.
 */
export const EMAIL_MUTED = '#3f4b5b';

/**
 * Primary button fill. White label on it is 8.59:1; the fill itself is 8.04:1
 * against the page, well past the 3:1 a non-text element needs.
 *
 * accent-600 (#9c340a) also clears both, at 7.22 and 6.75 — but only just, and
 * mail clients re-render colour far more aggressively than browsers do. The
 * darker fill buys margin for nothing.
 */
export const EMAIL_BUTTON_BG = '#8a2c08';
export const EMAIL_BUTTON_TEXT = '#ffffff';

/**
 * Inline link text. Same value as the button fill — one accent, used two ways.
 * 8.04:1, so it clears AAA as normal-weight body text, which a link inside a
 * paragraph is. The old #c2410c was 4.85:1 and the old #0066cc is 5.15:1;
 * both are the shade of orange or blue that reads as "link" and neither
 * survives the 7:1 floor.
 */
export const EMAIL_LINK = EMAIL_BUTTON_BG;

/**
 * Hairline rules between sections.
 *
 * Deliberately NOT a declared contrast pair. WCAG 1.4.11 covers graphics
 * needed to understand the content; a decorative separator that carries no
 * information is exempt, and holding it to 3:1 would make it a heavy black
 * bar. It lives in the palette so the renderers can use it without tripping
 * the stray-hex guard, and this comment is the record of why it has no pair.
 */
export const EMAIL_RULE = '#d9d2c7';

/**
 * The handoff emails' surface.
 *
 * A second background is a cost — every colour needs a pair against each
 * surface it can sit on, and pairing against the wrong one is a real way to
 * ship a failure that the test says passed. It stays because the handoff pair
 * has rendered on this grey since it was written and this change is about
 * contrast, not about restyling attorney-facing mail. Collapsing both surfaces
 * onto EMAIL_BG is the obvious follow-up whenever someone is looking at these
 * emails anyway.
 */
export const EMAIL_BG_ALT = '#f6f6f6';

/** Callout block behind a warning line in the firm handoff. */
export const EMAIL_WARN_BG = '#fff5e5';

/**
 * The callout's left border. 3.05:1 on EMAIL_WARN_BG.
 *
 * Held to 3:1 rather than 7:1 and paired as non-text: it is the only thing
 * marking the block as a callout, so 1.4.11 applies to it, but it carries no
 * text of its own. The previous #d48200 was 2.78:1 — below even that.
 */
export const EMAIL_WARN_BORDER = '#8a5000';

/** Every hex any email renderer is allowed to emit. */
export const EMAIL_PALETTE = [
  EMAIL_BG,
  EMAIL_INK,
  EMAIL_BODY,
  EMAIL_MUTED,
  EMAIL_BUTTON_BG,
  EMAIL_BUTTON_TEXT,
  EMAIL_RULE,
  EMAIL_BG_ALT,
  EMAIL_WARN_BG,
  EMAIL_WARN_BORDER,
] as const;

/**
 * Button metrics.
 *
 * Vertical padding plus line-height rather than min-height: Outlook ignores
 * min-height on an anchor, so a target declared that way is 44px everywhere
 * except the client most likely to be reading it.
 */
export const EMAIL_BUTTON_PADDING_Y = 14;
export const EMAIL_BUTTON_PADDING_X = 24;
export const EMAIL_BUTTON_LINE_HEIGHT = 20;
/** 48px — the real tappable height. */
export const EMAIL_BUTTON_TARGET_PX =
  EMAIL_BUTTON_PADDING_Y * 2 + EMAIL_BUTTON_LINE_HEIGHT;

export interface EmailContrastPair {
  name: string;
  fg: string;
  bg: string;
  /** 7 for text (AAA), 3 for non-text (1.4.11). */
  min: number;
  kind: 'text' | 'non-text';
}

/**
 * The pairs that must hold. Declaring a pair here is how a colour gets
 * measured — the test iterates this list, not the palette, because a hex on
 * its own has no contrast until you say what it sits on.
 */
export const EMAIL_CONTRAST_PAIRS: readonly EmailContrastPair[] = [
  { name: 'heading', fg: EMAIL_INK, bg: EMAIL_BG, min: 7, kind: 'text' },
  { name: 'body', fg: EMAIL_BODY, bg: EMAIL_BG, min: 7, kind: 'text' },
  { name: 'muted', fg: EMAIL_MUTED, bg: EMAIL_BG, min: 7, kind: 'text' },
  { name: 'button label', fg: EMAIL_BUTTON_TEXT, bg: EMAIL_BUTTON_BG, min: 7, kind: 'text' },
  { name: 'button fill', fg: EMAIL_BUTTON_BG, bg: EMAIL_BG, min: 3, kind: 'non-text' },
  { name: 'link', fg: EMAIL_LINK, bg: EMAIL_BG, min: 7, kind: 'text' },

  // The handoff surface. Same foregrounds, different ground — so they are
  // measured again rather than assumed to carry over.
  { name: 'heading on alt surface', fg: EMAIL_INK, bg: EMAIL_BG_ALT, min: 7, kind: 'text' },
  { name: 'body on alt surface', fg: EMAIL_BODY, bg: EMAIL_BG_ALT, min: 7, kind: 'text' },
  { name: 'muted on alt surface', fg: EMAIL_MUTED, bg: EMAIL_BG_ALT, min: 7, kind: 'text' },
  { name: 'link on alt surface', fg: EMAIL_LINK, bg: EMAIL_BG_ALT, min: 7, kind: 'text' },
  { name: 'callout text', fg: EMAIL_INK, bg: EMAIL_WARN_BG, min: 7, kind: 'text' },
  { name: 'callout border', fg: EMAIL_WARN_BORDER, bg: EMAIL_WARN_BG, min: 3, kind: 'non-text' },
];
