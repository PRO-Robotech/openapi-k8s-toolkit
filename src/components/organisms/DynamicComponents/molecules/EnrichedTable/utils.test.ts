/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { serializeLabels, serializeLabelsWithNoEncoding } from './utils'

describe('serializeLabels', () => {
  test('returns error for non-plain objects', () => {
    expect(serializeLabels(undefined)).toBe('Expected a plain object')
    expect(serializeLabels(null)).toBe('Expected a plain object')
    expect(serializeLabels([])).toBe('Expected a plain object')
    expect(serializeLabels('x' as any)).toBe('Expected a plain object')
    expect(serializeLabels(1 as any)).toBe('Expected a plain object')

    class X {
      a = 1
    }
    expect(serializeLabels(new X() as any)).toBe('Expected a plain object')
  })

  test('returns error when any value is not string or number', () => {
    expect(serializeLabels({ a: true } as any)).toBe('All values must be string or number')
    expect(serializeLabels({ a: 'ok', b: {} } as any)).toBe('All values must be string or number')
    expect(serializeLabels({ a: 'ok', b: null } as any)).toBe('All values must be string or number')
  })

  test('serializes and URL-encodes key=value pairs joined by commas', () => {
    const input = { app: 'web', tier: 2 }

    const res = serializeLabels(input)

    // Actual raw string before encoding would be: "app=web,tier=2"
    expect(res).toBe(encodeURIComponent('app=web,tier=2'))
  })

  test('encoding handles spaces and special characters', () => {
    const input = { 'my key': 'hello world', a: 'x/y' }

    const raw = 'my key=hello world,a=x/y'
    expect(serializeLabels(input)).toBe(encodeURIComponent(raw))
  })

  test('empty object serializes to empty string', () => {
    expect(serializeLabels({})).toBe('')
  })
})

describe('serializeLabelsWithNoEncoding', () => {
  test('returns error for non-plain objects', () => {
    expect(serializeLabelsWithNoEncoding(undefined)).toBe('Expected a plain object')
    expect(serializeLabelsWithNoEncoding(null)).toBe('Expected a plain object')
    expect(serializeLabelsWithNoEncoding([])).toBe('Expected a plain object')

    class X {
      a = 1
    }
    expect(serializeLabelsWithNoEncoding(new X() as any)).toBe('Expected a plain object')
  })

  test('returns error when any value is not string or number', () => {
    expect(serializeLabelsWithNoEncoding({ a: true } as any)).toBe('All values must be string or number')
  })

  test('serializes key=value pairs joined by commas without encoding', () => {
    expect(serializeLabelsWithNoEncoding({ app: 'web', tier: 2 })).toBe('app=web,tier=2')
  })

  test('empty object serializes to empty string', () => {
    expect(serializeLabelsWithNoEncoding({})).toBe('')
  })
})
