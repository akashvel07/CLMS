import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CLMS] App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh',
          background: '#0a0e1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif',
          padding: '2rem', textAlign: 'center',
        }}>
          <div style={{
            background: '#1a1f35', border: '1px solid #2d3561',
            borderRadius: '12px', padding: '2.5rem', maxWidth: '560px', width: '100%',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: '#f8fafc' }}>
              CLMS Failed to Load
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              {err.message || 'An unexpected error occurred.'}
            </p>
            <details style={{ textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Stack trace</summary>
              <pre style={{ overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {err.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem', padding: '0.6rem 1.5rem',
                background: 'linear-gradient(135deg, hsl(220,90%,55%), hsl(260,80%,60%))',
                border: 'none', borderRadius: '8px', color: '#fff',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
