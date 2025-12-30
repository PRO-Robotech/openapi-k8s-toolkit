/* eslint-disable no-console */
// bytes -> requested unit (SI or IEC) with friendly aliases.
import { TCanonicalUnit, TUnitInput, TConvertOptions } from 'localTypes/factories/converterBytes'

const UNIT_FACTORS: Readonly<Record<TCanonicalUnit, number>> = {
  B: 1,
  kB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  PB: 1e15,
  EB: 1e18,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  PiB: 1024 ** 5,
  EiB: 1024 ** 6,
}

// Build a case-insensitive alias map to canonical units.
const ALIASES: Readonly<Record<string, TCanonicalUnit>> = (() => {
  const siPairs: Array<[string[], TCanonicalUnit]> = [
    [['b', 'byte', 'bytes'], 'B'],
    [['k', 'kb', 'kB', 'KB'], 'kB'],
    [['m', 'mb', 'MB'], 'MB'],
    [['g', 'gb', 'GB'], 'GB'],
    [['t', 'tb, TB'.replace(',', '')], 'TB'],
    [['p', 'pb', 'PB'], 'PB'],
    [['e', 'eb', 'EB'], 'EB'],
  ]
  const iecPairs: Array<[string[], TCanonicalUnit]> = [
    [['ki', 'kib', 'Ki', 'KiB'], 'KiB'],
    [['mi', 'mib', 'Mi', 'MiB'], 'MiB'],
    [['gi', 'gib', 'Gi', 'GiB'], 'GiB'],
    [['ti', 'tib', 'Ti', 'TiB'], 'TiB'],
    [['pi', 'pib', 'Pi', 'PiB'], 'PiB'],
    [['ei', 'eib', 'Ei', 'EiB'], 'EiB'],
  ]
  const entries = [...siPairs, ...iecPairs].flatMap(([keys, unit]) => keys.map(k => [k.toLowerCase(), unit] as const))
  // Also include canonical names themselves:
  const canon = (Object.keys(UNIT_FACTORS) as TCanonicalUnit[]).map(u => [u.toLowerCase(), u] as const)
  return Object.fromEntries([...entries, ...canon])
})()

/** Normalize any unit token to its canonical form, or console error and return GB. */
const normalizeUnit = (u: TUnitInput): TCanonicalUnit => {
  const key = String(u).trim().toLowerCase()
  const canon = ALIASES[key]
  // if (!canon) throw new Error(`Unknown unit: "${u}"`)
  if (!canon) {
    // eslint-disable-next-line no-console
    console.error(`Unknown unit: "${u}"`)
    return 'GB'
  }
  return canon
}

/**
 * Convert bytes -> target unit.
 * @returns number by default (e.g., 1.5), or "1.50 GiB" if format=true
 */
export const convertBytes: (bytes: number, unit: TUnitInput, opts?: TConvertOptions) => number | string = (
  bytes,
  unit,
  opts,
) => {
  if (!Number.isFinite(bytes)) {
    // throw new Error('bytes must be a finite number')
    console.error('bytes must be a finite number')
    return -1
  }
  if (bytes < 0) {
    // throw new Error('bytes must be >= 0')
    console.error('bytes must be >= 0')
    return -1
  }

  const canon = normalizeUnit(unit)
  const factor = UNIT_FACTORS[canon]
  const value = bytes / factor

  return opts?.format
    ? `${value.toLocaleString(opts.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: opts?.precision ?? 2,
      })} ${canon}`
    : value
}

/**
 * Optional helper: auto-scale bytes to the "best" unit in SI or IEC.
 * standard: "si" (powers of 1000) or "iec" (powers of 1024). Default "si".
 */
export const formatBytesAuto: (
  bytes: number,
  options?: { standard?: 'si' | 'iec'; precision?: number; locale?: string },
) => string = (bytes, { standard = 'si', precision = 2, locale } = {}) => {
  if (!Number.isFinite(bytes)) {
    // throw new Error('bytes must be a finite number')
    console.error('bytes must be a finite number')
    return 'infinite'
  }
  if (bytes < 0) {
    // throw new Error('bytes must be >= 0')
    console.error('bytes must be >= 0')
    return 'less then zero'
  }

  const ladder: TCanonicalUnit[] =
    standard === 'iec' ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'] : ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB']

  const base = standard === 'iec' ? 1024 : 1000

  // Choose the largest unit where value >= 1 (but clamp to ladder ends).
  const idx = bytes > 0 ? Math.min(ladder.length - 1, Math.floor(Math.log(bytes) / Math.log(base))) : 0

  const unit = ladder[Math.max(0, idx)]
  return String(convertBytes(bytes, unit, { format: true, precision, locale }))
}

// ---- Examples ----
// convertBytes(1500, "k");            // 1.5
// convertBytes(1536, "Ki", { format: true }); // "1.5 KiB"
// convertBytes(1_073_741_824, "Gi");  // 1
// convertBytes(1_000_000_000, "G");   // 1
// formatBytesAuto(1234567890);        // "1.23 GB"
// formatBytesAuto(1234567890, { standard: "iec" }); // "1.15 GiB"

/** Internal helper: convert value in given unit -> bytes (number) */
export const toBytes = (value: number, from: TUnitInput): number => {
  if (!Number.isFinite(value)) {
    console.error('value must be a finite number')
    return -1
  }
  if (value < 0) {
    console.error('value must be >= 0')
    return -1
  }
  const canon = normalizeUnit(from)
  const factor = UNIT_FACTORS[canon]
  return value * factor
}

/**
 * Generic helper: convert value in some unit -> target unit.
 * Uses bytes as intermediate.
 */
export const convertStorage: (
  value: number,
  from: TUnitInput,
  to: TUnitInput,
  opts?: TConvertOptions,
) => number | string = (value, from, to, opts) => {
  const bytes = toBytes(value, from)
  if (bytes < 0) return -1
  return convertBytes(bytes, to, opts)
}

/**
 * Autodetect & normalize a human-formatted number to JS number string.
 * Handles:
 *  - "1.2", "1,2"
 *  - "1,234.56" (comma group, dot decimal)
 *  - "1.234,56" (dot group, comma decimal)
 *  - "1 234,56" / "1 234,56" (space group)
 *  - "1'234.56" (apostrophe group)
 *  - underscores as groupers: "1_234,56"
 */
const normalizeAutoNumber = (raw: string): string => {
  let s = raw.trim()

  // Remove spaces (incl. NBSP and narrow NBSP) and underscores often used as grouping
  s = s.replace(/[\s\u00A0\u202F_]/g, '')
  // Remove apostrophe grouping
  s = s.replace(/'/g, '')

  const hasDot = s.includes('.')
  const hasComma = s.includes(',')

  // If both are present, the LAST one is most likely the decimal separator.
  if (hasDot && hasComma) {
    const lastDot = s.lastIndexOf('.')
    const lastComma = s.lastIndexOf(',')
    const decimal = lastDot > lastComma ? '.' : ','
    const group = decimal === '.' ? ',' : '.'

    // remove grouping
    s = s.split(group).join('')
    // normalize decimal to '.'
    if (decimal === ',') s = s.replace(/,/g, '.')
    return s
  }

  // Only comma present
  if (hasComma && !hasDot) {
    const parts = s.split(',')
    if (parts.length > 2) {
      // many commas -> assume grouping, remove all
      return parts.join('')
    }
    const [intPart, fracPart = ''] = parts

    // Heuristic:
    // - If exactly 3 digits after comma and intPart length <= 3? could be "1,234" group.
    //   More robust: if fracPart.length === 3 and intPart.length >= 1 => treat as grouping.
    // - Else treat as decimal.
    if (fracPart.length === 3 && intPart.length >= 1) {
      return intPart + fracPart
    }
    return intPart + (fracPart ? '.' + fracPart : '')
  }

  // Only dot present
  if (hasDot && !hasComma) {
    const parts = s.split('.')
    if (parts.length > 2) {
      // many dots -> assume grouping, remove all
      return parts.join('')
    }
    const [intPart, fracPart = ''] = parts

    // Same heuristic as above for "1.234"
    if (fracPart.length === 3 && intPart.length >= 1) {
      return intPart + fracPart
    }
    return intPart + (fracPart ? '.' + fracPart : '')
  }

  // No separators
  return s
}

/**
 * Try to parse a string like:
 *   "12312312Ki"
 *   "  12.5 GiB"
 *   "  12,5 GiB"
 *   "1,234.56 MB"
 *   "1.234,56 MB"
 *   "1000"        (no unit -> unit undefined)
 */
export const parseValueWithUnit = (input: string): { value: number; unit?: TUnitInput } | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  // More permissive number matcher:
  // starts with digit/sign, then digits and possible separators/spaces/apostrophes/underscores
  const match = trimmed.match(/^([+-]?\d(?:[\d\s\u00A0\u202F.,'_]*\d)?)(?:\s*([a-zA-Z]+))?$/)
  if (!match) return null

  const [, numPartRaw, unitPart] = match

  const normalized = normalizeAutoNumber(numPartRaw)
  const value = Number(normalized)
  if (!Number.isFinite(value)) return null

  if (unitPart) {
    return { value, unit: unitPart as TUnitInput }
  }
  return { value }
}
