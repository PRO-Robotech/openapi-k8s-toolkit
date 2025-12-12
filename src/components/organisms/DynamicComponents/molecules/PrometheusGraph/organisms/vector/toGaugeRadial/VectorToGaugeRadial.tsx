import { FC, useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { usePromVector } from '../../../hooks/queryVector/usePromVector'
import { vectorToGaugeRadial } from '../../../utils/vectorAdapter/toGaugeRadial'

type TVectorToGaugeRadialProps = {
  query?: string
  title?: string
  min?: number
  max?: number
}

export const VectorToGaugeRadial: FC<TVectorToGaugeRadialProps> = ({
  query = 'up',
  title = 'Vector → Gauge (Radial)',
  min = 0,
  max = 1,
}) => {
  const { data, isLoading, error } = usePromVector({ query })

  const gauge = useMemo(() => (data ? vectorToGaugeRadial(data) : null), [data])

  const value = gauge?.value ?? 0
  const clamped = Math.min(max, Math.max(min, value))
  const filled = clamped - min
  const total = max - min
  const rest = Math.max(0, total - filled)

  const chartData = useMemo(
    () => [
      { name: 'value', value: filled },
      { name: 'rest', value: rest },
    ],
    [filled, rest],
  )

  if (isLoading) return <div>⏳ Loading...</div>
  if (error) return <div>❌ Error: {error.message}</div>

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3>{title}</h3>
      <div style={{ marginBottom: 8 }}>
        <strong>{gauge?.id ?? 'value'}:</strong> {String(value)}
      </div>

      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            isAnimationActive={false}
          >
            <Cell fill="hsl(140, 70%, 45%)" /> {/* filled */}
            <Cell fill="hsl(0, 0%, 80%)" /> {/* rest */}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
