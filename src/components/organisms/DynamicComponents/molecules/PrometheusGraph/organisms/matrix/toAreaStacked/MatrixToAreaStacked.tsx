import { FC, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePromMatrixToLineMulti } from '../../../hooks/queryRangeMatrix/multi/usePromMatrixToLineMulti'
import { seriesToStackedAreaData } from '../../../utils/matrixAdapater/toAreaStacked/matrixToAreaStackedAdapter'

type TMatrixToAreaStackedProps = {
  range?: string
}

// ---------- Formatters ----------
const formatBytes = (value: unknown): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''

  if (num > 1e9) return `${(num / 1e9).toFixed(2)} GB`
  if (num > 1e6) return `${(num / 1e6).toFixed(2)} MB`
  if (num > 1e3) return `${(num / 1e3).toFixed(2)} KB`
  return `${num} B`
}

const formatTimestamp = (value: unknown): string => {
  const num = Number(value)
  return Number.isFinite(num) ? new Date(num).toLocaleString() : ''
}

// ---------- Component ----------
export const MatrixToAreaStacked: FC<TMatrixToAreaStackedProps> = ({ range = '1h' }) => {
  const {
    data: series = [],
    isLoading,
    error,
  } = usePromMatrixToLineMulti({
    query: 'container_memory_usage_bytes',
    range,
  })

  const chartData = useMemo(() => seriesToStackedAreaData(series), [series])

  if (isLoading) return <div>⏳ Loading...</div>
  if (error) return <div>❌ Error: {error.message}</div>

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h3>Multi-Series Memory Usage (stacked) ({range})</h3>

      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />

          <YAxis tickFormatter={formatBytes} />

          <Tooltip formatter={v => formatBytes(v)} labelFormatter={v => formatTimestamp(v)} />

          {series.map((s, i) => (
            <Area
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              stackId="1"
              strokeWidth={2}
              dot={false}
              stroke={`hsl(${(i * 60) % 360}, 70%, 55%)`}
              fill={`hsl(${(i * 60) % 360}, 70%, 55%)`}
              fillOpacity={0.35}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
