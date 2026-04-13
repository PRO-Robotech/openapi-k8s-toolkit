/* eslint-disable react/prop-types */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result } from 'antd'

type TErrorBoundaryProps = {
  /** Custom fallback UI. When omitted, a default Ant Design Result with status="500" is shown. */
  fallback?: ReactNode
  /** Optional callback fired when an error is caught. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /**
   * Array of values that, when changed while the boundary is in an error state,
   * automatically reset the error and re-render children.
   * Inspired by react-error-boundary's resetKeys pattern.
   */
  resetKeys?: unknown[]
  children: ReactNode
}

type TErrorBoundaryState = {
  hasError: boolean
  error: Error | null
  prevResetKeys: unknown[]
}

const keysMatch = (a: unknown[], b: unknown[]): boolean => {
  if (a.length !== b.length) return false
  return a.every((val, i) => Object.is(val, i < b.length ? b[i] : undefined))
}

/**
 * Catches uncaught JS exceptions in child component trees and renders
 * a fallback UI instead of a white screen.
 *
 * Supports automatic recovery via `resetKeys`: when any value in the array
 * changes while the boundary is in an error state, the error is cleared
 * and children are re-rendered.
 *
 * This is a safety net for unexpected crashes — it does NOT handle
 * API errors (those are handled by useAutoPerRequestError / PerRequestError).
 */
// React requires a class component for error boundaries — arrow functions cannot implement
// getDerivedStateFromError or componentDidCatch.
// eslint-disable-next-line react/prefer-stateless-function
export class ErrorBoundary extends Component<TErrorBoundaryProps, TErrorBoundaryState> {
  constructor(props: TErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, prevResetKeys: props.resetKeys ?? [] }
  }

  static getDerivedStateFromError(error: Error): Partial<TErrorBoundaryState> {
    return { hasError: true, error }
  }

  static getDerivedStateFromProps(
    props: TErrorBoundaryProps,
    state: TErrorBoundaryState,
  ): Partial<TErrorBoundaryState> | null {
    const nextKeys = props.resetKeys ?? []

    if (state.hasError && !keysMatch(state.prevResetKeys, nextKeys)) {
      return { hasError: false, error: null, prevResetKeys: nextKeys }
    }

    if (!keysMatch(state.prevResetKeys, nextKeys)) {
      return { prevResetKeys: nextKeys }
    }

    return null
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props
    onError?.(error, errorInfo)
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { fallback, children } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <Result status="500" title="Something went wrong" subTitle={error?.message || 'An unexpected error occurred'} />
      )
    }

    return children
  }
}
