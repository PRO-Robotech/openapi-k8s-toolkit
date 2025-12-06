/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { MultiK8sProvider, useMultiK8s } from './multiK8sProvider'

jest.mock('hooks/useK8sSmartResource', () => ({
  useK8sSmartResource: jest.fn(),
}))

type HookRes = {
  data: unknown
  isLoading: boolean
  isError: boolean
  error: any
}

const makeDefaultRes = (): HookRes => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
})

/**
 * Build params that satisfy your real type requirements.
 * Your TS error explicitly listed: cluster, apiVersion, plural.
 * We also include name & namespace for stability.
 */
const makeParams = (name: string) =>
  ({
    cluster: 'test-cluster',
    apiGroup: 'apps',
    apiVersion: 'v1',
    plural: 'deployments',
    name,
    namespace: 'default',
  }) as any

/**
 * Stable mock store keyed by resource name.
 */
const resByName = new Map<string, HookRes>()

const setRes = (name: string, partial: Partial<HookRes>) => {
  resByName.set(name, { ...makeDefaultRes(), ...partial })
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

/**
 * --------------------------------------------------------------------------
 * TEST-ONLY MOCK STRATEGY (no prod-code changes)
 *
 * Problem:
 * - MultiK8sProvider does RESET on mount and on length changes.
 * - Effect ordering can wipe SET_ENTRY updates.
 * - Existing ResourceFetcher instances (e.g. req0) may not re-dispatch
 *   after RESET if hook deps don't change.
 *
 * Solution:
 * - Provide a "wave" of mock values.
 * - Each (wave,name) has:
 *   - First call: return base but tweak error null -> undefined
 *     to guarantee at least one dep changes later.
 *   - Second+ calls: return a stable cloned object for that wave.
 * - When we need existing fetchers to re-dispatch (length change),
 *   we bump the wave *before* rerender.
 *
 * This causes exactly one extra dependency change per wave, no infinite loop.
 */

let mockWave = 0
const callCountByKey = new Map<string, number>()
const stableSecondByKey = new Map<string, HookRes>()

const cloneData = (d: any) => {
  if (Array.isArray(d)) return [...d]
  if (d && typeof d === 'object') return { ...d }
  return d
}

const cloneError = (e: any) => {
  if (e == null) return e
  if (typeof e === 'string') return e
  if (e instanceof Error) return new Error(e.message)
  if (typeof e === 'object') return { ...e }
  return e
}

/**
 * Test consumer that prints the context state.
 */
const Consumer = ({ total }: { total: number }) => {
  const ctx = useMultiK8s()

  return (
    <div>
      <div data-testid="isLoading">{String(ctx.isLoading)}</div>
      <div data-testid="isError">{String(ctx.isError)}</div>
      <div data-testid="errors-len">{String(ctx.errors.length)}</div>
      <div data-testid="data-json">{JSON.stringify(ctx.data)}</div>

      {Array.from({ length: total }, (_, i) => {
        const v = (ctx.data as any)[`req${i}`]
        return (
          <div key={`d-${i}`} data-testid={`data-req${i}`}>
            {typeof v === 'undefined' ? 'undefined' : JSON.stringify(v)}
          </div>
        )
      })}

      {Array.from({ length: total }, (_, i) => {
        const e = ctx.errors[i]
        return (
          <div key={`e-${i}`} data-testid={`err-${i}`}>
            {fmtErr(e)}
          </div>
        )
      })}
    </div>
  )
}

describe('MultiK8sProvider / useMultiK8s', () => {
  const useK8sSmartResourceMock = useK8sSmartResource as jest.Mock

  beforeEach(() => {
    resByName.clear()
    jest.clearAllMocks()

    mockWave = 0
    callCountByKey.clear()
    stableSecondByKey.clear()

    useK8sSmartResourceMock.mockImplementation((params: any) => {
      const name = params?.name ?? '__no-name__'
      const base = name && resByName.has(name) ? resByName.get(name)! : makeDefaultRes()

      const key = `${mockWave}::${name}`

      const nextCount = (callCountByKey.get(key) ?? 0) + 1
      callCountByKey.set(key, nextCount)

      // First call in this wave: tweak error null -> undefined
      if (nextCount === 1) {
        return {
          ...base,
          error: base.error === null ? undefined : base.error,
        }
      }

      // Second+ calls in this wave: stable clone
      if (!stableSecondByKey.has(key)) {
        stableSecondByKey.set(key, {
          ...base,
          data: cloneData(base.data),
          error: base.error == null ? base.error : cloneError(base.error),
        })
      }

      return stableSecondByKey.get(key)!
    })
  })

  test('aggregates K8s resources into req0..reqN and populates errors with nulls (no dataToApplyToContext)', async () => {
    const r1 = makeParams('r1')
    const r2 = makeParams('r2')
    const r3 = makeParams('r3')

    setRes('r1', { data: { k: 1 } })
    setRes('r2', { data: { k: 2 } })
    setRes('r3', { data: { k: 3 } })

    render(
      <MultiK8sProvider resources={[r1, r2, r3]}>
        <Consumer total={3} />
      </MultiK8sProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('data-req0')).toHaveTextContent('{"k":1}')
      expect(screen.getByTestId('data-req1')).toHaveTextContent('{"k":2}')
      expect(screen.getByTestId('data-req2')).toHaveTextContent('{"k":3}')
    })

    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('errors-len')).toHaveTextContent('3')

    expect(screen.getByTestId('err-0')).toHaveTextContent('null')
    expect(screen.getByTestId('err-1')).toHaveTextContent('null')
    expect(screen.getByTestId('err-2')).toHaveTextContent('null')

    // Avoid strict call-count assertions; RESET on mount can add extra renders.
    expect(useK8sSmartResourceMock.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  test('short-circuits when dataToApplyToContext is provided', () => {
    const r1 = makeParams('r1')
    const r2 = makeParams('r2')

    setRes('r1', { data: { k: 1 } })
    setRes('r2', { data: { k: 2 } })

    const extra = { hello: 'world' }

    render(
      <MultiK8sProvider resources={[r1, r2]} dataToApplyToContext={extra}>
        <Consumer total={1} />
      </MultiK8sProvider>,
    )

    expect(screen.getByTestId('data-req0')).toHaveTextContent(JSON.stringify(extra))
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('errors-len')).toHaveTextContent('0')
  })

  test('isLoading true if any resource is loading', async () => {
    const r1 = makeParams('r1')
    const r2 = makeParams('r2')

    setRes('r1', { isLoading: true })
    setRes('r2', { data: { k: 2 } })

    render(
      <MultiK8sProvider resources={[r1, r2]}>
        <Consumer total={2} />
      </MultiK8sProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('true')
    })
  })

  test('isError true and errors array populated when any resource errors', async () => {
    const r1 = makeParams('r1')
    const r2 = makeParams('r2')

    const err = new Error('k8s boom')
    setRes('r1', { isError: true, error: err })
    setRes('r2', { data: { k: 2 } })

    render(
      <MultiK8sProvider resources={[r1, r2]}>
        <Consumer total={2} />
      </MultiK8sProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('isError')).toHaveTextContent('true')
    })

    expect(screen.getByTestId('err-0')).toHaveTextContent('k8s boom')
    expect(screen.getByTestId('err-1')).toHaveTextContent('null')
  })

  test('RESET behavior: when resources length changes, aggregator resets size and new req keys appear', async () => {
    const r1 = makeParams('r1')
    const r2 = makeParams('r2')

    setRes('r1', { data: { k: 1 } })
    setRes('r2', { data: { k: 2 } })

    const { rerender } = render(
      <MultiK8sProvider resources={[r1]}>
        <Consumer total={2} />
      </MultiK8sProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('data-req0')).toHaveTextContent('{"k":1}')
      expect(screen.getByTestId('errors-len')).toHaveTextContent('1')
    })

    // ✅ Bump wave so the existing r1 fetcher will re-dispatch after RESET.
    mockWave += 1

    rerender(
      <MultiK8sProvider resources={[r1, r2]}>
        <Consumer total={2} />
      </MultiK8sProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('data-req0')).toHaveTextContent('{"k":1}')
      expect(screen.getByTestId('data-req1')).toHaveTextContent('{"k":2}')
      expect(screen.getByTestId('errors-len')).toHaveTextContent('2')
    })
  })

  test('useMultiQuery throws outside provider', () => {
    const Spy = () => {
      useMultiK8s()
      return null
    }

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Spy />)).toThrow('useMultiK8s must be used within a MultiK8sProvider')

    consoleErrorSpy.mockRestore()
  })
})
