/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { usePromMatrixToLineMulti } from '../../../hooks/queryRangeMatrix/multi/usePromMatrixToLineMulti'
import { seriesToReducedVector } from '../../../utils/matrixAdapater/toReducedVector/matrixToReducedVectorAdapter'

type TMatrixToReducedBarProps = {
  range?: string
  mode?: 'last' | 'avg' | 'sum' | 'max' | 'min'
}

export const MatrixToReducedBar: FC<TMatrixToReducedBarProps> = ({ range = '1h', mode = 'avg' }) => {
  const {
    data: series = [],
    isLoading,
    error,
  } = usePromMatrixToLineMulti({
    query: 'container_memory_usage_bytes',
    range,
  })

  const reduced = useMemo(() => seriesToReducedVector(series, mode), [series, mode])

  if (isLoading) return <div>⏳ Loading...</div>
  if (error) return <div>❌ Error: {error.message}</div>

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h3>
        Memory Usage ({mode}) per series ({range})
      </h3>

      <ResponsiveContainer>
        <BarChart data={reduced}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis />
          <Tooltip formatter={value => `${value} bytes`} labelFormatter={label => `Series: ${label}`} />

          <Bar dataKey="value">
            {reduced.map((_, i) => (
              <Cell key={`cell-${i}`} fill={`hsl(${(i * 35) % 360}, 70%, 55%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
