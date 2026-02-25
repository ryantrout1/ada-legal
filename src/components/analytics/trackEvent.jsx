import { base44 } from '@/api/base44Client';

/**
 * Dual-write analytics: fires base44.analytics.track AND creates an AnalyticsEvent entity record.
 * @param {string} eventName
 * @param {object} properties
 * @param {string} page - current page name
 */
export default function trackEvent(eventName, properties = {}, page = '') {
  // Fire the built-in analytics
  base44.analytics.track({ eventName, properties });

  // Also persist to AnalyticsEvent entity
  const pageName = page || (typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') || 'Home' : 'unknown');
  
  base44.entities.AnalyticsEvent.create({
    event_name: eventName,
    properties,
    page: pageName,
    timestamp: new Date().toISOString()
  }).catch(() => {});
}