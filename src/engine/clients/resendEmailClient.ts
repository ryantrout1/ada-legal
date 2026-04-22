/**
 * Resend email client.
 *
 * Step 24. Calls the Resend HTTP API directly via fetch. We don't use
 * the resend-node SDK because the API surface we need is trivial
 * (single POST to /emails) and adding the SDK bundles ~50KB of axios +
 * polyfills we don't use elsewhere.
 *
 * Retry policy: one retry on network error or 5xx, no retry on 4xx
 * (those are caller bugs — bad token, bad from address, etc.). We'd
 * rather surface a clear error than silently swallow a delivery
 * failure.
 *
 * Stub variant exists so that when RESEND_API_KEY is not configured,
 * the turn-time surface still has an EmailClient implementation —
 * just one that throws with a clear error message when invoked.
 *
 * Ref: Step 24, Commit 2.
 */

import type {
  EmailClient,
  EmailSendOptions,
} from './types.js';

export class ResendEmailClient implements EmailClient {
  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
  ) {}

  async send(opts: EmailSendOptions): Promise<{ id: string }> {
    const body: Record<string, unknown> = {
      from: this.fromAddress,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    };
    if (opts.text) body.text = opts.text;
    if (opts.replyTo) body.reply_to = opts.replyTo;

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const json = (await res.json()) as { id?: string };
          if (!json.id) {
            throw new Error('Resend response missing id field.');
          }
          return { id: json.id };
        }
        // Don't retry 4xx — those are our bugs (bad token, bad from).
        // Use a non-retry sentinel so the outer catch knows to rethrow
        // rather than retry.
        if (res.status >= 400 && res.status < 500) {
          const text = await res.text().catch(() => '');
          throw new NonRetriableResendError(
            `Resend ${res.status}: ${text.slice(0, 200)}`,
          );
        }
        // 5xx: record the error, loop will retry.
        lastError = new Error(`Resend ${res.status}`);
      } catch (err) {
        // If the error is marked non-retriable, surface immediately.
        if (err instanceof NonRetriableResendError) {
          throw err;
        }
        lastError = err;
        if (attempt === 1) break;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Resend send failed after retry.');
  }
}

/** Signals a 4xx response that should not be retried. */
class NonRetriableResendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetriableResendError';
  }
}

export class StubResendEmailClient implements EmailClient {
  async send(_opts: EmailSendOptions): Promise<{ id: string }> {
    throw new Error(
      'EmailClient: RESEND_API_KEY is not configured. Set it in Vercel env.',
    );
  }
}
