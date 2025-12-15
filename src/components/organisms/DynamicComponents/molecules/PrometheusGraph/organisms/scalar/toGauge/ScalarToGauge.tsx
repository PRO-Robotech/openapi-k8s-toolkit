/* eslint-disable no-nested-ternary */
import { FC, useMemo } from 'react'
import { Card, Progress, Typography } from 'antd'
import { usePromScalar } from '../../../hooks'
import { scalarToGauge } from '../../../utils/scalarAdapter'

type TScalarToGaugeProps = {
  query: string
  title?: string
  refetchInterval?: number | false
  enabled?: boolean
  min?: number
  max?: number
  /** optional label formatter under the bar */
  formatValue?: (v: number) => string
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export const ScalarToGauge: FC<TScalarToGaugeProps> = ({
  query,
  title = 'Gauge',
  refetchInterval = 30000,
  enabled = true,
  min = 0,
  max = 100,
  formatValue,
}) => {
  const { data, isLoading, error } = usePromScalar({ query, refetchInterval, enabled })

  const gauge = useMemo(() => (data ? scalarToGauge(data, { id: query, min, max }) : null), [data, query, min, max])

  if (error) return <div>❌ Error: {error.message ?? String(error)}</div>

  const v = gauge?.value
  const safeV = v == null || !Number.isFinite(v) ? null : v

  // percent based on min/max
  const denom = max - min
  const percent =
    safeV == null || !Number.isFinite(denom) || denom === 0 ? 0 : Math.round(clamp01((safeV - min) / denom) * 100)

  const label = safeV == null ? '—' : formatValue ? formatValue(safeV) : String(safeV)

  return (
    <Card size="small">
      <Typography.Text type="secondary">{title}</Typography.Text>

      <div style={{ marginTop: 8 }}>
        <Progress percent={percent} showInfo />
      </div>

      <div style={{ marginTop: 6 }}>
        <Typography.Text>
          {label}{' '}
          <Typography.Text type="secondary">
            ({min} → {max})
          </Typography.Text>
        </Typography.Text>
      </div>

      {isLoading && <div style={{ marginTop: 6 }}>⏳ Loading...</div>}
    </Card>
  )
}
