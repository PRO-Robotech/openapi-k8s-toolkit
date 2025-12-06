/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
/* eslint-disable dot-notation */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jest-environment jsdom */

import { renderHook, act } from '@testing-library/react'
import { useListWatch } from './useListWatch'
import { reducer } from './reducer'
import { compareRV, eventKey, getRV, getMaxRV } from './utils'

// -------------------- Mock WebSocket --------------------
type ListenerEntry = {
  type: string
  original: (ev: any) => void
  wrapped: (ev: any) => void
  once?: boolean
}

class MockWebSocket {
  static instances: MockWebSocket[] = []

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  readyState = MockWebSocket.CONNECTING
  sent: string[] = []
  private listeners: ListenerEntry[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  addEventListener(type: string, cb: (ev: any) => void, options?: any) {
    const once = Boolean(options && options.once)
    const wrapped = (ev: any) => {
      cb(ev)
      if (once) {
        this.listeners = this.listeners.filter(l => l.wrapped !== wrapped)
      }
    }
    this.listeners.push({ type, original: cb, wrapped, once })
  }

  removeEventListener(type: string, cb: (ev: any) => void) {
    this.listeners = this.listeners.filter(l => !(l.type === type && (l.original === cb || l.wrapped === cb)))
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.emit('close', {})
  }

  // ---- test helpers ----
  open() {
    this.readyState = MockWebSocket.OPEN
    this.emit('open', {})
  }

  message(frame: unknown) {
    this.emit('message', { data: JSON.stringify(frame) })
  }

  rawMessage(data: any) {
    this.emit('message', { data })
  }

  error() {
    this.emit('error', {})
  }

  private emit(type: string, ev: any) {
    for (const l of this.listeners.filter(x => x.type === type)) {
      l.wrapped(ev)
    }
  }
}

// -------------------- factories --------------------
const item = (uid: string, rv = '1', name = uid) =>
  ({
    metadata: { uid, name, namespace: 'ns', resourceVersion: rv },
  }) as any

const baseQuery = { apiVersion: 'v1', plural: 'pods' } as any

const baseOpts = {
  wsUrl: '/watch',
  query: baseQuery,
}

describe('utils', () => {
  test('compareRV length then lexicographic', () => {
    expect(compareRV('9', '10')).toBe(-1)
    expect(compareRV('10', '11')).toBe(-1)
    expect(compareRV('11', '10')).toBe(1)
    expect(compareRV('11', '11')).toBe(0)
  })

  test('eventKey prefers uid then falls back to namespace/name', () => {
    expect(eventKey(item('u1'))).toBe('u1')
    expect(eventKey({ metadata: { namespace: 'n', name: 'x' } } as any)).toBe('n/x')
  })

  test('getRV and getMaxRV', () => {
    const a = item('a', '5')
    const b = item('b', '12')
    expect(getRV(a as any)).toBe('5')
    expect(getMaxRV([a, b] as any)).toBe('12')
  })
})

describe('reducer', () => {
  test('RESET replaces state', () => {
    const s = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a'), item('b')] as any })
    expect(s.order).toEqual(['a', 'b'])
    expect(Object.keys(s.byKey)).toEqual(['a', 'b'])
  })

  test('APPEND_PAGE adds only new keys to end', () => {
    const initial = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a')] as any })
    const next = reducer(initial, { type: 'APPEND_PAGE', items: [item('a'), item('b')] as any })
    expect(next.order).toEqual(['a', 'b'])
  })

  test('UPSERT unshifts when new, keeps order when existing', () => {
    const initial = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a')] as any })
    const next = reducer(initial, { type: 'UPSERT', item: item('b') as any })
    expect(next.order[0]).toBe('b')

    const next2 = reducer(next, { type: 'UPSERT', item: item('a', '2') as any })
    expect(next2.order).toEqual(['b', 'a'])
  })

  test('REMOVE no-op when missing; removes when present', () => {
    const s = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a')] as any })
    const same = reducer(s, { type: 'REMOVE', key: 'missing' })
    expect(same).toBe(s)

    const next = reducer(s, { type: 'REMOVE', key: 'a' })
    expect(next.order).toEqual([])
    expect(next.byKey['a']).toBeUndefined()
  })
})

describe('useListWatch', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    ;(global as any).WebSocket = MockWebSocket as any
    jest.useFakeTimers()
    jest.spyOn(Math, 'random').mockReturnValue(1) // stabilize reconnect jitter
  })

  afterEach(() => {
    ;(Math.random as any).mockRestore?.()
    jest.useRealTimers()
  })

  test('does not connect when isEnabled=false', () => {
    const { result } = renderHook(() => useListWatch({ ...baseOpts, isEnabled: false }))
    expect(result.current.status).toBe('closed')
    expect(MockWebSocket.instances).toHaveLength(0)
  })

  test('connects when enabled flips from false to true, then closes', () => {
    const { result, rerender } = renderHook(({ enabled }) => useListWatch({ ...baseOpts, isEnabled: enabled }), {
      initialProps: { enabled: false },
    })

    expect(result.current.status).toBe('closed')
    expect(MockWebSocket.instances).toHaveLength(0)

    rerender({ enabled: true })
    expect(MockWebSocket.instances).toHaveLength(1)

    const ws = MockWebSocket.instances[0]
    act(() => ws.open())
    expect(result.current.status).toBe('open')

    rerender({ enabled: false })
    expect(result.current.status).toBe('closed')
  })

  test('upgrades http/https to ws/wss', () => {
    renderHook(() => useListWatch({ ...baseOpts, wsUrl: 'http://example.com/watch' }))
    expect(MockWebSocket.instances[0].url.startsWith('ws://')).toBe(true)

    MockWebSocket.instances = []
    renderHook(() => useListWatch({ ...baseOpts, wsUrl: 'https://example.com/watch' }))
    expect(MockWebSocket.instances[0].url.startsWith('wss://')).toBe(true)
  })

  test('handles INITIAL, PAGE, PAGE_ERROR, INITIAL_ERROR, SERVER_LOG, invalid JSON', () => {
    const onError = jest.fn()
    const { result } = renderHook(() => useListWatch({ ...baseOpts, onError }))
    const ws = MockWebSocket.instances[0]

    act(() => ws.open())
    expect(result.current.status).toBe('open')

    // invalid JSON -> ignored
    act(() => ws.rawMessage('{nope'))
    expect(result.current.total).toBe(0)

    // server log -> ignored
    act(() => ws.message({ type: 'SERVER_LOG', level: 'info', message: 'hi' }))
    expect(result.current.total).toBe(0)

    // initial error -> sets error
    act(() => ws.message({ type: 'INITIAL_ERROR', message: 'bad init' }))
    expect(result.current.lastError).toBe('bad init')
    expect(onError).toHaveBeenCalledWith('bad init')

    // initial snapshot
    act(() =>
      ws.message({
        type: 'INITIAL',
        items: [item('a', '5'), item('b', '6')],
        continue: 'c1',
        resourceVersion: '7',
      }),
    )
    expect(result.current.hasInitial).toBe(true)
    expect(result.current.total).toBe(2)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.continueToken).toBe('c1')

    // page append
    act(() => ws.message({ type: 'PAGE', items: [item('c', '8')], continue: undefined }))
    expect(result.current.total).toBe(3)
    expect(result.current.hasMore).toBe(false)

    // page error
    act(() => ws.message({ type: 'PAGE_ERROR', error: 'page failed' }))
    expect(result.current.lastError).toBe('page failed')
  })

  test('ADDED/MODIFIED/DELETED respect paused and ignoreRemove flags', () => {
    const { result } = renderHook(() => useListWatch(baseOpts))
    const ws = MockWebSocket.instances[0]

    act(() => ws.open())
    act(() => ws.message({ type: 'INITIAL', items: [item('a')] }))

    act(() => ws.message({ type: 'ADDED', item: item('b') }))
    expect(result.current.state.byKey['b']).toBeTruthy()
    expect(result.current.state.order[0]).toBe('b')

    act(() => ws.message({ type: 'MODIFIED', item: item('b', '2') }))
    expect(result.current.state.byKey['b']?.metadata?.resourceVersion).toBe('2')

    act(() => ws.message({ type: 'DELETED', item: item('a') }))
    expect(result.current.state.byKey['a']).toBeUndefined()

    // ignore deletes
    act(() => result.current.setIgnoreRemove(true))
    act(() => ws.message({ type: 'ADDED', item: item('x') }))
    act(() => ws.message({ type: 'DELETED', item: item('x') }))
    expect(result.current.state.byKey['x']).toBeTruthy()

    // paused stops applying deltas
    act(() => result.current.setPaused(true))
    act(() => ws.message({ type: 'ADDED', item: item('p') }))
    expect(result.current.state.byKey['p']).toBeUndefined()
  })

  test('sendScroll sends SCROLL only when token present and socket open', () => {
    const { result } = renderHook(() => useListWatch({ ...baseOpts, pageSize: 50 }))
    const ws = MockWebSocket.instances[0]

    // not open yet -> no send
    act(() => result.current.sendScroll())
    expect(ws.sent).toHaveLength(0)

    act(() => ws.open())
    act(() => ws.message({ type: 'INITIAL', items: [item('a')], continue: 'c1' }))

    act(() => result.current.sendScroll())
    expect(ws.sent).toHaveLength(1)
    expect(JSON.parse(ws.sent[0])).toEqual({ type: 'SCROLL', continue: 'c1', limit: 50 })
  })

  test('preserveStateOnUrlChange=false resets state on setUrl', () => {
    const { result } = renderHook(() => useListWatch({ ...baseOpts, preserveStateOnUrlChange: false }))
    const ws = MockWebSocket.instances[0]

    act(() => ws.open())
    act(() => ws.message({ type: 'INITIAL', items: [item('a')], continue: 'c1' }))
    expect(result.current.total).toBe(1)
    expect(result.current.hasInitial).toBe(true)

    act(() => result.current.setUrl('/other'))
    expect(result.current.total).toBe(0)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.hasInitial).toBe(false)
  })

  test('setQuery reconnects only when effective resource changes', () => {
    const { result } = renderHook(() => useListWatch(baseOpts))
    const ws1 = MockWebSocket.instances[0]
    act(() => ws1.open())

    // same effective id (no change) -> should not create new socket
    act(() => result.current.setQuery({ ...baseQuery }))
    expect(MockWebSocket.instances).toHaveLength(1)

    // change fieldSelector -> new resId -> reconnect
    act(() => result.current.setQuery({ ...baseQuery, fieldSelector: 'a=b' }))
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2)
  })

  test('error events are suppressed during URL change transition', () => {
    const { result } = renderHook(() => useListWatch(baseOpts))
    const ws1 = MockWebSocket.instances[0]

    act(() => ws1.open())
    expect(result.current.lastError).toBeUndefined()

    // setUrl sets suppressErrorsRef=true and triggers reconnect
    act(() => result.current.setUrl('/new'))

    // Error on the *old* socket should be suppressed during transition
    act(() => ws1.error())
    expect(result.current.lastError).toBeUndefined()

    // New socket was created
    const ws2 = MockWebSocket.instances[1]
    expect(ws2).toBeTruthy()

    // Once the new socket opens, suppression is cleared
    act(() => ws2.open())

    act(() => ws2.error())
    expect(result.current.lastError).toBe('WebSocket error')
  })

  test('auto reconnect schedules after close when enabled', () => {
    const { result } = renderHook(() => useListWatch(baseOpts))
    const ws1 = MockWebSocket.instances[0]
    act(() => ws1.open())
    expect(result.current.status).toBe('open')

    act(() => ws1.close())
    expect(result.current.status).toBe('closed')

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2)
  })

  test('manual reconnect does not require timers to create the next socket', () => {
    const { result } = renderHook(() => useListWatch(baseOpts))
    const ws1 = MockWebSocket.instances[0]
    act(() => ws1.open())

    act(() => result.current.reconnect())
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2)

    const countAfter = MockWebSocket.instances.length
    act(() => {
      jest.runOnlyPendingTimers()
    })
    // intentional close path should prevent extra timer-based reconnection burst
    expect(MockWebSocket.instances.length).toBe(countAfter)
  })

  test('drainAll requests pages and stops by maxPages', async () => {
    const { result } = renderHook(() => useListWatch({ ...baseOpts, pageSize: 2 }))
    const ws = MockWebSocket.instances[0]

    act(() => ws.open())
    act(() => ws.message({ type: 'INITIAL', items: [item('a')], continue: 'c1', resourceVersion: '1' }))

    const p = result.current.drainAll({ maxPages: 1 })

    // it should have sent SCROLL
    expect(ws.sent.length).toBeGreaterThanOrEqual(1)

    // satisfy the one-time listener inside drainAll
    act(() => ws.message({ type: 'PAGE', items: [item('b')], continue: 'c2' }))

    const added = await p
    expect(added).toBe(1)
    expect(result.current.total).toBe(2)
  })
})
