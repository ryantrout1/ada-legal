/**
 * LawsuitCard — one litigation row in the Active Cases grid.
 *
 * Ported from Base44 (src/components/public/LawsuitCard.jsx @ 6b1e9ac,
 * which carries B44's 2026-07-08 grid-cohesion pass). Design authority
 * is B44; changes are confined to the port seams:
 *   - payload is camelCase from /api/public/litigation, not the
 *     snake_case Litigation entity
 *   - flat `createPageUrl('LawsuitDetail?slug=…')` → nested `/lawsuits/:slug`
 *   - hardcoded hex fallbacks dropped in favor of the tokens alone
 *
 * The fixed two-row header (status pill on its own line, kind label
 * always beneath) is B44's and is load-bearing: it makes every card's
 * header the same height regardless of label length, so titles align
 * across the grid instead of wrapping unpredictably.
 */

import { Link } from 'react-router-dom';
import { statesList, statesLabel } from '../../lib/litigationLabels.js';
import { pickReadingLevelText } from '../../lib/readingLevelText.js';
import { useReadingLevel } from '../standards/ReadingLevelContext.js';
import { StateChip, StatusBadge, KindLabel, chipListStyle } from './LitigationChips.js';
import type { PublicLawsuitRow } from '../../lib/lawsuitTypes.js';

export default function LawsuitCard({ row }: { row: PublicLawsuitRow }) {
  const { readingLevel } = useReadingLevel();
  const states = statesList(row.affectedStates);
  const isNationwideRow = states.length === 0;
  const shortDescription = pickReadingLevelText(
    row as unknown as Record<string, unknown>,
    'shortDescription',
    readingLevel,
  );

  return (
    <article
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 14,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 2px rgba(30,41,59,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          alignItems: 'flex-start',
        }}
      >
        <StatusBadge status={row.status} />
        <KindLabel kind={row.kind} />
      </div>

      <h2
        style={{
          margin: 0,
          fontFamily: 'Manrope, sans-serif',
          fontSize: '1.1875rem',
          fontWeight: 500,
          color: 'var(--heading)',
          lineHeight: 1.3,
        }}
      >
        {row.caseName}
      </h2>

      {shortDescription && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Manrope, sans-serif',
            color: 'var(--body)',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
          }}
        >
          {shortDescription}
        </p>
      )}

      <ul aria-label="Affected states" style={chipListStyle()}>
        {isNationwideRow ? (
          <StateChip>{statesLabel(row.affectedStates)}</StateChip>
        ) : (
          states.map((st) => <StateChip key={st}>{st}</StateChip>)
        )}
      </ul>

      {row.court && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.8125rem',
            color: 'var(--body-secondary)',
          }}
        >
          {row.court}
        </p>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
        <Link
          className="lawsuit-card-link"
          to={`/lawsuits/${encodeURIComponent(row.slug)}`}
          aria-label={`View details for ${row.caseName}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            padding: '0 0.25rem',
            borderRadius: 8,
            color: 'var(--link)',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
