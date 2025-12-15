/* eslint-disable no-nested-ternary */
import { FC, useMemo } from 'react'
import { Card, Statistic, Typography } from 'antd'
import { usePromScalar } from '../../../hooks'
import { scalarToStat } from '../../../utils/scalarAdapter'

type TScalarToStatProps = {
  query: string
  title?: string
  refetchInterval?: number | false
  enabled?: boolean
  /** optional formatter for value */
  formatValue?: (v: number) => string | number
}

export const ScalarToStat: FC<TScalarToStatProps> = ({
  query,
  title = 'Stat',
  refetchInterval = 30000,
  enabled = true,
  formatValue,
}) => {
  const { data, isLoading, error } = usePromScalar({ query, refetchInterval, enabled })

  const stat = useMemo(() => (data ? scalarToStat(data, { id: query }) : null), [data, query])

  if (error) return <div>❌ Error: {error.message ?? String(error)}</div>

  const value = stat?.value
  const display = value == null || !Number.isFinite(value) ? '—' : formatValue ? formatValue(value) : value

  return (
    <Card size="small">
      <Typography.Text type="secondary">{title}</Typography.Text>
      <Statistic value={display} loading={isLoading} />
    </Card>
  )
}
