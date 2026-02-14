import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#e11d48' }}>
                        Oups ! Quelque chose s'est mal passé.
                    </h1>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '600px', lineHeight: '1.6' }}>
                        Une erreur inattendue est survenue. L'application a été interrompue pour éviter toute corruption de données.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onFocus={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onBlur={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                        Recharger l'application
                    </button>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ marginTop: '2rem', textAlign: 'left', width: '100%', maxWidth: '800px' }}>
                            <summary style={{ cursor: 'pointer', color: '#64748b' }}>Détails techniques (Développement uniquement)</summary>
                            <pre style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '8px',
                                overflowX: 'auto',
                                fontSize: '0.85rem'
                            }}>
                                {this.state.error.toString()}
                                {'\n'}
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
