import { CSSProperties } from 'react'

type TBaseContainerSizeProps = {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
}

type TBasePromQueryProps = {
  baseUrl?: string
  query?: string
  refetchInterval?: number | false
}

type TBaseRangeProps = {
  range?: string
}

type TBaseTitleProps = {
  title?: string
}

type TBaseMinMaxProps = {
  min?: number
  max?: number
}

type TBaseModeProps = {
  mode?: 'last' | 'avg' | 'sum' | 'max' | 'min'
}

type TBaseTopNProps = {
  topN?: number
}

type TBaseFormatterProps = {
  /** optional formatter for value */
  formatValue?: (v: unknown) => string
  /** optional formatter for timestamp / date values */
  formatTimestamp?: (v: unknown) => string
}

export type TMatrixToLineSingleProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseRangeProps &
  TBaseFormatterProps

export type TMatrixToLineMultiProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseRangeProps &
  TBaseFormatterProps

export type TMatrixToAreaSingleProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseRangeProps &
  TBaseFormatterProps

export type TMatrixToAreaMultiProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseRangeProps &
  TBaseFormatterProps

export type TMatrixToAreaStackedProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseRangeProps &
  TBaseFormatterProps

export type TMatrixToReducedBarProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseRangeProps &
  TBaseModeProps &
  TBaseFormatterProps

export type TMatrixToTableRowsProps = TBasePromQueryProps & TBaseRangeProps & TBaseTitleProps & TBaseFormatterProps

export type TVectorToBarVerticalProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseFormatterProps

export type TVectorToBarHorizontalProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseFormatterProps

export type TVectorToPieProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseFormatterProps

export type TVectorToTableRowsProps = TBasePromQueryProps & TBaseTitleProps & TBaseFormatterProps

export type TVectorToBarGaugeProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseTitleProps &
  TBaseTopNProps &
  TBaseFormatterProps

export type TVectorToGaugeRadialProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseTitleProps &
  TBaseMinMaxProps &
  TBaseFormatterProps

export type TScalarToStatProps = TBasePromQueryProps & TBaseTitleProps & TBaseFormatterProps

export type TScalarToGaugeProps = TBasePromQueryProps & TBaseTitleProps & TBaseMinMaxProps & TBaseFormatterProps
