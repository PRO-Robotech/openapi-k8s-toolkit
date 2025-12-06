/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react'
import { getKinds } from 'api/bff/search/getKinds'
import { kindByGvr } from 'utils/kindByGvr'
import { getSortedKindsAll } from 'utils/getSortedKindsAll'
import { useK8sSmartResource } from './useK8sSmartResource'
// deps
import { useK8sSmartResourceWithoutKinds } from './useK8sSmartResourceWithoutKinds'

jest.mock('./useK8sSmartResourceWithoutKinds')
jest.mock('api/bff/search/getKinds')
jest.mock('utils/kindByGvr')
jest.mock('utils/getSortedKindsAll')

const mockBase = useK8sSmartResourceWithoutKinds as unknown as jest.Mock
const mockGetKinds = getKinds as unknown as jest.Mock
const mockKindByGvr = kindByGvr as unknown as jest.Mock
const mockGetSortedKindsAll = getSortedKindsAll as unknown as jest.Mock

const baseReturn = (over?: Partial<any>) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: undefined,
  _meta: { used: 'disabled' },
  debugTick: 0,
  ...over,
})

const mkItem = (uid: string, extra?: Record<string, unknown>) =>
  ({
    metadata: { uid, name: uid, namespace: 'ns', resourceVersion: '1' },
    ...extra,
  }) as any

beforeEach(() => {
  jest.clearAllMocks()
  mockBase.mockReturnValue(baseReturn())

  /**
   * ✅ IMPORTANT:
   * Default to a never-resolving promise so tests that don't care about kinds
   * won't trigger async state updates after assertions (avoids act warnings).
   * Tests that *do* care override this with mockResolvedValue/mockRejectedValue.
   */
  mockGetKinds.mockImplementation(() => new Promise(() => {}))

  mockGetSortedKindsAll.mockImplementation(x => x)
  mockKindByGvr.mockReturnValue(() => undefined)
})

describe('useK8sSmartResource', () => {
  test('returns undefined data when base.data is undefined', () => {
    mockBase.mockReturnValue(baseReturn({ data: undefined }))

    const { result } = renderHook(() =>
      useK8sSmartResource({
        cluster: 'c1',
        apiVersion: 'v1',
        plural: 'pods',
      }),
    )

    expect(result.current.data).toBeUndefined()
  })

  test('passes through unchanged when base.data has no items array', () => {
    const obj = { foo: 123 }
    mockBase.mockReturnValue(baseReturn({ data: obj }))

    const { result } = renderHook(() =>
      useK8sSmartResource({
        cluster: 'c1',
        apiVersion: 'v1',
        plural: 'pods',
      }),
    )

    expect(result.current.data).toBe(obj)
  })

  test('enriches items with resolved kind + full apiVersion (named group)', async () => {
    const a = mkItem('a') // no kind/apiVersion
    const b = mkItem('b', { kind: 'Existing', apiVersion: 'custom/v9' })

    mockBase.mockReturnValue(
      baseReturn({
        data: { items: [a, b] },
        _meta: { used: 'watch' },
      }),
    )

    const rawKinds = [{ kind: 'Deployment', apiVersion: 'apps/v1' }]
    const sortedKinds = [{ kind: 'Deployment', apiVersion: 'apps/v1' }]

    mockGetKinds.mockResolvedValue(rawKinds)
    mockGetSortedKindsAll.mockReturnValue(sortedKinds)

    const resolver = jest.fn((gvr: string) => (gvr === 'apps~v1~deployments' ? 'Deployment' : undefined))
    mockKindByGvr.mockReturnValue(resolver)

    const { result } = renderHook(() =>
      useK8sSmartResource({
        cluster: 'c1',
        apiGroup: 'apps',
        apiVersion: 'v1',
        plural: 'deployments',
      }),
    )

    await waitFor(() => {
      const items = (result.current.data as any)?.items
      expect(items?.[0]?.kind).toBe('Deployment')
    })

    const items = (result.current.data as any).items

    expect(items[0].kind).toBe('Deployment')
    expect(items[0].apiVersion).toBe('apps/v1')

    expect(items[1].kind).toBe('Existing')
    expect(items[1].apiVersion).toBe('custom/v9')

    expect(mockGetKinds).toHaveBeenCalledWith({ cluster: 'c1' })
    expect(mockKindByGvr).toHaveBeenCalledWith(sortedKinds)
    expect(resolver).toHaveBeenCalled()
  })

  test('core group: does not add kind if resolver returns undefined, but adds apiVersion', async () => {
    const a = mkItem('a')
    mockBase.mockReturnValue(baseReturn({ data: { items: [a] }, _meta: { used: 'list' } }))

    mockGetKinds.mockResolvedValue([]) // allow effect to resolve safely here
    mockKindByGvr.mockReturnValue(() => undefined)

    const { result } = renderHook(() =>
      useK8sSmartResource({
        cluster: 'c1',
        apiGroup: undefined,
        apiVersion: 'v1',
        plural: 'pods',
      }),
    )

    await waitFor(() => {
      const items = (result.current.data as any)?.items
      expect(items?.length).toBe(1)
    })

    const item0 = (result.current.data as any).items[0]
    expect(item0.kind).toBeUndefined()
    expect(item0.apiVersion).toBe('v1')
  })

  test('cluster empty: does not call getKinds; still adds apiVersion to items', () => {
    const a = mkItem('a')
    mockBase.mockReturnValue(baseReturn({ data: { items: [a] } }))

    const { result } = renderHook(() =>
      useK8sSmartResource({
        cluster: '',
        apiVersion: 'v1',
        plural: 'pods',
      }),
    )

    expect(mockGetKinds).not.toHaveBeenCalled()

    const item0 = (result.current.data as any).items[0]
    expect(item0.apiVersion).toBe('v1')
    expect(item0.kind).toBeUndefined()
  })

  test('getKinds failure: keeps base data and enriches apiVersion without kind', async () => {
    const a = mkItem('a')
    mockBase.mockReturnValue(baseReturn({ data: { items: [a] }, _meta: { used: 'watch' } }))

    mockGetKinds.mockRejectedValue(new Error('boom'))
    mockKindByGvr.mockReturnValue(() => undefined)

    const { result } = renderHook(() =>
      useK8sSmartResource({
        cluster: 'c1',
        apiGroup: 'apps',
        apiVersion: 'v1',
        plural: 'deployments',
      }),
    )

    await waitFor(() => {
      const items = (result.current.data as any)?.items
      expect(items?.length).toBe(1)
    })

    const item0 = (result.current.data as any).items[0]
    expect(item0.kind).toBeUndefined()
    expect(item0.apiVersion).toBe('apps/v1')
  })
})
