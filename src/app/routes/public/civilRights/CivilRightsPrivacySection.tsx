/**
 * The civil rights forms section of the privacy policy. Renders only when
 * the civil rights page is live (or on the admin preview, which passes
 * show), so the policy never describes a page the public cannot use.
 */

import { PRIVACY_SECTION } from '../../../../lib/civilRights/copy.js';
import { useCivilRightsEnabled } from '../../../hooks/useCivilRightsEnabled.js';

export function useCivilRightsPrivacyVisible(): boolean {
  return useCivilRightsEnabled() === 'on';
}

/** `show` comes from the page's single flag read (useCivilRightsPrivacyVisible). */
export function CivilRightsPrivacySection({ simple = false, show }: { simple?: boolean; show: boolean }) {
  if (!show) return null;
  const paras = simple ? PRIVACY_SECTION.simple : PRIVACY_SECTION.standard;
  return (
    <>
      <h2 id={PRIVACY_SECTION.id} className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        {simple ? PRIVACY_SECTION.simpleTitle : PRIVACY_SECTION.title}
      </h2>
      {paras.map((p, i) => (
        <p key={i} className={`text-ink-700 leading-relaxed ${i === paras.length - 1 ? 'mb-10' : 'mb-4'}`}>
          {p}
        </p>
      ))}
    </>
  );
}
