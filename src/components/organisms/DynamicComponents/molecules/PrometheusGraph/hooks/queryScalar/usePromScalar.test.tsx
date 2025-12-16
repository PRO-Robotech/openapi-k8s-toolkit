/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TPrometheusScalarResponse } from '../../types'
import { usePromScalar } from './usePromScalar'

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
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
  const qRes = usePromScalar({ query, enabled, refetchInterval })

  return (
    <div>
      <div data-testid="isLoading">{String(qRes.isLoading)}</div>
      <div data-testid="isError">{String(qRes.isError)}</div>
      <div data-testid="data-json">{JSON.stringify(qRes.data ?? null)}</div>
      <div data-testid="error-text">{qRes.error ? fmtErr(qRes.error) : 'null'}</div>
    </div>
  )
}

describe('usePromScalar', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('fetches /api/v1/query and returns the scalar response', async () => {
    const resp: TPrometheusScalarResponse = {
      status: 'success',
      data: {
        resultType: 'scalar',
        result: [1700000000, '42'],
      },
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => resp,
    })

    renderWithClient(<Consumer query="scalar(42)" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('data-json')).toHaveTextContent(JSON.stringify(resp))

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string

    expect(calledUrl).toContain('http://localhost:9090/api/v1/query?query=')
    expect(calledUrl).toContain(encodeURIComponent('scalar(42)'))
  })

  test('sets isError when HTTP response is not ok', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    renderWithClient(<Consumer query="scalar(1)" />)

    await waitFor(() => {
      expect(screen.getByTestId('isError')).toHaveTextContent('true')
    })

    expect(screen.getByTestId('error-text')).toHaveTextContent('Prometheus request failed: 500')
  })

  test('does not fetch when enabled is false', async () => {
    renderWithClient(<Consumer query="scalar(1)" enabled={false} />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('throws when resultType is not scalar (safety check)', async () => {
    const notScalarResp = {
      status: 'success',
      data: { resultType: 'vector', result: [] },
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => notScalarResp,
    })

    renderWithClient(<Consumer query="up" />)

    await waitFor(() => {
      expect(screen.getByTestId('isError')).toHaveTextContent('true')
    })

    expect(screen.getByTestId('error-text')).toHaveTextContent('Expected scalar resultType, got: vector')
  })

  test('uses query in the queryKey (smoke: triggers new fetch when query changes)', async () => {
    const resp1: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [1, '1'] },
    }
    const resp2: TPrometheusScalarResponse = {
      status: 'success',
      data: { resultType: 'scalar', result: [2, '2'] },
    }

    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => resp1 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => resp2 })

    const { rerender } = renderWithClient(<Consumer query="scalar(1)" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    rerender(
      <QueryClientProvider client={makeClient()}>
        <Consumer query="scalar(2)" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    })
  })
})
