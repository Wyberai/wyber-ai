'use client'
import { Component, type ReactNode } from 'react'
import { friendlyError, reportError } from '@/lib/error-resilience'

interface Props { children: ReactNode; fallbackMessage?: string }
interface State { hasError: boolean; error: string | null; retryCount: number }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error: friendlyError(error.message) }
  }

  componentDidCatch(error: Error) {
    reportError('react_error_boundary', error.message, {
      stack: error.stack?.slice(0, 500),
    })
  }

  handleRetry = () => {
    this.setState(s => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          color: 'var(--ide-text3, #71717a)', fontFamily: 'var(--font-display)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ide-text, #fafafa)' }}>
            {this.props.fallbackMessage || 'Something went wrong'}
          </div>
          <div style={{ fontSize: 12, maxWidth: 400, lineHeight: 1.6 }}>
            {this.state.error}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: 8, padding: '8px 20px', borderRadius: 8,
              background: '#0EA5E9', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
