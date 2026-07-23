/**
 * trackEvent — client-side analytics.
 *
 * Ported from Base44 (src/components/analytics/trackEvent.jsx @ 6b1e9ac),
 * which dual-wrote to base44.analytics.track AND an AnalyticsEvent
 * entity. There is no second analytics system here; Neon is it, so this
 * is a single POST to /api/public/events.
 *
 * FIRE AND FORGET, in the strong sense: this function returns void, not
 * a promise, and swallows every failure. Nothing on a page should ever
 * await telemetry or branch on whether it succeeded. B44 got this right
 * with a bare `.catch(() => {})` and the shape is preserved.
 *
 * SSR-safe: no-ops when there is no window, so a future prerender pass
 * does not fire phantom events at build time.
 */

const ENDPOINT = '/api/public/events';

export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  page = '',
): void {
  if (typeof window === 'undefined') return;
  if (!eventName) return;

  const pageName =
    page || window.location.pathname.replace(/^\//, '') || 'Home';

  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        properties,
        page: pageName,
      }),
      // Survives navigation: a click that routes away should still
      // report. Without this the most interesting events are the ones
      // most likely to be lost.
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never throws into the caller.
  }
}

export default trackEvent;
