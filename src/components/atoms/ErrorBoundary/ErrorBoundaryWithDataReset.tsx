import React, { FC, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useMultiQuery } from 'components/organisms/DynamicRendererWithProviders/providers/hybridDataProvider'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Functional wrapper around ErrorBoundary that hooks into multiQuery context
 * and router location, passing both as resetKeys.
 *
 * ErrorBoundary is a class component and cannot call hooks directly.
 * This bridge reads isError from useMultiQuery and pathname from useLocation,
 * so the boundary auto-resets when:
 * - The user navigates to a different page (pathname changes)
 * - An API error resolves on refetch (isError flips from true to false)
 */
export const ErrorBoundaryWithDataReset: FC<{ children: ReactNode }> = ({ children }) => {
  const { isError } = useMultiQuery()
  const location = useLocation()

  return <ErrorBoundary resetKeys={[location.pathname, isError]}>{children}</ErrorBoundary>
}
