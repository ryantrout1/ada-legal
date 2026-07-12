/**
 * SpotCheckout — on-page Embedded Stripe Checkout (Ada Spot 2a).
 *
 * Mounts Stripe's embedded form inline (no redirect, card data stays in
 * Stripe's iframe — SAQ-A). On completion it does NOT trust the client: it
 * polls /api/spot/session-status until the server (advanced only by the
 * verified webhook) reports paid, then hands the session id up.
 */

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const PAID_STATES = new Set(['paid', 'uploaded', 'in_review', 'delivered']);

export default function SpotCheckout({ onPaid }: { onPaid: (spotSessionId: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let instance: { destroy: () => void } | null = null;

    async function pollPaid() {
      const id = sessionIdRef.current;
      if (!id) return;
      for (let i = 0; i < 30 && !cancelled; i++) {
        try {
          const res = await fetch(`/api/spot/session-status?id=${encodeURIComponent(id)}`);
          if (res.ok) {
            const { status } = (await res.json()) as { status: string };
            if (PAID_STATES.has(status)) {
              if (!cancelled) onPaid(id);
              return;
            }
          }
        } catch {
          /* transient — keep polling */
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) {
        setError(
          "Payment is taking longer than expected to confirm. If you were charged, your report is still on the way — we'll email it.",
        );
      }
    }

    (async () => {
      if (!PUBLISHABLE_KEY) {
        setError('Payments are not configured yet.');
        return;
      }
      try {
        const stripe = await loadStripe(PUBLISHABLE_KEY);
        if (!stripe || cancelled) return;
        const embedded = await stripe.createEmbeddedCheckoutPage({
          fetchClientSecret: async () => {
            const res = await fetch('/api/spot/create-checkout', { method: 'POST' });
            if (!res.ok) throw new Error('create-checkout failed');
            const data = (await res.json()) as { clientSecret: string; spotSessionId: string };
            sessionIdRef.current = data.spotSessionId;
            return data.clientSecret;
          },
          onComplete: () => {
            setConfirming(true);
            void pollPaid();
          },
        });
        if (cancelled) {
          embedded.destroy();
          return;
        }
        instance = embedded;
        if (containerRef.current) embedded.mount(containerRef.current);
      } catch {
        if (!cancelled) setError('Could not start checkout. Please try again.');
      }
    })();

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [onPaid]);

  if (error) {
    return (
      <p role="alert" className="mt-4 text-sm text-danger-500">
        {error}
      </p>
    );
  }
  if (confirming) {
    return (
      <p className="mt-4 text-ink-700" aria-live="polite">
        Confirming your payment…
      </p>
    );
  }
  return <div ref={containerRef} className="mt-4" />;
}
