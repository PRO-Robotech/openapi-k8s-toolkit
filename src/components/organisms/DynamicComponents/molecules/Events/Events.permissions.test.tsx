/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { usePermissions } from 'hooks/usePermissions'
import { Events } from './Events'

const standaloneEventsMock = jest.fn((props?: any) => (
  <div data-testid="standalone-events" data-props={String(Boolean(props))} />
))

jest.mock('components/molecules', () => ({
  Events: (props: any) => standaloneEventsMock(props),
}))

jest.mock('hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(() => ({ data: {}, isLoading: false })),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/partsOfUrlContext', () => ({
  usePartsOfUrl: jest.fn(() => ({ partsOfUrl: [] })),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/themeContext', () => ({
  useTheme: jest.fn(() => 'light'),
}))

const usePermissionsMock = usePermissions as unknown as jest.Mock

const baseData = {
  id: 'events',
  cluster: 'default',
  wsUrl: '/api/clusters/default/openapi-bff-ws/events/eventsWs',
  pageSize: 50,
  baseFactoryNamespacedAPIKey: 'base-factory-namespaced-api',
  baseFactoryClusterSceopedAPIKey: 'base-factory-clusterscoped-api',
  baseFactoryNamespacedBuiltinKey: 'base-factory-namespaced-builtin',
  baseFactoryClusterSceopedBuiltinKey: 'base-factory-clusterscoped-builtin',
  baseNamespaceFactoryKey: 'namespace-details',
  baseNavigationPlural: 'navigations',
  baseNavigationName: 'navigation',
}

describe('Dynamic Events permissions gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('does not render standalone events when list/watch are denied', () => {
    usePermissionsMock
      .mockReturnValueOnce({ isPending: false, isError: false, data: { status: { allowed: false } } })
      .mockReturnValueOnce({ isPending: false, isError: false, data: { status: { allowed: true } } })

    render(<Events data={baseData as any} />)

    expect(screen.getByText('Access denied (403)')).toBeInTheDocument()
    expect(screen.queryByTestId('standalone-events')).not.toBeInTheDocument()
    expect(standaloneEventsMock).not.toHaveBeenCalled()
  })

  test('does not render standalone events when permission check fails', () => {
    usePermissionsMock
      .mockReturnValueOnce({
        isPending: false,
        isError: true,
        data: undefined,
        error: { response: { status: 503 } },
      })
      .mockReturnValueOnce({ isPending: false, isError: false, data: { status: { allowed: true } } })

    render(<Events data={baseData as any} />)

    expect(screen.getByText('Failed to check permissions for events stream (503)')).toBeInTheDocument()
    expect(screen.queryByTestId('standalone-events')).not.toBeInTheDocument()
    expect(standaloneEventsMock).not.toHaveBeenCalled()
  })

  test('renders styled checking state while permissions are loading', () => {
    usePermissionsMock
      .mockReturnValueOnce({ isPending: true, isError: false, data: undefined })
      .mockReturnValueOnce({ isPending: false, isError: false, data: undefined })

    render(<Events data={baseData as any} />)

    expect(screen.getByText('Checking permissions for events stream...')).toBeInTheDocument()
    expect(screen.queryByTestId('standalone-events')).not.toBeInTheDocument()
    expect(standaloneEventsMock).not.toHaveBeenCalled()
  })

  test('renders standalone events when list/watch are allowed', () => {
    usePermissionsMock
      .mockReturnValueOnce({ isPending: false, isError: false, data: { status: { allowed: true } } })
      .mockReturnValueOnce({ isPending: false, isError: false, data: { status: { allowed: true } } })

    render(<Events data={baseData as any} />)

    expect(screen.getByTestId('standalone-events')).toBeInTheDocument()
    expect(standaloneEventsMock).toHaveBeenCalledTimes(1)
  })
})
