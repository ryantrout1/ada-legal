/**
 * reviewerNameFromEmail — derive a photo-review attribution name from a
 * Clerk email. The admin labeling page identifies reviewers by their
 * signed-in email; the public page identifies them by a self-picked name
 * ('Peter' | 'Gina' | 'Ryan'). To keep one attribution column consistent
 * across both, admin reviews store the capitalized local part of the email
 * (ryan@adalegallink.com -> 'Ryan'), which matches the public picker names.
 */
export function reviewerNameFromEmail(email: string | null | undefined): string {
  const local = (email ?? '').split('@')[0]?.trim();
  if (!local) return 'Unknown';
  return local.charAt(0).toUpperCase() + local.slice(1);
}
