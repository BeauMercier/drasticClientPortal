'use client';

// This is a catch-all error UI for the App Router. It prevents dev from showing
// a blank screen with "missing required error components" and gives a reset action.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#ededed',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"'
      }}>
        <div style={{ maxWidth: 600, width: '100%', padding: 24, border: '1px solid #333', borderRadius: 16, background: '#121212' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>{error?.message || 'An unexpected error occurred.'}</p>
          {error?.digest && (
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>Error ID: {error.digest}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #555',
                background: 'transparent',
                color: '#ededed',
                cursor: 'pointer'
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ff1010',
                color: 'white',
                textDecoration: 'none'
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}


