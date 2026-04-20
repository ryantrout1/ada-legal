/**
 * Public placeholder page shown at `/`.
 *
 * Phase A temporary content. The real public home with Ada intake UI,
 * guide cards, and attorney directory entrypoint lands in Phase B.
 */
export default function PublicPlaceholder() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '640px',
        margin: '4rem auto',
        padding: '0 1.5rem',
        lineHeight: 1.6,
        color: '#1A1A18',
      }}
    >
      <h1 style={{ fontSize: '2rem', margin: '0 0 1rem' }}>ADA Legal Link</h1>
      <p style={{ color: '#6B6962', margin: '0 0 1rem' }}>
        New stack, Phase A. Coming soon.
      </p>
      <p style={{ fontSize: '0.875rem', color: '#9C9A92', margin: 0 }}>
        The public ADA Legal Link experience continues at{' '}
        <a href="https://adalegallink.com" style={{ color: '#534AB7' }}>
          adalegallink.com
        </a>{' '}
        while this new version is built.
      </p>
    </main>
  );
}
