/* eslint-disable prefer-destructuring */
/** @jest-environment jsdom */

import { renderHook } from '@testing-library/react'
import { useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { checkIfApiInstanceNamespaceScoped, checkIfBuiltInInstanceNamespaceScoped } from 'api/bff/scopes/checkScopes'
import { useSmartResourceParams } from './useSmartResourceParams'

jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => ({
  useQueries: jest.fn(),
}))

jest.mock('api/bff/scopes/checkScopes', () => ({
  checkIfApiInstanceNamespaceScoped: jest.fn(),
  checkIfBuiltInInstanceNamespaceScoped: jest.fn(),
}))

const mockUseSearchParams = useSearchParams as unknown as jest.Mock
const mockUseQueries = useQueries as unknown as jest.Mock
const mockCheckApi = checkIfApiInstanceNamespaceScoped as unknown as jest.Mock
const mockCheckBuiltin = checkIfBuiltInInstanceNamespaceScoped as unknown as jest.Mock

const setResourcesParam = (raw?: string) => {
  const sp = new URLSearchParams()
  if (raw != null) sp.set('resources', raw)
  mockUseSearchParams.mockReturnValue([sp, jest.fn()])
}

beforeEach(() => {
  jest.clearAllMocks()
  setResourcesParam(undefined)
  mockUseQueries.mockReturnValue([])
  mockCheckApi.mockResolvedValue({ isNamespaceScoped: true })
  mockCheckBuiltin.mockResolvedValue({ isNamespaceScoped: true })
})

describe('useSmartResourceParams', () => {
  test('returns empty lists when no resources param', () => {
    setResourcesParam(undefined)
    mockUseQueries.mockReturnValue([])

    const { result } = renderHook(() => useSmartResourceParams({ cluster: 'c1', namespace: 'ns1' }))

    expect(mockUseQueries).toHaveBeenCalledTimes(1)
    const arg = mockUseQueries.mock.calls[0][0]
    expect(arg.queries).toEqual([])

    expect(result.current.paramsList).toEqual([])
    expect(result.current.scopesLoading).toBe(false)
    expect(result.current.scopesError).toBeUndefined()
  })

  test('parses resources, normalizes builtin group, and preserves length', () => {
    // builtin/v1/pods -> apiGroup undefined
    // apps/v1/deployments -> apiGroup "apps"
    setResourcesParam('builtin/v1/pods,apps/v1/deployments')

    mockUseQueries.mockReturnValue([
      { isLoading: false, error: undefined, data: { isNamespaceScoped: true } },
      { isLoading: false, error: undefined, data: { isNamespaceScoped: false } },
    ])

    const { result } = renderHook(() => useSmartResourceParams({ cluster: 'c1', namespace: 'ns1' }))

    expect(result.current.paramsList).toHaveLength(2)

    // 0: builtin pods -> namespace scoped true => keep namespace
    expect(result.current.paramsList[0]).toEqual({
      cluster: 'c1',
      plural: 'pods',
      apiGroup: undefined,
      apiVersion: 'v1',
      namespace: 'ns1',
    })

    // 1: apps deployments -> namespace scoped false => cluster-wide => namespace undefined
    expect(result.current.paramsList[1]).toEqual({
      cluster: 'c1',
      plural: 'deployments',
      apiGroup: 'apps',
      apiVersion: 'v1',
      namespace: undefined,
    })
  })

  test('computes scopesLoading and scopesError from query results', () => {
    setResourcesParam('builtin/v1/pods,apps/v1/deployments')

    const err = new Error('scope failed')
    mockUseQueries.mockReturnValue([
      { isLoading: true, error: undefined, data: undefined },
      { isLoading: false, error: err, data: undefined },
    ])

    const { result } = renderHook(() => useSmartResourceParams({ cluster: 'c1', namespace: 'ns1' }))

    expect(result.current.scopesLoading).toBe(true)
    expect(result.current.scopesError).toBe(err)
    expect(result.current.paramsList).toHaveLength(2) // rule-of-hooks invariant
  })

  test('builds correct queryKey/enable flags and queryFn routes to builtin vs api', async () => {
    setResourcesParam('builtin/v1/pods,apps/v1/deployments,apps//statefulsets')

    mockUseQueries.mockReturnValue([
      { isLoading: false, error: undefined, data: { isNamespaceScoped: true } },
      { isLoading: false, error: undefined, data: { isNamespaceScoped: true } },
      { isLoading: false, error: undefined, data: { isNamespaceScoped: true } },
    ])

    renderHook(() => useSmartResourceParams({ cluster: 'c1', namespace: 'ns1' }))

    expect(mockUseQueries).toHaveBeenCalledTimes(1)
    const cfg = mockUseQueries.mock.calls[0][0]
    const queries = cfg.queries

    expect(queries).toHaveLength(3)

    // 0 builtin pods
    expect(queries[0].queryKey).toEqual(['resource-scope', 'c1', 'builtin', 'v1', 'pods'])
    expect(queries[0].enabled).toBe(true)

    // 1 api deployments
    expect(queries[1].queryKey).toEqual(['resource-scope', 'c1', 'apps', 'v1', 'deployments'])
    expect(queries[1].enabled).toBe(true)

    // 2 api statefulsets with missing apiVersion -> enabled false
    expect(queries[2].queryKey).toEqual(['resource-scope', 'c1', 'apps', '', 'statefulsets'])
    expect(queries[2].enabled).toBe(false)

    // Execute queryFn to verify routing + args
    await queries[0].queryFn()
    expect(mockCheckBuiltin).toHaveBeenCalledWith({ plural: 'pods', cluster: 'c1' })

    await queries[1].queryFn()
    expect(mockCheckApi).toHaveBeenCalledWith({
      plural: 'deployments',
      apiGroup: 'apps',
      apiVersion: 'v1',
      cluster: 'c1',
    })
  })

  test('filters out entries without plural', () => {
    // third entry missing plural
    setResourcesParam('builtin/v1/pods,apps/v1/deployments,apps/v1/')

    mockUseQueries.mockReturnValue([
      { isLoading: false, error: undefined, data: { isNamespaceScoped: true } },
      { isLoading: false, error: undefined, data: { isNamespaceScoped: true } },
    ])

    const { result } = renderHook(() => useSmartResourceParams({ cluster: 'c1', namespace: 'ns1' }))

    expect(result.current.paramsList).toHaveLength(2)
    expect(result.current.paramsList.map(p => p.plural)).toEqual(['pods', 'deployments'])
  })
})
