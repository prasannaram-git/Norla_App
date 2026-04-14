'use client';

import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AuthError]', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        fontFamily: "'DM Sans', Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        backgroundColor: '#FAFBFC',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 8,
          letterSpacing: '-0.025em',
        }}
      >
        Unable to load
      </h2>
      <p
        style={{
          fontSize: 14,
          color: '#636E7A',
          marginBottom: 24,
          lineHeight: 1.65,
          fontWeight: 500,
        }}
      >
        Please check your connection and try again.
      </p>
      <button
        onClick={reset}
        style={{
          height: 48,
          padding: '0 28px',
          background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(16, 185, 129, 0.2)',
        }}
      >
        Retry
      </button>
    </div>
  );
}
