/**
 * Civil rights complaint page: the public route.
 *
 * Encodes /plan "State civil rights complaint page" Phase 3:
 *   AC1  /civil-rights picker, /civil-rights/arizona page, az alias redirects
 *   AC11 isolated (no Ada/Spot links), disclaimer on first and last screens
 *   AC12 flag off -> no Start button; only `true` turns it on
 */

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { readFileSync } from 'node:fs';
import CivilRightsPage from '../../src/app/routes/public/civilRights/CivilRightsPage.js';
import { resolveCivilRightsEnabled } from '../../src/lib/site/civilRightsFlag.js';
import { AZ } from '../../src/lib/civilRights/states/az.js';
import { disclaimer, UI } from '../../src/lib/civilRights/copy.js';

function render(path: string): string {
  return renderToStaticMarkup(
    createElement(
      HelmetProvider,
      null,
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(
          Routes,
          null,
          createElement(Route, { path: '/civil-rights', element: createElement(CivilRightsPage) }),
          createElement(Route, { path: '/civil-rights/:state', element: createElement(CivilRightsPage) }),
        ),
      ),
    ),
  );
}

const PAGE_FILES = [
  'src/app/routes/public/civilRights/CivilRightsPage.tsx',
  'src/app/routes/public/civilRights/CivilRightsLanding.tsx',
  'src/app/routes/public/civilRights/CivilRightsWizard.tsx',
  'src/app/routes/public/civilRights/FieldInput.tsx',
];

describe('/civil-rights routes (AC1)', () => {
  it('the picker lists Arizona and links to the canonical page', () => {
    const html = render('/civil-rights');
    expect(html).toContain(UI.pickerTitle);
    expect(html).toContain('href="/civil-rights/arizona"');
    expect(html).toContain(UI.pickerMore);
  });

  it('/civil-rights/arizona renders the Arizona intro', () => {
    const html = render('/civil-rights/arizona');
    expect(html).toContain(UI.heroTitle('Arizona'));
    expect(html).toContain(UI.forYouTitle);
    expect(html).toContain('/forms/az/form-page-1.png');
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
  });

  it('an unknown state shows the picker with a plain note', () => {
    const html = render('/civil-rights/texas');
    expect(html).toContain(UI.pickerUnknown.replace(/'/g, '&#x27;'));
    expect(html).toContain('href="/civil-rights/arizona"');
  });

  it('vercel.json sends /civil-rights/az to /civil-rights/arizona permanently', () => {
    const cfg = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      redirects: { source: string; destination: string; permanent: boolean }[];
    };
    expect(cfg.redirects).toContainEqual({
      source: '/civil-rights/az',
      destination: '/civil-rights/arizona',
      permanent: true,
    });
  });
});

describe('isolation and disclaimer (AC11)', () => {
  it('the first screen shows the disclaimer and the deadline note', () => {
    const html = render('/civil-rights/arizona');
    expect(html).toContain(disclaimer(AZ).replace(/'/g, '&#x27;'));
    expect(html).toContain('180 days');
  });

  it('the last screen renders the disclaimer too', () => {
    const src = readFileSync(PAGE_FILES[2], 'utf8');
    const done = src.slice(src.indexOf('// ── Done'));
    expect(done).toContain('disclaimer(config)');
    expect(done).toContain('UI.doneWarning');
  });

  it('no links or promos to Ada or Spot, and no AI', () => {
    for (const f of PAGE_FILES) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/["'`]\/(ada|spot)\b/);
      expect(src, f).not.toMatch(/@anthropic-ai|\/api\/ada|\/api\/spot|useUniversalCta/);
    }
    const html = render('/civil-rights/arizona');
    expect(html).not.toMatch(/href="\/(ada|spot)/);
  });

  it('the step never goes in the URL', () => {
    const src = readFileSync(PAGE_FILES[2], 'utf8');
    expect(src).not.toMatch(/useNavigate|useSearchParams|history\.(push|replace)State|localStorage|sessionStorage/);
  });
});

describe('launch flag (AC12)', () => {
  it('before the flag answers, there is no Start button', () => {
    const html = render('/civil-rights/arizona');
    expect(html).not.toContain(`>${UI.startCta}<`);
    expect(html).toContain('noindex');
  });

  it('only a literal true turns the page on', () => {
    expect(resolveCivilRightsEnabled({ civil_rights_enabled: true })).toBe(true);
    expect(resolveCivilRightsEnabled({ civil_rights_enabled: 'true' })).toBe(false);
    expect(resolveCivilRightsEnabled({})).toBe(false);
    expect(resolveCivilRightsEnabled(null)).toBe(false);
  });

  it('site-flags serves the flag and fails closed', () => {
    const src = readFileSync('api/public/site-flags.ts', 'utf8');
    expect(src).toContain('civil_rights_enabled: civilRightsEnabled');
    expect(src).toMatch(/civilRightsEnabled = false;\n/);
  });
});
