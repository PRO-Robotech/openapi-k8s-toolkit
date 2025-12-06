/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import { filterIfBuiltInInstanceNamespaceScoped } from 'api/bff/scopes/filterScopes'
import { getGroupsByCategory } from './getGroupsByCategory'

jest.mock('api/bff/scopes/filterScopes', () => ({
  filterIfBuiltInInstanceNamespaceScoped: jest.fn(),
}))

const mockFilterBuiltin = filterIfBuiltInInstanceNamespaceScoped as unknown as jest.Mock

const g = (name: string, preferredVersion = 'v1') =>
  ({
    name,
    preferredVersion: { version: preferredVersion },
  }) as any

describe('getGroupsByCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFilterBuiltin.mockResolvedValue(['builtin-result'])
  })

  test('extracts apiExtensionVersion and splits/sorts groups; returns filtered builtin groups', async () => {
    const apiGroupListData = {
      groups: [
        g('batch', 'v1'), // in default noncrds
        g('apps', 'v1'),
        g('apiextensions.k8s.io', 'v1'),
        g('foo.example.com', 'v1alpha1'),
        g('bar.example.com', 'v1'),
        g('networking.k8s.io', 'v1'),
      ],
    } as any

    const builtinResourceTypesData = {
      resources: ['pods', 'services'],
    } as any

    const res = await getGroupsByCategory({
      cluster: 'c1',
      namespace: 'ns1',
      apiGroupListData,
      builtinResourceTypesData,
      // use default noncrds
    })

    // apiExtensionVersion pulled from apiextensions.k8s.io preferredVersion.version
    expect(res.apiExtensionVersion).toBe('v1')

    // crdGroups: excludes default noncrds (apps/autoscaling/batch/policy)
    // and excludes anything containing ".k8s.io"
    // so only foo.example.com + bar.example.com remain, sorted by name
    expect(res.crdGroups?.map((x: any) => x.name)).toEqual(['bar.example.com', 'foo.example.com'])

    // nonCrdGroups: CURRENT IMPLEMENTATION returns ALL groups sorted by name
    expect(res.nonCrdGroups?.map((x: any) => x.name)).toEqual([
      'apiextensions.k8s.io',
      'apps',
      'bar.example.com',
      'batch',
      'foo.example.com',
      'networking.k8s.io',
    ])

    // builtin groups come from filter helper
    expect(res.builtinGroups).toEqual(['builtin-result'])

    expect(mockFilterBuiltin).toHaveBeenCalledTimes(1)
    expect(mockFilterBuiltin).toHaveBeenCalledWith({
      namespace: 'ns1',
      data: builtinResourceTypesData,
      cluster: 'c1',
    })
  })

  test('respects custom noncrds list', async () => {
    const apiGroupListData = {
      groups: [g('apps'), g('custom.io'), g('another.io')],
    } as any

    const res = await getGroupsByCategory({
      cluster: 'c1',
      apiGroupListData,
      builtinResourceTypesData: undefined,
      noncrds: ['custom.io'],
    })

    // With a custom noncrds list, the default list is NOT used.
    // So "apps" is not excluded here and does not contain ".k8s.io".
    expect(res.crdGroups?.map((x: any) => x.name)).toEqual(['another.io', 'apps'])

    // nonCrdGroups still all groups sorted (current implementation)
    expect(res.nonCrdGroups?.map((x: any) => x.name)).toEqual(['another.io', 'apps', 'custom.io'])
  })

  test('handles missing apiGroupListData and builtinResourceTypesData', async () => {
    mockFilterBuiltin.mockResolvedValue(undefined)

    const res = await getGroupsByCategory({
      cluster: 'c1',
      namespace: 'ns1',
      apiGroupListData: undefined,
      builtinResourceTypesData: undefined,
    })

    expect(res.apiExtensionVersion).toBeUndefined()
    expect(res.crdGroups).toBeUndefined()
    expect(res.nonCrdGroups).toBeUndefined()
    expect(res.builtinGroups).toBeUndefined()

    expect(mockFilterBuiltin).toHaveBeenCalledWith({
      namespace: 'ns1',
      data: undefined,
      cluster: 'c1',
    })
  })

  test('crdGroups ignores groups that contain ".k8s.io"', async () => {
    const apiGroupListData = {
      groups: [g('foo.k8s.io'), g('bar.example.com'), g('apps')],
    } as any

    const res = await getGroupsByCategory({
      cluster: 'c1',
      apiGroupListData,
      builtinResourceTypesData: undefined,
    })

    // apps excluded because default noncrds includes it
    // foo.k8s.io excluded because name includes ".k8s.io"
    expect(res.crdGroups?.map((x: any) => x.name)).toEqual(['bar.example.com'])
  })
})
