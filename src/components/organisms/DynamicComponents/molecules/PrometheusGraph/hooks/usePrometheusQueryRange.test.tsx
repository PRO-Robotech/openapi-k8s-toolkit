/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { usePrometheusQueryRange } from './usePrometheusQueryRange'
import { buildPrometheusRangeParams } from '../utils/prometheus'

jest.mock('../utils/prometheus', () => ({
  buildPrometheusRangeParams: jest.fn(),
}))

const buildPrometheusRangeParamsMock = buildPrometheusRangeParams as jest.Mock

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
  range,
  enabled,
  refetchInterval,
}: {
  query: string
  range?: string
  enabled?: boolean
  refetchInterval?: number | false
}) => {
  const qRes = usePrometheusQueryRange({ query, range, enabled, refetchInterval })

  return (
    <div>
      <div data-testid="isLoading">{String(qRes.isLoading)}</div>
      <div data-testid="isError">{String(qRes.isError)}</div>
      <div data-testid="data-json">{JSON.stringify(qRes.data ?? null)}</div>
      <div data-testid="error-text">{qRes.error ? fmtErr(qRes.error) : 'null'}</div>
    </div>
  )
}

describe('usePrometheusQueryRange', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    jest.clearAllMocks()

    buildPrometheusRangeParamsMock.mockReturnValue({
      start: 100,
      end: 200,
      step: 5,
    })

    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('fetches query_range and maps to ChartPoint[]', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: {
          resultType: 'matrix',
          result: [
            {
              metric: { pod: 'p1' },
              values: [
                [100, '1.5'],
                [101, '2'],
              ],
            },
          ],
        },
      }),
    })

    renderWithClient(<Consumer query="sum(rate(http_requests_total[5m]))" range="1h" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('data-json')).toHaveTextContent(
      JSON.stringify([
        { timestamp: 100 * 1000, value: 1.5 },
        { timestamp: 101 * 1000, value: 2 },
      ]),
    )

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string

    expect(calledUrl).toContain('http://localhost:9090/api/v1/query_range?query=')
    expect(calledUrl).toContain(encodeURIComponent('sum(rate(http_requests_total[5m]))'))
    expect(calledUrl).toContain('&start=100')
    expect(calledUrl).toContain('&end=200')
    expect(calledUrl).toContain('&step=5')
  })

  test('returns empty data when Prometheus responds with success but no series', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: {
          resultType: 'matrix',
          result: [],
        },
      }),
    })

    renderWithClient(<Consumer query="up" range="1h" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('data-json')).toHaveTextContent(JSON.stringify([]))
  })

  test('sets isError when HTTP response is not ok', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    renderWithClient(<Consumer query="up" range="1h" />)

    await waitFor(() => {
      expect(screen.getByTestId('isError')).toHaveTextContent('true')
    })

    expect(screen.getByTestId('error-text')).toHaveTextContent('Prometheus request failed: 500')
  })

  test('does not fetch when enabled is false', async () => {
    renderWithClient(<Consumer query="up" range="1h" enabled={false} />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('uses range to build params (mock asserted)', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: { resultType: 'matrix', result: [] },
      }),
    })

    renderWithClient(<Consumer query="up" range="6h" />)

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(buildPrometheusRangeParamsMock).toHaveBeenCalledWith('6h')
  })
})
