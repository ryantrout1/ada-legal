import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './app/App.js';
import { readSeedFromDocument } from './app/lib/litigationSeed.js';
import './app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Public pages are prerendered at build time (scripts/prerender.mjs) and
// carry data-prerendered. Hydrate those so the HTML stays on screen while the
// bundle loads. Every other route is served the empty app shell and renders
// from scratch, as it always has.
if (root.hasAttribute('data-prerendered')) {
  // Lawsuit pages carry the data they were rendered from; start from it.
  readSeedFromDocument();
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
