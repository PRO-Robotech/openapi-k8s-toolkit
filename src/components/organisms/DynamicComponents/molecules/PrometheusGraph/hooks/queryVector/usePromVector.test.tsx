/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TPrometheusVectorResponse } from '../../utils/vectorAdapter'
import { usePromVector } from './usePromVector'

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // ✅ v5 replacement for cacheTime
        staleTime: 0,
      },
    },
  })

const renderWithClient = (ui: React.ReactElement) => {
  const client = makeClient()
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const fmtErr = (e: any) => {
  if (e == null) return String(e)
  if (typeof e === 'string') return e
  if (e?.message) return String(e.message)
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

const Consumer = ({
  query,
  enabled,
  refetchInterval,
}: {
  query: string
  enabled?: boolean
  refetchInterval?: number | false
}) => {
  const qRes = usePromVector({ query, enabled, refetchInterval })

  return (
    <div>
      <div data-testid="isLoading">{String(qRes.isLoading)}</div>
      <div data-testid="isError">{String(qRes.isError)}</div>
      <div data-testid="data-json">{JSON.stringify(qRes.data ?? null)}</div>
      <div data-testid="error-text">{qRes.error ? fmtErr(qRes.error) : 'null'}</div>
    </div>
  )
}

describe('usePromVector', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('fetches /api/v1/query and returns the vector response', async () => {
    const resp: TPrometheusVectorResponse = {
      status: 'success',
      data: {
        resultType: 'vector',
        result: [
          { metric: { pod: 'p1' }, value: [100, '1.5'] },
          { metric: { pod: 'p2' }, value: [101, '2'] },
        ],
      },
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => resp,
    })

    renderWithClient(<Consumer query="up" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('data-json')).toHaveTextContent(JSON.stringify(resp))

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string

    expect(calledUrl).toContain('http://localhost:9090/api/v1/query?query=')
    expect(calledUrl).toContain(encodeURIComponent('up'))
  })

  test('succeeds with empty result', async () => {
    const resp: TPrometheusVectorResponse = {
      status: 'success',
      data: { resultType: 'vector', result: [] },
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => resp,
    })

    renderWithClient(<Consumer query="up" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('data-json')).toHaveTextContent(JSON.stringify(resp))
  })

  test('sets isError when HTTP response is not ok', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    renderWithClient(<Consumer query="up" />)

    await waitFor(() => {
      expect(screen.getByTestId('isError')).toHaveTextContent('true')
    })

    expect(screen.getByTestId('error-text')).toHaveTextContent('Prometheus request failed: 500')
  })

  test('does not fetch when enabled is false', async () => {
    renderWithClient(<Consumer query="up" enabled={false} />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('uses query in the queryKey (smoke: triggers new fetch when query changes)', async () => {
    const resp1: TPrometheusVectorResponse = {
      status: 'success',
      data: { resultType: 'vector', result: [] },
    }
    const resp2: TPrometheusVectorResponse = {
      status: 'success',
      data: { resultType: 'vector', result: [{ metric: {}, value: [1, '1'] }] },
    }

    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => resp1 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => resp2 })

    const { rerender } = renderWithClient(<Consumer query="up" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    rerender(
      <QueryClientProvider client={makeClient()}>
        <Consumer query="process_cpu_seconds_total" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    })
  })
})
