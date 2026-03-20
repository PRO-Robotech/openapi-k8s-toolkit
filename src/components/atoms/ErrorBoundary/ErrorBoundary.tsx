import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result } from 'antd'

type TErrorBoundaryProps = {
  /** Custom fallback UI. When omitted, a default Ant Design Result with status="error" is shown. */
  fallback?: ReactNode
  /** Optional callback fired when an error is caught. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  children: ReactNode
}

type TErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

/**
 * Catches uncaught JS exceptions in child component trees and renders
 * a fallback UI instead of a white screen.
 *
 * This is a safety net for unexpected crashes — it does NOT handle
 * API errors (those are handled by usePerRequestError / PerRequestError).
 */
// React requires a class component for error boundaries — arrow functions cannot implement
// getDerivedStateFromError or componentDidCatch.
// eslint-disable-next-line react/prefer-stateless-function
export class ErrorBoundary extends Component<TErrorBoundaryProps, TErrorBoundaryState> {
  constructor(props: TErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): TErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Result
          status="500"
          title="Something went wrong"
          subTitle={this.state.error?.message || 'An unexpected error occurred'}
        />
      )
    }

    return this.props.children
  }
}
