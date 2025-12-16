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
  formatValue?: (v: number) => string | number
}

export type TMatrixToLineSingleProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseRangeProps

export type TMatrixToLineMultiProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseRangeProps

export type TMatrixToAreaSingleProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseRangeProps

export type TMatrixToAreaMultiProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseRangeProps

export type TMatrixToAreaStackedProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseRangeProps

export type TMatrixToReducedBarProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseRangeProps & TBaseModeProps

export type TMatrixToTableRowsProps = TBasePromQueryProps & TBaseRangeProps & TBaseTitleProps

export type TVectorToBarVerticalProps = TBaseContainerSizeProps & TBasePromQueryProps

export type TVectorToBarHorizontalProps = TBaseContainerSizeProps & TBasePromQueryProps

export type TVectorToPieProps = TBaseContainerSizeProps & TBasePromQueryProps

export type TVectorToTableRowsProps = TBasePromQueryProps & TBaseTitleProps

export type TVectorToBarGaugeProps = TBaseContainerSizeProps & TBasePromQueryProps & TBaseTitleProps & TBaseTopNProps

export type TVectorToGaugeRadialProps = TBaseContainerSizeProps &
  TBasePromQueryProps &
  TBaseTitleProps &
  TBaseMinMaxProps

export type TScalarToStatProps = TBasePromQueryProps & TBaseTitleProps & TBaseFormatterProps

export type TScalarToGaugeProps = TBasePromQueryProps & TBaseTitleProps & TBaseMinMaxProps & TBaseFormatterProps
