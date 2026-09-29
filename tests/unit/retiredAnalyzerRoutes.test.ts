/**
 * Model upgrade R1 follow-up: the retired photo analyzer paths redirect home
 * rather than render a blank page (the public tree has no catch-all).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app/App.tsx', 'utf8');

describe('retired photo analyzer routes', () => {
  it.each(['/photo', '/review', '/review/:id'])('%s redirects home', (path) => {
    expect(app).toContain(`<Route path="${path}" element={<Navigate to="/" replace />} />`);
  });
});
