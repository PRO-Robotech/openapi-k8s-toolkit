/* eslint-disable no-console */
// bytes -> requested unit (SI or IEC) with friendly aliases.
import { TCanonicalUnit, TUnitInput, TConvertOptions } from './types'

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
 * Try to parse a string like:
 *   "12312312Ki"
 *   "  12.5 GiB"
 *   "1000"        (no unit -> unit undefined)
 */
export const parseValueWithUnit = (input: string): { value: number; unit?: TUnitInput } | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)(?:\s*([a-zA-Z]+))?$/)
  if (!match) return null

  const [, numPart, unitPart] = match
  const value = Number(numPart)
  if (!Number.isFinite(value)) return null

  if (unitPart) {
    return { value, unit: unitPart as TUnitInput }
  }
  return { value }
}
