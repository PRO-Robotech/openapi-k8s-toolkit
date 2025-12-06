/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventKey, compareRV, getRV, getMaxRV } from './utils'

const mk = (uid?: string, ns?: string, name?: string, rv?: string) =>
  ({
    metadata: {
      ...(uid ? { uid } : {}),
      ...(ns ? { namespace: ns } : {}),
      ...(name ? { name } : {}),
      ...(rv ? { resourceVersion: rv } : {}),
    },
  }) as any

describe('utils', () => {
  describe('eventKey', () => {
    test('prefers metadata.uid when present', () => {
      expect(eventKey(mk('u1', 'ns', 'name'))).toBe('u1')
    })

    test('falls back to namespace/name', () => {
      expect(eventKey(mk(undefined, 'ns', 'name'))).toBe('ns/name')
    })

    test('handles missing namespace or name', () => {
      expect(eventKey(mk(undefined, undefined, 'name'))).toBe('/name')
      expect(eventKey(mk(undefined, 'ns', undefined))).toBe('ns/')
      expect(eventKey(mk(undefined, undefined, undefined))).toBe('/')
    })
  })

  describe('compareRV', () => {
    test('compares by length first', () => {
      expect(compareRV('9', '10')).toBe(-1)
      expect(compareRV('10', '9')).toBe(1)
    })

    test('compares lexicographically when same length', () => {
      expect(compareRV('10', '11')).toBe(-1)
      expect(compareRV('11', '10')).toBe(1)
    })

    test('returns 0 when equal', () => {
      expect(compareRV('123', '123')).toBe(0)
    })
  })

  describe('getRV', () => {
    test('reads metadata.resourceVersion', () => {
      expect(getRV(mk(undefined, 'ns', 'name', '7'))).toBe('7')
    })

    test('returns undefined when missing', () => {
      expect(getRV({} as any)).toBeUndefined()
      expect(getRV({ metadata: {} } as any)).toBeUndefined()
    })
  })

  describe('getMaxRV', () => {
    test('returns undefined for empty or no-RV items', () => {
      expect(getMaxRV([])).toBeUndefined()
      expect(getMaxRV([mk('a'), mk('b')])).toBeUndefined()
    })

    test('returns highest RV using compareRV', () => {
      const items = [mk('a', 'ns', 'a', '9'), mk('b', 'ns', 'b', '10'), mk('c', 'ns', 'c', '2')]
      expect(getMaxRV(items)).toBe('10')
    })

    test('handles mixed missing RV', () => {
      const items = [mk('a', 'ns', 'a'), mk('b', 'ns', 'b', '5')]
      expect(getMaxRV(items)).toBe('5')
    })
  })
})
