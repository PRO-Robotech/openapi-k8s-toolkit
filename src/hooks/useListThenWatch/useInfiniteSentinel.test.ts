/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import type { RefObject } from 'react'
import { renderHook, act } from '@testing-library/react'
import { useInfiniteSentinel } from './useInfiniteSentinel'

type IOInstance = {
  observe: jest.Mock
  disconnect: jest.Mock
  _cb: IntersectionObserverCallback
}

describe('useInfiniteSentinel', () => {
  let instances: IOInstance[] = []

  beforeEach(() => {
    instances = []
    ;(global as any).IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
      const inst: IOInstance = {
        observe: jest.fn(),
        disconnect: jest.fn(),
        _cb: cb,
      }
      instances.push(inst)
      return inst as unknown as IntersectionObserver
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const makeRef = (el: HTMLElement | null): RefObject<HTMLElement> => ({ current: el }) as RefObject<HTMLElement>

  test('does nothing if sentinel element is missing', () => {
    const onNeedMore = jest.fn()
    const ref = makeRef(null)

    renderHook(() => useInfiniteSentinel(ref, true, onNeedMore))

    expect((global as any).IntersectionObserver).not.toHaveBeenCalled()
    expect(instances).toHaveLength(0)
  })

  test('observes the sentinel element', () => {
    const onNeedMore = jest.fn()
    const el = document.createElement('div')
    const ref = makeRef(el)

    renderHook(() => useInfiniteSentinel(ref, true, onNeedMore))

    expect((global as any).IntersectionObserver).toHaveBeenCalledTimes(1)
    expect(instances[0].observe).toHaveBeenCalledWith(el)
  })

  test('calls onNeedMore when visible and hasMore=true', () => {
    const onNeedMore = jest.fn()
    const el = document.createElement('div')
    const ref = makeRef(el)

    renderHook(() => useInfiniteSentinel(ref, true, onNeedMore))

    const io = instances[0]

    act(() => {
      io._cb(
        [{ isIntersecting: false } as IntersectionObserverEntry, { isIntersecting: true } as IntersectionObserverEntry],
        io as unknown as IntersectionObserver,
      )
    })

    expect(onNeedMore).toHaveBeenCalledTimes(1)
  })

  test('does not call onNeedMore when hasMore=false even if visible', () => {
    const onNeedMore = jest.fn()
    const el = document.createElement('div')
    const ref = makeRef(el)

    renderHook(() => useInfiniteSentinel(ref, false, onNeedMore))

    const io = instances[0]

    act(() => {
      io._cb([{ isIntersecting: true } as IntersectionObserverEntry], io as any)
    })

    expect(onNeedMore).not.toHaveBeenCalled()
  })

  test('disconnects on unmount', () => {
    const onNeedMore = jest.fn()
    const el = document.createElement('div')
    const ref = makeRef(el)

    const { unmount } = renderHook(() => useInfiniteSentinel(ref, true, onNeedMore))

    const io = instances[0]
    expect(io.disconnect).not.toHaveBeenCalled()

    unmount()

    expect(io.disconnect).toHaveBeenCalledTimes(1)
  })

  test('recreates observer when hasMore changes (effect deps)', () => {
    const onNeedMore = jest.fn()
    const el = document.createElement('div')
    const ref = makeRef(el)

    const { rerender } = renderHook(({ hasMore }) => useInfiniteSentinel(ref, hasMore, onNeedMore), {
      initialProps: { hasMore: true },
    })

    expect(instances).toHaveLength(1)
    const first = instances[0]

    rerender({ hasMore: false })

    expect(first.disconnect).toHaveBeenCalledTimes(1)
    expect(instances).toHaveLength(2)
  })
})
