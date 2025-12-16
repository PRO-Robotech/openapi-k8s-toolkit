/* eslint-disable no-nested-ternary */
import { FC, useMemo } from 'react'
import { Card, Statistic, Typography } from 'antd'
import { usePromScalar } from '../../../hooks'
import { scalarToStat } from '../../../utils/scalarAdapter'
import { TScalarToStatProps } from '../../../types'

export const ScalarToStat: FC<TScalarToStatProps> = ({
  baseUrl,
  query = 'scalar(42.42)',
  refetchInterval,
  title = 'Stat',
  formatValue,
}) => {
  const { data, isLoading, error } = usePromScalar({ baseUrl, query, refetchInterval })

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
