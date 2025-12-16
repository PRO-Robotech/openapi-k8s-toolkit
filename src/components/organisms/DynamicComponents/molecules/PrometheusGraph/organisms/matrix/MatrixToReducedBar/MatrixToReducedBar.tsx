/* eslint-disable react/no-array-index-key */
import { FC, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { usePromMatrixToLineMulti } from '../../../hooks/queryRangeMatrix/multi/usePromMatrixToLineMulti'
import { matrixToReducedVector } from '../../../utils/matrixAdapter/toReducedVector/matrixToReducedVectorAdapter'
import { TMatrixToReducedBarProps } from '../../../types'
import { WidthHeightDiv } from '../../../atoms'

export const MatrixToReducedBar: FC<TMatrixToReducedBarProps> = ({
  baseUrl,
  query = 'container_memory_usage_bytes',
  range = '1h',
  refetchInterval,
  mode = 'avg',
  width,
  height,
}) => {
  const {
    data: series = [],
    isLoading,
    error,
  } = usePromMatrixToLineMulti({
    baseUrl,
    query,
    range,
    refetchInterval,
  })

  const reduced = useMemo(() => matrixToReducedVector(series, mode), [series, mode])

  if (isLoading) {
    return <div>⏳ Loading...</div>
  }

  if (error) {
    return <div>❌ Error: {error.message}</div>
  }

  return (
    <WidthHeightDiv $width={width} $height={height}>
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
    </WidthHeightDiv>
  )
}
