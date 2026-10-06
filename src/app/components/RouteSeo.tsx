/**
 * RouteSeo: the title, description, canonical URL and social tags for every
 * public page that has an entry in src/lib/seo/routeMeta.ts.
 *
 * Mounted once in PublicLayout. Routes with no entry (lawsuit detail,
 * /s/:slug, /spot/r/:slug, not-found guides) render nothing here and keep
 * whatever their own <Helmet> sets.
 *
 * This is also what the build prerenders into each page's static HTML, so
 * the tags a crawler reads without JavaScript are the same ones the browser
 * ends up with.
 */

import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { routeMeta } from '../../lib/seo/routeMeta.js';
import { PUBLIC_ORIGIN } from '../../lib/publicOrigin.js';

export default function RouteSeo() {
  const { pathname } = useLocation();
  const meta = routeMeta(pathname);
  if (!meta) return null;

  const url = `${PUBLIC_ORIGIN}${meta.path}`;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={meta.ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}
