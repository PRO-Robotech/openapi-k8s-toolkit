import { TPrometheusScalarResponse } from '../types'

export type TGaugeItem = {
  id: string
  value: number
  min?: number
  max?: number
}

/**
 * scalar -> gauge (single number, optionally with min/max)
 */
export const scalarToGauge = (
  resp: TPrometheusScalarResponse,
  opts: { id?: string; min?: number; max?: number } = {},
): TGaugeItem | null => {
  if (resp.status !== 'success' || !resp.data?.result) return null

  const [, v] = resp.data.result || [0, '0']
  return {
    id: opts.id ?? 'scalar',
    value: Number(v),
    ...(opts.min !== undefined ? { min: opts.min } : {}),
    ...(opts.max !== undefined ? { max: opts.max } : {}),
  }
}
