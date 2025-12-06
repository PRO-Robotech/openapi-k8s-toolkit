import { hslFromString } from './hslFromString'

type Theme = 'light' | 'dark'

const parseHsl = (s: string) => {
  const m = /^hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)$/.exec(s)
  if (!m) {
    throw new Error(`Invalid HSL string: ${s}`)
  }
  const [, h, sat, light] = m
  return { h: Number(h), s: Number(sat), l: Number(light) }
}

const expectInRange = (n: number, min: number, max: number) => {
  expect(n).toBeGreaterThanOrEqual(min)
  expect(n).toBeLessThanOrEqual(max)
}

describe('hslFromString', () => {
  test('returns a valid hsl() string', () => {
    const out = hslFromString('alice@example.com', 'light')
    expect(out.startsWith('hsl(')).toBe(true)
    expect(() => parseHsl(out)).not.toThrow()
  })

  test('is deterministic for same input and theme', () => {
    const a = hslFromString('same', 'light')
    const b = hslFromString('same', 'light')
    expect(a).toBe(b)
  })

  test('produces same hue for light and dark themes (theme only affects S/L)', () => {
    const light = parseHsl(hslFromString('alice@example.com', 'light'))
    const dark = parseHsl(hslFromString('alice@example.com', 'dark'))
    expect(light.h).toBe(dark.h)
  })

  test('hue is within expected range based on implementation', () => {
    const { h } = parseHsl(hslFromString('alice@example.com', 'light'))
    // Implementation uses hash % 345
    expectInRange(h, 0, 344)
  })

  test('saturation/lightness ranges for light theme', () => {
    const { s, l } = parseHsl(hslFromString('alice@example.com', 'light'))
    expectInRange(s, 90, 100)
    expectInRange(l, 78, 80)
  })

  test('saturation/lightness ranges for dark theme', () => {
    const { s, l } = parseHsl(hslFromString('alice@example.com', 'dark'))
    expectInRange(s, 78, 80)
    expectInRange(l, 25, 35)
  })

  test('different inputs usually produce different outputs', () => {
    const a = hslFromString('alice@example.com', 'light')
    const b = hslFromString('bob@example.com', 'light')
    expect(a).not.toBe(b)
  })

  test('handles empty string', () => {
    const out = hslFromString('', 'light')
    expect(() => parseHsl(out)).not.toThrow()
  })

  test('handles unicode safely and deterministically', () => {
    const value = '🚀-東京-مرحبا'
    const a = hslFromString(value, 'light')
    const b = hslFromString(value, 'light')
    const c = hslFromString(value, 'dark')

    expect(a).toBe(b)
    expect(() => parseHsl(a)).not.toThrow()
    expect(() => parseHsl(c)).not.toThrow()

    const pa = parseHsl(a)
    const pc = parseHsl(c)
    expect(pa.h).toBe(pc.h)
  })

  test.each<Theme>(['light', 'dark'])('never returns NaN parts (%s)', theme => {
    const { h, s, l } = parseHsl(hslFromString('check-nan', theme))
    expect(Number.isNaN(h)).toBe(false)
    expect(Number.isNaN(s)).toBe(false)
    expect(Number.isNaN(l)).toBe(false)
  })
})
