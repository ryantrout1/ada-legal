import { describe, it, expect } from 'vitest';
import { buildSpotCheckoutParams, resolveSpotCheckoutEvent } from '@/lib/spot/spotStripe';
import type { StripeWebhookEvent } from '@/engine/clients/stripeClient';

describe('buildSpotCheckoutParams', () => {
  const params = buildSpotCheckoutParams({ spotSessionId: 'sess-1', priceCents: 7900 });

  it('is a one-time, on-page embedded payment (no redirect)', () => {
    expect(params.get('mode')).toBe('payment');
    expect(params.get('ui_mode')).toBe('embedded_page');
    expect(params.get('redirect_on_completion')).toBe('never');
  });

  it('sets the amount server-side and echoes the spot session id in metadata', () => {
    expect(params.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('7900');
    expect(params.get('line_items[0][quantity]')).toBe('1');
    expect(params.get('metadata[spot_session_id]')).toBe('sess-1');
    // also on the payment intent so a PI-side event can still be correlated
    expect(params.get('payment_intent_data[metadata][spot_session_id]')).toBe('sess-1');
  });

  it('honors a $49 fallback price', () => {
    const p = buildSpotCheckoutParams({ spotSessionId: 's', priceCents: 4900 });
    expect(p.get('line_items[0][price_data][unit_amount]')).toBe('4900');
  });
});

function completedEvent(object: Record<string, unknown>): StripeWebhookEvent {
  return { id: 'evt_1', type: 'checkout.session.completed', created: 1, data: { object } };
}

describe('resolveSpotCheckoutEvent', () => {
  it('resolves a completed Spot checkout into the session id + payment details', () => {
    const out = resolveSpotCheckoutEvent(
      completedEvent({
        metadata: { spot_session_id: 'sess-9' },
        payment_intent: 'pi_123',
        amount_total: 7900,
        customer_details: { email: 'owner@shop.example' },
      }),
    );
    expect(out).toEqual({
      spotSessionId: 'sess-9',
      paymentIntentId: 'pi_123',
      email: 'owner@shop.example',
      amountCents: 7900,
    });
  });

  it('returns null for a non-checkout-completed event', () => {
    const evt = { ...completedEvent({}), type: 'customer.subscription.updated' };
    expect(resolveSpotCheckoutEvent(evt)).toBeNull();
  });

  it('returns null for a checkout WITHOUT a spot_session_id (a firm-subscription event — firewall)', () => {
    expect(resolveSpotCheckoutEvent(completedEvent({ metadata: { lawFirmId: 'firm-1' } }))).toBeNull();
    expect(resolveSpotCheckoutEvent(completedEvent({}))).toBeNull();
  });
});
