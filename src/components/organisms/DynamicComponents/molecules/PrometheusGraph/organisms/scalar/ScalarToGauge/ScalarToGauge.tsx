/* eslint-disable no-nested-ternary */
import { FC, useMemo } from 'react'
import { Card, Progress, Typography } from 'antd'
import { Spacer } from 'components/atoms'
import { usePromScalar } from '../../../hooks'
import { scalarToGauge } from '../../../utils/scalarAdapter'
import { TScalarToGaugeProps } from '../../../types'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export const ScalarToGauge: FC<TScalarToGaugeProps> = ({
  baseUrl,
  query = 'scalar(55)',
  refetchInterval,
  title = 'Gauge',
  min = 0,
  max = 100,
  formatValue,
}) => {
  const { data, isLoading, error } = usePromScalar({ baseUrl, query, refetchInterval })

  const gauge = useMemo(() => (data ? scalarToGauge(data, { id: query, min, max }) : null), [data, query, min, max])

  if (error) {
    return <div>❌ Error: {error.message ?? String(error)}</div>
  }

  const v = gauge?.value
  const safeV = v == null || !Number.isFinite(v) ? null : v
  const valueFormatter = formatValue ?? ((val: number) => String(val))

  // percent based on min/max
  const denom = max - min
  const percent =
    safeV == null || !Number.isFinite(denom) || denom === 0 ? 0 : Math.round(clamp01((safeV - min) / denom) * 100)

  const label = safeV == null ? '-' : valueFormatter(safeV)
  const minLabel = valueFormatter(min)
  const maxLabel = valueFormatter(max)

  return (
    <Card size="small">
      <Typography.Text type="secondary">{title}</Typography.Text>
      <Spacer $space={8} $samespace />
      <div>
        <Progress percent={percent} showInfo />
      </div>
      <Spacer $space={6} $samespace />
      <div>
        <Typography.Text>
          {label}{' '}
          <Typography.Text type="secondary">
            ({minLabel} - {maxLabel})
          </Typography.Text>
        </Typography.Text>
      </div>
      {isLoading && (
        <>
          <Spacer $space={6} $samespace />
          <div>⏳ Loading...</div>
        </>
      )}
    </Card>
  )
}
