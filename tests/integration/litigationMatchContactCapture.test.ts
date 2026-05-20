/**
 * Integration test — litigation_match name-early / contact-late prompt (criterion 5).
 *
 * The prompt's *behavioral* effect on Ada (does she actually ask for the name
 * early?) is only verifiable with a real LLM conversation — that's the manual
 * "Niles v. Hilton" recipe check (approval note 4) + the runtime recipe in the
 * design. What's deterministically automatable is that the identity-collection
 * block shipped into the consumed prompt and is correctly scoped (DO4:
 * litigation-match flow only), without regressing the verbatim-first-question
 * hard rule. This is the ATDD anchor for the Phase 5 prompt change.
 *
 * Ref: .design/attorney-portal.md Phase 5; DO4; approval note 4.
 */

import { describe, it, expect } from 'vitest';
import adaIdentity from '../../content-migration/prompts/ada-identity.js';

describe('litigation_match contact-capture prompt (criterion 5)', () => {
  it('ships the name-early / contact-late identity-collection block', () => {
    expect(adaIdentity).toContain('Identity collection (litigation-match flow only)');
    expect(adaIdentity).toContain('claimant_name');
    expect(adaIdentity).toContain('claimant_email');
    expect(adaIdentity).toContain('claimant_phone');
  });

  it('collects the name BEFORE match_litigation (early) and contact AFTER the qualifying questions (late)', () => {
    // Name is collected before the binding tool fires.
    expect(adaIdentity).toMatch(/before .*`?match_litigation`?|BEFORE .*`?match_litigation`?/);
    // Contact (email/phone) is collected after the qualifying questions.
    expect(adaIdentity).toMatch(/after (the )?(last |all )?qualifying questions/i);
    // Email comes before phone wording, phone marked optional.
    const emailIdx = adaIdentity.indexOf('claimant_email');
    const phoneIdx = adaIdentity.indexOf('claimant_phone');
    expect(emailIdx).toBeGreaterThan(0);
    expect(phoneIdx).toBeGreaterThan(emailIdx);
    expect(adaIdentity.toLowerCase()).toContain('optional');
  });

  it('scopes the rule to the litigation-match flow only (Title III intake unchanged)', () => {
    expect(adaIdentity).toContain('litigation-match flow only');
    expect(adaIdentity.toLowerCase()).toContain('title iii generic intake keeps its own');
  });

  it('does not regress the verbatim-first-question hard rule', () => {
    expect(adaIdentity).toContain('the qualifying questions ARE the list');
    // The block explicitly reconciles name-collection with the verbatim rule.
    expect(adaIdentity.toLowerCase()).toMatch(/does not violate the verbatim/);
  });
});
