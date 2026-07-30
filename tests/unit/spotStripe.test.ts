import { describe, it, expect } from 'vitest';
import { buildSpotCheckoutParams, resolveSpotCheckoutEvent } from '@/lib/spot/spotStripe';
import type { StripeWebhookEvent } from '@/engine/clients/stripeClient';

describe('buildSpotCheckoutParams', () => {
  const params = buildSpotCheckoutParams({ spotSessionId: 'sess-1', priceCents: 9900 });

  it('is a one-time, on-page embedded payment (no redirect)', () => {
    expect(params.get('mode')).toBe('payment');
    expect(params.get('ui_mode')).toBe('embedded_page');
    expect(params.get('redirect_on_completion')).toBe('never');
  });

  it('sets the amount server-side and echoes the spot session id in metadata', () => {
    expect(params.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('9900');
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
        amount_total: 9900,
        customer_details: { email: 'owner@shop.example' },
      }),
    );
    expect(out).toEqual({
      spotSessionId: 'sess-9',
      paymentIntentId: 'pi_123',
      email: 'owner@shop.example',
      amountCents: 9900,
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

/**
 * The buyer's name — /plan capture the buyer's name, phase 1.
 *
 * Stripe collects the cardholder name for card payments in `payment` mode
 * without being asked, and puts it on customer_details.name. This resolver
 * read the email off that object and dropped everything else, which is why
 * spot_session.buyer_name has existed since the schema was written and never
 * held a value.
 *
 * The branches below are the point. `customer_details` is typed `unknown` at
 * this boundary because it is whatever Stripe sent, and a name arriving as a
 * number, a null or three spaces must become undefined rather than reaching
 * an admin list as "undefined" or a blank the reader cannot distinguish from
 * an absent one.
 */
describe('resolveSpotCheckoutEvent — buyer name', () => {
  const withDetails = (details: unknown) =>
    resolveSpotCheckoutEvent(
      completedEvent({
        metadata: { spot_session_id: 'sess-9' },
        customer_details: details,
      }),
    );

  it('takes the cardholder name Stripe already sends', () => {
    expect(withDetails({ email: 'a@b.example', name: 'Dana Okonkwo' })?.name).toBe(
      'Dana Okonkwo',
    );
  });

  it('trims it', () => {
    expect(withDetails({ name: '  Dana Okonkwo  ' })?.name).toBe('Dana Okonkwo');
  });

  it('is undefined when Stripe sent no name', () => {
    expect(withDetails({ email: 'a@b.example' })?.name).toBeUndefined();
    expect(withDetails(undefined)?.name).toBeUndefined();
  });

  it('is undefined for a blank or whitespace-only name', () => {
    expect(withDetails({ name: '' })?.name).toBeUndefined();
    expect(withDetails({ name: '   ' })?.name).toBeUndefined();
  });

  it('is undefined for anything that is not a string', () => {
    for (const name of [42, null, {}, ['Dana'], true]) {
      expect(withDetails({ name })?.name, JSON.stringify(name)).toBeUndefined();
    }
  });

  it('does not disturb the email it was already reading', () => {
    const out = withDetails({ email: 'owner@shop.example', name: 'Dana Okonkwo' });
    expect(out?.email).toBe('owner@shop.example');
  });
});
