/* eslint-disable @typescript-eslint/no-explicit-any */
import { serializeLabelsWithNoEncoding } from './utils'

describe('serializeLabelsWithNoEncoding', () => {
  test('returns error for non-plain objects', () => {
    expect(serializeLabelsWithNoEncoding(undefined)).toBe('Expected a plain object')
    expect(serializeLabelsWithNoEncoding(null)).toBe('Expected a plain object')
    expect(serializeLabelsWithNoEncoding([])).toBe('Expected a plain object')
    expect(serializeLabelsWithNoEncoding('x' as any)).toBe('Expected a plain object')
    expect(serializeLabelsWithNoEncoding(1 as any)).toBe('Expected a plain object')

    class X {
      a = 1
    }
    expect(serializeLabelsWithNoEncoding(new X() as any)).toBe('Expected a plain object')
  })

  test('returns error when any value is not string or number', () => {
    expect(serializeLabelsWithNoEncoding({ a: true } as any)).toBe('All values must be string or number')
    expect(serializeLabelsWithNoEncoding({ a: 'ok', b: {} } as any)).toBe('All values must be string or number')
    expect(serializeLabelsWithNoEncoding({ a: 'ok', b: null } as any)).toBe('All values must be string or number')
  })

  test('serializes key=value pairs joined by commas', () => {
    expect(serializeLabelsWithNoEncoding({ app: 'web', tier: 2 })).toBe('app=web,tier=2')
  })

  test('preserves spaces/special chars (no encoding)', () => {
    expect(serializeLabelsWithNoEncoding({ 'my key': 'hello world', a: 'x/y' })).toBe('my key=hello world,a=x/y')
  })

  test('empty object serializes to empty string', () => {
    expect(serializeLabelsWithNoEncoding({})).toBe('')
  })
})
