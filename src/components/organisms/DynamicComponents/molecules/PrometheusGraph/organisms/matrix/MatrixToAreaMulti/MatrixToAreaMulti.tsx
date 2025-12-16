import { FC, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePromMatrixToLineMulti } from '../../../hooks/queryRangeMatrix/multi/usePromMatrixToLineMulti'
import { formatBytes, formatTimestamp } from '../../../utils/formatters'
import { TMatrixToAreaMultiProps } from '../../../types'

export const MatrixToAreaMulti: FC<TMatrixToAreaMultiProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  range = '1h',
  refetchInterval,
}) => {
  const {
    data: series,
    isLoading,
    error,
  } = usePromMatrixToLineMulti({
    baseUrl,
    query,
    range,
    refetchInterval,
  })

  // series: RechartsSeries[]

  const chartData = useMemo(() => {
    const result: Record<number, Record<string, number | string>> = {}

    series?.forEach(s => {
      s.data?.forEach(point => {
        const ts = point.timestamp
        const v = point.value

        if (!Number.isFinite(ts) || !Number.isFinite(v)) {
          return
        }

        if (!result[ts]) {
          result[ts] = { timestamp: ts }
        }
        result[ts][s.id] = v
      })
    })

    return Object.values(result).sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
  }, [series])

  if (isLoading) {
    return <div>⏳ Loading...</div>
  }

  if (error) {
    return <div>❌ Error: {error.message}</div>
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />

          <YAxis tickFormatter={formatBytes} />

          <Tooltip formatter={v => formatBytes(v)} labelFormatter={v => formatTimestamp(v)} />

          {series?.map((s, i) => (
            <Area
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              strokeWidth={2}
              dot={false}
              // add stackId="1" here if you want stacked areas
              stroke={`hsl(${(i * 60) % 360}, 70%, 55%)`}
              fill={`hsl(${(i * 60) % 360}, 70%, 55%)`}
              fillOpacity={0.25}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
