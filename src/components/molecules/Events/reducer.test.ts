/* eslint-disable @typescript-eslint/no-explicit-any */
import { reducer } from './reducer'
import { eventKey } from './utils'

const ev = (namespace: string, name: string, patch?: Partial<any>) =>
  ({
    metadata: { namespace, name, ...(patch?.metadata ?? {}) },
    ...patch,
  }) as any

describe('events reducer', () => {
  test('RESET replaces state with items in given order', () => {
    const a = ev('ns', 'a')
    const b = ev('ns', 'b')

    const initial = { order: ['x'], byKey: { x: ev('x', 'x') } } as any

    const next = reducer(initial, { type: 'RESET', items: [a, b] })

    expect(next.order).toEqual([eventKey(a), eventKey(b)])
    expect(Object.keys(next.byKey)).toEqual([eventKey(a), eventKey(b)])
    expect(next.byKey[eventKey(a)]).toBe(a)
    expect(next.byKey[eventKey(b)]).toBe(b)
  })

  test('APPEND_PAGE appends only new keys to the end and updates byKey', () => {
    const a1 = ev('ns', 'a', { note: 'old' })
    const b1 = ev('ns', 'b')

    const state = reducer({ order: [], byKey: {} } as any, { type: 'RESET', items: [a1, b1] })

    const a2 = ev('ns', 'a', { note: 'new' }) // same key, updated item
    const c1 = ev('ns', 'c')

    const next = reducer(state, { type: 'APPEND_PAGE', items: [a2, c1] })

    expect(next.order).toEqual([eventKey(a1), eventKey(b1), eventKey(c1)])
    expect(next.byKey[eventKey(a1)]).toBe(a2) // updated
    expect(next.byKey[eventKey(c1)]).toBe(c1)
  })

  test('APPEND_PAGE does not duplicate keys when same page repeated', () => {
    const a = ev('ns', 'a')
    const b = ev('ns', 'b')

    const state = reducer({ order: [], byKey: {} } as any, { type: 'RESET', items: [a] })
    const next1 = reducer(state, { type: 'APPEND_PAGE', items: [b] })
    const next2 = reducer(next1, { type: 'APPEND_PAGE', items: [b] })

    expect(next1.order).toEqual([eventKey(a), eventKey(b)])
    expect(next2.order).toEqual([eventKey(a), eventKey(b)])
  })

  test('UPSERT adds new item to front', () => {
    const a = ev('ns', 'a')
    const b = ev('ns', 'b')

    const state = reducer({ order: [], byKey: {} } as any, { type: 'RESET', items: [a] })
    const next = reducer(state, { type: 'UPSERT', item: b })

    expect(next.order).toEqual([eventKey(b), eventKey(a)])
    expect(next.byKey[eventKey(b)]).toBe(b)
  })

  test('UPSERT replaces existing item without changing order', () => {
    const a1 = ev('ns', 'a', { note: 'old' })
    const b = ev('ns', 'b')

    const state = reducer({ order: [], byKey: {} } as any, { type: 'RESET', items: [a1, b] })

    const a2 = ev('ns', 'a', { note: 'new' })
    const next = reducer(state, { type: 'UPSERT', item: a2 })

    expect(next.order).toEqual([eventKey(a1), eventKey(b)])
    expect(next.byKey[eventKey(a1)]).toBe(a2)
  })

  test('REMOVE deletes existing key from byKey and order', () => {
    const a = ev('ns', 'a')
    const b = ev('ns', 'b')

    const state = reducer({ order: [], byKey: {} } as any, { type: 'RESET', items: [a, b] })

    const next = reducer(state, { type: 'REMOVE', key: eventKey(a) })

    expect(next.order).toEqual([eventKey(b)])
    expect(next.byKey[eventKey(a)]).toBeUndefined()
    expect(next.byKey[eventKey(b)]).toBe(b)
  })

  test('REMOVE returns same state object if key not present', () => {
    const a = ev('ns', 'a')
    const state = reducer({ order: [], byKey: {} } as any, { type: 'RESET', items: [a] })

    const next = reducer(state, { type: 'REMOVE', key: 'missing/ns' })

    expect(next).toBe(state)
  })
})
