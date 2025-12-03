/* eslint-disable no-console */
import type { TCoreCanonicalUnit, TCoreUnitInput, TCoreConvertOptions } from 'localTypes/factories/converterCores'

/**
 * Canonical unit factors relative to 1 "core".
 *
 * - core  = 1
 * - mcore = 1e-3 core  (millicore)
 * - ucore = 1e-6 core  (microcore)
 * - ncore = 1e-9 core  (nanocore)
 */
const CORE_UNIT_FACTORS: Readonly<Record<TCoreCanonicalUnit, number>> = {
  core: 1,
  mcore: 1e-3,
  ucore: 1e-6,
  ncore: 1e-9,
}

// Build a case-insensitive alias map to canonical units.
const CORE_ALIASES: Readonly<Record<string, TCoreCanonicalUnit>> = (() => {
  const corePairs: Array<[string[], TCoreCanonicalUnit]> = [
    // plain cores
    [['core', 'cores', 'c', 'cpu', 'cpus', 'vcpu', 'vcpus'], 'core'],

    // millicores
    [['m', 'mc', 'mcore', 'mcores', 'millicore', 'millicores', 'millicpu', 'millicpus'], 'mcore'],

    // microcores
    [['u', 'µ', 'ucore', 'ucores', 'micro', 'microcore', 'microcores'], 'ucore'],

    // nanocores
    [['n', 'ncore', 'ncores', 'nano', 'nanocore', 'nanocores'], 'ncore'],
  ]

  const entries = corePairs.flatMap(([keys, unit]) => keys.map(k => [k.toLowerCase(), unit] as const))
  const canon = (Object.keys(CORE_UNIT_FACTORS) as TCoreCanonicalUnit[]).map(u => [u.toLowerCase(), u] as const)

  return Object.fromEntries([...entries, ...canon])
})()

/** Normalize any core unit token to its canonical form, or console.error and default to "core". */
const normalizeCoreUnit = (u: TCoreUnitInput): TCoreCanonicalUnit => {
  const key = String(u).trim().toLowerCase()
  const canon = CORE_ALIASES[key]
  if (!canon) {
    console.error(`Unknown core unit: "${u}"`)
    return 'core'
  }
  return canon
}

/**
 * Convert cores -> target unit (core/mcore/ucore/ncore).
 * The input `cores` is ALWAYS in **cores** (base unit).
 *
 * @returns number by default (e.g., 0.5 -> 500 when unit="mcore"),
 *          or "500 mcore" if format=true
 */
export const convertCores: (cores: number, unit: TCoreUnitInput, opts?: TCoreConvertOptions) => number | string = (
  cores,
  unit,
  opts,
) => {
  if (!Number.isFinite(cores)) {
    console.error('cores must be a finite number')
    return -1
  }
  if (cores < 0) {
    console.error('cores must be >= 0')
    return -1
  }

  const canon = normalizeCoreUnit(unit)
  const factor = CORE_UNIT_FACTORS[canon] // size of unit in cores
  const value = cores / factor // e.g. 0.5 core / 1e-3 = 500 mcore

  if (!opts?.format) return value

  return `${value.toLocaleString(opts.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: opts?.precision ?? 2,
  })} ${canon}`
}

/**
 * Auto-scale cores across core/mcore/ucore/ncore.
 *
 * - cores >= 1        -> core
 * - 1e-3 <= cores < 1 -> mcore
 * - 1e-6 <= cores < 1e-3 -> ucore
 * - cores < 1e-6      -> ncore
 */
export const formatCoresAuto: (cores: number, options?: { precision?: number; locale?: string }) => string = (
  cores,
  { precision = 2, locale } = {},
) => {
  if (!Number.isFinite(cores)) {
    console.error('cores must be a finite number')
    return 'infinite'
  }
  if (cores < 0) {
    console.error('cores must be >= 0')
    return 'less then zero'
  }

  if (cores === 0) {
    return '0 core'
  }

  let targetUnit: TCoreCanonicalUnit
  if (cores >= 1) {
    targetUnit = 'core'
  } else if (cores >= 1e-3) {
    targetUnit = 'mcore'
  } else if (cores >= 1e-6) {
    targetUnit = 'ucore'
  } else {
    targetUnit = 'ncore'
  }

  return String(convertCores(cores, targetUnit, { format: true, precision, locale }))
}

/** Internal helper: convert value in given unit -> cores (number). */
export const toCores = (value: number, from: TCoreUnitInput): number => {
  if (!Number.isFinite(value)) {
    console.error('value must be a finite number')
    return -1
  }
  if (value < 0) {
    console.error('value must be >= 0')
    return -1
  }
  const canon = normalizeCoreUnit(from)
  const factor = CORE_UNIT_FACTORS[canon]
  // factor = size of unit in cores
  return value * factor
}

/**
 * Generic helper: convert value in some unit -> target unit.
 * Uses cores as intermediate.
 *
 * Examples:
 *   convertCompute(500, "m", "core")               // 0.5
 *   convertCompute(2, "core", "m", {format: true}) // "2,000 mcore" (or locale variant)
 *   convertCompute(1_000_000, "n", "core")         // 0.001
 */
export const convertCompute: (
  value: number,
  from: TCoreUnitInput,
  to: TCoreUnitInput,
  opts?: TCoreConvertOptions,
) => number | string = (value, from, to, opts) => {
  const cores = toCores(value, from)
  if (cores < 0) return -1
  return convertCores(cores, to, opts)
}

/**
 * Try to parse a string like:
 *   "500m"
 *   "  0.5 core"
 *   "2 vcpu"
 *   "1000000n"
 *   "1.5"   (no unit -> unit undefined, treated as raw number-of-cores upstream)
 */
export const parseCoresWithUnit = (input: string): { value: number; unit?: TCoreUnitInput } | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)(?:\s*([a-zA-Zµ]+))?$/)
  if (!match) return null

  const [, numPart, unitPart] = match
  const value = Number(numPart)
  if (!Number.isFinite(value)) return null

  if (unitPart) {
    return { value, unit: unitPart as TCoreUnitInput }
  }
  return { value }
}

// ---- Examples ----
// convertCores(0.5, "m");               // 500
// convertCores(0.5, "m", { format: true }); // "500 mcore"
// convertCores(1e-4, "ucore");          // 100
// convertCores(1e-7, "ncore");          // 100
// toCores(500, "m");                    // 0.5
// toCores(1_000_000, "n");             // 0.001
// convertCompute(500, "m", "core");     // 0.5
// formatCoresAuto(0.25);                // "250 mcore"
// formatCoresAuto(1e-5);                // "10 ucore"
// formatCoresAuto(1e-8);                // "10 ncore"
// parseCoresWithUnit("500m");           // { value: 500, unit: "m" }
// parseCoresWithUnit("0.5 core");       // { value: 0.5, unit: "core" }
// parseCoresWithUnit("1000000n");       // { value: 1000000, unit: "n" }
