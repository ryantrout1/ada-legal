/**
 * Title for a lawsuit detail page, kept to 60 characters.
 *
 * Case names run up to about 75 characters, so "<name> | ADA Legal Link"
 * does not always fit. Preference order: name plus brand, then the bare
 * name, then the name cut at a word boundary with an ellipsis. Shared by
 * the page (browser tab and prerendered HTML) so they cannot differ.
 *
 * Node-runtime rules (docs/DO_NOT_TOUCH.md Rule 13): no aliases.
 */

export const TITLE_MAX = 60;
const BRAND_SUFFIX = ' | ADA Legal Link';

export function lawsuitTitle(caseName: string): string {
  const name = caseName.trim().replace(/\s+/g, ' ');
  if (name.length + BRAND_SUFFIX.length <= TITLE_MAX) return name + BRAND_SUFFIX;
  if (name.length <= TITLE_MAX) return name;
  const cut = name.slice(0, TITLE_MAX - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 30 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:(\-]+$/, '')}…`;
}
