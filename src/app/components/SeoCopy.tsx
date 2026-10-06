/**
 * SeoCopy — the reviewed search copy that sits at the end of a page.
 *
 * Reads the current path, looks it up in PAGE_COPY (src/lib/seo/pageCopy.ts)
 * and renders its markdown below the page's own content. It adds no h1 (the
 * page already has exactly one), only h2/h3, paragraphs, lists and links.
 *
 * Because it renders in PublicLayout, the prerender step includes it in the
 * static HTML, so crawlers see the text without running JavaScript.
 *
 * The markdown supported is the small set the copy uses: ## and ### headings,
 * paragraphs, "-" / "*" bullet lists, numbered lists, **bold** and
 * [text](/path) links.
 */

import { Fragment, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PAGE_COPY } from '../../lib/seo/pageCopy.js';
import { SPOT_DEFAULT_MAX_PHOTOS, SPOT_DEFAULT_PRICE_USD } from '../../lib/spot/spotOffer.js';

function fill(text: string): string {
  return text
    .replace(/\{\{SPOT_PRICE\}\}/g, String(SPOT_DEFAULT_PRICE_USD))
    .replace(/\{\{SPOT_PHOTOS\}\}/g, String(SPOT_DEFAULT_MAX_PHOTOS));
}

const LINK_STYLE = { color: 'var(--accent)', textDecoration: 'underline' } as const;

/** Inline: **bold** and [text](url). */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{m[1]}</strong>);
    } else {
      const href = m[3].replace(/^https?:\/\/(www\.)?adalegallink\.com/, '') || '/';
      out.push(
        href.startsWith('/') ? (
          <Link key={key} to={href} style={LINK_STYLE}>
            {m[2]}
          </Link>
        ) : (
          <a key={key} href={href} style={LINK_STYLE}>
            {m[2]}
          </a>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: 'h2' | 'h3' | 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      flushPara();
      flushList();
      blocks.push({ kind: m[1].length === 2 ? 'h2' : 'h3', text: m[2] });
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (!list || list.kind !== 'ul') {
        flushList();
        list = { kind: 'ul', items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      flushPara();
      if (!list || list.kind !== 'ol') {
        flushList();
        list = { kind: 'ol', items: [] };
      }
      list.items.push(m[1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export default function SeoCopy() {
  const { pathname } = useLocation();
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const copy = PAGE_COPY[key];
  if (!copy) return null;

  const blocks = parse(fill(copy.body));

  return (
    <div style={{ background: 'var(--page-bg)' }}>
      <section
        aria-label="More about this page"
        className="max-w-3xl mx-auto px-5 sm:px-8 py-12"
        style={{ color: 'var(--body)' }}
      >
        {blocks.map((b, idx) => {
          const k = `b${idx}`;
          switch (b.kind) {
            case 'h2':
              return (
                <h2
                  key={k}
                  className="text-2xl font-serif mt-8 mb-3"
                  style={{ color: 'var(--heading)' }}
                >
                  {inline(b.text, k)}
                </h2>
              );
            case 'h3':
              return (
                <h3
                  key={k}
                  className="text-xl font-serif mt-6 mb-2"
                  style={{ color: 'var(--heading)' }}
                >
                  {inline(b.text, k)}
                </h3>
              );
            case 'ul':
              return (
                <ul key={k} className="list-disc pl-6 my-4 space-y-2">
                  {b.items.map((it, j) => (
                    <li key={`${k}-${j}`}>{inline(it, `${k}-${j}`)}</li>
                  ))}
                </ul>
              );
            case 'ol':
              return (
                <ol key={k} className="list-decimal pl-6 my-4 space-y-2">
                  {b.items.map((it, j) => (
                    <li key={`${k}-${j}`}>{inline(it, `${k}-${j}`)}</li>
                  ))}
                </ol>
              );
            default:
              return (
                <p key={k} className="my-4 leading-relaxed">
                  <Fragment>{inline(b.text, k)}</Fragment>
                </p>
              );
          }
        })}
      </section>
    </div>
  );
}
