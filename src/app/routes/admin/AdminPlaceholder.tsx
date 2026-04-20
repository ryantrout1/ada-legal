/**
 * Admin placeholder — visible only to signed-in users (guarded by
 * `<RequireAdmin>` in App.tsx, which redirects unauthenticated users
 * to /admin/sign-in).
 *
 * Phase A temporary content. The real admin (attorney directory CRUD,
 * sessions overview, feature flags, etc.) lands in Phase B Step 13 and
 * expands in Phase D Step 24 for Ch1 features.
 */
export default function AdminPlaceholder() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '640px',
        margin: '2rem auto',
        padding: '0 1.5rem',
        lineHeight: 1.6,
        color: '#1A1A18',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Admin dashboard</h1>
      <p style={{ color: '#6B6962', margin: '0 0 1rem' }}>
        You are signed in. Admin surfaces (attorney directory, session overview,
        settings) land in Phase B Step 13.
      </p>
    </main>
  );
}
