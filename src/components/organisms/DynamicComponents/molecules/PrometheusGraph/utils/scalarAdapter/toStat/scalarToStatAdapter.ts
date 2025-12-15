import { TPrometheusScalarResponse } from '../types'

export type TStatItem = {
  id: string
  value: number
}

/**
 * scalar -> stat (single number)
 */
export const scalarToStat = (resp: TPrometheusScalarResponse, opts: { id?: string } = {}): TStatItem | null => {
  if (resp.status !== 'success' || !resp.data?.result) return null

  const [, v] = resp.data.result || [0, '0']
  return {
    id: opts.id ?? 'scalar',
    value: Number(v),
  }
}
