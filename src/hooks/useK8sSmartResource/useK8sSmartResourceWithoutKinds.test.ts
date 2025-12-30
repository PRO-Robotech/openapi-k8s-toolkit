/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
/** @jest-environment jsdom */

import { renderHook } from '@testing-library/react'

import { useK8sSmartResourceWithoutKinds } from './useK8sSmartResourceWithoutKinds'

// Mock deps
import { useK8sVerbs } from '../useK8sVerbs'
import { useDirectUnknownResource } from '../useDirectUnknownResource'
import { useListWatch } from '../useListThenWatch/useListWatch'

jest.mock('../useK8sVerbs')
jest.mock('../useDirectUnknownResource')
jest.mock('../useListThenWatch/useListWatch')

const mockUseK8sVerbs = useK8sVerbs as unknown as jest.Mock
const mockUseDirect = useDirectUnknownResource as unknown as jest.Mock
const mockUseListWatch = useListWatch as unknown as jest.Mock

const mkItem = (uid: string) =>
  ({
    metadata: { uid, name: uid, namespace: 'ns', resourceVersion: '1' },
  }) as any

const baseParams = {
  cluster: 'c1',
  apiVersion: 'v1',
  plural: 'pods',
} as const

const setVerbs = (overrides?: Partial<ReturnType<typeof useK8sVerbs>>) => {
  mockUseK8sVerbs.mockReturnValue({
    canList: false,
    canWatch: false,
    isLoading: false,
    isError: false,
    error: undefined,
    ...overrides,
  })
}

const setRest = (overrides?: Partial<ReturnType<typeof useDirectUnknownResource>>) => {
  mockUseDirect.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: undefined,
    ...overrides,
  })
}

const setWatch = (overrides?: Partial<ReturnType<typeof useListWatch>>) => {
  mockUseListWatch.mockReturnValue({
    state: { order: [], byKey: {} },
    status: 'closed',
    hasInitial: false,
    lastError: undefined,
    debugTick: 0,
    // extra fields to satisfy potential TS expectations if any
    total: 0,
    hasMore: false,
    continueToken: undefined,
    setPaused: jest.fn(),
    setIgnoreRemove: jest.fn(),
    sendScroll: jest.fn(),
    drainAll: jest.fn(),
    reconnect: jest.fn(),
    setUrl: jest.fn(),
    setQuery: jest.fn(),
    ...overrides,
  } as any)
}

beforeEach(() => {
  jest.clearAllMocks()
  setVerbs()
  setRest()
  setWatch()
})

describe('useK8sSmartResourceWithoutKinds', () => {
  test('disabled when isEnabled=false', () => {
    setVerbs({ canList: true, canWatch: true })

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
        isEnabled: false,
      }),
    )

    expect(result.current._meta?.used).toBe('disabled')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  test('verbs-loading state', () => {
    setVerbs({ isLoading: true, canList: true, canWatch: true })

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
      }),
    )

    expect(result.current._meta?.used).toBe('verbs-loading')
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  test('verbs-error has highest priority', () => {
    const err = new Error('no verbs')
    setVerbs({ isError: true, error: err as any })

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
      }),
    )

    expect(result.current._meta?.used).toBe('verbs-error')
    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(err)
  })

  test('watch path uses default mapper when mapListWatchState not provided', () => {
    setVerbs({ canList: true, canWatch: true })

    const a = mkItem('a')
    const b = mkItem('b')

    setWatch({
      state: { order: ['a', 'b'], byKey: { a, b } },
      status: 'open',
      hasInitial: true,
      lastError: undefined,
      debugTick: 7,
    } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
        limit: 50,
      }),
    )

    expect(result.current._meta?.used).toBe('watch')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)

    // defaultMap shape: { items: [...] }
    expect(result.current.data).toEqual({ items: [a, b] })
    expect(result.current.debugTick).toBe(7)

    // pageSize should reflect limit
    expect(mockUseListWatch).toHaveBeenCalledTimes(1)
    const callArg = mockUseListWatch.mock.calls[0][0]
    expect(callArg.pageSize).toBe(50)
    expect(callArg.isEnabled).toBe(true)
    expect(callArg.wsUrl).toContain(`/api/clusters/${baseParams.cluster}/openapi-bff-ws/listThenWatch/listWatchWs`)
  })

  test('watch path uses custom mapListWatchState', () => {
    setVerbs({ canList: true, canWatch: true })

    const a = mkItem('a')
    setWatch({
      state: { order: ['a'], byKey: { a } },
      status: 'open',
      hasInitial: true,
    } as any)

    const map = jest.fn(s => ({ count: s.order.length }))

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
        mapListWatchState: map as any,
      }),
    )

    expect(result.current._meta?.used).toBe('watch')
    expect(result.current.data).toEqual({ count: 1 })
    expect(map).toHaveBeenCalled()
  })

  test('watch isLoading when connecting', () => {
    setVerbs({ canList: true, canWatch: true })
    setWatch({ status: 'connecting', hasInitial: false } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
      }),
    )

    expect(result.current._meta?.used).toBe('watch')
    expect(result.current.isLoading).toBe(true)
  })

  test('watch isLoading when open but hasInitial=false', () => {
    setVerbs({ canList: true, canWatch: true })
    setWatch({ status: 'open', hasInitial: false } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
      }),
    )

    expect(result.current._meta?.used).toBe('watch')
    expect(result.current.isLoading).toBe(true)
  })

  test('watch error when closed and lastError present', () => {
    setVerbs({ canList: true, canWatch: true })
    setWatch({ status: 'closed', hasInitial: true, lastError: 'WS down' } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
      }),
    )

    expect(result.current._meta?.used).toBe('watch')
    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe('WS down')
  })

  test('list path enabled when canList=true and canWatch=false', () => {
    setVerbs({ canList: true, canWatch: false })
    setRest({ data: { hello: 'world' }, isLoading: false, isError: false } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
        namespace: 'ns',
        fieldSelector: 'a=b',
        labelSelector: 'x=y',
        limit: 10,
        listRefetchInterval: 1234,
      }),
    )

    expect(result.current._meta?.used).toBe('list')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toEqual({ hello: 'world' })

    // Assert the list URI is built as expected via mock args
    expect(mockUseDirect).toHaveBeenCalledTimes(1)
    const directArg = mockUseDirect.mock.calls[0][0]

    expect(directArg.isEnabled).toBe(true)
    expect(directArg.refetchInterval).toBe(1234)

    // Core group => /api/v1
    expect(directArg.uri).toContain(`/api/clusters/${baseParams.cluster}/k8s/api/v1/namespaces/ns/pods/`)
    expect(directArg.uri).toContain('fieldSelector=a%3Db')
    expect(directArg.uri).toContain('labelSelector=x%3Dy')
    expect(directArg.uri).toContain('limit=10')
  })

  test('list path for named apiGroup uses /apis/<group>/<version>', () => {
    setVerbs({ canList: true, canWatch: false })
    setRest({ data: { ok: true } } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        cluster: 'c1',
        apiGroup: 'apps',
        apiVersion: 'v1',
        plural: 'deployments',
      }),
    )

    expect(result.current._meta?.used).toBe('list')

    const directArg = mockUseDirect.mock.calls[0][0]
    expect(directArg.uri).toContain(`/api/clusters/c1/k8s/apis/apps/v1/deployments/`)
  })

  test('list isLoading when restLoading', () => {
    setVerbs({ canList: true, canWatch: false })
    setRest({ isLoading: true } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
      }),
    )

    expect(result.current._meta?.used).toBe('list')
    expect(result.current.isLoading).toBe(true)
  })

  test('list error when restIsError', () => {
    setVerbs({ canList: true, canWatch: false })
    const err = new Error('list fail')
    setRest({ isError: true, error: err } as any)

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        ...baseParams,
      }),
    )

    expect(result.current._meta?.used).toBe('list')
    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(err)
  })

  test('when cluster is empty, should not enable list/watch', () => {
    setVerbs({ canList: true, canWatch: true })

    const { result } = renderHook(() =>
      useK8sSmartResourceWithoutKinds({
        cluster: '',
        apiVersion: 'v1',
        plural: 'pods',
      }),
    )

    // Falls through to disabled due to cluster gate
    expect(result.current._meta?.used).toBe('disabled')
    expect(mockUseDirect.mock.calls[0]?.[0]?.isEnabled ?? false).toBe(false)
    expect(mockUseListWatch.mock.calls[0]?.[0]?.isEnabled ?? false).toBe(false)
  })
})
