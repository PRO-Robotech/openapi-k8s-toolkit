import { TUnitInput } from 'localTypes/factories/converterBytes'
import { TCoreUnitInput } from 'localTypes/factories/converterCores'

export const getNormalizedCoreUnit = (maxValue: number): TCoreUnitInput => {
  if (maxValue >= 1) return 'core'
  if (maxValue >= 1e-3) return 'mcore'
  if (maxValue >= 1e-6) return 'ucore'
  return 'ncore'
}

export const getNormalizedByteUnit = (maxValue: number, standard: 'si' | 'iec'): TUnitInput => {
  const ladder: TUnitInput[] =
    standard === 'iec' ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'] : ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB']
  const base = standard === 'iec' ? 1024 : 1000
  const idx = maxValue > 0 ? Math.min(ladder.length - 1, Math.floor(Math.log(maxValue) / Math.log(base))) : 0
  return ladder[Math.max(0, idx)]
}
