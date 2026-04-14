'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
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
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          fontSize: 22,
          fontWeight: 700,
          color: 'white',
          boxShadow: '0 2px 12px rgba(16, 185, 129, 0.2)',
        }}
      >
        !
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 8,
          letterSpacing: '-0.025em',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontSize: 14,
          color: '#636E7A',
          marginBottom: 28,
          lineHeight: 1.65,
          maxWidth: 300,
          fontWeight: 500,
        }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          height: 52,
          padding: '0 32px',
          background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 2px 12px rgba(16, 185, 129, 0.2)',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
