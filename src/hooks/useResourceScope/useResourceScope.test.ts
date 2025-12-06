/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import { useQuery } from '@tanstack/react-query'
import { checkIfApiInstanceNamespaceScoped, checkIfBuiltInInstanceNamespaceScoped } from 'api/bff/scopes/checkScopes'
import { useResourceScope } from './useResourceScope'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

jest.mock('api/bff/scopes/checkScopes', () => ({
  checkIfApiInstanceNamespaceScoped: jest.fn(),
  checkIfBuiltInInstanceNamespaceScoped: jest.fn(),
}))

const mockUseQuery = useQuery as unknown as jest.Mock
const mockCheckApi = checkIfApiInstanceNamespaceScoped as unknown as jest.Mock
const mockCheckBuiltin = checkIfBuiltInInstanceNamespaceScoped as unknown as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockUseQuery.mockImplementation((cfg: any) => cfg) // allow inspecting cfg
  mockCheckApi.mockResolvedValue({ isClusterWide: false, isNamespaceScoped: true })
  mockCheckBuiltin.mockResolvedValue({ isClusterWide: false, isNamespaceScoped: true })
})

describe('useResourceScope', () => {
  test('builtin: enabled without apiVersion and uses builtin queryFn', async () => {
    useResourceScope({
      cluster: 'c1',
      plural: 'pods',
      apiGroup: undefined,
      apiVersion: undefined,
    })

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    const cfg = mockUseQuery.mock.calls[0][0]

    expect(cfg.enabled).toBe(true)
    expect(cfg.queryKey).toEqual(['resource-scope', 'builtin', 'c1', 'pods', undefined, undefined])

    await cfg.queryFn()
    expect(mockCheckBuiltin).toHaveBeenCalledWith({ plural: 'pods', cluster: 'c1' })
    expect(mockCheckApi).not.toHaveBeenCalled()
  })

  test('api: disabled when apiVersion missing', () => {
    useResourceScope({
      cluster: 'c1',
      plural: 'deployments',
      apiGroup: 'apps',
      apiVersion: undefined,
    })

    const cfg = mockUseQuery.mock.calls[0][0]
    expect(cfg.enabled).toBe(false)
    expect(cfg.queryKey).toEqual(['resource-scope', 'api', 'c1', 'deployments', 'apps', undefined])
  })

  test('api: enabled with apiVersion and uses api queryFn', async () => {
    useResourceScope({
      cluster: 'c1',
      plural: 'deployments',
      apiGroup: 'apps',
      apiVersion: 'v1',
    })

    const cfg = mockUseQuery.mock.calls[0][0]

    expect(cfg.enabled).toBe(true)
    expect(cfg.queryKey).toEqual(['resource-scope', 'api', 'c1', 'deployments', 'apps', 'v1'])

    await cfg.queryFn()
    expect(mockCheckApi).toHaveBeenCalledWith({
      plural: 'deployments',
      apiGroup: 'apps',
      apiVersion: 'v1',
      cluster: 'c1',
    })
    expect(mockCheckBuiltin).not.toHaveBeenCalled()
  })

  test('disabled when cluster or plural missing', () => {
    useResourceScope({ cluster: '', plural: 'pods' } as any)
    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false)

    jest.clearAllMocks()
    mockUseQuery.mockImplementation((cfg: any) => cfg)

    useResourceScope({ cluster: 'c1', plural: '' } as any)
    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false)
  })
})
