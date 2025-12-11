/* eslint-disable no-nested-ternary */
import { FC } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { usePromMatrixToLineSingle } from '../../../hooks/queryRangeMatrix/single/usePromMatrixToLineSingle'

type TMatrixToAreaSingleProps = {
  range?: string
}

/**
 * Безопасное форматирование значения байтов.
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

export const MatrixToAreaSingle: FC<TMatrixToAreaSingleProps> = ({ range = '1h' }) => {
  const {
    data = [],
    isLoading,
    error,
  } = usePromMatrixToLineSingle({
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
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={value => {
              const ts = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN

              if (!Number.isFinite(ts)) {
                return ''
              }

              return new Date(ts).toLocaleTimeString()
            }}
          />

          <YAxis tickFormatter={value => formatBytes(value)} />

          <Tooltip formatter={value => formatBytes(value)} labelFormatter={value => formatTimestamp(value)} />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f8ef7"
            fill="#4f8ef7"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
