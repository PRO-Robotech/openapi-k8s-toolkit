/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react'
import { kindByGvr } from 'utils/kindByGvr'
import { useK8sSmartResource } from './useK8sSmartResource'
// deps
import { useK8sSmartResourceWithoutKinds } from './useK8sSmartResourceWithoutKinds'
import { useKinds } from '../useKinds'

jest.mock('./useK8sSmartResourceWithoutKinds')
jest.mock('../useKinds')
jest.mock('utils/kindByGvr')

const mockBase = useK8sSmartResourceWithoutKinds as unknown as jest.Mock
const mockUseKinds = useKinds as unknown as jest.Mock
const mockKindByGvr = kindByGvr as unknown as jest.Mock

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

  // By default, no kinds data available
  mockUseKinds.mockReturnValue({
    data: undefined,
  })

  // By default, resolver that always returns undefined
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

    // useKinds will provide kindsWithVersion to the hook
    mockUseKinds.mockReturnValue({
      data: {
        kindIndex: rawKinds,
        kindsWithVersion: sortedKinds,
      },
    })

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

    // useKinds is called with cluster and isEnabled
    expect(mockUseKinds).toHaveBeenCalledWith({
      cluster: 'c1',
      isEnabled: true,
    })
    expect(mockKindByGvr).toHaveBeenCalledWith(sortedKinds)
    expect(resolver).toHaveBeenCalled()
  })

  test('core group: does not add kind if resolver returns undefined, but adds apiVersion', async () => {
    const a = mkItem('a')
    mockBase.mockReturnValue(baseReturn({ data: { items: [a] }, _meta: { used: 'list' } }))

    mockUseKinds.mockReturnValue({
      data: {
        kindIndex: [],
        kindsWithVersion: [],
      },
    })
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

  test('cluster empty: still calls useKinds with isEnabled=false and adds apiVersion to items', () => {
    const a = mkItem('a')
    mockBase.mockReturnValue(baseReturn({ data: { items: [a] } }))

    const { result } = renderHook(() =>
      useK8sSmartResource({
        cluster: '',
        apiVersion: 'v1',
        plural: 'pods',
      }),
    )

    expect(mockUseKinds).toHaveBeenCalledWith({
      cluster: '',
      isEnabled: false,
    })

    const item0 = (result.current.data as any).items[0]
    expect(item0.apiVersion).toBe('v1')
    expect(item0.kind).toBeUndefined()
  })

  test('no kinds (e.g. getKinds failure upstream): keeps base data and enriches apiVersion without kind', async () => {
    const a = mkItem('a')
    mockBase.mockReturnValue(baseReturn({ data: { items: [a] }, _meta: { used: 'watch' } }))

    // Simulate "failure" by having no data; error is not used by this hook,
    // but we can include it to mirror React Query shape.
    mockUseKinds.mockReturnValue({
      data: undefined,
      error: new Error('boom'),
      isError: true,
    })
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
