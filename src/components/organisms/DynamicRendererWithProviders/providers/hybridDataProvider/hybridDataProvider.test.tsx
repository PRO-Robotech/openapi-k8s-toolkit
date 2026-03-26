/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import { MultiQueryProvider, useMultiQuery } from './hybridDataProvider'

// -------------------- mocks --------------------

const useQueriesMock = jest.fn()
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQueries: (...args: any[]) => useQueriesMock(...args),
  }
})

const useManyK8sSmartResourceMock = jest.fn()
jest.mock('hooks/useK8sSmartResource', () => ({
  useManyK8sSmartResource: (args: any) => useManyK8sSmartResourceMock(args),
}))

// -------------------- test helpers --------------------

const normalizeErr = (e: any) => {
  if (!e) return 'null'
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && 'message' in e && typeof (e as any).message === 'string') return (e as any).message
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

const Output = () => {
  const { data, isLoading, isError, errors } = useMultiQuery()

  return (
    <div>
      <div data-testid="isLoading">{String(isLoading)}</div>
      <div data-testid="isError">{String(isError)}</div>

      {/* Render data keys explicitly so undefined doesn't disappear */}
      {Object.keys(data).map(k => (
        <div key={k} data-testid={`data-${k}`}>
          {data[k] === undefined ? 'undefined' : JSON.stringify(data[k])}
        </div>
      ))}

      {/* Render errors as normalized strings */}
      {errors.map((e, i) => (
        <div key={i} data-testid={`err-${i}`}>
          {normalizeErr(e)}
        </div>
      ))}
    </div>
  )
}

/**
 * Helper: create a useManyK8sSmartResource mock that returns results
 * based on each item's `id` field.
 */
const makeK8sResultsMock = (
  byId: Record<string, { data: any; isLoading?: boolean; isError?: boolean; error?: any }>,
) => {
  return (paramsList: any[]) =>
    paramsList.map((params: any) => {
      const id = params?.id ?? 'unknown'
      const base = byId[id] ?? { data: undefined, isLoading: false, isError: false, error: undefined }
      return {
        data: base.data,
        isLoading: base.isLoading ?? false,
        isError: base.isError ?? false,
        error: base.error ?? undefined,
      }
    })
}

const makeStableUrlResults = (...results: any[]) =>
  results.map(r => ({
    data: r?.data,
    isLoading: !!r?.isLoading,
    isError: !!r?.isError,
    error: r?.error ?? null,
  }))

// -------------------- tests --------------------

describe('MultiQueryProvider / useMultiQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('throws if useMultiQuery is used outside provider', () => {
    const Bad = () => {
      useMultiQuery()
      return null
    }

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Bad />)).toThrow('useMultiQuery must be used within a MultiQueryProvider')

    consoleErrorSpy.mockRestore()
  })

  test('partitions items, assigns req indexes (no dataToApplyToContext)', async () => {
    const k1Data = { k: 1 }
    const k2Data = { k: 2 }
    const u1Data = { u: 1 }
    const u2Data = { u: 2 }

    useManyK8sSmartResourceMock.mockImplementation(
      makeK8sResultsMock({
        k1: { data: k1Data },
        k2: { data: k2Data },
      }),
    )

    useQueriesMock.mockImplementation(({ queries }: any) =>
      makeStableUrlResults({ data: u1Data }, { data: u2Data }).slice(0, queries.length),
    )

    const items = [{ id: 'k1' } as any, 'https://example.com/a', { id: 'k2' } as any, 'https://example.com/b']

    render(
      <MultiQueryProvider items={items}>
        <Output />
      </MultiQueryProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('data-req0').textContent).toBe(JSON.stringify(k1Data))
      expect(screen.getByTestId('data-req1').textContent).toBe(JSON.stringify(k2Data))
    })

    expect(screen.getByTestId('data-req2').textContent).toBe(JSON.stringify(u1Data))
    expect(screen.getByTestId('data-req3').textContent).toBe(JSON.stringify(u2Data))

    expect(screen.getByTestId('isLoading').textContent).toBe('false')
    expect(screen.getByTestId('isError').textContent).toBe('false')

    // ensure URL-only subset is used
    expect(useQueriesMock).toHaveBeenCalled()
    const lastArg = useQueriesMock.mock.calls[useQueriesMock.mock.calls.length - 1][0]
    expect(lastArg.queries).toHaveLength(2)
    expect(lastArg.queries[0].queryKey).toEqual(['multi-url', 0, 'https://example.com/a'])
    expect(lastArg.queries[1].queryKey).toEqual(['multi-url', 1, 'https://example.com/b'])
  })

  test('shifts indexes when dataToApplyToContext is provided (req0 override)', async () => {
    const extra = { extra: true }
    const k1Data = { k: 1 }
    const k2Data = { k: 2 }
    const u1Data = { u: 1 }

    useManyK8sSmartResourceMock.mockImplementation(
      makeK8sResultsMock({
        k1: { data: k1Data },
        k2: { data: k2Data },
      }),
    )

    useQueriesMock.mockImplementation(({ queries }: any) =>
      makeStableUrlResults({ data: u1Data }).slice(0, queries.length),
    )

    const items = [{ id: 'k1' } as any, { id: 'k2' } as any, 'https://example.com/a']

    render(
      <MultiQueryProvider items={items} dataToApplyToContext={extra}>
        <Output />
      </MultiQueryProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('data-req0').textContent).toBe(JSON.stringify(extra))
      expect(screen.getByTestId('data-req1').textContent).toBe(JSON.stringify(k1Data))
      expect(screen.getByTestId('data-req2').textContent).toBe(JSON.stringify(k2Data))
    })

    expect(screen.getByTestId('data-req3').textContent).toBe(JSON.stringify(u1Data))
    expect(screen.getByTestId('err-0').textContent).toBe('null')
  })

  test('isLoading true if any K8s entry is loading', async () => {
    useManyK8sSmartResourceMock.mockImplementation(
      makeK8sResultsMock({
        k1: { data: { k: 1 }, isLoading: true },
        k2: { data: { k: 2 }, isLoading: false },
      }),
    )

    useQueriesMock.mockImplementation(({ queries }: any) => makeStableUrlResults().slice(0, queries.length))

    render(
      <MultiQueryProvider items={[{ id: 'k1' } as any, { id: 'k2' } as any]}>
        <Output />
      </MultiQueryProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('true')
    })
  })

  test('isLoading true if any URL query is loading', async () => {
    useManyK8sSmartResourceMock.mockImplementation(
      makeK8sResultsMock({
        k1: { data: { k: 1 } },
      }),
    )

    useQueriesMock.mockImplementation(({ queries }: any) =>
      makeStableUrlResults({ data: undefined, isLoading: true }).slice(0, queries.length),
    )

    render(
      <MultiQueryProvider items={[{ id: 'k1' } as any, 'https://example.com/a']}>
        <Output />
      </MultiQueryProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('true')
    })
  })

  test('isError true and errors array populated when any K8s entry errors', async () => {
    useManyK8sSmartResourceMock.mockImplementation(
      makeK8sResultsMock({
        k1: { data: { k: 1 }, isError: true, error: new Error('k8s boom') },
        k2: { data: { k: 2 }, isError: false },
      }),
    )

    useQueriesMock.mockImplementation(({ queries }: any) => makeStableUrlResults().slice(0, queries.length))

    render(
      <MultiQueryProvider items={[{ id: 'k1' } as any, { id: 'k2' } as any]}>
        <Output />
      </MultiQueryProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('isError').textContent).toBe('true')
    })

    expect(screen.getByTestId('err-0').textContent).toBe('k8s boom')
    expect(screen.getByTestId('err-1').textContent).toBe('null')
  })

  test('isError true and errors array populated when any URL query errors', async () => {
    useManyK8sSmartResourceMock.mockImplementation(
      makeK8sResultsMock({
        k1: { data: { k: 1 } },
      }),
    )

    useQueriesMock.mockImplementation(({ queries }: any) =>
      makeStableUrlResults(
        { data: undefined, isError: true, error: new Error('url boom') },
        { data: { u: 2 }, isError: false },
      ).slice(0, queries.length),
    )

    render(
      <MultiQueryProvider items={[{ id: 'k1' } as any, 'https://example.com/a', 'https://example.com/b']}>
        <Output />
      </MultiQueryProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('isError').textContent).toBe('true')
    })

    expect(screen.getByTestId('err-0').textContent).toBe('null')
    expect(screen.getByTestId('err-1').textContent).toBe('url boom')
    expect(screen.getByTestId('err-2').textContent).toBe('null')
  })

  test('handles empty items list', () => {
    useManyK8sSmartResourceMock.mockImplementation(() => [])
    useQueriesMock.mockImplementation(() => [])

    render(
      <MultiQueryProvider items={[]}>
        <Output />
      </MultiQueryProvider>,
    )

    expect(screen.getByTestId('isLoading').textContent).toBe('false')
    expect(screen.getByTestId('isError').textContent).toBe('false')
  })

  // -------------------- proving the aggregation problem --------------------

  describe('aggregated isError misleads per-request consumers', () => {
    test('when only req1 (URL) fails, isError is true but req0 data is fully available', async () => {
      const k1Data = { metadata: { name: 'my-resource' }, spec: { replicas: 3 } }

      useManyK8sSmartResourceMock.mockImplementation(
        makeK8sResultsMock({
          k1: { data: k1Data, isError: false },
        }),
      )

      useQueriesMock.mockImplementation(({ queries }: any) =>
        makeStableUrlResults({ data: undefined, isError: true, error: new Error('404 Not Found') }).slice(
          0,
          queries.length,
        ),
      )

      render(
        <MultiQueryProvider items={[{ id: 'k1' } as any, 'https://example.com/missing']}>
          <Output />
        </MultiQueryProvider>,
      )

      await waitFor(() => {
        // isError is true globally — ANY molecule checking this will think everything failed
        expect(screen.getByTestId('isError').textContent).toBe('true')
      })

      // But req0 data is perfectly fine — a molecule using req0 should NOT show error
      expect(screen.getByTestId('data-req0').textContent).toBe(JSON.stringify(k1Data))
      // req0 has no error
      expect(screen.getByTestId('err-0').textContent).toBe('null')
      // req1 is the only one with an error
      expect(screen.getByTestId('err-1').textContent).toBe('404 Not Found')
    })

    test('when only req0 (K8s) fails, isError is true but req1 data is fully available', async () => {
      const u1Data = { items: [{ name: 'ns-1' }, { name: 'ns-2' }] }

      useManyK8sSmartResourceMock.mockImplementation(
        makeK8sResultsMock({
          k1: { data: undefined, isError: true, error: new Error('forbidden') },
        }),
      )

      useQueriesMock.mockImplementation(({ queries }: any) =>
        makeStableUrlResults({ data: u1Data, isError: false }).slice(0, queries.length),
      )

      render(
        <MultiQueryProvider items={[{ id: 'k1' } as any, 'https://example.com/namespaces']}>
          <Output />
        </MultiQueryProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('isError').textContent).toBe('true')
      })

      // req1 data is available despite global isError being true
      expect(screen.getByTestId('data-req1').textContent).toBe(JSON.stringify(u1Data))
      expect(screen.getByTestId('err-0').textContent).toBe('forbidden')
      expect(screen.getByTestId('err-1').textContent).toBe('null')
    })
  })

  // -------------------- red-phase: per-request error helpers --------------------

  describe('per-request error helpers (hasErrorForReq, getErrorForReq)', () => {
    /**
     * These tests target `hasErrorForReq` and `getErrorForReq` — helpers that
     * do not exist yet on MultiQueryContextValue. They will FAIL until
     * Task 3 adds them to the provider. This is intentional TDD red-phase.
     */

    const PerRequestOutput = () => {
      const ctx = useMultiQuery()
      const hasHelper = typeof ctx.hasErrorForReq === 'function'
      const getHelper = typeof ctx.getErrorForReq === 'function'

      return (
        <div>
          <div data-testid="has-helper">{String(hasHelper)}</div>
          <div data-testid="get-helper">{String(getHelper)}</div>
          {hasHelper && (
            <>
              <div data-testid="has-err-0">{String(ctx.hasErrorForReq(0))}</div>
              <div data-testid="has-err-1">{String(ctx.hasErrorForReq(1))}</div>
              <div data-testid="has-err-99">{String(ctx.hasErrorForReq(99))}</div>
            </>
          )}
          {getHelper && (
            <>
              <div data-testid="get-err-0">{normalizeErr(ctx.getErrorForReq(0))}</div>
              <div data-testid="get-err-1">{normalizeErr(ctx.getErrorForReq(1))}</div>
              <div data-testid="get-err-99">{normalizeErr(ctx.getErrorForReq(99))}</div>
            </>
          )}
        </div>
      )
    }

    test('hasErrorForReq and getErrorForReq exist on context', async () => {
      useManyK8sSmartResourceMock.mockImplementation(makeK8sResultsMock({ k1: { data: { k: 1 } } }))
      useQueriesMock.mockImplementation(({ queries }: any) =>
        makeStableUrlResults({ data: { u: 1 } }).slice(0, queries.length),
      )

      render(
        <MultiQueryProvider items={[{ id: 'k1' } as any, 'https://example.com/a']}>
          <PerRequestOutput />
        </MultiQueryProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('has-helper').textContent).toBe('true')
        expect(screen.getByTestId('get-helper').textContent).toBe('true')
      })
    })

    test('hasErrorForReq returns false for successful req, true for failed req', async () => {
      useManyK8sSmartResourceMock.mockImplementation(
        makeK8sResultsMock({
          k1: { data: { k: 1 }, isError: false },
        }),
      )

      useQueriesMock.mockImplementation(({ queries }: any) =>
        makeStableUrlResults({ data: undefined, isError: true, error: new Error('url failed') }).slice(
          0,
          queries.length,
        ),
      )

      render(
        <MultiQueryProvider items={[{ id: 'k1' } as any, 'https://example.com/bad']}>
          <PerRequestOutput />
        </MultiQueryProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('has-helper').textContent).toBe('true')
      })

      // req0 (K8s) succeeded
      expect(screen.getByTestId('has-err-0').textContent).toBe('false')
      // req1 (URL) failed
      expect(screen.getByTestId('has-err-1').textContent).toBe('true')
      // out-of-bounds index → false
      expect(screen.getByTestId('has-err-99').textContent).toBe('false')
    })

    test('getErrorForReq returns null for successful req, Error for failed req', async () => {
      useManyK8sSmartResourceMock.mockImplementation(
        makeK8sResultsMock({
          k1: { data: { k: 1 }, isError: false },
        }),
      )

      useQueriesMock.mockImplementation(({ queries }: any) =>
        makeStableUrlResults({ data: undefined, isError: true, error: new Error('url failed') }).slice(
          0,
          queries.length,
        ),
      )

      render(
        <MultiQueryProvider items={[{ id: 'k1' } as any, 'https://example.com/bad']}>
          <PerRequestOutput />
        </MultiQueryProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('get-helper').textContent).toBe('true')
      })

      // req0 (K8s) succeeded → null
      expect(screen.getByTestId('get-err-0').textContent).toBe('null')
      // req1 (URL) failed → error message
      expect(screen.getByTestId('get-err-1').textContent).toBe('url failed')
      // out-of-bounds → null
      expect(screen.getByTestId('get-err-99').textContent).toBe('null')
    })
  })
})
