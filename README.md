# ADA Legal Link

Free, plain-language ADA help for everyone. Public Ada conversations, attorney directory, and enterprise ADA intake infrastructure.

## Status

**Phase A — Foundation.** This repo is being rebuilt from the Base44 prototype onto a production stack (Vite + React + Vercel + Neon + Clerk + Anthropic). The current Base44 version continues to serve `adalegallink.com` until cutover.

The Base44 prototype code is preserved on the [`base44-archive`](https://github.com/ryantrout1/ada-legal/tree/base44-archive) branch.

## Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Hosting:** Vercel (serverless functions for the API layer)
- **Database:** Neon Postgres + pgvector
- **Auth:** Clerk (Organizations)
- **AI:** Anthropic Claude API (direct, tool-use)
- **Files:** Vercel Blob
- **Email:** Resend
- **Payments:** Stripe (Ch1+)
- **Tests:** Vitest + Playwright

## Getting started

```bash
npm install
npm run dev        # local dev server at :5173
npm run test       # Vitest unit + integration
npm run typecheck  # TS only, no emit
npm run build      # production build
```

## Docs

- `docs/ARCHITECTURE.md` — full technical design (Ch0 + Ch1)
- `docs/DO_NOT_TOUCH.md` — invariants the rebuild must preserve
- `content-migration/` — content and assets carried forward from the Base44 archive

## License

Proprietary — ADA Legal Link. All rights reserved.
