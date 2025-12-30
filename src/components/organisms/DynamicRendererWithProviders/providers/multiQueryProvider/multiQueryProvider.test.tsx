/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { useQueries } from '@tanstack/react-query'
import { MultiQueryProvider, useMultiQuery } from './multiQueryProvider'

jest.mock('@tanstack/react-query', () => ({
  useQueries: jest.fn(),
}))

type QueryRes = {
  data?: unknown
  isLoading: boolean
  isError: boolean
  error?: Error | null
}

const makeQ = (partial: Partial<QueryRes> = {}): QueryRes => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  ...partial,
})

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
 * Test consumer that prints the context state.
 */
const Consumer = ({ total }: { total: number }) => {
  const ctx = useMultiQuery()

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

describe('MultiQueryProvider / useMultiQuery', () => {
  const useQueriesMock = useQueries as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('aggregates queries into req0..reqN and populates errors with nulls when no dataToApplyToContext', () => {
    const urls = ['u1', 'u2', 'u3']

    useQueriesMock.mockReturnValue([makeQ({ data: { k: 1 } }), makeQ({ data: { k: 2 } }), makeQ({ data: { k: 3 } })])

    render(
      <MultiQueryProvider urls={urls} dataToApplyToContext={undefined as any}>
        <Consumer total={3} />
      </MultiQueryProvider>,
    )

    expect(screen.getByTestId('data-req0')).toHaveTextContent('{"k":1}')
    expect(screen.getByTestId('data-req1')).toHaveTextContent('{"k":2}')
    expect(screen.getByTestId('data-req2')).toHaveTextContent('{"k":3}')

    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    expect(screen.getByTestId('errors-len')).toHaveTextContent('3')

    expect(screen.getByTestId('err-0')).toHaveTextContent('null')
    expect(screen.getByTestId('err-1')).toHaveTextContent('null')
    expect(screen.getByTestId('err-2')).toHaveTextContent('null')

    // sanity: useQueries called once
    expect(useQueriesMock).toHaveBeenCalledTimes(1)
  })

  test('short-circuits when dataToApplyToContext is truthy', () => {
    const urls = ['u1', 'u2']
    const extra = { hello: 'world' }

    useQueriesMock.mockReturnValue([makeQ({ data: { k: 1 } }), makeQ({ data: { k: 2 } })])

    render(
      <MultiQueryProvider urls={urls} dataToApplyToContext={extra}>
        <Consumer total={2} />
      </MultiQueryProvider>,
    )

    // current implementation only sets req0
    expect(screen.getByTestId('data-req0')).toHaveTextContent(JSON.stringify(extra))
    expect(screen.getByTestId('data-req1')).toHaveTextContent('undefined')

    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    expect(screen.getByTestId('isError')).toHaveTextContent('false')
    // errors array is never populated in the else branch
    expect(screen.getByTestId('errors-len')).toHaveTextContent('0')
  })

  test('isLoading true if any query is loading', () => {
    const urls = ['u1', 'u2']

    useQueriesMock.mockReturnValue([makeQ({ isLoading: true }), makeQ({ data: { k: 2 } })])

    render(
      <MultiQueryProvider urls={urls} dataToApplyToContext={undefined as any}>
        <Consumer total={2} />
      </MultiQueryProvider>,
    )

    expect(screen.getByTestId('isLoading')).toHaveTextContent('true')
    expect(screen.getByTestId('isError')).toHaveTextContent('false')
  })

  test('isError true and errors array populated when any query errors', () => {
    const urls = ['u1', 'u2']
    const err = new Error('boom')

    useQueriesMock.mockReturnValue([makeQ({ isError: true, error: err }), makeQ({ data: { k: 2 } })])

    render(
      <MultiQueryProvider urls={urls} dataToApplyToContext={undefined as any}>
        <Consumer total={2} />
      </MultiQueryProvider>,
    )

    expect(screen.getByTestId('isError')).toHaveTextContent('true')
    expect(screen.getByTestId('errors-len')).toHaveTextContent('2')

    expect(screen.getByTestId('err-0')).toHaveTextContent('boom')
    expect(screen.getByTestId('err-1')).toHaveTextContent('null')
  })

  test('passes mapped queries config to useQueries', () => {
    const urls = ['u1', 'u2']

    useQueriesMock.mockReturnValue([makeQ(), makeQ()])

    render(
      <MultiQueryProvider urls={urls} dataToApplyToContext={undefined as any}>
        <Consumer total={2} />
      </MultiQueryProvider>,
    )

    const callArg = useQueriesMock.mock.calls[0]?.[0]
    expect(callArg).toBeTruthy()
    expect(callArg.queries).toHaveLength(2)

    expect(callArg.queries[0].queryKey).toEqual(['multi', 0, 'u1'])
    expect(callArg.queries[1].queryKey).toEqual(['multi', 1, 'u2'])
    expect(typeof callArg.queries[0].queryFn).toBe('function')
    expect(typeof callArg.queries[1].queryFn).toBe('function')
  })

  test('useMultiQuery throws outside provider', () => {
    const Spy = () => {
      useMultiQuery()
      return null
    }

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Spy />)).toThrow('useMultiQuery must be used within a MultiQueryProvider')

    consoleErrorSpy.mockRestore()
  })
})
