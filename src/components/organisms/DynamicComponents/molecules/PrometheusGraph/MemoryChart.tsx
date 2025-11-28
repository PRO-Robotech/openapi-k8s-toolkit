/* eslint-disable no-nested-ternary */
import { FC } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePrometheusQueryRange } from './hooks/usePrometheusQueryRange'

type MemoryChartProps = {
  range?: string
}

/**
 * Безопасное форматирование значения байтов.
 * Принимает что угодно (unknown / ValueType), пытается привести к числу.
 */
const formatBytes = (raw: unknown): string => {
  const vNum = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN

  if (!Number.isFinite(vNum)) {
    return raw !== undefined && raw !== null ? String(raw) : ''
  }

  if (vNum > 1e9) {
    return `${(vNum / 1e9).toFixed(1)} GB`
  }

  if (vNum > 1e6) {
    return `${(vNum / 1e6).toFixed(1)} MB`
  }

  if (vNum > 1e3) {
    return `${(vNum / 1e3).toFixed(1)} KB`
  }

  return `${vNum.toFixed(0)} B`
}

/**
 * Безопасное форматирование timestamp'а для осей/tooltip'а.
 */
const formatTimestamp = (raw: unknown): string => {
  const ts = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN

  if (!Number.isFinite(ts)) {
    return ''
  }

  return new Date(ts).toLocaleString()
}

export const MemoryChart: FC<MemoryChartProps> = ({ range = '1h' }) => {
  const {
    data = [],
    isLoading,
    error,
  } = usePrometheusQueryRange({
    query: 'container_memory_usage_bytes',
    range,
  })

  if (isLoading) {
    return <div>⏳ Loading metrics...</div>
  }

  if (error) {
    return <div>❌ Failed to load data: {error.message}</div>
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h3>Memory Usage ({range})</h3>

      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={value => {
              // здесь value: unknown / ValueType — приводим безопасно
              const ts = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN

              if (!Number.isFinite(ts)) {
                return ''
              }

              return new Date(ts).toLocaleTimeString()
            }}
          />

          <YAxis tickFormatter={value => formatBytes(value)} />

          <Tooltip formatter={value => formatBytes(value)} labelFormatter={value => formatTimestamp(value)} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#4f8ef7"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
