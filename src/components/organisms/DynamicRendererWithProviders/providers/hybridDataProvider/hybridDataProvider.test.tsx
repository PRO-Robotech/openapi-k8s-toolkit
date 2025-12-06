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

const useK8sSmartResourceMock = jest.fn()
jest.mock('hooks/useK8sSmartResource', () => ({
  useK8sSmartResource: (args: any) => useK8sSmartResourceMock(args),
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
 * Two-phase stable K8s mock:
 * For each distinct params.id:
 *  - 1st call returns base
 *  - 2nd call returns base with a NEW ref for data if it's an object
 *    and a NEW ref for error if it's an object (e.g., Error)
 *
 * This causes K8sFetcher useEffect deps to change once after RESET,
 * letting it re-dispatch SET_ENTRY.
 */
const makeTwoPhaseK8sMock = (
  byId: Record<string, { data: any; isLoading?: boolean; isError?: boolean; error?: any }>,
) => {
  const counters = new Map<string, number>()
  const secondDataRefs = new Map<string, any>()
  const secondErrRefs = new Map<string, any>()

  return (params: any) => {
    const id = params?.id ?? 'unknown'
    const base = byId[id] ?? { data: undefined, isLoading: false, isError: false, error: null }

    const n = (counters.get(id) ?? 0) + 1
    counters.set(id, n)

    const isLoading = base.isLoading ?? false
    const isError = base.isError ?? false
    const error = base.error ?? null

    if (n === 1) {
      return { data: base.data, isLoading, isError, error }
    }

    // second-phase data ref
    if (!secondDataRefs.has(id)) {
      const d = base.data
      secondDataRefs.set(id, d && typeof d === 'object' ? { ...d } : d)
    }

    // second-phase error ref
    if (!secondErrRefs.has(id)) {
      const e = error

      if (e instanceof Error) {
        // new ref + preserves message
        secondErrRefs.set(id, new Error(e.message))
      } else if (e && typeof e === 'object') {
        // best-effort clone for AxiosError-like objects
        secondErrRefs.set(id, { ...(e as any) })
      } else {
        secondErrRefs.set(id, e)
      }
    }

    return {
      data: secondDataRefs.get(id),
      isLoading,
      isError,
      error: secondErrRefs.get(id),
    }
  }
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

    useK8sSmartResourceMock.mockImplementation(
      makeTwoPhaseK8sMock({
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

    useK8sSmartResourceMock.mockImplementation(
      makeTwoPhaseK8sMock({
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
    // IMPORTANT:
    // Provide a real object for data so the two-phase mock can change refs
    // and re-trigger K8sFetcher effect after RESET.
    useK8sSmartResourceMock.mockImplementation(
      makeTwoPhaseK8sMock({
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
    useK8sSmartResourceMock.mockImplementation(
      makeTwoPhaseK8sMock({
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
    // IMPORTANT:
    // Use Error object so two-phase can change error ref after RESET.
    useK8sSmartResourceMock.mockImplementation(
      makeTwoPhaseK8sMock({
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
    useK8sSmartResourceMock.mockImplementation(
      makeTwoPhaseK8sMock({
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
    useQueriesMock.mockImplementation(() => [])

    render(
      <MultiQueryProvider items={[]}>
        <Output />
      </MultiQueryProvider>,
    )

    expect(screen.getByTestId('isLoading').textContent).toBe('false')
    expect(screen.getByTestId('isError').textContent).toBe('false')
  })
})
