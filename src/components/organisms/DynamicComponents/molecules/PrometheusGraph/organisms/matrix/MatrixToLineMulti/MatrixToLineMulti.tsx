import { FC, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePromMatrixToLineMulti } from '../../../hooks/queryRangeMatrix/multi/usePromMatrixToLineMulti'
import { formatBytes, formatTimestamp as formatTimestampDefault } from '../../../utils/formatters'
import { TMatrixToLineMultiProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const MatrixToLineMulti: FC<TMatrixToLineMultiProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  range = '1h',
  refetchInterval,
  width,
  height,
  formatValue,
  formatTimestamp,
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

  const valueFormatter = formatValue ?? formatBytes
  const timestampFormatter = formatTimestamp ?? formatTimestampDefault

  return (
    <WidthHeightDiv $width={width} $height={height}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="timestamp" tickFormatter={timestampFormatter} />

          <YAxis tickFormatter={valueFormatter} />

          <Tooltip formatter={v => valueFormatter(v)} labelFormatter={v => timestampFormatter(v)} />

          {series?.map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              dot={false}
              strokeWidth={2}
              stroke={`hsl(${(i * 60) % 360}, 70%, 55%)`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </WidthHeightDiv>
  )
}
