/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'
import { parseAll } from '../utils'
import {
  MatrixToAreaMulti,
  MatrixToAreaSingle,
  MatrixToAreaStacked,
  MatrixToLineMulti,
  MatrixToLineSingle,
  MatrixToReducedBar,
  MatrixToTableRows,
  VectorToBarGauge,
  VectorToBarHorizontal,
  VectorToBarVertical,
  VectorToGaugeRadial,
  VectorToPie,
  VectorToTableRows,
  ScalarToGauge,
  ScalarToStat,
} from './organisms'
import { createDateFormatter, createValueFormatter } from './helpers'

type TGraphType =
  | 'MatrixToAreaMulti'
  | 'MatrixToAreaSingle'
  | 'MatrixToAreaStacked'
  | 'MatrixToLineMulti'
  | 'MatrixToLineSingle'
  | 'MatrixToReducedBar'
  | 'MatrixToTableRows'
  | 'VectorToBarGauge'
  | 'VectorToBarHorizontal'
  | 'VectorToBarVertical'
  | 'VectorToGaugeRadial'
  | 'VectorToPie'
  | 'VectorToTableRows'
  | 'ScalarToGauge'
  | 'ScalarToStat'

const COMPONENTS: Record<TGraphType, React.ComponentType<any>> = {
  MatrixToAreaMulti,
  MatrixToAreaSingle,
  MatrixToAreaStacked,
  MatrixToLineMulti,
  MatrixToLineSingle,
  MatrixToReducedBar,
  MatrixToTableRows,
  VectorToBarGauge,
  VectorToBarHorizontal,
  VectorToBarVertical,
  VectorToGaugeRadial,
  VectorToPie,
  VectorToTableRows,
  ScalarToGauge,
  ScalarToStat,
}

export const PrometheusGraph: FC<{ data: TDynamicComponentsAppTypeMap['PrometheusGraph']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    type,
    width,
    height,
    refetchInterval,
    min,
    max,
    topN,
    formatter,
    unit,
    dateFormatter,
    ...props
  } = data

  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const parsedProps = Object.fromEntries(
    Object.entries(props).map(([k, v]) => [
      k,
      v === undefined ? undefined : parseAll({ text: v, replaceValues, multiQueryData }),
    ]),
  )

  const formatValue = createValueFormatter({ formatter, unit })
  const formatTimestamp = createDateFormatter(dateFormatter)

  const preparedProps = { width, height, refetchInterval, min, max, topN, formatValue, formatTimestamp, ...parsedProps }

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  const Graph = COMPONENTS[type]

  return (
    <>
      <Graph {...preparedProps} />
      {children}
    </>
  )
}
