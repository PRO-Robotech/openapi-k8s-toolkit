/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { reducer } from './reducer'

const item = (uid: string, name = uid) =>
  ({
    metadata: { uid, name, namespace: 'ns' },
  }) as any

test('RESET replaces state', () => {
  const s = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a'), item('b')] })
  expect(s.order).toEqual(['a', 'b'])
  expect(Object.keys(s.byKey)).toEqual(['a', 'b'])
})

test('APPEND_PAGE adds only new keys to the end', () => {
  const initial = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a')] })
  const next = reducer(initial, { type: 'APPEND_PAGE', items: [item('a'), item('b')] })
  expect(next.order).toEqual(['a', 'b'])
})

test('UPSERT unshifts new items', () => {
  const initial = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a')] })
  const next = reducer(initial, { type: 'UPSERT', item: item('b') })
  expect(next.order[0]).toBe('b')
})

test('REMOVE deletes from order + byKey', () => {
  const initial = reducer({ order: [], byKey: {} }, { type: 'RESET', items: [item('a')] })
  const next = reducer(initial, { type: 'REMOVE', key: 'a' })
  expect(next.order).toEqual([])
  expect(next.byKey['a']).toBeUndefined()
})
