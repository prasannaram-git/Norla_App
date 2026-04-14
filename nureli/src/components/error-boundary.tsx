'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            backgroundColor: '#F7FAF8',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: '#DCEEE8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              fontSize: 24,
            }}
          >
            !
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#1D252C',
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#5F6B76',
              marginBottom: 24,
              lineHeight: 1.6,
              maxWidth: 300,
            }}
          >
            The app encountered an unexpected error. Please try refreshing.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              height: 48,
              padding: '0 28px',
              backgroundColor: '#1E6F74',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Reload App
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              style={{
                marginTop: 24,
                padding: 16,
                background: '#f1f5f3',
                borderRadius: 12,
                fontSize: 11,
                color: '#C53030',
                maxWidth: '100%',
                overflow: 'auto',
                textAlign: 'left',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
