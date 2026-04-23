/**
 * startAdaSessionWithContext — shared helper for Talk-to-Ada CTAs that
 * open a chat session with page context pre-attached.
 *
 * POSTs /api/ada/session with a page_context payload so Ada's greeting
 * acknowledges the topic the user was reading about. The endpoint
 * sets the anon_session cookie; after it resolves, the caller should
 * navigate to /chat and the resume-session flow on that page will
 * adopt the newly-created session.
 *
 * On any error (network, non-2xx), we still navigate to /chat — the
 * user experience should never break because the context handshake
 * failed. They just land in the default chat.
 *
 * Step 29, Commit 5.
 */

export interface StartAdaSessionArgs {
  kind: 'chapter' | 'guide';
  ref: string;
  title: string;
  readingLevel?: 'simple' | 'standard' | 'professional';
}

export async function startAdaSessionWithContext(
  args: StartAdaSessionArgs,
): Promise<void> {
  try {
    await fetch('/api/ada/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        reading_level: args.readingLevel ?? 'standard',
        page_context: {
          kind: args.kind,
          ref: args.ref,
          title: args.title,
        },
      }),
    });
  } catch {
    // Swallow the error — navigation still happens. The worst-case
    // outcome is the user lands in /chat without topic acknowledgment,
    // which is the same as if they'd gone to /chat directly.
  }
}
