/**
 * Diagnostic endpoint — zero imports from src/, zero third-party deps
 * other than @vercel/node types. Verifies that the Vercel Node runtime
 * is serving THIS file correctly. If this 200s and /api/ada/session
 * 500s, we know the issue is transitive imports.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    runtime: 'nodejs',
    cwd: process.cwd(),
    nodeVersion: process.version,
    time: new Date().toISOString(),
  });
}
