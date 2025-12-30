/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import { renderHook } from '@testing-library/react'
import { useManyK8sSmartResource } from './useManyK8sSmartResource'
import { useK8sSmartResource } from './useK8sSmartResource'

jest.mock('./useK8sSmartResource')

const mockUseK8sSmartResource = useK8sSmartResource as unknown as jest.Mock

const p = (plural: string, extra?: Partial<any>) =>
  ({
    cluster: 'c1',
    apiVersion: 'v1',
    plural,
    ...extra,
  }) as any

describe('useManyK8sSmartResource', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls useK8sSmartResource for each params entry and returns results in order', () => {
    const paramsList = [p('pods'), p('deployments'), p('services')]

    mockUseK8sSmartResource.mockImplementation((params: any) => ({
      data: { plural: params.plural },
      isLoading: false,
      isError: false,
      error: undefined,
      _meta: { used: 'list' },
      debugTick: params.plural,
    }))

    const { result } = renderHook(() => useManyK8sSmartResource(paramsList))

    expect(mockUseK8sSmartResource).toHaveBeenCalledTimes(3)
    expect(mockUseK8sSmartResource).toHaveBeenNthCalledWith(1, paramsList[0])
    expect(mockUseK8sSmartResource).toHaveBeenNthCalledWith(2, paramsList[1])
    expect(mockUseK8sSmartResource).toHaveBeenNthCalledWith(3, paramsList[2])

    expect(result.current).toHaveLength(3)
    expect(result.current[0].data).toEqual({ plural: 'pods' })
    expect(result.current[1].data).toEqual({ plural: 'deployments' })
    expect(result.current[2].data).toEqual({ plural: 'services' })

    expect(result.current[0].debugTick).toBe('pods')
    expect(result.current[1].debugTick).toBe('deployments')
    expect(result.current[2].debugTick).toBe('services')
  })

  test('works with empty params list', () => {
    const paramsList: any[] = []

    const { result } = renderHook(() => useManyK8sSmartResource(paramsList))

    expect(mockUseK8sSmartResource).toHaveBeenCalledTimes(0)
    expect(result.current).toEqual([])
  })
})
