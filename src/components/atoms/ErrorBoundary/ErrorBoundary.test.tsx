import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// A component that always throws on render
const ThrowingChild = ({ message }: { message: string }) => {
  throw new Error(message)
}

// A component that renders normally
const GoodChild = () => <div data-testid="good-child">All good</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    )

    expect(screen.getByTestId('good-child')).toBeInTheDocument()
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  test('renders default fallback (Ant Design Result) when child throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingChild message="kaboom" />
      </ErrorBoundary>,
    )

    // Ant Design 500 illustration has a <title>Server Error</title> SVG element,
    // so use getAllByText for "Something went wrong" in case of multiple matches
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('kaboom')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  test('renders custom fallback when provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error UI</div>}>
        <ThrowingChild message="oops" />
      </ErrorBoundary>,
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    // Default fallback should NOT render
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  test('calls onError callback when child throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild message="crash" />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'crash' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    )

    consoleSpy.mockRestore()
  })

  test('does not call onError when no error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <GoodChild />
      </ErrorBoundary>,
    )

    expect(onError).not.toHaveBeenCalled()
  })
})
