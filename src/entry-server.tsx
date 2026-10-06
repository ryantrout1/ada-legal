/**
 * Server entry for build-time prerendering. Not used at runtime on Vercel:
 * scripts/prerender.mjs imports the built bundle (dist-ssr/entry-server.js)
 * once per public route and writes the result into dist/.
 */

import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { Writable } from 'node:stream';
import { AppRoutes } from './app/App.js';
import { ROUTE_META } from './lib/seo/routeMeta.js';

export { ROUTE_META };

export interface RenderResult {
  html: string;
  helmet: {
    title: string;
    meta: string;
    link: string;
    script: string;
  };
}

export async function render(url: string): Promise<RenderResult> {
  const helmetContext: { helmet?: HelmetServerState } = {};

  const html = await new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];
    const sink = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(chunk.toString());
        cb();
      },
      final(cb) {
        resolve(chunks.join(''));
        cb();
      },
    });
    const { pipe } = renderToPipeableStream(
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </HelmetProvider>,
      {
        // Wait for every Suspense boundary (the guide and chapter bodies
        // are React.lazy) so the HTML carries the real text, not a
        // "Loading…" fallback.
        // Never outline a finished boundary behind its fallback: crawlers
        // that do not run JS would see "Loading…" instead of the page.
        progressiveChunkSize: Infinity,
        onAllReady() {
          pipe(sink);
        },
        onShellError: reject,
        onError(err) {
          reject(err);
        },
      },
    );
  });

  const h = helmetContext.helmet;
  return {
    html,
    helmet: {
      title: h?.title.toString() ?? '',
      meta: h?.meta.toString() ?? '',
      link: h?.link.toString() ?? '',
      script: h?.script.toString() ?? '',
    },
  };
}
