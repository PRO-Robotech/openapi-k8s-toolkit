/* eslint-disable @typescript-eslint/no-unused-vars */
/** @jest-environment jsdom */

import React from 'react'
import { renderHook } from '@testing-library/react'
import { createContextFactory } from './createContextFactory'

const silenceConsoleError = (fn: () => void) => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    fn()
  } finally {
    spy.mockRestore()
  }
}

describe('createContextFactory', () => {
  test('useTypedContext throws when used outside Provider', () => {
    const { useTypedContext } = createContextFactory<{ a: number }>()

    silenceConsoleError(() => {
      expect(() => renderHook(() => useTypedContext())).toThrow('useTypedContext must be used within a Provider')
    })
  })

  test('useTypedContext returns the provided value', () => {
    const { Provider, useTypedContext } = createContextFactory<{ a: number; b: string }>()

    const value = { a: 1, b: 'x' }

    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => <Provider value={value}>{children}</Provider>

    const { result } = renderHook(() => useTypedContext(), { wrapper })

    expect(result.current).toBe(value)
    expect(result.current).toEqual({ a: 1, b: 'x' })
  })

  test('Provider memoizes value based on Object.values(value) (same primitive values keep previous reference)', () => {
    const { Provider, useTypedContext } = createContextFactory<{ a: number; b: string }>()

    const value1 = { a: 1, b: 'x' }
    const value2 = { a: 1, b: 'x' } // new object, same primitive values

    // Use a closure variable so wrapper type stays `{ children }` only.
    let providedValue = value1

    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <Provider value={providedValue}>{children}</Provider>
    )

    // Add a dummy prop so we can call rerender to re-run wrapper.
    const { result, rerender } = renderHook((_props: { tick: number }) => useTypedContext(), {
      wrapper,
      initialProps: { tick: 0 },
    })

    expect(result.current).toBe(value1)

    providedValue = value2
    rerender({ tick: 1 })

    // Because deps are Object.values(value) => [1, 'x'] unchanged,
    // useMemo should keep the previous memoized object (value1).
    expect(result.current).toBe(value1)
    expect(result.current).not.toBe(value2)
  })

  test('Provider updates memoized value when at least one value changes', () => {
    const { Provider, useTypedContext } = createContextFactory<{ a: number; b: string }>()

    const value1 = { a: 1, b: 'x' }
    const value3 = { a: 2, b: 'x' } // a changed

    let providedValue = value1

    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <Provider value={providedValue}>{children}</Provider>
    )

    const { result, rerender } = renderHook((_props: { tick: number }) => useTypedContext(), {
      wrapper,
      initialProps: { tick: 0 },
    })

    expect(result.current).toBe(value1)

    providedValue = value3
    rerender({ tick: 1 })

    expect(result.current).toBe(value3)
    expect(result.current).not.toBe(value1)
  })
})
