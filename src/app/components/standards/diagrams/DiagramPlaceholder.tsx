/**
 * DiagramPlaceholder — the shared visual shown on chapter pages while
 * a specific diagram hasn't been ported from base44-archive yet.
 *
 * In Commit 2, all 43 diagram files re-export this component so the
 * chapter pages can import <RampDiagram /> etc. and compile. In
 * Commit 3, each file gets replaced with its real SVG content.
 *
 * Why a placeholder and not just omit the imports? The chapter pages
 * reference <RampDiagram /> inline inside their `sections` array. If
 * the import 404s at build time, the whole chapter stops rendering.
 * A placeholder preserves the chapter shape during the two-commit
 * port.
 *
 * The placeholder is intentionally understated: a thin card with
 * the diagram name, not an alarming "MISSING" banner. A lawyer
 * looking at a live preview before Commit 3 lands should see
 * structure, not errors.
 */

interface DiagramPlaceholderProps {
  name: string;
}

export default function DiagramPlaceholder({
  name,
}: DiagramPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${name} diagram — visualization coming in next migration commit`}
      style={{
        background: 'var(--card-bg)',
        border: '1px dashed var(--border)',
        borderRadius: '10px',
        padding: '32px 20px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body), Manrope, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--section-label)',
          margin: '0 0 6px',
        }}
      >
        Interactive diagram
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body), Manrope, sans-serif',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--heading)',
          margin: '0 0 4px',
        }}
      >
        {name}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body), Manrope, sans-serif',
          fontSize: '0.8rem',
          color: 'var(--body-secondary)',
          margin: 0,
        }}
      >
        Coming in the next migration commit.
      </p>
    </div>
  );
}
