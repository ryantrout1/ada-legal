/**
 * The landing screen for /civil-rights/:state, built for campaign traffic:
 * someone taps a social post on their phone and lands here.
 *
 * Order: a hero that fits one phone screen with the Start button in it ->
 * "Is this for you?" (recognize yourself fast) -> how it works -> what you
 * get (the real agency form) -> the agency's time limit -> disclaimer and
 * privacy next to a second Start button. On phones a Start bar is pinned to
 * the bottom while neither Start button is on screen.
 *
 * AAA: tokens only. The hero is the header's navy with white text (14:1)
 * and a gold button with navy text (7.96:1, the header's own pairing; the
 * gold is the same in every theme and the navy only gets darker). 44px
 * targets, one h1, real headings and lists, icons aria-hidden. While the
 * pinned bar shows, the page reserves scroll padding under it so a focused
 * control is never hidden behind it (WCAG 2.4.12).
 *
 * No Ada or Spot links. Copy is DRAFT until Gina approves.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Clock, FileText, ListChecks, PenLine, MessageSquareText } from 'lucide-react';
import { UI, deadlineNote, disclaimer } from '../../../../lib/civilRights/copy.js';
import type { StateConfig } from '../../../../lib/civilRights/types.js';
import type { FlagState } from '../../../hooks/useCivilRightsEnabled.js';

const GOLD_BUTTON =
  'inline-flex min-h-[52px] items-center justify-center rounded-md bg-brand-gold px-7 py-3 font-chrome text-lg font-bold text-brand-navy hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy';

const ACCENT_BUTTON =
  'inline-flex min-h-[52px] items-center justify-center rounded-md bg-accent-500 px-7 py-3 font-chrome text-lg font-bold text-[color:var(--page-bg)] hover:bg-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50';

const STEP_ICONS = [MessageSquareText, ListChecks, PenLine];

interface Props {
  config: StateConfig;
  status: FlagState;
  onStart: () => void;
}

function StartControl({ status, onStart, onDark }: { status: FlagState; onStart: () => void; onDark: boolean }) {
  if (status === 'on') {
    return (
      <button type="button" className={onDark ? GOLD_BUTTON : ACCENT_BUTTON} onClick={onStart}>
        {UI.startCta}
      </button>
    );
  }
  const tone = onDark ? 'text-white' : 'text-ink-900';
  return (
    <p className={`text-lg font-medium ${tone}`} aria-live="polite">
      {status === 'off' ? UI.comingSoon : UI.loading}
    </p>
  );
}

export function CivilRightsLanding({ config, status, onStart }: Props) {
  const heroCta = useRef<HTMLDivElement>(null);
  const endCta = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [endVisible, setEndVisible] = useState(false);
  const showSticky = status === 'on' && !heroVisible && !endVisible;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const watch = (el: Element | null, set: (v: boolean) => void) => {
      if (!el) return null;
      const io = new IntersectionObserver(([e]) => set(e.isIntersecting));
      io.observe(el);
      return io;
    };
    const a = watch(heroCta.current, setHeroVisible);
    const b = watch(endCta.current, setEndVisible);
    return () => {
      a?.disconnect();
      b?.disconnect();
    };
  }, []);

  // Keep focused controls clear of the pinned bar while it shows.
  useEffect(() => {
    const root = document.documentElement;
    const before = root.style.scrollPaddingBottom;
    if (showSticky) root.style.scrollPaddingBottom = '96px';
    return () => {
      root.style.scrollPaddingBottom = before;
    };
  }, [showSticky]);

  return (
    <div className={showSticky ? 'pb-24 md:pb-0' : undefined}>
      {/* Hero */}
      <section className="bg-brand-navy" aria-labelledby="cr-hero-title">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
          <p className="font-chrome text-sm font-semibold uppercase tracking-[0.14em] text-brand-gold">
            {UI.heroEyebrow(config.name)}
          </p>
          <h1
            id="cr-hero-title"
            className="mt-3 font-display text-4xl leading-[1.1] tracking-tight text-white! sm:text-5xl"
          >
            {UI.heroTitle(config.name)}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white sm:text-xl">{UI.heroSub}</p>
          <div ref={heroCta} className="mt-8">
            <StartControl status={status} onStart={onStart} onDark />
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2" aria-label="About this form">
            {UI.heroFacts.map((f) => (
              <li key={f} className="flex items-center gap-2 text-base text-white">
                <CircleCheck aria-hidden="true" className="h-5 w-5 flex-none text-brand-gold" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {/* Is this for you? */}
        <section className="py-10 sm:py-14" aria-labelledby="cr-for-you">
          <h2 id="cr-for-you" className="font-display text-3xl text-ink-900">
            {UI.forYouTitle}
          </h2>
          <p className="mt-3 text-lg text-ink-700">{UI.forYouIntro}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {UI.forYou.map((s) => (
              <li
                key={s}
                className="flex items-start gap-3 rounded-lg border-2 border-control-border bg-surface-50 p-4 text-lg text-ink-900"
              >
                <CircleCheck aria-hidden="true" className="mt-0.5 h-6 w-6 flex-none text-accent-500" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-base text-ink-700">{UI.forYouNote}</p>
        </section>

        {/* How it works */}
        <section className="border-t border-surface-200 py-10 sm:py-14" aria-labelledby="cr-steps">
          <h2 id="cr-steps" className="font-display text-3xl text-ink-900">
            {UI.stepsTitle}
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {UI.steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={step.title} className="rounded-lg border border-surface-200 bg-surface-100 p-5">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-500 font-display text-lg font-bold text-[color:var(--page-bg)]"
                    >
                      {i + 1}
                    </span>
                    <Icon aria-hidden="true" className="h-6 w-6 text-accent-500" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-ink-900">{step.title}</h3>
                  <p className="mt-2 text-base text-ink-700">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* What you'll get */}
        <section className="border-t border-surface-200 py-10 sm:py-14" aria-labelledby="cr-get">
          <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 id="cr-get" className="font-display text-3xl text-ink-900">
                {UI.getTitle}
              </h2>
              <p className="mt-3 flex items-start gap-3 text-lg text-ink-700">
                <FileText aria-hidden="true" className="mt-1 h-6 w-6 flex-none text-accent-500" />
                {UI.getBody(config.formName, config.name)}
              </p>
            </div>
            <img
              src={config.pdf.previewImage}
              alt={UI.getImageAlt(config.formName, config.name)}
              width={520}
              height={673}
              loading="lazy"
              className="mx-auto w-48 rotate-[-2deg] rounded border border-surface-200 shadow-lg sm:w-56"
            />
          </div>
        </section>

        {/* Time limit */}
        <section className="pb-10 sm:pb-14" aria-labelledby="cr-deadline">
          <div className="flex items-start gap-4 rounded-lg border-2 border-warning-500 bg-surface-50 p-5">
            <Clock aria-hidden="true" className="mt-1 h-7 w-7 flex-none text-warning-500" />
            <div>
              <h2 id="cr-deadline" className="text-xl font-semibold text-ink-900">
                {UI.deadlineTitle}
              </h2>
              <p className="mt-1 text-lg text-ink-900">{deadlineNote(config)}</p>
            </div>
          </div>
        </section>

        {/* Ready */}
        <section className="border-t border-surface-200 py-10 sm:py-14" aria-labelledby="cr-ready">
          <h2 id="cr-ready" className="font-display text-3xl text-ink-900">
            {UI.readyTitle}
          </h2>
          <p className="mt-4 rounded-md border-2 border-control-border p-4 text-lg text-ink-900">
            {disclaimer(config)}
          </p>
          <p className="mt-4 text-base text-ink-700">
            {UI.privacyNote}{' '}
            <Link className="text-accent-500 underline" to="/privacy">
              {UI.privacyLink}
            </Link>
          </p>
          <div ref={endCta} className="mt-8">
            <StartControl status={status} onStart={onStart} onDark={false} />
          </div>
        </section>
      </div>

      {/* Pinned Start bar on phones. The button stops short of the right
          edge so the site's floating Feedback button (fixed, bottom-right)
          sits in the bar beside it instead of on top of it. */}
      {showSticky ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-navy-hover bg-brand-navy px-5 py-3 md:hidden">
          <button
            type="button"
            className={`${GOLD_BUTTON} w-[calc(100%-9rem)]`}
            onClick={onStart}
          >
            {UI.startCta}
          </button>
        </div>
      ) : null}
    </div>
  );
}
